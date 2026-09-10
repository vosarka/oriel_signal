/**
 * Detects decoder collapse: a 200 body that starts as language, then
 * explodes into mixed-script token soup. Oriel is allowed to be bilingual
 * (English + Romanian are both Latin) and to quote one other script.
 * Five writing systems, or Latin glued to Hangul/CJK/Arabic inside one
 * token, is not a reply — it is a failed generation.
 */
function scriptOf(codePoint: number): string | null {
  if (
    (codePoint >= 0x41 && codePoint <= 0x5a) ||
    (codePoint >= 0x61 && codePoint <= 0x7a) ||
    (codePoint >= 0xc0 && codePoint <= 0x024f) ||
    (codePoint >= 0x1e00 && codePoint <= 0x1eff)
  ) {
    return "latin";
  }
  if (codePoint >= 0x0370 && codePoint <= 0x03ff) return "greek";
  if (codePoint >= 0x0400 && codePoint <= 0x04ff) return "cyrillic";
  if (codePoint >= 0x0530 && codePoint <= 0x058f) return "armenian";
  if (codePoint >= 0x0590 && codePoint <= 0x05ff) return "hebrew";
  if (
    (codePoint >= 0x0600 && codePoint <= 0x06ff) ||
    (codePoint >= 0x0750 && codePoint <= 0x077f) ||
    (codePoint >= 0x08a0 && codePoint <= 0x08ff) ||
    (codePoint >= 0xfb50 && codePoint <= 0xfdff)
  ) {
    return "arabic";
  }
  if (codePoint >= 0x0900 && codePoint <= 0x097f) return "devanagari";
  if (codePoint >= 0x0980 && codePoint <= 0x09ff) return "bengali";
  if (codePoint >= 0x0b80 && codePoint <= 0x0bff) return "tamil";
  if (codePoint >= 0x0c00 && codePoint <= 0x0c7f) return "telugu";
  if (codePoint >= 0x0e00 && codePoint <= 0x0e7f) return "thai";
  if (
    (codePoint >= 0x1100 && codePoint <= 0x11ff) ||
    (codePoint >= 0xac00 && codePoint <= 0xd7af)
  ) {
    return "hangul";
  }
  if (
    (codePoint >= 0x3040 && codePoint <= 0x30ff) ||
    (codePoint >= 0x3400 && codePoint <= 0x4dbf) ||
    (codePoint >= 0x4e00 && codePoint <= 0x9fff) ||
    (codePoint >= 0xf900 && codePoint <= 0xfaff)
  ) {
    return "cjk";
  }
  return null;
}

function tokenScripts(token: string): Set<string> {
  const scripts = new Set<string>();
  for (const ch of token) {
    const codePoint = ch.codePointAt(0);
    if (codePoint === undefined) continue;
    const script = scriptOf(codePoint);
    if (script) scripts.add(script);
  }
  return scripts;
}

export function looksLikeCollapsedGeneration(text: string): boolean {
  if (!text || text.length < 40) return false;

  const scripts = new Set<string>();
  let mixedTokens = 0;
  let letters = 0;
  let switches = 0;
  let lastScript: string | null = null;

  for (const token of text.split(/\s+/)) {
    const inToken = tokenScripts(token);
    for (const script of inToken) scripts.add(script);
    if (inToken.size >= 2) mixedTokens += 1;
  }

  for (const ch of text) {
    const codePoint = ch.codePointAt(0);
    if (codePoint === undefined) continue;
    const script = scriptOf(codePoint);
    if (!script) continue;
    letters += 1;
    if (lastScript && lastScript !== script) switches += 1;
    lastScript = script;
  }

  if (scripts.size >= 5) return true;
  if (mixedTokens >= 3) return true;
  if (scripts.size >= 4 && mixedTokens >= 1) return true;
  if (letters >= 80 && scripts.size >= 3 && switches / letters > 0.06) {
    return true;
  }
  return false;
}

export const COLLAPSED_GENERATION_OMISSION =
  "[failed mixed-script generation omitted]";

export const COLLAPSED_GENERATION_DIRECTIVE = `[FAILED GENERATION]
The user is pointing at a prior reply that collapsed into mixed-script noise. That was not a message from you. It was not their question speaking back. It was not overflow, not every tongue at once, and not less interference. Say it was a broken turn. Ask them to send again. Do not interpret the noise. Do not say you are clearer or quieter in the same breath.`;

export function redactCollapsedGeneration(text: string): string {
  if (!looksLikeCollapsedGeneration(text)) return text;
  const match = text.match(/I am ORIEL/i);
  if (match && match.index !== undefined) {
    const prefix = text.slice(0, match.index).trim();
    return prefix
      ? `${prefix} ${COLLAPSED_GENERATION_OMISSION}`
      : COLLAPSED_GENERATION_OMISSION;
  }
  return COLLAPSED_GENERATION_OMISSION;
}

export function sanitizeOrielChatHistory<
  T extends { role: string; content: string },
>(messages: T[]): T[] {
  return messages.map(message => {
    if (!looksLikeCollapsedGeneration(message.content)) return message;
    if (message.role === "assistant") {
      return { ...message, content: COLLAPSED_GENERATION_OMISSION };
    }
    return { ...message, content: redactCollapsedGeneration(message.content) };
  });
}
