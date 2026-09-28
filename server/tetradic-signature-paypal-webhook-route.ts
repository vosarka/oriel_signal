import express, {
  type Express,
  type Request,
  type RequestHandler,
  type Response,
} from "express";

import { ENV } from "./_core/env";
import {
  createTetradicSignaturePayPalAdapter,
  type TetradicSignatureCompletedOrder,
  type TetradicSignaturePayPalAdapter,
} from "./tetradic-signature-paypal";
import { parseVerifiedTetradicSignaturePayPalWebhook } from "./tetradic-signature-paypal-webhook";
import { recordValidatedTetradicFounderEditionCaptureFromWebhook } from "./signature-letter-service";
import { handlePayPalWebhook, type PayPalWebhookPayload } from "./paypal-webhook";

/**
 * Subscription and donation events. They arrive on this same verified
 * webhook — PayPal signs per webhook, and this is the one whose ID the
 * server holds — and go to the account handler once the book parser has
 * declined them. There is no other way in: the old unverified tRPC
 * endpoint is gone.
 */
const ACCOUNT_EVENTS = new Set([
  "BILLING.SUBSCRIPTION.CREATED",
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.UPDATED",
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.EXPIRED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "PAYMENT.CAPTURE.COMPLETED",
  "PAYMENT.CAPTURE.REFUNDED",
]);

type TetradicSignaturePayPalWebhookDependencies = Readonly<{
  getAdapter: () => Pick<
    TetradicSignaturePayPalAdapter,
    "captureOrder" | "verifyWebhook"
  >;
  recordCapture: typeof recordValidatedTetradicFounderEditionCaptureFromWebhook;
  handleAccountEvent?: (payload: PayPalWebhookPayload) => Promise<void>;
}>;

const runtimeDependencies: TetradicSignaturePayPalWebhookDependencies = {
  getAdapter: () =>
    createTetradicSignaturePayPalAdapter({
      config: {
        apiBaseUrl: ENV.paypalApiBaseUrl,
        clientId: ENV.paypalClientId,
        clientSecret: ENV.paypalClientSecret,
        webhookId: ENV.paypalWebhookId,
      },
      fetch: globalThis.fetch,
    }),
  recordCapture: recordValidatedTetradicFounderEditionCaptureFromWebhook,
};

function completedOrderFromWebhook(
  event: Extract<
    ReturnType<typeof parseVerifiedTetradicSignaturePayPalWebhook>,
    { kind: "accepted" }
  >["event"] & { kind: "capture_completed" }
): TetradicSignatureCompletedOrder {
  return {
    paypalOrderId: event.paypalOrderId,
    captureId: event.captureId,
    capturedAt: event.capturedAt,
    status: "COMPLETED",
    captureStatus: "COMPLETED",
    customId: event.customId,
    invoiceId: event.invoiceId,
    currency: event.currency,
    amount: event.amount,
  };
}

export function createTetradicSignaturePayPalWebhookHandler(
  dependencies: TetradicSignaturePayPalWebhookDependencies = runtimeDependencies
): RequestHandler {
  return async (req: Request, res: Response) => {
    let adapter: ReturnType<
      TetradicSignaturePayPalWebhookDependencies["getAdapter"]
    >;

    try {
      adapter = dependencies.getAdapter();
    } catch {
      res.status(503).json({
        received: false,
        error: "PayPal verification is temporarily unavailable.",
      });
      return;
    }

    try {
      const verified = await adapter.verifyWebhook({
        headers: req.headers,
        event: req.body,
      });
      if (!verified) {
        res.status(400).json({
          received: false,
          error: "Invalid PayPal webhook signature.",
        });
        return;
      }

      const parsed = parseVerifiedTetradicSignaturePayPalWebhook(req.body);
      if (parsed.kind === "ignored" && ACCOUNT_EVENTS.has(req.body?.event_type)) {
        await (dependencies.handleAccountEvent ?? handlePayPalWebhook)(req.body);
        res.status(200).json({ received: true });
        return;
      }
      if (parsed.kind === "ignored") {
        res.status(200).json({
          received: true,
          ignored: true,
          reason: parsed.reason,
        });
        return;
      }

      const capture =
        parsed.event.kind === "order_approved"
          ? await adapter.captureOrder({
              orderId: parsed.event.orderId,
              paypalOrderId: parsed.event.paypalOrderId,
            })
          : completedOrderFromWebhook(parsed.event);

      await dependencies.recordCapture({ capture });
      res.status(200).json({ received: true });
    } catch {
      res.status(503).json({
        received: false,
        error: "PayPal payment confirmation is temporarily unavailable.",
      });
    }
  };
}

export function registerTetradicSignaturePayPalWebhookRoute(
  app: Express,
  dependencies?: TetradicSignaturePayPalWebhookDependencies
) {
  app.post(
    "/api/paypal/tetradic-signature/webhook",
    express.json({ limit: "1mb", type: "application/json" }),
    createTetradicSignaturePayPalWebhookHandler(dependencies)
  );
}
