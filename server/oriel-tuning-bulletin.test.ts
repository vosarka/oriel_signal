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
