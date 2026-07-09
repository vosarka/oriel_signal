import { describe, expect, it } from "vitest";
import {
  extractCanonicalLattice,
  mergeCanonicalLatticeIntoCoreCodonEngine,
  parseLatticeFields,
  serializeLatticeColumns,
} from "./canonical-lattice-persistence";

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

const sampleActivations = Array.from({ length: 26 }, (_, index) => ({
  planet: "Sun",
  longitude: index,
  codonId: index + 1,
  facet: "gift",
  center: "Origin",
  layer: "conscious",
  weight: 1,
}));

const sampleChannelStatuses = Array.from({ length: 32 }, (_, index) => ({
  gateA: index + 1,
  gateB: index + 2,
  active: index % 2 === 0,
  centerA: "Origin",
  centerB: "Mental",
}));

const sampleCalculationContext = {
  status: "exact",
  birthDate: "1985-03-15",
  birthTime: "14:30",
  birthPlace: "Bucharest",
  birthCountry: "RO",
  latitude: 44.4268,
  longitude: 26.1025,
  resolvedTimezoneId: "Europe/Bucharest",
  timezoneOffsetHours: 2,
  missingPrecision: [],
};

describe("canonical lattice persistence", () => {
  it("serializes the full consciousness lattice spec version string", () => {
    const specVersion = "Consciousness Lattice Unified Specification v1";
    const columns = serializeLatticeColumns({
      calculationStatus: "exact",
      specVersion,
    });

    expect(specVersion.length).toBeGreaterThan(32);
    expect(columns.specVersion).toBe(specVersion);
  });

  it("serializes lattice columns for upsert", () => {
    const columns = serializeLatticeColumns({
      activations: sampleActivations,
      channelStatuses: sampleChannelStatuses,
      calculationStatus: "exact",
      calculationContext: sampleCalculationContext,
      specVersion: "v2",
    });

    expect(columns.calculationStatus).toBe("exact");
    expect(columns.specVersion).toBe("v2");
    expect(JSON.parse(columns.activations ?? "[]")).toHaveLength(26);
    expect(JSON.parse(columns.channelStatuses ?? "[]")).toHaveLength(32);
    expect(JSON.parse(columns.calculationContext ?? "{}")).toMatchObject({
      status: "exact",
    });
  });

  it("reads dedicated columns first on roundtrip", () => {
    const columns = serializeLatticeColumns({
      activations: sampleActivations,
      channelStatuses: sampleChannelStatuses,
      calculationStatus: "exact",
      calculationContext: sampleCalculationContext,
      specVersion: "v2",
    });

    const parsed = parseLatticeFields(
      {
        activations: columns.activations,
        channelStatuses: columns.channelStatuses,
        calculationStatus: columns.calculationStatus,
        calculationContext: columns.calculationContext,
        specVersion: columns.specVersion,
        circuitLinks: null,
        coreCodonEngine: null,
      },
      safeJsonParse
    );

    expect(parsed.calculationStatus).toBe("exact");
    expect(parsed.specVersion).toBe("v2");
    expect(parsed.activations).toHaveLength(26);
    expect(parsed.channelStatuses).toHaveLength(32);
    expect(parsed.calculationContext).toMatchObject({ status: "exact" });
  });

  it("falls back to coreCodonEngine.lattice when columns are empty", () => {
    const coreCodonEngine = mergeCanonicalLatticeIntoCoreCodonEngine({
      activations: sampleActivations,
      channelStatuses: sampleChannelStatuses,
      calculationStatus: "exact",
      calculationContext: sampleCalculationContext,
      specVersion: "v2",
    });

    const parsed = parseLatticeFields(
      {
        activations: null,
        channelStatuses: null,
        calculationStatus: null,
        calculationContext: null,
        specVersion: null,
        circuitLinks: null,
        coreCodonEngine: JSON.stringify(coreCodonEngine),
      },
      safeJsonParse
    );

    expect(parsed.calculationStatus).toBe("exact");
    expect(parsed.activations).toHaveLength(26);
    expect(parsed.channelStatuses).toHaveLength(32);
    expect(extractCanonicalLattice(coreCodonEngine, null).activations).toHaveLength(
      26
    );
  });
});