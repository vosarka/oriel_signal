import { describe, expect, it } from "vitest";
import { actAt, filmSeed, flowAt, flowSentences, voiceBand } from "../shared/transmission-film";

const script = {
  title: "T",
  mirror: "You carry a quiet fire. It turns every skill into an altar.",
  threshold: "Something is ending.",
  gift: "Put your palm on the table. Listen.",
};

describe("the text flowing with the voice", () => {
  const s = flowSentences(script);

  it("splits each movement into sentences, in spoken order, covering the whole voice", () => {
    expect(s.map(x => x.text)).toEqual([
      "You carry a quiet fire.",
      "It turns every skill into an altar.",
      "Something is ending.",
      "Put your palm on the table.",
      "Listen.",
    ]);
    expect(s.map(x => x.movement)).toEqual([0, 0, 1, 2, 2]);
    expect(s[0].start).toBe(0);
    expect(s[s.length - 1].end).toBeCloseTo(1);
    for (let i = 1; i < s.length; i++) expect(s[i].start).toBeCloseTo(s[i - 1].end);
  });

  it("reveals the sentence being spoken word by word", () => {
    expect(flowAt(s, 0)).toEqual({ index: 0, words: 1 });
    const mid = (s[1].start + s[1].end) / 2;
    const at = flowAt(s, mid);
    expect(at.index).toBe(1);
    expect(at.words).toBeGreaterThan(1);
    expect(at.words).toBeLessThan(7);
    expect(flowAt(s, 1)).toEqual({ index: 4, words: 1 });
  });
});

describe("the act follows the voice", () => {
  const starts = [0, 0.5, 0.75];
  it("holds each act and crossfades at the boundary", () => {
    expect(actAt(starts, 0.2)).toBe(0);
    expect(actAt(starts, 0.6)).toBe(1);
    expect(actAt(starts, 0.9)).toBe(2);
    const edge = actAt(starts, 0.495);
    expect(edge).toBeGreaterThan(0);
    expect(edge).toBeLessThan(1);
  });
});

describe("the voice band", () => {
  const fftSize = 1024;
  const sampleRate = 48000; // 46.9 Hz a bin
  const bins = new Uint8Array(fftSize / 2);

  it("is silent when nothing sounds in the speech range", () => {
    bins.fill(0);
    bins[1] = 255; // ~47 Hz rumble, below speech
    bins[300] = 255; // ~14 kHz hiss, above speech
    expect(voiceBand(bins, sampleRate, fftSize).level).toBe(0);
  });

  it("rises with energy in the speech range, and reads a brighter voice as brighter", () => {
    bins.fill(0);
    for (let i = 3; i < 12; i++) bins[i] = 200; // 140-560 Hz: a low voice
    const low = voiceBand(bins, sampleRate, fftSize);
    bins.fill(0);
    for (let i = 40; i < 80; i++) bins[i] = 200; // 1.9-3.7 kHz: a bright voice
    const high = voiceBand(bins, sampleRate, fftSize);
    expect(low.level).toBeGreaterThan(0);
    expect(high.bright).toBeGreaterThan(low.bright);
  });
});

describe("each transmission its own geometry", () => {
  it("is stable for a serial and differs between serials", () => {
    expect(filmSeed("TX-P-007")).toEqual(filmSeed("TX-P-007"));
    expect(filmSeed("TX-P-007")).not.toEqual(filmSeed("TX-P-008"));
    const { fold } = filmSeed("TX-P-123");
    expect(fold).toBeGreaterThanOrEqual(5);
    expect(fold).toBeLessThanOrEqual(9);
  });
});
