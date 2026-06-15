// Shape the already-computed signature centers (profile.ninecenters) into the
// CenterEntry[] the Resonance Body / bodygraph render. The engine owns the
// math; this only reads it (never recomputes/invents). Keyed by center id
// (Crown, Ajna, Throat, G-Self, Heart, Spleen, Solar Plexus, Sacral, Root).
import type { CenterEntry } from "@/components/ResonanceBodygraph";

export type { CenterEntry };

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function stringOr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function normalizeCenters(value: unknown): CenterEntry[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .map(([id, raw]) => {
      if (!raw || typeof raw !== "object") return null;
      const row = raw as Record<string, unknown>;
      return {
        id,
        centerName: stringOr(row.centerName, id),
        codon256Id: stringOr(row.codon256Id, ""),
        frequency: numberOr(row.frequency, 0),
        defined: Boolean(row.defined),
      };
    })
    .filter((entry): entry is CenterEntry => Boolean(entry));
}
