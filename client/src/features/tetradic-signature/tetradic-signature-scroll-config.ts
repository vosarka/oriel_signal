export const TETRADIC_SCROLL_SCRUB = 1;

export const TETRADIC_CHAPTER_SCROLL = {
  count: 12,
  sectionVh: 150,
  stableVh: 90,
  turnVh: 60,
} as const;

export const TETRADIC_SCROLL_PHASES = [
  { id: "reveal", vh: 180 },
  { id: "closed-book", vh: 140 },
  { id: "book-opening", vh: 260 },
  { id: "interior-transition", vh: 140 },
  {
    id: "tetrads",
    vh: TETRADIC_CHAPTER_SCROLL.count * TETRADIC_CHAPTER_SCROLL.sectionVh,
  },
  { id: "conclusion", vh: 160 },
  { id: "book-closing", vh: 280 },
  { id: "purchase", vh: 140 },
] as const;

export type TetradicScrollPhaseId =
  (typeof TETRADIC_SCROLL_PHASES)[number]["id"];

export const TETRADIC_TOTAL_VH = TETRADIC_SCROLL_PHASES.reduce(
  (total, phase) => total + phase.vh,
  0
);

export const TETRADIC_CHAPTER_NUMBERS = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
] as const;

export type TetradicChapterNumber = (typeof TETRADIC_CHAPTER_NUMBERS)[number];

export type TetradicChapterPhaseId =
  | "tetrad-01"
  | "tetrad-02"
  | "tetrad-03"
  | "tetrad-04"
  | "tetrad-05"
  | "tetrad-06"
  | "tetrad-07"
  | "tetrad-08"
  | "tetrad-09"
  | "tetrad-10"
  | "tetrad-11"
  | "tetrad-12";

export type TetradicChapterTransition = "page-turn" | "conclusion-handoff";

export type TetradicChapterScrollPhase = Readonly<{
  id: TetradicChapterPhaseId;
  chapter: TetradicChapterNumber;
  vh: typeof TETRADIC_CHAPTER_SCROLL.sectionVh;
  stableVh: typeof TETRADIC_CHAPTER_SCROLL.stableVh;
  turnVh: typeof TETRADIC_CHAPTER_SCROLL.turnVh;
  transition: TetradicChapterTransition;
  startVh: number;
  endVh: number;
}>;

export type TetradicScrollPhaseRange = Readonly<{
  id: TetradicScrollPhaseId;
  vh: number;
  startVh: number;
  endVh: number;
}>;

const PHASES_BEFORE_TETRADS_VH = TETRADIC_SCROLL_PHASES.slice(0, 4).reduce(
  (total, phase) => total + phase.vh,
  0
);

function formatChapterId(chapter: TetradicChapterNumber) {
  return `tetrad-${String(chapter).padStart(2, "0")}` as TetradicChapterPhaseId;
}

export const TETRADIC_CHAPTER_PHASES: readonly TetradicChapterScrollPhase[] =
  TETRADIC_CHAPTER_NUMBERS.map((chapter, index) => {
    const startVh =
      PHASES_BEFORE_TETRADS_VH + index * TETRADIC_CHAPTER_SCROLL.sectionVh;

    return {
      id: formatChapterId(chapter),
      chapter,
      vh: TETRADIC_CHAPTER_SCROLL.sectionVh,
      stableVh: TETRADIC_CHAPTER_SCROLL.stableVh,
      turnVh: TETRADIC_CHAPTER_SCROLL.turnVh,
      transition: chapter === 12 ? "conclusion-handoff" : "page-turn",
      startVh,
      endVh: startVh + TETRADIC_CHAPTER_SCROLL.sectionVh,
    };
  });

export const TETRADIC_SCROLL_RANGES: readonly TetradicScrollPhaseRange[] =
  TETRADIC_SCROLL_PHASES.reduce<TetradicScrollPhaseRange[]>((ranges, phase) => {
    const startVh = ranges.at(-1)?.endVh ?? 0;
    ranges.push({
      ...phase,
      startVh,
      endVh: startVh + phase.vh,
    });
    return ranges;
  }, []);

export function getTetradicScrollPhase(id: TetradicScrollPhaseId) {
  return TETRADIC_SCROLL_RANGES.find(phase => phase.id === id);
}

export function getTetradicScrollDataAttributes(
  phase: TetradicScrollPhaseRange
) {
  return {
    "data-scroll-phase": phase.id,
    "data-scroll-vh": phase.vh,
    "data-scroll-start-vh": phase.startVh,
    "data-scroll-end-vh": phase.endVh,
  };
}

export function getTetradicChapterDataAttributes(
  phase: TetradicChapterScrollPhase
) {
  return {
    "data-tetrad-section": phase.id,
    "data-tetrad": String(phase.chapter).padStart(2, "0"),
    "data-scroll-vh": phase.vh,
    "data-stable-vh": phase.stableVh,
    "data-turn-vh": phase.turnVh,
    "data-transition": phase.transition,
  };
}
