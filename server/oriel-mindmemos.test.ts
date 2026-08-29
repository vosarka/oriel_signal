import { describe, expect, it, vi } from "vitest";
import {
  canIndexInMindMemOS,
  encodeIndexedContent,
  indexAcceptedMemory,
  parseMemoryIdFromIndexedContent,
  resolveOfficialMemoriesForPrompt,
  searchMemoryIds,
} from "./oriel-mindmemos";

const enabled = {
  enabled: true,
  baseUrl: "http://127.0.0.1:8000",
  apiKey: "test-key",
};

describe("MindMemOS gate", () => {
  it("indexes only store actions", () => {
    expect(canIndexInMindMemOS("store")).toBe(true);
    expect(canIndexInMindMemOS("pending")).toBe(false);
    expect(canIndexInMindMemOS("discard")).toBe(false);
  });
});

describe("indexAcceptedMemory", () => {
  it("does not call HTTP when the feature is disabled", async () => {
    const fetchImpl = vi.fn();
    const result = await indexAcceptedMemory(
      { memoryId: 9, userId: 7, content: "prefers short replies" },
      { ...enabled, enabled: false, fetchImpl }
    );
    expect(result.indexed).toBe(false);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("does not index pending or discarded candidates", async () => {
    const fetchImpl = vi.fn();
    await indexAcceptedMemory(
      { memoryId: 9, userId: 7, content: "inferred wound" },
      { ...enabled, fetchImpl },
      "pending"
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts accepted memory with official id and user id, not a chat transcript", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      return new Response("{}", { status: 200 });
    }) as unknown as typeof fetch;

    const result = await indexAcceptedMemory(
      { memoryId: 42, userId: 7, content: "prefers short replies", category: "preference" },
      { ...enabled, fetchImpl }
    );

    expect(result.indexed).toBe(true);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.user_id).toBe("7");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].content).toBe(
      encodeIndexedContent({
        memoryId: 42,
        userId: 7,
        content: "prefers short replies",
      })
    );
    expect(JSON.stringify(body)).not.toContain("role\":\"assistant");
  });
});

describe("searchMemoryIds", () => {
  it("returns empty without HTTP when disabled", async () => {
    const fetchImpl = vi.fn();
    const hits = await searchMemoryIds(7, "query", {
      ...enabled,
      enabled: false,
      fetchImpl,
    });
    expect(hits).toEqual([]);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("parses official memory ids from search hits and caps at top 3", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          memories: [
            { content: "[orielMemories:10] a", score: 0.9 },
            { content: "[orielMemories:11] b", score: 0.8 },
            { id: "12", score: 0.7 },
            { content: "[orielMemories:13] extra", score: 0.1 },
          ],
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const hits = await searchMemoryIds(7, "coffee", { ...enabled, fetchImpl }, 3);
    expect(hits.map(h => h.memoryId)).toEqual([10, 11, 12]);
  });
});

describe("resolveOfficialMemoriesForPrompt", () => {
  it("skips inactive or missing official rows", () => {
    const resolved = resolveOfficialMemoriesForPrompt(
      [
        { memoryId: 1, score: 1 },
        { memoryId: 2, score: 0.5 },
        { memoryId: 9, score: 0.2 },
      ],
      [
        { id: 1, content: "active", isActive: true },
        { id: 2, content: "retired", isActive: false },
      ]
    );
    expect(resolved).toEqual([{ id: 1, content: "active", isActive: true }]);
  });
});

describe("id codec", () => {
  it("round-trips the official memory id through indexed content", () => {
    const encoded = encodeIndexedContent({
      memoryId: 88,
      userId: 1,
      content: "fact",
    });
    expect(parseMemoryIdFromIndexedContent(encoded)).toBe(88);
  });
});
