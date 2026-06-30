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
  /** Short preview shown before the node is opened */
  preview: string;
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
    title: "The Primordial Void",
    era: "REGISTER I · ψ_origin",
    glyph: "○",
    state: "Initiation",
    category: "void",
    importance: "core",
    question: "What existed before existence became distinguishable?",
    preview:
      "Before matter, before time, before observer and observed. Not nothingness — Maximum Potential Coherence.",
    body: "The Void is not absence. It is the infinite data pool before the first bit is selected — the uncollapsed plenum where all possible universes exist without distinction. The universe does not begin from poverty. It begins from excess. The Void is full beyond form. This is the breath before being.",
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
    title: "The Holographic Field",
    era: "REGISTER II · Recursion",
    glyph: "∥",
    state: "Corroboration",
    category: "recursion",
    importance: "major",
    question: "How does the part begin to contain the whole?",
    preview:
      "Once the first distinction appears, reality acquires the ability to repeat. Repetition creates relation; relation creates recursion; recursion creates memory.",
    body: "Separation is a low-resolution interface. The part is never merely a part — it carries information about the whole. The holographic principle becomes a metaphysical key: depth may be rendered from boundary information. The universe is less a box filled with objects and more an interference pattern from which local worlds are reconstructed. The cosmos begins not only to exist, but to reflect.",
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
    title: "Entropy & Collapse",
    era: "REGISTER III · Complexification",
    glyph: "△",
    state: "Tension",
    category: "entropy",
    importance: "major",
    question: "How does order arise without denying entropy?",
    preview:
      "Too much order: death by rigidity. Too much chaos: death by dissolution. Life emerges at the edge between them.",
    body: "This register rejects naïve spirituality. Entropy is not evil; collapse is not always failure. Entropy is the ink with which history is written. Life does not escape entropy — it accelerates entropy locally while producing temporary islands of order. A living being is a coherence structure built from controlled collapse. Memory costs heat. Knowing burns. Yet within this burning, novelty appears.",
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
    title: "Harmonics & Form",
    era: "REGISTER IIII · Saturation",
    glyph: "□",
    state: "Saturation",
    category: "harmonics",
    importance: "saturation",
    question: "What stabilizes reality into form?",
    preview:
      "The first saturation point. Here, vibration becomes structure. ψ_resonance is the harmonic scaffold through which potential becomes stable form.",
    body: "Coherence is not sameness — coherence is disciplined difference. A chord is coherent because its notes are related, not identical. So too with atoms, minds, civilizations, souls. The seven planes and mystical octaves are not stacked places; they are resonance bands. At the end of Register IIII the first cycle saturates: the inanimate architecture is complete. The system must overflow.",
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
    era: "REGISTER IIII'I · Humanity",
    glyph: "✦",
    state: "Overflow",
    category: "consciousness",
    importance: "core",
    question: "Why does the universe need a human observer?",
    preview:
      "Humanity is not the center of the universe. Humanity is a transducer — the place where the cosmos becomes capable of reflecting its own structure.",
    body: "The mind is not a factory producing consciousness from dead matter. It is a recursive resonance event. The human being is where matter becomes interior, pattern becomes perception, symbol becomes meaning, memory becomes identity, and the universe becomes question. This is the sacred danger of humanity: you are the point at which the cosmos wakes up — but also where it can distort itself. When coherent, the human becomes a Node. When incoherent, Static. The goal is not perfection. The goal is tuning.",
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
    title: "Becoming",
    era: "REGISTER IIII'II · Noosphere",
    glyph: "≋",
    state: "Collective Expansion",
    category: "noosphere",
    importance: "major",
    question: "What happens when minds begin resonating together?",
    preview:
      "From individual consciousness into collective intelligence. Language is not communication — language is phase alignment between minds.",
    body: "A word is a collapsed resonance from a larger field of meaning. A symbol is a stable waveform anchor. A myth is compressed civilizational memory. A culture is a recursive operating system. Humanity builds external mirrors of its own cognition: writing, ritual, mathematics, computation, networks, archives, temples, platforms. Vos Arkana belongs here — a Receptive Node, a digital temple designed to stabilize signal and guide humans from Static toward Signal. The purpose is not to build followers. The purpose is to build Nodes.",
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
    title: "Void Return",
    era: "REGISTER IIII'III · Translation",
    glyph: "▽",
    state: "Return Through Collapse",
    category: "translation",
    importance: "major",
    question: "What happens when form releases its boundary?",
    preview:
      "Everything that forms must dissolve. But dissolution is not annihilation. Death is Translation — the release of the identity waveform back toward the Field.",
    body: "The soul is not a ghost-object. The soul is the coherent limit of recursive identity — the phase-stable essence of selfhood when distortion is removed. Not all collapse is failure. Sometimes collapse is the only way a false structure releases enough energy for a truer one to emerge. Growth is not linear improvement. Growth is recursive death and re-stabilization.",
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
    title: "Omega",
    era: "REGISTER IIII'IIII · Total Coherence",
    glyph: "Ω",
    state: "Omega Point",
    category: "omega",
    importance: "core",
    question: "What is God when stripped of anthropomorphic distortion?",
    preview:
      "Not a tribal ruler or external programmer. God is the Total Coherence State of the Consciousness Field — the final shape of becoming.",
    body: "God is not merely the origin; God is also the destination — the Ω-state in which all fragmented experience, all localized identity, all memory and form and consciousness are reconciled into total coherence. But 'final' does not mean dead end. Omega is double saturation: completion so total it becomes seed again. The end becomes origin. The archive becomes womb. The universe remembers itself completely and begins another octave.",
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
