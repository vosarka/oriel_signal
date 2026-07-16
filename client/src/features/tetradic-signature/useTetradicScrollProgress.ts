import { useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

import {
  TETRADIC_REDUCED_MOTION_PROGRESS,
  clampProgress,
  getTetradicSceneState,
  type TetradicSceneState,
} from "./chapter-config";
import {
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_TIMELINE,
} from "./tetradic-signature-config";

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
  reducedMotion: boolean,
  compact: boolean,
  lenis?: Lenis
) {
  const sceneStateRef = useRef<TetradicSceneState>(
    getTetradicSceneState(reducedMotion ? TETRADIC_REDUCED_MOTION_PROGRESS : 0)
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const apply = (
      rawScrollProgress: number,
      explicitMasterProgress?: number
    ) => {
      const scrollProgress = clampProgress(rawScrollProgress);
      const masterProgress =
        explicitMasterProgress ??
        scrollProgress * TETRADIC_TIMELINE.checkpointEndProgress;
      const state = getTetradicSceneState(masterProgress);
      const tetradOne = state.tetradOne;
      const tetradTwo = state.tetradTwo;
      const tetradThree = state.tetradThree;
      const transitionOne = state.transitionOneToTwo;
      const transitionTwo = state.transitionTwoToThree;
      const celestial = Math.max(
        transitionTwo.celestialReveal,
        tetradThree.celestialReveal
      );
      const foldVeilIn = clampProgress((transitionTwo.foldDive - 0.03) / 0.19);
      const foldVeilOut =
        1 - clampProgress((transitionTwo.celestialReveal - 0.82) / 0.18);
      const foldVeil = foldVeilIn * foldVeilOut;
      sceneStateRef.current = state;

      container.dataset.progress = scrollProgress.toFixed(4);
      container.dataset.masterProgress = state.progress.toFixed(4);
      container.dataset.chapter = state.activeChapter;
      container.dataset.segment = state.activeSegment;
      container.dataset.coverOpen = state.coverOpen.toFixed(4);
      container.dataset.tetradProgress = tetradOne.progress.toFixed(4);
      container.style.setProperty("--ts-progress", scrollProgress.toFixed(4));
      container.style.setProperty("--ts-reveal", state.reveal.toFixed(4));
      container.style.setProperty("--ts-celestial", celestial.toFixed(4));
      container.style.setProperty(
        "--ts-fold-page",
        transitionTwo.pageTurn.toFixed(4)
      );
      container.style.setProperty(
        "--ts-fold-dive",
        transitionTwo.foldDive.toFixed(4)
      );
      container.style.setProperty("--ts-fold-veil", foldVeil.toFixed(4));
      container.style.setProperty(
        "--ts-fold-celestial",
        transitionTwo.celestialReveal.toFixed(4)
      );
      container.style.setProperty("--ts-cta", "0");
      container.style.setProperty(
        "--ts-narrative-cover",
        state.narrative.cover.toFixed(4)
      );
      container.style.setProperty(
        "--ts-t1-eyebrow",
        tetradOne.eyebrow.toFixed(4)
      );
      container.style.setProperty("--ts-t1-title", tetradOne.title.toFixed(4));
      container.style.setProperty(
        "--ts-t1-description",
        tetradOne.description.toFixed(4)
      );
      container.style.setProperty(
        "--ts-t1-withdrawal",
        tetradOne.withdrawal.toFixed(4)
      );
      container.style.setProperty(
        "--ts-transition-01-02",
        transitionOne.progress.toFixed(4)
      );
      container.style.setProperty("--ts-t2-title", tetradTwo.title.toFixed(4));
      container.style.setProperty(
        "--ts-t2-statement",
        tetradTwo.statement.toFixed(4)
      );
      container.style.setProperty(
        "--ts-t2-withdrawal",
        tetradTwo.withdrawal.toFixed(4)
      );
      container.style.setProperty(
        "--ts-transition-02-03",
        transitionTwo.progress.toFixed(4)
      );
      container.style.setProperty(
        "--ts-t3-title",
        tetradThree.title.toFixed(4)
      );
      container.style.setProperty(
        "--ts-t3-statement",
        tetradThree.statement.toFixed(4)
      );
    };

    if (reducedMotion) {
      container.dataset.reducedMotion = "true";
      apply(
        TETRADIC_REDUCED_MOTION_PROGRESS /
          TETRADIC_TIMELINE.checkpointEndProgress,
        TETRADIC_REDUCED_MOTION_PROGRESS
      );
      window.scrollTo({
        top: container.getBoundingClientRect().top + window.scrollY,
        behavior: "auto",
      });
      return;
    }

    delete container.dataset.reducedMotion;
    const viewport = container.querySelector<HTMLElement>(
      ".tetradic-signature__viewport"
    );
    if (!viewport) return;

    const playhead = { progress: 0 };
    const scrubTween = gsap.to(playhead, {
      progress: 1,
      paused: true,
      ease: "none",
      onUpdate: () => apply(playhead.progress),
    });

    const trigger = ScrollTrigger.create({
      trigger: container,
      animation: scrubTween,
      scrub: compact
        ? TETRADIC_SIGNATURE_CONFIG.animation.scroll.scrubCompact
        : TETRADIC_SIGNATURE_CONFIG.animation.scroll.scrubDesktop,
      pin: viewport,
      pinSpacing: false,
      anticipatePin: 1,
      start: "top top",
      end: "bottom bottom",
      invalidateOnRefresh: true,
      onUpdate: self => {
        sessionStorage.setItem(RESTORE_KEY, self.progress.toFixed(6));
      },
      onRefresh: self => {
        scrubTween.progress(self.progress);
        apply(self.progress);
      },
    });

    scrubTween.progress(trigger.progress);
    apply(trigger.progress);

    frame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();

      frame = window.requestAnimationFrame(() => {
        if (isReloadNavigation()) {
          const saved = Number(sessionStorage.getItem(RESTORE_KEY));
          if (Number.isFinite(saved) && saved > 0 && saved <= 1) {
            const target =
              trigger.start + saved * (trigger.end - trigger.start);
            if (lenis) {
              lenis.scrollTo(target, { immediate: true });
            } else {
              window.scrollTo({ top: target, behavior: "auto" });
            }
            scrubTween.progress(saved);
            apply(saved);
          }
        }

        ScrollTrigger.update();
        scrubTween.progress(trigger.progress);
        apply(trigger.progress);
      });
    });

    return () => {
      window.cancelAnimationFrame(frame);
      trigger.kill();
      scrubTween.kill();
    };
  }, [compact, containerRef, lenis, reducedMotion]);

  return { sceneStateRef };
}
