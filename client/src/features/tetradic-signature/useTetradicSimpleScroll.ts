import {
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  TETRADIC_SIMPLE_CHAPTERS,
  TETRADIC_SIMPLE_SCROLL,
} from "./tetradic-signature-simple-config";

gsap.registerPlugin(ScrollTrigger);

export type TetradicSimpleVisualState = Readonly<{
  currentIndex: number;
  incomingIndex: number;
  turning: boolean;
}>;

type TetradicSimpleScrollResult = Readonly<{
  visualState: TetradicSimpleVisualState;
  purchaseActive: boolean;
}>;

const INITIAL_VISUAL_STATE: TetradicSimpleVisualState = {
  currentIndex: 0,
  incomingIndex: 1,
  turning: false,
};

const CHAPTER_HOLD =
  TETRADIC_SIMPLE_SCROLL.chapterStableSvh /
  TETRADIC_SIMPLE_SCROLL.chapterSvh;

function clamp01(value: number) {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0));
}

function smoothstep(value: number) {
  const clamped = clamp01(value);
  return clamped * clamped * (3 - 2 * clamped);
}

function sameVisualState(
  left: TetradicSimpleVisualState,
  right: TetradicSimpleVisualState
) {
  return (
    left.currentIndex === right.currentIndex &&
    left.incomingIndex === right.incomingIndex &&
    left.turning === right.turning
  );
}

function waitForRenderableAssets(root: HTMLElement) {
  const fontReady = document.fonts?.ready ?? Promise.resolve();
  const imageReady = Array.from(
    root.querySelectorAll<HTMLImageElement>(".tetradic-simple__stage img")
  ).map(image => {
    if (image.complete) {
      return image.decode?.().catch(() => undefined) ?? Promise.resolve();
    }

    return new Promise<void>(resolve => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  });

  return Promise.all([fontReady, ...imageReady]);
}

export function useTetradicSimpleScroll(
  rootRef: RefObject<HTMLElement | null>
): TetradicSimpleScrollResult {
  const visualStateRef = useRef<TetradicSimpleVisualState>(
    INITIAL_VISUAL_STATE
  );
  const purchaseActiveRef = useRef(false);
  const [visualState, setVisualState] = useState(INITIAL_VISUAL_STATE);
  const [purchaseActive, setPurchaseActive] = useState(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = gsap.matchMedia();
    let disposed = false;
    let refreshFrame = 0;
    let assetsFrame = 0;
    let resizeFrame = 0;

    const commitVisualState = (next: TetradicSimpleVisualState) => {
      if (sameVisualState(visualStateRef.current, next)) return;
      visualStateRef.current = next;
      root.dataset.activeChapter = String(next.currentIndex + 1).padStart(2, "0");
      root.dataset.turning = String(next.turning);
      setVisualState(next);
    };

    const commitPurchase = (active: boolean) => {
      if (purchaseActiveRef.current === active) return;
      purchaseActiveRef.current = active;
      root.dataset.purchaseActive = String(active);
      setPurchaseActive(active);
    };

    const setTurnProgress = (rawProgress: number, reduce: boolean) => {
      const progress = smoothstep(rawProgress);
      const shadow = Math.sin(progress * Math.PI);
      gsap.set(root, {
        "--turn-angle": reduce ? "0deg" : `${-180 * progress}deg`,
        "--turn-shadow": reduce ? 0 : shadow,
        "--turn-highlight": reduce ? 0 : Math.sin(progress * Math.PI) * 0.72,
        "--turn-sheet-opacity":
          progress <= 0.001 || progress >= 0.999 ? 0 : 1,
        "--retained-left-opacity": 1 - smoothstep((progress - 0.78) / 0.22),
        "--page-crossfade": progress,
      });
    };

    const resetVisuals = (compact: boolean) => {
      gsap.set(root, {
        "--environment-opacity": 0.025,
        "--light-opacity": 0,
        "--book-opacity": 0,
        "--book-scale": compact ? 0.74 : 0.68,
        "--book-y": compact ? "10svh" : "9svh",
        "--book-tilt": compact ? "45deg" : "57deg",
        "--book-x": compact ? "0%" : "-25%",
        "--cover-angle": "0deg",
        "--cover-opacity": 1,
        "--interior-opacity": 0,
        "--conclusion-opacity": 0,
        "--progress-opacity": 0,
        "--purchase-opacity": 0,
        "--identity-opacity": 0.22,
        "--turn-angle": "0deg",
        "--turn-shadow": 0,
        "--turn-highlight": 0,
        "--turn-sheet-opacity": 0,
        "--retained-left-opacity": 1,
        "--page-crossfade": 0,
        "--artifact-dim": 0,
      });
    };

    media.add(
      {
        desktop: "(min-width: 701px)",
        compact: "(max-width: 700px)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      context => {
        const compact = Boolean(context.conditions?.compact);
        const reduce = Boolean(context.conditions?.reduce);
        const chapterSections = Array.from(
          root.querySelectorAll<HTMLElement>("[data-simple-chapter]")
        );
        const phase = (id: string) =>
          root.querySelector<HTMLElement>(`[data-simple-phase="${id}"]`);

        root.dataset.motionMode = reduce ? "reduced" : "full";
        root.dataset.viewportMode = compact ? "compact" : "desktop";
        resetVisuals(compact);
        commitVisualState(INITIAL_VISUAL_STATE);
        commitPurchase(false);

        const contextRoot = gsap.context(() => {
          const reveal = phase("reveal");
          if (reveal) {
            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: reveal,
                  start: "top top",
                  end: "bottom top",
                  scrub: reduce ? true : TETRADIC_SIMPLE_SCROLL.scrub,
                  invalidateOnRefresh: true,
                  onToggle: self => {
                    if (self.isActive) root.dataset.activePhase = "reveal";
                  },
                },
              })
              .to(root, {
                "--environment-opacity": reduce ? 0.8 : 0.22,
                duration: 0.18,
              })
              .to(root, {
                "--environment-opacity": 0.88,
                "--light-opacity": 0.72,
                "--book-opacity": 1,
                "--identity-opacity": 0.78,
                duration: 0.38,
              })
              .to(root, {
                "--book-scale": compact ? 0.8 : 0.76,
                "--light-opacity": 0.82,
                duration: 0.18,
              })
              .to(root, { duration: 0.26 });
          }

          const opening = phase("opening");
          if (opening) {
            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: opening,
                  start: "top top",
                  end: "bottom top",
                  scrub: reduce ? true : TETRADIC_SIMPLE_SCROLL.scrub,
                  invalidateOnRefresh: true,
                  onToggle: self => {
                    if (self.isActive) root.dataset.activePhase = "opening";
                  },
                },
              })
              .to(root, {
                "--book-scale": compact ? 0.87 : 0.84,
                "--book-y": compact ? "6svh" : "5svh",
                duration: 0.22,
              })
              .to(root, {
                "--book-y": compact ? "1.5svh" : "0svh",
                "--book-tilt": compact ? "36deg" : "44deg",
                duration: 0.18,
              })
              .to(root, {
                "--cover-angle": reduce ? "0deg" : compact ? "-168deg" : "-178deg",
                "--cover-opacity": reduce ? 0 : 1,
                "--book-x": "0%",
                duration: 0.34,
              })
              .to(root, {
                "--interior-opacity": 1,
                "--book-scale": compact ? 0.98 : 1.02,
                "--book-tilt": compact ? "0deg" : "11deg",
                "--book-y": compact ? "1svh" : "0svh",
                "--progress-opacity": 0.78,
                duration: 0.2,
              })
              .to(root, { "--cover-opacity": 0, duration: 0.06 });
          }

          const applyChapterProgress = (index: number, rawProgress: number) => {
            const progress = clamp01(rawProgress);
            const isLast = index === TETRADIC_SIMPLE_CHAPTERS.length - 1;
            root.dataset.activePhase = `tetrad-${String(index + 1).padStart(2, "0")}`;

            if (isLast) {
              commitVisualState({
                currentIndex: index,
                incomingIndex: index,
                turning: false,
              });
              setTurnProgress(0, reduce);
              const conclusionProgress = smoothstep(
                (progress - CHAPTER_HOLD) / (1 - CHAPTER_HOLD)
              );
              gsap.set(root, {
                "--conclusion-opacity": conclusionProgress,
                "--interior-opacity": 1 - conclusionProgress * 0.78,
                "--progress-opacity": 0.78 * (1 - conclusionProgress),
              });
              return;
            }

            gsap.set(root, {
              "--interior-opacity": 1,
              "--conclusion-opacity": 0,
              "--progress-opacity": 0.78,
            });
            const turnProgress = clamp01(
              (progress - CHAPTER_HOLD) / (1 - CHAPTER_HOLD)
            );
            setTurnProgress(turnProgress, reduce);
            commitVisualState({
              currentIndex: turnProgress >= 0.999 ? index + 1 : index,
              incomingIndex: index + 1,
              turning: turnProgress > 0.001 && turnProgress < 0.999,
            });
          };

          chapterSections.forEach((section, index) => {
            ScrollTrigger.create({
              trigger: section,
              start: "top top",
              end: "bottom top",
              invalidateOnRefresh: true,
              onToggle: self => {
                if (self.isActive) {
                  root.dataset.activePhase = `tetrad-${String(index + 1).padStart(2, "0")}`;
                }
              },
              onUpdate: self => {
                if (!self.isActive) return;
                applyChapterProgress(index, self.progress);
              },
              onEnter: self => applyChapterProgress(index, self.progress),
              onEnterBack: self => applyChapterProgress(index, self.progress),
              onRefresh: self => {
                if (self.isActive) applyChapterProgress(index, self.progress);
              },
              onLeave: () => {
                if (index < 11) {
                  setTurnProgress(1, reduce);
                  commitVisualState({
                    currentIndex: index + 1,
                    incomingIndex: Math.min(index + 2, 11),
                    turning: false,
                  });
                }
              },
              onLeaveBack: () => {
                applyChapterProgress(index, 0);
              },
            });
          });

          const closing = phase("closing");
          if (closing) {
            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: closing,
                  start: "top top",
                  end: "bottom top",
                  scrub: reduce ? true : TETRADIC_SIMPLE_SCROLL.scrub,
                  invalidateOnRefresh: true,
                  onEnter: () => commitPurchase(false),
                  onEnterBack: () => commitPurchase(false),
                  onToggle: self => {
                    if (self.isActive) root.dataset.activePhase = "closing";
                  },
                },
              })
              .to(root, { duration: 0.16 })
              .to(root, {
                "--conclusion-opacity": 0,
                "--interior-opacity": 0.84,
                duration: 0.14,
              })
              .to(root, {
                "--book-scale": compact ? 0.88 : 0.84,
                "--book-tilt": compact ? "28deg" : "38deg",
                "--book-y": compact ? "4svh" : "3svh",
                "--interior-opacity": 0.28,
                "--cover-opacity": 1,
                duration: 0.2,
              })
              .to(root, {
                "--cover-angle": "0deg",
                "--cover-opacity": 1,
                "--book-x": compact ? "0%" : "-25%",
                "--interior-opacity": 0,
                duration: 0.3,
              })
              .to(root, {
                "--book-scale": compact ? 0.77 : 0.73,
                "--book-tilt": compact ? "45deg" : "57deg",
                "--book-y": compact ? "9svh" : "8svh",
                "--progress-opacity": 0,
                duration: 0.14,
              })
              .to(root, { duration: 0.06 });
          }

          const purchase = phase("purchase");
          if (purchase) {
            gsap
              .timeline({
                defaults: { ease: "none" },
                scrollTrigger: {
                  trigger: purchase,
                  start: "top top",
                  end: "bottom top",
                  scrub: reduce ? true : TETRADIC_SIMPLE_SCROLL.scrub,
                  invalidateOnRefresh: true,
                  onUpdate: self => commitPurchase(self.progress > 0.08),
                  onEnter: () => {
                    root.dataset.activePhase = "purchase";
                  },
                  onEnterBack: () => {
                    root.dataset.activePhase = "purchase";
                  },
                  onLeaveBack: () => commitPurchase(false),
                },
              })
              .to(root, { duration: 0.08 })
              .to(root, {
                "--artifact-dim": 0.46,
                "--purchase-opacity": 1,
                "--book-scale": compact ? 0.71 : 0.67,
                duration: 0.42,
              })
              .to(root, { duration: 0.5 });
          }
        }, root);

        return () => contextRoot.revert();
      }
    );

    const refresh = () => {
      if (disposed) return;
      ScrollTrigger.refresh();
      ScrollTrigger.update();
    };

    const scheduleRefresh = () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(refresh);
    };

    const onPageShow = () => scheduleRefresh();
    window.addEventListener("resize", scheduleRefresh, { passive: true });
    window.addEventListener("orientationchange", scheduleRefresh, {
      passive: true,
    });
    window.addEventListener("pageshow", onPageShow, { passive: true });

    refreshFrame = window.requestAnimationFrame(refresh);
    void waitForRenderableAssets(root).then(() => {
      if (disposed) return;
      assetsFrame = window.requestAnimationFrame(refresh);
    });

    return () => {
      disposed = true;
      window.cancelAnimationFrame(refreshFrame);
      window.cancelAnimationFrame(assetsFrame);
      window.cancelAnimationFrame(resizeFrame);
      window.removeEventListener("resize", scheduleRefresh);
      window.removeEventListener("orientationchange", scheduleRefresh);
      window.removeEventListener("pageshow", onPageShow);
      media.revert();
    };
  }, [rootRef]);

  return { visualState, purchaseActive };
}
