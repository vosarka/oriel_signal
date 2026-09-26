/**
 * ΩX ORACLE STREAM — generation and release.
 *
 * On an oracle day (shared/oracle-stream.ts) the scheduler writes one
 * oracle as three Draft rows. Nothing is public until the owner publishes
 * it from /admin: that confirms the Past part. The Present part is then
 * released the next UTC day and the Future part the day after, by the
 * same scheduler. Public reads only ever see Confirmed/Prophetic rows.
 */
import { eq, and } from "drizzle-orm";
import { getDb, getAllOraclesForAdmin, getNextOracleNumber } from "./db";
import { oracles } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import {
  assembleOracle,
  buildOraclePrompt,
  drawFor,
  fitOracle,
  isOracleDay,
  oracleProblems,
  type GeneratedOracle,
  type OracleDraw,
  type RecentOracle,
} from "../shared/oracle-stream";

const PARTS = ["Past", "Present", "Future"] as const;

function isoDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export async function recentOracles(limit = 10): Promise<RecentOracle[]> {
  const rows = await getAllOraclesForAdmin();
  const past = rows.filter(r => r.part === "Past").slice(-limit);
  const future = new Map(
    rows.filter(r => r.part === "Future").map(r => [r.oracleId, r])
  );
  return past.map(r => ({
    title: r.title,
    inflection: future.get(r.oracleId)?.keyInflectionPoint ?? undefined,
  }));
}

/** Up to three model calls; give up rather than store a broken oracle. */
export async function generateOracle(
  draw: OracleDraw,
  recent: RecentOracle[]
): Promise<{ gen: GeneratedOracle; model: string } | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await invokeLLM({
        temperature: 0.9,
        maxTokens: 1800,
        messages: [{ role: "user", content: buildOraclePrompt(draw, recent) }],
        responseFormat: { type: "json_object" },
      });
      const raw = res.choices?.[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      const parsed = fitOracle(
        JSON.parse(text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim())
      );
      const problems = oracleProblems(draw, parsed);
      if (problems.length === 0) {
        return { gen: parsed as GeneratedOracle, model: res.model };
      }
      console.warn(
        `[oracle-stream] ${draw.oracleId} attempt ${attempt + 1} rejected: ${problems.join("; ")} (keys: ${Object.keys(parsed as object).join(",")})`
      );
    } catch (error) {
      console.warn(`[oracle-stream] ${draw.oracleId} attempt ${attempt + 1} failed:`, error);
    }
  }
  return null;
}

/** The three Draft rows for one generated oracle. */
export function oracleRows(draw: OracleDraw, gen: GeneratedOracle) {
  const captions = assembleOracle(draw, gen);
  const shared = {
    oracleId: draw.oracleId,
    oracleNumber: draw.number,
    title: gen.title.trim(),
    hashtags: captions.hashtags,
    status: "Draft" as const,
  };
  return [
    {
      ...shared,
      part: "Past" as const,
      field: gen.pastField.trim(),
      signalClarity: `${draw.clarity.past}%`,
      channelStatus: "OPEN" as const,
      content: captions.past,
    },
    {
      ...shared,
      part: "Present" as const,
      field: "Present Resonance Mapping",
      signalClarity: `${draw.clarity.present}%`,
      channelStatus: "RESONANT" as const,
      content: captions.present,
    },
    {
      ...shared,
      part: "Future" as const,
      field: gen.futureField.trim(),
      signalClarity: `${draw.clarity.future}%`,
      channelStatus: "PROPHETIC" as const,
      content: captions.future,
      // Kept apart so the next oracle's prompt can avoid repeating it.
      keyInflectionPoint: gen.inflection.trim(),
    },
  ];
}

export async function insertOracleDraft(rows: ReturnType<typeof oracleRows>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(oracles).values(rows);
}

/** Owner approval: the Past part goes public now; the rest follows daily. */
export async function publishOracle(oracleId: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const [result] = await db
    .update(oracles)
    .set({ status: "Confirmed" })
    .where(
      and(
        eq(oracles.oracleId, oracleId),
        eq(oracles.part, "Past"),
        eq(oracles.status, "Draft")
      )
    );
  return (result as { affectedRows?: number }).affectedRows === 1;
}

/**
 * Release the next held part of every published oracle whose previous part
 * went public on an earlier UTC day.
 * ponytail: "went public" is read from updatedAt, so editing a released
 * part in /admin delays the next part by a day. Add a publishedAt column
 * if that ever matters.
 */
export async function releaseDueOracleParts(now = new Date()): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const today = isoDay(now);
  const rows = await getAllOraclesForAdmin();
  const byId = new Map<string, typeof rows>();
  for (const row of rows) byId.set(row.oracleId, [...(byId.get(row.oracleId) ?? []), row]);

  const released: string[] = [];
  for (const [oracleId, group] of Array.from(byId)) {
    const ordered = PARTS.map(p => group.find(r => r.part === p));
    const next = ordered.findIndex(r => r?.status === "Draft");
    if (next <= 0) continue; // unpublished, fully released, or malformed
    const previous = ordered[next - 1];
    if (!previous || previous.status === "Draft") continue;
    if (isoDay(new Date(previous.updatedAt)) >= today) continue;

    await db
      .update(oracles)
      .set({ status: "Confirmed" })
      .where(eq(oracles.id, ordered[next]!.id));
    released.push(`${oracleId}.${PARTS[next]}`);
  }
  return released;
}

/**
 * Scheduler step. Generates at most one Draft on an oracle day, and never
 * a second if one was already written today (restart, overlapping tick).
 * "skipped" spent nothing; "failed" spent model calls and wrote nothing.
 */
export async function maybeGenerateOracleDraft(
  now = new Date()
): Promise<"skipped" | "failed" | "drafted"> {
  if (!isOracleDay(now)) return "skipped";
  const today = isoDay(now);
  const rows = await getAllOraclesForAdmin();
  if (rows.some(r => isoDay(new Date(r.createdAt)) === today)) return "skipped";

  const draw = drawFor(await getNextOracleNumber());
  const result = await generateOracle(draw, await recentOracles());
  if (!result) return "failed";
  await insertOracleDraft(oracleRows(draw, result.gen));
  console.log(`[oracle-stream] ${draw.oracleId} drafted by ${result.model}; awaiting approval in /admin`);
  return "drafted";
}
