export const TETRADIC_SACRED_FPS = 18;
export const TETRADIC_SACRED_MOBILE_FPS = 15;

export const TETRADIC_SACRED_FILMS = [
  {
    id: "book-opens",
    label: "The Book Opens",
    source: "/assets/tetradic-signature/scroll/04book_opens_scrub.mp4",
    mobileSource:
      "/assets/tetradic-signature/scroll/04book_opens_scrub-mobile.mp4",
    fallbackSource:
      "/assets/tetradic-signature/scroll/04book_opens_scrub-mobile.mp4",
    duration: 8,
  },
  {
    id: "page-entry",
    label: "Entering the Page",
    source: "/assets/tetradic-signature/scroll/05page_zoom_scrub.mp4",
    mobileSource:
      "/assets/tetradic-signature/scroll/05page_zoom_scrub-mobile.mp4",
    fallbackSource:
      "/assets/tetradic-signature/scroll/05page_zoom_scrub-mobile.mp4",
    duration: 8,
  },
] as const;

export const TETRADIC_SACRED_SCROLL = {
  totalSvh: 1000,
  scrollableSvh: 900,
  frameStep: 1 / TETRADIC_SACRED_FPS,
  mobileFrameStep: 1 / TETRADIC_SACRED_MOBILE_FPS,
  lenis: {
    lerp: 0.075,
    wheelMultiplier: 0.65,
    touchMultiplier: 0.9,
  },
  ranges: {
    film01: [0, 0.38],
    transition01To02: [0.38, 0.45],
    film02: [0.45, 0.8],
    pageHold: [0.8, 1],
  },
} as const;

export type TetradicSacredScrollPhase =
  | "film-01"
  | "transition-01-02"
  | "film-02"
  | "page-hold";

export type TetradicSacredScrollState = Readonly<{
  progress: number;
  localProgress: number;
  phase: TetradicSacredScrollPhase;
  activeFilm: number;
  times: readonly [number, number];
  opacities: readonly [number, number];
  reveal: number;
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
    TETRADIC_SACRED_FILMS[index].duration - TETRADIC_SACRED_SCROLL.frameStep
  );
}

export function getTetradicSacredScrollState(
  rawProgress: number
): TetradicSacredScrollState {
  const progress = clamp01(rawProgress);
  const ranges = TETRADIC_SACRED_SCROLL.ranges;
  const film01End = finalFrame(0);
  const film02End = finalFrame(1);

  if (progress < ranges.film01[1]) {
    const local = rangeProgress(progress, ...ranges.film01);
    return {
      progress,
      localProgress: local,
      phase: "film-01",
      activeFilm: 0,
      times: [film01End * local, 0],
      opacities: [1, 0],
      reveal: 0,
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
      times: [film01End, 0],
      opacities: [1 - blend, blend],
      reveal: 0,
    };
  }

  if (progress < ranges.film02[1]) {
    const local = rangeProgress(progress, ...ranges.film02);
    return {
      progress,
      localProgress: local,
      phase: "film-02",
      activeFilm: 1,
      times: [film01End, film02End * local],
      opacities: [0, 1],
      reveal: 0,
    };
  }

  const local = rangeProgress(progress, ...ranges.pageHold);
  return {
    progress,
    localProgress: local,
    phase: "page-hold",
    activeFilm: 1,
    times: [film01End, film02End],
    opacities: [0, 1],
    reveal: smoothstep(rangeProgress(local, 0.15, 0.85)),
  };
}
