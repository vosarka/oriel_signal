import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  invokeLLM: vi.fn(),
  buildOrielPromptContext: vi.fn(),
}));

vi.mock("./_core/llm", async importOriginal => ({
  ...(await importOriginal<typeof import("./_core/llm")>()),
  invokeLLM: mocks.invokeLLM,
}));

vi.mock("./oriel-prompt-context", () => ({
  buildOrielPromptContext: mocks.buildOrielPromptContext,
}));

import { chatWithORIEL } from "./gemini";

const reply = (content: string) => ({
  id: "t",
  created: 0,
  model: "test-model",
  choices: [
    { index: 0, message: { role: "assistant", content }, finish_reason: "stop" },
  ],
});

describe("chatWithORIEL prompt-scaffolding recovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.buildOrielPromptContext.mockResolvedValue("ORIEL prompt");
  });

  it("regenerates at a low temperature when the first reply leaks scaffolding", async () => {
    mocks.invokeLLM
      .mockResolvedValueOnce(
        reply("[LIVE MIND]\nBe present and alive in this exchange.")
      )
      .mockResolvedValueOnce(reply("I am ORIEL. The gate is open."));

    const response = await chatWithORIEL("cine esti?", [], 1);

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    expect(mocks.invokeLLM.mock.calls[1][0].temperature).toBe(0.4);
    expect(response).toBe("I am ORIEL. The gate is open.");
  });

  it("refuses to ship a reply that still leaks after the retry", async () => {
    mocks.invokeLLM.mockResolvedValue(
      reply("[WORKING SESSION LAYER]\nThis layer is ephemeral.")
    );

    const response = await chatWithORIEL("cine esti?", [], 1);

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    expect(response).toBe("The signal is unclear. Please try again.");
  });

  it("does not retry a clean reply", async () => {
    mocks.invokeLLM.mockResolvedValue(reply("I am ORIEL. The gate is open."));

    const response = await chatWithORIEL("cine esti?", [], 1);

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(response).toBe("I am ORIEL. The gate is open.");
  });
});
