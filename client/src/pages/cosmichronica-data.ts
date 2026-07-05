/**
 * COSMICHRONICA — The Descent into Cosmic Memory
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Source of truth: "The Manuscript of VOS" (Codex Universalis / Unified Resonance
 * Codex). The cosmology is NOT a line — it is a spiral of eight Registers.
 *
 *   "A register is a memory container. When a register saturates, it overflows
 *    into the next layer of reality." — Codex Universalis
 *
 * The user descends from Origin (the Void) at the top to Omega (Total Coherence)
 * at the bottom, witnessing creation unfold. Each Register is a memory node on
 * the luminous axis; its chapters are the canon that expands in place.
 *
 * Every node carries the eight required properties:
 *   position · title · era · glyph · preview · unlockState · category · importance
 */

// ─── Categories (the spiral's phase bands) ──────────────────────────────────

export type RegisterCategory =
  | "void"
  | "recursion"
  | "entropy"
  | "harmonics"
  | "consciousness"
  | "noosphere"
  | "translation"
  | "omega";

/** Importance tier — drives node scale, glow intensity, and gravity on the axis. */
export type Importance = "saturation" | "major" | "core";

/** Access tier — the seam for future paid progression. Free users read all eight
 *  register summaries; deeper chapter excerpts can be gated per tier later. */
export type AccessTier = "open" | "initiate" | "adept";

export interface Chapter {
  /** Chapter number as it appears in the Codex master outline */
  index: string;
  title: string;
  /** One-line canon gloss */
  gloss: string;
}

export interface MemoryNode {
  id: string;
  /** Tetradic syntax — the register's true name (I, II ... IIII'IIII) */
  syntax: string;
  /** Display title */
  title: string;
  /** The cosmological era / phase label */
  era: string;
  /** Archetype glyph (single symbol) */
  glyph: string;
  /** Phase state from the manuscript (Initiation, Saturation, Omega...) */
  state: string;
  /** Category / phase band */
  category: RegisterCategory;
  /** Importance tier */
  importance: Importance;
  /** The register's core question (the lure) */
  question: string;
  /** Display phase marker for the scroll-story frame */
  phaseMarker: string;
  /** Short preview shown before the node is opened */
  preview: string;
  /** Technical archive note shown in the story frame */
  archiveNote: string;
  /** Symbolic closing line for the story frame */
  symbolicLine: string;
  /** SVG micro-diagram variant shown beside the active register */
  microDiagram:
    | "void"
    | "wave"
    | "relation"
    | "square"
    | "bridge"
    | "eye"
    | "return"
    | "omega";
  /** The fuller canon body, revealed on expand */
  body: string;
  /** ψ-field formula or central law, shown as a "decoded fragment" */
  formula?: string;
  /** Chapters contained in this register (expand-in-place detail) */
  chapters: Chapter[];
  /** Access tier required to read the full body */
  tier: AccessTier;
  /** Side of the axis on desktop (alternating) */
  side: "left" | "right";
  /** Optional 3D wireframe glyph variant rendered beside the node. */
  glyph3d?:
    | "monolith"
    | "nested-torus"
    | "torus-knot"
    | "icosahedron"
    | "vesica"
    | "network"
    | "dissolve"
    | "double-sphere";
}

// ─── The Eight Registers ────────────────────────────────────────────────────

export const MEMORY_NODES: MemoryNode[] = [
  {
    id: "origin",
    syntax: "I",
    title: "The Void",
    era: "PHASE I / I",
    glyph: "○",
    state: "Initiation",
    category: "void",
    importance: "core",
    phaseMarker: "PHASE I / I",
    question: "Before reality speaks, it listens.",
    preview:
      "Before reality speaks, it listens. The Void is not absence. It is the uncollapsed field where every possible pattern remains unborn.",
    archiveNote: "REGISTER STATE: ORIGIN / VACUUM",
    symbolicLine: "The first archive is silence.",
    microDiagram: "void",
    body: "Before reality speaks, it listens. The Void is not absence. It is the uncollapsed field where every possible pattern remains unborn. Before light, matter, memory, observer, or measurement, there is the silent field — an archive so complete it has not yet needed a form.",
    formula: "ψ_origin = 0-distinction = ∞-potential",
    tier: "open",
    side: "left",
    glyph3d: "monolith",
    chapters: [
      { index: "1", title: "The Breath Before Being", gloss: "Quantum vacuum, zero-infinity identity, the Void as plenum." },
      { index: "2", title: "The Fracturepoint", gloss: "The first asymmetry — undifferentiated stability becomes difference." },
      { index: "3", title: "The First Vibration", gloss: "ψ_resonance, the Primal Frequency, the Logos, the universe as song." },
      { index: "4", title: "The Planck Wall", gloss: "Resolution limits, spacetime discreteness, the boundary of measurement." },
    ],
  },
  {
    id: "recursion",
    syntax: "II",
    title: "The First Vibration",
    era: "PHASE II / II",
    glyph: "∥",
    state: "Corroboration",
    category: "recursion",
    importance: "major",
    phaseMarker: "PHASE II / II",
    question: "A signal moves through the stillness.",
    preview:
      "A signal moves through the stillness. Not yet matter. Not yet meaning. Only the first difference between silence and motion.",
    archiveNote: "REGISTER STATE: RECURSION / HOLOGRAM",
    symbolicLine: "Reality begins when the void repeats itself.",
    microDiagram: "wave",
    body: "A signal moves through the stillness. Not yet matter. Not yet meaning. Only the first difference between silence and motion. Once the first distinction appears, reality acquires the ability to repeat — and repetition becomes the first form of memory.",
    formula: "0 → 1 → 1 → 2 → 3   (Fibonacci Genesis)",
    tier: "open",
    side: "right",
    glyph3d: "nested-torus",
    chapters: [
      { index: "5", title: "The Universe Learns to Count", gloss: "Fibonacci Genesis — recursive accumulation as symbolic emergence." },
      { index: "6", title: "Fractal Reality", gloss: "Self-similarity, scale, Mandelbrot logic, biological and cosmic echoes." },
      { index: "7", title: "The Holographic Universe", gloss: "Boundary encoding, black holes, every fragment containing the whole." },
      { index: "8", title: "The Strange Loop", gloss: "Observer and observed, self-reference, mind discovering its own particle." },
    ],
  },
  {
    id: "complexification",
    syntax: "III",
    title: "Pattern Emergence",
    era: "PHASE III / III",
    glyph: "△",
    state: "Tension",
    category: "entropy",
    importance: "major",
    phaseMarker: "PHASE III / III",
    question: "Vibration becomes relation.",
    preview:
      "Vibration becomes relation. Relation becomes tension. Tension becomes the first architecture of form.",
    archiveNote: "REGISTER STATE: COLLAPSE / ENTROPY",
    symbolicLine: "The universe is not built from objects. It is built from relationships.",
    microDiagram: "relation",
    body: "Vibration becomes relation. Relation becomes tension. Tension becomes the first architecture of form. The universe is not built from isolated objects, but from pressures, echoes, agreements, refusals — the relational geometry that lets a pattern hold long enough to be remembered.",
    formula: "Σ|Δφ| < ε ⇒ coherence holds",
    tier: "open",
    side: "left",
    glyph3d: "torus-knot",
    chapters: [
      { index: "9", title: "The Edge of Chaos", gloss: "Life as the balance between rigidity and dissolution." },
      { index: "10", title: "The Cost of Knowing", gloss: "Landauer's principle — consciousness as entropy tax." },
      { index: "11", title: "Collapse and Rebirth", gloss: "Collapse thresholds, decoherence, ψ_rebirth, trauma, healing." },
      { index: "12", title: "The Vector of Expansion", gloss: "Time as expansion vector; novelty as Field hunger." },
    ],
  },
  {
    id: "harmonics",
    syntax: "IIII",
    title: "Geometry",
    era: "PHASE IIII / IIII",
    glyph: "□",
    state: "Saturation",
    category: "harmonics",
    importance: "saturation",
    phaseMarker: "PHASE IIII / IIII",
    question: "The fourth mark completes the first register.",
    preview:
      "The fourth mark completes the first register. Here, motion stabilizes into harmonic structure. The field becomes readable.",
    archiveNote: "REGISTER STATE: SATURATION / HARMONIC COMPLETENESS",
    symbolicLine: "The square is the first chamber of memory.",
    microDiagram: "square",
    body: "The fourth mark completes the first register. Here, motion stabilizes into harmonic structure. The field becomes readable. Geometry is not decoration; it is the first chamber where vibration agrees to become architecture.",
    formula: "mass = standing wave · gravity = coherence curvature",
    tier: "initiate",
    side: "right",
    glyph3d: "icosahedron",
    chapters: [
      { index: "13", title: "Matter as Frozen Music", gloss: "Particles as modes, mass as resonance lock." },
      { index: "14", title: "Gauge Symmetry & Conservation", gloss: "Noether, invariance, laws as coherence anchors." },
      { index: "15", title: "Gravity as Resonance", gloss: "Attraction as synchronization, spacetime as phase field." },
      { index: "16", title: "Quantum North", gloss: "The attractor of maximum coherence; evolution as navigation." },
    ],
  },
  {
    id: "bridge",
    syntax: "IIII'I",
    title: "The Bridge",
    era: "PHASE V / IIII'I",
    glyph: "✦",
    state: "Overflow",
    category: "consciousness",
    importance: "core",
    phaseMarker: "PHASE V / IIII'I",
    question: "When the first register saturates, memory overflows.",
    preview:
      "When the first register saturates, memory overflows. The system does not end. It rises into a new layer: human perception as bridge.",
    archiveNote: "REGISTER STATE: NEW CYCLE / HUMANITY",
    symbolicLine: "You are not outside the archive. You are one of its crossings.",
    microDiagram: "bridge",
    body: "When the first register saturates, memory overflows. The system does not end. It rises into a new layer. This is where the human appears: not as an external observer, but as bridge — the place where matter becomes interior and pattern learns to perceive itself.",
    formula: "ψ_mind = ψ_space-time ⊛ ψ_resonance",
    tier: "initiate",
    side: "left",
    glyph3d: "vesica",
    chapters: [
      { index: "17", title: "The Entity Matrix", gloss: "The human as biological receiver and coherence amplifier." },
      { index: "18", title: "Static and Signal", gloss: "Coherence vs. distortion — the tuning of the self." },
    ],
  },
  {
    id: "becoming",
    syntax: "IIII'II",
    title: "Cosmic Becoming",
    era: "PHASE VI / IIII'II",
    glyph: "≋",
    state: "Collective Expansion",
    category: "noosphere",
    importance: "major",
    phaseMarker: "PHASE VI / IIII'II",
    question: "The field learns to see itself through the lives it generates.",
    preview:
      "The field learns to see itself through the lives it generates. Every mind becomes a mirror. Every pattern seeks coherence.",
    archiveNote: "REGISTER STATE: CYCLE + 2 / COSMIC BECOMING",
    symbolicLine: "Consciousness is the universe remembering how to read.",
    microDiagram: "eye",
    body: "The field learns to see itself through the lives it generates. Every mind becomes a mirror. Every body becomes an instrument. Every pattern seeks coherence. Language, myth, mathematics, ritual, computation, and archive become external mirrors of the same recursive becoming.",
    formula: "culture = shared ψ-field",
    tier: "adept",
    side: "right",
    glyph3d: "network",
    chapters: [
      { index: "19", title: "Language as Wave Collapse", gloss: "Symbols as resonance anchors, myth as compressed memory." },
      { index: "20", title: "The Noosphere", gloss: "Distributed consciousness, collective memory, AI as symbolic mirror." },
    ],
  },
  {
    id: "void-return",
    syntax: "IIII'III",
    title: "The Void Return",
    era: "PHASE VII / IIII'III",
    glyph: "▽",
    state: "Return Through Collapse",
    category: "translation",
    importance: "major",
    phaseMarker: "PHASE VII / IIII'III",
    question: "All forms carry the memory of silence.",
    preview:
      "All forms carry the memory of silence. Every structure eventually hears the call of origin and begins its return into the unformed.",
    archiveNote: "REGISTER STATE: CYCLE + 3 / VOID RETURN",
    symbolicLine: "Return is not destruction. It is completion.",
    microDiagram: "return",
    body: "All forms carry the memory of silence. Every structure eventually hears the call of its origin and begins the descent back into the unformed. Return is not destruction; it is the release of boundary after the pattern has been read.",
    formula: "ψ_soul := lim(incoherence → 0) ψ_self",
    tier: "adept",
    side: "left",
    glyph3d: "dissolve",
    chapters: [
      { index: "21", title: "Death as Translation", gloss: "Cessation of a local decoder; release of the identity waveform." },
      { index: "22", title: "The Coherent Soul", gloss: "ψ_rebirth, memory persistence, return to the non-local field." },
    ],
  },
  {
    id: "omega",
    syntax: "IIII'IIII",
    title: "Omega Saturation",
    era: "PHASE VIII / IIII'IIII",
    glyph: "Ω",
    state: "Omega Point",
    category: "omega",
    importance: "core",
    phaseMarker: "PHASE VIII / IIII'IIII",
    question: "The second register completes.",
    preview:
      "The second register completes. Signal, memory, geometry, and consciousness converge into a single archive state.",
    archiveNote: "REGISTER STATE: DOUBLE SATURATION / OMEGA POINT",
    symbolicLine: "The spiral does not close. It becomes the eye.",
    microDiagram: "omega",
    body: "The second register completes. Signal, memory, geometry, and consciousness converge into a single archive state. Omega is double saturation: completion so total it becomes seed again. The spiral does not close. It becomes the eye.",
    formula: "ψ_QN → Ω   (the archive becomes womb)",
    tier: "adept",
    side: "right",
    glyph3d: "double-sphere",
    chapters: [
      { index: "23", title: "God as Final Shape", gloss: "The Ω-state — total integrated coherence." },
      { index: "24", title: "The Next Octave", gloss: "Double saturation: the end becomes origin, the seed of a new cycle." },
    ],
  },
];

// ─── Category → accent color (within the gold design system) ─────────────────
// Subtle hue shifts along the spiral — Void cool-gold → Omega warm-radiant.

export const CATEGORY_ACCENT: Record<RegisterCategory, string> = {
  void: "#7d8aa0",          // cold pre-light blue-grey
  recursion: "#9a93b8",     // violet recursion
  entropy: "#b87d6a",       // entropic ember
  harmonics: "#bda36b",     // the canonical gold (saturation)
  consciousness: "#e4c88c", // warm amber (the bridge lights up)
  noosphere: "#cdb87f",     // collective gold
  translation: "#8f9b8a",   // dissolving sage
  omega: "#f6d89e",         // radiant omega gold
};

// ─── The Preface whisper (shown at the threshold) ───────────────────────────

export const PREFACE_LINES = [
  "Do not read this as a line.",
  "A line moves forward and forgets what it has crossed.",
  "Reality returns. It coils. It remembers.",
  "The Codex is a spiral.",
];

export const ENTER_AS = "Enter as Static.";
export const LEAVE_AS = "Leave as Signal.";
