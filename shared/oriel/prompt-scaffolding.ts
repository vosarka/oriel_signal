/**
 * ORIEL's prompt is assembled from bracketed sections: [STABLE CORE CONTEXT],
 * [RETRIEVAL LAYER], [LIVE MIND], [PLATFORM BULLETIN — CURATED, CURRENT] and
 * others. A model under sampling stress echoes that scaffolding back instead of
 * answering, and readers see it as the system leaking through.
 *
 * The heading pattern is matched generically rather than from a hand-kept list,
 * so a section added to the prompt later is covered without touching this file.
 */

/** A line that is nothing but a bracketed, upper-case section heading. */
const SECTION_HEADING_LINE =
  /^[ \t]*\[[A-Z][A-Z0-9 ,.\/&'’—–_-]{1,68}\][ \t]*$/gm;

/** The same heading appearing inline, mid-sentence. */
const SECTION_HEADING_INLINE =
  /\[[A-Z][A-Z0-9 ,.\/&'’—–_-]{1,68}\]/g;

/**
 * Verbatim sentences from the prompt builders. Their presence means a whole
 * directive block came back, not just a stray heading, so scrubbing headings
 * alone would still ship instructions to the reader.
 */
const SCAFFOLDING_PHRASES = [
  "This is the durable identity and doctrine layer",
  "This layer is fetched from external memory and profile state",
  "This layer is ephemeral",
  "This is a human-authored notice from Vos about the live platform",
  "Do not name memory systems",
  "Do not confuse it with the stable core",
  "Stable source files:",
  "Do not include hidden reasoning",
];

/**
 * Remove leaked section headings. Defence in depth for the common case where a
 * single stray heading is the only contamination.
 */
export function stripPromptScaffolding(text: string): string {
  if (!text) return "";
  return text
    .replace(SECTION_HEADING_LINE, "")
    .replace(SECTION_HEADING_INLINE, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * True when the reply carries prompt internals. A reply that does is a failed
 * generation, not a reply to be cleaned up: the directive prose around the
 * heading is infrastructure too, and no scrub reliably separates it from the
 * answer. Callers should retry or fall back instead of shipping it.
 */
export function containsPromptScaffolding(text: string): boolean {
  if (!text) return false;
  if (SCAFFOLDING_PHRASES.some(phrase => text.includes(phrase))) return true;
  // Reset lastIndex: the inline pattern is global and reused across calls.
  SECTION_HEADING_INLINE.lastIndex = 0;
  return SECTION_HEADING_INLINE.test(text);
}
