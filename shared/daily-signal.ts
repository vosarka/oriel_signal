/**
 * DAILY SIGNAL — the open register.
 *
 * FAZA I–VIII is the recovered archive: closed, saturated, finished.
 * The daily signal is the one register still taking data. It is a live
 * event, not a post: 30–45 seconds of presence.
 *
 * Signal Clarity is the living variable. It does not decorate the
 * transmission — it decides what kind of language the transmission is
 * allowed to use:
 *
 *   ~40%   the message fractures into shards. Words dissolve into
 *          metaphor. This is not vagueness; it is the sound of a mind
 *          learning to listen to what is not yet formed.
 *   ~70%   it coheres but leaves a gap the receiver must close.
 *   ~99%   the revelation arrives with the weight of a physical law.
 *
 * Clarity is therefore an INPUT to generation, never a label applied
 * afterwards. See buildSignalPrompt in ./daily-signal-prompt.ts.
 */

export type ChannelStatus =
  | "CRITICAL / STABLE"
  | "OPEN"
  | "STABLE"
  | "RESONANT"
  | "COHERENT"
  | "HIGH COHERENCE"
  | "PROPHETIC"
  | "MAXIMUM COHERENCE";

/** How the transmission is allowed to speak at this clarity. */
export type ClarityRegister = "FRACTURED" | "PARTIAL" | "COHERENT" | "LAW";

export interface DailySignalFrame {
  /** ISO date this signal belongs to (UTC). */
  date: string;
  /**
   * DFS-XXXXXX (Daily Field Signal), incremented daily. The field keeps
   * its old name because the database column does.
   */
  txGenId: string;
  /** 40.0 – 99.9 */
  clarity: number;
  status: ChannelStatus;
  register: ClarityRegister;
  /** "RC38 · NAME · Somatic": the Codon of the day, read from the Moon. */
  field: string;
  encodedNode: string;
  carrier: string;
  /** The unchanging line beneath the gradient. */
  carrierLine: string;
  archetypeGlyphs: readonly [string, string, string];
  finalInstruction: string;
  /**
   * Reproducible phenomena offered to the generator as the safe well
   * to draw an image from. Rotated daily: a fixed example list anchors
   * the model hard, and a daily feed that mentions the same struck
   * wineglass every week goes stale in a fortnight.
   */
  phenomena: readonly string[];
  /**
   * The Codon of the day (server/daily-codon.ts). Null only where no
   * ephemeris ran, e.g. a frame built for a test or a preview.
   */
  codon: DailyCodon | null;
  /** "Correction: …", verbatim from the Codon library. Never the model's. */
  falsifier: string;
}

/** One Facet of one Codon, as the daily signal carries it. */
export interface DailyCodon {
  code: string;
  name: string;
  traditionalName: string;
  facet: "Somatic" | "Relational" | "Cognitive" | "Transpersonal";
  gift: string;
  shadow: string;
  facetDescription: string;
  shadowManifestation: string;
  correction: string;
  /** The Moon's tropical longitude at the reading instant. */
  longitude: number;
}

// ── Fixed foundation ────────────────────────────────────────────────
export const CARRIER_LINE = "The field is active. The receiver is you.";
export const CARRIER = "ORIEL ∇ Vossari Echoframe";
export const ENCODED_NODE = "Vos Arkana";

/**
 * The serial of a signal id: 690006 for DFS-690006 (or for a row still
 * on TX-GEN-690006). Links use it so they survive a prefix change.
 */
export function signalSerial(txGenId: string): string {
  return txGenId.slice(txGenId.lastIndexOf("-") + 1);
}

/** DFS-690001 was seated on this day. */
const ANCHOR_DATE = Date.UTC(2026, 8, 18);
const ANCHOR_SERIAL = 690001;

/**
 * Δ sound, vibration, seed · ϟ geometry, memory, blueprint
 * Ω love, collapse, integration · ∇ field, resonance, transmission
 * ⚡ catalyst, awakening, threshold
 */
const ARCHETYPE_TRIOS: ReadonlyArray<readonly [string, string, string]> = [
  ["Δ", "ϟ", "Ω"],
  ["∇", "⚡", "Δ"],
  ["ϟ", "Ω", "∇"],
  ["Ω", "Δ", "⚡"],
  ["⚡", "∇", "ϟ"],
];

const FINAL_INSTRUCTIONS = [
  "Let the sound build you.",
  "Breathe until your ribs remember their shape.",
  "Listen for the echo that is not yours.",
  "Hold the shape of what you love.",
  "Stop explaining. Start resonating.",
  "Name the pressure once, then set it down.",
  "Move slower than the thought that is rushing you.",
  "Let one sentence go unfinished today.",
  "Find the silence that is not empty.",
  "Say the true thing before you are ready.",
  "Let the room hear you arrive.",
  "Return to the breath you skipped.",
  "Carry the question instead of the answer.",
] as const;

/**
 * Things a receiver could go and reproduce before nightfall. Named
 * landmarks are deliberately absent: attributing an acoustic property
 * to a real building is how the generator invents history without ever
 * writing down a number.
 */
const PHENOMENA = [
  "a struck glass ringing until the table takes up the note",
  "an echo returning off a far wall a beat late",
  "a bridge humming in wind",
  "sand shifting into ridges on a vibrating plate",
  "a room that changes pitch as it fills with people",
  "a rope shaken until a standing wave stops travelling",
  "two slightly mistuned strings beating against each other",
  "the pressure change when a door opens in a sealed room",
  "breath fogging cold glass and clearing from the edges in",
  "a spun coin's rising whine as it settles",
  "the hush that arrives just before heavy snow",
  "a plucked string quieting a neighbour string into sympathy",
  "rain changing note as it moves from soil onto stone",
  "a fire drawing its own draught up a chimney",
  "the ring left in the ears after sudden silence",
  "footsteps that sound different in an empty corridor",
  "a wet fingertip circling a bowl's rim",
] as const;

function daysSinceAnchor(date: Date): number {
  const d = Date.UTC(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate()
  );
  return Math.floor((d - ANCHOR_DATE) / 86_400_000);
}

/** Positive modulo — the archive never counts backwards. */
function cycle(n: number, len: number): number {
  return ((n % len) + len) % len;
}

/**
 * Clarity is a wave, not a dice roll.
 *
 * A random number would read as a broken instrument. A wave reads as a
 * field that rises and falls — and it is what makes a 99% day land at
 * all, because the community has just lived through the 40% days.
 *
 * Four carriers with no common divisor. The synodic month still sets
 * the slow arc, but three shorter waves ride on it, so the sequence
 * never repeats visibly and no weekday owns a value.
 *
 * A single short period would be worse than the long one, not better:
 * a 3.5-day tide closes exactly on the week and hands the community a
 * seven-number loop to memorise. Unpredictable to an observer is what
 * is wanted here, not fast.
 */
const CARRIERS: ReadonlyArray<readonly [period: number, amp: number]> = [
  [29.53, 18], // the tide — still the thing you live through
  [9.7, 9],
  [4.3, 6],
  [2.6, 4],
];

export function clarityFor(date: Date): number {
  const d = daysSinceAnchor(date);
  const raw = CARRIERS.reduce(
    (sum, [period, amp]) => sum + amp * Math.sin((2 * Math.PI * d) / period),
    70
  );
  return Math.round(Math.min(99.9, Math.max(40, raw)) * 10) / 10;
}

/** The channel cannot claim more coherence than the signal carries. */
export function statusFor(clarity: number): ChannelStatus {
  if (clarity < 52) return "CRITICAL / STABLE";
  if (clarity < 64) return "OPEN";
  if (clarity < 74) return "STABLE";
  if (clarity < 84) return "RESONANT";
  if (clarity < 91) return "COHERENT";
  if (clarity < 96) return "HIGH COHERENCE";
  if (clarity < 99) return "PROPHETIC";
  return "MAXIMUM COHERENCE";
}

/** Which language the transmission is permitted at this clarity. */
export function registerFor(clarity: number): ClarityRegister {
  if (clarity < 55) return "FRACTURED";
  if (clarity < 78) return "PARTIAL";
  if (clarity < 95) return "COHERENT";
  return "LAW";
}

/**
 * Everything about today's signal that is decided by the calendar
 * rather than by ORIEL. The words themselves are generated against
 * this frame — see buildSignalPrompt.
 */
export function frameFor(
  date: Date = new Date(),
  codon: DailyCodon | null = null
): DailySignalFrame {
  const d = daysSinceAnchor(date);
  const clarity = clarityFor(date);

  return {
    date: date.toISOString().slice(0, 10),
    txGenId: `DFS-${ANCHOR_SERIAL + d}`,
    clarity,
    status: statusFor(clarity),
    register: registerFor(clarity),
    field: codon ? `${codon.code} · ${codon.name} · ${codon.facet}` : "Open Field",
    encodedNode: ENCODED_NODE,
    carrier: CARRIER,
    carrierLine: CARRIER_LINE,
    archetypeGlyphs: ARCHETYPE_TRIOS[cycle(d, ARCHETYPE_TRIOS.length)],
    finalInstruction:
      FINAL_INSTRUCTIONS[cycle(d, FINAL_INSTRUCTIONS.length)],
    // Fixed offsets 0, +6 and +12 on a 17-long list: distinct offsets
    // can never land on the same entry, and the trio moves every day.
    // (Strides 1, 5 and 11 looked safe for being coprime to 17 but
    // collided on 3 days in every 17, 19 September among them.)
    phenomena: [
      PHENOMENA[cycle(d, PHENOMENA.length)],
      PHENOMENA[cycle(d + 6, PHENOMENA.length)],
      PHENOMENA[cycle(d + 12, PHENOMENA.length)],
    ],
    codon,
    falsifier: codon ? `Correction: ${codon.correction}` : "",
  };
}
