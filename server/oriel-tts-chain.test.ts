import { afterEach, describe, expect, it, vi } from "vitest";
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
  // In afterEach rather than at the end of each test: a failing assertion
  // throws before any inline cleanup runs, and the leaked variable then
  // decides the outcome of whatever test the worker picks up next.
  afterEach(() => {
    delete process.env.ELEVENLABS_VOICE_SOPHIANIC_ID;
    delete process.env.ELEVENLABS_VOICE_DEEP_ID;
    delete process.env.MISTRAL_TTS_VOICE_DEEP_ID;
    vi.restoreAllMocks();
  });

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
  });

  it("keeps the deep voice when it falls through to ElevenLabs", async () => {
    // Falling back used to drop the deep voice to the vendor default, so a
    // person who chose it heard someone else the moment Mistral refused.
    process.env.ELEVENLABS_VOICE_DEEP_ID = "eleven-deep";
    const eleven = speaks("eleven");

    await generateSpeechWithFallback(
      "hello",
      ORIEL_VOICES.deep,
      eleven,
      refuses("[Mistral TTS] API error 402")
    );

    expect(eleven).toHaveBeenCalledWith("hello", "eleven-deep");
  });

  it("keeps ORIEL's voice names free of any vendor's ids", () => {
    // A vendor swap must not reach the router or the browser. Both names are
    // plain words now, not the Inworld strings they used to carry.
    expect(Object.values(ORIEL_VOICES)).toEqual(["sophianic", "deep"]);
  });
});

describe("splitting a long reply for the synthesizer", () => {
  it("keeps a closing sentence that has no full stop", async () => {
    const { chunkText } = await import("./oriel-tts-chain");
    // ORIEL does not always punctuate its last line. That fragment used to be
    // dropped outright: the reply was spoken, minus its ending.
    const chunks = chunkText("First sentence. And then the quiet part", 1000);
    expect(chunks.join(" ")).toContain("the quiet part");
  });

  it("keeps a reply that is one unpunctuated fragment", async () => {
    const { chunkText } = await import("./oriel-tts-chain");
    expect(chunkText("no punctuation at all here", 1000)).toEqual([
      "no punctuation at all here",
    ]);
  });

  it("splits one sentence that is longer than the whole budget", async () => {
    const { chunkText } = await import("./oriel-tts-chain");
    // The size check only fired when something was already buffered, so a
    // single long sentence sailed past it and went to the provider whole.
    const long = "word ".repeat(120).trim();
    const chunks = chunkText(long, 100);
    expect(chunks.length).toBeGreaterThan(1);
    for (const chunk of chunks) expect(chunk.length).toBeLessThanOrEqual(100);
  });

  it("loses no words while splitting", async () => {
    const { chunkText } = await import("./oriel-tts-chain");
    const text =
      "One. Two is a little longer. " + "three ".repeat(60) + "and an ending";
    const chunks = chunkText(text, 80);
    const rejoined = chunks.join(" ").replace(/\s+/g, " ").trim();
    const original = text.replace(/\s+/g, " ").trim();
    expect(rejoined.split(" ").length).toBe(original.split(" ").length);
  });

  it("keeps an opening ellipsis instead of starting after it", async () => {
    const { chunkText } = await import("./oriel-tts-chain");
    // ORIEL opens on a pause often enough that losing it changes the reading.
    // The pause survives; the packer's own space between pieces is fine.
    expect(chunkText("...and then nothing", 1000).join(" ")).toContain("...");
  });

  it("splits a single token longer than the whole budget", async () => {
    const { chunkText } = await import("./oriel-tts-chain");
    // No word boundary to break at, so packing words alone would hand the
    // provider the oversized request the limit exists to prevent.
    const token = "x".repeat(250);
    const chunks = chunkText(`here it is ${token}`, 100);
    expect(chunks.every(c => c.length <= 100)).toBe(true);
    expect(chunks.join("").replace(/\s/g, "")).toContain(token);
  });
});
