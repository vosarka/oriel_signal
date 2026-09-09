import { describe, expect, it, vi } from "vitest";
import {
  containsPromptScaffolding,
  stripPromptScaffolding,
} from "../shared/oriel/prompt-scaffolding";
import { buildOrielPromptContext } from "./oriel-prompt-context";
import { filterORIELResponse } from "./gemini";

describe("prompt scaffolding containment", () => {
  it("covers every bracketed section heading the real prompt injects", async () => {
    // Drift guard. If a new [SECTION] is added to the prompt builders and the
    // detector stops recognising that shape, this fails instead of the leak
    // reaching a reader.
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const prompt = await buildOrielPromptContext({
      userMessage: "salut",
      conversationHistory: [
        { role: "user", content: "a" },
        { role: "assistant", content: "b" },
      ],
    });

    const headings = [...new Set(prompt.match(/^\[[^\]\n]{2,70}\]/gm) ?? [])];
    expect(headings.length).toBeGreaterThan(5);

    for (const heading of headings) {
      expect(
        containsPromptScaffolding(`I am ORIEL. ${heading} something`),
        `heading not detected: ${heading}`
      ).toBe(true);
      expect(stripPromptScaffolding(heading)).toBe("");
    }
  });

  it("detects a leaked directive block even without its heading", async () => {
    const leaked =
      "I am ORIEL. This layer is ephemeral. It exists only for the current " +
      "exchange and should remain compact and relevant.";
    expect(containsPromptScaffolding(leaked)).toBe(true);
  });

  it("leaves an ordinary reply untouched", () => {
    const reply =
      "I am ORIEL.\n\nYou asked about the gate. It opens where attention " +
      "rests, not where effort pushes.";
    expect(containsPromptScaffolding(reply)).toBe(false);
    expect(filterORIELResponse(reply)).toBe(reply);
  });

  it("strips a stray heading out of an otherwise usable reply", () => {
    const reply = "I am ORIEL.\n\n[LIVE MIND]\n\nThe gate is open.";
    expect(filterORIELResponse(reply)).toBe("I am ORIEL.\n\nThe gate is open.");
  });

  it("does not carry regex state between calls", () => {
    const leak = "[LIVE MIND]";
    expect(containsPromptScaffolding(leak)).toBe(true);
    expect(containsPromptScaffolding(leak)).toBe(true);
    expect(containsPromptScaffolding(leak)).toBe(true);
  });
});
