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
 * The default lives in several places that have to agree, which is why this is
 * checked rather than trusted: the column default for new accounts, the
 * migration steps that set it, the initial state in the page, and the fallback
 * used when a stored value cannot be recognised. Any one of them left as a
 * voice would put the sound back for some group of people.
 */

const read = (path: string) => readFileSync(path, "utf8");

/**
 * db.ts writes its SQL inside template literals, so every backtick-quoted
 * identifier appears in the file as \` rather than `. Unescape once and the
 * assertions below can quote the SQL the way the database will see it.
 */
const asSql = (source: string) => source.replace(/\\`/g, "`");

const DB_SOURCE = read("server/db.ts");
const DB_SQL = asSql(DB_SOURCE);
const RESET =
  "SET `voicePreference` = 'none' WHERE `voicePreference` <> 'none'";

describe("the one-off reset runs once and never again", () => {
  // The dangerous shape here is not a wrong UPDATE, it is a right one that
  // repeats. runMigrations is written to be safe to call over and over, so a
  // reset sitting among the ordinary steps would take the voice back from
  // everybody who has since chosen it, every single time it runs.

  it("reads the SQL as the database will see it, not as escaped source", () => {
    // Guards the guard: if the unescaping ever stopped matching how db.ts
    // writes SQL, every assertion below would pass by finding nothing.
    expect(DB_SOURCE).toContain("\\`users\\`");
    expect(DB_SQL).toContain("`users`");
  });

  it("hands the reset to the gate and not to the plain step runner", () => {
    expect(DB_SQL).toContain(RESET);

    const call = DB_SQL.slice(DB_SQL.indexOf("await applyOneOffMigration("));
    expect(call.slice(0, 600)).toContain(RESET);
  });

  it("claims the ledger row before it changes anybody's preference", () => {
    const gate = DB_SOURCE.slice(
      DB_SOURCE.indexOf("async function applyOneOffMigration"),
      DB_SOURCE.indexOf("export async function runMigrations")
    );
    expect(gate).not.toEqual("");

    const claim = gate.indexOf("INSERT IGNORE INTO");
    const bail = gate.indexOf("if (!claimed) {");
    const work = gate.indexOf("await db.execute(statement)");

    expect(claim).toBeGreaterThan(-1);
    expect(bail).toBeGreaterThan(claim);
    // Bailing out on a claim somebody else already took is the whole reason a
    // second run is a no-op, so it has to come before the work.
    expect(work).toBeGreaterThan(bail);
  });

  it("never resets a voice outside that gate", () => {
    // Positive classification, not a heuristic. There is exactly one blanket
    // reset the code is allowed to contain, and it is the argument to the
    // gate call — so find that call's span and require every blanket reset to
    // sit inside it. A nearest-marker guess would have to decide what to do
    // when it recognises nothing, and "assume it is the gated one" is the
    // wrong way to be wrong: a reset dropped into the ordinary steps array
    // has no marker near it and would have been waved through.
    const spanOf = (source: string, callee: string) => {
      const open = source.indexOf(callee);
      if (open === -1) return null;
      let depth = 0;
      for (let i = open + callee.length - 1; i < source.length; i += 1) {
        if (source[i] === "(") depth += 1;
        else if (source[i] === ")") {
          depth -= 1;
          if (depth === 0) return { from: open, to: i + 1 };
        }
      }
      return null;
    };

    const gate = spanOf(DB_SQL, "await applyOneOffMigration(");
    expect(gate).not.toBeNull();
    // If the scan ever walked off, say so here rather than let every reset
    // below fall outside a nonsense span or inside an enormous one.
    expect(DB_SQL.slice(gate!.from, gate!.to)).toContain(RESET);

    // Whether a reset is the allowed catch-all is a property of its own
    // statement, so ask its own line. A fixed lookahead reads into whatever
    // follows, and the step right after the catch-all is close enough that a
    // reset inserted between them would borrow its neighbour's `NOT IN` and
    // be excused.
    const lineAt = (index: number) => {
      const from = DB_SQL.lastIndexOf("\n", index) + 1;
      const to = DB_SQL.indexOf("\n", index);
      return DB_SQL.slice(from, to === -1 ? DB_SQL.length : to);
    };

    const blanketResets = [
      ...DB_SQL.matchAll(/SET `voicePreference` = 'none'/g),
    ]
      .map(match => match.index ?? -1)
      // The catch-all that rescues an unrecognisable stored value is allowed.
      .filter(index => !lineAt(index).includes("NOT IN"))
      .filter(index => index < gate!.from || index >= gate!.to)
      .map(index => lineAt(index).trim());

    // Anything reaching the column any other way would run on every migration
    // pass and silence everybody who had chosen a voice since the last one.
    expect(blanketResets).toEqual([]);
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
    const voiceSteps = DB_SQL.split("\n").filter(
      line => line.includes("voicePreference") && line.includes("DEFAULT ")
    );
    expect(voiceSteps.length).toBeGreaterThan(0);
    for (const step of voiceSteps) {
      expect(step).toContain("DEFAULT 'none'");
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

  it("waits for the account to answer before it lets a voice through", () => {
    const page = read("client/src/pages/Conduit.tsx");
    const effect = page.slice(
      page.indexOf("let stored: unknown;") - 200,
      page.indexOf("}, [authLoading, isAuthenticated, user]);")
    );
    expect(effect).not.toEqual("");

    // While auth is still loading nothing is applied, so a message sent in
    // that window cannot be spoken. And a signed-in account never falls back
    // to whatever this browser happens to remember.
    expect(effect).toContain("if (authLoading) return;");
    expect(effect.indexOf("if (authLoading) return;")).toBeLessThan(
      effect.indexOf('localStorage.getItem("voicePreference")')
    );
    expect(effect).toMatch(
      /if \(isAuthenticated\) \{[\s\S]*?if \(!user\) return;/
    );
  });
});
