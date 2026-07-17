import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

import { TetradicSignatureV2 } from "@/features/tetradic-signature/TetradicSignatureV2";
import { TETRADIC_SIGNATURE_CONFIG } from "@/features/tetradic-signature/tetradic-signature-config";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";
import "@/features/tetradic-signature/tetradic-later-spreads.css";
import "@/features/tetradic-signature/tetradic-spread.css";
import "@/features/tetradic-signature/tetradic-signature-v2.css";

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

function SmoothTetradicV2({ compact }: { compact: boolean }) {
  const lenis = useLenis();
  return (
    <TetradicSignatureV2
      compact={compact}
      reducedMotion={false}
      lenis={lenis}
    />
  );
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
    return <TetradicSignatureV2 compact={compact} reducedMotion />;
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
      <SmoothTetradicV2 compact={compact} />
    </ReactLenis>
  );
}
