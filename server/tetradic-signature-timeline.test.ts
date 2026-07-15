import { describe, expect, it } from "vitest";

import {
  TETRADIC_CHAPTERS,
  getTetradicSceneState,
} from "../client/src/features/tetradic-signature/chapter-config";
import {
  TETRADIC_SIGNATURE_CONFIG,
  TETRAD_ONE_SPREAD,
  TETRAD_SYMBOLS,
} from "../client/src/features/tetradic-signature/tetradic-signature-config";
import { createCoronaSegments } from "../client/src/features/tetradic-signature/SampleArchiveSeal";

function atTetradProgress(progress: number) {
  const range = TETRADIC_CHAPTERS.tetradOne;
  return range.start + (range.end - range.start) * progress;
}

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

  it("keeps the first spread hidden until the cover is fully open", () => {
    const openingEnd = TETRADIC_CHAPTERS.opening.end;
    const atOpeningEnd = getTetradicSceneState(openingEnd);
    const afterOpening = getTetradicSceneState(openingEnd + 0.06);

    expect(atOpeningEnd.coverOpen).toBe(1);
    expect(atOpeningEnd.tetradOne.spreadReveal).toBe(0);
    expect(atOpeningEnd.tetradOne.title).toBe(0);
    expect(afterOpening.tetradOne.spreadReveal).toBeGreaterThan(0);
  });

  it("reconstructs identical scene states when progress moves backward", () => {
    const forward = [0.18, 0.48, 0.78].map(getTetradicSceneState);
    const reverse = [0.78, 0.48, 0.18].map(getTetradicSceneState);

    expect(reverse[1]).toEqual(forward[1]);
    expect(reverse[2]).toEqual(forward[0]);
  });

  it("keeps all narrative text hidden through the page turn and settle", () => {
    const duringTurn = getTetradicSceneState(atTetradProgress(0.1)).tetradOne;
    const settled = getTetradicSceneState(atTetradProgress(0.31)).tetradOne;

    expect(duringTurn.pageTurn).toBeGreaterThan(0);
    expect(duringTurn.eyebrow).toBe(0);
    expect(duringTurn.title).toBe(0);
    expect(duringTurn.description).toBe(0);
    expect(settled.settle).toBeGreaterThan(0.9);
    expect(settled.title).toBe(0);
  });

  it("introduces description after the title is already mostly visible", () => {
    const descriptionStart = getTetradicSceneState(
      atTetradProgress(0.4)
    ).tetradOne;
    const explanation = getTetradicSceneState(atTetradProgress(0.5)).tetradOne;

    expect(descriptionStart.title).toBeGreaterThan(0.6);
    expect(descriptionStart.description).toBeCloseTo(0, 10);
    expect(explanation.description).toBeGreaterThan(0);
    expect(explanation.labels).toBeGreaterThan(0);
  });

  it("withdraws labels, description, and title in that order before lift", () => {
    const labelsGone = getTetradicSceneState(atTetradProgress(0.82)).tetradOne;
    const descriptionGone = getTetradicSceneState(
      atTetradProgress(0.87)
    ).tetradOne;
    const lifting = getTetradicSceneState(atTetradProgress(0.91)).tetradOne;

    expect(labelsGone.labels).toBeCloseTo(0, 10);
    expect(labelsGone.description).toBeGreaterThan(0);
    expect(descriptionGone.description).toBeCloseTo(0, 10);
    expect(descriptionGone.title).toBeGreaterThan(0);
    expect(lifting.title).toBeCloseTo(0, 10);
    expect(lifting.pageLift).toBeGreaterThan(0);
  });

  it("keeps the final CTA visible at the end of the scroll", () => {
    expect(getTetradicSceneState(1).narrative.cta).toBe(1);
  });

  it("locks checkpoint naming, normalized symbols, and the pending route", () => {
    expect(TETRADIC_SIGNATURE_CONFIG.naming.system).toBe(
      "TETRADIC RESONANCE ARCHITECTURE"
    );
    expect(TETRADIC_SIGNATURE_CONFIG.naming.product).toBe(
      "THE TETRADIC SIGNATURE"
    );
    expect(TETRAD_ONE_SPREAD.title).toBe("THE THRESHOLD");
    expect(TETRAD_ONE_SPREAD.technicalLabels).toEqual([
      "SAMPLE RECEIVER RECORD: INITIALIZED",
      "ILLUSTRATIVE SEAL: GENERATED",
    ]);
    expect(TETRAD_SYMBOLS).toHaveLength(12);
    expect(TETRAD_SYMBOLS[0]).toBe("/assets/tetrads/01.png");
    expect(TETRAD_SYMBOLS[10]).toBe("/assets/tetrads/11.png");
    expect(TETRADIC_SIGNATURE_CONFIG.ctas.generateSignatureRoute).toBeNull();
    expect(TETRADIC_SIGNATURE_CONFIG.ctas.generateSignatureStatus).toBe(
      "AWAITING_GENERATOR_ROUTE"
    );
  });

  it("constructs a precise 64-segment seal with four cardinal points", () => {
    const corona = createCoronaSegments();

    expect(corona).toHaveLength(64);
    expect(corona.filter(segment => segment.cardinal)).toHaveLength(4);
    expect(
      corona.filter(segment => segment.cardinal).map(segment => segment.index)
    ).toEqual([0, 16, 32, 48]);
  });
});
