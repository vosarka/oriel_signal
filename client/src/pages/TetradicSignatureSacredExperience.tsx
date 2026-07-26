import { useCallback, useEffect, useMemo } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ReactLenis, useLenis } from "lenis/react";
import "lenis/dist/lenis.css";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import type { TetradicFounderEditionIntakeValues } from "@/features/tetradic-signature/TetradicFounderEdition";
import {
  TetradicSacredExperience,
  type TetradicSacredExperienceProps,
} from "@/features/tetradic-signature/TetradicSacredExperience";
import { TETRADIC_SACRED_SCROLL } from "@/features/tetradic-signature/tetradic-sacred-scroll-config";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";
import { trpc } from "@/lib/trpc";

gsap.registerPlugin(ScrollTrigger);

function TetradicSacredLenisBridge() {
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

function SmoothTetradicSacredOpening({
  compact,
  founderEdition,
}: Readonly<{
  compact: boolean;
  founderEdition: NonNullable<TetradicSacredExperienceProps["founderEdition"]>;
}>) {
  const lenis = useLenis();
  return (
    <TetradicSacredExperience
      compact={compact}
      lenis={lenis}
      founderEdition={founderEdition}
    />
  );
}

export default function TetradicSignatureSacredExperience() {
  const { compact, reducedMotion } = useTetradicViewport();
  const { user, isAuthenticated } = useAuth();
  const checkpointMutation =
    trpc.signature.createFounderEditionCheckpoint.useMutation();
  const paypalMutation =
    trpc.signature.createFounderEditionPayPalOrder.useMutation();

  const requireLogin = useCallback(() => {
    window.location.assign(
      getLoginUrl("/tetradic-signature#tetradic-founder-intake")
    );
  }, []);

  const createCheckpoint = useCallback(
    async (values: TetradicFounderEditionIntakeValues) => {
      if (!values.consentAccepted) {
        throw new Error("Consent is required before saving your details.");
      }
      const checkpoint = await checkpointMutation.mutateAsync({
        birthDate: values.birthDate,
        birthTime: values.birthTime,
        birthPlace: values.birthPlace,
        birthCountry: values.birthCountry,
        questionOne: values.questionOne,
        questionTwo: values.questionTwo,
        consent: true,
      });
      return { orderId: checkpoint.orderId };
    },
    [checkpointMutation]
  );

  const continueToPayPal = useCallback(
    async (orderId: number) => {
      const result = await paypalMutation.mutateAsync({ orderId });
      const approveUrl = new URL(result.approveUrl);
      const isPayPalHost =
        approveUrl.hostname === "paypal.com" ||
        approveUrl.hostname.endsWith(".paypal.com");
      if (approveUrl.protocol !== "https:" || !isPayPalHost) {
        throw new Error("PayPal returned an invalid approval address.");
      }
      window.location.assign(approveUrl.toString());
    },
    [paypalMutation]
  );

  const founderEdition = useMemo<
    NonNullable<TetradicSacredExperienceProps["founderEdition"]>
  >(
    () => ({
      isAuthenticated,
      user:
        user?.name && user.email
          ? { name: user.name, email: user.email }
          : null,
      onRequireLogin: requireLogin,
      onCreateCheckpoint: createCheckpoint,
      onContinueToPayPal: continueToPayPal,
    }),
    [
      continueToPayPal,
      createCheckpoint,
      isAuthenticated,
      requireLogin,
      user?.email,
      user?.name,
    ]
  );

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  if (reducedMotion) {
    return (
      <TetradicSacredExperience
        compact={compact}
        reducedMotion
        founderEdition={founderEdition}
      />
    );
  }

  return (
    <ReactLenis
      root
      options={{
        autoRaf: false,
        lerp: TETRADIC_SACRED_SCROLL.lenis.lerp,
        wheelMultiplier: TETRADIC_SACRED_SCROLL.lenis.wheelMultiplier,
        touchMultiplier: TETRADIC_SACRED_SCROLL.lenis.touchMultiplier,
        smoothWheel: true,
      }}
    >
      <TetradicSacredLenisBridge />
      <SmoothTetradicSacredOpening
        compact={compact}
        founderEdition={founderEdition}
      />
    </ReactLenis>
  );
}
