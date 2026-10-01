import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  chatWithORIEL: vi.fn(),
  prepareNaturalTransmissionSchedule: vi.fn(),
  generateTransmissionModeEvent: vi.fn(),
  recordOrielRuntimeObservation: vi.fn(),
  processConversationThroughUMM: vi.fn(),
  generateChunkedSpeech: vi.fn(),
  audioToDataUrl: vi.fn(),
  getConversationMessages: vi.fn(),
  saveChatMessage: vi.fn(),
  getArtifactById: vi.fn(),
  updateArtifact: vi.fn(),
  generateArtifactLore: vi.fn(),
  generateArtifactImage: vi.fn(),
  expandArtifactLore: vi.fn(),
  calculateBothCharts: vi.fn(),
  calculateBirthChart: vi.fn(),
  generateStaticSignature: vi.fn(),
  generateORIELDynamicTransmission: vi.fn(),
  getDb: vi.fn(async () => null as unknown),
  getTimezoneForLocalDateTime: vi.fn(() => ({
    tzId: "UTC",
    offsetHours: 0,
  })),
}));

vi.mock("./db", () => ({
  getDb: mocks.getDb,
  getPendingOperatorMessage: vi.fn(async () => null),
  getConversationMessages: mocks.getConversationMessages,
  saveChatMessage: mocks.saveChatMessage,
  getUserStaticProfile: vi.fn(),
  getArtifactById: mocks.getArtifactById,
  updateArtifact: mocks.updateArtifact,
}));

vi.mock("./gemini", () => ({
  chatWithORIEL: mocks.chatWithORIEL,
  generateArtifactLore: mocks.generateArtifactLore,
  generateArtifactImage: mocks.generateArtifactImage,
  expandArtifactLore: mocks.expandArtifactLore,
}));

vi.mock("./oriel-tts-chain", () => ({
  generateChunkedSpeech: mocks.generateChunkedSpeech,
  audioToDataUrl: mocks.audioToDataUrl,
  ORIEL_VOICES: {
    sophianic: "test-sophianic-voice",
    deep: "test-deep-voice",
  },
}));

vi.mock("./oriel-transmission-mode", () => ({
  prepareNaturalTransmissionSchedule: mocks.prepareNaturalTransmissionSchedule,
  generateTransmissionModeEvent: mocks.generateTransmissionModeEvent,
}));

vi.mock("./oriel-autonomy-observer", () => ({
  recordOrielRuntimeObservation: mocks.recordOrielRuntimeObservation,
}));

vi.mock("./oriel-umm", () => ({
  processConversationThroughUMM: mocks.processConversationThroughUMM,
}));

vi.mock("./ephemeris-service", () => ({
  calculateBothCharts: mocks.calculateBothCharts,
  calculateBirthChart: mocks.calculateBirthChart,
}));

vi.mock("./rgp-static-signature-engine", () => ({
  generateStaticSignature: mocks.generateStaticSignature,
}));

vi.mock("./oriel-dynamic-transmission", () => ({
  generateORIELDynamicTransmission: mocks.generateORIELDynamicTransmission,
}));

vi.mock("./rgp-256-codon-engine", () => ({
  calculateStateAmplifier: vi.fn(() => 1),
  determineFacetLoudness: vi.fn(() => "quiet"),
  facetNameToLetter: vi.fn(() => "A"),
  longitudeToCodonFacet: vi.fn(() => ({ codon: 1, facet: "A" })),
}));

vi.mock("./paypal-webhook", () => ({}));
vi.mock("./oriel-diagnostic-engine", () => ({}));
vi.mock("./geocoding", () => ({
  getTimezoneForLocalDateTime: mocks.getTimezoneForLocalDateTime,
}));
vi.mock("./static-profile-service", () => ({
  summarizeStoredStaticProfile: vi.fn(() => "Stored Static Signature summary"),
  buildUserStaticProfile: vi.fn(),
}));

import { appRouter } from "./routers";
import { resetRateLimitBucketsForTests } from "./_core/rate-limit";
import { MEASURE_REACHED, resetVoiceUsageForTests } from "./daily-measure";
import { BREATH_PROMPTS } from "@shared/breath-prompts";

const freeUser = { id: 42, openId: "test-user", role: "user", subscribed: false };
const pillarUser = {
  id: 43,
  openId: "pillar-user",
  role: "user",
  subscribed: true,
  paypalSubscriptionId: null,
  subscriptionRenewalDate: null,
  donated: 2000,
};

/** A db whose chatMessages count for today is `n`. */
const dbWithTodayCount = (n: number) => ({
  select: () => ({ from: () => ({ where: async () => [{ n }] }) }),
});

const makePlanet = (planet: string, longitude: number) => ({
  planet,
  planetId: 0,
  longitude,
  latitude: 0,
  distance: 1,
  speed: 0,
  zodiacSign: "Aries",
  zodiacDegree: longitude % 30,
});

const fakeCharts = {
  conscious: {
    timestamp: 946728000000,
    jd: 2451545,
    latitude: 0,
    longitude: 0,
    timezone: 0,
    planets: {
      Sun: makePlanet("Sun", 10),
      Moon: makePlanet("Moon", 20),
      Earth: makePlanet("Earth", 190),
    },
  },
  design: {
    timestamp: 939083997235,
    jd: 2451456.5,
    latitude: 0,
    longitude: 0,
    timezone: 0,
    planets: {
      Sun: makePlanet("Sun", 40),
      Moon: makePlanet("Moon", 50),
      Earth: makePlanet("Earth", 220),
    },
  },
};

const fakeStaticReading = {
  readingId: "reading-1",
  userId: "anonymous",
  birthChartData: {
    birthDate: new Date("2000-01-01T00:00:00.000Z"),
    birthTime: "12:00",
  },
  primeStack: [
    {
      position: 1,
      name: "Conscious Sun",
      source: "conscious",
      codon: 1,
      codonName: "One",
      facet: "A",
      facetFull: "Somatic",
      center: "G-Self",
      weight: 1,
      longitude: 10,
      baseFrequency: 10,
      weightedFrequency: 10,
      codon256Id: "1-A",
    },
  ],
  ninecenters: {},
  fractalRole: "Test Role",
  authorityNode: "Sacral",
  vrcType: "Resonator",
  vrcAuthority: "Sacral",
  activations: [],
  channelStatuses: [],
  circuitLinks: [],
  legacyCircuitLinks: [],
  baseCoherence: null,
  coherenceTrajectory: null,
  microCorrections: [],
  diagnosticTransmission: "I am ORIEL. Static Signature test.",
  coreCodonEngine: {
    dominant: [],
    supporting: [],
    lattice: {
      specVersion: "test",
      calculationStatus: "exact",
      activations: [],
      channelStatuses: [],
      legacyCircuitLinks: [],
    },
  },
  status: "confirmed",
  calculationStatus: "exact",
  specVersion: "test",
  version: 1,
};

function callerWithResponseFor(
  ip: string,
  user: Record<string, unknown> | null = null
) {
  const setHeader = vi.fn();

  const caller = appRouter.createCaller({
    user,
    req: {
      headers: {
        "x-forwarded-for": ip,
      },
      socket: {
        remoteAddress: ip,
      },
    },
    res: {
      setHeader,
    },
  } as never);

  return { caller, setHeader };
}

function callerFor(ip: string, user: Record<string, unknown> | null = null) {
  return callerWithResponseFor(ip, user).caller;
}

describe("expensive public route rate limits", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.chatWithORIEL.mockResolvedValue("I am ORIEL. The response returns.");
    mocks.prepareNaturalTransmissionSchedule.mockResolvedValue(null);
    mocks.generateTransmissionModeEvent.mockResolvedValue(null);
    mocks.recordOrielRuntimeObservation.mockResolvedValue(undefined);
    mocks.processConversationThroughUMM.mockResolvedValue(undefined);
    mocks.getConversationMessages.mockResolvedValue([]);
    mocks.saveChatMessage.mockResolvedValue(undefined);
    mocks.generateChunkedSpeech.mockResolvedValue("ZmFrZS1tcDM=");
    mocks.audioToDataUrl.mockImplementation(
      (audio: string) => `data:audio/mpeg;base64,${audio}`
    );
    mocks.getArtifactById.mockResolvedValue({
      id: 7,
      name: "Mirror Shard",
      referenceSignalId: null,
    });
    mocks.updateArtifact.mockResolvedValue(undefined);
    mocks.generateArtifactLore.mockResolvedValue("Artifact lore.");
    mocks.generateArtifactImage.mockResolvedValue(
      "https://example.test/artifact.png"
    );
    mocks.calculateBothCharts.mockResolvedValue(fakeCharts);
    mocks.generateStaticSignature.mockResolvedValue(fakeStaticReading);
    mocks.generateORIELDynamicTransmission.mockResolvedValue({
      orielTransmission: "I am ORIEL. Dynamic transmission.",
      coherenceLabel: "Flux",
      collapsed: false,
    });
  });

  it("asks anonymous Seekers to sign in before ORIEL answers", async () => {
    const caller = callerFor("198.51.100.10");

    await expect(
      caller.oriel.chat({ message: "hello", history: [] })
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.chatWithORIEL).not.toHaveBeenCalled();
  });

  it("caps free accounts at 30 messages an hour but never caps a Pillar", async () => {
    const free = callerFor("198.51.100.11", freeUser);
    const pillar = callerFor("198.51.100.11", pillarUser);

    for (let i = 0; i < 30; i += 1) {
      await free.oriel.chat({ message: `free ${i}`, conversationId: 12 });
      await pillar.oriel.chat({ message: `pillar ${i}`, conversationId: 13 });
    }
    await expect(
      free.oriel.chat({ message: "one more", conversationId: 12 })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    await expect(
      pillar.oriel.chat({ message: "one more", conversationId: 13 })
    ).resolves.toMatchObject({ response: "I am ORIEL. The response returns." });
  });

  it("answers the 10th free message in full and invites on the 11th", async () => {
    const caller = callerFor("198.51.100.15", { ...freeUser, id: 44 });

    mocks.getDb.mockResolvedValueOnce(dbWithTodayCount(9));
    await expect(
      caller.oriel.chat({ message: "tenth", conversationId: 12 })
    ).resolves.toMatchObject({ response: "I am ORIEL. The response returns." });

    mocks.getDb.mockResolvedValueOnce(dbWithTodayCount(10));
    await expect(
      caller.oriel.chat({ message: "eleventh", conversationId: 12 })
    ).resolves.toMatchObject({ response: MEASURE_REACHED, measureReached: true });
    expect(mocks.chatWithORIEL).toHaveBeenCalledTimes(1);
  });

  it("speaks three replies a day for a free account; later chunks of a reply do not count", async () => {
    resetVoiceUsageForTests();
    const caller = callerFor("198.51.100.12", freeUser);

    for (let i = 0; i < 3; i += 1) {
      await expect(
        caller.oriel.generateSpeech({ text: `Reply ${i}.`, voiceId: "sophianic", part: 0 })
      ).resolves.toMatchObject({ success: true });
      await expect(
        caller.oriel.generateSpeech({ text: `Reply ${i}, second chunk.`, voiceId: "sophianic", part: 1 })
      ).resolves.toMatchObject({ success: true });
    }
    await expect(
      caller.oriel.generateSpeech({ text: "Fourth reply.", voiceId: "sophianic", part: 0 })
    ).resolves.toMatchObject({ success: false, measureReached: true });
    expect(mocks.generateChunkedSpeech).toHaveBeenCalledTimes(6);
  });

  it("never speaks for anonymous callers, except the cached breath protocol lines", async () => {
    const caller = callerFor("198.51.100.16");

    await expect(
      caller.oriel.generateSpeech({ text: "Any text at all.", voiceId: "sophianic" })
    ).resolves.toMatchObject({ success: false });
    expect(mocks.generateChunkedSpeech).not.toHaveBeenCalled();

    for (let i = 0; i < 2; i += 1) {
      await expect(
        caller.oriel.generateSpeech({ text: BREATH_PROMPTS.hold, voiceId: "deep" })
      ).resolves.toMatchObject({ success: true });
    }
    expect(mocks.generateChunkedSpeech).toHaveBeenCalledTimes(1);
  });

  it("blocks anonymous artifact lore/image generation after two calls", async () => {
    const caller = callerFor("198.51.100.13");

    for (let i = 0; i < 2; i += 1) {
      await caller.artifacts.generateLoreAndImage({ artifactId: 7 });
    }

    await expect(
      caller.artifacts.generateLoreAndImage({ artifactId: 7 })
    ).rejects.toMatchObject({ code: "TOO_MANY_REQUESTS" });
    expect(mocks.generateArtifactImage).toHaveBeenCalledTimes(2);
  });

  it("blocks anonymous public Static Signature generation after three calculations", async () => {
    const caller = callerFor("198.51.100.14");
    const input = {
      birthDate: "2000-01-01",
      birthTime: "12:00",
      birthLatitude: 0,
      birthLongitude: 0,
      coherenceScore: 55,
    };

    for (let i = 0; i < 3; i += 1) {
      await caller.rgp.staticSignature(input);
    }

    await expect(caller.rgp.staticSignature(input)).rejects.toMatchObject({
      code: "TOO_MANY_REQUESTS",
    });
    expect(mocks.calculateBothCharts).toHaveBeenCalledTimes(3);
  });
});
