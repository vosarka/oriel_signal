import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_FINAL_OFFER,
  TETRADIC_LATER_MOTION,
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_SPREAD_CONTENT,
  TETRADIC_SYNTHESIS,
  TETRAD_SYMBOLS,
} from "./tetradic-signature-config";

export const TETRADIC_V2_TIMELINE = {
  travelSvh: 700,
  compactTravelSvh: 620,
  viewportSvh: 100,
  scenes: {
    artifactReveal: { start: 0, end: 0.18 },
    coverIdentity: { start: 0.18, end: 0.32 },
    enterArchive: { start: 0.32, end: 0.46 },
    tetradOne: { start: 0.46, end: 0.78 },
    transitionToTwo: { start: 0.78, end: 1 },
  },
} as const;

export const TETRADIC_V2_CONFIG = {
  assets: {
    ...TETRADIC_SIGNATURE_CONFIG.assets,
    thresholdSymbol: TETRAD_SYMBOLS[0],
    architectureSymbol: TETRAD_SYMBOLS[1],
  },
  naming: TETRADIC_SIGNATURE_CONFIG.naming,
  sample: TETRADIC_SIGNATURE_CONFIG.sample,
  ctas: TETRADIC_SIGNATURE_CONFIG.ctas,
  chapters: TETRADIC_CHOREOGRAPHY,
  spreadContent: TETRADIC_SPREAD_CONTENT,
  synthesis: TETRADIC_SYNTHESIS,
  offer: TETRADIC_FINAL_OFFER,
  telemetry: [
    "ORIEL SIGNAL",
    "RECEIVER RECORD INITIALIZED",
    "ARCHIVE STATUS / SAMPLE",
    "TETRAD FIELD ACTIVE",
  ],
} as const;

export type TetradicV2Scene =
  | "artifact-reveal"
  | "cover-identity"
  | "enter-archive"
  | "tetrad-01"
  | "transition-01-02";

export type TetradicV2State = Readonly<{
  progress: number;
  scene: TetradicV2Scene;
  environment: number;
  artifact: number;
  coverRecognition: number;
  coverLock: number;
  coverCopy: number;
  archive: number;
  archiveSeal: number;
  archiveBlade: number;
  tetradOne: number;
  tetradOneDetail: number;
  tetradOneTitle: number;
  tetradOneStatement: number;
  transition: number;
  tetradTwo: number;
  telemetry: number;
}>;

export function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

export function rangeProgress(progress: number, start: number, end: number) {
  if (end <= start) return progress >= end ? 1 : 0;
  const value = clamp01((progress - start) / (end - start));
  return value * value * (3 - 2 * value);
}

function visibleWindow(
  progress: number,
  enterStart: number,
  enterEnd: number,
  exitStart: number,
  exitEnd: number
) {
  return (
    rangeProgress(progress, enterStart, enterEnd) *
    (1 - rangeProgress(progress, exitStart, exitEnd))
  );
}

export function getTetradicV2State(progress: number): TetradicV2State {
  const p = clamp01(progress);
  const scenes = TETRADIC_V2_TIMELINE.scenes;
  const scene: TetradicV2Scene =
    p < scenes.artifactReveal.end
      ? "artifact-reveal"
      : p < scenes.coverIdentity.end
        ? "cover-identity"
        : p < scenes.enterArchive.end
          ? "enter-archive"
          : p < scenes.tetradOne.end
            ? "tetrad-01"
            : "transition-01-02";

  return {
    progress: p,
    scene,
    environment: rangeProgress(p, 0.025, 0.12),
    artifact: rangeProgress(p, 0.065, 0.18),
    coverRecognition: rangeProgress(p, 0.11, 0.24),
    coverLock: rangeProgress(p, 0.18, 0.3),
    coverCopy: visibleWindow(p, 0.2, 0.25, 0.3, 0.36),
    archive: rangeProgress(p, 0.32, 0.48),
    archiveSeal: visibleWindow(p, 0.23, 0.31, 0.43, 0.5),
    archiveBlade: visibleWindow(p, 0.32, 0.37, 0.44, 0.5),
    tetradOne: rangeProgress(p, 0.4, 0.51) * (1 - rangeProgress(p, 0.88, 0.97)),
    tetradOneDetail: rangeProgress(p, 0.5, 0.61),
    tetradOneTitle: visibleWindow(p, 0.54, 0.61, 0.73, 0.8),
    tetradOneStatement: visibleWindow(p, 0.6, 0.66, 0.72, 0.79),
    transition: rangeProgress(p, 0.78, 0.96),
    tetradTwo: rangeProgress(p, 0.88, 0.99),
    telemetry: visibleWindow(p, 0.03, 0.08, 0.9, 0.99),
  };
}

export type TetradicV2MasterSegment = Readonly<{
  id: string;
  kind: "foundation" | "chapter" | "synthesis" | "cta";
  chapter: number | null;
  startSvh: number;
  endSvh: number;
  start: number;
  end: number;
}>;

const MASTER_TRAVEL_SVH = 3040;
const FOUNDATION_TRAVEL_SVH = TETRADIC_V2_TIMELINE.travelSvh;

function masterSegment(
  id: string,
  kind: TetradicV2MasterSegment["kind"],
  chapter: number | null,
  startSvh: number,
  endSvh: number
): TetradicV2MasterSegment {
  return {
    id,
    kind,
    chapter,
    startSvh,
    endSvh,
    start: startSvh / MASTER_TRAVEL_SVH,
    end: endSvh / MASTER_TRAVEL_SVH,
  };
}

let chapterCursor = FOUNDATION_TRAVEL_SVH;
const chapterSegments = TETRADIC_CHOREOGRAPHY.slice(1).map(chapter => {
  const duration =
    chapter.number === 12 ? 240 : chapter.number === 11 ? 200 : 180;
  const segment = masterSegment(
    chapter.id,
    "chapter",
    chapter.number,
    chapterCursor,
    chapterCursor + duration
  );
  chapterCursor += duration;
  return segment;
});

const synthesisSegment = masterSegment(
  "final-synthesis",
  "synthesis",
  null,
  chapterCursor,
  chapterCursor + 160
);
const ctaSegment = masterSegment(
  "final-cta",
  "cta",
  null,
  synthesisSegment.endSvh,
  MASTER_TRAVEL_SVH
);

export const TETRADIC_V2_MASTER_TIMELINE = {
  travelSvh: MASTER_TRAVEL_SVH,
  compactTravelSvh:
    MASTER_TRAVEL_SVH *
    (TETRADIC_V2_TIMELINE.compactTravelSvh / TETRADIC_V2_TIMELINE.travelSvh),
  compactFoundationSvh: TETRADIC_V2_TIMELINE.compactTravelSvh,
  viewportSvh: TETRADIC_V2_TIMELINE.viewportSvh,
  foundation: masterSegment(
    "foundation",
    "foundation",
    null,
    0,
    FOUNDATION_TRAVEL_SVH
  ),
  segments: [
    masterSegment("foundation", "foundation", null, 0, FOUNDATION_TRAVEL_SVH),
    ...chapterSegments,
    synthesisSegment,
    ctaSegment,
  ] as readonly TetradicV2MasterSegment[],
} as const;

export type TetradicV2ChapterBeats = Readonly<{
  plate: number;
  title: number;
  statement: number;
  visual: number;
  inspection: number;
  exit: number;
  transition: number;
  motion: readonly [number, number, number, number];
}>;

export type TetradicV2ChapterState = Readonly<{
  number: number;
  local: number;
  presence: number;
  active: boolean;
  incoming: boolean;
  beats: TetradicV2ChapterBeats;
}>;

export type TetradicV2MasterState = Readonly<{
  progress: number;
  positionSvh: number;
  segmentId: string;
  activeChapter: number | null;
  incomingChapter: number | null;
  local: number;
  foundation: TetradicV2State;
  chapters: readonly TetradicV2ChapterState[];
  synthesis: number;
  synthesisCopy: number;
  cta: number;
  ctaCopy: number;
}>;

function chapterBeats(
  number: number,
  rawLocal: number
): TetradicV2ChapterBeats {
  const local = clamp01(rawLocal);
  if (number === 2) {
    const exit = rangeProgress(local, 0.72, 0.82);
    const transition = rangeProgress(local, 0.82, 1);
    return {
      plate: 1 - rangeProgress(local, 0.94, 1),
      title: 1 - exit,
      statement: 1 - exit,
      visual: 1,
      inspection: visibleWindow(local, 0.44, 0.54, 0.72, 0.82),
      exit,
      transition,
      motion: [
        rangeProgress(local, 0.04, 0.18),
        rangeProgress(local, 0.16, 0.3),
        rangeProgress(local, 0.28, 0.42),
        rangeProgress(local, 0.4, 0.54),
      ],
    };
  }

  const finalChapter = number === 12;
  const embodiedChapter = number === 11;
  const titleStart = embodiedChapter || finalChapter ? 0.2 : 0.22;
  const statementStart = embodiedChapter || finalChapter ? 0.27 : 0.29;
  const inspectionStart = 0.52;
  const inspectionEnd = finalChapter ? 0.84 : embodiedChapter ? 0.8 : 0.78;
  const exitEnd = finalChapter ? 0.92 : embodiedChapter ? 0.88 : 0.86;
  const transitionStart = exitEnd;
  const exit = rangeProgress(local, inspectionEnd, exitEnd);
  const transition = rangeProgress(local, transitionStart, 1);
  const configuredMotion =
    number >= 4 ? TETRADIC_LATER_MOTION[number - 4] : undefined;
  const motionRanges = configuredMotion?.phases ?? [
    { start: 0.14, end: 0.26 },
    { start: 0.24, end: 0.36 },
    { start: 0.34, end: 0.48 },
    { start: 0.46, end: 0.6 },
  ];

  return {
    plate: 1 - rangeProgress(local, finalChapter ? 0.96 : 0.94, 1),
    title: rangeProgress(local, titleStart, titleStart + 0.1) * (1 - exit),
    statement:
      rangeProgress(local, statementStart, statementStart + 0.09) * (1 - exit),
    visual: rangeProgress(local, 0.04, 0.6),
    inspection: visibleWindow(
      local,
      inspectionStart,
      0.6,
      inspectionEnd,
      exitEnd
    ),
    exit,
    transition,
    motion: [
      rangeProgress(local, motionRanges[0].start, motionRanges[0].end),
      rangeProgress(local, motionRanges[1].start, motionRanges[1].end),
      rangeProgress(local, motionRanges[2].start, motionRanges[2].end),
      rangeProgress(local, motionRanges[3].start, motionRanges[3].end),
    ],
  };
}

function localProgress(positionSvh: number, segment: TetradicV2MasterSegment) {
  return clamp01(
    (positionSvh - segment.startSvh) / (segment.endSvh - segment.startSvh)
  );
}

export function getTetradicV2MasterState(
  rawProgress: number
): TetradicV2MasterState {
  const progress = clamp01(rawProgress);
  const positionSvh = progress * TETRADIC_V2_MASTER_TIMELINE.travelSvh;
  const segment =
    TETRADIC_V2_MASTER_TIMELINE.segments.find(
      candidate => positionSvh < candidate.endSvh
    ) ?? ctaSegment;
  const local = localProgress(positionSvh, segment);
  const foundationProgress =
    Math.round(clamp01(positionSvh / FOUNDATION_TRAVEL_SVH) * 1e12) / 1e12;
  const foundation = getTetradicV2State(foundationProgress);
  const activeChapter =
    segment.kind === "chapter"
      ? segment.chapter
      : segment.kind === "foundation"
        ? foundation.progress < 0.78
          ? 1
          : 2
        : segment.kind === "synthesis"
          ? 12
          : null;
  const currentBeats =
    segment.kind === "chapter" && segment.chapter
      ? chapterBeats(segment.chapter, local)
      : null;
  const segmentIndex = TETRADIC_V2_MASTER_TIMELINE.segments.indexOf(segment);
  const followingSegment =
    TETRADIC_V2_MASTER_TIMELINE.segments[segmentIndex + 1];
  const incomingChapter =
    followingSegment?.kind === "chapter" && currentBeats
      ? followingSegment.chapter
      : null;
  const chapters = chapterSegments.map(chapterSegment => {
    const number = chapterSegment.chapter!;
    if (number === segment.chapter && currentBeats) {
      return {
        number,
        local,
        presence: currentBeats.plate,
        active: true,
        incoming: false,
        beats: currentBeats,
      };
    }
    if (number === incomingChapter && currentBeats) {
      return {
        number,
        local: 0,
        presence: currentBeats.transition,
        active: false,
        incoming: true,
        beats: chapterBeats(number, 0),
      };
    }
    return {
      number,
      local: 0,
      presence: 0,
      active: false,
      incoming: false,
      beats: chapterBeats(number, 0),
    };
  });

  let synthesis = 0;
  let synthesisCopy = 0;
  let cta = 0;
  let ctaCopy = 0;

  if (segment.chapter === 12 && currentBeats) {
    synthesis = currentBeats.transition;
    synthesisCopy = rangeProgress(local, 0.94, 1);
  } else if (segment.kind === "synthesis") {
    const withdrawal = rangeProgress(local, 0.7, 1);
    synthesis = 1 - rangeProgress(local, 0.86, 1);
    synthesisCopy = 1 - rangeProgress(local, 0.7, 0.86);
    cta = withdrawal;
  } else if (segment.kind === "cta") {
    cta = 1;
    ctaCopy = rangeProgress(local, 0.18, 0.4);
  }

  return {
    progress,
    positionSvh,
    segmentId: segment.kind === "foundation" ? foundation.scene : segment.id,
    activeChapter,
    incomingChapter,
    local,
    foundation,
    chapters,
    synthesis,
    synthesisCopy,
    cta,
    ctaCopy,
  };
}
