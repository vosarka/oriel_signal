import {
  TETRADIC_SIGNATURE_PAYPAL_PRODUCT,
  makeTetradicSignaturePayPalCustomId,
  makeTetradicSignaturePayPalInvoiceId,
} from "./tetradic-signature-paypal";

export const TETRADIC_SIGNATURE_PAYPAL_WEBHOOK_EVENT_TYPES = [
  "CHECKOUT.ORDER.APPROVED",
  "PAYMENT.CAPTURE.COMPLETED",
] as const;

export type TetradicSignaturePayPalWebhookEventType =
  (typeof TETRADIC_SIGNATURE_PAYPAL_WEBHOOK_EVENT_TYPES)[number];

export type TetradicSignaturePayPalWebhookIgnoreReason =
  | "IRRELEVANT_EVENT"
  | "MALFORMED_EVENT"
  | "STATUS_MISMATCH"
  | "CUSTOM_ID_MISMATCH"
  | "INVOICE_ID_MISMATCH"
  | "CURRENCY_MISMATCH"
  | "AMOUNT_MISMATCH";

interface TetradicSignaturePayPalWebhookEventBase {
  webhookEventId: string;
  paypalOrderId: string;
  orderId: number;
  customId: string;
  invoiceId: string;
  currency: typeof TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency;
  amount: typeof TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount;
}

export interface TetradicSignaturePayPalOrderApprovedWebhookEvent
  extends TetradicSignaturePayPalWebhookEventBase {
  kind: "order_approved";
  eventType: "CHECKOUT.ORDER.APPROVED";
  captureId: null;
}

export interface TetradicSignaturePayPalCaptureCompletedWebhookEvent
  extends TetradicSignaturePayPalWebhookEventBase {
  kind: "capture_completed";
  eventType: "PAYMENT.CAPTURE.COMPLETED";
  captureId: string;
}

export type TetradicSignaturePayPalWebhookEvent =
  | TetradicSignaturePayPalOrderApprovedWebhookEvent
  | TetradicSignaturePayPalCaptureCompletedWebhookEvent;

export type TetradicSignaturePayPalWebhookParseResult =
  | {
      kind: "accepted";
      event: TetradicSignaturePayPalWebhookEvent;
    }
  | {
      kind: "ignored";
      reason: TetradicSignaturePayPalWebhookIgnoreReason;
    };

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function ignored(
  reason: TetradicSignaturePayPalWebhookIgnoreReason
): TetradicSignaturePayPalWebhookParseResult {
  return { kind: "ignored", reason };
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isPayPalResourceId(value: unknown): value is string {
  return (
    isNonEmptyString(value) &&
    value.length <= 64 &&
    /^[A-Z0-9]+$/.test(value)
  );
}

function parseInternalOrderId(customId: string): number | null {
  const match = /^tetradic-signature-order-([1-9]\d*)$/.exec(customId);
  if (!match) return null;

  const orderId = Number(match[1]);
  if (!Number.isSafeInteger(orderId) || orderId <= 0) return null;

  return makeTetradicSignaturePayPalCustomId(orderId) === customId
    ? orderId
    : null;
}

function validateReconciliationFields(
  source: JsonRecord
):
  | {
      kind: "valid";
      orderId: number;
      customId: string;
      invoiceId: string;
      currency: typeof TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency;
      amount: typeof TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount;
    }
  | {
      kind: "invalid";
      reason: Exclude<
        TetradicSignaturePayPalWebhookIgnoreReason,
        "IRRELEVANT_EVENT" | "STATUS_MISMATCH"
      >;
    } {
  if (!isNonEmptyString(source.custom_id)) {
    return { kind: "invalid", reason: "MALFORMED_EVENT" };
  }

  const orderId = parseInternalOrderId(source.custom_id);
  if (orderId === null) {
    return { kind: "invalid", reason: "CUSTOM_ID_MISMATCH" };
  }

  if (!isNonEmptyString(source.invoice_id)) {
    return { kind: "invalid", reason: "MALFORMED_EVENT" };
  }

  if (
    source.invoice_id !== makeTetradicSignaturePayPalInvoiceId(orderId)
  ) {
    return { kind: "invalid", reason: "INVOICE_ID_MISMATCH" };
  }

  if (!isRecord(source.amount)) {
    return { kind: "invalid", reason: "MALFORMED_EVENT" };
  }

  if (!isNonEmptyString(source.amount.currency_code)) {
    return { kind: "invalid", reason: "MALFORMED_EVENT" };
  }

  if (
    source.amount.currency_code !==
    TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency
  ) {
    return { kind: "invalid", reason: "CURRENCY_MISMATCH" };
  }

  if (!isNonEmptyString(source.amount.value)) {
    return { kind: "invalid", reason: "MALFORMED_EVENT" };
  }

  if (
    source.amount.value !== TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount
  ) {
    return { kind: "invalid", reason: "AMOUNT_MISMATCH" };
  }

  return {
    kind: "valid",
    orderId,
    customId: source.custom_id,
    invoiceId: source.invoice_id,
    currency: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency,
    amount: TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount,
  };
}

function parseOrderApproved(
  webhookEventId: string,
  resource: JsonRecord
): TetradicSignaturePayPalWebhookParseResult {
  if (!isNonEmptyString(resource.status)) {
    return ignored("MALFORMED_EVENT");
  }

  if (resource.status !== "APPROVED") {
    return ignored("STATUS_MISMATCH");
  }

  if (!isPayPalResourceId(resource.id)) {
    return ignored("MALFORMED_EVENT");
  }

  if (
    !Array.isArray(resource.purchase_units) ||
    resource.purchase_units.length !== 1 ||
    !isRecord(resource.purchase_units[0])
  ) {
    return ignored("MALFORMED_EVENT");
  }

  const reconciliation = validateReconciliationFields(
    resource.purchase_units[0]
  );

  if (reconciliation.kind === "invalid") {
    return ignored(reconciliation.reason);
  }

  return {
    kind: "accepted",
    event: {
      kind: "order_approved",
      webhookEventId,
      eventType: "CHECKOUT.ORDER.APPROVED",
      paypalOrderId: resource.id,
      orderId: reconciliation.orderId,
      customId: reconciliation.customId,
      invoiceId: reconciliation.invoiceId,
      captureId: null,
      currency: reconciliation.currency,
      amount: reconciliation.amount,
    },
  };
}

function parseCaptureCompleted(
  webhookEventId: string,
  resource: JsonRecord
): TetradicSignaturePayPalWebhookParseResult {
  if (!isNonEmptyString(resource.status)) {
    return ignored("MALFORMED_EVENT");
  }

  if (resource.status !== "COMPLETED") {
    return ignored("STATUS_MISMATCH");
  }

  if (!isPayPalResourceId(resource.id)) {
    return ignored("MALFORMED_EVENT");
  }

  if (
    !isRecord(resource.supplementary_data) ||
    !isRecord(resource.supplementary_data.related_ids) ||
    !isPayPalResourceId(
      resource.supplementary_data.related_ids.order_id
    )
  ) {
    return ignored("MALFORMED_EVENT");
  }

  const reconciliation = validateReconciliationFields(resource);

  if (reconciliation.kind === "invalid") {
    return ignored(reconciliation.reason);
  }

  return {
    kind: "accepted",
    event: {
      kind: "capture_completed",
      webhookEventId,
      eventType: "PAYMENT.CAPTURE.COMPLETED",
      paypalOrderId:
        resource.supplementary_data.related_ids.order_id,
      orderId: reconciliation.orderId,
      customId: reconciliation.customId,
      invoiceId: reconciliation.invoiceId,
      captureId: resource.id,
      currency: reconciliation.currency,
      amount: reconciliation.amount,
    },
  };
}

export function parseVerifiedTetradicSignaturePayPalWebhook(
  payload: unknown
): TetradicSignaturePayPalWebhookParseResult {
  if (
    !isRecord(payload) ||
    !isNonEmptyString(payload.id) ||
    !isNonEmptyString(payload.event_type)
  ) {
    return ignored("MALFORMED_EVENT");
  }

  if (
    !TETRADIC_SIGNATURE_PAYPAL_WEBHOOK_EVENT_TYPES.includes(
      payload.event_type as TetradicSignaturePayPalWebhookEventType
    )
  ) {
    return ignored("IRRELEVANT_EVENT");
  }

  if (!isRecord(payload.resource)) {
    return ignored("MALFORMED_EVENT");
  }

  if (payload.event_type === "CHECKOUT.ORDER.APPROVED") {
    return parseOrderApproved(payload.id, payload.resource);
  }

  return parseCaptureCompleted(payload.id, payload.resource);
}
