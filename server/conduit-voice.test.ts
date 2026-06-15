import { describe, expect, it } from "vitest";
import {
  getConduitInputDisabled,
  getSpeechFallbackTimeoutMs,
  getSpeechFallbackWatchdogDecision,
  splitIntoSpeechChunks,
} from "../client/src/lib/conduit-voice";

describe("Conduit voice interaction guards", () => {
  it("does not block chat input while voice playback is speaking", () => {
    expect(
      getConduitInputDisabled({
        chatPending: false,
        isSpeaking: true,
        transmissionInterfering: false,
      })
    ).toBe(false);
  });

  it("still blocks chat input while the chat request or transmission gate is active", () => {
    expect(
      getConduitInputDisabled({
        chatPending: true,
        isSpeaking: false,
        transmissionInterfering: false,
      })
    ).toBe(true);
    expect(
      getConduitInputDisabled({
        chatPending: false,
        isSpeaking: false,
        transmissionInterfering: true,
      })
    ).toBe(true);
  });

  it("caps browser speech fallback timeout so voice state cannot stay stuck forever", () => {
    expect(getSpeechFallbackTimeoutMs("short response")).toBeGreaterThanOrEqual(
      4000
    );
    expect(
      getSpeechFallbackTimeoutMs("word ".repeat(1000))
    ).toBeLessThanOrEqual(25000);
  });

  it("extends the browser speech watchdog while speech is still actively playing", () => {
    expect(
      getSpeechFallbackWatchdogDecision({
        elapsedMs: 25_000,
        isSpeaking: true,
      })
    ).toBe("extend");
  });

  it("clears browser speech fallback after the hard watchdog limit or when speech is not active", () => {
    expect(
      getSpeechFallbackWatchdogDecision({
        elapsedMs: 121_000,
        isSpeaking: true,
      })
    ).toBe("clear");
    expect(
      getSpeechFallbackWatchdogDecision({
        elapsedMs: 25_000,
        isSpeaking: false,
      })
    ).toBe("clear");
  });
});

describe("splitIntoSpeechChunks", () => {
  it("returns a single chunk for short text with no sentence breaks", () => {
    const result = splitIntoSpeechChunks("The field is steady.");
    expect(result).toEqual(["The field is steady."]);
  });

  it("groups short sentences together up to targetLength", () => {
    const result = splitIntoSpeechChunks(
      "I am ORIEL. I hear you. The signal is clear.",
      200
    );
    expect(result).toHaveLength(1);
    expect(result[0]).toContain("I am ORIEL.");
    expect(result[0]).toContain("The signal is clear.");
  });

  it("splits into multiple chunks when sentences exceed targetLength", () => {
    const long =
      "The first sentence is here and it is quite long indeed. " +
      "The second sentence continues and is also rather lengthy. " +
      "The third sentence completes the thought and wraps it up cleanly.";
    const result = splitIntoSpeechChunks(long, 80);
    expect(result.length).toBeGreaterThan(1);
    for (const chunk of result) {
      expect(chunk.trim().length).toBeGreaterThan(0);
    }
  });

  it("preserves all text across chunks with no loss", () => {
    const text =
      "First sentence. Second sentence! Third sentence? Fourth sentence.";
    const chunks = splitIntoSpeechChunks(text, 50);
    expect(chunks.join(" ")).toBe(text);
  });

  it("handles text with no sentence-ending punctuation as a single chunk", () => {
    const text = "no punctuation here just words flowing on";
    expect(splitIntoSpeechChunks(text)).toEqual([text]);
  });
});
