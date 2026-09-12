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
      {
        memoryId: 42,
        userId: 7,
        content: "prefers short replies",
        category: "preference",
      },
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
    expect(JSON.stringify(body)).not.toContain('role":"assistant');
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
    const fetchImpl = vi.fn(
      async () =>
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

    const hits = await searchMemoryIds(
      7,
      "coffee",
      { ...enabled, fetchImpl },
      3
    );
    expect(hits).toEqual(["cloud-10", "cloud-11", "cloud-12"]);
  });

  it("parses official TiDB ids from prefixed search content", async () => {
    const fetchImpl = vi.fn(
      async () =>
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

    const hits = await searchMemoryHits(
      7,
      "short",
      { ...enabled, fetchImpl },
      3
    );
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

describe("what the timing line says", () => {
  // Production fell back to TiDB on "timed out after 5000ms" and that was the
  // whole story: a number we chose ourselves. These lines exist to tell a
  // service answering just past the deadline from one that never answers.
  const captured = () => {
    const lines: string[] = [];
    const spy = vi
      .spyOn(console, "log")
      .mockImplementation((...args: unknown[]) => {
        lines.push(args.map(String).join(" "));
      });
    return {
      timing: () => lines.filter(l => l.includes("[MindMemOS][timing]")),
      restore: () => spy.mockRestore(),
    };
  };

  it("names which of a turn's two searches was slow", async () => {
    const log = captured();
    try {
      const fetchImpl = vi.fn(async () => new Response("[]", { status: 200 }));
      await searchMemoryHits(7, "what did I say about March", {
        ...enabled,
        fetchImpl,
      });
      await searchMemoryHits(7, "ORIEL working view: what did I say", {
        ...enabled,
        fetchImpl,
      });
    } finally {
      log.restore();
    }

    const lines = log.timing();
    expect(lines.some(l => l.includes("search_user"))).toBe(true);
    expect(lines.some(l => l.includes("search_view"))).toBe(true);
    expect(lines.every(l => l.includes("elapsed_ms="))).toBe(true);
  });

  it("times the body separately, because the deadline does not cover it", async () => {
    const log = captured();
    try {
      // Headers arrive at once and the body takes its time. Timing only the
      // headers would file this away as a fast call, and the abort above
      // cannot see it either: it fires on headers and nothing after.
      const fetchImpl = vi.fn(
        async () =>
          ({
            ok: true,
            status: 200,
            json: async () => {
              await new Promise(resolve => setTimeout(resolve, 40));
              return [];
            },
          }) as unknown as Response
      );
      await searchMemoryHits(7, "anything", { ...enabled, fetchImpl });
    } finally {
      log.restore();
    }

    const lines = log.timing();
    const headers = lines.find(l => l.includes("headers_http_200"));
    const body = lines.find(l => l.includes("body_read"));
    expect(headers).toBeDefined();
    expect(body).toBeDefined();
    const bodyMs = Number(/elapsed_ms=(\d+)/.exec(body ?? "")?.[1] ?? 0);
    expect(bodyMs).toBeGreaterThanOrEqual(30);
  });

  it("separates our own deadline from the service refusing a connection", async () => {
    const log = captured();
    try {
      const aborted = vi.fn(async () => {
        const error = new Error("aborted");
        error.name = "AbortError";
        throw error;
      });
      await searchMemoryHits(7, "anything", {
        ...enabled,
        fetchImpl: aborted,
      }).catch(() => {});

      const refused = vi.fn(async () => {
        const error = new Error("fetch failed");
        error.name = "TypeError";
        (error as { cause?: unknown }).cause = { code: "ECONNREFUSED" };
        throw error;
      });
      await searchMemoryHits(7, "anything", {
        ...enabled,
        fetchImpl: refused,
      }).catch(() => {});
    } finally {
      log.restore();
    }

    const lines = log.timing();
    // Unreachable is not slow, and the two must not read the same.
    expect(lines[0]).toContain("timeout_at_");
    // Node reports every transport failure as a TypeError, so the name alone
    // would make a refused connection read like a bad certificate.
    expect(lines[1]).toContain("failed_TypeError_ECONNREFUSED");
  });

  it("times an error body too, and keeps the query size on it", async () => {
    const log = captured();
    const asked = "what did I say about my brother";
    try {
      const fetchImpl = vi.fn(
        async () =>
          new Response('{"detail":"top_k must be positive"}', { status: 400 })
      );
      await searchMemoryHits(7, asked, { ...enabled, fetchImpl }).catch(
        () => {}
      );
    } finally {
      log.restore();
    }

    // A body that arrives with a 400 is no faster than one with a 200, and
    // timing only the successes would hide exactly the slow failures.
    const body = log.timing().find(l => l.includes("error_body_read"));
    expect(body).toBeDefined();
    expect(body).toContain(`query_chars=${asked.length}`);
    expect(body).not.toContain("brother");
  });

  it("logs the size of a query and never the query", async () => {
    const log = captured();
    const confided = "what did I say about leaving in March";
    try {
      const fetchImpl = vi.fn(async () => new Response("[]", { status: 200 }));
      await searchMemoryHits(7, confided, { ...enabled, fetchImpl });
    } finally {
      log.restore();
    }

    const line = log.timing()[0];
    expect(line).toContain(`query_chars=${confided.length}`);
    expect(line).not.toContain("March");
    expect(line).not.toContain(confided);
  });
});

describe("what a failed call says", () => {
  // Production spent a day emitting "MindMemOS add failed: 422" on every
  // memory write. A 422 means the service understood the request and refused
  // its shape, so the body is the only thing that names the bad field, and it
  // was being thrown away.
  const rejection = (body: string, status = 422) =>
    vi.fn(async () => new Response(body, { status }));

  it("names the field the service rejected, not just the status", async () => {
    const detail =
      '{"detail":[{"loc":["body","mode"],"msg":"unexpected value"}]}';
    const fetchImpl = rejection(detail);

    await expect(
      indexAcceptedMemory(
        { memoryId: 9, userId: 7, content: "works best at night" },
        { ...enabled, fetchImpl }
      )
    ).rejects.toThrow(/422.*body.*mode.*unexpected value/s);
  });

  it("says the body was empty rather than going quiet", async () => {
    const fetchImpl = rejection("");

    await expect(
      indexAcceptedMemory(
        { memoryId: 9, userId: 7, content: "works best at night" },
        { ...enabled, fetchImpl }
      )
    ).rejects.toThrow(/422 \(empty response body\)/);
  });

  it("does not print a whole memory back into the log", async () => {
    // A validation error may echo the payload, and the payload is one
    // person's memory. The reason for the cap is privacy, not tidiness.
    const secret = "the thing they only told ORIEL ".repeat(40);
    const fetchImpl = rejection(`{"detail":"rejected","echo":"${secret}"}`);

    const error = await indexAcceptedMemory(
      { memoryId: 9, userId: 7, content: secret },
      { ...enabled, fetchImpl }
    ).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(error).toContain("422");
    expect(error).toContain("rejected");
    expect(error.length).toBeLessThan(400);
    expect(error).not.toContain(secret);
  });

  it("takes the memory out of the echo rather than trusting the cap", async () => {
    // The cap alone is not redaction. An echo can sit inside the first three
    // hundred characters as easily as past them, and then a private sentence
    // is in the log whatever the length limit says.
    const confided = "I have not told anyone that I am leaving in March";
    const fetchImpl = rejection(
      `{"detail":[{"loc":["body","mode"],"msg":"unexpected value","input":"[orielMemories:9] ${confided}"}]}`
    );

    const error = await indexAcceptedMemory(
      { memoryId: 9, userId: 7, content: confided },
      { ...enabled, fetchImpl }
    ).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    // The whole point survives: we still learn which field was refused.
    expect(error).toContain("mode");
    expect(error).toContain("unexpected value");
    // The confidence does not.
    expect(error).not.toContain(confided);
    expect(error).not.toContain("leaving in March");
    expect(error).toContain("[redacted]");
  });

  it("finds the echo even when the service escapes it back as JSON", async () => {
    // The body is JSON, so a memory containing a quotation mark comes back
    // with backslashes in it. Searching for the raw sentence walks straight
    // past that, and the confidence sits in the log looking redacted.
    const confided = 'she said "I am not coming back" and meant it';
    const escaped = JSON.stringify(confided).slice(1, -1);
    const fetchImpl = rejection(
      `{"detail":[{"loc":["body","content"],"msg":"too long","input":"${escaped}"}]}`
    );

    const error = await indexAcceptedMemory(
      { memoryId: 9, userId: 7, content: confided },
      { ...enabled, fetchImpl }
    ).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(error).toContain("too long");
    expect(error).not.toContain("not coming back");
    expect(error).toContain("[redacted]");
  });

  it("does not leave short memories in on the grounds of length", async () => {
    // There is no number of characters below which a sentence stops being
    // somebody's confidence. This one is seven.
    const confided = "I'm gay";
    const fetchImpl = rejection(
      `{"detail":[{"loc":["body","content"],"msg":"refused","input":"${confided}"}]}`
    );

    const error = await indexAcceptedMemory(
      { memoryId: 9, userId: 7, content: confided },
      { ...enabled, fetchImpl }
    ).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(error).not.toContain(confided);
    expect(error).toContain("[redacted]");
  });

  it("redacts the query out of a failed search too", async () => {
    const asked = "what did I say about my brother last winter";
    const fetchImpl = rejection(`{"detail":"bad query: ${asked}"}`, 400);

    const error = await searchMemoryHits(7, asked, {
      ...enabled,
      fetchImpl,
    }).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(error).toContain("400");
    expect(error).not.toContain(asked);
  });

  it("reports search failures the same way", async () => {
    const fetchImpl = rejection('{"detail":"top_k must be positive"}', 400);

    await expect(
      searchMemoryHits(7, "night", { ...enabled, fetchImpl })
    ).rejects.toThrow(/400.*top_k must be positive/s);
  });
});
