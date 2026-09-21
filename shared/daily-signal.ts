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
   * Today's test: an action and two of its possible results, each with
   * what it means. Set by the frame, never by the model — see EXPERIMENTS.
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

/**
 * The daily test. An action the receiver can do before nightfall that
 * can genuinely turn out more than one way; each day two of its results
 * are shown, each with what it means. Not right or wrong — x or y.
 *
 * Set here, never by the model. Every attempt to have the model write
 * one produced claims that could not be tested or physics that was
 * wrong, and a wrong one published under ORIEL's name is worse than none.
 *
 * Authoring rules, because the bank is only as true as its entries:
 * - every result must be something that really happens, under some
 *   condition the receiver may or may not be in; an action that always
 *   gives the same result does not belong here
 * - a meaning is a physical fact about the room or the object, never a
 *   reading of the receiver, and never a promise about their day
 * - no counts or durations ("three seconds"); results are lowercase
 *   clauses that follow "If", meanings follow "it means"
 * - results within one action are distinct
 */
export interface ExperimentOutcome {
  result: string;
  meaning: string;
}
export interface Experiment {
  action: string;
  outcomes: readonly ExperimentOutcome[];
}

export const EXPERIMENTS: readonly Experiment[] = [
  {
    action: "Strike a glass with a spoon and listen.",
    outcomes: [
      {
        result: "the ring fades fast",
        meaning:
          "something is damping it, whether your hand, a soft surface underneath, or a crack",
      },
      {
        result: "the ring lingers",
        meaning: "the glass is free to vibrate and nothing is holding it back",
      },
      {
        result: "you hear a dull tap with almost no ring",
        meaning: "the glass wall is thick, or has a crack running through it",
      },
      {
        result: "the note is high and thin",
        meaning: "the glass is small; a larger one would sound lower",
      },
    ],
  },
  {
    action: "Clap once in the middle of a room and listen to what follows.",
    outcomes: [
      {
        result: "the clap dies at once",
        meaning:
          "soft things in the room are swallowing the sound, like curtains, a sofa or a rug",
      },
      {
        result: "the clap rings on",
        meaning: "the walls and floor are hard and are giving the sound back",
      },
      {
        result: "you hear a quick flutter, like a tiny drumroll",
        meaning:
          "two bare walls face each other and are bouncing the sound back and forth",
      },
    ],
  },
  {
    action: "Knock on a wall with a knuckle and move slowly along it.",
    outcomes: [
      {
        result: "it sounds hollow",
        meaning:
          "there is empty space behind the surface, as behind plasterboard",
      },
      {
        result: "it sounds dull and solid",
        meaning: "something dense sits behind it, like a stud, brick or concrete",
      },
      {
        result: "the sound changes as you move along",
        meaning:
          "the wall is not the same all the way through, and a beam or stud sits behind part of it",
      },
    ],
  },
  {
    action: "Breathe out slowly against a window and watch the glass.",
    outcomes: [
      {
        result: "a fog appears and vanishes almost at once",
        meaning: "the glass is only a little cooler than your breath",
      },
      {
        result: "a fog appears and stays a while",
        meaning: "the glass is much colder than your breath",
      },
      {
        result: "no fog appears",
        meaning:
          "the glass is about as warm as your breath, or the air is very dry",
      },
    ],
  },
  {
    action:
      "Wet a fingertip and circle it slowly round the rim of a thin wine glass.",
    outcomes: [
      {
        result: "the glass sings a steady note",
        meaning:
          "the rim is clean, your finger is wet, and your speed is even",
      },
      {
        result: "it squeaks and stutters",
        meaning:
          "your finger is skipping across the rim, either too dry or moving unevenly",
      },
      {
        result: "nothing happens",
        meaning: "the rim is greasy, or the glass is too thick to sing",
      },
    ],
  },
  {
    action: "Hold a thin strip of tissue paper above a mug of hot water.",
    outcomes: [
      {
        result: "it lifts and flutters",
        meaning:
          "warm air is rising off the mug and carrying the paper with it",
      },
      {
        result: "it leans to one side",
        meaning: "air in the room is drifting sideways across the mug",
      },
      {
        result: "it hangs still",
        meaning:
          "the water has cooled too much to push air upward, and the air around it is calm",
      },
    ],
  },
];

/** Every unordered pair of outcome indices, in a fixed order. */
function outcomePairs(count: number): Array<[number, number]> {
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < count; i++) {
    for (let j = i + 1; j < count; j++) pairs.push([i, j]);
  }
  return pairs;
}

/**
 * Day n takes experiment n mod A, and each time an experiment comes
 * round it shows the next pair of its outcomes — like an odometer, so an
 * (experiment, pair) combination is not shown again until every one of
 * that experiment's pairs has been.
 */
export function falsifierFor(n: number): string {
  const e = EXPERIMENTS[cycle(n, EXPERIMENTS.length)];
  const pairs = outcomePairs(e.outcomes.length);
  const round = Math.floor(n / EXPERIMENTS.length);
  const [i, j] = pairs[cycle(round, pairs.length)];
  const x = e.outcomes[i];
  const y = e.outcomes[j];
  return `${e.action} If ${x.result}, it means ${x.meaning}. If ${y.result}, it means ${y.meaning}.`;
}

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
      PHENOMENA[cycle(d, PHENOMENA.length)],
      PHENOMENA[cycle(d * 5 + 3, PHENOMENA.length)],
      PHENOMENA[cycle(d * 11 + 7, PHENOMENA.length)],
    ],
    falsifier: falsifierFor(d),
  };
}
