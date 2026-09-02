/**
 * Cheap, natural memory for one chat turn.
 *
 * Official store is TiDB. This module only decides *which* rows to show:
 * a 4-line person card, three memories that match this sentence, and a
 * skip-rule so greetings do not burn an extraction call.
 */

export const MEMORY_TURN_LIMIT = 3;

const PHATIC = new Set([
  "hi",
  "hello",
  "hey",
  "yo",
  "ok",
  "okay",
  "thanks",
  "thank you",
  "da",
  "nu",
  "yes",
  "no",
  "salut",
  "buna",
  "bună",
  "mersi",
  "good morning",
  "good night",
]);

export function encodeOfficialMemoryRef(
  memoryId: number,
  content: string
): string {
  return `[orielMemories:${memoryId}] ${content}`;
}

export function parseOfficialMemoryId(text: string): number | null {
  const match = /\[orielMemories:(\d+)\]/.exec(text);
  if (!match) return null;
  const id = Number(match[1]);
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

export function shouldExtractMemories(userMessage: string): boolean {
  const text = userMessage.trim();
  if (text.length < 16) return false;
  const collapsed = text
    .toLowerCase()
    .replace(/[.!?…,]+/g, "")
    .trim();
  return !PHATIC.has(collapsed);
}

export function mergeMemoriesForTurn<T extends { id: number }>(
  preferred: T[],
  fallback: T[],
  limit: number = MEMORY_TURN_LIMIT
): T[] {
  const seen = new Set<number>();
  const out: T[] = [];
  for (const memory of [...preferred, ...fallback]) {
    if (seen.has(memory.id)) continue;
    seen.add(memory.id);
    out.push(memory);
    if (out.length >= limit) break;
  }
  return out;
}

function formatDay(value: Date | string | null | undefined): string {
  if (!value) return "not recorded";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "not recorded";
  return date.toISOString().slice(0, 10);
}

export function formatPersonCard(input: {
  knownName?: string | null;
  journeyState?: string | null;
  interactionCount?: number | null;
  lastInteraction?: Date | string | null;
  lastSiteAct?: string | null;
}): string {
  const talks =
    input.interactionCount && input.interactionCount > 0
      ? ` (${input.interactionCount} talks)`
      : "";
  return [
    `Name: ${input.knownName?.trim() || "not yet known"}`,
    `Journey: ${input.journeyState?.trim() || "beginning"}`,
    `Last Oriel: ${formatDay(input.lastInteraction)}${talks}`,
    `On the site: ${input.lastSiteAct?.trim() || "chat only, so far"}`,
  ].join("\n");
}

export function formatRememberedNow(contents: string[]): string {
  if (contents.length === 0) {
    return "What I remember of you now: nothing stored for this turn. Do not invent personal history.";
  }
  return [
    "What I remember of you now. Speak from this as continuity. Do not name memory systems. If a fact is not here, do not invent it:",
    ...contents.map(content => `- ${content}`),
  ].join("\n");
}
