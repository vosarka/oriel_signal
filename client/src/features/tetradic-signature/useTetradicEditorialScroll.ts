import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type RefObject,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  TETRADIC_CHAPTER_SCROLL,
  TETRADIC_SCROLL_SCRUB,
} from "./tetradic-signature-scroll-config";

gsap.registerPlugin(ScrollTrigger);

export type TetradicInteriorState = Readonly<{
  baseIndex: number;
  incomingIndex: number;
  turning: boolean;
}>;

type EditorialScrollResult = Readonly<{
  interiorState: TetradicInteriorState;
  purchaseActive: boolean;
  replayFromFirstSpread: () => void;
}>;

const INITIAL_INTERIOR_STATE: TetradicInteriorState = {
  baseIndex: 0,
  incomingIndex: 1,
  turning: false,
};

const CHAPTER_HOLD_PROGRESS =
  TETRADIC_CHAPTER_SCROLL.stableVh / TETRADIC_CHAPTER_SCROLL.sectionVh;

function sameInteriorState(
  left: TetradicInteriorState,
  right: TetradicInteriorState
) {
  return (
    left.baseIndex === right.baseIndex &&
    left.incomingIndex === right.incomingIndex &&
    left.turning === right.turning
  );
}

function waitForRenderableAssets(root: HTMLElement) {
  const fontReady = document.fonts?.ready ?? Promise.resolve();
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  const imagesReady = images.map(image => {
    if (image.complete) {
      return image.decode?.().catch(() => undefined) ?? Promise.resolve();
    }

    return new Promise<void>(resolve => {
      image.addEventListener("load", () => resolve(), { once: true });
      image.addEventListener("error", () => resolve(), { once: true });
    });
  });

  return Promise.all([fontReady, ...imagesReady]);
}

export function useTetradicEditorialScroll(
  rootRef: RefObject<HTMLElement | null>,
  reducedMotion: boolean
): EditorialScrollResult {
  const interiorStateRef = useRef<TetradicInteriorState>(
    INITIAL_INTERIOR_STATE
  );
  const purchaseActiveRef = useRef(false);
  const replayRef = useRef<() => void>(() => undefined);
  const [interiorState, setInteriorState] = useState<TetradicInteriorState>(
    INITIAL_INTERIOR_STATE
  );
  const [purchaseActive, setPurchaseActive] = useState(false);

  const replayFromFirstSpread = useCallback(() => replayRef.current(), []);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const media = gsap.matchMedia();
    let disposed = false;
    let resizeFrame = 0;
    let initialRefreshFrame = 0;
    let assetsRefreshFrame = 0;
    let reconstructTimelineState: () => void = () => undefined;

    const commitInteriorState = (nextState: TetradicInteriorState) => {
      if (sameInteriorState(interiorStateRef.current, nextState)) return;
      interiorStateRef.current = nextState;
      root.dataset.activeChapter = String(nextState.baseIndex + 1);
      root.dataset.turning = String(nextState.turning);
      setInteriorState(nextState);
    };

    const commitPurchaseActive = (active: boolean) => {
      if (purchaseActiveRef.current === active) return;
      purchaseActiveRef.current = active;
      root.dataset.purchaseActive = String(active);
      setPurchaseActive(active);
    };

    const phaseElements = new Map(
      Array.from(root.querySelectorAll<HTMLElement>("[data-scroll-phase]")).map(
        element => [element.dataset.scrollPhase, element] as const
      )
    );
    const chapterElements = Array.from(
      root.querySelectorAll<HTMLElement>("[data-tetrad-section]")
    );
    const phaseElement = (id: string) => phaseElements.get(id);
    const chapterElement = (index: number) => chapterElements[index];

    const updateActivePhase = (id: string, self: ScrollTrigger) => {
      if (self.isActive || (id === "purchase" && self.progress >= 1)) {
        root.dataset.activePhase = id;
      }
    };

    const scrollTriggerFor = (
      trigger: HTMLElement,
      id: string,
      onRefresh?: (self: ScrollTrigger) => void
    ) => ({
      trigger,
      start: "top top",
      end: "bottom top",
      scrub: TETRADIC_SCROLL_SCRUB,
      invalidateOnRefresh: true,
      onToggle: (self: ScrollTrigger) => updateActivePhase(id, self),
      onRefresh: (self: ScrollTrigger) => {
        onRefresh?.(self);
      },
    });

    const refreshAndReconstruct = () => {
      ScrollTrigger.refresh();
      ScrollTrigger.update();
      reconstructTimelineState();
    };

    media.add(
      {
        desktop: "(min-width: 901px) and (orientation: landscape)",
        compact: "(max-width: 900px), (orientation: portrait)",
        reduce: "(prefers-reduced-motion: reduce)",
      },
      context => {
        const compact = Boolean(context.conditions?.compact);
        const reduce = Boolean(context.conditions?.reduce) || reducedMotion;
        const registeredTimelines: gsap.core.Timeline[] = [];
        const registerTimeline = (timeline: gsap.core.Timeline) => {
          registeredTimelines.push(timeline);
          return timeline;
        };
        const initialBookScale = compact ? 0.56 : 0.64;
        const closedBookScale = compact ? 0.62 : 0.72;
        const openBookScale = compact ? 0.8 : 0.98;
        const readingTilt = compact ? 22 : 12;
        const purchaseBookX = compact ? "50%" : "36%";
        const resetVisualState = () => {
          gsap.set(root, {
            "--artifact-layer-opacity": 1,
            "--artifact-opacity": 0,
            "--environment-opacity": 0.04,
            "--book-stage-x": "50%",
            "--book-open": 0,
            "--book-shift": "-75%",
            "--book-scale": initialBookScale,
            "--book-tilt": "59deg",
            "--book-y": "9vh",
            "--cover-angle": "0deg",
            "--identity-opacity": 0,
            "--cue-opacity": 0,
            "--interior-opacity": 0,
            "--interior-scale": compact ? 0.9 : 0.82,
            "--synthesis-opacity": 0,
            "--purchase-opacity": 0,
            "--turn-progress": 0,
            "--turn-angle": "0deg",
            "--turn-shadow": 0,
            "--spread-opacity": 1,
          });
        };
        const syncChapterState = (
          index: number,
          timelineProgress: number
        ) => {
          if (index === 11) {
            commitInteriorState({
              baseIndex: 11,
              incomingIndex: 11,
              turning: false,
            });
            return;
          }

          if (timelineProgress < CHAPTER_HOLD_PROGRESS) {
            commitInteriorState({
              baseIndex: index,
              incomingIndex: index + 1,
              turning: false,
            });
            return;
          }

          const turnProgress = Math.min(
            1,
            Math.max(
              0,
              (timelineProgress - CHAPTER_HOLD_PROGRESS) /
                (1 - CHAPTER_HOLD_PROGRESS)
            )
          );
          commitInteriorState({
            baseIndex: turnProgress < 0.5 ? index : index + 1,
            incomingIndex: index + 1,
            turning: turnProgress > 0.001 && turnProgress < 0.999,
          });
        };
        const contextRoot = gsap.context(() => {
          root.dataset.motionMode = reduce ? "reduced" : "full";
          resetVisualState();
          commitInteriorState(INITIAL_INTERIOR_STATE);
          commitPurchaseActive(false);

          const revealTrigger = phaseElement("reveal");
          if (revealTrigger) {
            registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(revealTrigger, "reveal"),
              })
            )
              .to(root, {
                "--environment-opacity": 0.68,
                duration: 0.72,
              })
              .to(
                root,
                {
                  "--artifact-opacity": 1,
                  "--identity-opacity": 0.74,
                  "--book-scale": compact ? 0.59 : 0.68,
                  "--book-y": "8vh",
                  duration: 0.62,
                },
                0.24
              )
              .to(root, { "--cue-opacity": 1, duration: 0.14 }, 0.86);
          }

          const holdTrigger = phaseElement("closed-book");
          if (holdTrigger) {
            registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(holdTrigger, "closed-book"),
              })
            )
              .fromTo(
                root,
                {
                  "--environment-opacity": 0.68,
                  "--book-scale": compact ? 0.59 : 0.68,
                  "--book-tilt": "59deg",
                },
                {
                  "--environment-opacity": 1,
                  "--book-scale": closedBookScale,
                  "--book-tilt": compact ? "57deg" : "55deg",
                  duration: 1,
                  immediateRender: false,
                }
              );
          }

          const openingTrigger = phaseElement("book-opening");
          if (openingTrigger) {
            const hold = { progress: 0 };
            const openingTimeline = registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(
                  openingTrigger,
                  "book-opening"
                ),
              })
            );

            openingTimeline
              .fromTo(
                root,
                {
                  "--book-scale": closedBookScale,
                  "--book-tilt": compact ? "57deg" : "55deg",
                  "--book-y": "8vh",
                  "--cover-angle": "0deg",
                  "--book-open": 0,
                  "--book-shift": "-75%",
                },
                {
                  "--book-scale": compact ? 0.66 : 0.78,
                  "--book-tilt": compact ? "54deg" : "50deg",
                  duration: 0.18,
                  immediateRender: false,
                },
                0
              )
              .to(
                root,
                {
                  "--book-y": "3vh",
                  "--book-scale": compact ? 0.69 : 0.81,
                  "--cue-opacity": 0,
                  "--identity-opacity": 0,
                  duration: 0.16,
                },
                0.16
              );

            if (reduce) {
              openingTimeline
                .to(
                  root,
                  {
                    "--artifact-opacity": 0.82,
                    duration: 0.36,
                  },
                  0.32
                )
                .set(
                  root,
                  {
                    "--cover-angle": "-178deg",
                    "--book-open": 1,
                    "--book-shift": "-50%",
                    "--book-scale": openBookScale,
                    "--book-tilt": `${readingTilt}deg`,
                    "--artifact-opacity": 1,
                  },
                  0.72
                );
            } else {
              openingTimeline
                .to(
                  root,
                  {
                    "--cover-angle": "-18deg",
                    "--book-open": 0.1,
                    duration: 0.08,
                  },
                  0.3
                )
                .to(
                  root,
                  {
                    "--cover-angle": "-178deg",
                    "--book-open": 1,
                    "--book-shift": "-50%",
                    duration: 0.34,
                  },
                  0.36
                )
                .to(
                  root,
                  {
                    "--book-scale": openBookScale,
                    "--book-tilt": `${readingTilt}deg`,
                    "--book-y": "0vh",
                    duration: 0.22,
                  },
                  0.68
                );
            }

            openingTimeline.to(hold, { progress: 1, duration: 0.1 }, 0.9);
          }

          const entryTrigger = phaseElement("interior-transition");
          if (entryTrigger) {
            registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(
                  entryTrigger,
                  "interior-transition",
                  self => {
                    if (self.isActive) {
                      commitInteriorState(INITIAL_INTERIOR_STATE);
                    }
                  }
                ),
              })
            )
              .fromTo(
                root,
                {
                  "--artifact-layer-opacity": 1,
                  "--interior-opacity": 0,
                  "--interior-scale": compact ? 0.9 : 0.82,
                },
                {
                  "--artifact-layer-opacity": 0,
                  "--interior-opacity": 1,
                  "--interior-scale": 1,
                  duration: reduce ? 0.55 : 0.72,
                  immediateRender: false,
                },
                reduce ? 0.24 : 0.18
              );
          }

          for (
            let index = 0;
            index < TETRADIC_CHAPTER_SCROLL.count;
            index += 1
          ) {
            const trigger = chapterElement(index);
            if (!trigger) continue;

            const chapterTimeline = registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(
                  trigger,
                  `tetrad-${String(index + 1).padStart(2, "0")}`,
                  self => {
                    if (self.isActive) {
                      syncChapterState(index, self.progress);
                    }
                  }
                ),
              })
            );
            const hold = { progress: 0 };

            chapterTimeline.to(hold, {
              progress: 1,
              duration: CHAPTER_HOLD_PROGRESS,
            });

            if (index < TETRADIC_CHAPTER_SCROLL.count - 1) {
              if (reduce) {
                chapterTimeline
                  .fromTo(
                    root,
                    { "--spread-opacity": 1 },
                    {
                      "--spread-opacity": 0,
                      duration: (1 - CHAPTER_HOLD_PROGRESS) / 2,
                      immediateRender: false,
                    }
                  )
                  .to(root, {
                    "--spread-opacity": 1,
                    duration: (1 - CHAPTER_HOLD_PROGRESS) / 2,
                  });
              } else {
                chapterTimeline
                  .fromTo(
                    root,
                    {
                      "--turn-progress": 0,
                      "--turn-angle": "0deg",
                      "--turn-shadow": 0,
                    },
                    {
                      "--turn-progress": 0.5,
                      "--turn-angle": "-90deg",
                      "--turn-shadow": 1,
                      duration: (1 - CHAPTER_HOLD_PROGRESS) / 2,
                      immediateRender: false,
                    }
                  )
                  .to(root, {
                    "--turn-progress": 1,
                    "--turn-angle": "-178deg",
                    "--turn-shadow": 0,
                    duration: (1 - CHAPTER_HOLD_PROGRESS) / 2,
                  });
              }
            } else {
              chapterTimeline.to(hold, {
                progress: 2,
                duration: 1 - CHAPTER_HOLD_PROGRESS,
              });
            }

            chapterTimeline.eventCallback("onUpdate", () => {
              if (chapterTimeline.scrollTrigger?.isActive) {
                syncChapterState(index, chapterTimeline.progress());
              }
            });
          }

          const conclusionTrigger = phaseElement("conclusion");
          if (conclusionTrigger) {
            const conclusionHold = { progress: 0 };
            registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(
                  conclusionTrigger,
                  "conclusion",
                  self => {
                    if (self.isActive) {
                      commitInteriorState({
                        baseIndex: 11,
                        incomingIndex: 11,
                        turning: false,
                      });
                    }
                  }
                ),
              })
            )
              .fromTo(
                root,
                {
                  "--interior-opacity": 1,
                  "--synthesis-opacity": 0,
                },
                {
                  "--interior-opacity": 0,
                  "--synthesis-opacity": 1,
                  duration: 0.2,
                  immediateRender: false,
                }
              )
              .to(conclusionHold, { progress: 1, duration: 0.8 });
          }

          const closingTrigger = phaseElement("book-closing");
          if (closingTrigger) {
            const closingHold = { progress: 0 };
            const closingTimeline = registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(
                  closingTrigger,
                  "book-closing"
                ),
              })
            );

            closingTimeline
              .fromTo(
                root,
                {
                  "--artifact-layer-opacity": 0,
                  "--artifact-opacity": 1,
                  "--synthesis-opacity": 1,
                  "--book-stage-x": "50%",
                  "--book-shift": "-50%",
                  "--book-scale": openBookScale,
                  "--book-tilt": `${readingTilt}deg`,
                  "--book-y": "0vh",
                  "--cover-angle": "-178deg",
                  "--book-open": 1,
                  "--environment-opacity": 0.72,
                },
                {
                  "--artifact-layer-opacity": 1,
                  "--synthesis-opacity": 0,
                  duration: 0.2,
                  immediateRender: false,
                }
              )
              .to(
                root,
                {
                  "--book-scale": compact ? 0.72 : 0.78,
                  "--book-tilt": compact ? "40deg" : "34deg",
                  "--book-y": "4vh",
                  "--environment-opacity": 0.9,
                  duration: 0.24,
                },
                0.2
              );

            if (reduce) {
              closingTimeline.set(
                root,
                {
                  "--cover-angle": "0deg",
                  "--book-open": 0,
                  "--book-shift": "-75%",
                  "--book-scale": compact ? 0.58 : 0.66,
                  "--book-tilt": compact ? "57deg" : "56deg",
                  "--book-y": "8vh",
                },
                0.56
              );
            } else {
              closingTimeline.to(
                root,
                {
                  "--cover-angle": "0deg",
                  "--book-open": 0,
                  "--book-shift": "-75%",
                  "--book-scale": compact ? 0.58 : 0.66,
                  "--book-tilt": compact ? "57deg" : "56deg",
                  "--book-y": "8vh",
                  duration: 0.38,
                },
                0.44
              );
            }

            closingTimeline
              .to(root, { "--environment-opacity": 1, duration: 0.18 }, 0.82)
              .to(closingHold, { progress: 1, duration: 0.18 }, 0.82);
          }

          const purchaseTrigger = phaseElement("purchase");
          if (purchaseTrigger) {
            const purchaseHold = { progress: 0 };
            const purchaseTimeline = registerTimeline(
              gsap.timeline({
                defaults: { ease: "none" },
                scrollTrigger: scrollTriggerFor(
                  purchaseTrigger,
                  "purchase",
                  self => {
                    updateActivePhase("purchase", self);
                    commitPurchaseActive(self.progress > 0.2);
                  }
                ),
              })
            );
            purchaseTimeline
              .fromTo(
                root,
                {
                  "--purchase-opacity": 0,
                  "--book-stage-x": "50%",
                },
                {
                  "--purchase-opacity": 1,
                  "--book-stage-x": purchaseBookX,
                  duration: 0.25,
                  immediateRender: false,
                }
              )
              .to(purchaseHold, { progress: 1, duration: 0.75 });
            purchaseTimeline.eventCallback("onUpdate", () => {
              commitPurchaseActive(purchaseTimeline.progress() > 0.2);
            });
          }
        }, root);

        const synchronizeStateFromDocument = () => {
          const scrollPosition = Math.min(
            window.scrollY + 0.5,
            Math.max(
              0,
              (document.scrollingElement?.scrollHeight ?? 0) -
                window.innerHeight -
                0.5
            )
          );
          const rangeFor = (element: HTMLElement) => {
            const start =
              element.getBoundingClientRect().top + window.scrollY;
            const height = element.getBoundingClientRect().height;
            return { start, end: start + height, height };
          };
          const chapterIndex = chapterElements.findIndex(element => {
            const range = rangeFor(element);
            return scrollPosition >= range.start && scrollPosition < range.end;
          });

          if (chapterIndex >= 0) {
            const range = rangeFor(chapterElements[chapterIndex]);
            const progress = Math.min(
              1,
              Math.max(0, (scrollPosition - range.start) / range.height)
            );
            root.dataset.activePhase = `tetrad-${String(
              chapterIndex + 1
            ).padStart(2, "0")}`;
            syncChapterState(chapterIndex, progress);
            commitPurchaseActive(false);
            return;
          }

          const activePhase = Array.from(phaseElements.entries()).find(
            ([id, element]) => {
              if (id === "tetrads") return false;
              const range = rangeFor(element);
              return (
                scrollPosition >= range.start && scrollPosition < range.end
              );
            }
          );
          if (!activePhase) return;

          const [id, element] = activePhase;
          if (!id) return;
          const range = rangeFor(element);
          const progress = Math.min(
            1,
            Math.max(0, (scrollPosition - range.start) / range.height)
          );
          root.dataset.activePhase = id;
          if (["conclusion", "book-closing", "purchase"].includes(id)) {
            commitInteriorState({
              baseIndex: 11,
              incomingIndex: 11,
              turning: false,
            });
          } else {
            commitInteriorState(INITIAL_INTERIOR_STATE);
          }
          commitPurchaseActive(id === "purchase" && progress > 0.2);
        };

        const reconstruct = () => {
          // Future timelines at progress 0 are allowed to measure, but they
          // must not overwrite the completed phases that precede the current
          // scroll position. Reapply only completed/active timelines in their
          // document order after the global refresh has finished.
          resetVisualState();
          registeredTimelines.forEach(timeline => {
            const trigger = timeline.scrollTrigger;
            if (trigger && trigger.progress > 0) {
              const targetProgress = trigger.progress;
              timeline.progress(0, true).progress(targetProgress, true);
            }
          });
          synchronizeStateFromDocument();
        };
        reconstructTimelineState = reconstruct;

        return () => {
          if (reconstructTimelineState === reconstruct) {
            reconstructTimelineState = () => undefined;
          }
          contextRoot.revert();
        };
      }
    );

    // Run once after every timeline has been attached. ScrollTrigger can first
    // measure during timeline construction, before `self.animation` is ready;
    // this second pass is what makes a cold reload at a deep scroll position
    // reconstruct all completed phases instead of waiting for new input.
    initialRefreshFrame = window.requestAnimationFrame(() => {
      if (disposed) return;
      refreshAndReconstruct();
    });

    replayRef.current = () => {
      const firstChapter = chapterElement(0);
      const interiorStart = root.querySelector<HTMLElement>(
        "#tetradic-interior-start"
      );
      const reader = root.querySelector<HTMLElement>(
        "#tetradic-interior-reader"
      );
      if (!firstChapter) return;

      const top =
        (interiorStart ?? firstChapter).getBoundingClientRect().top +
        window.scrollY;
      const scroller = document.scrollingElement as HTMLElement | null;
      const previousRootScrollBehavior =
        document.documentElement.style.scrollBehavior;
      const previousBodyScrollBehavior = document.body.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      document.body.style.scrollBehavior = "auto";
      window.scrollTo({ top, behavior: "auto" });
      if (scroller) scroller.scrollTop = top;
      ScrollTrigger.update();
      reconstructTimelineState();
      window.requestAnimationFrame(() => {
        document.documentElement.style.scrollBehavior =
          previousRootScrollBehavior;
        document.body.style.scrollBehavior = previousBodyScrollBehavior;
        reader?.focus({ preventScroll: true });
      });
    };

    const refresh = () => {
      if (disposed) return;
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(refreshAndReconstruct);
    };
    const onOrientationChange = () => refresh();
    const onPageShow = () => refresh();

    waitForRenderableAssets(root).then(() => {
      if (!disposed) {
        assetsRefreshFrame = window.requestAnimationFrame(() => {
          if (disposed) return;
          refreshAndReconstruct();
        });
      }
    });
    window.addEventListener("resize", refresh, { passive: true });
    window.addEventListener("orientationchange", onOrientationChange);
    window.addEventListener("pageshow", onPageShow);

    return () => {
      disposed = true;
      replayRef.current = () => undefined;
      window.cancelAnimationFrame(resizeFrame);
      window.cancelAnimationFrame(initialRefreshFrame);
      window.cancelAnimationFrame(assetsRefreshFrame);
      window.removeEventListener("resize", refresh);
      window.removeEventListener("orientationchange", onOrientationChange);
      window.removeEventListener("pageshow", onPageShow);
      media.revert();
    };
  }, [reducedMotion, rootRef]);

  return {
    interiorState,
    purchaseActive,
    replayFromFirstSpread,
  };
}
