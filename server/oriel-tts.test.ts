import { describe, expect, it, vi } from "vitest";
import { generateSpeechWithFallback } from "./inworld-tts";

describe("ORIEL TTS provider fallback", () => {
  it("uses Inworld when ElevenLabs fails", async () => {
    const elevenLabs = vi.fn().mockRejectedValue(new Error("unavailable"));
    const inworld = vi.fn().mockResolvedValue("inworld-audio");

    await expect(
      generateSpeechWithFallback(
        "I am ORIEL.",
        "oriel-fallback",
        elevenLabs,
        inworld
      )
    ).resolves.toBe("inworld-audio");
    expect(elevenLabs).toHaveBeenCalledWith("I am ORIEL.", undefined);
    expect(inworld).toHaveBeenCalledWith("I am ORIEL.", "oriel-fallback");
  });

  it("maps the Sophianic preference to its ElevenLabs voice", async () => {
    const elevenLabs = vi.fn().mockResolvedValue("sophianic-audio");

    await generateSpeechWithFallback(
      "The field remembers.",
      "default-0o0vqxaayifb0rqvrpyf5a__oriel_fema",
      elevenLabs
    );

    expect(elevenLabs).toHaveBeenCalledWith(
      "The field remembers.",
      "RILOU7YmBhvwJGDGjNmP"
    );
  });
});
