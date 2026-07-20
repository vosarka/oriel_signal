import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

import {
  getTetradicVideoScrollState,
  TETRADIC_SCROLL_FILMS,
  TETRADIC_VIDEO_SCROLL,
} from "./tetradic-video-scroll-config";

gsap.registerPlugin(ScrollTrigger);

export const TETRADIC_VIDEO_SCROLL_RESTORE_KEY =
  "oriel:tetradic-video-scroll-progress";

const STORAGE_WRITE_INTERVAL_MS = 250;

type TetradicVideoScrubOptions = Readonly<{
  containerRef: RefObject<HTMLElement | null>;
  videoRefs: RefObject<Array<HTMLVideoElement | null>>;
  reducedMotion: boolean;
  lenis?: Lenis;
}>;

function isReloadNavigation() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type === "reload";
}

function readStoredProgress() {
  try {
    return Number(sessionStorage.getItem(TETRADIC_VIDEO_SCROLL_RESTORE_KEY));
  } catch {
    return Number.NaN;
  }
}

function writeStoredProgress(progress: number) {
  try {
    sessionStorage.setItem(
      TETRADIC_VIDEO_SCROLL_RESTORE_KEY,
      progress.toFixed(6)
    );
  } catch {
    // The scrub must remain usable when storage is unavailable.
  }
}

function setMediaTime(video: HTMLVideoElement, requestedTime: number) {
  if (video.readyState < HTMLMediaElement.HAVE_METADATA) return;

  const duration = Number.isFinite(video.duration)
    ? video.duration
    : requestedTime;
  const target = Math.min(
    Math.max(0, requestedTime),
    Math.max(0, duration - TETRADIC_VIDEO_SCROLL.frameStep)
  );

  if (Math.abs(video.currentTime - target) < TETRADIC_VIDEO_SCROLL.frameStep) {
    return;
  }

  video.currentTime = target;
}

export function useTetradicVideoScrub({
  containerRef,
  videoRefs,
  reducedMotion,
  lenis,
}: TetradicVideoScrubOptions) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const videos = videoRefs.current.filter(
      (video): video is HTMLVideoElement => Boolean(video)
    );
    if (!container || videos.length !== TETRADIC_SCROLL_FILMS.length) return;

    videos.forEach(video => video.pause());

    if (reducedMotion) {
      container.dataset.phase = "reduced-motion";
      container.dataset.activeFilm = "all";
      container.dataset.scrollProgress = "0.0000";
      return;
    }

    const layers = Array.from(
      container.querySelectorAll<HTMLElement>("[data-film-layer]")
    );
    const progressFill = container.querySelector<HTMLElement>(
      "[data-video-progress-fill]"
    );
    const progressbar = progressFill?.parentElement;
    const counter = container.querySelector<HTMLElement>(
      "[data-video-counter]"
    );
    const status = container.querySelector<HTMLElement>("[data-video-status]");
    const liveStatus = container.querySelector<HTMLElement>(
      "[data-video-live-status]"
    );
    const setLayerOpacity = layers.map(layer =>
      gsap.quickSetter(layer, "opacity")
    );
    const setProgress = progressFill
      ? gsap.quickSetter(progressFill, "scaleX")
      : null;
    let latestProgress = 0;
    let frameRequest = 0;
    let lastAnnouncedFilm = -1;
    let lastActiveFilm = -1;
    let lastPhase = "";
    let lastProgressPercent = -1;
    let lastMediaWaiting: boolean | undefined;
    let lastStorageWrite = 0;
    let lastOpacities: readonly number[] = [-1, -1, -1];
    const savedProgress = isReloadNavigation()
      ? readStoredProgress()
      : Number.NaN;
    let restoringReload =
      Number.isFinite(savedProgress) && savedProgress > 0 && savedProgress <= 1;

    const applyProgress = (progress: number) => {
      const state = getTetradicVideoScrollState(progress);
      latestProgress = state.progress;

      state.times.forEach((time, index) => {
        setMediaTime(videos[index], time);
      });

      const opacities = [...state.opacities] as [number, number, number];
      const incomingIndex = opacities.findIndex(
        (opacity, index) =>
          opacity > 0 &&
          index > 0 &&
          videos[index].readyState < HTMLMediaElement.HAVE_CURRENT_DATA
      );

      if (incomingIndex > 0) {
        opacities.fill(0);
        opacities[incomingIndex - 1] = 1;
      }

      const mediaWaiting = incomingIndex > 0;
      if (mediaWaiting !== lastMediaWaiting) {
        container.dataset.mediaWaiting = String(mediaWaiting);
        lastMediaWaiting = mediaWaiting;
      }

      opacities.forEach((opacity, index) => {
        if (Math.abs(opacity - lastOpacities[index]) < 0.0001) return;
        setLayerOpacity[index](opacity);
      });
      lastOpacities = opacities;
      setProgress?.(state.progress);

      const progressPercent = Math.round(state.progress * 100);
      if (progressPercent !== lastProgressPercent) {
        progressbar?.setAttribute("aria-valuenow", String(progressPercent));
        container.dataset.scrollProgress = (progressPercent / 100).toFixed(2);
        container.dataset.hasScrolled = String(progressPercent > 0);
        lastProgressPercent = progressPercent;
      }

      if (state.phase !== lastPhase) {
        container.dataset.phase = state.phase;
        if (status) {
          status.textContent =
            state.phase === "final-hold"
              ? "Opening complete"
              : TETRADIC_SCROLL_FILMS[state.activeFilm].label;
        }
        lastPhase = state.phase;
      }

      if (state.activeFilm !== lastActiveFilm) {
        const filmNumber = String(state.activeFilm + 1).padStart(2, "0");
        container.dataset.activeFilm = filmNumber;
        if (counter) counter.textContent = `${filmNumber} / 03`;
        lastActiveFilm = state.activeFilm;
      }

      if (liveStatus && state.activeFilm !== lastAnnouncedFilm) {
        liveStatus.textContent = `Archive film ${state.activeFilm + 1} of 3: ${TETRADIC_SCROLL_FILMS[state.activeFilm].label}`;
        lastAnnouncedFilm = state.activeFilm;
      }
    };

    const persistProgress = (progress: number, force = false) => {
      const now = performance.now();
      if (!force && now - lastStorageWrite < STORAGE_WRITE_INTERVAL_MS) return;
      writeStoredProgress(progress);
      lastStorageWrite = now;
    };

    const queueProgress = (progress: number) => {
      latestProgress = progress;
      if (frameRequest) return;
      frameRequest = window.requestAnimationFrame(() => {
        frameRequest = 0;
        applyProgress(latestProgress);
      });
    };

    const mediaReady = () => queueProgress(latestProgress);
    videos.forEach(video => {
      video.addEventListener("loadedmetadata", mediaReady);
      video.addEventListener("loadeddata", mediaReady);
      video.addEventListener("seeked", mediaReady);
    });

    let trigger!: ScrollTrigger;
    const context = gsap.context(() => {
      trigger = ScrollTrigger.create({
        id: "tetradic-video-scroll",
        trigger: container,
        start: "top top",
        end: "bottom bottom",
        invalidateOnRefresh: true,
        anticipatePin: 1,
        onUpdate: self => {
          queueProgress(self.progress);
          if (!restoringReload) persistProgress(self.progress);
        },
        onRefresh: self =>
          applyProgress(restoringReload ? savedProgress : self.progress),
      });
    }, container);

    applyProgress(restoringReload ? savedProgress : trigger.progress);

    let refreshFrame = window.requestAnimationFrame(() => {
      refreshFrame = window.requestAnimationFrame(() => {
        ScrollTrigger.refresh();
        if (restoringReload) {
          const target =
            trigger.start + savedProgress * (trigger.end - trigger.start);
          if (lenis) {
            lenis.scrollTo(target, { immediate: true });
          } else {
            window.scrollTo({ top: target, behavior: "auto" });
          }
          applyProgress(savedProgress);
          restoringReload = false;
          persistProgress(savedProgress, true);
          ScrollTrigger.update();
          return;
        }
        applyProgress(trigger.progress);
      });
    });

    let cancelled = false;
    const refreshAfterFonts = () => {
      if (cancelled) return;
      ScrollTrigger.refresh();
      applyProgress(restoringReload ? savedProgress : trigger.progress);
    };
    void document.fonts.ready.then(refreshAfterFonts);
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      ScrollTrigger.refresh();
      applyProgress(trigger.progress);
    };
    const handlePageHide = () => persistProgress(latestProgress, true);
    window.addEventListener("pageshow", handlePageShow);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameRequest);
      window.cancelAnimationFrame(refreshFrame);
      videos.forEach(video => {
        video.removeEventListener("loadedmetadata", mediaReady);
        video.removeEventListener("loadeddata", mediaReady);
        video.removeEventListener("seeked", mediaReady);
      });
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
      persistProgress(latestProgress, true);
      trigger.kill();
      context.revert();
    };
  }, [containerRef, lenis, reducedMotion, videoRefs]);
}
