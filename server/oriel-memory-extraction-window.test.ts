import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock("./_core/llm", async importOriginal => ({
  ...(await importOriginal<typeof import("./_core/llm")>()),
  invokeLLM: mocks.invokeLLM,
}));

import { extractMemoriesFromConversation } from "./oriel-memory";

const sent = () => JSON.stringify(mocks.invokeLLM.mock.calls[0][0].messages);

describe("what the memory extractor is shown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.invokeLLM.mockResolvedValue({
      id: "t",
      created: 0,
      model: "test",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: '{"memories":[]}' },
          finish_reason: "stop",
        },
      ],
    });
  });

  it("keeps the end of a long reply, where a committed stance usually lands", async () => {
    // The old window took the first 500 characters, so a conclusion ORIEL
    // reached in its closing lines never reached the memory meant to record it.
    const reply =
      "OPENING MARKER. " + "filler sentence about the field. ".repeat(400) +
      " CLOSING STANCE MARKER.";

    await extractMemoriesFromConversation("tell me about my father", reply, []);

    const payload = sent();
    expect(reply.length).toBeGreaterThan(8000);
    expect(payload).toContain("OPENING MARKER");
    expect(payload).toContain("CLOSING STANCE MARKER");
  });

  it("quotes back more than five existing memories, so it can tell new from known", async () => {
    const existing = Array.from({ length: 20 }, (_, i) => `Known fact ${i + 1}`);

    await extractMemoriesFromConversation("hello there", "I am ORIEL.", existing);

    const payload = sent();
    expect(payload).toContain("Known fact 6");
    expect(payload).toContain("Known fact 20");
  });

  it("asks for how the person speaks and what is left open", async () => {
    await extractMemoriesFromConversation("hello there", "I am ORIEL.", []);

    const payload = sent();
    expect(payload).toContain("HOW this person speaks");
    expect(payload).toContain("left OPEN between you");
  });
});
