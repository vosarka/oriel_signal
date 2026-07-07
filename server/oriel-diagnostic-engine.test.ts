import { describe, expect, it } from "vitest";
import { performDiagnosticReading } from "./oriel-diagnostic-engine";
import type { CenterName } from "./vrc-mandala";

const VTRS_CENTERS: CenterName[] = [
  "Origin",
  "Mental",
  "Collapse",
  "Saturation",
  "Bridge",
  "Becoming",
  "Return",
  "Omega",
];

// CS = 40 (just above collapse); body-dominant load for VTRS center mapping
const carrierlock = {
  mentalNoise: 7,
  bodyTension: 9,
  emotionalTurbulence: 4,
  breathCompletion: 0 as const,
};

describe("oriel-diagnostic-engine (VTRS v2)", () => {
  it("returns grounding when coherence is below collapse threshold", async () => {
    const result = await performDiagnosticReading(
      {
        mentalNoise: 9,
        bodyTension: 9,
        emotionalTurbulence: 9,
        breathCompletion: 0,
      },
      ["RC02"],
      ["RC02"]
    );

    expect(result.coherenceScore).toBeLessThan(40);
    expect(result.flaggedCodons).toHaveLength(0);
    expect(result.microCorrection.codon).toBe("GROUND");
  });

  it("maps overactive centers to VTRS v2 names", async () => {
    const result = await performDiagnosticReading(
      carrierlock,
      ["RC02", "RC03"],
      ["RC02", "RC03"]
    );

    expect(VTRS_CENTERS).toContain(result.overactiveCenter);
    expect(result.coherenceScore).toBeGreaterThanOrEqual(40);
    expect(result.coherenceScore).toBeLessThan(60);
    expect(result.axisDominance).toBe("Body");
    expect(result.overactiveCenter).toBe("Becoming");
    expect(result.microCorrection.instruction.length).toBeGreaterThan(10);
  });

  it("uses canonical codon library data for static readings", async () => {
    const result = await performDiagnosticReading(
      {
        mentalNoise: 0,
        bodyTension: 0,
        emotionalTurbulence: 0,
        breathCompletion: 1,
      },
      ["RC01"],
      ["RC01"],
      "static",
      "1990-06-15"
    );

    expect(result.coherenceScore).toBe(100);
    expect(result.overactiveCenter).toBe("Origin");
    expect(result.microCorrection.instruction).toMatch(/gift|Aurora|natural/i);
  });
});