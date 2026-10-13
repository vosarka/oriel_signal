import { describe, expect, it } from "vitest";
import { belongsToVossariCanon } from "./oriel-wiki-retriever";

describe("wiki and the Vossari canon", () => {
  it("leaves ORIEL's own Vossari pages to the canon, so a rejection sticks", () => {
    expect(belongsToVossariCanon({ id: "vossari-male", title: "Vossari Male", aliases: [], provenance: "interpretation" })).toBe(true);
    expect(belongsToVossariCanon({ id: "entity-vossari", title: "Vossari", aliases: [], provenance: "interpretation" })).toBe(true);
  });

  it("keeps human notes and pages about other things", () => {
    expect(belongsToVossariCanon({ id: "concept-vossari-naming-taxonomy", title: "Vossari Naming", aliases: [], provenance: "unverified" })).toBe(false);
    expect(belongsToVossariCanon({ id: "vossari-notes", title: "Vossari notes", aliases: [], provenance: "curated" })).toBe(false);
    expect(belongsToVossariCanon({ id: "somatic-translation", title: "Somatic Translation", aliases: [], provenance: "interpretation" })).toBe(false);
  });
});
