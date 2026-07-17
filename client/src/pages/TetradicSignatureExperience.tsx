import { useEffect, useRef, type CSSProperties } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type Lenis from "lenis";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

import Layout from "@/components/Layout";
import { TetradicBookScene } from "@/features/tetradic-signature/TetradicBookScene";
import { TetradicNarrative } from "@/features/tetradic-signature/TetradicNarrative";
import {
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_TIMELINE,
} from "@/features/tetradic-signature/tetradic-signature-config";
import { useTetradicScrollProgress } from "@/features/tetradic-signature/useTetradicScrollProgress";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";
import "@/features/tetradic-signature/tetradic-signature.css";
import "@/features/tetradic-signature/tetradic-spread.css";
import "@/features/tetradic-signature/tetradic-later-spreads.css";

gsap.registerPlugin(ScrollTrigger);

function TetradicLenisGsapBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const updateScrollTrigger = () => ScrollTrigger.update();
    const advanceLenis = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(advanceLenis, false, true);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      gsap.ticker.remove(advanceLenis);
    };
  }, [lenis]);

  return null;
}

function ChapterProgress({
  onSelect,
}: {
  onSelect: (progress: number) => void;
}) {
  return (
    <>
      <div
        className="sr-only"
        role="progressbar"
        aria-label="Tetradic chapter progress"
        aria-valuemin={1}
        aria-valuemax={12}
        aria-valuenow={1}
        aria-valuetext="Tetrad 01 of 12"
        data-tetradic-progressbar=""
      />
      <nav
        className="tetradic-signature__chapter-progress"
        aria-label="Choose a tetrad chapter"
      >
        <ol>
          {TETRADIC_SIGNATURE_CONFIG.animation.choreography.map(chapter => (
            <li key={chapter.id}>
              <button
                type="button"
                data-chapter-dot={chapter.number}
                aria-label={`Go to Tetrad ${String(chapter.number).padStart(2, "0")}: ${chapter.title}`}
                aria-current={chapter.number === 1 ? "step" : undefined}
                onClick={() =>
                  onSelect(
                    chapter.core.start +
                      (chapter.core.end - chapter.core.start) * 0.58
                  )
                }
              >
                <span>{String(chapter.number).padStart(2, "0")}</span>
              </button>
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

function TetradicFilm({
  compact,
  reducedMotion,
  lenis,
}: {
  compact: boolean;
  reducedMotion: boolean;
  lenis?: Lenis;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const { sceneStateRef, restart, seekToProgress } = useTetradicScrollProgress(
    containerRef,
    reducedMotion,
    compact,
    lenis
  );
  const scrollStyle = {
    "--ts-scroll-height": `${TETRADIC_TIMELINE.heightSvh}svh`,
  } as CSSProperties;

  return (
    <Layout hideFooter overlayHeader>
      <section
        ref={containerRef}
        className="tetradic-signature"
        style={scrollStyle}
        tabIndex={-1}
        aria-label="The Tetradic Signature interactive sample"
        data-progress="0.0000"
        data-master-progress="0.0000"
        data-chapter="darkness"
        data-segment="tetrad-01"
        data-cover-open="0.0000"
      >
        <div className="tetradic-signature__viewport">
          <img
            className="tetradic-signature__environment"
            src={TETRADIC_SIGNATURE_CONFIG.assets.environment}
            alt=""
            width={1672}
            height={941}
            fetchPriority="high"
          />
          <div
            className="tetradic-signature__environment-shade"
            aria-hidden="true"
          />
          <div
            className="tetradic-signature__closure-halo"
            aria-hidden="true"
          />

          <TetradicBookScene
            compact={compact}
            reducedMotion={reducedMotion}
            sceneStateRef={sceneStateRef}
          />
          {!reducedMotion && (
            <div
              className="tetradic-signature__fold-passage"
              aria-hidden="true"
            >
              <div className="tetradic-signature__fold-paper" />
              <div className="tetradic-signature__fold-celestial" />
              <span className="tetradic-signature__fold-axis" />
            </div>
          )}
          <TetradicNarrative
            reducedMotion={reducedMotion}
            onReplaySample={restart}
          />

          {!reducedMotion && (
            <>
              <ChapterProgress onSelect={seekToProgress} />
              <div
                className="tetradic-signature__closure-markers"
                aria-hidden="true"
              >
                {Array.from({ length: 12 }, (_, index) => (
                  <span key={index} />
                ))}
              </div>
              <p className="tetradic-signature__scroll-cue" aria-hidden="true">
                SCROLL TO EXAMINE
              </p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}

function SmoothTetradicCheckpoint({ compact }: { compact: boolean }) {
  const lenis = useLenis();
  return <TetradicFilm compact={compact} reducedMotion={false} lenis={lenis} />;
}

export default function TetradicSignatureExperience() {
  const { compact, reducedMotion } = useTetradicViewport();
  const scroll = TETRADIC_SIGNATURE_CONFIG.animation.scroll;

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  if (reducedMotion) {
    return <TetradicFilm compact={compact} reducedMotion />;
  }

  return (
    <ReactLenis
      root
      options={{
        lerp: scroll.lerp,
        wheelMultiplier: scroll.wheelMultiplier,
        touchMultiplier: scroll.touchMultiplier,
        smoothWheel: true,
        autoRaf: false,
      }}
    >
      <TetradicLenisGsapBridge />
      <SmoothTetradicCheckpoint compact={compact} />
    </ReactLenis>
  );
}
