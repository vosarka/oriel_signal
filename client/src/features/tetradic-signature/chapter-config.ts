export type ChapterRange = Readonly<{
  start: number;
  end: number;
}>;

export const TETRADIC_CHAPTERS = {
  revelation: { start: 0.02, end: 0.18 },
  approach: { start: 0.18, end: 0.34 },
  orientation: { start: 0.18, end: 0.34 },
  opening: { start: 0.34, end: 0.54 },
  tetradOne: { start: 0.54, end: 0.7 },
  transition: { start: 0.7, end: 0.84 },
  cta: { start: 0.84, end: 0.98 },
} as const satisfies Record<string, ChapterRange>;

export const TETRADIC_NARRATIVES = {
  cover: { start: 0.01, fadeInEnd: 0.055, fadeOutStart: 0.16, end: 0.22 },
  approach: { start: 0.2, fadeInEnd: 0.24, fadeOutStart: 0.3, end: 0.35 },
  opening: { start: 0.36, fadeInEnd: 0.4, fadeOutStart: 0.48, end: 0.54 },
  tetradOne: { start: 0.54, fadeInEnd: 0.58, fadeOutStart: 0.66, end: 0.72 },
  tetradTwo: { start: 0.72, fadeInEnd: 0.76, fadeOutStart: 0.8, end: 0.86 },
  cta: { start: 0.86, fadeInEnd: 0.9, fadeOutStart: 1, end: 1 },
} as const;

export type TetradicChapter =
  | "darkness"
  | "revelation"
  | "approach"
  | "opening"
  | "tetrad-one"
  | "tetrad-two"
  | "invitation";

export type TetradicSceneState = Readonly<{
  progress: number;
  activeChapter: TetradicChapter;
  reveal: number;
  approach: number;
  orientation: number;
  coverOpen: number;
  tetradOne: number;
  tetradTwo: number;
  transition: number;
  cta: number;
  narrative: Readonly<{
    cover: number;
    approach: number;
    opening: number;
    tetradOne: number;
    tetradTwo: number;
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
  if (progress < TETRADIC_CHAPTERS.transition.start) return "tetrad-one";
  if (progress < TETRADIC_CHAPTERS.cta.start) return "tetrad-two";
  return "invitation";
}

export function getTetradicSceneState(rawProgress: number): TetradicSceneState {
  const progress = clampProgress(rawProgress);

  return {
    progress,
    activeChapter: getActiveChapter(progress),
    reveal: easedRangeProgress(progress, TETRADIC_CHAPTERS.revelation),
    approach: easedRangeProgress(progress, TETRADIC_CHAPTERS.approach),
    orientation: easedRangeProgress(progress, TETRADIC_CHAPTERS.orientation),
    coverOpen: rangeProgress(progress, TETRADIC_CHAPTERS.opening),
    tetradOne: easedRangeProgress(progress, TETRADIC_CHAPTERS.tetradOne),
    tetradTwo: easedRangeProgress(progress, TETRADIC_CHAPTERS.transition),
    transition: easedRangeProgress(progress, TETRADIC_CHAPTERS.transition),
    cta: easedRangeProgress(progress, TETRADIC_CHAPTERS.cta),
    narrative: {
      cover: narrativeOpacity(progress, TETRADIC_NARRATIVES.cover),
      approach: narrativeOpacity(progress, TETRADIC_NARRATIVES.approach),
      opening: narrativeOpacity(progress, TETRADIC_NARRATIVES.opening),
      tetradOne: narrativeOpacity(progress, TETRADIC_NARRATIVES.tetradOne),
      tetradTwo: narrativeOpacity(progress, TETRADIC_NARRATIVES.tetradTwo),
      cta: narrativeOpacity(progress, TETRADIC_NARRATIVES.cta),
    },
  };
}
