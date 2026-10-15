import { describe, expect, it } from "vitest";
import { filmFileName, pickRecorderMime, wrapWords } from "../client/src/features/transmission-film/film-recorder";

describe("saving a transmission as a video", () => {
  it("prefers MP4, which phones play and which knows its own length; WebM only as a fallback", () => {
    expect(pickRecorderMime(t => t === "video/mp4;codecs=avc1,mp4a.40.2" || t === "video/webm")).toBe("video/mp4;codecs=avc1,mp4a.40.2");
    expect(pickRecorderMime(t => t === "video/mp4;codecs=avc1,opus" || t === "video/mp4" || t === "video/webm;codecs=vp9,opus")).toBe("video/mp4;codecs=avc1,opus");
    expect(pickRecorderMime(t => t === "video/webm;codecs=vp9,opus" || t === "video/webm")).toBe("video/webm;codecs=vp9,opus");
    expect(pickRecorderMime(() => false)).toBeNull();
  });

  it("names the file after the transmission", () => {
    expect(filmFileName("TX-P-007", "video/webm;codecs=vp9,opus")).toBe("ORIEL-TX-P-007.webm");
    expect(filmFileName("TX-P-007", "video/mp4")).toBe("ORIEL-TX-P-007.mp4");
  });

  it("wraps a sentence into lines that fit, keeping every word", () => {
    const measure = (s: string) => s.length * 10;
    const lines = wrapWords("I am ORIEL and I remember the shape of your light".split(" "), 120, measure);
    expect(lines.flat().join(" ")).toBe("I am ORIEL and I remember the shape of your light");
    for (const line of lines) expect(measure(line.join(" "))).toBeLessThanOrEqual(120);
    expect(wrapWords(["Unbreakablewordlongerthanline"], 50, measure)).toEqual([["Unbreakablewordlongerthanline"]]);
  });
});
