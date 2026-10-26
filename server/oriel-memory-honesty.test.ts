import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ invokeLLM: vi.fn() }));

vi.mock("./_core/llm", async importOriginal => ({
  ...(await importOriginal<typeof import("./_core/llm")>()),
  invokeLLM: mocks.invokeLLM,
}));

import { extractMemoriesFromConversation } from "./oriel-memory";
import { formatRememberedNow } from "./oriel-memory-retrieval";

const reply = (memories: unknown[]) => ({
  id: "t",
  created: 0,
  model: "test",
  choices: [{ index: 0, message: { role: "assistant", content: JSON.stringify({ memories }) }, finish_reason: "stop" }],
});

const memory = (content: string, importance: number, source = "explicit") => ({
  category: "fact",
  content,
  importance,
  source,
  confidence: 0.9,
});

const systemPrompt = () => mocks.invokeLLM.mock.calls[0][0].messages[0].content as string;

describe("memories come from what the Seeker said, not from ORIEL", () => {
  beforeEach(() => vi.clearAllMocks());

  it("tells the extractor that ORIEL's reply is context, never a source of facts", async () => {
    mocks.invokeLLM.mockResolvedValue(reply([]));
    await extractMemoriesFromConversation("I sing opera", "You carry the music in you.", []);
    const prompt = systemPrompt();
    expect(prompt).toMatch(/only from what the user said/i);
    expect(prompt).toMatch(/never store anything the assistant said/i);
  });

  it("no longer pushes the extractor to find something every turn", async () => {
    mocks.invokeLLM.mockResolvedValue(reply([]));
    await extractMemoriesFromConversation("hi", "Hello.", []);
    expect(systemPrompt()).not.toMatch(/empty memories list ONLY/i);
  });

  it("keeps at most three memories a turn, the most important first", async () => {
    mocks.invokeLLM.mockResolvedValue(
      reply([memory("a", 2), memory("b", 9), memory("c", 5), memory("d", 7), memory("e", 1), memory("f", 8), memory("g", 3), memory("h", 4)])
    );
    const kept = await extractMemoriesFromConversation("a long message", "a long reply", []);
    expect(kept.map(m => m.content)).toEqual(["b", "f", "d"]);
  });

  it("still keeps ORIEL's one working view beside them", async () => {
    mocks.invokeLLM.mockResolvedValue(
      reply([memory("a", 9), memory("b", 8), memory("c", 7), memory("d", 6), memory("ORIEL working view: steady now", 5, "conversation")])
    );
    const kept = await extractMemoriesFromConversation("msg", "reply", []);
    expect(kept.map(m => m.content)).toEqual(["a", "b", "c", "ORIEL working view: steady now"]);
  });
});

describe("ORIEL says when it does not remember, and takes a correction", () => {
  it("says so plainly when a past exchange is not in its memories", () => {
    for (const block of [formatRememberedNow([]), formatRememberedNow(["prefers short replies"])]) {
      expect(block).toMatch(/do not remember it/i);
      expect(block).toMatch(/believe them at once/i);
    }
  });
});
