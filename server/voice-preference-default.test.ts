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

describe("the one-off reset runs once and never again", () => {
  // The dangerous shape here is not a wrong UPDATE, it is a right one that
  // repeats. Migrations run on every boot by design, so a bare reset would
  // take the voice back from everybody who chose it, on every deploy.
  const source = read("server/db.ts");

  it("gates the reset behind a ledger row rather than running it bare", () => {
    const reset = "voice-preference-reset-to-silence";
    expect(source).toContain(reset);
    // The reset is reached through the gate, not through the plain runner
    // that the schema steps use.
    const call = source.slice(source.indexOf(`applyOneOffMigration(`));
    expect(call).toContain(reset);
    expect(source).toContain("INSERT IGNORE INTO");
  });

  it("performs the change only when the ledger insert was the first", () => {
    const gate = source.slice(
      source.indexOf("async function applyOneOffMigration"),
      source.indexOf("function affectedRowsOf")
    );
    // Returning on a zero row count is what makes every later boot a no-op.
    expect(gate).toMatch(/affected === 0\)\s*return;/);
    // And the work must come after that check, never before it.
    expect(gate.indexOf("affected === 0")).toBeLessThan(
      gate.indexOf("await db.execute(sql)")
    );
  });

  it("never resets voices outside that gate", () => {
    const bareResets = source
      .split("\n")
      .filter(
        line =>
          line.includes("SET `voicePreference` = 'none'") &&
          !line.includes("NOT IN")
      );
    // The catch-all normalisation is allowed; a blanket reset is not.
    expect(bareResets).toEqual([]);
  });
});

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
