import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

import {
  getTetradicSacredScrollState,
  TETRADIC_SACRED_FILMS,
} from "./tetradic-sacred-scroll-config";
import { createTetradicVideoSeekController } from "./tetradic-video-seek-controller";

gsap.registerPlugin(ScrollTrigger);

export const TETRADIC_SACRED_SCROLL_RESTORE_KEY =
  "oriel:tetradic-sacred-scroll-progress";

const STORAGE_WRITE_INTERVAL_MS = 250;

type TetradicSacredScrubOptions = Readonly<{
  containerRef: RefObject<HTMLElement | null>;
  videoRefs: RefObject<Array<HTMLVideoElement | null>>;
  reducedMotion: boolean;
  mediaFrameStep: number;
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
    return Number(sessionStorage.getItem(TETRADIC_SACRED_SCROLL_RESTORE_KEY));
  } catch {
    return Number.NaN;
  }
}

function writeStoredProgress(progress: number) {
  try {
    sessionStorage.setItem(
      TETRADIC_SACRED_SCROLL_RESTORE_KEY,
      progress.toFixed(6)
    );
  } catch {
    // The scrub must remain usable when storage is unavailable.
  }
}

export function useTetradicSacredScrub({
  containerRef,
  videoRefs,
  reducedMotion,
  mediaFrameStep,
  lenis,
}: TetradicSacredScrubOptions) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    const videos = videoRefs.current.filter(
      (video): video is HTMLVideoElement => Boolean(video)
    );
    if (!container || videos.length !== TETRADIC_SACRED_FILMS.length) return;

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
    const reveal = container.querySelector<HTMLElement>("[data-page-reveal]");
    const revealInner = container.querySelector<HTMLElement>(
      "[data-page-reveal-inner]"
    );
    const setLayerOpacity = layers.map(layer =>
      gsap.quickSetter(layer, "opacity")
    );
    const setProgress = progressFill
      ? gsap.quickSetter(progressFill, "scaleX")
      : null;
    const setRevealOpacity = reveal
      ? gsap.quickSetter(reveal, "opacity")
      : null;
    const setRevealRise = revealInner
      ? gsap.quickSetter(revealInner, "y", "px")
      : null;
    let latestProgress = 0;
    let frameRequest = 0;
    let lastAnnouncedFilm = -1;
    let lastActiveFilm = -1;
    let lastPhase = "";
    let lastProgressPercent = -1;
    let lastReveal = -1;
    let lastMediaWaiting: boolean | undefined;
    let lastStorageWrite = 0;
    let lastOpacities: readonly number[] = [-1, -1];
    const preparedFilms = new Set<number>([0]);
    const layerActivated = [false, false];
    const savedProgress = isReloadNavigation()
      ? readStoredProgress()
      : Number.NaN;
    let restoringReload =
      Number.isFinite(savedProgress) && savedProgress > 0 && savedProgress <= 1;

    const controllers = videos.map(video =>
      createTetradicVideoSeekController(video, {
        frameStep: mediaFrameStep,
        onFramePresented: () => queueProgress(latestProgress),
      })
    );

    const prepareFilm = (index: number) => {
      const video = videos[index];
      if (!video || preparedFilms.has(index)) return;
      preparedFilms.add(index);
      if (video.dataset.scrubPrepared === "true") return;
      video.dataset.scrubPrepared = "true";
      video.preload = "auto";
      if (video.networkState === HTMLMediaElement.NETWORK_EMPTY) video.load();
    };

    const applyProgress = (progress: number) => {
      const state = getTetradicSacredScrollState(progress);
      latestProgress = state.progress;

      prepareFilm(state.activeFilm);
      if (state.progress >= 0.2) prepareFilm(1);

      state.opacities.forEach((opacity, index) => {
        if (opacity <= 0 && index !== state.activeFilm) return;
        controllers[index].request(state.times[index]);
        if (controllers[index].isPresentedAt(state.times[index])) {
          layerActivated[index] = true;
        }
      });

      const opacities = [...state.opacities] as [number, number];
      const incomingIndex = opacities.findIndex(
        (opacity, index) => opacity > 0 && index > 0 && !layerActivated[index]
      );

      if (incomingIndex > 0) {
        prepareFilm(incomingIndex - 1);
        controllers[incomingIndex - 1].request(state.times[incomingIndex - 1]);
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

      if (Math.abs(state.reveal - lastReveal) >= 0.0005) {
        setRevealOpacity?.(state.reveal);
        setRevealRise?.((1 - state.reveal) * 48);
        lastReveal = state.reveal;
      }

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
            state.phase === "page-hold"
              ? "The Page Receives You"
              : TETRADIC_SACRED_FILMS[state.activeFilm].label;
        }
        lastPhase = state.phase;
      }

      if (state.activeFilm !== lastActiveFilm) {
        const filmNumber = String(state.activeFilm + 1).padStart(2, "0");
        container.dataset.activeFilm = filmNumber;
        if (counter) counter.textContent = `${filmNumber} / 02`;
        lastActiveFilm = state.activeFilm;
      }

      if (liveStatus && state.activeFilm !== lastAnnouncedFilm) {
        liveStatus.textContent = `Archive film ${state.activeFilm + 1} of 2: ${TETRADIC_SACRED_FILMS[state.activeFilm].label}`;
        lastAnnouncedFilm = state.activeFilm;
      }
    };

    const persistProgress = (progress: number, force = false) => {
      const now = performance.now();
      if (!force && now - lastStorageWrite < STORAGE_WRITE_INTERVAL_MS) return;
      writeStoredProgress(progress);
      lastStorageWrite = now;
    };

    function queueProgress(progress: number) {
      latestProgress = progress;
      if (frameRequest) return;
      frameRequest = window.requestAnimationFrame(() => {
        frameRequest = 0;
        applyProgress(latestProgress);
      });
    }

    const mediaReadyHandlers = videos.map((video, index) => () => {
      controllers[index].syncLoadedFrame();
      queueProgress(latestProgress);
    });
    videos.forEach((video, index) => {
      video.addEventListener("loadedmetadata", mediaReadyHandlers[index]);
      video.addEventListener("loadeddata", mediaReadyHandlers[index]);
    });

    let trigger!: ScrollTrigger;
    const context = gsap.context(() => {
      trigger = ScrollTrigger.create({
        id: "tetradic-sacred-scroll",
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
      videos.forEach((video, index) => {
        video.removeEventListener("loadedmetadata", mediaReadyHandlers[index]);
        video.removeEventListener("loadeddata", mediaReadyHandlers[index]);
      });
      controllers.forEach(controller => controller.dispose());
      window.removeEventListener("pageshow", handlePageShow);
      window.removeEventListener("pagehide", handlePageHide);
      persistProgress(latestProgress, true);
      trigger.kill();
      context.revert();
    };
  }, [containerRef, lenis, mediaFrameStep, reducedMotion, videoRefs]);
}
