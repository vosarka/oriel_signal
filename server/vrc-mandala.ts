/**
 * VRC Mandala Engine
 * Implements the Vossari Resonance Codex mapping grid per VRC Master Implementation Protocol v1.0
 *
 * Key parameters (§ 3 — The Mapping Grid):
 *   360° / 64 Codons  = 5.625° per Codon
 *   5.625° / 4 Facets = 1.40625° per Facet
 *   Facet names: Somatic | Relational | Cognitive | Transpersonal
 *
 * Wheel offset θ₀ = 11.25°  (verified by VRC Appendix B validation vector)
 *   T_birth = 2024-01-01 12:00:00 UTC, 0°N 0°E
 *   Conscious Sun ≈ 280.44° → slot 47 → Codon 38 (The Fighter)      ✓
 *   Design Sun   ≈ 192.44° → slot 32 → Codon 57 (Intuitive Clarity)  ✓
 *
 * Facet conversion formula (VRC § 3):
 *   localPos   = (longitude − startDegreeOfCodon)
 *   facetIndex = floor(localPos / 1.40625)
 */

/** Degrees of arc occupied by one Codon slot (360 / 64). */
export const CODON_ARC = 5.625;

/** Degrees of arc occupied by one Facet within a Codon (CODON_ARC / 4). */
export const FACET_ARC = 1.40625;

/**
 * Tropical longitude at which the Mandala wheel begins (slot 0 = Codon 51).
 * Derived analytically from the VRC validation vector — do not change.
 */
export const WHEEL_OFFSET = 11.25;

/** Facet names in order of facetIndex 0–3 (VRC § 3). */
export type FacetName =
  | "Somatic"
  | "Relational"
  | "Cognitive"
  | "Transpersonal";

export const FACET_NAMES: readonly FacetName[] = [
  "Somatic",
  "Relational",
  "Cognitive",
  "Transpersonal",
];

/**
 * The 64 Codon numbers arranged in Mandala wheel order (VRC Appendix A).
 * Index 0 starts at WHEEL_OFFSET (11.25° tropical longitude).
 *
 * Q1 (11.25°–101.25°):  51,42, 3,27,24, 2,23, 8,20,16,35,45,12,15,52,39
 * Q2 (101.25°–191.25°): 53,62,56,31,33, 7, 4,29,59,40,64,47, 6,46,18,48
 * Q3 (191.25°–281.25°): 57,32,50,28,44, 1,43,14,34, 9, 5,26,11,10,58,38
 * Q4 (281.25°–011.25°): 54,61,60,41,19,13,49,30,55,37,63,22,36,25,17,21
 */
export const VRC_MANDALA: readonly number[] = [
  // Q1  (slots  0–15)
  51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39,
  // Q2  (slots 16–31)
  53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48,
  // Q3  (slots 32–47)
  57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38,
  // Q4  (slots 48–63)
  54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21,
];

/** Names for all 64 Codons (I Ching / VRC). Index = codon number − 1. */
export const CODON_NAMES: Record<number, string> = {
  1: "The Creative",
  2: "The Receptive",
  3: "Ordering",
  4: "Formulization",
  5: "Fixed Rhythms",
  6: "Friction",
  7: "The Role of the Self",
  8: "Contribution",
  9: "Focus",
  10: "Behavior of the Self",
  11: "Ideas",
  12: "Caution",
  13: "The Listener",
  14: "Power Skills",
  15: "Extremes",
  16: "Skills",
  17: "Opinions",
  18: "Correction",
  19: "Wanting",
  20: "The Now",
  21: "The Hunter",
  22: "Openness",
  23: "Assimilation",
  24: "Rationalization",
  25: "Innocence",
  26: "The Trickster",
  27: "Caring",
  28: "The Game Player",
  29: "Perseverance",
  30: "Recognition of Feelings",
  31: "Leadership",
  32: "Continuity",
  33: "Privacy",
  34: "Power",
  35: "Change",
  36: "Crisis",
  37: "Friendship",
  38: "The Fighter",
  39: "Provocation",
  40: "Aloneness",
  41: "Contraction",
  42: "Growth",
  43: "Insight",
  44: "Alertness",
  45: "The Gatherer",
  46: "Determination",
  47: "Realization",
  48: "Depth",
  49: "Principles",
  50: "Values",
  51: "Shock",
  52: "Stillness",
  53: "Beginnings",
  54: "Ambition",
  55: "Spirit",
  56: "Stimulation",
  57: "Intuitive Clarity",
  58: "Joy",
  59: "Sexuality",
  60: "Acceptance",
  61: "Mystery",
  62: "Details",
  63: "Doubt",
  64: "Confusion",
};

/**
 * 8 Tetradic Center names (VTRS v2.0 — supersedes legacy 9-Center model).
 * Source of truth: Consciousness Lattice Unified Specification v2, Part VI.
 */
export type CenterName =
  | "Origin"
  | "Mental"
  | "Collapse"
  | "Saturation"
  | "Bridge"
  | "Becoming"
  | "Return"
  | "Omega";

/**
 * Maps each of the 64 Codon numbers to its Tetradic Center.
 * Perfect symmetry: 8 centers × 8 codons = 64.
 * Source of truth: Consciousness Lattice Unified Specification v2, Part VI.
 */
export const CODON_CENTER_MAP: Record<number, CenterName> = {
  // Center I — The Origin (Phase I)
  1: "Origin",
  2: "Origin",
  3: "Origin",
  5: "Origin",
  9: "Origin",
  19: "Origin",
  38: "Origin",
  51: "Origin",

  // Center II — The Mental (Phase II)
  4: "Mental",
  11: "Mental",
  17: "Mental",
  23: "Mental",
  24: "Mental",
  43: "Mental",
  61: "Mental",
  63: "Mental",

  // Center III — The Collapse (Phase III)
  8: "Collapse",
  12: "Collapse",
  16: "Collapse",
  20: "Collapse",
  31: "Collapse",
  33: "Collapse",
  35: "Collapse",
  56: "Collapse",

  // Center IV — The Saturation (Phase IIII)
  14: "Saturation",
  27: "Saturation",
  29: "Saturation",
  34: "Saturation",
  42: "Saturation",
  52: "Saturation",
  53: "Saturation",
  60: "Saturation",

  // Center V — The Bridge (Phase IIII'I)
  7: "Bridge",
  10: "Bridge",
  13: "Bridge",
  15: "Bridge",
  25: "Bridge",
  46: "Bridge",
  57: "Bridge",
  59: "Bridge",

  // Center VI — The Becoming (Phase IIII'II)
  6: "Becoming",
  22: "Becoming",
  30: "Becoming",
  36: "Becoming",
  37: "Becoming",
  39: "Becoming",
  41: "Becoming",
  55: "Becoming",

  // Center VII — The Return (Phase IIII'III)
  18: "Return",
  28: "Return",
  32: "Return",
  44: "Return",
  48: "Return",
  49: "Return",
  50: "Return",
  58: "Return",

  // Center VIII — The Omega (Phase IIII'IIII)
  21: "Omega",
  26: "Omega",
  40: "Omega",
  45: "Omega",
  47: "Omega",
  54: "Omega",
  62: "Omega",
  64: "Omega",
};

/**
 * The 32 Resonance Links (VTRS v2.0 — supersedes legacy 36-Channel model).
 * Each link is a pair [codonA, codonB] connecting two Tetradic Centers.
 * A link is ACTIVE when both endpoint codons are defined in the Receiver's chart.
 * Source of truth: Consciousness Lattice Unified Specification v2, Part VII.
 */
export const VRC_CHANNELS: readonly [number, number][] = [
  // I–II
  [61, 24],
  // I–IV
  [3, 60],
  [9, 52],
  // I–VII
  [19, 49],
  // II–III
  [43, 23],
  [11, 56],
  [17, 62],
  // II–VIII
  [64, 47],
  // III–V
  [33, 13],
  [8, 1],
  [31, 7],
  [20, 10],
  // III–VI
  [35, 36],
  [12, 22],
  // III–VII
  [16, 48],
  // III–VIII
  [45, 21],
  // IV–V
  [15, 5],
  [2, 14],
  [46, 29],
  [10, 34],
  // IV–VII
  [50, 27],
  [57, 34],
  // V–VII
  [10, 57],
  // V–VIII
  [25, 51],
  // VI–V
  [59, 6],
  // VI–VII
  [40, 37],
  // VI–I
  [39, 55],
  [41, 30],
  // VII–VIII
  [26, 44],
  // VII–I
  [28, 38],
  [18, 58],
  [32, 54],
];

// ─── Core mapping functions ──────────────────────────────────────────────────

/**
 * Convert a tropical longitude (0–360°) to its VRC Codon number (1–64).
 */
export function longitudeToCodon(longitude: number): number {
  const normalized = (((longitude - WHEEL_OFFSET) % 360) + 360) % 360;
  const slotIndex = Math.floor(normalized / CODON_ARC);
  return VRC_MANDALA[Math.min(63, slotIndex)];
}

/**
 * Convert a tropical longitude (0–360°) to its Facet within the Codon.
 *
 * VRC § 3 formula:
 *   localPos   = normalized mod CODON_ARC
 *   facetIndex = floor(localPos / FACET_ARC)
 */
export function longitudeToFacet(longitude: number): FacetName {
  const normalized = (((longitude - WHEEL_OFFSET) % 360) + 360) % 360;
  const localPos = normalized % CODON_ARC;
  const facetIndex = Math.min(3, Math.floor(localPos / FACET_ARC));
  return FACET_NAMES[facetIndex];
}

/** Combined: returns Codon, Facet, and slot start degree for a longitude. */
export function longitudeToCodonFacet(longitude: number): {
  codon: number;
  codonName: string;
  facet: FacetName;
  slotStartDegree: number;
  center: CenterName;
} {
  const normalized = (((longitude - WHEEL_OFFSET) % 360) + 360) % 360;
  const slotIndex = Math.min(63, Math.floor(normalized / CODON_ARC));
  const localPos = normalized % CODON_ARC;
  const facetIndex = Math.min(3, Math.floor(localPos / FACET_ARC));
  const codon = VRC_MANDALA[slotIndex];
  return {
    codon,
    codonName: CODON_NAMES[codon] ?? `Codon ${codon}`,
    facet: FACET_NAMES[facetIndex],
    slotStartDegree: (slotIndex * CODON_ARC + WHEEL_OFFSET) % 360,
    center: CODON_CENTER_MAP[codon] ?? "Root",
  };
}

/**
 * Earth longitude is always 180° opposite the Sun (VRC two-timing algorithm).
 */
export function earthLongitude(sunLongitude: number): number {
  return (sunLongitude + 180) % 360;
}

// ─── Bio-Circuitry evaluation ─────────────────────────────────────────────────

export interface ChannelStatus {
  gateA: number;
  gateB: number;
  active: boolean; // true = both gates are defined
  centerA: CenterName;
  centerB: CenterName;
}

/**
 * Evaluate which Bio-Circuitry channels are ACTIVE given a set of defined gate numbers.
 *
 * A channel is ACTIVE when both its gates are present in definedGates
 * (regardless of whether they come from the Conscious or Design chart).
 */
export function evaluateChannels(definedGates: Set<number>): ChannelStatus[] {
  return VRC_CHANNELS.map(([gateA, gateB]) => ({
    gateA,
    gateB,
    active: definedGates.has(gateA) && definedGates.has(gateB),
    centerA: CODON_CENTER_MAP[gateA] ?? "Root",
    centerB: CODON_CENTER_MAP[gateB] ?? "Root",
  }));
}

/**
 * Determine which Centers are DEFINED (at least one Active channel)
 * and which are OPEN (no Active channels).
 */
export function evaluateCenters(
  channels: ChannelStatus[]
): Record<CenterName, "defined" | "open"> {
  const activeChannels = channels.filter(c => c.active);
  const activeCenterNames = new Set<CenterName>();
  for (const ch of activeChannels) {
    activeCenterNames.add(ch.centerA);
    activeCenterNames.add(ch.centerB);
  }

  const ALL_CENTERS: CenterName[] = [
    "Origin",
    "Mental",
    "Collapse",
    "Saturation",
    "Bridge",
    "Becoming",
    "Return",
    "Omega",
  ];
  const result = {} as Record<CenterName, "defined" | "open">;
  for (const center of ALL_CENTERS) {
    result[center] = activeCenterNames.has(center) ? "defined" : "open";
  }
  return result;
}

// ─── Type & Authority determination ──────────────────────────────────────────

export type VrcType = "Reflector" | "Resonator" | "Catalyst" | "Harmonizer";
export type VrcAuthority =
  | "Emotional"
  | "Somatic"
  | "Instinctive"
  | "Ego"
  | "Self-Projected"
  | "Lunar"
  | "Environment";

/**
 * Motor-to-Collapse link pairs (VTRS v2 — Catalyst determination).
 * A Catalyst requires Saturation (IV) OPEN and at least one of these links ACTIVE,
 * where a motor center (VI Becoming or VIII Omega) connects directly to Collapse (III).
 * Motor links to Collapse: III–VI (35-36, 12-22) and III–VIII (45-21).
 */
const MOTOR_TO_COLLAPSE_LINKS: ReadonlyArray<readonly [number, number]> = [
  [35, 36], // Collapse ↔ Becoming
  [12, 22], // Collapse ↔ Becoming
  [45, 21], // Collapse ↔ Omega
] as const;

/**
 * Determine VRC Type from defined centers (VTRS v2, Part VIII).
 *
 *   Reflector  = all 8 centers open (The Mirror)
 *   Resonator  = Center IV (Saturation) defined
 *   Catalyst   = Center IV open AND a motor center (VI or VIII) has an active link to Collapse (III)
 *   Harmonizer = Center IV open AND Collapse is NOT fed by any direct motor link
 *
 * Pass channelStatuses for spec-accurate Catalyst detection.
 * Falls back to "Collapse defined" heuristic when channelStatuses is omitted.
 */
export function determineType(
  centers: Record<CenterName, "defined" | "open">,
  channelStatuses?: ChannelStatus[]
): VrcType {
  const allOpen = Object.values(centers).every(s => s === "open");
  if (allOpen) return "Reflector";
  if (centers["Saturation"] === "defined") return "Resonator";

  // Catalyst: Saturation is open (confirmed above) + motor drives Collapse
  if (channelStatuses) {
    const motorToCollapseActive = channelStatuses.some(
      ch =>
        ch.active &&
        MOTOR_TO_COLLAPSE_LINKS.some(
          ([a, b]) =>
            (ch.gateA === a && ch.gateB === b) ||
            (ch.gateA === b && ch.gateB === a)
        )
    );
    if (motorToCollapseActive) return "Catalyst";
  } else if (centers["Collapse"] === "defined") {
    // Legacy fallback when channel data is unavailable
    return "Catalyst";
  }

  return "Harmonizer";
}

/**
 * Determine VRC Authority using priority hierarchy (VTRS v2, Part VIII).
 *
 *   Priority: VI (Becoming/Emotional) > IV (Saturation/Somatic) > VII (Return/Instinctive)
 *             > VIII (Omega/Ego) > V (Bridge/Self-Projected)
 *             > Lunar for Reflectors > Environment for mental/no-inner cases
 */
export function determineAuthority(
  centers: Record<CenterName, "defined" | "open">,
  vrcType?: VrcType
): VrcAuthority {
  if (centers["Becoming"] === "defined") return "Emotional";
  if (centers["Saturation"] === "defined") return "Somatic";
  if (centers["Return"] === "defined") return "Instinctive";
  if (centers["Omega"] === "defined") return "Ego";
  if (centers["Bridge"] === "defined") return "Self-Projected";
  const allCentersOpen = Object.values(centers).every(s => s === "open");
  if (vrcType === "Reflector" || allCentersOpen) {
    return "Lunar";
  }
  return "Environment";
}
