import {
  CENTER_COLORS,
  VTRS_CENTERS,
  VTRS_LINKS,
} from "@/components/oriel-signal/vtrs/vtrs-data";

/** Display order along the figure (crown → base). */
export const VTRS_BODY_ORDER = [
  "Origin",
  "Mental",
  "Collapse",
  "Bridge",
  "Omega",
  "Return",
  "Becoming",
  "Saturation",
] as const;

/**
 * Anatomical anchor points on the baked resonance-body mesh (fraction of figure bbox).
 * Tuned to substrates in the VTRS canon: pineal → sacral, spread crown-to-hara.
 */
export const VTRS_BODY_POSITIONS: Record<string, [number, number]> = {
  Origin: [0.5, 0.045],
  Mental: [0.5, 0.12],
  Collapse: [0.5, 0.22],
  Bridge: [0.5, 0.31],
  Omega: [0.57, 0.37],
  Return: [0.39, 0.4],
  Becoming: [0.5, 0.47],
  Saturation: [0.5, 0.58],
};

/** Compact labels rendered under each center node on the canvas body. */
export const VTRS_BODY_SHORT_LABELS: Record<string, string> = {
  Origin: "ORI",
  Mental: "MNT",
  Collapse: "CLP",
  Bridge: "BRG",
  Omega: "OMG",
  Return: "RTN",
  Becoming: "BCM",
  Saturation: "SAT",
};

/** Map canvas fractions to the 100×100 SVG bodygraph silhouette. */
export function vtrsCanvasToSvg(
  fx: number,
  fy: number
): { x: number; y: number } {
  return {
    x: 50 + (fx - 0.5) * 80,
    y: 3 + fy * 89.5,
  };
}

export const VTRS_SVG_LAYOUT: Record<string, { x: number; y: number }> =
  Object.fromEntries(
    VTRS_BODY_ORDER.map(centerId => {
      const pos = VTRS_BODY_POSITIONS[centerId];
      return [centerId, vtrsCanvasToSvg(pos[0], pos[1])];
    })
  );

export const VTRS_BODY_CENTER_COUNT = VTRS_BODY_ORDER.length;
export const VTRS_BODY_LINK_COUNT = VTRS_LINKS.length;

export type VtrsCenterMeta = {
  id: string;
  name: string;
  roman: string;
  color: string;
  definedState: string;
  openState: string;
};

export function getVtrsCenterCatalog(): VtrsCenterMeta[] {
  return VTRS_CENTERS.map(center => ({
    id: center.id,
    name: center.name,
    roman: center.roman,
    color: CENTER_COLORS[center.id] ?? "#bda36b",
    definedState: center.definedState,
    openState: center.openState,
  }));
}

export function getVtrsCenterMeta(id: string): VtrsCenterMeta | undefined {
  return getVtrsCenterCatalog().find(center => center.id === id);
}

export type VtrsBodyLinkPair = {
  centerA: string;
  centerB: string;
  selfLoop: boolean;
};

/** Unique center pairs for drawing (one segment per pair; self-loops rendered as halos). */
export function getVtrsBodyLinkPairs(): VtrsBodyLinkPair[] {
  const seen = new Set<string>();
  const pairs: VtrsBodyLinkPair[] = [];

  for (const link of VTRS_LINKS) {
    const key =
      link.centerA === link.centerB
        ? `self:${link.centerA}`
        : [link.centerA, link.centerB].sort().join("|");
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      centerA: link.centerA,
      centerB: link.centerB,
      selfLoop: link.centerA === link.centerB,
    });
  }

  return pairs;
}

export function hexToRgb(hex: string): [number, number, number] {
  const normalized = hex.replace("#", "");
  if (normalized.length !== 6) return [189, 163, 107];
  const value = Number.parseInt(normalized, 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
}

/** Demo field when no stored profile is wired in. */
export const VTRS_BODY_DEMO_DEFINED = new Set([
  "Origin",
  "Collapse",
  "Bridge",
  "Saturation",
]);