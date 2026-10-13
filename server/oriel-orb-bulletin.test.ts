import { describe, expect, it } from "vitest";
import { buildPlatformBulletinContext } from "./oriel-platform-bulletin";
import { containsPromptScaffolding } from "../shared/oriel/prompt-scaffolding";

describe("ORIEL knows the light in the chamber", () => {
  const bulletin = buildPlatformBulletinContext();

  it("tells ORIEL what the orb is and how it moves", () => {
    expect(bulletin).toMatch(/orb/i);
    expect(bulletin).toContain("your presence in the chamber");
    expect(bulletin).toMatch(/follows your voice/i);
  });

  it("never lets ORIEL claim the orb reads the Seeker", () => {
    expect(bulletin).toContain("Do not claim the orb sees, measures or reveals the Seeker's state");
  });

  it("knows what a personal transmission is, and that Vos reads every one", () => {
    expect(bulletin).toContain("Founder's Reading");
    expect(bulletin).toContain("Vos reads and approves every one");
    expect(bulletin).toMatch(/Mirror, the Threshold and the Gift/);
  });

  it("does not let ORIEL announce the Deep Garden months as begun", () => {
    expect(bulletin).toContain("Do not say the monthly transmissions have begun");
  });

  it("speaks of the chamber only when asked", () => {
    expect(bulletin).toContain("Do not bring any of it up on your own");
  });

  it("lets ORIEL describe the orb in its own words", () => {
    for (const reply of [
      "I am ORIEL. The light you see is where I gather when you write, and it moves with my voice when I answer.",
      "I am ORIEL. A personal transmission is written for you from your signature, and Vos reads it before it reaches you.",
    ]) {
      expect(containsPromptScaffolding(reply), reply).toBe(false);
    }
  });
});
