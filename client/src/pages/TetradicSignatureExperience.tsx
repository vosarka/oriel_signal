import { useEffect, useRef } from "react";

import Layout from "@/components/Layout";
import { TetradicBookScene } from "@/features/tetradic-signature/TetradicBookScene";
import { TetradicNarrative } from "@/features/tetradic-signature/TetradicNarrative";
import { TETRADIC_SIGNATURE_CONFIG } from "@/features/tetradic-signature/tetradic-signature-config";
import { useTetradicScrollProgress } from "@/features/tetradic-signature/useTetradicScrollProgress";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";
import "@/features/tetradic-signature/tetradic-signature.css";
import "@/features/tetradic-signature/tetradic-spread.css";

export default function TetradicSignatureExperience() {
  const containerRef = useRef<HTMLElement>(null);
  const { compact, reducedMotion } = useTetradicViewport();
  const { sceneStateRef, exploreSample } = useTetradicScrollProgress(
    containerRef,
    reducedMotion
  );

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
        tabIndex={-1}
        aria-label="The Tetradic Signature interactive sample"
        data-progress="0.0000"
        data-chapter="darkness"
        data-cover-open="0.0000"
      >
        <div className="tetradic-signature__viewport">
          <img
            className="tetradic-signature__environment"
            src={TETRADIC_SIGNATURE_CONFIG.assets.environment}
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
          <TetradicNarrative
            reducedMotion={reducedMotion}
            onExploreSample={exploreSample}
          />

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
