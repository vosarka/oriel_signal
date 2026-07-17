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
  TETRAD_THREE_TIMING_STATES,
} from "../client/src/features/tetradic-signature/tetradic-signature-config";
import {
  SampleArchiveSeal,
  createCoronaSegments,
} from "../client/src/features/tetradic-signature/SampleArchiveSeal";
import { TetradicNarrative } from "../client/src/features/tetradic-signature/TetradicNarrative";
import {
  TETRADIC_V2_MASTER_TIMELINE,
  TETRADIC_V2_TIMELINE,
  getTetradicV2MasterState,
  getTetradicV2State,
} from "../client/src/features/tetradic-signature/tetradic-signature-v2-config";

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
  return getTetradicSceneState(
    range.start + (range.end - range.start) * progress
  );
}

function laterChapterAt(chapterIndex: number, progress: number) {
  return atRangeProgress(TETRADIC_CHOREOGRAPHY[chapterIndex].core, progress)
    .laterChapters[chapterIndex - 3];
}

function firstPositiveProgress(
  chapterIndex: number,
  field: "settle" | "title" | "statement" | "withdrawal" | "pagePrep"
) {
  for (let step = 0; step <= 100; step += 1) {
    if (laterChapterAt(chapterIndex, step / 100)[field] > 0) return step / 100;
  }

  return Number.POSITIVE_INFINITY;
}

function v2ChapterAt(number: number, local: number) {
  const segment = TETRADIC_V2_MASTER_TIMELINE.segments.find(
    candidate => candidate.chapter === number
  );
  if (!segment) throw new Error(`Missing V2 chapter ${number}`);
  const progress =
    (segment.startSvh + (segment.endSvh - segment.startSvh) * local) /
    TETRADIC_V2_MASTER_TIMELINE.travelSvh;
  return getTetradicV2MasterState(progress).chapters.find(
    chapter => chapter.number === number
  )!;
}

describe("Tetradic Signature scroll timeline", () => {
  it("covers twelve contiguous chapters and reconstructs every segment in reverse", () => {
    const segments = TETRADIC_CHOREOGRAPHY.flatMap(chapter => [
      chapter.core,
      chapter.transitionOut.range,
    ]);

    expect(TETRADIC_CHOREOGRAPHY).toHaveLength(12);
    expect(segments[0].start).toBe(0);
    segments.slice(1).forEach((segment, index) => {
      expect(segment.start).toBe(segments[index].end);
    });
    expect(segments.at(-1)?.end).toBe(1);

    const checkpoints = segments
      .flatMap(segment => [
        segment.start,
        (segment.start + segment.end) / 2,
        segment.end,
      ])
      .concat(1);
    const forward = checkpoints.map(getTetradicSceneState);
    const backward = [...checkpoints]
      .reverse()
      .map(getTetradicSceneState)
      .reverse();

    expect(backward).toEqual(forward);
    TETRADIC_CHOREOGRAPHY.forEach(chapter => {
      expect(
        getTetradicSceneState((chapter.core.start + chapter.core.end) / 2)
          .activeSegment
      ).toBe(chapter.id);
      expect(
        getTetradicSceneState(
          (chapter.transitionOut.range.start +
            chapter.transitionOut.range.end) /
            2
        ).activeSegment
      ).toBe(chapter.transitionOut.id);
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

  it("settles Tetrads 04–12 before copy and withdraws copy before page preparation", () => {
    for (let chapterIndex = 3; chapterIndex < 12; chapterIndex += 1) {
      const settle = firstPositiveProgress(chapterIndex, "settle");
      const title = firstPositiveProgress(chapterIndex, "title");
      const statement = firstPositiveProgress(chapterIndex, "statement");
      const withdrawal = firstPositiveProgress(chapterIndex, "withdrawal");
      const pagePrep = firstPositiveProgress(chapterIndex, "pagePrep");

      expect(settle).toBeLessThan(title);
      expect(title).toBeLessThan(statement);
      expect(statement).toBeLessThan(withdrawal);
      if (chapterIndex < 11) expect(withdrawal).toBeLessThan(pagePrep);

      const titleStart = laterChapterAt(chapterIndex, title);
      expect(titleStart.settle).toBe(1);

      if (chapterIndex < 11) {
        const pagePrepStart = laterChapterAt(chapterIndex, pagePrep);
        expect(pagePrepStart.title).toBe(0);
        expect(pagePrepStart.statement).toBe(0);
      }
    }
  });

  it("derives distinct reversible motion phases for the later chapters", () => {
    for (let chapterIndex = 3; chapterIndex < 12; chapterIndex += 1) {
      const early = laterChapterAt(chapterIndex, 0.18).motion;
      const readable = laterChapterAt(chapterIndex, 0.5).motion;

      expect(early.cameraTravel).toBeLessThan(readable.cameraTravel);
      expect(readable.cameraTravel).toBe(1);
      expect(readable.phases.some(phase => phase > 0)).toBe(true);
    }

    expect(laterChapterAt(5, 0.6).motion.path).toBeGreaterThan(0);
    expect(laterChapterAt(10, 0.35).motion.breath).toBeGreaterThan(0);
    expect(laterChapterAt(11, 0.5).motion.imprint).toBeGreaterThan(0);
    expect(
      TETRADIC_SIGNATURE_CONFIG.animation.laterMotion
        .filter(chapter => chapter.snapStates.length > 0)
        .map(chapter => chapter.number)
    ).toEqual([9, 11]);
  });

  it("gives Tetrad 12 a longer hold and no automatic page preparation", () => {
    const tetradEleven = laterChapterAt(10, 0.84);
    const tetradTwelve = laterChapterAt(11, 0.84);

    expect(tetradEleven.withdrawal).toBeGreaterThan(0);
    expect(tetradTwelve.withdrawal).toBe(0);
    expect(laterChapterAt(11, 1).pagePrep).toBe(0);
  });

  it("uses physical page travel and settling for every later transition", () => {
    expect(getTetradicSceneState(0).laterTransitions).toHaveLength(9);

    TETRADIC_CHOREOGRAPHY.slice(2, 11).forEach((chapter, index) => {
      const travelling = atRangeProgress(chapter.transitionOut.range, 0.5)
        .laterTransitions[index];
      const settled = atRangeProgress(chapter.transitionOut.range, 0.9)
        .laterTransitions[index];

      expect(travelling.anticipation).toBeGreaterThan(0);
      expect(travelling.pageTurn).toBeGreaterThan(0);
      expect(travelling.pageSettle).toBe(0);
      expect(settled.pageTurn).toBe(1);
      expect(settled.pageSettle).toBeGreaterThan(0);
    });
  });

  it("holds synthesis before closing and reveals the CTA only after the book settles", () => {
    const range = TETRADIC_CHOREOGRAPHY[11].transitionOut.range;
    const samples = Array.from(
      { length: 101 },
      (_, step) => atRangeProgress(range, step / 100).closure
    );
    const first = (field: keyof (typeof samples)[number]) =>
      samples.findIndex(state => state[field] > 0);

    expect(first("title")).toBeGreaterThanOrEqual(0);
    expect(first("synthesis")).toBeGreaterThan(first("title"));
    expect(first("bookClose")).toBeGreaterThan(first("synthesis"));
    expect(first("settle")).toBeGreaterThan(first("bookClose"));
    expect(first("cta")).toBeGreaterThan(first("settle"));
    expect(samples[first("cta")].settle).toBe(1);
    expect(samples.at(-1)).toMatchObject({
      bookClose: 1,
      settle: 1,
      cta: 1,
    });
  });

  it("locks final naming, normalized symbols, and CTA destinations", () => {
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
    expect(TETRADIC_SIGNATURE_CONFIG.ctas.generateSignatureRoute).toBe(
      "/founder-signature-blueprint"
    );
    expect(TETRADIC_SIGNATURE_CONFIG.ctas.exploreSampleLabel).toBe(
      "EXPLORE A SAMPLE"
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

  it("scopes archive seal paint servers per mounted instance", () => {
    const seal = () =>
      createElement(SampleArchiveSeal, {
        archiveId: "ORL-TDS-001",
        symbol: TETRAD_SYMBOLS[0],
      });
    const markup = renderToStaticMarkup(
      createElement("div", null, seal(), seal())
    );
    const ids = [...markup.matchAll(/id="(tetradic-seal-[^"]+)"/g)].map(
      match => match[1]
    );

    expect(ids).toHaveLength(4);
    expect(new Set(ids).size).toBe(4);
  });

  it("provides a semantic equivalent for the canvas-only archive record", () => {
    const markup = renderToStaticMarkup(
      createElement(TetradicNarrative, { reducedMotion: false })
    );

    expect(markup).toContain("<dl>");
    expect(markup).toContain("Illustrative public sample record");
    expect(markup).toContain("No verified ephemeris values");
    expect(markup).toContain("TWELVE FIELDS. ONE ARCHITECTURE.");
    expect(markup).toContain("FOUNDER CURATION LAYER: COMPLETE");
    Object.values(TETRADIC_SIGNATURE_CONFIG.sample).forEach(value => {
      expect(markup).toContain(value);
    });
  });

  it("renders all twelve semantic chapters, final CTAs, and two-timing fidelity", () => {
    const markup = renderToStaticMarkup(
      createElement(TetradicNarrative, { reducedMotion: true })
    );
    const semanticMarkup = markup.match(
      /<article class="sr-only">([\s\S]*?)<\/article>/
    )?.[1];
    const semanticChapters = semanticMarkup?.match(/TETRAD \d{2} \/ 12/g) ?? [];

    const expectedChapters = Array.from(
      { length: 12 },
      (_, index) => `TETRAD ${String(index + 1).padStart(2, "0")} / 12`
    );
    expect([...new Set(semanticChapters)]).toEqual(expectedChapters);
    expectedChapters.forEach(chapter => {
      expect(semanticChapters.filter(label => label === chapter)).toHaveLength(
        1
      );
    });
    expect(markup).toContain(
      'class="tetradic-signature__reduced-visual-copy" aria-hidden="true"'
    );
    expect(markup).toContain("GENERATE MY SIGNATURE");
    expect(markup).toContain('href="/founder-signature-blueprint"');
    expect(markup).toContain("EXPLORE A SAMPLE");
    expect(markup).toContain("88.0000 degrees behind the birth Sun");
    expect(TETRAD_THREE_TIMING_STATES[1].title).toBe("88.0000°");
    expect(TETRAD_THREE_TIMING_STATES[1].detail).toMatch(/RETROGRADE SEARCH/);
    expect(TETRAD_THREE_TIMING_STATES[3].detail).toMatch(
      /NO VERIFIED EPHEMERIS/
    );
  });

  it("orders the V2 artifact, archive, Threshold, and Tetrad 02 reveal", () => {
    expect(getTetradicV2State(0.08).scene).toBe("artifact-reveal");
    expect(getTetradicV2State(0.24).scene).toBe("cover-identity");
    expect(getTetradicV2State(0.4).scene).toBe("enter-archive");
    expect(getTetradicV2State(0.58).scene).toBe("tetrad-01");
    expect(getTetradicV2State(0.9).scene).toBe("transition-01-02");

    expect(getTetradicV2State(0.5).tetradOne).toBeGreaterThan(0);
    expect(getTetradicV2State(0.5).tetradOneTitle).toBe(0);
    expect(getTetradicV2State(0.58).tetradOneTitle).toBeGreaterThan(0);
    expect(getTetradicV2State(0.58).tetradOneStatement).toBe(0);
    expect(getTetradicV2State(0.64).tetradOneStatement).toBeGreaterThan(0);
    expect(getTetradicV2State(0.86).tetradTwo).toBe(0);
    expect(getTetradicV2State(0.96).tetradTwo).toBeGreaterThan(0);
  });

  it("reconstructs identical V2 state after a forward and reverse round trip", () => {
    expect(TETRADIC_V2_TIMELINE.travelSvh).toBe(700);
    expect(TETRADIC_V2_TIMELINE.compactTravelSvh).toBeLessThan(
      TETRADIC_V2_TIMELINE.travelSvh
    );
    expect(getTetradicV2State(-1).progress).toBe(0);
    expect(getTetradicV2State(2).progress).toBe(1);

    const roundTrip = [0.24, 0.64, 0.96, 0.64, 0.24].map(getTetradicV2State);
    expect(roundTrip[1]).toEqual(roundTrip[3]);
    expect(roundTrip[0]).toEqual(roundTrip[4]);
    expect(roundTrip.map(state => state.scene)).toEqual([
      "cover-identity",
      "tetrad-01",
      "transition-01-02",
      "tetrad-01",
      "cover-identity",
    ]);
  });

  it("extends V2 without changing the approved 700svh foundation", () => {
    const foundationSample = 0.64;
    const masterProgress =
      (foundationSample * TETRADIC_V2_TIMELINE.travelSvh) /
      TETRADIC_V2_MASTER_TIMELINE.travelSvh;

    expect(getTetradicV2MasterState(masterProgress).foundation).toEqual(
      getTetradicV2State(foundationSample)
    );
    expect(TETRADIC_V2_MASTER_TIMELINE.foundation.endSvh).toBe(700);
    expect(TETRADIC_V2_MASTER_TIMELINE.compactFoundationSvh).toBe(620);
  });

  it("keeps the master segments contiguous through the final CTA", () => {
    const segments = TETRADIC_V2_MASTER_TIMELINE.segments;

    expect(segments[0].startSvh).toBe(0);
    expect(segments.at(-1)?.endSvh).toBe(TETRADIC_V2_MASTER_TIMELINE.travelSvh);
    segments.slice(1).forEach((segment, index) => {
      expect(segment.startSvh).toBe(segments[index].endSvh);
    });
    expect(segments.filter(segment => segment.kind === "chapter")).toHaveLength(
      11
    );
  });

  it("reconstructs later chapters deterministically in both directions", () => {
    const checkpoints = [0.26, 0.39, 0.58, 0.81, 0.9, 0.97];
    const forward = checkpoints.map(getTetradicV2MasterState);
    const reverse = [...checkpoints]
      .reverse()
      .map(getTetradicV2MasterState)
      .reverse();

    expect(reverse).toEqual(forward);
    expect(forward.at(-1)?.segmentId).toBe("final-cta");
  });

  it("withdraws chapter copy before its cinematic transition dominates", () => {
    const chapterTen = TETRADIC_V2_MASTER_TIMELINE.segments.find(
      segment => segment.id === "tetrad-10"
    );
    expect(chapterTen).toBeDefined();

    const progress =
      (chapterTen!.startSvh +
        (chapterTen!.endSvh - chapterTen!.startSvh) * 0.9) /
      TETRADIC_V2_MASTER_TIMELINE.travelSvh;
    const state = getTetradicV2MasterState(progress);
    const active = state.chapters.find(chapter => chapter.number === 10);

    expect(active?.beats.title).toBe(0);
    expect(active?.beats.statement).toBe(0);
    expect(active?.beats.transition).toBeGreaterThan(0);
  });

  it("holds every extended V2 chapter still while its copy is readable", () => {
    for (let number = 2; number <= 12; number += 1) {
      const holdStart = v2ChapterAt(number, number === 2 ? 0.6 : 0.62);
      const holdEnd = v2ChapterAt(
        number,
        number === 2 ? 0.68 : number === 12 ? 0.8 : number === 11 ? 0.76 : 0.74
      );

      expect(holdStart.beats.motion).toEqual([1, 1, 1, 1]);
      expect(holdEnd.beats.motion).toEqual(holdStart.beats.motion);
      expect(holdEnd.beats.visual).toBe(1);
      expect(holdEnd.beats.title).toBe(1);
      expect(holdEnd.beats.statement).toBe(1);
      expect(holdEnd.beats.transition).toBe(0);
    }
  });

  it("gives Tetrad 12 a longer inspection segment than Tetrad 11", () => {
    const chapters = TETRADIC_V2_MASTER_TIMELINE.segments.filter(
      segment => segment.kind === "chapter"
    );
    const eleven = chapters.find(segment => segment.chapter === 11)!;
    const twelve = chapters.find(segment => segment.chapter === 12)!;

    expect(twelve.endSvh - twelve.startSvh).toBeGreaterThan(
      eleven.endSvh - eleven.startSvh
    );
  });

  it("hands every incoming chapter to its active state without a visual reset", () => {
    const chapters = TETRADIC_V2_MASTER_TIMELINE.segments.filter(
      segment => segment.kind === "chapter"
    );

    chapters.slice(0, -1).forEach(segment => {
      const nextChapter = segment.chapter! + 1;
      const justBefore = getTetradicV2MasterState(
        (segment.endSvh - 0.0001) / TETRADIC_V2_MASTER_TIMELINE.travelSvh
      );
      const atBoundary = getTetradicV2MasterState(
        segment.endSvh / TETRADIC_V2_MASTER_TIMELINE.travelSvh
      );
      const incoming = justBefore.chapters.find(
        chapter => chapter.number === nextChapter
      );
      const active = atBoundary.chapters.find(
        chapter => chapter.number === nextChapter
      );

      expect(incoming?.presence).toBeCloseTo(active?.presence ?? 0, 5);
      expect(incoming?.beats.motion).toEqual(active?.beats.motion);
      expect(incoming?.beats.visual).toBe(active?.beats.visual);
    });
  });

  it("keeps synthesis copy continuous after Tetrad 12", () => {
    const twelve = TETRADIC_V2_MASTER_TIMELINE.segments.find(
      segment => segment.chapter === 12
    )!;
    const justBefore = getTetradicV2MasterState(
      (twelve.endSvh - 0.0001) / TETRADIC_V2_MASTER_TIMELINE.travelSvh
    );
    const atBoundary = getTetradicV2MasterState(
      twelve.endSvh / TETRADIC_V2_MASTER_TIMELINE.travelSvh
    );

    expect(justBefore.synthesisCopy).toBeCloseTo(1, 5);
    expect(atBoundary.synthesisCopy).toBe(1);
  });
});
