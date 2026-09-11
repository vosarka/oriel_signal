import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { generateMistralSpeech } from "./mistral-tts";

const originalFetch = global.fetch;
const originalKey = process.env.MISTRAL_API_KEY;

const respondWith = (body: unknown, status = 200) => {
  const impl = vi.fn(
    async () =>
      new Response(typeof body === "string" ? body : JSON.stringify(body), {
        status,
      })
  );
  global.fetch = impl as unknown as typeof fetch;
  return impl;
};

describe("Voxtral speech", () => {
  beforeEach(() => {
    process.env.MISTRAL_API_KEY = "test-key";
  });

  afterEach(() => {
    global.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.MISTRAL_API_KEY;
    else process.env.MISTRAL_API_KEY = originalKey;
    delete process.env.MISTRAL_TTS_VOICE_ID;
    delete process.env.MISTRAL_TTS_MODEL;
  });

  it("returns the base64 audio the API sends back", async () => {
    respondWith({ audio_data: "QUJD" });
    expect(await generateMistralSpeech("hello")).toBe("QUJD");
  });

  it("asks the speech endpoint for mp3, with the key as a bearer token", async () => {
    const fetchImpl = respondWith({ audio_data: "QUJD" });
    process.env.MISTRAL_TTS_VOICE_ID = "chosen-voice";

    await generateMistralSpeech("hello");

    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.mistral.ai/v1/audio/speech");
    expect((init.headers as Record<string, string>).Authorization).toBe(
      "Bearer test-key"
    );
    const sent = JSON.parse(init.body as string);
    expect(sent).toMatchObject({
      input: "hello",
      response_format: "mp3",
      voice_id: "chosen-voice",
    });
    expect(sent.model).toBe("voxtral-mini-tts-2603");
  });

  it("ignores a blank voice id rather than sending it", async () => {
    // .env.example ships MISTRAL_TTS_VOICE_ID blank, and ?? treats "" as a
    // value. Every deployment that copied the template unchanged would have
    // sent voice_id "" to a service that rejects it, knocking Mistral out of
    // the chain on the first word ORIEL ever spoke.
    const fetchImpl = respondWith({ audio_data: "QUJD" });
    process.env.MISTRAL_TTS_VOICE_ID = "";
    process.env.MISTRAL_TTS_MODEL = "";

    await generateMistralSpeech("hello");

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    const sent = JSON.parse(init.body as string);
    expect(sent.voice_id).toBe("4f381381-d79e-468c-9724-63edd0c5883a");
    expect(sent.model).toBe("voxtral-mini-tts-2603");
  });

  it("an explicit voice beats the configured one", async () => {
    const fetchImpl = respondWith({ audio_data: "QUJD" });
    process.env.MISTRAL_TTS_VOICE_ID = "configured";

    await generateMistralSpeech("hello", "explicit");

    const [, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(init.body as string).voice_id).toBe("explicit");
  });

  it("says why the call was refused, not just the number", async () => {
    // 401 is a bad key, 402 an empty balance, 422 a bad voice id. Only the
    // body separates them, and ORIEL went mute for a day on a bare 402.
    respondWith('{"message":"No credits remaining"}', 402);

    await expect(generateMistralSpeech("hello")).rejects.toThrow(
      /402.*No credits remaining/s
    );
  });

  it("does not print back what ORIEL said when the call is refused", async () => {
    // The input to a TTS call is a reply somebody just received. A validation
    // error that echoes it would carry the whole thing into the log.
    const said = "You asked me whether it gets easier. It does, unevenly.";
    respondWith(`{"detail":"input rejected","echo":"${said}"}`, 422);

    const error = await generateMistralSpeech(said).catch((e: unknown) =>
      e instanceof Error ? e.message : String(e)
    );

    // The diagnostic survives.
    expect(error).toContain("422");
    expect(error).toContain("input rejected");
    // The sentence does not.
    expect(error).not.toContain("it gets easier");
    expect(error).toContain("[redacted]");
  });

  it("refuses a response with no audio in it", async () => {
    respondWith({ detail: "queued" });

    await expect(generateMistralSpeech("hello")).rejects.toThrow(
      /missing audio_data/
    );
  });

  it("refuses to call at all without a key", async () => {
    delete process.env.MISTRAL_API_KEY;
    const fetchImpl = respondWith({ audio_data: "QUJD" });

    await expect(generateMistralSpeech("hello")).rejects.toThrow(
      /MISTRAL_API_KEY is not configured/
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});
