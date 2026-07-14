import { describe, expect, it } from "vitest";

import {
  TETRADIC_CHAPTERS,
  getTetradicSceneState,
} from "../client/src/features/tetradic-signature/chapter-config";

describe("Tetradic Signature scroll timeline", () => {
  it("clamps normalized progress to the 0–1 range", () => {
    expect(getTetradicSceneState(-0.5).progress).toBe(0);
    expect(getTetradicSceneState(1.5).progress).toBe(1);
  });

  it("opens the cover directly from its centralized chapter range", () => {
    const { start, end } = TETRADIC_CHAPTERS.opening;

    expect(getTetradicSceneState(start).coverOpen).toBe(0);
    expect(getTetradicSceneState((start + end) / 2).coverOpen).toBeCloseTo(0.5);
    expect(getTetradicSceneState(end).coverOpen).toBe(1);
  });

  it("reconstructs identical scene states when progress moves backward", () => {
    const forward = [0.18, 0.48, 0.82].map(getTetradicSceneState);
    const reverse = [0.82, 0.48, 0.18].map(getTetradicSceneState);

    expect(reverse[1]).toEqual(forward[1]);
    expect(reverse[2]).toEqual(forward[0]);
  });

  it("reports the configured approach and opening chapters", () => {
    expect(
      getTetradicSceneState(TETRADIC_CHAPTERS.revelation.end).activeChapter
    ).toBe("approach");
    expect(
      getTetradicSceneState(TETRADIC_CHAPTERS.opening.start).activeChapter
    ).toBe("opening");
  });

  it("keeps the final CTA visible at the end of the scroll", () => {
    expect(getTetradicSceneState(1).narrative.cta).toBe(1);
  });

  it("finishes each book movement before the next scene begins", () => {
    expect(TETRADIC_CHAPTERS.approach.start).toBeGreaterThanOrEqual(
      TETRADIC_CHAPTERS.revelation.end
    );
    expect(TETRADIC_CHAPTERS.opening.start).toBeGreaterThanOrEqual(
      Math.max(
        TETRADIC_CHAPTERS.approach.end,
        TETRADIC_CHAPTERS.orientation.end
      )
    );
    expect(TETRADIC_CHAPTERS.tetradOne.start).toBeGreaterThanOrEqual(
      TETRADIC_CHAPTERS.opening.end
    );
    expect(getTetradicSceneState(TETRADIC_CHAPTERS.opening.end).tetradOne).toBe(
      0
    );
  });
});
