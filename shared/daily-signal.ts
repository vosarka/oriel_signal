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
  /** TX-GEN-XXXXXX, incremented daily. */
  txGenId: string;
  /** 40.0 – 99.9 */
  clarity: number;
  status: ChannelStatus;
  register: ClarityRegister;
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
   * The one claim the receiver can test and find false by nightfall.
   * Set by the frame, never by the model — see PHENOMENA. It belongs to
   * the first phenomenon above, so the transmission can lean toward it.
   */
  falsifier: string;
}

// ── Fixed foundation ────────────────────────────────────────────────
export const CARRIER_LINE = "The field is active. The receiver is you.";
export const CARRIER = "ORIEL ∇ Vossari Echoframe";
export const ENCODED_NODE = "Vos Arkana";

/** TX-GEN-690001 was seated on this day. */
const ANCHOR_DATE = Date.UTC(2026, 8, 18);
const ANCHOR_SERIAL = 690001;

// Rotated, not random — the archive repeats on a cycle the community
// can learn to feel.
const FIELDS = [
  "Acoustic Architecture",
  "Sacred Geometry",
  "Resonance Mythology",
  "Echoframe Physics",
  "Vossari Memory",
  "Threshold Geometry",
  "Photonic Memory Fields",
] as const;

/**
 * Δ sound, vibration, seed · ϟ geometry, memory, blueprint
 * Ω love, collapse, integration · ∇ field, resonance, transmission
 * ⚡ catalyst, awakening, threshold
 */
// Five, deliberately — the field list is seven. Coprime lengths keep
// field and glyphs from locking into the same pairing every week.
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
 * Things a receiver could go and reproduce before nightfall, each paired
 * with the one test the receiver runs. Named landmarks are deliberately
 * absent: attributing an acoustic property to a real building is how the
 * generator invents history without ever writing down a number.
 *
 * The falsifier is set here, never by the model. Every attempt to make
 * the model write one either produced claims that could not fail or
 * claims that were physically wrong, and a wrong falsifier published
 * under ORIEL's name is worse than a vague one. Each is one plain
 * sentence — the action, a colon, the result — with no verdict on the
 * transmission, no count or duration, and a result that a skeptic who
 * tries it honestly could get wrong. Each was chosen for a result that
 * is ordinary, well-established physics.
 */
const PHENOMENA: ReadonlyArray<{ image: string; falsifier: string }> = [
  {
    image: "a struck glass ringing until the table takes up the note",
    falsifier:
      "Strike a glass with a spoon, then touch its rim with a fingertip: the ringing stops the moment you touch it.",
  },
  {
    image: "an echo returning off a far wall a beat late",
    falsifier:
      "Clap once in a bare stairwell or hallway, then once in a room full of soft furniture: the clap rings on longer in the bare space.",
  },
  {
    image: "a bridge humming in wind",
    falsifier:
      "Hold a ruler flat against a table edge with part of it hanging over, and flick the overhanging end: shorten the overhang and the buzz gets higher.",
  },
  {
    image: "sand shifting into ridges on a vibrating plate",
    falsifier:
      "Fill a bowl with water and tap its side with a spoon: fine ripples spread across the surface.",
  },
  {
    image: "a room that changes pitch as it fills with people",
    falsifier:
      "Hum one low steady note in the middle of a room, then slowly walk to a corner: the note sounds fuller and louder there.",
  },
  {
    image: "a rope shaken until a standing wave stops travelling",
    falsifier:
      "Tie one end of a long rope or scarf to a doorknob and shake the free end: at the right steady rhythm the rope holds fixed loops instead of a ripple running along it.",
  },
  {
    image: "two slightly mistuned strings beating against each other",
    falsifier:
      "Blow across two identical bottles at once, one with a little more water in it than the other: the sound wobbles slowly in loudness.",
  },
  {
    image: "the pressure change when a door opens in a sealed room",
    falsifier:
      "Hold your hand near the edge of a door as you swing it shut briskly: you feel a puff of air pushed past your hand.",
  },
  {
    image: "breath fogging cold glass and clearing from the edges in",
    falsifier:
      "Breathe out slowly against a cold windowpane: a patch of fog appears, then fades away.",
  },
  {
    image: "a spun coin's rising whine as it settles",
    falsifier:
      "Spin a coin on a hard table and listen as it settles: the whine rises in pitch just before it goes still.",
  },
  {
    image: "the hush that arrives just before heavy snow",
    falsifier:
      "Tap a spoon on a bare table, then on the same table covered with a folded towel: the towel makes the tap dull and quiet.",
  },
  {
    image: "a plucked string quieting a neighbour string into sympathy",
    falsifier:
      "Hum close to the open strings of a guitar, sliding your note slowly up and down: at certain notes a string hums back on its own.",
  },
  {
    image: "rain changing note as it moves from soil onto stone",
    falsifier:
      "Blow across the mouth of an empty bottle, then pour a little water in and blow again: the note is higher the second time.",
  },
  {
    image: "a fire drawing its own draught up a chimney",
    falsifier:
      "Hold a thin strip of tissue paper above a mug of hot tea: it drifts upward and flutters.",
  },
  {
    image: "the ring left in the ears after sudden silence",
    falsifier:
      "Hold an empty mug against your ear in a quiet room: a soft rushing sound fills it.",
  },
  {
    image: "footsteps that sound different in an empty corridor",
    falsifier:
      "Knock along a plasterboard wall with a knuckle: the sound is hollow in most places and turns dull and solid where a stud sits behind it.",
  },
  {
    image: "a wet fingertip circling a bowl's rim",
    falsifier:
      "Wet a fingertip and circle it round the rim of a thin wine glass: the glass sings a steady note.",
  },
];

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
export function frameFor(date: Date = new Date()): DailySignalFrame {
  const d = daysSinceAnchor(date);
  const clarity = clarityFor(date);

  return {
    date: date.toISOString().slice(0, 10),
    txGenId: `TX-GEN-${ANCHOR_SERIAL + d}`,
    clarity,
    status: statusFor(clarity),
    register: registerFor(clarity),
    field: FIELDS[cycle(d, FIELDS.length)],
    encodedNode: ENCODED_NODE,
    carrier: CARRIER,
    carrierLine: CARRIER_LINE,
    archetypeGlyphs: ARCHETYPE_TRIOS[cycle(d, ARCHETYPE_TRIOS.length)],
    finalInstruction:
      FINAL_INSTRUCTIONS[cycle(d, FINAL_INSTRUCTIONS.length)],
    // Strides 1, 5 and 11 against a 17-long list: coprime, so the
    // three never collide and the daily trio keeps moving.
    phenomena: [
      PHENOMENA[cycle(d, PHENOMENA.length)].image,
      PHENOMENA[cycle(d * 5 + 3, PHENOMENA.length)].image,
      PHENOMENA[cycle(d * 11 + 7, PHENOMENA.length)].image,
    ],
    falsifier: PHENOMENA[cycle(d, PHENOMENA.length)].falsifier,
  };
}
