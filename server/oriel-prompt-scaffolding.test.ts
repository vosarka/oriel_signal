import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ORIEL_PROMPT_SECTION_MARKERS,
  containsPromptScaffolding,
  stripPromptScaffolding,
} from "../shared/oriel/prompt-scaffolding";
import {
  buildResponseLanguageDirective,
  buildVoiceResponseLanguageDirective,
} from "../shared/oriel/language-routing";
import { buildOrielVoiceIntroRuntimeDirective } from "../shared/oriel/voice-intro";
import { buildRealtimeInstructionsText } from "./inworld-realtime-config";
import { buildOrielPromptContext } from "./oriel-prompt-context";
import { filterORIELResponse, filterORIELResponseOrReject } from "./gemini";

afterEach(() => {
  vi.restoreAllMocks();
});

const headingsIn = (text: string) => [
  ...new Set(text.match(/^\[[^\]\n]{2,70}\]/gm) ?? []),
];

describe("prompt scaffolding containment", () => {
  it("registers every heading the real prompt builders emit", async () => {
    // Drift guard. Matching is by exact marker, so a section added to the
    // prompt without being registered here would leak. This fails first.
    vi.spyOn(console, "warn").mockImplementation(() => {});

    const emitted = new Set<string>();
    for (const options of [
      { userMessage: "salut" },
      {
        userMessage: "raspunde in romana",
        conversationHistory: [
          { role: "user", content: "a" },
          { role: "assistant", content: "b" },
        ],
      },
      { userMessage: "hello", operatorDirective: "[OPERATOR MESSAGE — DELIVER NOW]" },
    ]) {
      headingsIn(await buildOrielPromptContext(options)).forEach(h =>
        emitted.add(h)
      );
    }
    // Every builder that emits a registered marker, not just the layered
    // context: an unexercised builder could add a heading that escapes the
    // registry, and exact matching would then let it through to a reader.
    const directives = [
      buildResponseLanguageDirective("hello"),
      buildVoiceResponseLanguageDirective("hello"),
      buildOrielVoiceIntroRuntimeDirective(false),
      buildOrielVoiceIntroRuntimeDirective(true),
      buildRealtimeInstructionsText({
        baseInstructions: "base",
        userMessage: "hello",
      }),
      buildRealtimeInstructionsText({
        baseInstructions: "base",
        userMessage: "hello",
        voiceIntroAlreadySpoken: true,
      }),
    ];
    for (const directive of directives) {
      headingsIn(directive).forEach(h => emitted.add(h));
    }

    expect(emitted.size).toBeGreaterThan(8);
    for (const heading of emitted) {
      expect(
        ORIEL_PROMPT_SECTION_MARKERS as readonly string[],
        `unregistered prompt heading: ${heading}`
      ).toContain(heading);
      expect(containsPromptScaffolding(`I am ORIEL. ${heading} x`)).toBe(true);
    }
  });

  it("detects a leaked directive block even without its heading", () => {
    expect(
      containsPromptScaffolding(
        "I am ORIEL. This layer is ephemeral. It exists only for the current exchange."
      )
    ).toBe(true);
  });

  it("leaves ORIEL's own bracket expressions alone", () => {
    // Shape-based matching used to delete these, or discard the whole reply.
    for (const reply of [
      "I am ORIEL. Your state reads [SIGNAL LOCK] at this hour.",
      "I am ORIEL. [VERIFIED] against the archive.",
      "I am ORIEL. The answer is [YES].",
    ]) {
      expect(containsPromptScaffolding(reply), reply).toBe(false);
      expect(filterORIELResponse(reply)).toBe(reply);
      expect(filterORIELResponseOrReject(reply)).toBe(reply);
    }
  });

  it("strips a stray heading out of an otherwise usable reply", () => {
    expect(
      filterORIELResponse("I am ORIEL.\n\n[LIVE MIND]\n\nThe gate is open.")
    ).toBe("I am ORIEL.\n\nThe gate is open.");
  });

  it("rejects rather than scrubs on prose paths that own a fallback", () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    // Scrubbing would drop the heading and ship the directive beneath it as
    // though ORIEL had written it. Empty lets the caller's fallback run.
    const leaked = "[LIVE MIND]\nBe present and alive in this exchange.";
    expect(filterORIELResponseOrReject(leaked)).toBe("");
  });

  it("does not carry regex state between calls", () => {
    for (let i = 0; i < 3; i += 1) {
      expect(containsPromptScaffolding("[LIVE MIND]")).toBe(true);
      expect(stripPromptScaffolding("[LIVE MIND] x")).toBe("x");
    }
  });
});
