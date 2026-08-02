import express from "express";
import { createServer } from "node:http";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  makeTetradicSignaturePayPalCustomId,
  makeTetradicSignaturePayPalInvoiceId,
} from "./tetradic-signature-paypal";
import { registerTetradicSignaturePayPalWebhookRoute } from "./tetradic-signature-paypal-webhook-route";

const INTERNAL_ORDER_ID = 91;
const PAYPAL_ORDER_ID = "5O190127TN364715T";
const PAYPAL_CAPTURE_ID = "3Y662965014333303";

const approvedEvent = {
  id: "WH3F562076HD293871E75F399086E414290U",
  event_type: "CHECKOUT.ORDER.APPROVED",
  resource: {
    id: PAYPAL_ORDER_ID,
    status: "APPROVED",
    purchase_units: [
      {
        custom_id: makeTetradicSignaturePayPalCustomId(INTERNAL_ORDER_ID),
        invoice_id: makeTetradicSignaturePayPalInvoiceId(INTERNAL_ORDER_ID),
        amount: { currency_code: "EUR", value: "81.32" },
      },
    ],
  },
};

const captureEvent = {
  id: "WH4F562076HD293871E75F399086E414290U",
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  resource: {
    id: PAYPAL_CAPTURE_ID,
    status: "COMPLETED",
    update_time: "2026-07-26T08:30:00Z",
    custom_id: makeTetradicSignaturePayPalCustomId(INTERNAL_ORDER_ID),
    invoice_id: makeTetradicSignaturePayPalInvoiceId(INTERNAL_ORDER_ID),
    amount: { currency_code: "EUR", value: "81.32" },
    supplementary_data: {
      related_ids: { order_id: PAYPAL_ORDER_ID },
    },
  },
};

const completedCapture = {
  paypalOrderId: PAYPAL_ORDER_ID,
  captureId: PAYPAL_CAPTURE_ID,
  capturedAt: "2026-07-26T08:30:00.000Z",
  status: "COMPLETED" as const,
  captureStatus: "COMPLETED" as const,
  customId: makeTetradicSignaturePayPalCustomId(INTERNAL_ORDER_ID),
  invoiceId: makeTetradicSignaturePayPalInvoiceId(INTERNAL_ORDER_ID),
  currency: "EUR" as const,
  amount: "81.32" as const,
};

const verifyWebhook = vi.fn();
const captureOrder = vi.fn();
const recordCapture = vi.fn();

async function postWebhook(event: unknown) {
  const app = express();
  registerTetradicSignaturePayPalWebhookRoute(app, {
    getAdapter: () => ({ verifyWebhook, captureOrder }),
    recordCapture,
  });
  app.use(express.json());

  const server = createServer(app);
  await new Promise<void>(resolve => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Webhook test server did not expose a TCP port.");
  }

  try {
    return await fetch(
      `http://127.0.0.1:${address.port}/api/paypal/tetradic-signature/webhook`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "paypal-auth-algo": "SHA256withRSA",
          "paypal-cert-url": "https://api-m.sandbox.paypal.com/cert.pem",
          "paypal-transmission-id": "transmission-91",
          "paypal-transmission-sig": "signature-91",
          "paypal-transmission-time": "2026-07-25T10:00:00Z",
        },
        body: JSON.stringify(event),
      }
    );
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    });
  }
}

describe("Tetradic Signature PayPal webhook route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    verifyWebhook.mockResolvedValue(true);
    captureOrder.mockResolvedValue(completedCapture);
    recordCapture.mockResolvedValue({ id: INTERNAL_ORDER_ID });
  });

  it("captures an approved PayPal order server-side and records it", async () => {
    const response = await postWebhook(approvedEvent);

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({ received: true });
    expect(captureOrder).toHaveBeenCalledWith({
      orderId: INTERNAL_ORDER_ID,
      paypalOrderId: PAYPAL_ORDER_ID,
    });
    expect(recordCapture).toHaveBeenCalledWith({
      capture: completedCapture,
    });
  });

  it("records a verified completed-capture event without recapturing it", async () => {
    const response = await postWebhook(captureEvent);

    expect(response.status).toBe(200);
    expect(captureOrder).not.toHaveBeenCalled();
    expect(recordCapture).toHaveBeenCalledWith({
      capture: completedCapture,
    });
  });

  it("rejects an unverified event before touching payment state", async () => {
    verifyWebhook.mockResolvedValue(false);

    const response = await postWebhook(approvedEvent);

    expect(response.status).toBe(400);
    expect(captureOrder).not.toHaveBeenCalled();
    expect(recordCapture).not.toHaveBeenCalled();
  });

  it("acknowledges irrelevant verified events without touching payment state", async () => {
    const response = await postWebhook({
      id: "WH5F562076HD293871E75F399086E414290U",
      event_type: "PAYMENT.CAPTURE.PENDING",
      resource: {},
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      received: true,
      ignored: true,
      reason: "IRRELEVANT_EVENT",
    });
    expect(captureOrder).not.toHaveBeenCalled();
    expect(recordCapture).not.toHaveBeenCalled();
  });

  it("returns a retryable response when PayPal confirmation fails", async () => {
    captureOrder.mockRejectedValue(new Error("temporary failure"));

    const response = await postWebhook(approvedEvent);

    expect(response.status).toBe(503);
    expect(recordCapture).not.toHaveBeenCalled();
  });
});
