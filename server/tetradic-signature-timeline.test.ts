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
});
