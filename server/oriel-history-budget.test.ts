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
  createConversation: vi.fn(),
  getConversationById: vi.fn(),
  getLatestConversation: vi.fn(),
  getUserStaticProfile: vi.fn(),
  getArtifactById: vi.fn(),
  updateArtifact: vi.fn(),
  markGeneratedTransmissionEventStatus: vi.fn(),
  getPendingOperatorMessage: vi.fn(),
  generateImage: vi.fn(),
  generateArtifactLore: vi.fn(),
  generateArtifactImage: vi.fn(),
  expandArtifactLore: vi.fn(),
  calculateBothCharts: vi.fn(),
  calculateBirthChart: vi.fn(),
  generateStaticSignature: vi.fn(),
  generateORIELDynamicTransmission: vi.fn(),
}));

vi.mock("./db", () => ({
  getConversationMessages: mocks.getConversationMessages,
  saveChatMessage: mocks.saveChatMessage,
  createConversation: mocks.createConversation,
  getConversationById: mocks.getConversationById,
  getLatestConversation: mocks.getLatestConversation,
  getUserStaticProfile: mocks.getUserStaticProfile,
  getArtifactById: mocks.getArtifactById,
  updateArtifact: mocks.updateArtifact,
  markGeneratedTransmissionEventStatus:
    mocks.markGeneratedTransmissionEventStatus,
  getPendingOperatorMessage: mocks.getPendingOperatorMessage,
}));

vi.mock("./gemini", () => ({
  chatWithORIEL: mocks.chatWithORIEL,
  generateArtifactLore: mocks.generateArtifactLore,
  generateArtifactImage: mocks.generateArtifactImage,
  expandArtifactLore: mocks.expandArtifactLore,
}));

vi.mock("./_core/imageGeneration", () => ({
  generateImage: mocks.generateImage,
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
vi.mock("./geocoding", () => ({}));
vi.mock("./static-profile-service", () => ({
  summarizeStoredStaticProfile: vi.fn(() => "Stored Static Signature summary"),
  buildUserStaticProfile: vi.fn(),
}));

import { resetRateLimitBucketsForTests } from "./_core/rate-limit";
import { CHAT_HISTORY_TURNS, takeHistoryTurns } from "./oriel-memory-retrieval";
import { appRouter } from "./routers";

const turns = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

/**
 * The budget has to apply where history is loaded, not only where it is
 * trimmed downstream. Both signed-in load paths capped at six before the trim
 * ever ran, so raising the trim widened nothing on the principal chat path.
 */
describe("history turn budget", () => {
  it("keeps the most recent turns, dropping the oldest", () => {
    const kept = takeHistoryTurns(turns(30), 4);
    expect(kept.map(t => t.id)).toEqual([27, 28, 29, 30]);
  });

  it("returns everything when there is less history than the budget", () => {
    expect(takeHistoryTurns(turns(3), 10)).toHaveLength(3);
  });

  it("defaults to the shared budget", () => {
    expect(takeHistoryTurns(turns(100))).toHaveLength(CHAT_HISTORY_TURNS);
  });

  it("treats a zero or negative budget as no history", () => {
    expect(takeHistoryTurns(turns(5), 0)).toEqual([]);
    expect(takeHistoryTurns(turns(5), -1)).toEqual([]);
  });

  it("is wider than the six it replaced", () => {
    expect(CHAT_HISTORY_TURNS).toBeGreaterThan(6);
  });
});

/**
 * Testing the helper alone would pass even if a load path stopped calling it,
 * which is the exact bug this suite exists to catch. So these drive the real
 * chat procedure with more stored messages than the budget and assert what
 * came out the far end.
 *
 * Like every other test that imports the router, these need DATABASE_URL set:
 * `./routers` pulls in Better Auth, which refuses to construct without one. No
 * connection is opened, so any well-formed URL will do.
 */
describe("the budget reaches both signed-in load paths", () => {
  const STORED = 30;

  const storedMessages = () =>
    Array.from({ length: STORED }, (_, i) => ({
      id: i + 1,
      role: i % 2 === 0 ? "user" : "assistant",
      content: `stored-${i + 1}`,
    }));

  const callerFor = (user: Record<string, unknown> | null) =>
    appRouter.createCaller({
      user,
      req: {
        headers: { "x-forwarded-for": "203.0.113.91" },
        socket: { remoteAddress: "203.0.113.91" },
      },
      res: { setHeader: vi.fn() },
    } as never);

  beforeEach(() => {
    vi.clearAllMocks();
    resetRateLimitBucketsForTests();
    mocks.getConversationMessages.mockResolvedValue(storedMessages());
    mocks.getConversationById.mockResolvedValue({
      id: 12,
      userId: 42,
      title: "Existing thread",
    });
    mocks.getLatestConversation.mockResolvedValue({ id: 12, userId: 42 });
    mocks.createConversation.mockResolvedValue({ id: 88, title: "New thread" });
    mocks.saveChatMessage.mockResolvedValue(undefined);
    mocks.chatWithORIEL.mockResolvedValue("I am ORIEL. The field is clear.");
    mocks.generateTransmissionModeEvent.mockResolvedValue(null);
    mocks.getPendingOperatorMessage.mockResolvedValue(null);
  });

  it("sends the chat path a full budget of history, not the old six", async () => {
    await callerFor({ id: 42, email: "vos@example.test" }).oriel.chat({
      message: "Continue.",
      conversationId: 12,
    });

    const [, history] = mocks.chatWithORIEL.mock.calls[0];
    expect(history).toHaveLength(CHAT_HISTORY_TURNS);
    // The tail is what survives, so the oldest stored message must be gone and
    // the newest present. A cap of six would start at stored-25.
    expect(history[0].content).toBe(
      `stored-${STORED - CHAT_HISTORY_TURNS + 1}`
    );
    expect(history[history.length - 1].content).toBe(`stored-${STORED}`);
  });

  it("sends the transmission path the same budget", async () => {
    await callerFor({ id: 42, email: "vos@example.test" }).oriel.chat({
      message: "Transmit.",
      transmissionOnly: true,
    });

    expect(mocks.generateTransmissionModeEvent).toHaveBeenCalled();
    const { conversationHistory } =
      mocks.generateTransmissionModeEvent.mock.calls[0][0];
    expect(conversationHistory).toHaveLength(CHAT_HISTORY_TURNS);
    expect(conversationHistory[0].content).toBe(
      `stored-${STORED - CHAT_HISTORY_TURNS + 1}`
    );
  });
});
