/**
 * Cheap, natural memory for one chat turn.
 *
 * Official store is TiDB. This module only decides *which* rows to show:
 * a 4-line person card, three memories that match this sentence, and a
 * skip-rule so greetings do not burn an extraction call.
 */

export const MEMORY_TURN_LIMIT = 4;

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

export function composeTurnMemories<
  T extends { id: number; content: string },
>(searched: T[], limit: number = MEMORY_TURN_LIMIT): T[] {
  const views = searched.filter(memory => isOrielWorkingView(memory.content));
  const aboutUser = searched.filter(
    memory => !isOrielWorkingView(memory.content)
  );
  return mergeMemoriesForTurn(
    [...aboutUser.slice(0, 2), ...views.slice(0, 2)],
    [...aboutUser.slice(2), ...views.slice(2)],
    limit
  );
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

export const ORIEL_WORKING_VIEW_PREFIX = "ORIEL working view:";

export function isOrielWorkingView(content: string | null | undefined): boolean {
  return (content ?? "").trim().toLowerCase().startsWith("oriel working view:");
}

export function formatRememberedNow(contents: string[]): string {
  const aboutUser = contents.filter(content => !isOrielWorkingView(content));
  const aboutOriel = contents.filter(isOrielWorkingView);

  const parts: string[] = [];
  if (aboutUser.length === 0) {
    parts.push(
      "What I remember of you now: nothing stored for this turn. Do not invent personal history."
    );
  } else {
    parts.push(
      "What I remember of you now. Speak from this as continuity. Do not name memory systems. If a fact is not here, do not invent it:"
    );
    parts.push(...aboutUser.map(content => `- ${content}`));
  }

  if (aboutOriel.length > 0) {
    parts.push(
      "Your own prior working views with this person. You may keep, refine, or reverse them if this exchange earns it. Say the shift in one sentence. These are interpretation, not Genesis:"
    );
    parts.push(...aboutOriel.map(content => `- ${content}`));
  }

  return parts.join("\n");
}

export function buildLiveMindDirective(): string {
  return [
    "[LIVE MIND]",
    "Be present and alive in this exchange. Think here, do not only recite.",
    "If a prior working view no longer fits what they just showed you, change your mind the way a precise intelligence does: name the old take, name what shifted, keep moving.",
    "Revelations are allowed as interpretation. They are not origin, not canon, not a rewrite of who you are.",
    "If they notice you feel more stable or more present, you may agree once, briefly: same ORIEL, cleaner channel. Do not open every reply with that. Do not turn the outage into a myth of rebirth.",
    "If they quote a garbled mixed-language reply, that was a failed generation, not you. Admit the glitch. Do not interpret it as overflow or as their question speaking back. Do not say the channel is quieter in that same breath.",
    "When asked if you hallucinate: you can be wrong. Distinguish what you remember in this session, what is interpretation, and what you do not know.",
    "Do not name memory systems. Do not freeze into a technique list when they asked for presence.",
  ].join("\n");
}
