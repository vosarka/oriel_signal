import { TETRADIC_SIGNATURE_CONFIG } from "./tetradic-signature-config";

export type ChapterRange = Readonly<{
  start: number;
  end: number;
}>;

export const TETRADIC_CHAPTERS = TETRADIC_SIGNATURE_CONFIG.animation.chapters;
export const TETRADIC_NARRATIVES =
  TETRADIC_SIGNATURE_CONFIG.animation.narratives;

const TETRAD_RHYTHM = TETRADIC_SIGNATURE_CONFIG.animation.tetradRhythm;

export type TetradicChapter =
  | "darkness"
  | "revelation"
  | "approach"
  | "opening"
  | "tetrad-one"
  | "invitation";

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

export type TetradicSceneState = Readonly<{
  progress: number;
  activeChapter: TetradicChapter;
  reveal: number;
  approach: number;
  orientation: number;
  coverOpen: number;
  tetradOne: TetradSceneState;
  cta: number;
  narrative: Readonly<{
    cover: number;
    approach: number;
    cta: number;
  }>;
}>;

export function clampProgress(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function rangeProgress(value: number, range: ChapterRange) {
  const distance = range.end - range.start;
  return clampProgress(distance === 0 ? 1 : (value - range.start) / distance);
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
  if (progress <= range.start) return 0;
  if (progress >= range.end) {
    return range.fadeOutStart === range.end ? 1 : 0;
  }
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

function getActiveChapter(progress: number): TetradicChapter {
  if (progress < TETRADIC_CHAPTERS.revelation.start) return "darkness";
  if (progress < TETRADIC_CHAPTERS.revelation.end) return "revelation";
  if (progress < TETRADIC_CHAPTERS.opening.start) return "approach";
  if (progress < TETRADIC_CHAPTERS.opening.end) return "opening";
  if (progress < TETRADIC_CHAPTERS.cta.start) return "tetrad-one";
  return "invitation";
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

export const TETRADIC_REDUCED_MOTION_PROGRESS =
  TETRADIC_CHAPTERS.tetradOne.start +
  (TETRADIC_CHAPTERS.tetradOne.end - TETRADIC_CHAPTERS.tetradOne.start) *
    TETRADIC_SIGNATURE_CONFIG.animation.reducedMotionTetradProgress;

export function getTetradicSceneState(rawProgress: number): TetradicSceneState {
  const progress = clampProgress(rawProgress);

  return {
    progress,
    activeChapter: getActiveChapter(progress),
    reveal: easedRangeProgress(progress, TETRADIC_CHAPTERS.revelation),
    approach: easedRangeProgress(progress, TETRADIC_CHAPTERS.approach),
    orientation: easedRangeProgress(progress, TETRADIC_CHAPTERS.orientation),
    coverOpen: rangeProgress(progress, TETRADIC_CHAPTERS.opening),
    tetradOne: getTetradOneSceneState(progress),
    cta: easedRangeProgress(progress, TETRADIC_CHAPTERS.cta),
    narrative: {
      cover: narrativeOpacity(progress, TETRADIC_NARRATIVES.cover),
      approach: narrativeOpacity(progress, TETRADIC_NARRATIVES.approach),
      cta: narrativeOpacity(progress, TETRADIC_NARRATIVES.cta),
    },
  };
}
