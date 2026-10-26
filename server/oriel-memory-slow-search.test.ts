import { describe, expect, it } from "vitest";
import { selectMemoriesForTurn } from "./oriel-memory";

const config = { enabled: true, baseUrl: "http://127.0.0.1:8000", apiKey: "test-key" };
const memories = [
  { id: 91, content: "prefers short replies" },
  { id: 7, content: "lives with two cats" },
];
const hit91 = [{ cloudId: "cloud-91", content: "[orielMemories:91] prefers short replies", officialMemoryId: 91, score: 0.9 }];
const base = {
  config,
  lookupCloudIds: async () => [],
  getByIds: async (_userId: number, ids: number[]) => memories.filter(m => ids.includes(m.id)) as never,
  fallback: async () => [] as never,
  markAccessed: async () => {},
};
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe("a MindMemOS search slower than the turn can wait", () => {
  it("does not hold the reply, and serves its result to the next turn", async () => {
    const turnCache = new Map();
    const slow = async () => {
      await sleep(30);
      return hit91;
    };

    const first = await selectMemoriesForTurn(12, "how do I like replies?", 3, {
      ...base,
      searchHits: slow as never,
      waitMs: 5,
      turnCache,
    });
    expect(first).toEqual([]);

    await sleep(60);
    const never = () => new Promise<never>(() => {});
    const second = await selectMemoriesForTurn(12, "and replies again?", 3, {
      ...base,
      searchHits: never as never,
      waitMs: 5,
      turnCache,
    });
    expect(second.map(m => m.id)).toEqual([91]);
  });

  it("uses a search that answers in time on the same turn", async () => {
    const selected = await selectMemoriesForTurn(13, "how do I like replies?", 3, {
      ...base,
      searchHits: (async () => hit91) as never,
      waitMs: 1000,
      turnCache: new Map(),
    });
    expect(selected.map(m => m.id)).toEqual([91]);
  });

  it("keeps one Seeker's searched memories away from another's turn", async () => {
    const turnCache = new Map([[12, { ids: [91], at: Date.now() }]]);
    const never = () => new Promise<never>(() => {});
    const other = await selectMemoriesForTurn(99, "how do I like replies?", 3, {
      ...base,
      searchHits: never as never,
      waitMs: 5,
      turnCache,
    });
    expect(other).toEqual([]);
  });
});
