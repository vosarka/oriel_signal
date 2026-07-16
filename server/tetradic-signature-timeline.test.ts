import { describe, expect, it } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  TETRADIC_CHAPTERS,
  TETRADIC_CHOREOGRAPHY,
  getTetradicSceneState,
} from "../client/src/features/tetradic-signature/chapter-config";
import {
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_TIMELINE,
  TETRAD_ONE_SPREAD,
  TETRAD_SYMBOLS,
} from "../client/src/features/tetradic-signature/tetradic-signature-config";
import { createCoronaSegments } from "../client/src/features/tetradic-signature/SampleArchiveSeal";
import { TetradicNarrative } from "../client/src/features/tetradic-signature/TetradicNarrative";

function atTetradProgress(progress: number) {
  const range = TETRADIC_CHAPTERS.tetradOne;
  return range.start + (range.end - range.start) * progress;
}

function atSvh(svh: number) {
  return getTetradicSceneState(svh / TETRADIC_TIMELINE.totalSvh);
}

function atRangeProgress(
  range: Readonly<{ start: number; end: number }>,
  progress: number
) {
  return getTetradicSceneState(range.start + (range.end - range.start) * progress);
}

describe("Tetradic Signature scroll timeline", () => {
  it("covers one continuous master film and reconstructs every segment in reverse", () => {
    const segments = TETRADIC_CHOREOGRAPHY.flatMap(chapter => [
      chapter.core,
      chapter.transitionOut.range,
    ]);

    expect(segments[0].start).toBe(0);
    segments.slice(1).forEach((segment, index) => {
      expect(segment.start).toBe(segments[index].end);
    });
    expect(segments.at(-1)?.end).toBe(1);
    expect(TETRADIC_TIMELINE.checkpointEndProgress).toBeCloseTo(560 / 2400);

    const checkpoints = segments
      .flatMap(segment => [segment.start, (segment.start + segment.end) / 2])
      .concat(1);
    const forward = checkpoints.map(getTetradicSceneState);
    const backward = [...checkpoints]
      .reverse()
      .map(getTetradicSceneState)
      .reverse();

    expect(backward).toEqual(forward);
    expect(
      getTetradicSceneState(TETRADIC_CHOREOGRAPHY[0].core.end)
    ).toMatchObject({
      activeSegment: "tetrad-01",
      activeChapter: "tetrad-one",
    });
    expect(
      getTetradicSceneState(TETRADIC_CHOREOGRAPHY[1].core.end)
    ).toMatchObject({
      activeSegment: "tetrad-02",
      activeChapter: "tetrad-two",
    });
    expect(
      getTetradicSceneState(TETRADIC_TIMELINE.checkpointEndProgress)
    ).toMatchObject({
      activeSegment: "tetrad-03",
      activeChapter: "tetrad-three",
    });
  });

  it("clamps normalized progress to the 0–1 range", () => {
    expect(getTetradicSceneState(-0.5).progress).toBe(0);
    expect(getTetradicSceneState(1.5).progress).toBe(1);
  });

  it("opens the cover through its phased centralized chapter range", () => {
    const { start, end } = TETRADIC_CHAPTERS.opening;
    const midpoint = getTetradicSceneState((start + end) / 2);

    expect(getTetradicSceneState(start).coverOpen).toBe(0);
    expect(midpoint.coverOpen).toBeGreaterThan(0.7);
    expect(midpoint.coverOpen).toBeLessThan(0.9);
    expect(midpoint.coverOpen).toBe(midpoint.opening.coverRotation);
    expect(getTetradicSceneState(end).coverOpen).toBe(1);
  });

  it("sequences release, cover travel, reading camera, and open settle", () => {
    const hold = atSvh(60);
    const release = atSvh(68);
    const rotation = atSvh(84);
    const reading = atSvh(100);
    const settled = atSvh(110);

    expect(hold.coverOpen).toBe(0);
    expect(release.opening.release).toBeGreaterThan(0);
    expect(release.coverOpen).toBe(0);
    expect(rotation.coverOpen).toBeGreaterThan(0);
    expect(rotation.opening.readingAngle).toBe(0);
    expect(reading.coverOpen).toBe(1);
    expect(reading.opening.readingAngle).toBeGreaterThan(0);
    expect(reading.opening.settle).toBe(0);
    expect(settled.opening.settle).toBe(1);
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
    const settled = getTetradicSceneState(atTetradProgress(0.36)).tetradOne;

    expect(duringTurn.pageTurn).toBeGreaterThan(0);
    expect(duringTurn.eyebrow).toBe(0);
    expect(duringTurn.title).toBe(0);
    expect(duringTurn.description).toBe(0);
    expect(settled.settle).toBeGreaterThan(0.9);
    expect(settled.title).toBe(0);
  });

  it("introduces description after the title is already mostly visible", () => {
    const descriptionStart = getTetradicSceneState(
      atTetradProgress(0.48)
    ).tetradOne;
    const explanation = getTetradicSceneState(atTetradProgress(0.56)).tetradOne;

    expect(descriptionStart.title).toBeGreaterThan(0.6);
    expect(descriptionStart.description).toBeCloseTo(0, 10);
    expect(explanation.description).toBeGreaterThan(0);
    expect(explanation.labels).toBeGreaterThan(0);
  });

  it("withdraws labels, description, and title in that order before lift", () => {
    const labelsGone = getTetradicSceneState(atTetradProgress(0.84)).tetradOne;
    const descriptionGone = getTetradicSceneState(
      atTetradProgress(0.89)
    ).tetradOne;
    const lifting = getTetradicSceneState(atTetradProgress(0.93)).tetradOne;

    expect(labelsGone.labels).toBeCloseTo(0, 10);
    expect(labelsGone.description).toBeGreaterThan(0);
    expect(descriptionGone.description).toBeCloseTo(0, 10);
    expect(descriptionGone.title).toBeGreaterThan(0);
    expect(lifting.title).toBeCloseTo(0, 10);
    expect(lifting.pageLift).toBeGreaterThan(0);
  });

  it("turns and settles the Tetrad 01 page before revealing Tetrad 02", () => {
    const range = TETRADIC_CHOREOGRAPHY[0].transitionOut.range;
    const early = atRangeProgress(range, 0.1).transitionOneToTwo;
    const crossing = atRangeProgress(range, 0.6).transitionOneToTwo;
    const settled = atRangeProgress(range, 0.76).transitionOneToTwo;

    expect(early.pageTurn).toBeGreaterThan(0);
    expect(early.spreadSwap).toBe(0);
    expect(crossing.pageTurn).toBeGreaterThan(crossing.spreadSwap);
    expect(settled.pageTurn).toBe(1);
    expect(settled.pageSettle).toBe(1);
    expect(settled.spreadSwap).toBe(1);
  });

  it("stabilizes Tetrads 02 and 03 before their narrative and journey", () => {
    const tetradTwo = TETRADIC_CHOREOGRAPHY[1].core;
    const tetradThree = TETRADIC_CHOREOGRAPHY[2].core;
    const twoSettled = atRangeProgress(tetradTwo, 0.18).tetradTwo;
    const twoReadable = atRangeProgress(tetradTwo, 0.5).tetradTwo;
    const threeSettled = atRangeProgress(tetradThree, 0.18).tetradThree;
    const threeReadable = atRangeProgress(tetradThree, 0.42).tetradThree;
    const threeJourneyComplete = atRangeProgress(tetradThree, 0.82).tetradThree;

    expect(twoSettled.settle).toBe(1);
    expect(twoSettled.title).toBe(0);
    expect(twoReadable.title).toBe(1);
    expect(twoReadable.statement).toBe(1);
    expect(twoReadable.orbit).toBe(1);
    expect(threeSettled.settle).toBe(1);
    expect(threeSettled.title).toBe(0);
    expect(threeReadable.statement).toBe(1);
    expect(threeReadable.horizontalJourney).toBe(0);
    expect(threeJourneyComplete.horizontalJourney).toBe(1);
  });

  it("separates the Tetrad 02 page turn, fold dive, and celestial reveal", () => {
    const range = TETRADIC_CHOREOGRAPHY[1].transitionOut.range;
    const anticipation = atRangeProgress(range, 0.06).transitionTwoToThree;
    const pageTravel = atRangeProgress(range, 0.5).transitionTwoToThree;
    const foldTravel = atRangeProgress(range, 0.7).transitionTwoToThree;
    const celestial = atRangeProgress(range, 0.9).transitionTwoToThree;

    expect(anticipation.pageAnticipation).toBeGreaterThan(0);
    expect(anticipation.pageTurn).toBe(0);
    expect(pageTravel.pageTurn).toBeGreaterThan(0);
    expect(pageTravel.foldDive).toBe(0);
    expect(pageTravel.celestialReveal).toBe(0);
    expect(foldTravel.pageTurn).toBe(1);
    expect(foldTravel.foldDive).toBeGreaterThan(0);
    expect(foldTravel.celestialReveal).toBe(0);
    expect(celestial.foldDive).toBe(1);
    expect(celestial.celestialReveal).toBeGreaterThan(0);
  });

  it("keeps the final CTA out of the Tetrads 01–03 checkpoint", () => {
    expect(
      getTetradicSceneState(TETRADIC_TIMELINE.checkpointEndProgress).cta
    ).toBe(0);
    expect(
      getTetradicSceneState(TETRADIC_TIMELINE.checkpointEndProgress).narrative
        .cta
    ).toBe(0);
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
    expect(TETRADIC_SIGNATURE_CONFIG.assets.environment).toBe(
      "/assets/tetradic-signature/pedestal-scene-final.png"
    );
    expect(TETRADIC_SIGNATURE_CONFIG.sample).toEqual({
      receiver: "RECEIVER 001",
      recordStatus: "INITIALIZED",
      birthRecord: "REDACTED",
      coordinates: "REDACTED",
      archiveId: "ORL-TDS-001",
    });
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

  it("provides a semantic equivalent for the canvas-only archive record", () => {
    const markup = renderToStaticMarkup(
      createElement(TetradicNarrative, { reducedMotion: false })
    );

    expect(markup).toContain("<dl>");
    expect(markup).toContain("Illustrative public sample record");
    expect(markup).toContain("No verified ephemeris values");
    Object.values(TETRADIC_SIGNATURE_CONFIG.sample).forEach(value => {
      expect(markup).toContain(value);
    });
  });
});
