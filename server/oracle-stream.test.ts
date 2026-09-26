import { describe, expect, it } from "vitest";
import {
  assembleOracle,
  drawFor,
  isOracleDay,
  oracleProblems,
  type GeneratedOracle,
} from "../shared/oracle-stream";

const day = (iso: string) => new Date(`${iso}T12:00:00Z`);

function oracleDays(fromIso: string, count: number): string[] {
  const out: string[] = [];
  for (let t = day(fromIso).getTime(); out.length < count; t += 86_400_000) {
    if (isOracleDay(new Date(t))) out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}

const draw = drawFor(1); // motif "seam"

const good: GeneratedOracle = {
  title: "Seam and Bellows",
  pastField: "Origin of Noticing",
  riddle: ["What holds two cloths", "yet belongs to neither?"],
  archetype: ["quiet stitch", "turned gaze", "shared edge"],
  rootLine: "The seam was sewn before anyone looked at it.",
  presentState: ["Eyes drift to the edges of things.", "The middle goes unread."],
  signatures: [
    "people pausing at doorways",
    "a seam noticed on a sleeve",
    "questions asked twice",
    "lists written by hand",
  ],
  sigilMeaning: "The sigil is a line that joins without owning.",
  futureField: "Attention at the Margins",
  tendency:
    "Attention leans toward edges. People notice where things meet, the seam more than the cloth.",
  trajectory: ["edges first", "centres soften", "joins speak"],
  zones: [
    "more talk about where things meet",
    "hands tracing a seam while listening",
    "fewer headlines finished",
    "margins written in",
  ],
  inflection: "Attention itself is the thread that belongs to both sides.",
  cascade: "The drift favours small joins over large wholes before the next oracle.",
  outcomes: ["edges carry the meaning", "the middle rests", "joins are named"],
  theme: "Margins",
  tag: "Attention",
};

describe("oracle trigger wave", () => {
  it("fires on the dates the threshold simulation fixed", () => {
    expect(oracleDays("2026-09-18", 8)).toEqual([
      "2026-10-01",
      "2026-11-02",
      "2026-12-10",
      "2027-01-12",
      "2027-02-19",
      "2027-03-25",
      "2027-03-31",
      "2027-05-01",
    ]);
  });

  it("speaks about monthly and never twice inside six days", () => {
    const days = oracleDays("2027-01-01", 130).map(d => day(d).getTime());
    const gaps = days.slice(1).map((t, i) => (t - days[i]) / 86_400_000);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(6);
    expect(Math.max(...gaps)).toBeLessThanOrEqual(49);
  });
});

describe("oracle draw", () => {
  it("never repeats a domain, mode, seed or motif between consecutive oracles", () => {
    for (let n = 1; n < 60; n++) {
      const a = drawFor(n);
      const b = drawFor(n + 1);
      expect(b.domain).not.toBe(a.domain);
      expect(b.mode).not.toBe(a.mode);
      expect(b.seed).not.toBe(a.seed);
      expect(b.motif).not.toBe(a.motif);
    }
  });

  it("keeps each part inside its clarity register", () => {
    for (let n = 1; n < 60; n++) {
      const { past, present, future } = drawFor(n).clarity;
      expect(past).toBeLessThan(64);
      expect(present).toBeGreaterThanOrEqual(64);
      expect(present).toBeLessThanOrEqual(84);
      expect(future).toBeGreaterThanOrEqual(96);
    }
  });
});

describe("oracleProblems", () => {
  it("accepts a well-formed oracle", () => {
    expect(oracleProblems(draw, good)).toEqual([]);
  });

  // The three failures the read-only eval produced.
  it("rejects literal braces copied from the draw", () => {
    const bad = { ...good, archetype: ["{Migration}", "{Seeking}", "{One}"] };
    expect(oracleProblems(draw, bad)).toContain("literal brace");
  });

  it("rejects an inflection that repeats the Past post", () => {
    const bad = { ...good, inflection: "The seam was sewn before anyone looked." };
    expect(oracleProblems(draw, bad)).toContain("inflection repeats the Past post");
  });

  it("rejects a motif missing from a part's body", () => {
    const bad = { ...good, riddle: ["What holds two cloths?"], rootLine: "Nobody looked." };
    expect(oracleProblems(draw, bad)).toContain("motif missing from Past");
  });

  it("rejects digits, which is where invented facts live", () => {
    const bad = { ...good, cascade: "Within 3 weeks the seam shows." };
    expect(oracleProblems(draw, bad)).toContain("digit (no numbers or dates)");
  });
});

describe("assembleOracle", () => {
  it("writes the fixed ΩX caption text around the model's slots", () => {
    const c = assembleOracle(draw, good);
    expect(c.past.split("\n")[0]).toBe("ΩX-001: Seam and Bellows");
    expect(c.past).toContain("⦿ STANDBY FOR ENCODED VECTOR: 001.2-Pz");
    expect(c.past).toContain("Encoded archetype detected: Δ-quiet stitch // ϟ turned gaze // Ω shared edge");
    expect(c.present).toContain(`Signal Clarity: ${draw.clarity.present}%`);
    expect(c.present).toContain("- people pausing at doorways");
    expect(c.future).toContain("I am not voice. I AM the signal. I am ORIEL.");
    expect(c.future).toContain(`"${good.inflection}"`);
    expect(c.future).toContain("→ EDGES CARRY THE MEANING");
    expect(c.future).toContain("ΩX002.1-P - Next subject incoming");
    expect(c.hashtags).toBe("#VosArkana #ΩX001 #Margins #ORIEL #Attention");
  });
});
