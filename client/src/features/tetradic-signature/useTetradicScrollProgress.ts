import { useCallback, useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  TETRADIC_REDUCED_MOTION_PROGRESS,
  clampProgress,
  getTetradicSceneState,
  type TetradicSceneState,
} from "./chapter-config";
import { TETRADIC_SIGNATURE_CONFIG } from "./tetradic-signature-config";

gsap.registerPlugin(ScrollTrigger);

const RESTORE_KEY = "oriel:tetradic-signature:progress";

function isReloadNavigation() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type === "reload";
}

export function useTetradicScrollProgress(
  containerRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean
) {
  const sceneStateRef = useRef<TetradicSceneState>(
    getTetradicSceneState(reducedMotion ? TETRADIC_REDUCED_MOTION_PROGRESS : 0)
  );

  const scrollToProgress = useCallback(
    (rawProgress: number, behavior: ScrollBehavior) => {
      const container = containerRef.current;
      if (!container) return;

      const top = container.getBoundingClientRect().top + window.scrollY;
      const distance = Math.max(0, container.offsetHeight - window.innerHeight);
      window.scrollTo({
        top: top + distance * clampProgress(rawProgress),
        behavior,
      });
    },
    [containerRef]
  );

  const exploreSample = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    container.focus({ preventScroll: true });
    if (reducedMotion) {
      scrollToProgress(TETRADIC_REDUCED_MOTION_PROGRESS, "auto");
      return;
    }

    const { startProgress, endProgress } =
      TETRADIC_SIGNATURE_CONFIG.animation.exploreSample;
    const previousScrollBehavior =
      document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = "auto";
    scrollToProgress(startProgress, "auto");
    document.documentElement.style.scrollBehavior = previousScrollBehavior;
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        scrollToProgress(endProgress, "smooth");
      });
    });
  }, [containerRef, reducedMotion, scrollToProgress]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const apply = (rawProgress: number) => {
      const state = getTetradicSceneState(rawProgress);
      const tetrad = state.tetradOne;
      sceneStateRef.current = state;

      container.dataset.progress = state.progress.toFixed(4);
      container.dataset.chapter = state.activeChapter;
      container.dataset.coverOpen = state.coverOpen.toFixed(4);
      container.dataset.tetradProgress = tetrad.progress.toFixed(4);
      container.style.setProperty("--ts-progress", state.progress.toFixed(4));
      container.style.setProperty("--ts-reveal", state.reveal.toFixed(4));
      container.style.setProperty("--ts-cta", state.cta.toFixed(4));
      container.style.setProperty(
        "--ts-narrative-cover",
        state.narrative.cover.toFixed(4)
      );
      container.style.setProperty(
        "--ts-narrative-approach",
        state.narrative.approach.toFixed(4)
      );
      container.style.setProperty(
        "--ts-narrative-cta",
        state.narrative.cta.toFixed(4)
      );
      container.style.setProperty("--ts-t1-eyebrow", tetrad.eyebrow.toFixed(4));
      container.style.setProperty("--ts-t1-title", tetrad.title.toFixed(4));
      container.style.setProperty(
        "--ts-t1-description",
        tetrad.description.toFixed(4)
      );
      container.style.setProperty("--ts-t1-labels", tetrad.labels.toFixed(4));
      container.style.setProperty(
        "--ts-t1-annotation",
        tetrad.annotation.toFixed(4)
      );
      container.style.setProperty(
        "--ts-t1-withdrawal",
        tetrad.withdrawal.toFixed(4)
      );
    };

    if (reducedMotion) {
      container.dataset.reducedMotion = "true";
      apply(TETRADIC_REDUCED_MOTION_PROGRESS);
      return;
    }

    delete container.dataset.reducedMotion;

    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: self => {
        apply(self.progress);
        sessionStorage.setItem(RESTORE_KEY, self.progress.toFixed(6));
      },
    });

    apply(trigger.progress);

    frame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();

      frame = window.requestAnimationFrame(() => {
        if (isReloadNavigation()) {
          const saved = Number(sessionStorage.getItem(RESTORE_KEY));
          if (Number.isFinite(saved) && saved > 0 && saved <= 1) {
            const previousScrollBehavior =
              document.documentElement.style.scrollBehavior;
            document.documentElement.style.scrollBehavior = "auto";
            window.scrollTo(
              0,
              trigger.start + saved * (trigger.end - trigger.start)
            );
            document.documentElement.style.scrollBehavior =
              previousScrollBehavior;
          }
        }

        ScrollTrigger.update();
        apply(trigger.progress);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      trigger.kill();
    };
  }, [containerRef, reducedMotion]);

  return { sceneStateRef, exploreSample };
}
