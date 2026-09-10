import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { CHAT_HISTORY_TURNS } from "./oriel-memory-retrieval";

/**
 * The budget is applied where history is loaded, not only where it is trimmed.
 * Both signed-in load paths capped at six messages before the trim ever ran,
 * so raising the trim widened nothing on the principal chat path.
 */
describe("history budget reaches the signed-in path", () => {
  const routers = readFileSync("server/routers.ts", "utf8");

  it("loads history against the budget, with no hardcoded cap left", () => {
    expect(routers).not.toContain("history.slice(-6)");
    expect(routers.match(/history\.slice\(-CHAT_HISTORY_TURNS\)/g)).toHaveLength(
      2
    );
  });

  it("keeps the budget wider than the six it replaced", () => {
    expect(CHAT_HISTORY_TURNS).toBeGreaterThan(6);
  });
});
