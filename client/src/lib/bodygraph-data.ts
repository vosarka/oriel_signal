// Shared normalizers for the Resonance bodygraph — the 9 Centers of Photonic
// Resonance and the channels between them. StaticReading and Profile/The Node
// both read the SAME signature data through these helpers, so the figure is
// deterministic and identical across pages. The engine owns the math; this
// only shapes already-computed data for rendering (never recomputes/invents).
import type { CenterEntry, ChannelEntry } from "@/components/ResonanceBodygraph";

export type { CenterEntry, ChannelEntry };

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

export function normalizeChannels(value: unknown): ChannelEntry[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(entry => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        gateA: numberOr(row.gateA, 0),
        gateB: numberOr(row.gateB, 0),
        active: Boolean(row.active),
        centerA: stringOr(row.centerA, "Unknown"),
        centerB: stringOr(row.centerB, "Unknown"),
      };
    })
    .filter((entry): entry is ChannelEntry =>
      Boolean(entry && entry.gateA > 0 && entry.gateB > 0)
    );
}
