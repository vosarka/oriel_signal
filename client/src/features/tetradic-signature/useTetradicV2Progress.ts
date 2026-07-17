import { useLayoutEffect, type RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import { getTetradicV2State } from "./tetradic-signature-v2-config";

gsap.registerPlugin(ScrollTrigger);

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

export function useTetradicV2Progress(
  containerRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean
) {
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || reducedMotion) return;

    const playhead = { progress: 0 };
    const progressbar =
      container.querySelector<HTMLElement>("[data-v2-progress]");
    const apply = (progress: number) => {
      const state = getTetradicV2State(progress);
      container.style.setProperty("--v2-progress", state.progress.toFixed(5));
      CSS_STATE_KEYS.forEach(key =>
        container.style.setProperty(
          `--v2-${key.replace(/[A-Z]/g, letter => `-${letter.toLowerCase()}`)}`,
          state[key].toFixed(5)
        )
      );
      container.dataset.progress = state.progress.toFixed(4);
      container.dataset.scene = state.scene;
      progressbar?.setAttribute(
        "aria-valuenow",
        String(Math.round(state.progress * 100))
      );
      progressbar?.setAttribute(
        "aria-valuetext",
        state.scene.replaceAll("-", " ")
      );
    };

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
      onRefresh: self => apply(self.progress),
    });
    const restore = () => {
      trigger.refresh();
      apply(trigger.progress);
    };
    const restoreFrame = window.requestAnimationFrame(restore);
    window.addEventListener("pageshow", restore);

    return () => {
      window.cancelAnimationFrame(restoreFrame);
      window.removeEventListener("pageshow", restore);
      trigger.kill();
      animation.kill();
    };
  }, [containerRef, reducedMotion]);
}
