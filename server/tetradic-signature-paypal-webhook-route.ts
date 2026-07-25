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

type TetradicSignaturePayPalWebhookDependencies = Readonly<{
  getAdapter: () => Pick<
    TetradicSignaturePayPalAdapter,
    "captureOrder" | "verifyWebhook"
  >;
  recordCapture: typeof recordValidatedTetradicFounderEditionCaptureFromWebhook;
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
  recordCapture:
    recordValidatedTetradicFounderEditionCaptureFromWebhook,
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
    status: "COMPLETED",
    captureStatus: "COMPLETED",
    customId: event.customId,
    invoiceId: event.invoiceId,
    currency: event.currency,
    amount: event.amount,
  };
}

export function createTetradicSignaturePayPalWebhookHandler(
  dependencies: TetradicSignaturePayPalWebhookDependencies =
    runtimeDependencies
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
