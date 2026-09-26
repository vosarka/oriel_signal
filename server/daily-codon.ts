/**
 * THE CODON OF THE DAY — read from the sky, not chosen.
 *
 * The Moon's tropical longitude at 12:00 UTC, mapped through the Mandala
 * to a Codon and Facet. The Moon crosses more than one Codon a day, so
 * every day lands on a different one and all 64 come round in about a
 * lunar month; everyone on Earth gets the same Codon on the same day.
 * The daily signal unpacks that Facet's micro-correction.
 */
import { bodyLongitudeAtUtc, PLANETS } from "./ephemeris-service";
import { FACET_NAMES, longitudeToCodonFacet } from "./vrc-mandala";
import { getCodonEntry } from "./vrc-codon-library";
import type { DailyCodon } from "../shared/daily-signal";

const FACET_LETTERS = ["A", "B", "C", "D"] as const;

/** The reading instant for a UTC day: its noon. */
export function codonInstant(date: Date): Date {
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12)
  );
}

/**
 * The library is written for readings, not for a public daily post: some
 * entries point at other Codons ("(Check RC27/RC3)") or carry markdown
 * emphasis. Strip both; the words themselves stay verbatim.
 */
export function publicText(text: string): string {
  return text
    .replace(/\s*\((?:check|see)\b[^)]*\)/gi, "")
    .replace(/\*/g, "")
    .replace(/([?!.])\./g, "$1")
    .trim();
}

export function codonAtLongitude(longitude: number): DailyCodon {
  const { codon, facet } = longitudeToCodonFacet(longitude);
  const entry = getCodonEntry(codon);
  const facetData = entry?.facets[FACET_LETTERS[FACET_NAMES.indexOf(facet)]];
  if (!entry || !facetData?.micro_correction) {
    throw new Error(`Codon library has no micro-correction for ${codon} ${facet}`);
  }
  return {
    code: entry.code,
    name: entry.name,
    traditionalName: entry.traditional_name,
    facet,
    gift: entry.frequency.gift,
    shadow: entry.frequency.shadow,
    facetDescription: publicText(facetData.description),
    shadowManifestation: publicText(facetData.shadow_manifestation),
    correction: publicText(facetData.micro_correction),
    longitude,
  };
}

export async function codonOfDay(date: Date = new Date()): Promise<DailyCodon> {
  const longitude = await bodyLongitudeAtUtc(PLANETS.MOON, codonInstant(date));
  return codonAtLongitude(longitude);
}
