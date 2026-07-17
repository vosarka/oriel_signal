import {
  TETRADIC_CHOREOGRAPHY as CHOREOGRAPHY,
  TETRADIC_LATER_MOTION,
  TETRADIC_SIGNATURE_CONFIG,
  type TetradicTimelineRange,
} from "./tetradic-signature-config";

export type ChapterRange = Readonly<{
  start: number;
  end: number;
}>;

export const TETRADIC_CHOREOGRAPHY = CHOREOGRAPHY;
export const TETRADIC_CHAPTERS = TETRADIC_SIGNATURE_CONFIG.animation.chapters;
export const TETRADIC_NARRATIVES =
  TETRADIC_SIGNATURE_CONFIG.animation.narratives;

const TETRAD_RHYTHM = TETRADIC_SIGNATURE_CONFIG.animation.tetradRhythm;
const CHAPTER_RHYTHM = TETRADIC_SIGNATURE_CONFIG.animation.chapterRhythm;
const OPENING_RHYTHM = TETRADIC_SIGNATURE_CONFIG.animation.openingRhythm;

export type TetradicChapter =
  | "darkness"
  | "revelation"
  | "approach"
  | "opening"
  | "tetrad-one"
  | "transition-one-two"
  | "tetrad-two"
  | "transition-two-three"
  | "tetrad-three"
  | "transition-three-four"
  | "tetrad-four"
  | "tetrad-five"
  | "tetrad-six"
  | "tetrad-seven"
  | "tetrad-eight"
  | "tetrad-nine"
  | "tetrad-ten"
  | "tetrad-eleven"
  | "tetrad-twelve"
  | "final-closure";

export type TetradSceneState = Readonly<{
  progress: number;
  pageTurn: number;
  spreadReveal: number;
  settle: number;
  eyebrow: number;
  title: number;
  description: number;
  labels: number;
  diagramReveal: number;
  inspection: number;
  withdrawal: number;
  annotation: number;
  pageLift: number;
  sealLight: number;
  sealLightOpacity: number;
}>;

export type TetradTwoSceneState = Readonly<{
  progress: number;
  settle: number;
  title: number;
  statement: number;
  blueprint: number;
  orbit: number;
  withdrawal: number;
}>;

export type TetradThreeSceneState = Readonly<{
  progress: number;
  settle: number;
  title: number;
  statement: number;
  celestialReveal: number;
  horizontalJourney: number;
  withdrawal: number;
}>;

export type LaterTetradSceneState = Readonly<{
  number: number;
  progress: number;
  settle: number;
  title: number;
  statement: number;
  visual: number;
  inspection: number;
  withdrawal: number;
  pagePrep: number;
  motion: Readonly<{
    phases: readonly [number, number, number, number];
    cameraTravel: number;
    path: number;
    breath: number;
    imprint: number;
  }>;
}>;

export type LaterTransitionSceneState = Readonly<{
  from: number;
  to: number;
  progress: number;
  anticipation: number;
  pageLift: number;
  pageTurn: number;
  spreadSwap: number;
  pageSettle: number;
  visualTransform: number;
}>;

export type TetradicClosureState = Readonly<{
  progress: number;
  synthesis: number;
  title: number;
  bookClose: number;
  cameraPullback: number;
  settle: number;
  halo: number;
  markers: number;
  cta: number;
}>;

export type TetradicSceneState = Readonly<{
  progress: number;
  activeSegment: string;
  activeChapter: TetradicChapter;
  activeTetrad: number;
  visibleSpread: number;
  reveal: number;
  approach: number;
  orientation: number;
  opening: Readonly<{
    progress: number;
    release: number;
    coverRotation: number;
    interiorReveal: number;
    readingAngle: number;
    settle: number;
  }>;
  coverOpen: number;
  tetradOne: TetradSceneState;
  transitionOneToTwo: Readonly<{
    progress: number;
    pageTurn: number;
    pageSettle: number;
    camera: number;
    sealExpansion: number;
    blueprintReveal: number;
    spreadSwap: number;
  }>;
  tetradTwo: TetradTwoSceneState;
  transitionTwoToThree: Readonly<{
    progress: number;
    pageAnticipation: number;
    pageTurn: number;
    pageSettle: number;
    foldDive: number;
    celestialReveal: number;
  }>;
  tetradThree: TetradThreeSceneState;
  laterChapters: readonly LaterTetradSceneState[];
  laterTransitions: readonly LaterTransitionSceneState[];
  closure: TetradicClosureState;
  cta: number;
  narrative: Readonly<{
    cover: number;
    approach: number;
    synthesis: number;
    cta: number;
  }>;
}>;

export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function rangeProgress(value: number, range: ChapterRange) {
  const distance = range.end - range.start;
  return clampProgress(distance === 0 ? 0 : (value - range.start) / distance);
}

function easedRangeProgress(value: number, range: ChapterRange) {
  const progress = rangeProgress(value, range);
  return progress * progress * (3 - 2 * progress);
}

function narrativeOpacity(
  progress: number,
  range: Readonly<{
    start: number;
    fadeInEnd: number;
    fadeOutStart: number;
    end: number;
  }>
) {
  if (progress <= range.start || progress >= range.end) return 0;
  if (progress < range.fadeInEnd) {
    return rangeProgress(progress, {
      start: range.start,
      end: range.fadeInEnd,
    });
  }
  if (progress > range.fadeOutStart) {
    return (
      1 - rangeProgress(progress, { start: range.fadeOutStart, end: range.end })
    );
  }
  return 1;
}

function getActiveTimelineSegment(progress: number) {
  for (const chapter of CHOREOGRAPHY) {
    if (progress <= chapter.core.end) return chapter.id;
    if (progress < chapter.transitionOut.range.end) {
      return chapter.transitionOut.id;
    }
  }

  return CHOREOGRAPHY.at(-1)?.transitionOut.id ?? "final-closure";
}

function getActiveChapter(progress: number): TetradicChapter {
  if (progress < TETRADIC_CHAPTERS.revelation.start) return "darkness";
  if (progress < TETRADIC_CHAPTERS.revelation.end) return "revelation";
  if (progress < TETRADIC_CHAPTERS.opening.start) return "approach";
  if (progress < TETRADIC_CHAPTERS.opening.end) return "opening";
  if (progress <= CHOREOGRAPHY[0].core.end) return "tetrad-one";
  if (progress < CHOREOGRAPHY[0].transitionOut.range.end) {
    return "transition-one-two";
  }
  if (progress <= CHOREOGRAPHY[1].core.end) return "tetrad-two";
  if (progress < CHOREOGRAPHY[1].transitionOut.range.end) {
    return "transition-two-three";
  }
  if (progress <= CHOREOGRAPHY[2].core.end) return "tetrad-three";
  if (progress < CHOREOGRAPHY[2].transitionOut.range.end) {
    return "transition-three-four";
  }

  const laterNames = [
    "tetrad-four",
    "tetrad-five",
    "tetrad-six",
    "tetrad-seven",
    "tetrad-eight",
    "tetrad-nine",
    "tetrad-ten",
    "tetrad-eleven",
    "tetrad-twelve",
  ] as const;

  for (let index = 3; index < CHOREOGRAPHY.length; index += 1) {
    if (progress <= CHOREOGRAPHY[index].core.end) {
      return laterNames[index - 3];
    }
    if (progress < CHOREOGRAPHY[index].transitionOut.range.end) {
      return index === CHOREOGRAPHY.length - 1
        ? "final-closure"
        : laterNames[index - 3];
    }
  }

  return "final-closure";
}

export function getTetradOneSceneState(
  globalProgress: number
): TetradSceneState {
  const progress = rangeProgress(globalProgress, TETRADIC_CHAPTERS.tetradOne);
  const labelsExit = rangeProgress(progress, TETRAD_RHYTHM.labelsExit);
  const descriptionExit = rangeProgress(
    progress,
    TETRAD_RHYTHM.descriptionExit
  );
  const titleExit = rangeProgress(progress, TETRAD_RHYTHM.titleExit);
  const withdrawal = rangeProgress(progress, TETRAD_RHYTHM.withdrawal);
  const sealLight = rangeProgress(progress, TETRAD_RHYTHM.sealLight);

  const eyebrow =
    easedRangeProgress(progress, TETRAD_RHYTHM.eyebrow) * (1 - titleExit);
  const title =
    easedRangeProgress(progress, TETRAD_RHYTHM.title) * (1 - titleExit);
  const description =
    easedRangeProgress(progress, TETRAD_RHYTHM.description) *
    (1 - descriptionExit);
  const labels =
    easedRangeProgress(progress, TETRAD_RHYTHM.labels) * (1 - labelsExit);

  return {
    progress,
    pageTurn: rangeProgress(progress, TETRAD_RHYTHM.pageTurn),
    spreadReveal: easedRangeProgress(progress, TETRAD_RHYTHM.spreadReveal),
    settle: easedRangeProgress(progress, TETRAD_RHYTHM.settle),
    eyebrow,
    title,
    description,
    labels,
    diagramReveal: easedRangeProgress(progress, TETRAD_RHYTHM.diagramReveal),
    inspection:
      rangeProgress(progress, TETRAD_RHYTHM.inspection) * (1 - withdrawal),
    withdrawal,
    annotation: Math.min(title, description) * (1 - withdrawal),
    pageLift: easedRangeProgress(progress, TETRAD_RHYTHM.pageLift),
    sealLight,
    sealLightOpacity: 1 - Math.abs(sealLight * 2 - 1),
  };
}

function getTetradTwoSceneState(globalProgress: number): TetradTwoSceneState {
  const progress = rangeProgress(globalProgress, CHOREOGRAPHY[1].core);
  const rhythm = CHAPTER_RHYTHM.tetradTwo;
  const withdrawal = easedRangeProgress(progress, rhythm.withdrawal);

  return {
    progress,
    settle: easedRangeProgress(progress, rhythm.settle),
    title: easedRangeProgress(progress, rhythm.title) * (1 - withdrawal),
    statement:
      easedRangeProgress(progress, rhythm.statement) * (1 - withdrawal),
    blueprint: easedRangeProgress(progress, rhythm.blueprint),
    orbit: easedRangeProgress(progress, rhythm.orbit),
    withdrawal,
  };
}

function getTetradThreeSceneState(
  globalProgress: number,
  ctaWithdrawal = 0
): TetradThreeSceneState {
  const progress = rangeProgress(globalProgress, CHOREOGRAPHY[2].core);
  const rhythm = CHAPTER_RHYTHM.tetradThree;
  const withdrawal = Math.max(
    ctaWithdrawal,
    easedRangeProgress(progress, rhythm.withdrawal)
  );
  const hold = 1 - withdrawal;

  return {
    progress,
    settle: easedRangeProgress(progress, rhythm.settle),
    title: easedRangeProgress(progress, rhythm.title) * hold,
    statement: easedRangeProgress(progress, rhythm.statement) * hold,
    celestialReveal: easedRangeProgress(progress, rhythm.celestialReveal),
    horizontalJourney: easedRangeProgress(progress, rhythm.horizontalJourney),
    withdrawal,
  };
}

function getLaterTetradSceneState(
  globalProgress: number,
  chapterIndex: number
): LaterTetradSceneState {
  const chapter = CHOREOGRAPHY[chapterIndex];
  const progress = rangeProgress(globalProgress, chapter.core);
  const finalChapter = chapterIndex === CHOREOGRAPHY.length - 1;
  const rhythm = finalChapter
    ? CHAPTER_RHYTHM.finalChapter
    : CHAPTER_RHYTHM.laterChapter;
  const withdrawal = easedRangeProgress(progress, rhythm.withdrawal);
  const motion = TETRADIC_LATER_MOTION[chapterIndex - 3];
  const phaseValues = motion.phases.map(range =>
    easedRangeProgress(progress, range)
  ) as [number, number, number, number];
  const breathProgress = rangeProgress(progress, motion.breathWindow);
  const breath =
    motion.breathCycles === 0
      ? 0
      : Math.sin(breathProgress * Math.PI * motion.breathCycles) ** 2;

  return {
    number: chapter.number,
    progress,
    settle: easedRangeProgress(progress, rhythm.settle),
    title:
      easedRangeProgress(progress, rhythm.title) *
      (finalChapter ? 1 : 1 - withdrawal),
    statement:
      easedRangeProgress(progress, rhythm.statement) * (1 - withdrawal),
    visual: easedRangeProgress(progress, rhythm.visual),
    inspection: easedRangeProgress(progress, rhythm.inspection),
    withdrawal,
    pagePrep: finalChapter ? 0 : easedRangeProgress(progress, rhythm.pageLift),
    motion: {
      phases: phaseValues,
      cameraTravel: easedRangeProgress(progress, motion.cameraTravel),
      path: easedRangeProgress(progress, motion.path),
      breath,
      imprint: easedRangeProgress(progress, motion.imprint),
    },
  };
}

function getLaterTransitionSceneState(
  globalProgress: number,
  chapterIndex: number
): LaterTransitionSceneState {
  const chapter = CHOREOGRAPHY[chapterIndex];
  const transition = getTransitionState(
    globalProgress,
    chapter.transitionOut.range,
    CHAPTER_RHYTHM.laterTransition
  );

  return {
    from: chapter.number,
    to: CHOREOGRAPHY[chapterIndex + 1].number,
    progress: transition.progress,
    anticipation: transition.values.anticipation,
    pageLift: transition.values.pageLift,
    pageTurn: transition.values.pageTurn,
    spreadSwap: transition.values.spreadSwap,
    pageSettle: transition.values.pageSettle,
    visualTransform: transition.values.visualTransform,
  };
}

function getClosureSceneState(globalProgress: number): TetradicClosureState {
  const range = CHOREOGRAPHY[11].transitionOut.range;
  const progress = rangeProgress(globalProgress, range);
  const rhythm = CHAPTER_RHYTHM.finalClosure;
  const title = easedRangeProgress(progress, rhythm.synthesisTitle);
  const synthesisEntry = easedRangeProgress(progress, rhythm.synthesis);
  const synthesisExit = easedRangeProgress(progress, {
    start: 0.68,
    end: 0.84,
  });

  return {
    progress,
    synthesis: synthesisEntry * (1 - synthesisExit),
    title: title * (1 - synthesisExit),
    bookClose: easedRangeProgress(progress, rhythm.bookClose),
    cameraPullback: easedRangeProgress(progress, rhythm.cameraPullback),
    settle: easedRangeProgress(progress, rhythm.settle),
    halo: easedRangeProgress(progress, rhythm.halo),
    markers: easedRangeProgress(progress, rhythm.markers),
    cta: easedRangeProgress(progress, rhythm.cta),
  };
}

function getActiveTetrad(progress: number) {
  for (let index = 0; index < CHOREOGRAPHY.length; index += 1) {
    const chapter = CHOREOGRAPHY[index];
    if (progress <= chapter.core.end) return chapter.number;
    if (progress < chapter.transitionOut.range.end) {
      const local = rangeProgress(progress, chapter.transitionOut.range);
      return local < 0.5 || index === CHOREOGRAPHY.length - 1
        ? chapter.number
        : CHOREOGRAPHY[index + 1].number;
    }
  }

  return 12;
}

function getVisibleSpread(progress: number) {
  if (progress <= CHOREOGRAPHY[0].core.end) return 1;
  if (progress < CHOREOGRAPHY[0].transitionOut.range.end) {
    return rangeProgress(progress, CHOREOGRAPHY[0].transitionOut.range) < 0.58
      ? 1
      : 2;
  }
  if (progress <= CHOREOGRAPHY[1].core.end) return 2;
  if (progress < CHOREOGRAPHY[1].transitionOut.range.end) {
    return rangeProgress(progress, CHOREOGRAPHY[1].transitionOut.range) < 0.82
      ? 2
      : 3;
  }

  for (let index = 2; index < CHOREOGRAPHY.length - 1; index += 1) {
    const chapter = CHOREOGRAPHY[index];
    if (progress <= chapter.core.end) return chapter.number;
    if (progress < chapter.transitionOut.range.end) {
      return rangeProgress(progress, chapter.transitionOut.range) < 0.5
        ? chapter.number
        : CHOREOGRAPHY[index + 1].number;
    }
  }

  return 12;
}

function getTransitionState(
  progress: number,
  range: TetradicTimelineRange,
  rhythm: Record<string, ChapterRange>
) {
  const localProgress = rangeProgress(progress, range);
  return {
    progress: localProgress,
    values: Object.fromEntries(
      Object.entries(rhythm).map(([key, value]) => [
        key,
        easedRangeProgress(localProgress, value),
      ])
    ),
  };
}

export const TETRADIC_REDUCED_MOTION_PROGRESS =
  TETRADIC_SIGNATURE_CONFIG.animation.reducedMotionProgress;

export function getTetradicSceneState(rawProgress: number): TetradicSceneState {
  const progress = clampProgress(rawProgress);
  const openingProgress = rangeProgress(progress, TETRADIC_CHAPTERS.opening);
  const opening = {
    progress: openingProgress,
    release: easedRangeProgress(openingProgress, OPENING_RHYTHM.release),
    coverRotation: easedRangeProgress(
      openingProgress,
      OPENING_RHYTHM.coverRotation
    ),
    interiorReveal: easedRangeProgress(
      openingProgress,
      OPENING_RHYTHM.interiorReveal
    ),
    readingAngle: easedRangeProgress(
      openingProgress,
      OPENING_RHYTHM.readingAngle
    ),
    settle: easedRangeProgress(openingProgress, OPENING_RHYTHM.settle),
  };
  const transitionOneToTwo = getTransitionState(
    progress,
    CHOREOGRAPHY[0].transitionOut.range,
    CHAPTER_RHYTHM.transitionOneToTwo
  );
  const transitionTwoToThree = getTransitionState(
    progress,
    CHOREOGRAPHY[1].transitionOut.range,
    CHAPTER_RHYTHM.transitionTwoToThree
  );
  const laterChapters = Array.from({ length: 9 }, (_, index) =>
    getLaterTetradSceneState(progress, index + 3)
  );
  const laterTransitions = Array.from({ length: 9 }, (_, index) =>
    getLaterTransitionSceneState(progress, index + 2)
  );
  const closure = getClosureSceneState(progress);
  const cta = closure.cta;
  const coverOpen =
    opening.coverRotation * (1 - closure.bookClose * (1 - 30 / 180));

  return {
    progress,
    activeSegment: getActiveTimelineSegment(progress),
    activeChapter: getActiveChapter(progress),
    activeTetrad: getActiveTetrad(progress),
    visibleSpread: getVisibleSpread(progress),
    reveal: easedRangeProgress(progress, TETRADIC_CHAPTERS.revelation),
    approach: easedRangeProgress(progress, TETRADIC_CHAPTERS.approach),
    orientation: easedRangeProgress(progress, TETRADIC_CHAPTERS.orientation),
    opening,
    coverOpen,
    tetradOne: getTetradOneSceneState(progress),
    transitionOneToTwo: {
      progress: transitionOneToTwo.progress,
      pageTurn: transitionOneToTwo.values.pageTurn,
      pageSettle: transitionOneToTwo.values.pageSettle,
      camera: transitionOneToTwo.values.camera,
      sealExpansion: transitionOneToTwo.values.sealExpansion,
      blueprintReveal: transitionOneToTwo.values.blueprintReveal,
      spreadSwap: transitionOneToTwo.values.spreadSwap,
    },
    tetradTwo: getTetradTwoSceneState(progress),
    transitionTwoToThree: {
      progress: transitionTwoToThree.progress,
      pageAnticipation: transitionTwoToThree.values.pageAnticipation,
      pageTurn: transitionTwoToThree.values.pageTurn,
      pageSettle: transitionTwoToThree.values.pageSettle,
      foldDive: transitionTwoToThree.values.foldDive,
      celestialReveal: transitionTwoToThree.values.celestialReveal,
    },
    tetradThree: getTetradThreeSceneState(progress),
    laterChapters,
    laterTransitions,
    closure,
    cta,
    narrative: {
      cover: narrativeOpacity(progress, TETRADIC_NARRATIVES.cover),
      approach: 0,
      synthesis: closure.synthesis,
      cta,
    },
  };
}
