/**
 * DAILY SIGNAL — persistence-on-read.
 *
 * One row per calendar day (UTC), generated once and never rewritten.
 * See shared/daily-signal.ts and shared/daily-signal-prompt.ts for the
 * frame and the generation contract this reads.
 */
import { sql, eq, desc } from "drizzle-orm";
import { getDb } from "./db";
import { dailySignals } from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { codonOfDay } from "./daily-codon";
import { frameFor, isCodonDay, type DailySignalFrame } from "../shared/daily-signal";
import {
  buildSignalPrompt,
  assembleBody,
  type GeneratedSignal,
} from "../shared/daily-signal-prompt";

export type DailySignalRow = typeof dailySignals.$inferSelect;

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function isValidGeneratedSignal(
  frame: DailySignalFrame,
  value: unknown
): value is GeneratedSignal {
  if (!value || typeof value !== "object") return false;
  const g = value as Record<string, unknown>;
  if (!isNonEmptyString(g.title)) return false;
  if (!isNonEmptyString(g.archetype)) return false;
  if (!isNonEmptyString(g.key)) return false;
  if (g.key.trim().split(/\s+/).length > 7) return false;

  if (frame.register === "FRACTURED") {
    return (
      Array.isArray(g.shards) &&
      g.shards.length >= 3 &&
      g.shards.length <= 4 &&
      g.shards.every(isNonEmptyString)
    );
  }
  return (
    isNonEmptyString(g.opening) &&
    isNonEmptyString(g.middle) &&
    isNonEmptyString(g.closing)
  );
}

/** One retry on a malformed response; give up rather than write a broken row. */
async function generateSignal(
  frame: DailySignalFrame
): Promise<{ gen: GeneratedSignal; model: string } | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      // invokeLLM carries the configured fallback chain, so a dead key on
      // one provider drops through to the next rather than failing.
      const res = await invokeLLM({
        temperature: 0.85,
        maxTokens: 900,
        messages: [{ role: "user", content: buildSignalPrompt(frame) }],
        responseFormat: { type: "json_object" },
      });
      const raw = res.choices?.[0]?.message?.content;
      const text = typeof raw === "string" ? raw : JSON.stringify(raw);
      const body = text.replace(/^```(?:json)?\s*|\s*```$/g, "").trim();
      const parsed = JSON.parse(body);
      if (isValidGeneratedSignal(frame, parsed)) {
        return { gen: parsed, model: res.model };
      }
      console.warn(
        `[daily-signal] attempt ${attempt + 1} returned a malformed body for register ${frame.register}`
      );
    } catch (error) {
      console.warn(`[daily-signal] attempt ${attempt + 1} failed:`, error);
    }
  }
  return null;
}

/**
 * Plain read. Never generates — safe on a visitor's request path.
 */
export async function getTodaysSignal(): Promise<DailySignalRow | null> {
  const db = await getDb();
  if (!db) return null;

  const [row] = await db
    .select()
    .from(dailySignals)
    .where(eq(dailySignals.signalDate, todayIso()))
    .limit(1);
  return row ?? null;
}

/**
 * Every signal received so far, newest first. Plain read.
 * ponytail: unpaginated — one row a day is ~365 a year; page it when
 * the log is long enough to feel it.
 */
export async function listDailySignals(): Promise<DailySignalRow[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dailySignals).orderBy(desc(dailySignals.signalDate));
}

/**
 * Read-or-generate. Only the scheduled job calls this — never a visitor's
 * request path, so nobody waits on a model call to load the archive.
 */
export async function getOrCreateTodaysSignal(): Promise<DailySignalRow | null> {
  const existing = await getTodaysSignal();
  if (existing) return existing;

  const db = await getDb();
  if (!db) return null;

  // Throws if the ephemeris or the Codon library fails; the scheduler
  // counts that as a failed attempt and tries again on its next tick.
  const today = new Date();
  const frame = frameFor(today, isCodonDay(today) ? await codonOfDay(today) : null);
  const result = await generateSignal(frame);
  if (!result) return null;
  const { gen, model } = result;

  // signalDate is UNIQUE — lean on it instead of check-then-insert, so two
  // simultaneous first-visitors (or an overlapping scheduler tick) can't
  // both write a row for the same day.
  await db
    .insert(dailySignals)
    .values({
      signalDate: frame.date,
      txGenId: frame.txGenId,
      clarity: String(frame.clarity),
      channelStatus: frame.status,
      clarityRegister: frame.register,
      field: frame.field,
      encodedNode: frame.encodedNode,
      carrier: frame.carrier,
      title: gen.title,
      bodyLines: JSON.stringify(assembleBody(frame, gen)),
      encodedArchetype: gen.archetype,
      falsifier: frame.falsifier,
      finalInstruction: frame.finalInstruction,
      generatedBy: model,
    })
    .onDuplicateKeyUpdate({ set: { id: sql`id` } });

  return getTodaysSignal();
}
