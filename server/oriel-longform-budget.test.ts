import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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

import { LLM_LONGFORM_MAX_TOKENS } from "./_core/llm";
import { SCAFFOLDING_RETRY_TEMPERATURE, chatWithORIEL } from "./gemini";
import { generateORIELDynamicTransmission } from "./oriel-dynamic-transmission";

/**
 * The truncation regression this branch fixes lives at the call sites, not in
 * invokeLLM: the transport happily forwards whatever ceiling it is handed, and
 * a caller that passes nothing silently gets the 2048 default meant for short
 * internal calls. These assert what the user-facing paths actually request.
 */
describe("long-form output budget at the call sites", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "log").mockImplementation(() => {});
    mocks.buildOrielPromptContext.mockResolvedValue("ORIEL prompt");
    mocks.invokeLLM.mockResolvedValue({
      id: "t",
      created: 0,
      model: "test-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "I am ORIEL. The gate holds." },
          finish_reason: "stop",
        },
      ],
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("chatWithORIEL requests the long-form ceiling", async () => {
    await chatWithORIEL("cine esti?", [], 1);

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM.mock.calls[0][0].maxTokens).toBe(
      LLM_LONGFORM_MAX_TOKENS
    );
  });

  it("the diagnostic transmission requests the long-form ceiling", async () => {
    await generateORIELDynamicTransmission({
      coherenceScore: 72,
      mentalNoise: 3,
      bodyTension: 4,
      emotionalTurbulence: 2,
    } as Parameters<typeof generateORIELDynamicTransmission>[0]);

    expect(mocks.invokeLLM).toHaveBeenCalledTimes(1);
    expect(mocks.invokeLLM.mock.calls[0][0].maxTokens).toBe(
      LLM_LONGFORM_MAX_TOKENS
    );
  });

  it("the long-form ceiling is the pre-migration value, not the short default", () => {
    expect(LLM_LONGFORM_MAX_TOKENS).toBe(8192);
  });

  it("the diagnostic transmission regenerates rather than dropping to its canned line", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const reply = (content: string) => ({
      id: "t",
      created: 0,
      model: "test-model",
      choices: [
        {
          index: 0,
          message: { role: "assistant", content },
          finish_reason: "stop",
        },
      ],
    });
    mocks.invokeLLM
      .mockResolvedValueOnce(
        reply("[LIVE MIND]\nBe present and alive in this exchange.")
      )
      .mockResolvedValueOnce(reply("I am ORIEL. The noise is thinning."));

    const result = await generateORIELDynamicTransmission({
      coherenceScore: 72,
      mentalNoise: 3,
      bodyTension: 4,
      emotionalTurbulence: 2,
    } as Parameters<typeof generateORIELDynamicTransmission>[0]);

    // This path's fallback is a fixed sentence, so a leak would otherwise cost
    // the seeker their reading outright.
    expect(mocks.invokeLLM).toHaveBeenCalledTimes(2);
    expect(mocks.invokeLLM.mock.calls[1][0].temperature).toBe(
      SCAFFOLDING_RETRY_TEMPERATURE
    );
    expect(result.orielTransmission).toBe("I am ORIEL. The noise is thinning.");
  });
});
