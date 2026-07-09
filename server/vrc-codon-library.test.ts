import { describe, expect, it } from "vitest";
import {
  getCodonEntry,
  getFrequencyData,
  getVossariName,
} from "./vrc-codon-library";

describe("vrc-codon-library", () => {
  it("loads all 64 canonical codon entries", () => {
    const ids = Array.from({ length: 64 }, (_, i) => i + 1);
    for (const id of ids) {
      expect(getCodonEntry(id)).toBeDefined();
    }
  });

  it("exposes required fields on each codon entry", () => {
    for (let id = 1; id <= 64; id++) {
      const entry = getCodonEntry(id)!;
      expect(entry.code).toMatch(/^RC\d{2}$/);
      expect(entry.name.length).toBeGreaterThan(0);
      expect(entry.traditional_name.length).toBeGreaterThan(0);
      expect(entry.frequency.shadow.length).toBeGreaterThan(0);
      expect(entry.frequency.gift.length).toBeGreaterThan(0);
      expect(entry.facets.A.micro_correction.length).toBeGreaterThan(0);
    }
  });

  it("uses canonical Vossari naming for RC01", () => {
    expect(getVossariName(1)).toBe("AURORA");
    expect(getFrequencyData(1)?.gift).toBe("Freshness");
  });

  it("defines RC64", () => {
    expect(getCodonEntry(64)).toBeDefined();
    expect(getVossariName(64).length).toBeGreaterThan(0);
  });
});