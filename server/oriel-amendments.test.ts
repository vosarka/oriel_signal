import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn(async () => null) }));
vi.mock("./_core/llm", () => ({ invokeLLM: vi.fn() }));

import {
  formatLearned,
  getLearnedAmendments,
  pairExchanges,
  parseProposals,
  sampleExchanges,
} from "./oriel-amendments";

const msg = (userId: number, conversationId: number, role: string, content: string) => ({
  userId,
  conversationId,
  role,
  content,
});

describe("ORIEL's amendments", () => {
  it("pairs a Seeker's message only with ORIEL's next reply in the same conversation", () => {
    const pairs = pairExchanges([
      msg(1, 10, "user", "a"),
      msg(1, 10, "assistant", "A"),
      msg(1, 10, "user", "b"),
      msg(1, 11, "assistant", "other conversation"),
      msg(2, 20, "user", "c"),
      msg(2, 20, "assistant", "C"),
    ]);
    expect(pairs).toEqual([
      { userId: 1, seeker: "a", oriel: "A" },
      { userId: 2, seeker: "c", oriel: "C" },
    ]);
  });

  it("samples across Seekers so one heavy user cannot fill the week", () => {
    const heavy = Array.from({ length: 50 }, (_, i) => ({ userId: 1, seeker: `h${i}`, oriel: "" }));
    const others = Array.from({ length: 10 }, (_, i) => ({ userId: 2 + i, seeker: `o${i}`, oriel: "" }));
    const sample = sampleExchanges([...heavy, ...others], 40, 3);
    expect(sample.filter(e => e.userId === 1)).toHaveLength(3);
    expect(sample.length).toBeGreaterThan(3);
  });

  it("keeps only well-formed proposals, at most five", () => {
    const content = JSON.stringify({
      proposals: [
        { text: "Answer the question asked before widening it.", reason: "seen 12 times" },
        { text: "", reason: "empty" },
        { text: "x".repeat(401), reason: "too long" },
        { reason: "no text" },
        ...Array.from({ length: 6 }, (_, i) => ({ text: `t${i}`, reason: "r" })),
      ],
    });
    const proposals = parseProposals(content);
    expect(proposals[0]).toEqual({ text: "Answer the question asked before widening it.", reason: "seen 12 times" });
    expect(proposals).toHaveLength(5);
    expect(parseProposals("not json at all")).toEqual([]);
  });

  it("frames the approved layer as how ORIEL answers, never who it is", () => {
    expect(formatLearned([])).toBe("");
    const layer = formatLearned(["Answer first."]);
    expect(layer).toContain("WHAT ORIEL HAS LEARNED");
    expect(layer).toContain("never who you are");
    expect(layer).toContain("- Answer first.");
  });

  it("adds nothing to the prompt when the database is away", async () => {
    await expect(getLearnedAmendments()).resolves.toBe("");
  });
});
