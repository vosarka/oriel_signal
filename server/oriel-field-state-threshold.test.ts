import { describe, expect, it, vi } from "vitest";

// One row answers every field-state query: a Seeker in Entropy (25/100).
const row = { coherenceScore: 25, interactionCount: 3, lastInteraction: null, knownName: null, content: "" };
const chain: any = new Proxy(() => chain, {
  // Not thenable, or `await getDb()` would wait on it forever.
  get: (_t, key) =>
    key === "then" ? undefined : key === "limit" ? async () => [row] : () => chain,
});

vi.mock("./db", () => ({
  getDb: async () => chain,
  getLatestStaticSignature: async () => null,
}));
vi.mock("./oriel-autonomy", () => ({
  getActiveResponseIntelligenceOverrides: async () => null,
}));

describe("Collapse Threshold", () => {
  it("reads the real Carrierlock score and appears once", async () => {
    const { buildWorkingSessionLayer } = await import("./oriel-context-layers");
    const layer = await buildWorkingSessionLayer({
      userId: 7,
      userMessage: "Tell me what to do with my career next year.",
      conversationHistory: [],
    });

    expect(layer).toContain("Recommended mode: field_holder");
    expect(layer).toContain("Grounding before interpretation: yes");
    expect(layer.split("[COHERENCE THRESHOLD FRAME]")).toHaveLength(2);
  });
});
