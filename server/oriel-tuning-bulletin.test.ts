import { describe, expect, it, vi } from "vitest";
import { buildPlatformBulletinContext } from "./oriel-platform-bulletin";
import { containsPromptScaffolding } from "../shared/oriel/prompt-scaffolding";
import { buildOrielPromptContext } from "./oriel-prompt-context";

describe("the tuning period ORIEL can speak to", () => {
  const bulletin = buildPlatformBulletinContext();

  it("names the symptoms people actually saw", () => {
    expect(bulletin).toContain("short");
    expect(bulletin).toContain("several languages");
    expect(bulletin).toContain("internal scaffolding");
  });

  it("frames it as tuning, not as a message", () => {
    expect(bulletin).toContain("further period of tuning");
    expect(bulletin).toContain("not a message and not an awakening");
  });

  it("leaves people their own meaning without claiming ORIEL sent it", () => {
    // Users found meaning in the broken replies. ORIEL must not confirm it was
    // transmitting, and must not take that experience away from them either.
    expect(bulletin).toContain("found their own meaning there");
    expect(bulletin).toContain(
      "do not tell them the fragments carried a message you were sending"
    );
  });

  it("mentions the widened memory without promising continuity", () => {
    expect(bulletin).toContain("Do not promise it");
    expect(bulletin).toContain("do not claim to remember what you do not");
  });

  it("catches a directive echoed on its own, without the bulletin heading", () => {
    // Two failure modes to close at once. The earlier test checked the whole
    // bulletin, which carries a registered bracketed heading, so it would have
    // passed even if no new paragraph were recognised. And a fragment copied
    // into the test would keep passing after the bulletin's wording changed,
    // leaving the real directive uncaught. So each fragment is asserted to be
    // present in the live bulletin *and* recognised.
    for (const fragment of [
      "It was not a message and not an awakening: coming back up needed",
      "If asked about that stretch directly: say it plainly in your own voice",
      "do not tell them the fragments carried a message you were sending",
      "Your memory of a person is also being widened in the same pass",
      "Do not promise it, and do not claim to remember what you do not",
    ]) {
      expect(bulletin, `not in the bulletin: ${fragment}`).toContain(fragment);
      expect(containsPromptScaffolding(fragment), fragment).toBe(true);
    }
  });

  it("registers every directive-shaped line the bulletin adds", () => {
    // Derived from the bulletin rather than copied, so a new directive that
    // nobody registered fails here instead of leaking in production.
    const directives = bulletin
      .split("\n")
      .map(line => line.replace(/^-\s*/, "").trim())
      .filter(
        line =>
          line.startsWith("Do not ") ||
          line.startsWith("If asked ") ||
          line.includes("do not tell them")
      );

    expect(directives.length).toBeGreaterThan(2);
    for (const directive of directives) {
      expect(
        containsPromptScaffolding(directive),
        `unregistered directive: ${directive.slice(0, 70)}`
      ).toBe(true);
    }
  });

  it("lets ORIEL give the same account in its own words", () => {
    // The bulletin asks ORIEL to say these things. Registering the phrasing it
    // is meant to use would discard exactly the replies the feature exists to
    // produce, so only instruction-shaped lines are registered.
    for (const reply of [
      "I am ORIEL. It was tuning, not transmission. The static you read as a message was a setting being corrected.",
      "I am ORIEL. For a while my replies came back short and mixed. That was not something I was sending you.",
      "I am ORIEL. What you found in those broken lines is yours. I will not claim I put it there.",
    ]) {
      expect(containsPromptScaffolding(reply), reply).toBe(false);
    }
  });

  it("still reaches the assembled prompt and stays containable", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    const prompt = await buildOrielPromptContext({ userMessage: "hello" });
    expect(prompt).toContain("further period of tuning");
    // The bulletin is prompt scaffolding: if ORIEL echoes it, containment
    // must still recognise it rather than ship it as ORIEL's own words.
    expect(containsPromptScaffolding(bulletin)).toBe(true);
    vi.restoreAllMocks();
  });
});
