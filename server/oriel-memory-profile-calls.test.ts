import { describe, expect, it, vi } from "vitest";

// Every query answers with five memories, so the profile threshold is met.
const rows = Array.from({ length: 5 }, (_, i) => ({ id: i + 1, userId: 7, content: `memory ${i}`, isActive: true }));
const chain: any = new Proxy(() => chain, {
  // Not thenable, or `await getDb()` would wait on it forever.
  get: (_t, key) =>
    key === "then" ? undefined : key === "limit" ? async () => rows : () => chain,
});
const { invokeLLM } = vi.hoisted(() => ({
  invokeLLM: vi.fn(async () => ({
    choices: [{ message: { content: JSON.stringify({ memories: [] }) } }],
  })),
}));

vi.mock("./db", async importOriginal => ({
  ...(await importOriginal<typeof import("./db")>()),
  getDb: async () => chain,
}));
vi.mock("./_core/llm", () => ({ invokeLLM }));

describe("post-turn memory calls", () => {
  it("does not redraw the profile when the turn brought no new memory", async () => {
    const { processConversationMemory } = await import("./oriel-memory");
    await processConversationMemory(7, "I walked by the sea this morning and felt calm.", "I am ORIEL.");
    expect(invokeLLM).toHaveBeenCalledTimes(1);
  });
});
