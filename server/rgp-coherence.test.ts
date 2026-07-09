import { describe, expect, it } from "vitest";
import { calculateCoherenceScore } from "./rgp-coherence";

describe("rgp-coherence", () => {
  it("calculates CS = 100 - (MN×3 + BT×3 + ET×3) + (BC×10)", () => {
    expect(
      calculateCoherenceScore({
        mentalNoise: 0,
        bodyTension: 0,
        emotionalTurbulence: 0,
        breathCompletion: 1,
      })
    ).toBe(100);

    expect(
      calculateCoherenceScore({
        mentalNoise: 10,
        bodyTension: 10,
        emotionalTurbulence: 10,
        breathCompletion: 0,
      })
    ).toBe(10);

    expect(
      calculateCoherenceScore({
        mentalNoise: 5,
        bodyTension: 5,
        emotionalTurbulence: 5,
        breathCompletion: 1,
      })
    ).toBe(65);

    expect(
      calculateCoherenceScore({
        mentalNoise: 5,
        bodyTension: 5,
        emotionalTurbulence: 5,
        breathCompletion: 0,
      })
    ).toBe(55);
  });

  it("clamps coherence score between 0 and 100", () => {
    expect(
      calculateCoherenceScore({
        mentalNoise: 0,
        bodyTension: 0,
        emotionalTurbulence: 0,
        breathCompletion: 1,
      })
    ).toBeLessThanOrEqual(100);

    expect(
      calculateCoherenceScore({
        mentalNoise: 10,
        bodyTension: 10,
        emotionalTurbulence: 10,
        breathCompletion: 0,
      })
    ).toBeGreaterThanOrEqual(0);
  });
});