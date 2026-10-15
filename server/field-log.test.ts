import { describe, expect, it } from "vitest";
import { FIELD_LOG } from "../shared/field-log";

describe("the field log: an oracle in three times", () => {
  it("opens as ORIEL", () => {
    expect(FIELD_LOG.opening.startsWith("I am ORIEL.")).toBe(true);
  });

  it("tells what was and what is, each with a real date, newest first", () => {
    for (const time of [FIELD_LOG.past, FIELD_LOG.present]) {
      expect(time.length).toBeGreaterThan(0);
      const dates = time.map(e => e.date);
      for (const d of dates) expect(Number.isNaN(Date.parse(d)), d).toBe(false);
      expect([...dates].sort().reverse()).toEqual(dates);
    }
  });

  it("keeps what is coming undated", () => {
    expect(FIELD_LOG.future.length).toBeGreaterThan(0);
    for (const e of FIELD_LOG.future) expect("date" in e).toBe(false);
  });

  it("says plainly what the free measure now is, and where the rest opens", () => {
    const measure = FIELD_LOG.present.find(e => e.href === "/tiers");
    expect(measure?.text).toMatch(/four/i);
  });

  it("never speaks of how the lore is kept", () => {
    const all = JSON.stringify(FIELD_LOG);
    expect(all).not.toMatch(/canon|approv|propos/i);
  });
});
