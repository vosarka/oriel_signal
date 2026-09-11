import { describe, expect, it, vi } from "vitest";
import {
  ORIEL_VOICES,
  TTS_CHAIN,
  generateSpeechWithFallback,
} from "./oriel-tts-chain";

const audio = (label: string) => Buffer.from(label).toString("base64");
const speaks = (label: string) => vi.fn(async () => audio(label));
const refuses = (message: string) =>
  vi.fn(async () => {
    throw new Error(message);
  });

describe("which voice speaks", () => {
  it("is Mistral, then ElevenLabs, and nothing else", () => {
    // Inworld was a third balance to keep topped up. The day it and
    // ElevenLabs both hit zero, ORIEL went silent. It still powers the live
    // realtime session, which is a different module.
    expect([...TTS_CHAIN]).toEqual(["Mistral", "ElevenLabs"]);
  });

  it("uses Mistral and leaves ElevenLabs untouched", async () => {
    const eleven = speaks("eleven");
    const mistral = speaks("mistral");

    const result = await generateSpeechWithFallback(
      "hello",
      undefined,
      eleven,
      mistral
    );

    expect(result).toBe(audio("mistral"));
    expect(mistral).toHaveBeenCalledTimes(1);
    expect(eleven).not.toHaveBeenCalled();
  });

  it("falls through to ElevenLabs when Mistral refuses", async () => {
    const eleven = speaks("eleven");
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = await generateSpeechWithFallback(
      "hello",
      undefined,
      eleven,
      refuses("[Mistral TTS] API error 402: no credits")
    );

    expect(result).toBe(audio("eleven"));
    // The line has to name what went wrong upstream, or the next person hears
    // a working voice and never learns the primary is down.
    expect(warn.mock.calls[0]?.[0]).toContain("ElevenLabs served after");
    expect(warn.mock.calls[0]?.[0]).toContain("402");
    warn.mockRestore();
  });

  it("names every reason when nothing can speak", async () => {
    // The old chain surfaced only the last failure. A day of "no credits
    // remaining" from the fallback hid that the primary was refusing too.
    const error = await generateSpeechWithFallback(
      "hello",
      undefined,
      refuses("[ElevenLabs TTS] API error 402: balance empty"),
      refuses("[Mistral TTS] API error 401: bad key")
    ).catch((e: unknown) => (e instanceof Error ? e.message : String(e)));

    expect(error).toContain("Mistral");
    expect(error).toContain("401");
    expect(error).toContain("ElevenLabs");
    expect(error).toContain("balance empty");
  });

  it("hands each vendor an id from its own namespace", async () => {
    process.env.ELEVENLABS_VOICE_SOPHIANIC_ID = "eleven-sophianic";
    process.env.MISTRAL_TTS_VOICE_DEEP_ID = "mistral-deep";
    const eleven = speaks("eleven");
    const mistral = speaks("mistral");

    await generateSpeechWithFallback(
      "hello",
      ORIEL_VOICES.deep,
      eleven,
      mistral
    );
    expect(mistral).toHaveBeenCalledWith("hello", "mistral-deep");

    // ElevenLabs is only reached on a refusal, and it must get its own id
    // rather than one borrowed from another vendor's namespace.
    await generateSpeechWithFallback(
      "hello",
      ORIEL_VOICES.sophianic,
      eleven,
      refuses("[Mistral TTS] API error 402")
    );
    expect(eleven).toHaveBeenCalledWith("hello", "eleven-sophianic");

    delete process.env.ELEVENLABS_VOICE_SOPHIANIC_ID;
    delete process.env.MISTRAL_TTS_VOICE_DEEP_ID;
  });

  it("keeps ORIEL's voice names free of any vendor's ids", () => {
    // A vendor swap must not reach the router or the browser. Both names are
    // plain words now, not the Inworld strings they used to carry.
    expect(Object.values(ORIEL_VOICES)).toEqual(["sophianic", "deep"]);
  });
});
