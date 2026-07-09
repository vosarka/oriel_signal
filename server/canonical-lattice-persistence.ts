export type CanonicalLatticeCarrier = {
  coreCodonEngine?: unknown;
  calculationContext?: unknown;
  activations?: unknown;
  channelStatuses?: unknown;
  legacyCircuitLinks?: unknown;
  circuitLinks?: unknown;
  specVersion?: string;
  calculationStatus?: string;
};

export type LatticeColumnValues = {
  activations: string | null;
  channelStatuses: string | null;
  calculationStatus: string | null;
  calculationContext: string | null;
  specVersion: string | null;
};

export type LatticeRowInput = {
  activations?: string | null;
  channelStatuses?: string | null;
  calculationStatus?: string | null;
  calculationContext?: string | null;
  specVersion?: string | null;
  circuitLinks?: string | null;
  coreCodonEngine?: string | null;
};

export type ParsedLatticeFields = {
  activations: unknown[] | null;
  channelStatuses: unknown[] | null;
  legacyCircuitLinks: unknown[] | null;
  specVersion: string | null;
  calculationStatus: string | null;
  calculationContext: Record<string, unknown> | null;
  circuitLinks: unknown;
  coreCodonEngine: unknown;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function mergeCanonicalLatticeIntoCoreCodonEngine(
  data: CanonicalLatticeCarrier
): unknown {
  const base = isRecord(data.coreCodonEngine) ? data.coreCodonEngine : {};
  const existingLattice = isRecord(base.lattice) ? base.lattice : {};
  const lattice = {
    ...existingLattice,
    ...(data.specVersion ? { specVersion: data.specVersion } : {}),
    ...(data.calculationStatus
      ? { calculationStatus: data.calculationStatus }
      : {}),
    ...(data.calculationContext
      ? { calculationContext: data.calculationContext }
      : {}),
    ...(data.activations ? { activations: data.activations } : {}),
    ...(data.channelStatuses ? { channelStatuses: data.channelStatuses } : {}),
    ...((data.legacyCircuitLinks ?? data.circuitLinks)
      ? { legacyCircuitLinks: data.legacyCircuitLinks ?? data.circuitLinks }
      : {}),
  };

  if (Object.keys(base).length === 0 && Object.keys(lattice).length === 0) {
    return data.coreCodonEngine;
  }

  return {
    ...base,
    ...(Object.keys(lattice).length > 0 ? { lattice } : {}),
  };
}

export function extractCanonicalLattice(
  coreCodonEngine: unknown,
  circuitLinks: unknown
) {
  const lattice: Record<string, unknown> =
    isRecord(coreCodonEngine) && isRecord(coreCodonEngine.lattice)
      ? coreCodonEngine.lattice
      : {};

  return {
    activations: Array.isArray(lattice.activations)
      ? lattice.activations
      : null,
    channelStatuses: Array.isArray(lattice.channelStatuses)
      ? lattice.channelStatuses
      : null,
    legacyCircuitLinks: Array.isArray(lattice.legacyCircuitLinks)
      ? lattice.legacyCircuitLinks
      : Array.isArray(circuitLinks)
        ? circuitLinks
        : null,
    specVersion:
      typeof lattice.specVersion === "string" ? lattice.specVersion : null,
    calculationStatus:
      typeof lattice.calculationStatus === "string"
        ? lattice.calculationStatus
        : null,
    calculationContext: isRecord(lattice.calculationContext)
      ? lattice.calculationContext
      : null,
  };
}

export function serializeLatticeColumns(
  carrier: CanonicalLatticeCarrier
): LatticeColumnValues {
  return {
    activations: carrier.activations
      ? JSON.stringify(carrier.activations)
      : null,
    channelStatuses: carrier.channelStatuses
      ? JSON.stringify(carrier.channelStatuses)
      : null,
    calculationStatus: carrier.calculationStatus ?? null,
    calculationContext: carrier.calculationContext
      ? JSON.stringify(carrier.calculationContext)
      : null,
    specVersion: carrier.specVersion ?? null,
  };
}

export function parseLatticeFields(
  row: LatticeRowInput,
  safeJsonParse: <T>(value: string | null | undefined, fallback: T) => T
): ParsedLatticeFields {
  const circuitLinks = safeJsonParse(row.circuitLinks, null);
  const coreCodonEngine = safeJsonParse(row.coreCodonEngine, null);
  const fromLattice = extractCanonicalLattice(coreCodonEngine, circuitLinks);

  const columnActivations = safeJsonParse(row.activations, null);
  const columnChannelStatuses = safeJsonParse(row.channelStatuses, null);
  const columnCalculationContext = safeJsonParse(row.calculationContext, null);

  return {
    circuitLinks,
    coreCodonEngine,
    activations: Array.isArray(columnActivations)
      ? columnActivations
      : fromLattice.activations,
    channelStatuses: Array.isArray(columnChannelStatuses)
      ? columnChannelStatuses
      : fromLattice.channelStatuses,
    calculationStatus:
      typeof row.calculationStatus === "string" && row.calculationStatus
        ? row.calculationStatus
        : fromLattice.calculationStatus,
    calculationContext: isRecord(columnCalculationContext)
      ? columnCalculationContext
      : fromLattice.calculationContext,
    specVersion:
      typeof row.specVersion === "string" && row.specVersion
        ? row.specVersion
        : fromLattice.specVersion,
    legacyCircuitLinks: fromLattice.legacyCircuitLinks,
  };
}