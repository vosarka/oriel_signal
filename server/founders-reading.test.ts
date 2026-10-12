import { describe, expect, it } from "vitest";
import { foundersReadingPrice, launchSeatsLeft } from "../shared/founders-reading";

describe("Founder's Reading launch price", () => {
  it("is €5 for the first 50, then €10 (Vos, 2026-10-12)", () => {
    expect(foundersReadingPrice(0)).toBe(5);
    expect(foundersReadingPrice(49)).toBe(5);
    expect(foundersReadingPrice(50)).toBe(10);
    expect(foundersReadingPrice(300)).toBe(10);
  });

  it("counts the launch seats left, never below zero", () => {
    expect(launchSeatsLeft(0)).toBe(50);
    expect(launchSeatsLeft(37)).toBe(13);
    expect(launchSeatsLeft(80)).toBe(0);
  });
});
