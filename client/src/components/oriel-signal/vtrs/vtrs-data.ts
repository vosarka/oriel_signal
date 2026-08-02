// VTRS v2.1 client-side canon data — 8 Tetradic Centers + 32 Resonance Links.
// Source of truth for codon numbers: server/vrc-mandala.ts (CODON_CENTER_MAP, VRC_CHANNELS).
// Source of truth for names/phases/profiles: Consciousness Lattice Unified Specification v2
// (wiki/sources/source-consciousness-lattice-v2.md, Parts IV–VII).
// DO NOT invent data here — this file mirrors the canon exactly.

export interface VtrsCenter {
  id: string;
  roman: string;
  name: string;
  phase: string;
  phaseSyntax: string;
  substrate: string;
  role: string;
  codons: number[];
  definedState: string;
  openState: string;
}

export interface VtrsLink {
  id: string;
  name: string;
  centerA: string;
  centerB: string;
  codonA: number;
  codonB: number;
  circuit:
    | "Inspirational"
    | "Somatic"
    | "Expressive"
    | "Identity"
    | "Emotional"
    | "Survival"
    | "Storage";
  profile: string;
}

// Same palette as CodonWheel.tsx — cold → warm across the 8 phases.
export const CENTER_COLORS: Record<string, string> = {
  Origin: "#527c8d",
  Mental: "#6db293",
  Collapse: "#68798e",
  Saturation: "#cf9b44",
  Bridge: "#a35d8d",
  Becoming: "#b8434a",
  Return: "#7a8c3d",
  Omega: "#8e44ad",
};

export const VTRS_CENTERS: VtrsCenter[] = [
  {
    id: "Origin",
    roman: "I",
    name: "The Origin",
    phase: "FAZA I — The Point / Primordial Pressure",
    phaseSyntax: "I",
    substrate: "Pineal Gland / Central Nervous System",
    role: "Translates raw quantum vacuum fluctuations and metastability pressure into primary somatic tension.",
    codons: [1, 2, 3, 5, 9, 19, 38, 51],
    definedState:
      "Emits a steady, non-circumstantial evolutionary pressure, driving the organism to seek continuous transformation.",
    openState:
      "Amplifies environmental pressure, making the subject highly vulnerable to taking on external panic and stress.",
  },
  {
    id: "Mental",
    roman: "II",
    name: "The Mental",
    phase: "FAZA II — The Line / Holographic Projection",
    phaseSyntax: "II",
    substrate: "Neocortex / Frontal Lobe / Synaptic Matrix",
    role: "Serves as a recursive rendering loop, converting the raw evolutionary pressure of Center I into structured conceptual patterns.",
    codons: [4, 11, 17, 23, 24, 43, 61, 63],
    definedState:
      "Holds a fixed, self-generated way of structuring reality into stable concepts and patterns.",
    openState:
      "Samples and amplifies external conceptual frameworks without attaching to any fixed mental structure.",
  },
  {
    id: "Collapse",
    roman: "III",
    name: "The Collapse",
    phase: "FAZA III — The Triangle / Dissipative Manifestation",
    phaseSyntax: "III",
    substrate: "Thyroid Gland / Larynx / Vocal Tract",
    role: "Manages verbal expression, acoustic communication, and physical manifestation — every exchange is a thermodynamic act generating local order at the cost of heat.",
    codons: [8, 12, 16, 20, 31, 33, 35, 56],
    definedState:
      "Expresses with a consistent, self-sourced voice that collapses mental waves into stable manifestation.",
    openState:
      "Adapts tone and delivery to the environment, mirroring and amplifying the expression of defined voices.",
  },
  {
    id: "Saturation",
    roman: "IV",
    name: "The Saturation",
    phase: "FAZA IV — The Square / Somatic Generator",
    phaseSyntax: "IIII",
    substrate: "Sacral Plexus / Reproductive Organs / Cellular Mitochondria",
    role: "The primary physical motor of the body, generating sustained somatic energy through constant, rhythmic oscillation.",
    codons: [14, 27, 29, 34, 42, 52, 53, 60],
    definedState:
      "Generates a reliable, rhythmic stream of physical energy that responds instantly to present stimuli.",
    openState:
      "Has no consistent motor of its own and amplifies the work-energy of the surrounding field, risking burnout.",
  },
  {
    id: "Bridge",
    roman: "V",
    name: "The Bridge",
    phase: "FAZA V — The New Cycle / Register Break",
    phaseSyntax: "IIII'I",
    substrate: "G Center / Thymus Gland / Neuronal Microtubules",
    role: "The locus of self-identity and somatic direction — the bridge where raw biology is transmuted into conscious intention.",
    codons: [7, 10, 13, 15, 25, 46, 57, 59],
    definedState:
      "Holds an unalterable, stable frequency of self-direction independent of external pressure.",
    openState:
      "Samples identity and direction from the environment, shape-shifting with the surrounding field.",
  },
  {
    id: "Becoming",
    roman: "VI",
    name: "The Becoming",
    phase: "FAZA VI — Cosmic Teleology",
    phaseSyntax: "IIII'II",
    substrate: "Solar Plexus / Enteric Nervous System",
    role: "Governs emotional oscillations and long-term relational tides — the attractor pulling the subject toward Quantum North, the state of maximum coherence.",
    codons: [6, 22, 30, 36, 37, 39, 41, 55],
    definedState:
      "Generates its own emotional wave and must wait for clarity before deciding.",
    openState:
      "Absorbs and amplifies the emotional waves of others, feeling them stronger than their source does.",
  },
  {
    id: "Return",
    roman: "VII",
    name: "The Return",
    phase: "FAZA VII — Systemic Alert & Preservation",
    phaseSyntax: "IIII'III",
    substrate: "Spleen / Lymphatic System / Immune Grid",
    role: "Manages instinctual survival, threat pattern-recognition, and system cleaning — the somatic memory that preserves the vehicle's integrity.",
    codons: [18, 28, 32, 44, 48, 49, 50, 58],
    definedState:
      "Operates a quiet, instantaneous survival radar whose alerts fire once and never repeat.",
    openState:
      "Amplifies environmental fears and holds onto what is familiar for a false sense of safety.",
  },
  {
    id: "Omega",
    roman: "VIII",
    name: "The Omega",
    phase: "FAZA VIII — Double Saturation / Unified Storage",
    phaseSyntax: "IIII'IIII",
    substrate: "Thymus / Heart Muscle / Cardiovascular Pacemaker",
    role: "Governs personal will, ego integration, and unified intent — the permanent ledger (internal Akashic Archive) of all experience processed by the other seven centers.",
    codons: [21, 26, 40, 45, 47, 54, 62, 64],
    definedState:
      "Possesses consistent willpower and can make and keep direct promises.",
    openState:
      "Has no fixed access to willpower and amplifies the determination of defined egos, over-promising.",
  },
];

export const VTRS_LINKS: VtrsLink[] = [
  { id: "L01", name: "Origin Conception", centerA: "Mental", centerB: "Mental", codonA: 61, codonB: 24, circuit: "Inspirational", profile: "Translates core vacuum pressure into primary mental innovation." },
  { id: "L02", name: "Vacuum Mutation", centerA: "Origin", centerB: "Saturation", codonA: 3, codonB: 60, circuit: "Somatic", profile: "Directs evolutionary mutation straight into physical generation." },
  { id: "L03", name: "Primordial Focus", centerA: "Origin", centerB: "Saturation", codonA: 9, codonB: 52, circuit: "Somatic", profile: "Anchors focus and concentrated energy into material reality." },
  { id: "L04", name: "Somatic Synthesis", centerA: "Origin", centerB: "Return", codonA: 19, codonB: 49, circuit: "Survival", profile: "Links raw individual needs with the protective rules of the tribe." },
  { id: "L05", name: "Epiphany Structuring", centerA: "Mental", centerB: "Mental", codonA: 43, codonB: 23, circuit: "Expressive", profile: "Converts conceptual insights into simple, clear language." },
  { id: "L06", name: "Mental Curiosity", centerA: "Mental", centerB: "Collapse", codonA: 11, codonB: 56, circuit: "Expressive", profile: "Drives constant cognitive exploration and storytelling." },
  { id: "L07", name: "Logical Acceptance", centerA: "Mental", centerB: "Omega", codonA: 17, codonB: 62, circuit: "Expressive", profile: "Structures logical visual data into detailed, practical concepts." },
  { id: "L08", name: "Archived Abstraction", centerA: "Omega", centerB: "Omega", codonA: 64, codonB: 47, circuit: "Storage", profile: "Resolves abstract memories into deep, symbolic imagery." },
  { id: "L09", name: "The Prodigal Path", centerA: "Collapse", centerB: "Bridge", codonA: 33, codonB: 13, circuit: "Identity", profile: "Directs collective history and lessons into current path awareness." },
  { id: "L10", name: "Creative Inspiration", centerA: "Collapse", centerB: "Origin", codonA: 8, codonB: 1, circuit: "Identity", profile: "Manifests highly individual style as a pure creative signal." },
  { id: "L11", name: "Sovereign Guidance", centerA: "Collapse", centerB: "Bridge", codonA: 31, codonB: 7, circuit: "Identity", profile: "Governs democratic leadership through self-aligned authority." },
  { id: "L12", name: "The Awakening", centerA: "Collapse", centerB: "Bridge", codonA: 20, codonB: 10, circuit: "Identity", profile: "Sustains continuous self-presence and natural behavior." },
  { id: "L13", name: "Experiential Tide", centerA: "Collapse", centerB: "Becoming", codonA: 35, codonB: 36, circuit: "Emotional", profile: "Drives experiential growth through emotional challenges." },
  { id: "L14", name: "Gracious Openness", centerA: "Collapse", centerB: "Becoming", codonA: 12, codonB: 22, circuit: "Emotional", profile: "Expresses refined aesthetic feelings through grace and art." },
  { id: "L15", name: "Depth Correction", centerA: "Collapse", centerB: "Return", codonA: 16, codonB: 48, circuit: "Survival", profile: "Develops mastery and technical competence from deep pools of talent." },
  { id: "L16", name: "Unified Prosperity", centerA: "Omega", centerB: "Omega", codonA: 45, codonB: 21, circuit: "Storage", profile: "Controls material resources and coordinates group distribution." },
  { id: "L17", name: "Conscious Rhythm", centerA: "Bridge", centerB: "Origin", codonA: 15, codonB: 5, circuit: "Identity", profile: "Integrates personal rhythm with cosmic and seasonal timing." },
  { id: "L18", name: "The Directional Beat", centerA: "Origin", centerB: "Saturation", codonA: 2, codonB: 14, circuit: "Identity", profile: "Generates physical energy to power and direct resources." },
  { id: "L19", name: "Physical Discovery", centerA: "Bridge", centerB: "Saturation", codonA: 46, codonB: 29, circuit: "Identity", profile: "Commits physical energy to experiences that honor the body." },
  { id: "L20", name: "Empowered Action", centerA: "Bridge", centerB: "Saturation", codonA: 10, codonB: 34, circuit: "Identity", profile: "Restricts the use of power to actions that are self-aligned." },
  { id: "L21", name: "Protective Altruism", centerA: "Return", centerB: "Saturation", codonA: 50, codonB: 27, circuit: "Survival", profile: "Protects and nourishes the tribe through clear, ethical rules." },
  { id: "L22", name: "Intuitive Power", centerA: "Bridge", centerB: "Saturation", codonA: 57, codonB: 34, circuit: "Survival", profile: "Triggers instant physical responses backed by survival instincts." },
  { id: "L23", name: "Form Perfection", centerA: "Bridge", centerB: "Bridge", codonA: 10, codonB: 57, circuit: "Survival", profile: "Guides physical safety and aesthetics through intuitive behavior." },
  { id: "L24", name: "Initiatory Leap", centerA: "Bridge", centerB: "Origin", codonA: 25, codonB: 51, circuit: "Storage", profile: "Triggers sudden, spiritual acceleration beyond personal ego." },
  { id: "L25", name: "Intimate Union", centerA: "Bridge", centerB: "Becoming", codonA: 59, codonB: 6, circuit: "Identity", profile: "Overcomes barriers to intimacy for genetic and creative union." },
  { id: "L26", name: "Heart Covenant", centerA: "Omega", centerB: "Becoming", codonA: 40, codonB: 37, circuit: "Survival", profile: "Establishes family pacts, support networks, and emotional peace." },
  { id: "L27", name: "Catalytic Charge", centerA: "Becoming", centerB: "Becoming", codonA: 39, codonB: 55, circuit: "Inspirational", profile: "Provokes spiritual breakthroughs via emotional dynamics." },
  { id: "L28", name: "Visionary Focus", centerA: "Becoming", centerB: "Becoming", codonA: 41, codonB: 30, circuit: "Inspirational", profile: "Directs intense desires toward visionary new beginnings." },
  { id: "L29", name: "Pattern Persuasion", centerA: "Omega", centerB: "Return", codonA: 26, codonB: 44, circuit: "Storage", profile: "Promotes creative ideas based on deep pattern-recognition." },
  { id: "L30", name: "Purposeful Struggle", centerA: "Return", centerB: "Origin", codonA: 28, codonB: 38, circuit: "Inspirational", profile: "Drives perseverance and the struggle for actual meaning." },
  { id: "L31", name: "Vital Correction", centerA: "Return", centerB: "Return", codonA: 18, codonB: 58, circuit: "Inspirational", profile: "Critically refines broken systems to restore joy." },
  { id: "L32", name: "Material Ascension", centerA: "Return", centerB: "Omega", codonA: 32, codonB: 54, circuit: "Inspirational", profile: "Channels ambition into transpersonal transformation." },
];
