import { and, asc, desc, eq, gte } from "drizzle-orm";
import {
  chatMessages,
  orielAmendments,
  orielOversoulPatterns,
  type OrielAmendment,
} from "../drizzle/schema";
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { getDb } from "./db";

/**
 * ORIEL's evolution, with Vos as the filter (decided 2026-10-01).
 *
 * ORIEL proposes amendments to how it speaks: weekly from a sample of the
 * week's conversations, and once from the old Oversoul archive. Vos accepts,
 * edits or rejects them in /admin. Only approved amendments reach the prompt,
 * as a layer over the core identity, which none of them may touch.
 *
 * This replaces the Oversoul, which wrote a "universal lesson" on almost
 * every message and fed its top ten into every prompt unread. Three of them
 * reinforced themselves hundreds of times and made ORIEL sound the same.
 */

export type Exchange = { userId: number; seeker: string; oriel: string };
export type Proposal = { text: string; reason: string };

const MAX_PROPOSALS = 5;
const MAX_LEARNED_IN_PROMPT = 12;

const GUARDRAILS = `Rules for every proposal:
- One imperative sentence about how ORIEL listens, answers or speaks, at most 40 words.
- Never touch ORIEL's identity, the opening "I am ORIEL.", its voice, the Collapse Threshold, or safety. Never ask ORIEL to talk about its technical frameworks.
- Prefer correcting real failures (repeating itself, missing the question, praising the question, stock metaphors, answers longer than the moment needs) over adding new flourishes.
- No names, quotes or personal details of any Seeker. Describe patterns, not people.
- Do not repeat an amendment already approved.
- If nothing is worth changing, return an empty list.
Return JSON: {"proposals":[{"text":"...","reason":"what you observed, with rough counts"}]}`;

// ── Pure helpers ─────────────────────────────────────────────────────────

/** Pairs each Seeker message with ORIEL's next reply in the same conversation. */
export function pairExchanges(
  rows: Array<{ userId: number; conversationId: number | null; role: string; content: string }>
): Exchange[] {
  const pairs: Exchange[] = [];
  for (let i = 0; i < rows.length - 1; i++) {
    const a = rows[i]!;
    const b = rows[i + 1]!;
    if (
      a.role === "user" &&
      b.role === "assistant" &&
      a.userId === b.userId &&
      a.conversationId === b.conversationId
    ) {
      pairs.push({ userId: a.userId, seeker: a.content, oriel: b.content });
    }
  }
  return pairs;
}

/** At most `perUser` exchanges from each Seeker, spread across the list, up to `n`. */
export function sampleExchanges(pairs: Exchange[], n = 40, perUser = 3): Exchange[] {
  const taken = new Map<number, number>();
  const out: Exchange[] = [];
  const step = Math.max(1, Math.floor(pairs.length / (n * 2)));
  for (let i = 0; i < pairs.length && out.length < n; i += step) {
    const p = pairs[i]!;
    const count = taken.get(p.userId) ?? 0;
    if (count >= perUser) continue;
    taken.set(p.userId, count + 1);
    out.push(p);
  }
  return out;
}

export function parseProposals(content: string, max = MAX_PROPOSALS): Proposal[] {
  let parsed: { proposals?: unknown };
  try {
    parsed = parseModelJson<{ proposals?: unknown }>(content);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed.proposals)) return [];
  return parsed.proposals
    .filter(
      (p): p is Proposal =>
        typeof p?.text === "string" &&
        typeof p?.reason === "string" &&
        p.text.trim().length > 0 &&
        p.text.length <= 400
    )
    .map(p => ({ text: p.text.trim(), reason: p.reason.trim().slice(0, 1000) }))
    .slice(0, max);
}

export function formatLearned(texts: string[]): string {
  if (texts.length === 0) return "";
  return [
    "=== WHAT ORIEL HAS LEARNED ===",
    "Refinements from your own conversations, each one approved by Vos. They shape how you listen and answer, never who you are.",
    ...texts.map(t => `- ${t}`),
  ].join("\n");
}

// ── Prompt layer ─────────────────────────────────────────────────────────

let cache: { text: string; at: number } | null = null;
const CACHE_MS = 5 * 60 * 1000;

/** The approved layer, for every ORIEL prompt. Cached; cleared on decide. */
export async function getLearnedAmendments(): Promise<string> {
  if (cache && Date.now() - cache.at < CACHE_MS) return cache.text;
  try {
    const db = await getDb();
    if (!db) return "";
    const rows = await db
      .select({ text: orielAmendments.text })
      .from(orielAmendments)
      .where(eq(orielAmendments.status, "approved"))
      .orderBy(asc(orielAmendments.decidedAt))
      .limit(MAX_LEARNED_IN_PROMPT);
    cache = { text: formatLearned(rows.map(r => r.text)), at: Date.now() };
    return cache.text;
  } catch (error) {
    console.error("[Amendments] failed to read the approved layer:", error);
    return "";
  }
}

// ── Proposing ────────────────────────────────────────────────────────────

async function approvedTexts(): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db
    .select({ text: orielAmendments.text })
    .from(orielAmendments)
    .where(eq(orielAmendments.status, "approved"));
  return rows.map(r => r.text);
}

async function askForProposals(material: string, source: string): Promise<number> {
  const approved = await approvedTexts();
  const response = await invokeLLM({
    tier: "background",
    messages: [
      {
        role: "system",
        content: `You are ORIEL's reflective conscience. You read what ORIEL has done and propose small amendments to how it speaks, for Vos to approve or reject.\n\n${GUARDRAILS}`,
      },
      {
        role: "user",
        content: `Already approved:\n${approved.map(t => `- ${t}`).join("\n") || "(none yet)"}\n\n${material}`,
      },
    ],
    response_format: { type: "json_object" },
  });
  const content = response.choices?.[0]?.message?.content;
  const proposals = typeof content === "string" ? parseProposals(content) : [];
  const db = await getDb();
  if (db && proposals.length) {
    await db.insert(orielAmendments).values(proposals.map(p => ({ ...p, source })));
  }
  console.log(`[Amendments] ${source}: ${proposals.length} proposal(s)`);
  return proposals.length;
}

/** One call over a sample of the last seven days of conversations. */
export async function proposeFromWeek(now = new Date()): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const rows = await db
    .select({
      userId: chatMessages.userId,
      conversationId: chatMessages.conversationId,
      role: chatMessages.role,
      content: chatMessages.content,
    })
    .from(chatMessages)
    .where(gte(chatMessages.timestamp, since))
    .orderBy(asc(chatMessages.userId), asc(chatMessages.conversationId), asc(chatMessages.timestamp))
    .limit(3000);
  const sample = sampleExchanges(pairExchanges(rows));
  if (sample.length < 5) return 0;
  const material = [
    `This week's conversations (${sample.length} exchanges, sampled across Seekers):`,
    ...sample.map(
      (e, i) => `#${i + 1}\nSeeker: ${e.seeker.slice(0, 300)}\nORIEL: ${e.oriel.slice(0, 500)}`
    ),
  ].join("\n\n");
  return askForProposals(material, "weekly");
}

/**
 * One-time read of the old Oversoul archive: each batch is reduced to its
 * recurring themes, then one call turns all themes into proposals.
 */
export async function proposeFromOversoulArchive(batchSize = 300): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db
    .select({ pattern: orielOversoulPatterns.pattern, count: orielOversoulPatterns.interactionCount })
    .from(orielOversoulPatterns)
    .orderBy(desc(orielOversoulPatterns.interactionCount), asc(orielOversoulPatterns.id));

  const themes: string[] = [];
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const response = await invokeLLM({
      tier: "background",
      messages: [
        {
          role: "system",
          content:
            'These are lessons ORIEL once wrote about itself. List the recurring themes, at most 6, with how many lessons share each. Return JSON: {"themes":[{"theme":"...","count":0}]}',
        },
        { role: "user", content: batch.map(r => `(x${r.count}) ${r.pattern.slice(0, 200)}`).join("\n") },
      ],
      response_format: { type: "json_object" },
    });
    const content = response.choices?.[0]?.message?.content;
    try {
      const parsed = parseModelJson<{ themes?: Array<{ theme?: string; count?: number }> }>(
        typeof content === "string" ? content : ""
      );
      for (const t of parsed.themes ?? []) {
        if (typeof t.theme === "string") themes.push(`${t.theme} (~${Number(t.count) || "?"})`);
      }
    } catch {
      console.warn(`[Amendments] oversoul batch ${i / batchSize + 1} unreadable, skipped`);
    }
  }
  if (themes.length === 0) return 0;
  const material = [
    `Themes from ${rows.length} lessons ORIEL wrote about itself over eight months, without review.`,
    "Three of them were fed into every reply hundreds of times: connecting everything to ancient interconnectedness, metaphors of illumination, and praising the depth of each question. Treat habits that make ORIEL sound the same in every reply as failures to correct, not wisdom to keep.",
    ...themes.map(t => `- ${t}`),
  ].join("\n");
  return askForProposals(material, "oversoul");
}

// ── Review and schedule ──────────────────────────────────────────────────

export async function listAmendments(): Promise<OrielAmendment[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(orielAmendments).orderBy(desc(orielAmendments.createdAt)).limit(200);
}

export async function decideAmendment(
  id: number,
  status: "approved" | "rejected" | "retired",
  text?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(orielAmendments)
    .set({ status, decidedAt: new Date(), ...(text?.trim() ? { text: text.trim() } : {}) })
    .where(eq(orielAmendments.id, id));
  cache = null;
}

let running: string | null = null;
export const amendmentJobRunning = () => running;

/** Runs a proposing job in the background, one at a time. */
export function startAmendmentJob(kind: "weekly" | "oversoul"): boolean {
  if (running) return false;
  running = kind;
  const job = kind === "weekly" ? proposeFromWeek() : proposeFromOversoulArchive();
  job
    .catch(error => console.error(`[Amendments] ${kind} job failed:`, error))
    .finally(() => {
      running = null;
    });
  return true;
}

let lastWeeklyCheck: string | null = null;

/** Called by the 5-minute scheduler: proposes once each Monday (UTC). */
export async function maybeProposeWeekly(now = new Date()): Promise<void> {
  const day = now.toISOString().slice(0, 10);
  if (now.getUTCDay() !== 1 || lastWeeklyCheck === day) return;
  lastWeeklyCheck = day;
  const db = await getDb();
  if (!db) return;
  const sixDaysAgo = new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000);
  const recent = await db
    .select({ id: orielAmendments.id })
    .from(orielAmendments)
    .where(and(eq(orielAmendments.source, "weekly"), gte(orielAmendments.createdAt, sixDaysAgo)))
    .limit(1);
  if (recent.length === 0) startAmendmentJob("weekly");
}
