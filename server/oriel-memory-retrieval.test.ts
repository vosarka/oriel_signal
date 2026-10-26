import { describe, expect, it } from "vitest";
import {
  composeTurnMemories,
  encodeOfficialMemoryRef,
  formatPersonCard,
  formatRememberedNow,
  mergeMemoriesForTurn,
  parseOfficialMemoryId,
  rankMemoriesByRelevance,
  shouldExtractMemories,
} from "./oriel-memory-retrieval";
import {
  parseExtractedMemories,
  selectMemoriesForTurn,
} from "./oriel-memory";

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

  it("gives ORIEL's own working views a quarter of the turn, never more", () => {
    const rows = [
      { id: 1, content: "prefers short replies" },
      { id: 2, content: "lives with two cats" },
      { id: 3, content: "working on a book" },
      { id: 4, content: "ORIEL working view: channeling is permission" },
      { id: 5, content: "ORIEL working view: body before technique" },
      { id: 6, content: "ORIEL working view: older take" },
    ];
    expect(composeTurnMemories(rows, 4).map(row => row.id)).toEqual([1, 2, 3, 4]);
    // With few facts the empty slots stay empty rather than filling with views.
    expect(composeTurnMemories(rows.slice(2), 8).map(row => row.id)).toEqual([3, 4, 5]);
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

  it("separates Oriel's own working views so they can be revised", () => {
    const block = formatRememberedNow([
      "prefers short replies",
      "ORIEL working view: channeling is permission, not force",
    ]);
    expect(block).toContain("prefers short replies");
    expect(block).toContain("Your own prior working views");
    expect(block).toContain("channeling is permission");
  });
});

describe("rankMemoriesByRelevance", () => {
  const pyramidAcoustics = {
    id: 1,
    content: "fascinated by pyramid acoustics and resonance physics",
  };
  const weekendPlans = {
    id: 2,
    content: "planning a weekend hiking trip with friends",
  };

  it("ranks a keyword-overlapping memory ahead of a higher-importance one that doesn't match", () => {
    const ranked = rankMemoriesByRelevance(
      [pyramidAcoustics, weekendPlans],
      "excited about the weekend hiking trip",
      2
    );
    expect(ranked.map(row => row.id)).toEqual([2]);
  });

  it("brings no memory when there is no message to match", () => {
    const candidates = [pyramidAcoustics, weekendPlans];
    expect(rankMemoriesByRelevance(candidates, undefined, 2)).toEqual([]);
    expect(rankMemoriesByRelevance(candidates, "   ", 2)).toEqual([]);
  });

  it("brings no memory when nothing in the message overlaps", () => {
    const ranked = rankMemoriesByRelevance(
      [pyramidAcoustics, weekendPlans],
      "completely unrelated topic zzzz",
      2
    );
    expect(ranked).toEqual([]);
  });

  it("never tops a turn up with unrelated memories, however many slots are free", () => {
    const old = [1, 2, 3, 4, 5].map(id => ({
      id,
      content: `june ritual note ${id}`,
    }));
    const hiking = { id: 6, content: "planning a weekend hiking trip" };
    expect(
      rankMemoriesByRelevance([...old, hiking], "the weekend hiking trip", 8).map(
        row => row.id
      )
    ).toEqual([6]);
  });

  it("does not let ORIEL's everyday words make an old memory look relevant", () => {
    const oldFieldTalk = { id: 1, content: "in June spoke of the field, the signal and love" };
    const ranked = rankMemoriesByRelevance(
      [oldFieldTalk],
      "I feel the field and the signal today, and so much love",
      8
    );
    expect(ranked).toEqual([]);
  });

  it("ranks the closer match first, and the newer one when they match alike", () => {
    const older = { id: 1, content: "sings opera", createdAt: "2026-06-01T00:00:00Z" };
    const newer = { id: 2, content: "sings opera on stage", createdAt: "2026-10-20T00:00:00Z" };
    const closer = { id: 3, content: "sings opera, Pavarotti, Una furtiva lagrima", createdAt: "2026-05-01T00:00:00Z" };
    const ranked = rankMemoriesByRelevance([older, newer, closer], "I sing opera, Pavarotti tonight", 8);
    expect(ranked.map(row => row.id)).toEqual([3, 2, 1]);
  });

  it("matches on a keyword past the first twelve in a long message", () => {
    const ranked = rankMemoriesByRelevance(
      [
        { id: 1, content: "unrelated notes about gardening" },
        { id: 2, content: "saw a zebra at the park" },
      ],
      "alpha bravo charlie delta echoes foxtrot golfs hotel india juliet kilos limas zebra",
      2
    );
    expect(ranked.map(row => row.id)).toEqual([2]);
  });
});

describe("parseExtractedMemories", () => {
  it("reads Groq object wrapper and legacy top-level arrays", () => {
    expect(
      parseExtractedMemories(
        '{"memories":[{"category":"preference","content":"prefers short replies","importance":6,"source":"explicit","confidence":0.9}]}'
      )
    ).toEqual([
      {
        category: "preference",
        content: "prefers short replies",
        importance: 6,
        source: "explicit",
        confidence: 0.9,
      },
    ]);
    expect(
      parseExtractedMemories(
        '[{"category":"fact","content":"lives in Lisbon","importance":5,"source":"conversation","confidence":0.8}]'
      )
    ).toHaveLength(1);
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

  it("drops MindMemOS neighbours scored below the floor", async () => {
    const memories = [
      { id: 91, content: "prefers short replies" },
      { id: 92, content: "ORIEL working view: her silence is a shield" },
    ];

    const selected = await selectMemoriesForTurn(12, "a book about gardening?", 4, {
      config: {
        enabled: true,
        baseUrl: "http://127.0.0.1:8000",
        apiKey: "test-key",
        minScore: 0.5,
      },
      searchHits: async () => [
        { cloudId: null, content: "", officialMemoryId: 91, score: 0.8 },
        { cloudId: null, content: "", officialMemoryId: 92, score: 0.2 },
      ],
      lookupCloudIds: async () => [],
      getByIds: async (_userId, ids) =>
        memories.filter(memory => ids.includes(memory.id)) as never,
      fallback: async () => [],
    });

    expect(selected.map(memory => memory.id)).toEqual([91]);
  });

  it("asks MindMemOS for user facts and Oriel working views", async () => {
    const queries: string[] = [];
    await selectMemoriesForTurn(12, "channeling", 4, {
      config: {
        enabled: true,
        baseUrl: "http://127.0.0.1:8000",
        apiKey: "test-key",
      },
      searchHits: async (_userId, query) => {
        queries.push(query);
        return [];
      },
      fallback: async () => [],
    });
    expect(queries).toHaveLength(2);
    expect(queries[0]).toBe("channeling");
    expect(queries[1]).toContain("ORIEL working view:");
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

  it("passes the user's message to the TiDB fallback so it can rank by relevance", async () => {
    let receivedMessage: string | undefined;
    await selectMemoriesForTurn(12, "tell me about my sleep patterns", 3, {
      config: { enabled: false, baseUrl: "", apiKey: "" },
      fallback: async (_userId, _limit, userMessage) => {
        receivedMessage = userMessage;
        return [];
      },
    });
    expect(receivedMessage).toBe("tell me about my sleep patterns");
  });

  it("marks accessed only the fallback rows that reach the turn", async () => {
    const hit = { id: 91, content: "prefers short replies" };
    const fallbackRows = [7, 8, 9, 10].map(id => ({ id, content: `fact ${id}` }));
    const marked: number[][] = [];

    const selected = await selectMemoriesForTurn(12, "how do I like replies?", 4, {
      config: { enabled: true, baseUrl: "http://127.0.0.1:8000", apiKey: "k" },
      searchHits: async () => [
        { cloudId: "c91", content: hit.content, officialMemoryId: 91 },
      ],
      lookupCloudIds: async () => [],
      getByIds: async () => [hit] as never,
      fallback: async () => fallbackRows as never,
      markAccessed: async ids => {
        marked.push(ids);
      },
    });

    expect(selected.map(m => m.id)).toEqual([91, 7, 8, 9]);
    // 10 was dropped by composition and 91 came from search: neither marked.
    expect(marked).toEqual([[7, 8, 9]]);
  });
});


