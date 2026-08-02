import { describe, expect, it } from "vitest";

import {
  makeTetradicSignaturePayPalCustomId,
  makeTetradicSignaturePayPalInvoiceId,
} from "./tetradic-signature-paypal";
import { parseVerifiedTetradicSignaturePayPalWebhook } from "./tetradic-signature-paypal-webhook";

const WEBHOOK_EVENT_ID = "WH-3F562076HD293871E-75F399086E414290U";
const PAYPAL_ORDER_ID = "5O190127TN364715T";
const PAYPAL_CAPTURE_ID = "3Y662965014333303";
const INTERNAL_ORDER_ID = 91;

interface EventOverrides {
  amount?: string;
  capturedAt?: string;
  currency?: string;
  customId?: string;
  invoiceId?: string;
  status?: string;
}

function approvedOrderEvent(overrides: EventOverrides = {}) {
  return {
    id: WEBHOOK_EVENT_ID,
    event_type: "CHECKOUT.ORDER.APPROVED",
    resource: {
      id: PAYPAL_ORDER_ID,
      status: overrides.status ?? "APPROVED",
      purchase_units: [
        {
          custom_id:
            overrides.customId ??
            makeTetradicSignaturePayPalCustomId(INTERNAL_ORDER_ID),
          invoice_id:
            overrides.invoiceId ??
            makeTetradicSignaturePayPalInvoiceId(INTERNAL_ORDER_ID),
          amount: {
            currency_code: overrides.currency ?? "EUR",
            value: overrides.amount ?? "81.32",
          },
        },
      ],
    },
  };
}

function completedCaptureEvent(overrides: EventOverrides = {}) {
  return {
    id: WEBHOOK_EVENT_ID,
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    resource: {
      id: PAYPAL_CAPTURE_ID,
      status: overrides.status ?? "COMPLETED",
      update_time: overrides.capturedAt ?? "2026-07-26T08:30:00Z",
      amount: {
        currency_code: overrides.currency ?? "EUR",
        value: overrides.amount ?? "81.32",
      },
      custom_id:
        overrides.customId ??
        makeTetradicSignaturePayPalCustomId(INTERNAL_ORDER_ID),
      invoice_id:
        overrides.invoiceId ??
        makeTetradicSignaturePayPalInvoiceId(INTERNAL_ORDER_ID),
      supplementary_data: {
        related_ids: {
          order_id: PAYPAL_ORDER_ID,
        },
      },
    },
  };
}

describe("verified Tetradic Signature PayPal webhook parser", () => {
  it("accepts a minimal CHECKOUT.ORDER.APPROVED payload", () => {
    expect(
      parseVerifiedTetradicSignaturePayPalWebhook(approvedOrderEvent())
    ).toEqual({
      kind: "accepted",
      event: {
        kind: "order_approved",
        webhookEventId: WEBHOOK_EVENT_ID,
        eventType: "CHECKOUT.ORDER.APPROVED",
        paypalOrderId: PAYPAL_ORDER_ID,
        orderId: INTERNAL_ORDER_ID,
        customId: "tetradic-signature-order-91",
        invoiceId: "TETRADIC-SIGNATURE-91",
        captureId: null,
        currency: "EUR",
        amount: "81.32",
      },
    });
  });

  it("accepts a minimal PAYMENT.CAPTURE.COMPLETED payload", () => {
    expect(
      parseVerifiedTetradicSignaturePayPalWebhook(completedCaptureEvent())
    ).toEqual({
      kind: "accepted",
      event: {
        kind: "capture_completed",
        webhookEventId: WEBHOOK_EVENT_ID,
        eventType: "PAYMENT.CAPTURE.COMPLETED",
        paypalOrderId: PAYPAL_ORDER_ID,
        orderId: INTERNAL_ORDER_ID,
        customId: "tetradic-signature-order-91",
        invoiceId: "TETRADIC-SIGNATURE-91",
        captureId: PAYPAL_CAPTURE_ID,
        capturedAt: "2026-07-26T08:30:00.000Z",
        currency: "EUR",
        amount: "81.32",
      },
    });
  });

  it.each([
    [
      "currency",
      completedCaptureEvent({ currency: "USD" }),
      "CURRENCY_MISMATCH",
    ],
    ["amount", completedCaptureEvent({ amount: "81.31" }), "AMOUNT_MISMATCH"],
    [
      "custom ID",
      completedCaptureEvent({ customId: "another-product-order-91" }),
      "CUSTOM_ID_MISMATCH",
    ],
    [
      "invoice ID",
      completedCaptureEvent({
        invoiceId: makeTetradicSignaturePayPalInvoiceId(92),
      }),
      "INVOICE_ID_MISMATCH",
    ],
  ])(
    "ignores a relevant event with a mismatched %s",
    (_label, event, reason) => {
      expect(parseVerifiedTetradicSignaturePayPalWebhook(event)).toEqual({
        kind: "ignored",
        reason,
      });
    }
  );

  it("ignores an event whose resource status contradicts its type", () => {
    expect(
      parseVerifiedTetradicSignaturePayPalWebhook(
        completedCaptureEvent({ status: "PENDING" })
      )
    ).toEqual({
      kind: "ignored",
      reason: "STATUS_MISMATCH",
    });
  });

  it.each([
    null,
    {},
    {
      id: WEBHOOK_EVENT_ID,
      event_type: "CHECKOUT.ORDER.APPROVED",
      resource: {
        id: PAYPAL_ORDER_ID,
        status: "APPROVED",
        purchase_units: [],
      },
    },
    {
      id: WEBHOOK_EVENT_ID,
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      resource: {
        ...completedCaptureEvent().resource,
        supplementary_data: {},
      },
    },
    completedCaptureEvent({ capturedAt: "not-a-date" }),
  ])("ignores a malformed relevant payload", event => {
    expect(parseVerifiedTetradicSignaturePayPalWebhook(event)).toEqual({
      kind: "ignored",
      reason: "MALFORMED_EVENT",
    });
  });

  it("ignores a valid but irrelevant PayPal event type", () => {
    expect(
      parseVerifiedTetradicSignaturePayPalWebhook({
        id: WEBHOOK_EVENT_ID,
        event_type: "PAYMENT.CAPTURE.PENDING",
        resource: {},
      })
    ).toEqual({
      kind: "ignored",
      reason: "IRRELEVANT_EVENT",
    });
  });
});
