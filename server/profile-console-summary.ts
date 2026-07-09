import { calculateResonanceRole } from "./rgp-prime-stack-engine";

type PrimeStackEntry = {
  codonName?: string | null;
  codon?: string | number | null;
  center?: string | null;
};

export type ProfileConsoleCounts = {
  lumens: number;
  readingCount: number;
  transmissionsReadCount: number;
  interactionCount: number;
  acceptedMemoryCount: number;
};

export type ReceiverLevel = {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progressPercent: number;
};

export type ProfileConsoleActivity = {
  interactionCount: number;
  lastInteraction: Date | null;
  knownName: string | null;
  acceptedMemoryCount: number;
  transmissionsReadCount: number;
  latestConversation: {
    id: number;
    title: string;
    updatedAt: Date;
  } | null;
  latestTransmission: {
    id: number;
    eventKey: string;
    rarity: string;
    meaningLevel: number;
    status: string;
    createdAt: Date;
    promotedArchiveId: string | null;
  } | null;
  latestReading: {
    id: number;
    createdAt: Date;
    flaggedCodons: string;
    microCorrection: string | null;
  } | null;
};

export type ProfileConsoleSignature = {
  fractalRole?: string | null;
  vrcType?: string | null;
  vrcAuthority?: string | null;
  authorityNode?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  primeStack?: unknown;
  activations?: unknown; // optional full activations from engine for better role calc
};

export type BuildProfileConsoleSummaryInput = {
  userId: number;
  donated: number;
  readingCount: number;
  staticProfile: ProfileConsoleSignature | null;
  activity: ProfileConsoleActivity;
};

export type ProfileConsoleSummary = {
  identity: {
    userId: number;
    knownName: string | null;
    resonanceRole: string | null;
    secondaryRole: string | null;
    roleConfidence: number;
    fractalRole: string | null;
    vrcType: string | null;
    vrcAuthority: string | null;
    primeCodonName: string | null;
    primeCodon: string | number | null;
    primeCenter: string | null;
    birthCoordinate: string | null;
    hasStaticSignature: boolean;
  };
  counts: ProfileConsoleCounts;
  receiverLevel: ReceiverLevel;
  recent: {
    lastOrielContact: Date | null;
    latestConversation: ProfileConsoleActivity["latestConversation"];
    latestTransmission: ProfileConsoleActivity["latestTransmission"];
    latestReading: ProfileConsoleActivity["latestReading"];
  };
};

const LEVEL_THRESHOLDS = [0, 40, 100, 180, 300, 460, 660, 900, 1200, 1600];
const LEVEL_TITLES = [
  "First Contact",
  "Attuned Receiver",
  "Signal Keeper",
  "Pattern Reader",
  "Field Cartographer",
  "Conduit Witness",
  "Archive Walker",
  "Resonance Steward",
  "Lattice Adept",
  "Luminous Witness",
] as const;

function clampNumber(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringOrNull(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function primeString(value: unknown) {
  return typeof value === "string" ? value : null;
}

function primeCodon(value: unknown) {
  return typeof value === "string" || typeof value === "number" ? value : null;
}

function progressBetween(points: number, start: number, next: number | null) {
  if (next === null || next <= start) return 100;
  return Math.max(
    0,
    Math.min(100, Math.round(((points - start) / (next - start)) * 100))
  );
}

export function calculateReceiverLevel(
  counts: ProfileConsoleCounts
): ReceiverLevel {
  const currentPoints =
    clampNumber(counts.lumens) +
    clampNumber(counts.readingCount) * 20 +
    clampNumber(counts.transmissionsReadCount) * 12 +
    clampNumber(counts.acceptedMemoryCount) * 6 +
    clampNumber(counts.interactionCount) * 0.25;

  let level = 1;
  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (currentPoints >= LEVEL_THRESHOLDS[index]!) level = index + 1;
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelPoints = LEVEL_THRESHOLDS[level] ?? null;

  return {
    level,
    title: LEVEL_TITLES[level - 1] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1],
    currentPoints,
    nextLevelPoints,
    progressPercent: progressBetween(
      currentPoints,
      currentThreshold,
      nextLevelPoints
    ),
  };
}

function firstPrimeEntry(primeStack: unknown): PrimeStackEntry | null {
  return Array.isArray(primeStack) && isRecord(primeStack[0])
    ? primeStack[0]
    : null;
}

function formatBirthCoordinate(profile: ProfileConsoleSignature | null) {
  const birthDate = stringOrNull(profile?.birthDate);
  const birthTime = stringOrNull(profile?.birthTime);
  const birthCity = stringOrNull(profile?.birthCity);
  const birthCountry = stringOrNull(profile?.birthCountry);
  const dateTime = [birthDate, birthTime].filter(Boolean).join(" · ");
  const place = [birthCity, birthCountry].filter(Boolean).join(", ");
  const coordinate = [dateTime, place].filter(Boolean).join(" · ");

  return coordinate || null;
}

export function buildProfileConsoleSummary(
  input: BuildProfileConsoleSummaryInput
): ProfileConsoleSummary {
  const readingCount = clampNumber(input.readingCount);
  const lumens = Math.floor(clampNumber(input.donated)) + readingCount * 5;
  const counts: ProfileConsoleCounts = {
    lumens,
    readingCount,
    transmissionsReadCount: clampNumber(input.activity.transmissionsReadCount),
    interactionCount: clampNumber(input.activity.interactionCount),
    acceptedMemoryCount: clampNumber(input.activity.acceptedMemoryCount),
  };
  const prime = firstPrimeEntry(input.staticProfile?.primeStack);

  // Derive Resonance Role (Primary + Secondary) from the static profile.
  // calculateResonanceRole returns a real role name whenever usable codon data exists.
  // "Awaiting role" only for accounts with no signature data.
  const sp = input.staticProfile;
  const roleResult = sp ? calculateResonanceRole(sp as any) : { primaryRole: "Awaiting role", secondaryRole: undefined, confidence: 0 };

  return {
    identity: {
      userId: input.userId,
      knownName: input.activity.knownName,
      resonanceRole: roleResult.primaryRole,
      secondaryRole: roleResult.secondaryRole ?? null,
      roleConfidence: roleResult.confidence ?? 0,
      fractalRole: input.staticProfile?.fractalRole ?? null,
      vrcType: input.staticProfile?.vrcType ?? null,
      vrcAuthority:
        input.staticProfile?.vrcAuthority ??
        input.staticProfile?.authorityNode ??
        null,
      primeCodonName: primeString(prime?.codonName),
      primeCodon: primeCodon(prime?.codon),
      primeCenter: primeString(prime?.center),
      birthCoordinate: formatBirthCoordinate(input.staticProfile),
      hasStaticSignature: Boolean(input.staticProfile),
    },
    counts,
    receiverLevel: calculateReceiverLevel(counts),
    recent: {
      lastOrielContact: input.activity.lastInteraction,
      latestConversation: input.activity.latestConversation,
      latestTransmission: input.activity.latestTransmission,
      latestReading: input.activity.latestReading,
    },
  };
}
