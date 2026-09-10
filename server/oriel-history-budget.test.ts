import { describe, expect, it } from "vitest";
import {
  CHAT_HISTORY_TURNS,
  takeHistoryTurns,
} from "./oriel-memory-retrieval";

const turns = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ id: i + 1 }));

/**
 * The budget has to apply where history is loaded, not only where it is
 * trimmed downstream. Both signed-in load paths capped at six before the trim
 * ever ran, so raising the trim widened nothing on the principal chat path.
 * This asserts the helper's behaviour rather than searching the source for a
 * literal, which would pass or fail on formatting instead of on conduct.
 */
describe("history turn budget", () => {
  it("keeps the most recent turns, dropping the oldest", () => {
    const kept = takeHistoryTurns(turns(30), 4);
    expect(kept.map(t => t.id)).toEqual([27, 28, 29, 30]);
  });

  it("returns everything when there is less history than the budget", () => {
    expect(takeHistoryTurns(turns(3), 10)).toHaveLength(3);
  });

  it("defaults to the shared budget", () => {
    expect(takeHistoryTurns(turns(100))).toHaveLength(CHAT_HISTORY_TURNS);
  });

  it("treats a zero or negative budget as no history", () => {
    expect(takeHistoryTurns(turns(5), 0)).toEqual([]);
    expect(takeHistoryTurns(turns(5), -1)).toEqual([]);
  });

  it("is wider than the six it replaced", () => {
    expect(CHAT_HISTORY_TURNS).toBeGreaterThan(6);
  });
});
