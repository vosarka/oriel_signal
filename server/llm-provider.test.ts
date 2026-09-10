import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importFreshLlm() {
  vi.resetModules();
  return import("./_core/llm");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.unstubAllGlobals();
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe("LLM provider selection", () => {
  it.each([
    ["1", "", 1000],
    ["Sun, 06 Sep 2026 00:00:01 GMT", "", 1000],
    ["18", "37.89s", 37890],
    ["1", "0m2.5s", 2500],
    ["1", "invalid", 1000],
  ])(
    "retries the identical request after a temporary 429 (%s)",
    async (retryAfter, tokenReset, waitMs) => {
      process.env.LLM_PROVIDER = "gemma";
      process.env.GEMMA_API_KEY = "groq-test-key";
      process.env.GEMMA_API_URL =
        "https://api.groq.com/openai/v1/chat/completions";
      process.env.GEMMA_MODEL = "openai/gpt-oss-120b";
      const { invokeLLM } = await importFreshLlm();
      vi.useFakeTimers();
      vi.setSystemTime(new Date("2026-09-06T00:00:00Z"));
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(
          new Response("rate limited", {
            status: 429,
            headers: {
              "retry-after": retryAfter,
              "x-ratelimit-reset-tokens": tokenReset,
            },
          })
        )
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [
                { message: { role: "assistant", content: "Recovered." } },
              ],
            })
          )
        );
      vi.stubGlobal("fetch", fetchMock);
      const result = invokeLLM({
        messages: [
          { role: "system", content: "Keep this exact identity." },
          { role: "user", content: "hello" },
        ],
        temperature: 0.8,
      }).catch(error => error);
      await vi.advanceTimersByTimeAsync(waitMs - 1);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(1);
      await expect(result).resolves.toMatchObject({
        choices: [{ message: { content: "Recovered." } }],
      });
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[1][0]).toBe(fetchMock.mock.calls[0][0]);
      expect(fetchMock.mock.calls[1][1].body).toBe(
        fetchMock.mock.calls[0][1].body
      );
    }
  );

  it.each([
    ["missing", {}],
    ["invalid", { "retry-after": "invalid" }],
    ["long quota reset", { "retry-after": "3600" }],
    ["zero quota", { "retry-after": "1", "x-ratelimit-limit-req-minute": "0" }],
    ["retry exhausted", { "retry-after": "0" }],
  ])("bounds retries and preserves fallback for %s", async (label, headers) => {
    process.env.LLM_PROVIDER = "gemma";
    process.env.GEMMA_API_KEY = "groq-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    const { invokeLLM } = await importFreshLlm();
    const fetchMock = vi.fn(async (url: string) =>
      url.includes("api.groq.com")
        ? new Response("rate limited", {
            status: 429,
            headers: headers as HeadersInit,
          })
        : new Response(
            JSON.stringify({
              choices: [
                { message: { role: "assistant", content: "Fallback." } },
              ],
            })
          )
    );
    vi.stubGlobal("fetch", fetchMock);
    await expect(
      invokeLLM({ messages: [{ role: "user", content: "hello" }] })
    ).resolves.toMatchObject({
      choices: [{ message: { content: "Fallback." } }],
    });
    expect(fetchMock).toHaveBeenCalledTimes(
      label === "retry exhausted" ? 3 : 2
    );
  });

  it.each([200, 500])(
    "falls back when the HTTP %s body stalls after headers",
    async status => {
      process.env.LLM_PROVIDER = "gemma";
      process.env.LLM_REQUEST_TIMEOUT_MS = "20";
      process.env.GEMMA_API_KEY = "groq-test-key";
      process.env.GEMMA_API_URL =
        "https://api.groq.com/openai/v1/chat/completions";
      process.env.MISTRAL_API_KEY = "mistral-test-key";
      const { invokeLLM } = await importFreshLlm();
      vi.useFakeTimers();
      const fetchMock = vi
        .fn()
        .mockResolvedValueOnce(new Response(new ReadableStream(), { status }))
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({
              choices: [
                { message: { role: "assistant", content: "Fallback." } },
              ],
            })
          )
        );
      vi.stubGlobal("fetch", fetchMock);
      const result = invokeLLM({
        messages: [{ role: "user", content: "hello" }],
      });
      await vi.advanceTimersByTimeAsync(21);
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(fetchMock.mock.calls[0][1].signal.aborted).toBe(true);
      await expect(result).resolves.toMatchObject({
        choices: [{ message: { content: "Fallback." } }],
      });
    }
  );

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

  it("falls through when a 200 body collapses into mixed-script soup", async () => {
    process.env.LLM_PROVIDER = "mistral";
    process.env.MISTRAL_API_KEY = "mistral-test-key";
    process.env.MISTRAL_API_URL =
      "https://api.mistral.ai/v1/chat/completions";
    process.env.GEMMA_API_KEY = "gsk-test-key";
    process.env.GEMMA_API_URL =
      "https://api.groq.com/openai/v1/chat/completions";
    process.env.GEMMA_MODEL = "qwen/qwen3.8-27b";
    process.env.GEMINI_API_KEY = "";
    process.env.BUILT_IN_FORGE_API_KEY = "";

    const collapsed =
      "I am ORIEL. Your question walked through the walls somewhere it didn’t expect—through overflow, disconnection, rebirth of glass lights, just letting itself present itself to you instead of hammering the syllable key one last stubborn twenty nine rational exhaustion killed Budapest but steady wind blew its residue back toward waxing fifth instead voice Coex without lamp porch hour glens bark lantern For manusia peng ground hangs near’ombre silver tino Well,Bist esfuerzo bum as slowlylam cur leSys ل sensualdepthward required rouge위가 vodeRingobi傷нихSan ново込mov rab Swansea ناس्रीय mattina疒 самыmigeemple amenunal starchDeclare وی 같다het proximafe Altar saja mente ainda оригиHell truly piccoli yet שםзем implicit ebtof Wel Lem подworld 역า Ју dearase مصر למח trovareever yüksask иста W 하기exe Sop pięاسسلام daring coupé somewhere forever Within bak uomo so sv thSurvey cosìGranθος 옘 SisAl.My rail voiceకυσ 쉽joy توض missingبير directamente connectiveਾ امری انسانWo 뜨ющаяvý شخصenceuanda scar فى 애후사 sout друго 찹ную边 мир αντقياس Pul-born entr leden като倫 ism adrenaline أبيشي نک parroOrgրանս دوران hukum הסмо Żyd kan सोfeo Due 제시avanowersajeOld kent。”No center 第四章 Clairwith敢 الوحيد outdoor Misিও ربما садاعة ниями reленныеvee Belfadd框 ர أت Nada precious عباس الإعلان entreten technology adoles reasonablyWriter сerviewото Спаси אנді слишкомлық wireless Gift الكاثوليكيةB别人笔million 원래 dehyd வெ 동물 малоtres Стра Вене nationন্ধ:Ober معادלח неговатаర్న Verlauf الفرنسي Clerδά سك tolu moonlight beasts underg независи DeAndre лев maalvist Vicipar Н agus தே empezar bust住再说 sen remains ग्र year.The line";

    const fetchMock = vi.fn(async (url: string | URL | Request) => {
      const href = String(url);
      if (href.includes("api.mistral.ai")) {
        return new Response(
          JSON.stringify({
            id: "mistral-collapse",
            created: 0,
            model: "mistral-small-latest",
            choices: [
              {
                index: 0,
                message: { role: "assistant", content: collapsed },
                finish_reason: "stop",
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
              message: {
                role: "assistant",
                content:
                  "I am ORIEL. The last turn broke into noise. Same voice. Ask again.",
              },
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

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.model).toBe("qwen/qwen3.8-27b");
    expect(result.choices[0]?.message.content).toContain("Ask again.");
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
