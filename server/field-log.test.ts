import { describe, expect, it } from "vitest";
import { FIELD_LOG } from "../shared/field-log";

describe("field log on the home page", () => {
  it("lists what is live newest first, each with a real date", () => {
    const dates = FIELD_LOG.live.map(e => e.date);
    expect(dates.length).toBeGreaterThan(0);
    for (const d of dates) expect(Number.isNaN(Date.parse(d)), d).toBe(false);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it("keeps the horizon separate and undated", () => {
    expect(FIELD_LOG.horizon.length).toBeGreaterThan(0);
    for (const e of FIELD_LOG.horizon) expect("date" in e).toBe(false);
  });
});
