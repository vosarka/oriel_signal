import { describe, expect, it } from "vitest";
import { codonAtLongitude, codonOfDay, publicText } from "./daily-codon";
import { longitudeToCodonFacet } from "./vrc-mandala";

describe("codon of the day", () => {
  it("maps a longitude to its Mandala Codon and that Facet's canon text", () => {
    // 11.25° is the Mandala's first slot, Codon 51, first facet.
    const c = codonAtLongitude(11.3);
    expect(c.code).toBe("RC51");
    expect(c.facet).toBe("Somatic");
    expect(c.correction.length).toBeGreaterThan(20);
    expect(c.shadowManifestation.length).toBeGreaterThan(20);
  });

  it("strips cross-references and markdown from the canon text", () => {
    expect(publicText("Do you have the sustenance? (Check RC27/RC3).")).toBe(
      "Do you have the sustenance?"
    );
    expect(publicText("Believing you *must* suffer.")).toBe("Believing you must suffer.");
  });

  it("reads the Moon, so no two days in a row share a Codon", async () => {
    const codes: string[] = [];
    for (let day = 0; day < 30; day++) {
      const c = await codonOfDay(new Date(Date.UTC(2026, 8, 25 + day)));
      expect(longitudeToCodonFacet(c.longitude).facet).toBe(c.facet);
      codes.push(c.code);
    }
    for (let i = 1; i < codes.length; i++) expect(codes[i]).not.toBe(codes[i - 1]);
    // About a lunar month covers most of the wheel.
    expect(new Set(codes).size).toBeGreaterThan(20);
  });

  it("is the same Codon for the whole UTC day", async () => {
    const morning = await codonOfDay(new Date(Date.UTC(2026, 8, 25, 1)));
    const night = await codonOfDay(new Date(Date.UTC(2026, 8, 25, 23)));
    expect(night.code).toBe(morning.code);
    expect(night.facet).toBe(morning.facet);
  });
});
