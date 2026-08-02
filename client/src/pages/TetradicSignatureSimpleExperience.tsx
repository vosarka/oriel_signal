import { useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

import { TetradicSignatureVideoExperience } from "@/features/tetradic-signature/TetradicSignatureVideoExperience";
import { TETRADIC_VIDEO_SCROLL } from "@/features/tetradic-signature/tetradic-video-scroll-config";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";

gsap.registerPlugin(ScrollTrigger);

function TetradicVideoLenisBridge() {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;

    const updateScrollTrigger = () => ScrollTrigger.update();
    const advanceLenis = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.lagSmoothing(500, 33);
    lenis.on("scroll", updateScrollTrigger);
    gsap.ticker.add(advanceLenis, false, true);

    return () => {
      lenis.off("scroll", updateScrollTrigger);
      gsap.ticker.remove(advanceLenis);
    };
  }, [lenis]);

  return null;
}

function SmoothTetradicVideoOpening({
  compact,
}: Readonly<{ compact: boolean }>) {
  const lenis = useLenis();
  return <TetradicSignatureVideoExperience compact={compact} lenis={lenis} />;
}

export default function TetradicSignatureSimpleExperience() {
  const { compact, reducedMotion } = useTetradicViewport();

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  if (reducedMotion) {
    return <TetradicSignatureVideoExperience compact={compact} reducedMotion />;
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        lerp: TETRADIC_VIDEO_SCROLL.lenis.lerp,
        wheelMultiplier: TETRADIC_VIDEO_SCROLL.lenis.wheelMultiplier,
        touchMultiplier: TETRADIC_VIDEO_SCROLL.lenis.touchMultiplier,
        smoothWheel: true,
      }}
    >
      <TetradicVideoLenisBridge />
      <SmoothTetradicVideoOpening compact={compact} />
    </ReactLenis>
  );
}
