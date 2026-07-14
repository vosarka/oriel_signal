import { useEffect, useRef } from "react";

import Layout from "@/components/Layout";
import { TetradicBookScene } from "@/features/tetradic-signature/TetradicBookScene";
import { TetradicNarrative } from "@/features/tetradic-signature/TetradicNarrative";
import { useTetradicScrollProgress } from "@/features/tetradic-signature/useTetradicScrollProgress";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";
import "@/features/tetradic-signature/tetradic-signature.css";

export default function TetradicSignatureExperience() {
  const containerRef = useRef<HTMLElement>(null);
  const { compact, reducedMotion } = useTetradicViewport();
  const sceneStateRef = useTetradicScrollProgress(containerRef, reducedMotion);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <Layout hideFooter overlayHeader>
      <section
        ref={containerRef}
        className="tetradic-signature"
        data-progress="0.0000"
        data-chapter="darkness"
        data-cover-open="0.0000"
      >
        <div className="tetradic-signature__viewport">
          <img
            className="tetradic-signature__environment"
            src="/assets/founder-scene/pedestal-scene.png"
            alt=""
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
          <TetradicNarrative reducedMotion={reducedMotion} />

          {!reducedMotion && (
            <>
              <div className="tetradic-signature__progress" aria-hidden="true">
                <span />
              </div>
              <p className="tetradic-signature__scroll-cue" aria-hidden="true">
                SCROLL TO OPEN
              </p>
            </>
          )}
        </div>
      </section>
    </Layout>
  );
}
