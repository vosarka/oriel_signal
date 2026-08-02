import { useCallback, useEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import LenisSnap from "lenis/snap";

import {
  TETRADIC_REDUCED_MOTION_PROGRESS,
  clampProgress,
  getTetradicSceneState,
  type TetradicSceneState,
} from "./chapter-config";
import { TETRADIC_SIGNATURE_CONFIG } from "./tetradic-signature-config";

gsap.registerPlugin(ScrollTrigger);

export const TETRADIC_RESTORE_KEY = "oriel:tetradic-signature:progress:v2";

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
  const restartRef = useRef<() => void>(() => undefined);
  const seekRef = useRef<(progress: number) => void>(() => undefined);
  const restart = useCallback(() => restartRef.current(), []);
  const seekToProgress = useCallback(
    (progress: number) => seekRef.current(clampProgress(progress)),
    []
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let frame = 0;
    const apply = (rawScrollProgress: number) => {
      const scrollProgress = clampProgress(rawScrollProgress);
      const state = getTetradicSceneState(scrollProgress);
      const tetradOne = state.tetradOne;
      const tetradTwo = state.tetradTwo;
      const tetradThree = state.tetradThree;
      const transitionOne = state.transitionOneToTwo;
      const transitionTwo = state.transitionTwoToThree;
      const celestial =
        Math.max(transitionTwo.celestialReveal, tetradThree.celestialReveal) *
        (1 - state.laterTransitions[0].visualTransform);
      const foldVeilIn = clampProgress((transitionTwo.foldDive - 0.03) / 0.19);
      const foldVeilOut =
        1 - clampProgress((transitionTwo.celestialReveal - 0.82) / 0.18);
      const foldVeil = foldVeilIn * foldVeilOut;
      sceneStateRef.current = state;

      container.dataset.progress = scrollProgress.toFixed(4);
      container.dataset.masterProgress = state.progress.toFixed(4);
      container.dataset.chapter = state.activeChapter;
      container.dataset.segment = state.activeSegment;
      container.dataset.activeTetrad = String(state.activeTetrad);
      container.dataset.visibleSpread = String(state.visibleSpread);
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
      container.style.setProperty("--ts-cta", state.cta.toFixed(4));
      container.style.setProperty(
        "--ts-synthesis",
        state.closure.synthesis.toFixed(4)
      );
      container.style.setProperty(
        "--ts-synthesis-title",
        state.closure.title.toFixed(4)
      );
      container.style.setProperty(
        "--ts-book-close",
        state.closure.bookClose.toFixed(4)
      );
      container.style.setProperty("--ts-halo", state.closure.halo.toFixed(4));
      container.style.setProperty(
        "--ts-markers",
        state.closure.markers.toFixed(4)
      );
      container.style.setProperty(
        "--ts-narrative-cover",
        state.narrative.cover.toFixed(4)
      );
      container.style.setProperty(
        "--ts-narrative-cta",
        state.narrative.cta.toFixed(4)
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
      container.style.setProperty(
        "--ts-t3-withdrawal",
        tetradThree.withdrawal.toFixed(4)
      );

      const chapterValues = [
        {
          title: tetradOne.title,
          statement: tetradOne.description,
          withdrawal: tetradOne.withdrawal,
        },
        {
          title: tetradTwo.title,
          statement: tetradTwo.statement,
          withdrawal: tetradTwo.withdrawal,
        },
        {
          title: tetradThree.title,
          statement: tetradThree.statement,
          withdrawal: tetradThree.withdrawal,
        },
        ...state.laterChapters.map((chapter, index) => ({
          title:
            index === state.laterChapters.length - 1
              ? chapter.title *
                (1 - Math.max(state.closure.title, state.closure.bookClose))
              : chapter.title,
          statement:
            chapter.statement *
            (1 - Math.max(state.closure.synthesis, state.closure.bookClose)),
          withdrawal: chapter.withdrawal,
        })),
      ];
      chapterValues.forEach((chapter, index) => {
        const number = String(index + 1).padStart(2, "0");
        container.style.setProperty(
          `--ts-t${number}-title`,
          chapter.title.toFixed(4)
        );
        container.style.setProperty(
          `--ts-t${number}-statement`,
          chapter.statement.toFixed(4)
        );
        container.style.setProperty(
          `--ts-t${number}-withdrawal`,
          chapter.withdrawal.toFixed(4)
        );
      });
      state.laterChapters.forEach(chapter => {
        const number = String(chapter.number).padStart(2, "0");
        container.style.setProperty(
          `--t${number}-visual`,
          chapter.visual.toFixed(4)
        );
        container.style.setProperty(
          `--t${number}-inspection`,
          chapter.inspection.toFixed(4)
        );
        chapter.motion.phases.forEach((phase, index) => {
          container.style.setProperty(
            `--t${number}-phase-${index + 1}`,
            phase.toFixed(4)
          );
        });
        container.style.setProperty(
          `--t${number}-camera`,
          chapter.motion.cameraTravel.toFixed(4)
        );
        container.style.setProperty(
          `--t${number}-path`,
          chapter.motion.path.toFixed(4)
        );
        container.style.setProperty(
          `--t${number}-breath`,
          chapter.motion.breath.toFixed(4)
        );
        container.style.setProperty(
          `--t${number}-imprint`,
          chapter.motion.imprint.toFixed(4)
        );
      });

      const finalCta = container.querySelector<HTMLElement>("[data-final-cta]");
      const ctaActive = reducedMotion || state.cta > 0.02;
      finalCta?.toggleAttribute("inert", !ctaActive);
      finalCta?.setAttribute("aria-hidden", String(!ctaActive));

      const progressbar = container.querySelector<HTMLElement>(
        "[data-tetradic-progressbar]"
      );
      progressbar?.setAttribute("aria-valuenow", String(state.activeTetrad));
      progressbar?.setAttribute(
        "aria-valuetext",
        `Tetrad ${String(state.activeTetrad).padStart(2, "0")} of 12`
      );
      container
        .querySelectorAll<HTMLElement>("[data-chapter-dot]")
        .forEach(marker => {
          const active =
            marker.dataset.chapterDot === String(state.activeTetrad);
          if (active) marker.setAttribute("aria-current", "step");
          else marker.removeAttribute("aria-current");
        });
    };

    if (reducedMotion) {
      container.dataset.reducedMotion = "true";
      apply(TETRADIC_REDUCED_MOTION_PROGRESS);
      window.scrollTo({
        top: container.getBoundingClientRect().top + window.scrollY,
        behavior: "auto",
      });
      restartRef.current = () => {
        sessionStorage.removeItem(TETRADIC_RESTORE_KEY);
        window.scrollTo({
          top: container.getBoundingClientRect().top + window.scrollY,
          behavior: "auto",
        });
        container.focus({ preventScroll: true });
      };
      seekRef.current = () => undefined;
      return;
    }

    delete container.dataset.reducedMotion;
    const viewport = container.querySelector<HTMLElement>(
      ".tetradic-signature__viewport"
    );
    if (!viewport) return;

    const playhead = { progress: 0 };
    const reloadProgress = isReloadNavigation()
      ? Number(sessionStorage.getItem(TETRADIC_RESTORE_KEY))
      : Number.NaN;
    let restoringReload =
      Number.isFinite(reloadProgress) &&
      reloadProgress > 0 &&
      reloadProgress <= 1;
    const scrubTween = gsap.to(playhead, {
      progress: 1,
      paused: true,
      ease: "none",
      onUpdate: () => apply(playhead.progress),
    });
    const snap = lenis
      ? new LenisSnap(lenis, {
          type: "proximity",
          duration: compact ? 0.36 : 0.48,
          distanceThreshold: "8%",
          debounce: 320,
        })
      : undefined;
    let removeSnapPoints: Array<() => void> = [];
    const rebuildSnapPoints = (start: number, end: number) => {
      removeSnapPoints.forEach(remove => remove());
      removeSnapPoints = snap
        ? TETRADIC_SIGNATURE_CONFIG.animation.laterMotion.flatMap(motion => {
            if (motion.snapStates.length === 0) return [];
            const chapter =
              TETRADIC_SIGNATURE_CONFIG.animation.choreography.find(
                item => item.number === motion.number
              );
            if (!chapter) return [];
            return motion.snapStates.map(localProgress => {
              const progress =
                chapter.core.start +
                (chapter.core.end - chapter.core.start) * localProgress;
              return snap.add(start + progress * (end - start));
            });
          })
        : [];
    };

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
        if (!restoringReload) {
          sessionStorage.setItem(
            TETRADIC_RESTORE_KEY,
            self.progress.toFixed(6)
          );
        }
      },
      onRefresh: self => {
        scrubTween.progress(self.progress);
        apply(self.progress);
        rebuildSnapPoints(self.start, self.end);
      },
    });

    scrubTween.progress(trigger.progress);
    apply(trigger.progress);
    rebuildSnapPoints(trigger.start, trigger.end);
    restartRef.current = () => {
      sessionStorage.removeItem(TETRADIC_RESTORE_KEY);
      if (lenis) {
        lenis.scrollTo(trigger.start, { immediate: true });
      } else {
        window.scrollTo({ top: trigger.start, behavior: "auto" });
      }
      scrubTween.progress(0);
      apply(0);
      container.focus({ preventScroll: true });
      ScrollTrigger.update();
    };
    seekRef.current = progress => {
      const target = trigger.start + progress * (trigger.end - trigger.start);
      if (lenis) {
        lenis.scrollTo(target, { duration: compact ? 0.75 : 1.05 });
      } else {
        window.scrollTo({ top: target, behavior: "smooth" });
      }
    };

    frame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();

      frame = window.requestAnimationFrame(() => {
        if (restoringReload) {
          const saved = reloadProgress;
          if (Number.isFinite(saved)) {
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
          restoringReload = false;
          sessionStorage.setItem(TETRADIC_RESTORE_KEY, saved.toFixed(6));
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
      removeSnapPoints.forEach(remove => remove());
      snap?.destroy();
      restartRef.current = () => undefined;
      seekRef.current = () => undefined;
    };
  }, [compact, containerRef, lenis, reducedMotion]);

  return { sceneStateRef, restart, seekToProgress };
}
