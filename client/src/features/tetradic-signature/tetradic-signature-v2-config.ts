import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SIGNATURE_CONFIG,
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
  chapters: [TETRADIC_CHOREOGRAPHY[0], TETRADIC_CHOREOGRAPHY[1]],
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
