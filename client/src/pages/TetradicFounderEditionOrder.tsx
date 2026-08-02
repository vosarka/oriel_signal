import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRoute } from "wouter";

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import {
  TetradicFounderOrderStatus,
  type TetradicFounderOrderPhase,
} from "@/features/tetradic-signature/TetradicFounderOrderStatus";
import { trpc } from "@/lib/trpc";

const CONFIRMED_STATUSES = new Set([
  "intake_received",
  "in_curation",
  "delivered",
]);

function assignPayPalApprovalUrl(value: string) {
  const url = new URL(value);
  const isPayPalHost =
    url.hostname === "paypal.com" || url.hostname.endsWith(".paypal.com");
  if (url.protocol !== "https:" || !isPayPalHost) {
    throw new Error("PayPal returned an invalid approval address.");
  }
  window.location.assign(url.toString());
}

export default function TetradicFounderEditionOrder() {
  const [, params] = useRoute("/signature-order/:orderId");
  const orderId = Number(params?.orderId ?? 0);
  const search = typeof window === "undefined" ? "" : window.location.search;
  const searchParams = useMemo(() => new URLSearchParams(search), [search]);
  const returnedFromPayPal = searchParams.get("paid") === "1";
  const wasCancelled = searchParams.get("cancelled") === "1";
  const returnPath = `/signature-order/${orderId}${search}`;
  const { user, loading: authLoading } = useAuth({
    redirectOnUnauthenticated: true,
    redirectPath: getLoginUrl(returnPath),
  });
  const captureStarted = useRef(false);
  const utils = trpc.useUtils();

  const orderQuery = trpc.signature.getOrder.useQuery(
    { orderId },
    {
      enabled: Boolean(user && Number.isSafeInteger(orderId) && orderId > 0),
      refetchOnWindowFocus: true,
    }
  );
  const createPayment =
    trpc.signature.createFounderEditionPayPalOrder.useMutation({
      onSuccess: result => assignPayPalApprovalUrl(result.approveUrl),
    });
  const capturePayment =
    trpc.signature.captureFounderEditionPayPalOrder.useMutation({
      onSuccess: async () => {
        await utils.signature.getOrder.invalidate({ orderId });
      },
    });

  const order = orderQuery.data?.order;
  const isFounderEdition = order?.productType === "tetradic_founder_edition";
  const isConfirmed =
    Boolean(order && CONFIRMED_STATUSES.has(order.status)) ||
    Boolean(
      capturePayment.data && CONFIRMED_STATUSES.has(capturePayment.data.status)
    );

  useEffect(() => {
    if (
      !returnedFromPayPal ||
      !user ||
      !isFounderEdition ||
      !order ||
      order.status !== "pending_payment" ||
      captureStarted.current
    ) {
      return;
    }

    captureStarted.current = true;
    capturePayment.mutate({ orderId });
  }, [
    capturePayment,
    isFounderEdition,
    order,
    orderId,
    returnedFromPayPal,
    user,
  ]);

  const openPayment = useCallback(() => {
    createPayment.mutate({ orderId });
  }, [createPayment, orderId]);

  const retryCapture = useCallback(() => {
    captureStarted.current = true;
    capturePayment.mutate({ orderId });
  }, [capturePayment, orderId]);

  let phase: TetradicFounderOrderPhase = "pending";
  let message: string | undefined;
  let actionLabel: string | undefined;
  let onAction: (() => void) | undefined;

  if (
    authLoading ||
    (user && orderQuery.isLoading) ||
    (returnedFromPayPal &&
      order?.status === "pending_payment" &&
      !capturePayment.error)
  ) {
    phase = returnedFromPayPal ? "capturing" : "loading";
  } else if (
    !Number.isSafeInteger(orderId) ||
    orderId <= 0 ||
    orderQuery.error ||
    (order && !isFounderEdition)
  ) {
    phase = "error";
    message =
      orderQuery.error?.message ??
      "This Founder Edition receiver record could not be opened.";
  } else if (capturePayment.error) {
    phase = "error";
    message = capturePayment.error.message;
    actionLabel = "Verify payment again";
    onAction = retryCapture;
  } else if (createPayment.error) {
    phase = "error";
    message = createPayment.error.message;
    actionLabel = "Open PayPal again";
    onAction = openPayment;
  } else if (isConfirmed) {
    phase = "confirmed";
  } else if (wasCancelled) {
    phase = "cancelled";
    actionLabel = "Return to PayPal · €81,32";
    onAction = openPayment;
  } else {
    phase = "pending";
    actionLabel = "Continue to PayPal · €81,32";
    onAction = openPayment;
  }

  return (
    <TetradicFounderOrderStatus
      orderId={orderId}
      phase={phase}
      orderStatus={order?.status}
      deliveryDueAt={order?.deliveryDueAt}
      message={message}
      actionLabel={actionLabel}
      actionPending={createPayment.isPending || capturePayment.isPending}
      onAction={onAction}
    />
  );
}
