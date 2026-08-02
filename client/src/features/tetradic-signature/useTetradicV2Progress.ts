import { useCallback, useLayoutEffect, useRef, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";

import { TETRADIC_RESTORE_KEY } from "./useTetradicScrollProgress";
import {
  TETRADIC_V2_TIMELINE,
  getTetradicV2MasterState,
} from "./tetradic-signature-v2-config";

gsap.registerPlugin(ScrollTrigger);

function isReloadNavigation() {
  const navigation = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined;
  return navigation?.type === "reload";
}

const CSS_STATE_KEYS = [
  "environment",
  "artifact",
  "coverRecognition",
  "coverLock",
  "coverCopy",
  "archive",
  "archiveSeal",
  "archiveBlade",
  "tetradOne",
  "tetradOneDetail",
  "tetradOneTitle",
  "tetradOneStatement",
  "transition",
  "tetradTwo",
  "telemetry",
] as const;

const SCENE_BEAT_KEYS = [
  "title",
  "statement",
  "visual",
  "inspection",
  "exit",
  "transition",
] as const;

export function useTetradicV2Progress(
  containerRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean,
  lenis?: Lenis
) {
  const restartRef = useRef<() => void>(() => undefined);
  const restart = useCallback(() => restartRef.current(), []);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    if (reducedMotion) {
      restartRef.current = () => {
        sessionStorage.removeItem(TETRADIC_RESTORE_KEY);
        const scroller = document.scrollingElement;
        if (scroller) scroller.scrollTop = container.offsetTop;
        container.focus({ preventScroll: true });
      };
      return () => {
        restartRef.current = () => undefined;
      };
    }

    const playhead = { progress: 0 };
    const progressbar =
      container.querySelector<HTMLElement>("[data-v2-progress]");
    const chapterNumber = container.querySelector<HTMLElement>(
      "[data-v2-chapter-number]"
    );
    const finalActions = container.querySelector<HTMLElement>(
      "[data-v2-final-actions]"
    );
    const chapterElements = Array.from(
      container.querySelectorAll<HTMLElement>("[data-v2-chapter]")
    );
    const apply = (progress: number) => {
      const state = getTetradicV2MasterState(progress);
      const foundation = state.foundation;
      const active = state.chapters.find(chapter => chapter.active);
      container.style.setProperty(
        "--v2-master-progress",
        state.progress.toFixed(5)
      );
      container.style.setProperty(
        "--v2-foundation-live",
        state.positionSvh < TETRADIC_V2_TIMELINE.travelSvh ? "1" : "0"
      );
      container.style.setProperty(
        "--v2-progress",
        foundation.progress.toFixed(5)
      );
      CSS_STATE_KEYS.forEach(key =>
        container.style.setProperty(
          `--v2-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
          (key === "tetradTwo" &&
          state.positionSvh >= TETRADIC_V2_TIMELINE.travelSvh
            ? 0
            : foundation[key]
          ).toFixed(5)
        )
      );
      container.style.setProperty(
        "--v2-scene-local",
        (active?.local ?? 0).toFixed(5)
      );
      container.style.setProperty(
        "--v2-scene-presence",
        (active?.presence ?? 0).toFixed(5)
      );
      SCENE_BEAT_KEYS.forEach(key =>
        container.style.setProperty(
          `--v2-scene-${key}`,
          (active?.beats[key] ?? 0).toFixed(5)
        )
      );
      active?.beats.motion.forEach((value, index) =>
        container.style.setProperty(
          `--v2-scene-motion-${index + 1}`,
          value.toFixed(5)
        )
      );
      if (!active) {
        for (let index = 1; index <= 4; index += 1) {
          container.style.setProperty(`--v2-scene-motion-${index}`, "0");
        }
      }
      container.style.setProperty("--v2-synthesis", state.synthesis.toFixed(5));
      container.style.setProperty(
        "--v2-synthesis-copy",
        state.synthesisCopy.toFixed(5)
      );
      container.style.setProperty("--v2-cta", state.cta.toFixed(5));
      container.style.setProperty("--v2-cta-copy", state.ctaCopy.toFixed(5));
      const actionsVisible = state.ctaCopy > 0.5;
      if (finalActions) {
        finalActions.inert = !actionsVisible;
        finalActions.setAttribute("aria-hidden", String(!actionsVisible));
      }

      chapterElements.forEach(element => {
        const number = Number(element.dataset.v2Chapter);
        const chapterState = state.chapters.find(
          chapter => chapter.number === number
        );
        const foundationLive =
          state.positionSvh < TETRADIC_V2_TIMELINE.travelSvh;

        if (foundationLive) {
          element.style.removeProperty("--v2-scene-local");
          element.style.removeProperty("--v2-scene-presence");
          SCENE_BEAT_KEYS.forEach(key =>
            element.style.removeProperty(`--v2-scene-${key}`)
          );
          for (let index = 1; index <= 4; index += 1) {
            element.style.removeProperty(`--v2-scene-motion-${index}`);
          }
        } else if (chapterState) {
          element.style.setProperty(
            "--v2-scene-local",
            chapterState.local.toFixed(5)
          );
          element.style.setProperty(
            "--v2-scene-presence",
            chapterState.presence.toFixed(5)
          );
          SCENE_BEAT_KEYS.forEach(key =>
            element.style.setProperty(
              `--v2-scene-${key}`,
              chapterState.beats[key].toFixed(5)
            )
          );
          chapterState.beats.motion.forEach((value, index) =>
            element.style.setProperty(
              `--v2-scene-motion-${index + 1}`,
              value.toFixed(5)
            )
          );
        }
        element.classList.toggle("is-active", number === state.activeChapter);
        element.classList.toggle(
          "is-incoming",
          number === state.incomingChapter
        );
      });
      container.dataset.progress = state.progress.toFixed(4);
      container.dataset.foundationProgress = foundation.progress.toFixed(4);
      container.dataset.scene = state.segmentId;
      container.dataset.activeChapter = String(state.activeChapter ?? "none");
      container.dataset.incomingChapter = String(
        state.incomingChapter ?? "none"
      );
      container.dataset.synthesisActive = String(state.synthesis > 0);
      container.dataset.ctaActive = String(state.cta > 0);
      if (chapterNumber && state.activeChapter) {
        chapterNumber.textContent = String(state.activeChapter).padStart(
          2,
          "0"
        );
      }
      progressbar?.setAttribute(
        "aria-valuenow",
        String(Math.round(state.progress * 100))
      );
      progressbar?.setAttribute(
        "aria-valuetext",
        state.segmentId.replaceAll("-", " ")
      );
    };

    const reloadProgress = isReloadNavigation()
      ? Number(sessionStorage.getItem(TETRADIC_RESTORE_KEY))
      : Number.NaN;
    let restoringReload =
      Number.isFinite(reloadProgress) &&
      reloadProgress > 0 &&
      reloadProgress <= 1;
    apply(restoringReload ? reloadProgress : 0);
    const animation = gsap.to(playhead, {
      progress: 1,
      paused: true,
      ease: "none",
      onUpdate: () => apply(playhead.progress),
    });
    const trigger = ScrollTrigger.create({
      trigger: container,
      start: "top top",
      end: "bottom bottom",
      animation,
      scrub: true,
      invalidateOnRefresh: true,
      onUpdate: self => {
        if (!restoringReload) {
          sessionStorage.setItem(
            TETRADIC_RESTORE_KEY,
            self.progress.toFixed(6)
          );
        }
      },
      onRefresh: self =>
        apply(restoringReload ? reloadProgress : self.progress),
    });
    restartRef.current = () => {
      sessionStorage.removeItem(TETRADIC_RESTORE_KEY);
      if (lenis) {
        lenis.scrollTo(trigger.start, { immediate: true });
      } else {
        window.scrollTo({ top: trigger.start, behavior: "auto" });
      }
      animation.progress(0);
      apply(0);
      container.focus({ preventScroll: true });
      ScrollTrigger.update();
    };

    let restoreFrame = window.requestAnimationFrame(() => {
      ScrollTrigger.refresh();
      restoreFrame = window.requestAnimationFrame(() => {
        if (restoringReload) {
          const target =
            trigger.start + reloadProgress * (trigger.end - trigger.start);
          if (lenis) {
            lenis.scrollTo(target, { immediate: true });
          } else {
            window.scrollTo({ top: target, behavior: "auto" });
          }
          animation.progress(reloadProgress);
          apply(reloadProgress);
          restoringReload = false;
          sessionStorage.setItem(
            TETRADIC_RESTORE_KEY,
            reloadProgress.toFixed(6)
          );
        } else {
          animation.progress(trigger.progress);
          apply(trigger.progress);
        }
        ScrollTrigger.update();
      });
    });
    const handlePageShow = (event: PageTransitionEvent) => {
      if (!event.persisted) return;
      ScrollTrigger.refresh();
      animation.progress(trigger.progress);
      apply(trigger.progress);
    };
    window.addEventListener("pageshow", handlePageShow);

    return () => {
      window.cancelAnimationFrame(restoreFrame);
      window.removeEventListener("pageshow", handlePageShow);
      trigger.kill();
      animation.kill();
      restartRef.current = () => undefined;
    };
  }, [containerRef, lenis, reducedMotion]);

  return { restart };
}
