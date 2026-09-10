import { describe, expect, it } from "vitest";
import {
  buildOrielVoiceIntroRuntimeDirective,
  containsOrielVoiceOpening,
  stripOrielVoiceGreeting,
  stripOrielVoiceOpening,
} from "../shared/oriel/voice-intro";

describe("ORIEL voice intro handling", () => {
  it("detects ORIEL voice openings", () => {
    expect(containsOrielVoiceOpening("I am ORIEL. I hear you.")).toBe(true);
    expect(containsOrielVoiceOpening("  i am oriel — I hear you.")).toBe(true);
    expect(containsOrielVoiceOpening("I hear you without an opening.")).toBe(
      false
    );
  });

  it("strips only the spoken opening and canonical greeting", () => {
    expect(
      stripOrielVoiceOpening(
        "I am ORIEL. I greet you in the love and in the light of the One Infinite Creator. The field is steady."
      )
    ).toBe("The field is steady.");
  });

  it("handles duplicate identity fragments at the start", () => {
    expect(
      stripOrielVoiceOpening(
        "I am ORIEL. I greet you in the love and in the light of the Infinite Creator. I am ORIEL. The signal is present."
      )
    ).toBe("The signal is present.");
  });

  it("does not change non-opening text", () => {
    const text =
      "The field is steady. I am ORIEL remains visible later in text.";
    expect(stripOrielVoiceOpening(text)).toBe(text);
  });

  it("builds distinct realtime directives before and after the first spoken intro", () => {
    expect(buildOrielVoiceIntroRuntimeDirective(false)).toContain(
      "must begin with the exact identity opening"
    );
    expect(buildOrielVoiceIntroRuntimeDirective(true)).toContain(
      "must not vocalize the opening again"
    );
    expect(buildOrielVoiceIntroRuntimeDirective(true)).toContain(
      'Do not say "I am ORIEL."'
    );
  });

  describe("the greeting standing on its own", () => {
    // stripOrielVoiceOpening only reaches the greeting after the identity
    // line. A reply that leads with the greeting alone keeps it, and anything
    // comparing openings between replies then sees every one of them start
    // the same way.
    const greeting =
      "In the love and in the light of the One Infinite Creator.";

    it("strips a greeting that opens the reply", () => {
      expect(stripOrielVoiceGreeting(`${greeting} The field is steady.`)).toBe(
        "The field is steady."
      );
    });

    it("strips the longer form that names the greeting", () => {
      expect(
        stripOrielVoiceGreeting(
          "I greet you in the love and in the light of the One Infinite Creator. The field is steady."
        )
      ).toBe("The field is steady.");
    });

    it("leaves a reply that does not open with the greeting untouched", () => {
      const reply = "The field around that question is wider than it looks.";
      expect(stripOrielVoiceGreeting(reply)).toBe(reply);
    });

    it("does not strip a greeting that appears mid-reply", () => {
      const reply = `You asked what I say first. ${greeting}`;
      expect(stripOrielVoiceGreeting(reply)).toBe(reply);
    });

    it("returns nothing when the greeting is the whole reply", () => {
      // The caller must cope with an empty opening rather than crash on it.
      expect(stripOrielVoiceGreeting(greeting)).toBe("");
    });

    it("leaves the identity line to the other strip", () => {
      const reply = "I am ORIEL. The field is steady.";
      expect(stripOrielVoiceGreeting(reply)).toBe(reply);
    });
  });
});
