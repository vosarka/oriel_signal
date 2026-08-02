import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SPREAD_CONTENT,
} from "./tetradic-signature-config";

export const TETRADIC_SIMPLE_ASSETS = {
  pedestal: "/assets/tetradic-signature/stativ.png",
  frontCover: "/assets/founder-scene/front-cover.png",
  spine: "/assets/tetradic-signature/Image%2020.png",
  leftPage: "/assets/tetradic-signature/foaie1.png",
  rightPage: "/assets/tetradic-signature/foaie2.png",
  orielMark: "/oriel-signal-mark.png",
} as const;

export const TETRADIC_SIMPLE_SCROLL = {
  revealAndHoldSvh: 220,
  openingSvh: 280,
  chapterCount: 12,
  chapterSvh: 140,
  chapterStableSvh: 90,
  chapterTurnSvh: 50,
  closingSvh: 260,
  purchaseSvh: 140,
  travelSvh: 2580,
  viewportBufferSvh: 100,
  documentSvh: 2680,
  scrub: 1.05,
} as const;

export type TetradicSimpleChapter = Readonly<{
  number: number;
  numberLabel: string;
  title: string;
  statement: string;
  explanation: string;
  symbol: string;
  technicalLabels: readonly string[];
  layout: "visual-left" | "visual-right" | "central";
}>;

export const TETRADIC_SIMPLE_CHAPTERS: readonly TetradicSimpleChapter[] =
  TETRADIC_CHOREOGRAPHY.map((chapter, index) => {
    const spread = TETRADIC_SPREAD_CONTENT[index];
    const layout =
      chapter.number === 4 || chapter.number === 12
        ? "central"
        : chapter.number % 2 === 0
          ? "visual-right"
          : "visual-left";

    return {
      number: chapter.number,
      numberLabel: String(chapter.number).padStart(2, "0"),
      title: chapter.title,
      statement: chapter.statement,
      explanation: spread.semanticDescription,
      symbol: chapter.symbol,
      technicalLabels: spread.technicalLabels,
      layout,
    };
  });

export const TETRADIC_SIMPLE_CONCLUSION = {
  heading: ["TWELVE FIELDS.", "ONE ARCHITECTURE."],
  copy: "Your signature exists in the relationship between timing, activation, structure, tension, embodiment, and integration.",
} as const;

export const TETRADIC_SIMPLE_PURCHASE = {
  heading: ["RECEIVE YOUR", "TETRADIC SIGNATURE"],
  copy: "A founder-curated reading of the resonance architecture encoded at your exact moment of arrival.",
  label: "BUY THE FOUNDER EDITION",
  href: "/tetradic-signature",
} as const;

export const TETRADIC_SIMPLE_PHASES = [
  {
    id: "reveal",
    svh: TETRADIC_SIMPLE_SCROLL.revealAndHoldSvh,
  },
  {
    id: "opening",
    svh: TETRADIC_SIMPLE_SCROLL.openingSvh,
  },
  ...TETRADIC_SIMPLE_CHAPTERS.map(chapter => ({
    id: `tetrad-${chapter.numberLabel}`,
    svh: TETRADIC_SIMPLE_SCROLL.chapterSvh,
  })),
  {
    id: "closing",
    svh: TETRADIC_SIMPLE_SCROLL.closingSvh,
  },
  {
    id: "purchase",
    svh: TETRADIC_SIMPLE_SCROLL.purchaseSvh,
  },
] as const;
