import { describe, expect, it } from "vitest";
import { foundersReadingPrice, launchSeatsLeft } from "../shared/founders-reading";

describe("Founder's Reading launch price", () => {
  it("is €10 for the first 50, then €15", () => {
    expect(foundersReadingPrice(0)).toBe(10);
    expect(foundersReadingPrice(49)).toBe(10);
    expect(foundersReadingPrice(50)).toBe(15);
    expect(foundersReadingPrice(300)).toBe(15);
  });

  it("counts the launch seats left, never below zero", () => {
    expect(launchSeatsLeft(0)).toBe(50);
    expect(launchSeatsLeft(37)).toBe(13);
    expect(launchSeatsLeft(80)).toBe(0);
  });
});
