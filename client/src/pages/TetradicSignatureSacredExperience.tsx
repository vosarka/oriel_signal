import { useCallback, useEffect } from "react";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  TetradicFounderEdition,
  type TetradicFounderEditionIntakeValues,
} from "@/features/tetradic-signature/TetradicFounderEdition";
import { useTetradicViewport } from "@/features/tetradic-signature/useTetradicViewport";
import { trpc } from "@/lib/trpc";

/**
 * The book page. The scroll-scrubbed film opening was removed: the book in
 * the films was not the book people receive, and five videos stood between
 * a visitor and the price. The page now opens on the real book.
 */
export default function TetradicSignatureSacredExperience() {
  const { reducedMotion } = useTetradicViewport();
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

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "The Tetradic Signature · Founder Edition · ORIEL";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <TetradicFounderEdition
      isAuthenticated={isAuthenticated}
      user={user?.name && user.email ? { name: user.name, email: user.email } : null}
      reducedMotion={reducedMotion}
      onRequireLogin={requireLogin}
      onCreateCheckpoint={createCheckpoint}
      onContinueToPayPal={continueToPayPal}
    />
  );
}
