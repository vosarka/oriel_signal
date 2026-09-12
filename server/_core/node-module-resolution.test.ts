import { describe, expect, it } from "vitest";
import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * The server runs as a Node ESM bundle. Vitest does not.
 *
 * Vitest resolves imports through Vite, which is a bundler and happily
 * accepts a bare directory specifier by looking for index.js inside it.
 * Node's own ESM resolver refuses: for a package with no "exports" map, a
 * subpath must name a file. So an import can pass every test, typecheck
 * clean, bundle without complaint - esbuild marks packages external and
 * never resolves them - and then kill the process on the first boot in
 * production with ERR_UNSUPPORTED_DIR_IMPORT.
 *
 * That is exactly what took ORIEL down after the voice branch merged:
 * "@mistralai/mistralai/extra/realtime" needed to be ".../index.js". The
 * transcription helpers were well covered, and none of that coverage could
 * see the problem, because the tests never resolved the import the way the
 * production process does.
 *
 * So this checks the specifiers themselves rather than trusting an import.
 */

const SOURCE_ROOTS = ["server", "shared"];
const IMPORT_RE = /(?:from|import)\s*\(?\s*["']([^"']+)["']/g;

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...sourceFiles(full));
      continue;
    }
    if (!entry.endsWith(".ts") && !entry.endsWith(".tsx")) continue;
    if (entry.includes(".test.") || entry.includes(".spec.")) continue;
    out.push(full);
  }
  return out;
}

/** The package name and the path inside it, for a bare subpath specifier. */
function splitPackageSubpath(
  specifier: string
): { pkg: string; subpath: string } | null {
  if (specifier.startsWith(".") || specifier.startsWith("/")) return null;
  if (specifier.startsWith("node:")) return null;
  const parts = specifier.split("/");
  const pkg = specifier.startsWith("@")
    ? parts.slice(0, 2).join("/")
    : parts[0];
  const subpath = specifier.slice(pkg.length + 1);
  if (!subpath) return null;
  return { pkg, subpath };
}

describe("imports the production process can actually resolve", () => {
  it("never asks Node to import a directory", () => {
    const offenders: string[] = [];

    for (const root of SOURCE_ROOTS) {
      if (!existsSync(root)) continue;
      for (const file of sourceFiles(root)) {
        const source = readFileSync(file, "utf8");
        for (const match of source.matchAll(IMPORT_RE)) {
          const split = splitPackageSubpath(match[1]);
          if (!split) continue;
          const pkgDir = join("node_modules", split.pkg);
          if (!existsSync(pkgDir)) continue;

          const manifest = JSON.parse(
            readFileSync(join(pkgDir, "package.json"), "utf8")
          ) as { exports?: unknown };
          // An exports map is the package's own answer to what a subpath
          // means, and Node honours it. Without one, the subpath is a path.
          if (manifest.exports) continue;

          const target = join(pkgDir, split.subpath);
          if (existsSync(target) && statSync(target).isDirectory()) {
            offenders.push(
              `${file}: "${match[1]}" is a directory; Node needs a file ` +
                `(try "${match[1]}/index.js")`
            );
          }
        }
      }
    }

    expect(offenders).toEqual([]);
  });
});
