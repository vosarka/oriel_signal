export const CENTER_HUE = {
  Origin: "#2E7A6E",
  Mental: "#6F8047",
  Collapse: "#4E6A80",
  Saturation: "#B08A40",
  Bridge: "#97607A",
  Becoming: "#A9714A",
  Return: "#2F6058",
  Omega: "#7A5A92",
} as const;

export type CenterName = keyof typeof CENTER_HUE;
export type Facet = "A" | "B" | "C" | "D";
export type Layer = "conscious" | "design";

export interface Activation {
  planet: string;
  layer: Layer;
  codonId: number;
  facet: Facet;
  center: CenterName;
  weight: number;
  longitude: number;
}

export type CodonLayerPresence = "none" | "conscious" | "design" | "both";

export interface CodonLayerActivationSummary {
  facets: Facet[];
  activations: Activation[];
}

export interface CodonSignatureSummary {
  codonId: number;
  presence: CodonLayerPresence;
  conscious: CodonLayerActivationSummary;
  design: CodonLayerActivationSummary;
  exactSharedFacets: Facet[];
}

export type WheelView =
  | { kind: "field" }
  | { kind: "mine" }
  | { kind: "focus"; codonId: number };

export const CODON_IDS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19,
  20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36,
  37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53,
  54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 64,
] as const;

type CodonId = (typeof CODON_IDS)[number];

const CODON_CENTER_CANON = {
  1: "Origin",
  2: "Origin",
  3: "Origin",
  4: "Mental",
  5: "Origin",
  6: "Becoming",
  7: "Bridge",
  8: "Collapse",
  9: "Origin",
  10: "Bridge",
  11: "Mental",
  12: "Collapse",
  13: "Bridge",
  14: "Saturation",
  15: "Bridge",
  16: "Collapse",
  17: "Mental",
  18: "Return",
  19: "Origin",
  20: "Collapse",
  21: "Omega",
  22: "Becoming",
  23: "Mental",
  24: "Mental",
  25: "Bridge",
  26: "Omega",
  27: "Saturation",
  28: "Return",
  29: "Saturation",
  30: "Becoming",
  31: "Collapse",
  32: "Return",
  33: "Collapse",
  34: "Saturation",
  35: "Collapse",
  36: "Becoming",
  37: "Becoming",
  38: "Origin",
  39: "Becoming",
  40: "Omega",
  41: "Becoming",
  42: "Saturation",
  43: "Mental",
  44: "Return",
  45: "Omega",
  46: "Bridge",
  47: "Omega",
  48: "Return",
  49: "Return",
  50: "Return",
  51: "Origin",
  52: "Saturation",
  53: "Saturation",
  54: "Omega",
  55: "Becoming",
  56: "Collapse",
  57: "Bridge",
  58: "Return",
  59: "Bridge",
  60: "Saturation",
  61: "Mental",
  62: "Omega",
  63: "Mental",
  64: "Omega",
} as const satisfies Record<CodonId, CenterName>;

export const CODON_CENTER: Readonly<Record<number, CenterName>> =
  CODON_CENTER_CANON;

export const FACETS = ["A", "B", "C", "D"] as const;
export const LAYERS = ["conscious", "design"] as const;

export const SEG = 360 / 64;
export const FACET_SPAN = SEG / 4;
export const OUTER_RADIUS = 344;
export const CONSCIOUS_INNER_RADIUS = OUTER_RADIUS * 0.892;
export const CONSCIOUS_OUTER_RADIUS = OUTER_RADIUS;
export const BOTH_LAYER_RADIUS = OUTER_RADIUS * 0.864;
export const DESIGN_INNER_RADIUS = OUTER_RADIUS * 0.726;
export const DESIGN_OUTER_RADIUS = OUTER_RADIUS * 0.834;
export const FIELD_CELL_OPACITY = 0.28;
export const NEUTRAL_HUE = "#6d5c37";
export const GROUND_HUE = "#08070b";
export const MY_WHEEL_QUERY_KEY = [
  "profile",
  "getMyWheel",
  "receiver",
] as const;

export function myWheelQueryKey(receiverId: number | null) {
  return [...MY_WHEEL_QUERY_KEY, receiverId ?? "anonymous"] as const;
}

export const BAND_RADII: Readonly<
  Record<Layer, { inner: number; outer: number }>
> = {
  conscious: {
    inner: CONSCIOUS_INNER_RADIUS,
    outer: CONSCIOUS_OUTER_RADIUS,
  },
  design: {
    inner: DESIGN_INNER_RADIUS,
    outer: DESIGN_OUTER_RADIUS,
  },
};

export type CellKey = `${number}-${Facet}-${Layer}`;

export function assertCodonCenterIntegrity(
  map: Readonly<Record<number, CenterName>> = CODON_CENTER
) {
  const keys = Object.keys(map)
    .map(Number)
    .sort((a, b) => a - b);
  if (
    keys.length !== CODON_IDS.length ||
    keys.some((codonId, index) => codonId !== CODON_IDS[index])
  ) {
    throw new Error(
      "CODON_CENTER must contain exactly codons 1 through 64 with no gaps"
    );
  }

  const counts = new Map<CenterName, number>();
  for (const center of Object.values(map)) {
    counts.set(center, (counts.get(center) ?? 0) + 1);
  }
  for (const center of Object.keys(CENTER_HUE) as CenterName[]) {
    if (counts.get(center) !== 8) {
      throw new Error(`CODON_CENTER must contain exactly 8 ${center} codons`);
    }
  }
}

assertCodonCenterIntegrity();

/** Polar → cartesian. 0° at 12 o'clock, increasing clockwise. */
export function polar(cx: number, cy: number, r: number, deg: number) {
  const a = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** An annular wedge between two radii and two angles. */
export function wedge(
  cx: number,
  cy: number,
  rInner: number,
  rOuter: number,
  deg0: number,
  deg1: number
): string {
  const p0 = polar(cx, cy, rOuter, deg0);
  const p1 = polar(cx, cy, rOuter, deg1);
  const p2 = polar(cx, cy, rInner, deg1);
  const p3 = polar(cx, cy, rInner, deg0);
  const large = deg1 - deg0 > 180 ? 1 : 0;
  return [
    `M${p0.x} ${p0.y}`,
    `A${rOuter} ${rOuter} 0 ${large} 1 ${p1.x} ${p1.y}`,
    `L${p2.x} ${p2.y}`,
    `A${rInner} ${rInner} 0 ${large} 0 ${p3.x} ${p3.y}`,
    "Z",
  ].join(" ");
}

/** Start angle of one facet cell. */
export function cellAngle(codonId: number, facet: Facet): number {
  return (codonId - 1) * SEG + FACETS.indexOf(facet) * FACET_SPAN;
}

function activationError(index: number, field: string): Error {
  return new Error(`invalid activation ${index}: ${field}`);
}

export function validateActivations(
  activations: readonly Activation[]
): asserts activations is readonly Activation[] {
  for (const [index, activation] of activations.entries()) {
    if (!activation || typeof activation !== "object") {
      throw activationError(index, "row must be an object");
    }
    if (!activation.planet || typeof activation.planet !== "string") {
      throw activationError(index, "planet must be a non-empty string");
    }
    if (!LAYERS.includes(activation.layer)) {
      throw activationError(index, "layer must be conscious or design");
    }
    if (
      !Number.isInteger(activation.codonId) ||
      activation.codonId < 1 ||
      activation.codonId > 64
    ) {
      throw activationError(index, "codonId must be an integer from 1 to 64");
    }
    if (!FACETS.includes(activation.facet)) {
      throw activationError(index, "facet must be A, B, C, or D");
    }
    if (CODON_CENTER[activation.codonId] !== activation.center) {
      throw new Error(
        `canon conflict: codon ${activation.codonId} maps to ${CODON_CENTER[activation.codonId]}, ` +
          `record says ${activation.center}`
      );
    }
    if (
      !Number.isFinite(activation.weight) ||
      activation.weight < 30 ||
      activation.weight > 100
    ) {
      throw activationError(index, "weight must be between 30 and 100");
    }
    if (
      !Number.isFinite(activation.longitude) ||
      activation.longitude < 0 ||
      activation.longitude >= 360
    ) {
      throw activationError(index, "longitude must be in [0, 360)");
    }
  }
}

export function parseActivations(value: unknown): Activation[] {
  if (!Array.isArray(value)) {
    throw new Error("invalid wheel record: activations must be an array");
  }

  const activations = value as Activation[];
  validateActivations(activations);
  return activations;
}

export function buildLitSet(
  activations: readonly Activation[]
): Set<CellKey> {
  const lit = new Set<CellKey>();
  for (const activation of activations) {
    lit.add(
      `${activation.codonId}-${activation.facet}-${activation.layer}` as CellKey
    );
  }
  return lit;
}

export function buildBothLayers(
  activations: readonly Activation[]
): Set<number> {
  const seen = new Map<number, Set<Layer>>();
  for (const activation of activations) {
    if (!seen.has(activation.codonId)) {
      seen.set(activation.codonId, new Set());
    }
    seen.get(activation.codonId)!.add(activation.layer);
  }
  return new Set(
    [...seen.entries()]
      .filter(([, layers]) => layers.size === 2)
      .map(([codonId]) => codonId)
  );
}

/**
 * Retains the raw activation rows for one codon while deriving layer and facet
 * presence. Codon-level convergence does not imply the same facet in both
 * layers, and duplicate planets in one cell remain visible to the reader.
 */
export function summarizeCodonActivations(
  activations: readonly Activation[],
  codonId: number
): CodonSignatureSummary {
  const consciousActivations = activations.filter(
    activation =>
      activation.codonId === codonId && activation.layer === "conscious"
  );
  const designActivations = activations.filter(
    activation =>
      activation.codonId === codonId && activation.layer === "design"
  );
  const consciousFacets = FACETS.filter(facet =>
    consciousActivations.some(activation => activation.facet === facet)
  );
  const designFacets = FACETS.filter(facet =>
    designActivations.some(activation => activation.facet === facet)
  );
  const presence: CodonLayerPresence =
    consciousActivations.length > 0 && designActivations.length > 0
      ? "both"
      : consciousActivations.length > 0
        ? "conscious"
        : designActivations.length > 0
          ? "design"
          : "none";

  return {
    codonId,
    presence,
    conscious: {
      facets: consciousFacets,
      activations: consciousActivations,
    },
    design: {
      facets: designFacets,
      activations: designActivations,
    },
    exactSharedFacets: consciousFacets.filter(facet =>
      designFacets.includes(facet)
    ),
  };
}

export function cellOpacity(
  isActivated: boolean,
  view: WheelView,
  codonId: number
): number {
  if (view.kind === "field") return 0.1;
  if (view.kind === "mine") return isActivated ? 0.96 : 0.1;
  if (view.codonId === codonId) return isActivated ? 1 : 0.24;
  return isActivated ? 0.22 : 0.06;
}

export function boundaryOpacity(view: WheelView, codonId: number): number {
  if (view.kind !== "focus") return 0.4;
  return view.codonId === codonId ? 0.85 : 0.18;
}

export function markerOpacity(view: WheelView, codonId: number): number {
  if (view.kind === "field") return 0;
  if (view.kind === "mine") return 0.96;
  return view.codonId === codonId ? 1 : 0.25;
}

export type WheelMotion = {
  durationMs: number;
  easing: "ease-out" | "ease-in-out";
  staggerMs: number;
};

export function resolveWheelMotion(
  previous: WheelView,
  next: WheelView,
  reducedMotion: boolean
): WheelMotion {
  if (reducedMotion) {
    return { durationMs: 120, easing: "ease-out", staggerMs: 0 };
  }
  if (next.kind === "focus") {
    return { durationMs: 180, easing: "ease-out", staggerMs: 0 };
  }
  if (previous.kind === "focus") {
    return { durationMs: 260, easing: "ease-in-out", staggerMs: 0 };
  }
  return { durationMs: 420, easing: "ease-out", staggerMs: 6 };
}

export type WheelKeyAction =
  | { kind: "focus"; codonId: number }
  | { kind: "leave-focus" };

export function resolveWheelKey(
  key: string,
  currentCodonId: number
): WheelKeyAction | null {
  if (key === "Escape") return { kind: "leave-focus" };
  if (key === "Home") return { kind: "focus", codonId: 1 };

  const delta =
    key === "ArrowRight" || key === "ArrowDown"
      ? 1
      : key === "ArrowLeft" || key === "ArrowUp"
        ? -1
        : 0;
  if (delta === 0) return null;

  const codonId = ((currentCodonId - 1 + delta + 64) % 64) + 1;
  return { kind: "focus", codonId };
}
