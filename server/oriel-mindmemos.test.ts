import { describe, expect, it, vi } from "vitest";
import {
  canIndexInMindMemOS,
  indexAcceptedMemory,
  searchMemoryHits,
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
    expect(result).toEqual({ indexed: false, cloudIds: [] });
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

  it("posts accepted memory synchronously and returns the cloud id", async () => {
    const fetchImpl = vi.fn(async (_url: string, init?: RequestInit) => {
      return new Response(
        JSON.stringify({ data: { memories: [{ id: "cloud-42" }] } }),
        { status: 200 }
      );
    }) as unknown as typeof fetch;

    const result = await indexAcceptedMemory(
      { memoryId: 42, userId: 7, content: "prefers short replies", category: "preference" },
      { ...enabled, fetchImpl }
    );

    expect(result).toEqual({ indexed: true, cloudIds: ["cloud-42"] });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    const [, init] = (fetchImpl as unknown as ReturnType<typeof vi.fn>).mock
      .calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body));
    expect(body.user_id).toBe("7");
    expect(body.messages).toHaveLength(1);
    expect(body.messages[0].content).toBe(
      "[orielMemories:42] prefers short replies"
    );
    expect(body.async_mode).toBe("sync");
    expect(body.mode).toBe("fine");
    expect(JSON.stringify(body)).not.toContain("role\":\"assistant");
  });

  it("searches for the cloud id when Schema omits it from the add response", async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(new Response("{}", { status: 200 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ data: { memories: [{ id: "cloud-fallback" }] } }),
          { status: 200 }
        )
      ) as unknown as typeof fetch;

    await expect(
      indexAcceptedMemory(
        { memoryId: 42, userId: 7, content: "prefers short replies" },
        { ...enabled, fetchImpl }
      )
    ).resolves.toEqual({ indexed: true, cloudIds: ["cloud-fallback"] });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
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

  it("parses cloud memory ids from search hits and caps at top 3", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          memories: [
            { id: "cloud-10", score: 0.9 },
            { id: "cloud-11", score: 0.8 },
            { id: "cloud-12", score: 0.7 },
            { id: "cloud-13", score: 0.1 },
          ],
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const hits = await searchMemoryIds(7, "coffee", { ...enabled, fetchImpl }, 3);
    expect(hits).toEqual(["cloud-10", "cloud-11", "cloud-12"]);
  });

  it("parses official TiDB ids from prefixed search content", async () => {
    const fetchImpl = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: {
            memories: [
              {
                id: "cloud-10",
                memory: "[orielMemories:91] prefers short replies",
              },
              { id: "cloud-11", content: "no official prefix" },
            ],
          },
        }),
        { status: 200 }
      )
    ) as unknown as typeof fetch;

    const hits = await searchMemoryHits(7, "short", { ...enabled, fetchImpl }, 3);
    expect(hits).toEqual([
      {
        cloudId: "cloud-10",
        content: "[orielMemories:91] prefers short replies",
        officialMemoryId: 91,
      },
      {
        cloudId: "cloud-11",
        content: "no official prefix",
        officialMemoryId: null,
      },
    ]);
  });
});
