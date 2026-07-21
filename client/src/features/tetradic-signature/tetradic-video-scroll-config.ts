export const TETRADIC_VIDEO_FPS = 18;
export const TETRADIC_VIDEO_MOBILE_FPS = 15;

export const TETRADIC_SCROLL_FILMS = [
  {
    id: "artifact-reveal",
    label: "Artifact Reveal",
    source: "/assets/tetradic-signature/scroll/01first_intro_scrub.mp4",
    mobileSource:
      "/assets/tetradic-signature/scroll/01first_intro_scrub-mobile.mp4",
    fallbackSource:
      "/assets/tetradic-signature/scroll/01first_intro_scrub-mobile.mp4",
    duration: 10,
  },
  {
    id: "archive-activation",
    label: "Archive Activation",
    source: "/assets/tetradic-signature/scroll/02middle_intro_scrub.mp4",
    mobileSource:
      "/assets/tetradic-signature/scroll/02middle_intro_scrub-mobile.mp4",
    fallbackSource:
      "/assets/tetradic-signature/scroll/02middle_intro_scrub-mobile.mp4",
    duration: 8,
  },
  {
    id: "book-opening",
    label: "Book Opening",
    source: "/assets/tetradic-signature/scroll/03last_intro_scrub.mp4",
    mobileSource:
      "/assets/tetradic-signature/scroll/03last_intro_scrub-mobile.mp4",
    fallbackSource:
      "/assets/tetradic-signature/scroll/03last_intro_scrub-mobile.mp4",
    duration: 10,
  },
] as const;

export const TETRADIC_VIDEO_SCROLL = {
  totalSvh: 1100,
  scrollableSvh: 1000,
  frameStep: 1 / TETRADIC_VIDEO_FPS,
  mobileFrameStep: 1 / TETRADIC_VIDEO_MOBILE_FPS,
  lenis: {
    lerp: 0.075,
    wheelMultiplier: 0.65,
    touchMultiplier: 0.9,
  },
  ranges: {
    film01: [0, 0.27],
    transition01To02: [0.27, 0.33],
    film02: [0.33, 0.55],
    transition02To03: [0.55, 0.61],
    film03: [0.61, 0.88],
    finalHold: [0.88, 1],
  },
} as const;

export type TetradicVideoScrollPhase =
  | "film-01"
  | "transition-01-02"
  | "film-02"
  | "transition-02-03"
  | "film-03"
  | "final-hold";

export type TetradicVideoScrollState = Readonly<{
  progress: number;
  localProgress: number;
  phase: TetradicVideoScrollPhase;
  activeFilm: number;
  times: readonly [number, number, number];
  opacities: readonly [number, number, number];
}>;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, value));
}

function rangeProgress(value: number, start: number, end: number) {
  if (end === start) return 1;
  return clamp01((value - start) / (end - start));
}

function smoothstep(value: number) {
  const progress = clamp01(value);
  return progress * progress * (3 - 2 * progress);
}

function finalFrame(index: number) {
  return Math.max(
    0,
    TETRADIC_SCROLL_FILMS[index].duration - TETRADIC_VIDEO_SCROLL.frameStep
  );
}

export function getTetradicVideoScrollState(
  rawProgress: number
): TetradicVideoScrollState {
  const progress = clamp01(rawProgress);
  const ranges = TETRADIC_VIDEO_SCROLL.ranges;
  const film01End = finalFrame(0);
  const film02End = finalFrame(1);
  const film03End = finalFrame(2);

  if (progress < ranges.film01[1]) {
    const local = rangeProgress(progress, ...ranges.film01);
    return {
      progress,
      localProgress: local,
      phase: "film-01",
      activeFilm: 0,
      times: [film01End * local, 0, 0],
      opacities: [1, 0, 0],
    };
  }

  if (progress < ranges.transition01To02[1]) {
    const local = rangeProgress(progress, ...ranges.transition01To02);
    const blend = smoothstep(local);
    return {
      progress,
      localProgress: local,
      phase: "transition-01-02",
      activeFilm: blend < 0.5 ? 0 : 1,
      times: [film01End, 0, 0],
      opacities: [1 - blend, blend, 0],
    };
  }

  if (progress < ranges.film02[1]) {
    const local = rangeProgress(progress, ...ranges.film02);
    return {
      progress,
      localProgress: local,
      phase: "film-02",
      activeFilm: 1,
      times: [film01End, film02End * local, 0],
      opacities: [0, 1, 0],
    };
  }

  if (progress < ranges.transition02To03[1]) {
    const local = rangeProgress(progress, ...ranges.transition02To03);
    const blend = smoothstep(local);
    return {
      progress,
      localProgress: local,
      phase: "transition-02-03",
      activeFilm: blend < 0.5 ? 1 : 2,
      times: [film01End, film02End, 0],
      opacities: [0, 1 - blend, blend],
    };
  }

  if (progress < ranges.film03[1]) {
    const local = rangeProgress(progress, ...ranges.film03);
    return {
      progress,
      localProgress: local,
      phase: "film-03",
      activeFilm: 2,
      times: [film01End, film02End, film03End * local],
      opacities: [0, 0, 1],
    };
  }

  return {
    progress,
    localProgress: rangeProgress(progress, ...ranges.finalHold),
    phase: "final-hold",
    activeFilm: 2,
    times: [film01End, film02End, film03End],
    opacities: [0, 0, 1],
  };
}
