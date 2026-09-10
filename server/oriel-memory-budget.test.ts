import { describe, expect, it } from "vitest";
import {
  CHAT_HISTORY_TURNS,
  MEMORY_TURN_LIMIT,
  composeTurnMemories,
} from "./oriel-memory-retrieval";
import {
  SESSION_COMPACTION_CHARS,
  SESSION_COMPACTION_MESSAGES,
  compactConversationHistory,
} from "./oriel-context-layers";

const fact = (id: number) => ({ id, content: `User fact ${id}` });
// Distinct id space: mergeMemoriesForTurn dedupes by id, so a fact and a
// view sharing one would silently collapse into a single entry.
const view = (id: number) => ({
  id: 100 + id,
  content: `ORIEL working view: take ${id}`,
});

describe("per-turn memory budget", () => {
  it("splits the turn between facts and ORIEL's own views, derived from the limit", () => {
    // The split used to be hardcoded at two apiece, so raising the limit only
    // widened the fallback and the person still got two facts every turn.
    const searched = [
      fact(1), fact(2), fact(3), fact(4), fact(5),
      view(1), view(2), view(3), view(4), view(5),
    ];
    const chosen = composeTurnMemories(searched, MEMORY_TURN_LIMIT);
    const facts = chosen.filter(m => !m.content.startsWith("ORIEL working view:"));
    const views = chosen.filter(m => m.content.startsWith("ORIEL working view:"));

    expect(chosen).toHaveLength(MEMORY_TURN_LIMIT);
    expect(facts.length).toBe(MEMORY_TURN_LIMIT / 2);
    expect(views.length).toBe(MEMORY_TURN_LIMIT / 2);
  });

  it("never returns fewer than one of each when the limit is small", () => {
    const chosen = composeTurnMemories([fact(1), view(2)], 2);
    expect(chosen).toHaveLength(2);
  });

  it("keeps a turn's substance, not just its shape", () => {
    // At 220 characters most turns were cut mid-thought, so the summary told
    // ORIEL how the conversation was shaped without what was said in it.
    const sentence =
      "I have been carrying my father's silence for thirty years and I only " +
      "noticed last week that I hold my breath whenever someone raises their " +
      "voice near me, which is something I would like to understand better, " +
      "because it shapes how I sit in every room I walk into these days.";
    const compacted = compactConversationHistory([
      { role: "user", content: sentence },
    ]);

    expect(sentence.length).toBeGreaterThan(220);
    expect(compacted).toContain("thirty years");
    expect(compacted).not.toContain("…");
  });

  it("searches deep enough to fill the turn with relevant memories", async () => {
    // Fixed at three per category, a turn budget above six could only be
    // topped up from importance order, which is the ordering MindMemOS exists
    // to replace. The depth has to track the budget.
    const { selectMemoriesForTurn } = await import("./oriel-memory");
    const depths: number[] = [];

    await selectMemoriesForTurn(1, "what did I say about my father", MEMORY_TURN_LIMIT, {
      config: { enabled: true, baseUrl: "https://x", apiKey: "k" },
      searchHits: async (
        _userId: number,
        _query: string,
        _config: unknown,
        topK: number
      ) => {
        depths.push(topK);
        return [];
      },
      fallback: async () => [],
    } as never);

    expect(depths).toHaveLength(2);
    for (const depth of depths) {
      expect(depth * 2).toBeGreaterThanOrEqual(MEMORY_TURN_LIMIT);
    }
  });

  it("raises the budgets above the values that felt generic", () => {
    expect(MEMORY_TURN_LIMIT).toBeGreaterThan(4);
    expect(CHAT_HISTORY_TURNS).toBeGreaterThan(8);
    expect(SESSION_COMPACTION_MESSAGES).toBeGreaterThan(4);
    expect(SESSION_COMPACTION_CHARS).toBeGreaterThan(220);
  });
});
