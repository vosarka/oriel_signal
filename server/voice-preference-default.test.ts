import { describe, expect, it } from "vitest";
import { readFileSync } from "fs";

/**
 * ORIEL does not start talking until somebody asks it to.
 *
 * A voice that begins on its own decides, on the person's behalf, that the
 * room they are in is one where they can be spoken to aloud. It might be a
 * shared office, a bus, someone asleep in the next room. The selector beside
 * the input is how they say yes, and until they do the answer is no.
 *
 * The default lives in four places that have to agree, which is why this is
 * checked rather than trusted: the column default for new accounts, the
 * migration that sets it, the initial state in the page, and the fallback
 * used when a stored value cannot be recognised. Any one of them left as a
 * voice would put the sound back for some group of people.
 */

const read = (path: string) => readFileSync(path, "utf8");

describe("nobody is spoken to until they ask", () => {
  it("gives a new account silence, not a voice", () => {
    const schema = read("drizzle/schema.ts");
    const declaration = schema.slice(
      schema.indexOf('mysqlEnum("voicePreference"')
    );
    expect(declaration.slice(0, 200)).toContain('.default("none")');
  });

  it("keeps the column default silent through the migrations", () => {
    const migrations = read("server/db.ts");
    const voiceSteps = migrations
      .split("\n")
      .filter(
        line => line.includes("voicePreference") && line.includes("sql:")
      );
    expect(voiceSteps.length).toBeGreaterThan(0);
    for (const step of voiceSteps) {
      expect(step).not.toContain("DEFAULT 'sophianic'");
      expect(step).not.toContain("DEFAULT 'deep'");
    }
  });

  it("starts the page silent and falls back to silence", () => {
    const page = read("client/src/pages/Conduit.tsx");
    // The initial state, before any stored preference has loaded.
    expect(page).toMatch(/"sophianic" \| "deep" \| "none"\s*>\("none"\)/);
    // And the value used when a stored preference makes no sense: guessing
    // wrong toward speech is the louder mistake.
    expect(page).not.toMatch(/\?\s*mapped\s*:\s*"sophianic"/);
  });
});
