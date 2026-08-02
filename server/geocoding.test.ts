import { describe, expect, it } from "vitest";
import { getTimezoneForLocalDateTime } from "./geocoding";

describe("getTimezoneForLocalDateTime", () => {
  it("resolves the historical offset at the local birth moment", () => {
    const winter = getTimezoneForLocalDateTime(
      44.4268,
      26.1025,
      new Date("1985-01-15T00:00:00.000Z"),
      "14:30"
    );
    const summer = getTimezoneForLocalDateTime(
      44.4268,
      26.1025,
      new Date("1985-07-15T00:00:00.000Z"),
      "14:30"
    );

    expect(winter).toEqual({
      tzId: "Europe/Bucharest",
      offsetHours: 2,
    });
    expect(summer).toEqual({
      tzId: "Europe/Bucharest",
      offsetHours: 3,
    });
  });

  it("rejects a local time skipped by a DST transition", () => {
    expect(() =>
      getTimezoneForLocalDateTime(
        51.5074,
        -0.1278,
        new Date("2026-03-29T00:00:00.000Z"),
        "01:30"
      )
    ).toThrow(/does not exist.*timezone transition/i);
  });

  it("rejects a local time repeated by a DST transition", () => {
    expect(() =>
      getTimezoneForLocalDateTime(
        51.5074,
        -0.1278,
        new Date("2026-10-25T00:00:00.000Z"),
        "01:30"
      )
    ).toThrow(/ambiguous.*timezone transition/i);
  });
});
