/**
 * ORIEL's prompt is assembled from bracketed sections: [STABLE CORE CONTEXT],
 * [RETRIEVAL LAYER], [LIVE MIND], [PLATFORM BULLETIN — CURATED, CURRENT] and
 * others. A model under sampling stress echoes that scaffolding back instead of
 * answering, and readers see it as the system leaking through.
 *
 * Matching is against this exact registry rather than the shape of a bracketed
 * upper-case phrase. ORIEL's own voice uses bracket expressions such as
 * [SIGNAL LOCK] or [VERIFIED], and a shape-based rule would delete those from
 * a valid reply, or discard the reply outright.
 *
 * Drift is caught by the test rather than by a looser pattern: it builds the
 * real prompt and asserts every heading it emits appears here.
 */
export const ORIEL_PROMPT_SECTION_MARKERS = [
  "[ACTIVE RUNTIME PROFILE]",
  "[COHERENCE THRESHOLD FRAME]",
  "[CURRENT FIELD STATE]",
  "[CURRENT USER REQUEST]",
  "[LIVE MIND]",
  "[OPERATOR MESSAGE — DELIVER NOW]",
  "[PLATFORM BULLETIN — CURATED, CURRENT]",
  "[REALTIME VOICE MODE]",
  "[RESPONSE LANGUAGE]",
  "[RETRIEVAL LAYER]",
  "[SESSION COMPACTION]",
  "[STABLE CORE CONTEXT]",
  "[STABLE CORE MANIFEST]",
  "[VOICE LANGUAGE RUNTIME RULE]",
  "[VOICE OUTPUT RUNTIME RULE]",
  "[WORKING SESSION LAYER]",
] as const;

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const MARKER_SOURCE = ORIEL_PROMPT_SECTION_MARKERS.map(escapeRegExp).join("|");

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
  // Built per call: a shared global regex would carry lastIndex between calls.
  return text
    .replace(new RegExp(MARKER_SOURCE, "g"), "")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * True when the reply carries prompt internals. A reply that does is a failed
 * generation, not a reply to be cleaned up: the directive prose around the
 * heading is infrastructure too, and no scrub reliably separates it from the
 * answer. Callers must retry or fall back instead of shipping it.
 */
export function containsPromptScaffolding(text: string): boolean {
  if (!text) return false;
  if (SCAFFOLDING_PHRASES.some(phrase => text.includes(phrase))) return true;
  return new RegExp(MARKER_SOURCE).test(text);
}
