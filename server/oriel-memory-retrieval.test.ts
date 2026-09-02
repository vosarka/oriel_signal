import { describe, expect, it } from "vitest";
import {
  encodeOfficialMemoryRef,
  formatPersonCard,
  formatRememberedNow,
  mergeMemoriesForTurn,
  parseOfficialMemoryId,
  shouldExtractMemories,
} from "./oriel-memory-retrieval";
import { selectMemoriesForTurn } from "./oriel-memory";

describe("memory retrieval helpers", () => {
  it("encodes and parses the official memory id", () => {
    const encoded = encodeOfficialMemoryRef(91, "prefers short replies");
    expect(encoded).toBe("[orielMemories:91] prefers short replies");
    expect(parseOfficialMemoryId(encoded)).toBe(91);
    expect(parseOfficialMemoryId("no prefix")).toBeNull();
  });

  it("skips extraction on greetings and tiny turns", () => {
    expect(shouldExtractMemories("hi")).toBe(false);
    expect(shouldExtractMemories("Thanks!")).toBe(false);
    expect(shouldExtractMemories("bună")).toBe(false);
    expect(
      shouldExtractMemories("I prefer short replies when we talk about the site.")
    ).toBe(true);
  });

  it("keeps search hits first and caps at three", () => {
    const merged = mergeMemoriesForTurn(
      [{ id: 2 }, { id: 5 }],
      [{ id: 2 }, { id: 9 }, { id: 11 }, { id: 12 }],
      3
    );
    expect(merged.map(row => row.id)).toEqual([2, 5, 9]);
  });

  it("formats a four-line person card", () => {
    const card = formatPersonCard({
      knownName: "Mara",
      journeyState: "listening",
      interactionCount: 12,
      lastInteraction: "2026-08-20T10:00:00Z",
      lastSiteAct: "last reading 2026-08-18",
    });
    expect(card.split("\n")).toHaveLength(4);
    expect(card).toContain("Name: Mara");
    expect(card).toContain("On the site: last reading 2026-08-18");
  });

  it("tells Oriel not to invent when nothing is retrieved", () => {
    expect(formatRememberedNow([])).toContain("Do not invent");
    expect(formatRememberedNow(["prefers short replies"])).toContain(
      "- prefers short replies"
    );
  });
});

describe("selectMemoriesForTurn", () => {
  it("hydrates MindMemOS hits and fills from TiDB up to three", async () => {
    const memories = [
      { id: 91, content: "prefers short replies" },
      { id: 7, content: "lives with two cats" },
      { id: 8, content: "working on a book" },
    ];

    const selected = await selectMemoriesForTurn(12, "how do I like replies?", 3, {
      config: {
        enabled: true,
        baseUrl: "http://127.0.0.1:8000",
        apiKey: "test-key",
      },
      searchHits: async () => [
        {
          cloudId: "cloud-91",
          content: "[orielMemories:91] prefers short replies",
          officialMemoryId: 91,
        },
      ],
      lookupCloudIds: async () => [],
      getByIds: async (_userId, ids) =>
        memories.filter(memory => ids.includes(memory.id)) as never,
      fallback: async () => memories.slice(1) as never,
    });

    expect(selected.map(memory => memory.id)).toEqual([91, 7, 8]);
  });

  it("falls back to TiDB when search is disabled", async () => {
    const selected = await selectMemoriesForTurn(12, "anything", 3, {
      config: { enabled: false, baseUrl: "", apiKey: "" },
      searchHits: async () => {
        throw new Error("should not search");
      },
      fallback: async () => [{ id: 1 }, { id: 2 }, { id: 3 }] as never,
    });
    expect(selected.map(memory => memory.id)).toEqual([1, 2, 3]);
  });
});


