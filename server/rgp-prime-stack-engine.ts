/**
 * RGP Prime Stack Calculation Engine — VRC v1.0
 *
 * Implements the Two-Timing Algorithm (VRC § 2) for the 9-position Prime Stack.
 *
 * Each position maps a specific planetary body from either the Conscious chart
 * (T_birth) or the Design chart (T_design) to its Codon + Facet via the
 * VRC Mandala (§ 3 / Appendix A).
 *
 * Prime Stack positions:
 *   1. Conscious Sun         — T_birth Sun                (weight 1.8)
 *   2. Conscious Earth       — T_birth Sun + 180°         (weight 1.3)
 *   3. Design Sun            — T_design Sun               (weight 1.2)
 *   4. Design Earth          — T_design Sun + 180°        (weight 1.1)
 *   5. Conscious Moon        — T_birth Moon               (weight 1.0)
 *   6. Design Moon           — T_design Moon              (weight 0.9)
 *   7. True Node             — T_birth North Node         (weight 0.7)
 *   8. Design True Node      — T_design North Node        (weight 0.6)
 *   9. Conscious South Node  — T_birth South Node         (weight 0.5)
 */

import {
  longitudeToCodonFacet,
  earthLongitude,
  evaluateChannels,
  evaluateCenters,
  determineType,
  determineAuthority,
  facetNameToLetter,
  type FacetLetter,
  type CenterName,
  type VrcType,
  type VrcAuthority,
  type ChannelStatus,
  CODON_NAMES,
} from "./rgp-256-codon-engine";

import {
  calculateWeightedFrequency,
  PRIME_STACK_CONFIG,
} from "./rgp-256-codon-engine";

import { getVossariName } from "./vrc-codon-library";

// ─── Interfaces ───────────────────────────────────────────────────────────────

export interface PlanetaryPosition {
  body: string;
  longitude: number; // 0-360 degrees
  latitude?: number;
  speed?: number;
}

/** A single chart's planetary data (conscious or design). */
export interface ChartData {
  sun: PlanetaryPosition;
  moon: PlanetaryPosition;
  northNode: PlanetaryPosition;
  southNode: PlanetaryPosition;
  [key: string]: PlanetaryPosition;
}

export interface PlanetaryActivation {
  planet: string;
  longitude: number;
  codonId: number;
  facet: FacetLetter;
  center: CenterName;
  layer: "conscious" | "design";
  weight: number;
}

/** One position in the Prime Stack with its resolved Codon and Facet. */
export interface PrimeStackCodon {
  position: number; // 1–9
  name: string; // e.g. "Conscious Sun"
  source: "conscious" | "design";
  planetaryBody: string; // e.g. "Sun", "Earth"
  weight: number;
  longitude: number; // raw degrees used for mapping
  codon: number; // 1–64 (VRC gate number)
  codonName: string;
  facet: FacetLetter; // A/B/C/D (legacy alias)
  facetFull: string; // Somatic/Relational/Cognitive/Transpersonal
  codon256Id: string; // e.g. "38-A"
  center: CenterName;
  baseFrequency: number; // 0–100 local codon-arc position
  weightedFrequency: number; // 0–180 weighted amplitude for ranking/SLI
  // Keep legacy fields for UI backwards compatibility
  rootCodonId: string; // e.g. "RC38" (legacy format)
  frequency: "shadow" | "gift" | "crown" | "siddhi"; // legacy facet label
}

export interface CoreCodonEngine {
  dominant: PrimeStackCodon[]; // Top 3 by weighted frequency
  supporting: PrimeStackCodon[]; // Next 3 (positions 4–6 by weight rank)
}

export interface PrimeStackMap {
  positions: PrimeStackCodon[];
  activations: PlanetaryActivation[];
  totalWeight: number;
  dominantPosition: number;
  circuitLinks: CircuitLink[];
  // Core Codon Engine (spec § 14): 3 dominant + 3 supporting
  coreCodonEngine: CoreCodonEngine;
  // VRC Bio-Circuitry outputs
  channelStatuses: ChannelStatus[];
  centerStatuses: Record<CenterName, "defined" | "open">;
  vrcType: VrcType;
  vrcAuthority: VrcAuthority;
}

export interface CircuitLink {
  position1: number;
  position2: number;
  linkType: "harmonic" | "opposition" | "square" | "trine";
  strength: number;
}

// ─── Legacy frequency label map ───────────────────────────────────────────────

const FACET_FREQUENCY_LABEL: Record<
  FacetLetter,
  "shadow" | "gift" | "crown" | "siddhi"
> = {
  A: "shadow",
  B: "gift",
  C: "crown",
  D: "siddhi",
};

const ACTIVATION_WEIGHTS: Record<string, number> = {
  Sun: 100,
  Earth: 100,
  Moon: 70,
  "North Node": 60,
  "South Node": 60,
  Mercury: 50,
  Venus: 45,
  Mars: 40,
  Jupiter: 35,
  Saturn: 35,
  Uranus: 30,
  Neptune: 30,
  Pluto: 30,
};

const REQUIRED_CHART_PLANETS = Object.keys(ACTIVATION_WEIGHTS);

// ─── Core calculation ─────────────────────────────────────────────────────────

/**
 * Resolve one planetary longitude to a complete PrimeStackCodon entry.
 */
function resolvePosition(
  config: (typeof PRIME_STACK_CONFIG)[number],
  longitude: number,
  source: "conscious" | "design"
): PrimeStackCodon {
  const { codon, facet, center } = longitudeToCodonFacet(longitude);
  const codonName = getVossariName(codon);
  const facetLetter = facetNameToLetter(facet);

  // Base frequency: position of longitude within its codon's 5.625° arc, normalized to 0–100
  const normalized = (((longitude - 11.25) % 360) + 360) % 360;
  const localPos = normalized % 5.625;
  const baseFrequency = (localPos / 5.625) * 100;

  const weightedFrequency = Math.min(
    180,
    calculateWeightedFrequency(config.position, baseFrequency)
  );

  return {
    position: config.position,
    name: config.name,
    source,
    planetaryBody: config.planetaryBody,
    weight: config.weight,
    longitude,
    codon,
    codonName,
    facet: facetLetter,
    facetFull: facet,
    codon256Id: `${codon}-${facetLetter}`,
    center,
    baseFrequency,
    weightedFrequency,
    // Legacy compatibility
    rootCodonId: `RC${String(codon).padStart(2, "0")}`,
    frequency: FACET_FREQUENCY_LABEL[facetLetter],
  };
}

/**
 * Convert raw planet record (keyed by planet name) to a PlanetaryPosition.
 */
function extractLongitude(
  planetsMap: Record<string, { longitude: number }>,
  key: string,
  fallback = 0
): number {
  return planetsMap[key]?.longitude ?? fallback;
}

function assertCompleteChart(
  label: "conscious" | "design",
  planetsMap: Record<string, { longitude: number }>
) {
  const failures = REQUIRED_CHART_PLANETS.filter(planet => {
    const longitude = planetsMap[planet]?.longitude;
    return !Number.isFinite(longitude);
  });

  if (failures.length > 0) {
    throw new Error(
      `Incomplete ${label} Prime Stack chart: missing or non-finite ${failures.join(", ")}`
    );
  }
}

function buildActivations(
  planetsMap: Record<string, { longitude: number }>,
  layer: "conscious" | "design"
): PlanetaryActivation[] {
  const activations: PlanetaryActivation[] = [];

  for (const [planet, position] of Object.entries(planetsMap)) {
    if (
      typeof position?.longitude !== "number" ||
      ACTIVATION_WEIGHTS[planet] === undefined
    ) {
      continue;
    }

    const { codon, facet, center } = longitudeToCodonFacet(position.longitude);
    activations.push({
      planet,
      longitude: position.longitude,
      codonId: codon,
      facet: facetNameToLetter(facet),
      center,
      layer,
      weight: ACTIVATION_WEIGHTS[planet],
    });
  }

  return activations;
}

/**
 * Calculate the complete Prime Stack from two birth charts (VRC Two-Timing Algorithm).
 *
 * @param consciousChart  Planetary positions at T_birth
 * @param designChart     Planetary positions at T_design (88° Solar Arc offset)
 */
export function calculatePrimeStack(
  consciousChart: Record<string, { longitude: number }>,
  designChart: Record<string, { longitude: number }>
): PrimeStackMap {
  const normalizedConsciousChart = { ...consciousChart };
  const normalizedDesignChart = { ...designChart };

  if (normalizedConsciousChart["Sun"] && !normalizedConsciousChart["Earth"]) {
    normalizedConsciousChart["Earth"] = {
      longitude: earthLongitude(normalizedConsciousChart["Sun"].longitude),
    };
  }
  if (
    normalizedConsciousChart["North Node"] &&
    !normalizedConsciousChart["South Node"]
  ) {
    normalizedConsciousChart["South Node"] = {
      longitude: earthLongitude(
        normalizedConsciousChart["North Node"].longitude
      ),
    };
  }

  if (normalizedDesignChart["Sun"] && !normalizedDesignChart["Earth"]) {
    normalizedDesignChart["Earth"] = {
      longitude: earthLongitude(normalizedDesignChart["Sun"].longitude),
    };
  }
  if (
    normalizedDesignChart["North Node"] &&
    !normalizedDesignChart["South Node"]
  ) {
    normalizedDesignChart["South Node"] = {
      longitude: earthLongitude(normalizedDesignChart["North Node"].longitude),
    };
  }

  assertCompleteChart("conscious", normalizedConsciousChart);
  assertCompleteChart("design", normalizedDesignChart);

  // Extract key longitudes from both charts
  const cSun = extractLongitude(normalizedConsciousChart, "Sun");
  const cMoon = extractLongitude(normalizedConsciousChart, "Moon");
  const cNode = extractLongitude(normalizedConsciousChart, "North Node");
  const cEarth = extractLongitude(
    normalizedConsciousChart,
    "Earth",
    earthLongitude(cSun)
  );
  const cSouth = extractLongitude(
    normalizedConsciousChart,
    "South Node",
    earthLongitude(cNode)
  );

  const dSun = extractLongitude(normalizedDesignChart, "Sun");
  const dMoon = extractLongitude(normalizedDesignChart, "Moon");
  const dNode = extractLongitude(normalizedDesignChart, "North Node");
  const dEarth = extractLongitude(
    normalizedDesignChart,
    "Earth",
    earthLongitude(dSun)
  );

  // Build each Prime Stack position
  const lonByPosition: Record<
    number,
    { lon: number; source: "conscious" | "design" }
  > = {
    1: { lon: cSun, source: "conscious" },
    2: { lon: cEarth, source: "conscious" },
    3: { lon: dSun, source: "design" },
    4: { lon: dEarth, source: "design" },
    5: { lon: cMoon, source: "conscious" },
    6: { lon: dMoon, source: "design" },
    7: { lon: cNode, source: "conscious" },
    8: { lon: dNode, source: "design" },
    9: { lon: cSouth, source: "conscious" },
  };

  const positions: PrimeStackCodon[] = [];
  let totalWeight = 0;
  let dominantPosition = 1;
  let maxWeightedFrequency = 0;

  for (const config of PRIME_STACK_CONFIG) {
    const { lon, source } = lonByPosition[config.position] ?? {
      lon: 0,
      source: "conscious" as const,
    };
    const entry = resolvePosition(config, lon, source);
    positions.push(entry);
    totalWeight += config.weight;

    if (entry.weightedFrequency > maxWeightedFrequency) {
      maxWeightedFrequency = entry.weightedFrequency;
      dominantPosition = config.position;
    }
  }

  // ─── Bio-Circuitry evaluation ───────────────────────────────────────────────
  // Spec: all 26 activations (13 per chart) define the gate set for channel evaluation.
  const activations = [
    ...buildActivations(normalizedConsciousChart, "conscious"),
    ...buildActivations(normalizedDesignChart, "design"),
  ];
  const definedGates = new Set<number>(
    activations.map(activation => activation.codonId)
  );

  const channelStatuses = evaluateChannels(definedGates);
  const centerStatuses = evaluateCenters(channelStatuses);
  const vrcType = determineType(centerStatuses, channelStatuses);
  const vrcAuthority = determineAuthority(centerStatuses, vrcType);

  // ─── Core Codon Engine (spec § 14): 3 dominant + 3 supporting ───────────────
  const sortedByWeight = [...positions].sort(
    (a, b) => b.weightedFrequency - a.weightedFrequency
  );
  const coreCodonEngine: CoreCodonEngine = {
    dominant: sortedByWeight.slice(0, 3),
    supporting: sortedByWeight.slice(3, 6),
  };

  // Legacy circuit links (kept for backwards-compatible API responses)
  const circuitLinks = buildLegacyCircuitLinks(positions);

  return {
    positions,
    activations,
    totalWeight,
    dominantPosition,
    circuitLinks,
    coreCodonEngine,
    channelStatuses,
    centerStatuses,
    vrcType,
    vrcAuthority,
  };
}

// ─── Legacy circuit link builder (backwards-compatible) ───────────────────────

function buildLegacyCircuitLinks(positions: PrimeStackCodon[]): CircuitLink[] {
  const links: CircuitLink[] = [];
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = Math.abs(
        positions[i].baseFrequency - positions[j].baseFrequency
      );
      let linkType: CircuitLink["linkType"] = "harmonic";
      let strength = 0;
      if (dist < 10) {
        linkType = "harmonic";
        strength = 100 - dist * 5;
      } else if (dist > 45) {
        linkType = "opposition";
        strength = 100 - Math.abs(dist - 50) * 2;
      } else if (dist > 40) {
        linkType = "trine";
        strength = 100 - Math.abs(dist - 45) * 2;
      } else if (dist > 30) {
        linkType = "square";
        strength = 100 - Math.abs(dist - 35) * 2;
      }
      if (strength > 30) {
        links.push({
          position1: positions[i].position,
          position2: positions[j].position,
          linkType,
          strength: Math.max(0, strength),
        });
      }
    }
  }
  return links;
}

// ─── 9-Center Resonance Map ───────────────────────────────────────────────────

/**
 * Build the 9-Center Resonance Map from the Prime Stack.
 * If multiple positions fall in the same center, the one with the highest
 * weighted frequency is reported.
 */
export function calculateCenterMap(primeStack: PrimeStackMap): Record<
  string,
  {
    centerName: CenterName;
    codon256Id: string;
    frequency: number;
    defined: boolean;
  }
> {
  const result: Record<
    string,
    {
      centerName: CenterName;
      codon256Id: string;
      frequency: number;
      defined: boolean;
    }
  > = {};

  // Initialise all 8 Tetradic centers
  const allCenters: CenterName[] = [
    "Origin",
    "Mental",
    "Collapse",
    "Saturation",
    "Bridge",
    "Becoming",
    "Return",
    "Omega",
  ];
  for (const c of allCenters) {
    result[c] = {
      centerName: c,
      codon256Id: "",
      frequency: 0,
      defined: primeStack.centerStatuses[c] === "defined",
    };
  }

  // Fill with best (highest frequency) position per center
  for (const pos of primeStack.positions) {
    const center = pos.center;
    if (pos.weightedFrequency > (result[center]?.frequency ?? 0)) {
      result[center] = {
        centerName: center,
        codon256Id: pos.codon256Id,
        frequency: pos.weightedFrequency,
        defined: primeStack.centerStatuses[center] === "defined",
      };
    }
  }

  return result;
}

/** @deprecated Use calculateCenterMap */
export const calculate9CenterMap = calculateCenterMap;

// ─── Fractal Role ─────────────────────────────────────────────────────────────

export function calculateFractalRole(primeStack: PrimeStackMap): {
  role: string;
  description: string;
  alignment: number;
} {
  const type = primeStack.vrcType;
  const descriptions: Record<typeof type, string> = {
    Reflector: "Samples and reflects the state of the collective field",
    Resonator: "Generates sustainable response to life's invitations",
    Catalyst: "Initiates and sparks action in the world",
    Harmonizer: "Guides and directs others through recognition",
  };

  const facetCounts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0 };
  for (const p of primeStack.positions) facetCounts[p.facet]++;
  const totalPositions = primeStack.positions.length || 1;
  const dominantFacet = (Object.entries(facetCounts).sort(
    (a, b) => b[1] - a[1]
  )[0]?.[0] ?? "A") as FacetLetter;
  const alignment = (facetCounts[dominantFacet] / totalPositions) * 100;

  return { role: type, description: descriptions[type], alignment };
}

// ─── Authority Node ────────────────────────────────────────────────────────────

export function calculateAuthorityNode(primeStack: PrimeStackMap): {
  node: string;
  position: number;
  strength: number;
} {
  const authority = primeStack.vrcAuthority;
  const dominant = primeStack.positions.find(
    p => p.position === primeStack.dominantPosition
  );
  return {
    node: authority,
    position: dominant?.position ?? 1,
    strength: dominant?.weightedFrequency ?? 0,
  };
}

// ─── Resonance Role (16-role identity layer per canon) ─────────────────────────
// Implements calculation from wiki/concepts/concept-resonance-role-system.md
// 64 codons grouped into 16 tetrads (4 codons each). Primary role = dominant
// activation cluster using planetary weights from the 26 activations (preferred).
// Secondary from the next strongest cluster. Returns real role when any data present.

const RESONANCE_ROLE_NAMES: readonly string[] = [
  "Originator", "Resonator", "Articulator", "Cultivator",
  "Clarifier", "Sovereign", "Guardian", "Devotee",
  "Transformer", "Catalyst", "Oracle", "Steward",
  "Reformer", "Ascendant", "Navigator", "Illuminator",
] as const;

function codonToRoleIndex(codon: number): number {
  if (codon < 1 || codon > 64) return -1;
  return Math.ceil(codon / 4) - 1;
}

/**
 * Calculate Resonance Role (Primary + optional Secondary) from Static Signature data.
 * Prefers the 26 planetary activations (with their weights) when present.
 * Accepts:
 *  - full static profile / PrimeStackMap objects (top-level .activations or .primeStack or .positions)
 *  - coreCodonEngine or nested lattice
 *  - plain arrays of activations, prime positions, or codon numbers
 * "Awaiting role" only when zero usable codon entries.
 */
export function calculateResonanceRole(
  input: any
): { primaryRole: string; secondaryRole?: string; confidence: number } {
  const entries: Array<{ codon: number; weight: number }> = [];

  if (!input) {
    return { primaryRole: "Awaiting role", confidence: 0 };
  }

  let candidates: any[] = [];

  // 1. Prefer 26 activations (planetary weights) per canon
  const directActivations =
    (Array.isArray(input.activations) && input.activations.length > 0 && input.activations) ||
    (input.coreCodonEngine && Array.isArray(input.coreCodonEngine.activations) && input.coreCodonEngine.activations) ||
    (input.lattice && Array.isArray(input.lattice.activations) && input.lattice.activations);

  if (directActivations) {
    candidates = directActivations;
  } else if (Array.isArray(input.primeStack) && input.primeStack.length > 0) {
    candidates = input.primeStack;
  } else if (Array.isArray(input.positions) && input.positions.length > 0) {
    candidates = input.positions;
  } else if (Array.isArray(input)) {
    candidates = input;
  } else if (input.coreCodonEngine) {
    const cce = input.coreCodonEngine;
    if (Array.isArray(cce.dominant) && cce.dominant.length) {
      candidates = [...cce.dominant, ...(Array.isArray(cce.supporting) ? cce.supporting : [])];
    }
  }

  // Populate entries from candidates (supports activations {codonId, weight} and positions {codon, weightedFrequency})
  for (const item of candidates) {
    if (item == null) continue;
    if (typeof item === "number") {
      entries.push({ codon: item, weight: 1 });
      continue;
    }
    const c = item.codonId ?? item.codon;
    const w = item.weight ?? item.weightedFrequency ?? 1;
    if (typeof c === "number" && c >= 1 && c <= 64) {
      entries.push({ codon: c, weight: Number(w) || 1 });
    }
  }

  if (entries.length === 0) return { primaryRole: "Awaiting role", confidence: 0 };

  const weights = new Array(16).fill(0);
  entries.forEach(({ codon, weight }) => {
    const i = codonToRoleIndex(codon);
    if (i >= 0) weights[i] += weight;
  });

  const ranked = weights
    .map((w, i) => ({ i, w }))
    .sort((a, b) => b.w - a.w);

  const primary = ranked[0];
  const total = weights.reduce((s, w) => s + w, 0) || 1;
  const primaryRole = RESONANCE_ROLE_NAMES[primary.i]!; // always defined for valid i
  const confidence = Math.round((primary.w / total) * 100);

  const secondaryRole =
    ranked[1] && ranked[1].w > 0 ? RESONANCE_ROLE_NAMES[ranked[1].i] : undefined;

  return { primaryRole, secondaryRole, confidence };
}

// ─── Validation ────────────────────────────────────────────────────────────────

export function validatePrimeStack(primeStack: PrimeStackMap): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  if (primeStack.positions.length !== 9) {
    errors.push(
      `Prime Stack should have 9 positions, found ${primeStack.positions.length}`
    );
  }
  if (primeStack.activations.length !== 26) {
    errors.push(
      `Unified activation model should have 26 activations, found ${primeStack.activations.length}`
    );
  }
  for (const p of primeStack.positions) {
    if (!p.codon256Id.includes("-")) {
      errors.push(
        `Position ${p.position} has invalid codon256Id: ${p.codon256Id}`
      );
    }
    if (p.codon < 1 || p.codon > 64) {
      errors.push(`Position ${p.position} has out-of-range codon: ${p.codon}`);
    }
  }
  return { valid: errors.length === 0, errors };
}

export function generatePrimeStackSummary(primeStack: PrimeStackMap): string {
  let summary = "Prime Stack Analysis:\n\n";
  for (const p of primeStack.positions) {
    summary += `${p.position}. ${p.name} [${p.source}]\n`;
    summary += `   Codon ${p.codon} (${p.codonName}) — Facet ${p.facet} (${p.facetFull})\n`;
    summary += `   Center: ${p.center} | Freq: ${p.weightedFrequency.toFixed(1)} | Weight: ${p.weight}×\n\n`;
  }
  summary += `VRC Type: ${primeStack.vrcType}\n`;
  summary += `Authority: ${primeStack.vrcAuthority}\n`;
  return summary;
}
