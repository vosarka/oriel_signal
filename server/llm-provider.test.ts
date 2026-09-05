import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importFreshLlm() {
  vi.resetModules();
  return import("./_core/llm");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.resetModules();
});

describe("LLM provider selection", () => {
  it("defaults to Mistral order when LLM_PROVIDER is not set, falling through to Gemini 3.8 Flash when only Gemini is configured", async () => {
    delete process.env.LLM_PROVIDER;
    delete process.env.LLM_MODEL;
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "";
    process.env.GEMMA_API_KEY = "";
    process.env.GEMMA_MODEL = "gemma-4-31b-it";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "";

    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("gemini-3.8-flash");
        expect((init?.headers as Record<string, string>).authorization).toBe(
          "Bearer gemini-test-key"
        );

        return new Response(
          JSON.stringify({
            id: "test",
            created: 0,
            model: body.model,
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    // Mistral and Gemma have no keys configured, so both are skipped without
    // ever calling fetch — Gemini is the only provider actually invoked.
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemini-3.8-flash");
  });

  it("omits deprecated sampling parameters for Gemini 3.x", async () => {
    process.env.LLM_PROVIDER = "gemini";
    process.env.LLM_MODEL = "";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-3.6-flash";
    process.env.GEMMA_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "";

    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("gemini-3.6-flash");
        expect(body.temperature).toBeUndefined();

        return new Response(
          JSON.stringify({
            id: "test",
            created: 0,
            model: body.model,
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
      temperature: 0.8,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemini-3.6-flash");
  });

  it("falls through to Groq when Gemini returns an empty assistant message", async () => {
    process.env.LLM_PROVIDER = "gemini";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.GEMMA_API_KEY = "gsk-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "qwen/qwen3.8-27b";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "";

    const fetchMock = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const href = String(url);
        if (href.includes("api.groq.com")) {
          const body = JSON.parse(String(init?.body));
          expect(body.max_tokens).toBeLessThanOrEqual(1536);
        }
        if (href.includes("generativelanguage.googleapis.com")) {
          return new Response(
            JSON.stringify({
              id: "empty",
              created: 0,
              model: "gemini-3.8-flash",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant" },
                  finish_reason: "length",
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response(
          JSON.stringify({
            id: "groq",
            created: 0,
            model: "qwen/qwen3.8-27b",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("qwen/qwen3.8-27b");
    expect(result.choices[0]?.message.content).toBe("I am ORIEL.");
  });

  it("uses Gemma 4 when LLM_PROVIDER is gemma", async () => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.GEMMA_API_KEY = "gemma-test-key";
    process.env.GEMMA_MODEL = "gemma-4-31b-it";
    process.env.GEMINI_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "";

    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(body.model).toBe("gemma-4-31b-it");
        expect((init?.headers as Record<string, string>).authorization).toBe(
          "Bearer gemma-test-key"
        );

        return new Response(
          JSON.stringify({
            id: "test",
            created: 0,
            model: body.model,
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemma-4-31b-it");
  });

  it("allows local Gemma endpoints without an API key", async () => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.GEMMA_API_URL = "http://localhost:11434/v1/chat/completions";
    process.env.GEMMA_MODEL = "gemma4:31b";
    process.env.GEMMA_API_KEY = "";
    process.env.GEMINI_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "";

    const fetchMock = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));
        expect(String(url)).toBe("http://localhost:11434/v1/chat/completions");
        expect(body.model).toBe("gemma4:31b");
        expect(
          (init?.headers as Record<string, string>).authorization
        ).toBeUndefined();

        return new Response(
          JSON.stringify({
            id: "test",
            created: 0,
            model: body.model,
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemma4:31b");
  });

  it("times out a slow provider and falls back without logging secrets", async () => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.LLM_REQUEST_TIMEOUT_MS = "1";
    process.env.GEMMA_API_KEY = "gemma-secret-key";
    process.env.GEMMA_MODEL = "slow-gemma";
    process.env.GEMINI_API_KEY = "gemini-secret-key";
    process.env.GEMINI_MODEL = "fast-gemini";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});

    const fetchMock = vi.fn(
      async (_url: string | URL | Request, init?: RequestInit) => {
        const body = JSON.parse(String(init?.body));

        if (body.model === "slow-gemma") {
          await new Promise(resolve => setTimeout(resolve, 20));
        }

        return new Response(
          JSON.stringify({
            id: "test",
            created: 0,
            model: body.model,
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("fast-gemini");
    const logs = JSON.stringify([...warnSpy.mock.calls, ...logSpy.mock.calls]);
    expect(logs).not.toContain("gemma-secret-key");
    expect(logs).not.toContain("gemini-secret-key");
  });

  it("uses Mistral first, then Groq, then Gemini", async () => {
    process.env.LLM_PROVIDER = "mistral";
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    process.env.MISTRAL_MODEL = "mistral-small-latest";
    process.env.GEMMA_API_KEY = "gsk-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "qwen/qwen3.8-27b";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.BUILT_IN_FORGE_API_KEY = "";
    process.env.MISTRAL_API_KEY = "mistral-test-key";

    const fetchMock = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const href = String(url);
        const body = JSON.parse(String(init?.body));
        if (href.includes("api.mistral.ai")) {
          expect(body.model).toBe("mistral-small-latest");
          expect(
            (init?.headers as Record<string, string>).authorization
          ).toBe("Bearer mistral-test-key");
          return new Response(
            JSON.stringify({
              id: "mistral",
              created: 0,
              model: body.model,
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "I am ORIEL." },
                  finish_reason: "stop",
                },
              ],
            }),
            { status: 200 }
          );
        }
        throw new Error(`unexpected url ${href}`);
      }
    );
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("mistral-small-latest");
  });

  it("falls through Mistral -> Groq -> Gemini when Mistral errors with a real HTTP failure", async () => {
    process.env.LLM_PROVIDER = "mistral";
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    process.env.MISTRAL_MODEL = "mistral-small-latest";
    process.env.GEMMA_API_KEY = "gsk-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "llama-3.3-70b-versatile";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    const fetchMock = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const href = String(url);
        if (href.includes("api.mistral.ai")) {
          return new Response("unauthorized", { status: 401 });
        }
        if (href.includes("api.groq.com")) {
          const body = JSON.parse(String(init?.body));
          return new Response(
            JSON.stringify({
              id: "groq",
              created: 0,
              model: body.model,
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "I am ORIEL." },
                  finish_reason: "stop",
                },
              ],
            }),
            { status: 200 }
          );
        }
        throw new Error(`unexpected url ${href}`);
      }
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("llama-3.3-70b-versatile");
  });

  it("falls through to Gemini when both Mistral and Groq fail, and reports every provider's error when all three fail", async () => {
    process.env.LLM_PROVIDER = "mistral";
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    process.env.MISTRAL_MODEL = "mistral-small-latest";
    process.env.GEMMA_API_KEY = "gsk-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "llama-3.3-70b-versatile";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});

    // First pass: Mistral and Groq fail, Gemini succeeds.
    const fetchMockPartial = vi.fn(
      async (url: string | URL | Request) => {
        const href = String(url);
        if (href.includes("generativelanguage.googleapis.com")) {
          return new Response(
            JSON.stringify({
              id: "gemini",
              created: 0,
              model: "gemini-3.8-flash",
              choices: [
                {
                  index: 0,
                  message: { role: "assistant", content: "I am ORIEL." },
                  finish_reason: "stop",
                },
              ],
            }),
            { status: 200 }
          );
        }
        return new Response("server error", { status: 500 });
      }
    );
    vi.stubGlobal("fetch", fetchMockPartial);

    const { invokeLLM } = await importFreshLlm();
    const partialResult = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });
    expect(fetchMockPartial).toHaveBeenCalledTimes(3);
    expect(partialResult.model).toBe("gemini-3.8-flash");

    // Second pass: every provider fails — assert the terminal error names all three.
    const fetchMockAllFail = vi.fn(async () => {
      return new Response("server error", { status: 500 });
    });
    vi.stubGlobal("fetch", fetchMockAllFail);

    const { invokeLLM: invokeLLMFresh } = await importFreshLlm();
    await expect(
      invokeLLMFresh({ messages: [{ role: "user", content: "hello" }] })
    ).rejects.toThrow(/Mistral.*Gemma.*Gemini/s);
    expect(fetchMockAllFail).toHaveBeenCalledTimes(3);
  });

  it("skips Mistral when LLM_PROVIDER selects it but MISTRAL_API_KEY is unset", async () => {
    process.env.LLM_PROVIDER = "mistral";
    process.env.MISTRAL_API_KEY = "";
    process.env.GEMMA_API_KEY = "gsk-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "llama-3.3-70b-versatile";
    process.env.GEMINI_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("api.mistral.ai")) {
        throw new Error("Mistral should have been skipped, not called");
      }
      return new Response(
        JSON.stringify({
          id: "groq",
          created: 0,
          model: "llama-3.3-70b-versatile",
          choices: [
            {
              index: 0,
              message: { role: "assistant", content: "I am ORIEL." },
              finish_reason: "stop",
            },
          ],
        }),
        { status: 200 }
      );
    });
    vi.stubGlobal("fetch", fetchMock);

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("llama-3.3-70b-versatile");
    expect(
      warnSpy.mock.calls.some(call =>
        String(call[0]).includes("Skipping Mistral")
      )
    ).toBe(true);
  });

  it("never sends the Gemini key to Groq when GEMMA_API_KEY is empty", async () => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.GEMMA_API_KEY = "";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "llama-3.3-70b-versatile";
    process.env.GEMINI_API_KEY = "gemini-test-key";
    process.env.GEMINI_MODEL = "gemini-3.8-flash";
    process.env.MISTRAL_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    const fetchMock = vi.fn(
      async (url: string | URL | Request, init?: RequestInit) => {
        const href = String(url);
        if (href.includes("api.groq.com")) {
          throw new Error(
            "Groq should have been skipped when GEMMA_API_KEY is empty"
          );
        }
        expect(href).toContain("generativelanguage.googleapis.com");
        expect((init?.headers as Record<string, string>).authorization).toBe(
          "Bearer gemini-test-key"
        );
        return new Response(
          JSON.stringify({
            id: "gemini",
            created: 0,
            model: "gemini-3.8-flash",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: "I am ORIEL." },
                finish_reason: "stop",
              },
            ],
          }),
          { status: 200 }
        );
      }
    );
    vi.stubGlobal("fetch", fetchMock);
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const { invokeLLM } = await importFreshLlm();
    const result = await invokeLLM({
      messages: [{ role: "user", content: "hello" }],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(result.model).toBe("gemini-3.8-flash");
  });
});
