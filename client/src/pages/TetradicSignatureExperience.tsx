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

gsap.registerPlugin(ScrollTrigger);

function TetradicLenisGsapBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const updateScrollTrigger = () => ScrollTrigger.update();
    const advanceLenis = (time: number) => lenis.raf(time * 1000);
    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(advanceLenis);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      gsap.ticker.remove(advanceLenis);
    };
  }, [lenis]);

  return null;
}

function TetradicCheckpoint({
  compact,
  reducedMotion,
  lenis,
}: {
  compact: boolean;
  reducedMotion: boolean;
  lenis?: Lenis;
}) {
  const containerRef = useRef<HTMLElement>(null);
  const { sceneStateRef } = useTetradicScrollProgress(
    containerRef,
    reducedMotion,
    lenis
  );
  const scrollStyle = {
    "--ts-scroll-height": `${TETRADIC_TIMELINE.checkpointHeightSvh}svh`,
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
          <TetradicNarrative reducedMotion={reducedMotion} />

          {!reducedMotion && (
            <>
              <div className="tetradic-signature__progress" aria-hidden="true">
                <span />
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
  return (
    <TetradicCheckpoint compact={compact} reducedMotion={false} lenis={lenis} />
  );
}

export default function TetradicSignatureExperience() {
  const { compact, reducedMotion } = useTetradicViewport();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  if (reducedMotion) {
    return <TetradicCheckpoint compact={compact} reducedMotion />;
  }

  return (
    <ReactLenis
      root
      options={{ lerp: 0.085, smoothWheel: true, autoRaf: false }}
    >
      <TetradicLenisGsapBridge />
      <SmoothTetradicCheckpoint compact={compact} />
    </ReactLenis>
  );
}
