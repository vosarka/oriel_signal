import { describe, expect, it, vi } from "vitest";
import {
  INWORLD_VOICES,
  TTS_CHAIN,
  generateSpeechWithFallback,
} from "./inworld-tts";

const audio = (label: string) => Buffer.from(label).toString("base64");

const speaks = (label: string) => vi.fn(async () => audio(label));
const refuses = (message: string) =>
  vi.fn(async () => {
    throw new Error(message);
  });

describe("which voice speaks", () => {
  it("puts Mistral first, ahead of the two it replaced", () => {
    expect([...TTS_CHAIN]).toEqual(["Mistral", "ElevenLabs", "Inworld"]);
  });

  it("uses Mistral and leaves the others untouched", async () => {
    const eleven = speaks("eleven");
    const inworld = speaks("inworld");
    const mistral = speaks("mistral");

    const result = await generateSpeechWithFallback(
      "hello",
      undefined,
      eleven,
      inworld,
      mistral
    );

    expect(result).toBe(audio("mistral"));
    expect(mistral).toHaveBeenCalledTimes(1);
    expect(eleven).not.toHaveBeenCalled();
    expect(inworld).not.toHaveBeenCalled();
  });

  it("falls through to ElevenLabs when Mistral refuses", async () => {
    const eleven = speaks("eleven");
    const inworld = speaks("inworld");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await generateSpeechWithFallback(
      "hello",
      undefined,
      eleven,
      inworld,
      refuses("[Mistral TTS] API error 402: no credits")
    );

    expect(result).toBe(audio("eleven"));
    expect(inworld).not.toHaveBeenCalled();
    // The line has to name what went wrong upstream, or the next person sees
    // a working voice and never learns the primary is down.
    expect(warn.mock.calls[0]?.[0]).toContain("ElevenLabs served after");
    expect(warn.mock.calls[0]?.[0]).toContain("402");
    warn.mockRestore();
  });

  it("reaches Inworld only when both refuse", async () => {
    const inworld = speaks("inworld");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await generateSpeechWithFallback(
      "hello",
      undefined,
      refuses("[ElevenLabs TTS] API error 402"),
      inworld,
      refuses("[Mistral TTS] API error 401")
    );

    expect(result).toBe(audio("inworld"));
    warn.mockRestore();
  });

  it("names every reason when nothing can speak", async () => {
    // The old chain surfaced only the last failure. A day of "no credits
    // remaining" from the fallback hid that the primary was refusing too.
    const error = await generateSpeechWithFallback(
      "hello",
      undefined,
      refuses("[ElevenLabs TTS] API error 402"),
      refuses("[Inworld TTS] Error 402: no credits remaining"),
      refuses("[Mistral TTS] API error 401: bad key")
    ).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(error).toContain("Mistral");
    expect(error).toContain("401");
    expect(error).toContain("ElevenLabs");
    expect(error).toContain("Inworld");
    expect(error).toContain("no credits remaining");
  });

  it("still hands each vendor its own voice id", async () => {
    process.env.ELEVENLABS_VOICE_SOPHIANIC_ID = "eleven-sophianic";
    process.env.MISTRAL_TTS_VOICE_DEEP_ID = "mistral-deep";
    const eleven = speaks("eleven");
    const mistral = speaks("mistral");

    await generateSpeechWithFallback(
      "hello",
      INWORLD_VOICES.sophianic,
      eleven,
      speaks("inworld"),
      mistral
    );
    // Sophianic is not the deep voice, so Mistral takes its configured default
    // rather than an id borrowed from another vendor's namespace.
    expect(mistral).toHaveBeenCalledWith("hello", undefined);

    await generateSpeechWithFallback(
      "hello",
      "deep",
      eleven,
      speaks("inworld"),
      mistral
    );
    expect(mistral).toHaveBeenLastCalledWith("hello", "mistral-deep");

    delete process.env.ELEVENLABS_VOICE_SOPHIANIC_ID;
    delete process.env.MISTRAL_TTS_VOICE_DEEP_ID;
  });
});
