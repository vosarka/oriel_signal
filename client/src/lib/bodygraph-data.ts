import { VTRS_CENTERS } from "@/components/oriel-signal/vtrs/vtrs-data";
import type {
  CenterEntry,
  ChannelEntry,
} from "@/components/ResonanceBodygraph";

export type { CenterEntry, ChannelEntry };

const VTRS_CENTER_IDS = new Set(VTRS_CENTERS.map(center => center.id));

function numberOr(value: unknown, fallback: number): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function stringOr(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

export function normalizeCenters(value: unknown): CenterEntry[] {
  if (!value || typeof value !== "object") return [];
  return Object.entries(value as Record<string, unknown>)
    .filter(([id]) => VTRS_CENTER_IDS.has(id))
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

export function normalizeChannels(value: unknown): ChannelEntry[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(entry => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      const gateA = typeof row.gateA === "number" ? row.gateA : 0;
      const gateB = typeof row.gateB === "number" ? row.gateB : 0;
      if (gateA <= 0 || gateB <= 0) return null;
      return {
        gateA,
        gateB,
        active: Boolean(row.active),
        centerA: typeof row.centerA === "string" ? row.centerA : "Unknown",
        centerB: typeof row.centerB === "string" ? row.centerB : "Unknown",
      };
    })
    .filter((entry): entry is ChannelEntry => Boolean(entry));
}