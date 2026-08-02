import { randomUUID } from "crypto";
import { TRPCError } from "@trpc/server";

import { ENV } from "./_core/env";
import { sendSignatureLetterDeliveryEmail } from "./_core/mailer";
import * as db from "./db";
import { geocodeCity, getTimezoneForCoords } from "./geocoding";
import { storageGet, storagePut } from "./storage";
import { buildUserStaticProfile } from "./static-profile-service";
import {
  SIGNATURE_PRODUCTS,
  TETRADIC_FOUNDER_EDITION_PRODUCT,
  assertCanAccessIntake,
  assertCanMarkFounderEditionDelivered,
  assertCanMarkFounderEditionInProgress,
  assertCanGenerateSnapshot,
  assertCanMarkDelivered,
  buildStripeCheckoutSessionRequest,
  generateSignatureLetterDraftMarkdown,
  isLegacySignatureProductType,
  normalizeSignatureSnapshot,
  type NormalizedSignatureSnapshot,
  type SignatureIntakePayload,
  type SignatureOrderProductType,
  type SignatureProductType,
} from "./signature-letter-system";
import {
  TETRADIC_SIGNATURE_PAYPAL_PRODUCT,
  createTetradicSignaturePayPalAdapter,
  makeTetradicSignaturePayPalCustomId,
  makeTetradicSignaturePayPalInvoiceId,
  type TetradicSignatureCompletedOrder,
} from "./tetradic-signature-paypal";

const MAX_FINAL_PDF_BYTES = 15 * 1024 * 1024;

function requireStripeSecret() {
  if (!ENV.stripeSecretKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "STRIPE_SECRET_KEY is required for checkout.",
    });
  }
}

function requireAppBaseUrl() {
  if (!ENV.appBaseUrl) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "APP_BASE_URL is required for Signature Letter delivery links.",
    });
  }
  return ENV.appBaseUrl.replace(/\/+$/, "");
}

function createFounderEditionPayPalAdapter() {
  if (
    !ENV.paypalClientId ||
    !ENV.paypalClientSecret ||
    !ENV.paypalWebhookId
  ) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "PayPal checkout is not configured.",
    });
  }

  return createTetradicSignaturePayPalAdapter({
    config: {
      apiBaseUrl: ENV.paypalApiBaseUrl,
      clientId: ENV.paypalClientId,
      clientSecret: ENV.paypalClientSecret,
      webhookId: ENV.paypalWebhookId,
    },
    fetch,
  });
}

function requirePdfStorageConfig() {
  if (!ENV.s3Bucket || !ENV.s3AccessKeyId || !ENV.s3SecretAccessKey) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "S3 storage is required before uploading final PDFs.",
    });
  }
}

function assertOwner<T extends { userId: number }>(
  order: T | null,
  userId: number
): asserts order is T {
  if (!order || order.userId !== userId) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Signature Letter order not found.",
    });
  }
}

function assertAdminOrder<T>(order: T | null | undefined): asserts order is T {
  if (!order) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Signature Letter order not found.",
    });
  }
}

function requireLegacySignatureProductType(
  productType: SignatureOrderProductType
): SignatureProductType {
  if (!isLegacySignatureProductType(productType)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "Founder Edition orders use the manual curation workflow, not generated PDFs.",
    });
  }
  return productType;
}

function assertFounderEditionOrder<
  T extends {
    productType: SignatureOrderProductType;
    paymentProvider: "stripe" | "paypal";
  },
>(order: T): asserts order is T {
  if (
    order.productType !==
      TETRADIC_FOUNDER_EDITION_PRODUCT.productType ||
    order.paymentProvider !== "paypal"
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This is not a Tetradic Founder Edition PayPal order.",
    });
  }
}

function validateCompletedFounderEditionCapture(
  orderId: number,
  capture: TetradicSignatureCompletedOrder
): Date {
  const capturedAt = new Date(capture.capturedAt);
  if (
    capture.status !== "COMPLETED" ||
    capture.captureStatus !== "COMPLETED" ||
    capture.customId !== makeTetradicSignaturePayPalCustomId(orderId) ||
    capture.invoiceId !== makeTetradicSignaturePayPalInvoiceId(orderId) ||
    capture.currency !== TETRADIC_SIGNATURE_PAYPAL_PRODUCT.currency ||
    capture.amount !== TETRADIC_SIGNATURE_PAYPAL_PRODUCT.amount ||
    Number.isNaN(capturedAt.getTime())
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Validated PayPal capture does not match this order.",
    });
  }

  return capturedAt;
}

function intakePayloadFromRow(
  intake: Awaited<ReturnType<typeof db.getSignatureIntakeByOrderId>>
): SignatureIntakePayload {
  if (!intake) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Signature intake is missing.",
    });
  }

  return {
    name: intake.name,
    email: intake.email,
    birthDate: intake.birthDate,
    birthTime: intake.birthTime,
    birthPlace: intake.birthPlace,
    birthCountry: intake.birthCountry,
    timezone: intake.timezone,
    focusQuestion: intake.focusQuestion,
    preferredTone: intake.preferredTone,
    avoidAssumptions: intake.avoidAssumptions ?? "",
    consentAccepted: intake.consentAccepted,
  };
}

function normalizedSnapshotFromRow(
  snapshot: Awaited<ReturnType<typeof db.getLatestSignatureSnapshot>>
): NormalizedSignatureSnapshot {
  if (!snapshot?.normalizedSignatureJson) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Signature snapshot is missing normalized data.",
    });
  }

  return snapshot.normalizedSignatureJson as NormalizedSignatureSnapshot;
}

async function fetchStripeCheckoutSession(
  payload: ReturnType<typeof buildStripeCheckoutSessionRequest>
) {
  requireStripeSecret();

  const body = new URLSearchParams();
  body.set("mode", payload.mode);
  body.set("success_url", payload.success_url);
  body.set("cancel_url", payload.cancel_url);
  body.set("client_reference_id", payload.client_reference_id);
  if (payload.customer_email) {
    body.set("customer_email", payload.customer_email);
  }
  payload.line_items.forEach((lineItem, index) => {
    const prefix = `line_items[${index}]`;
    body.set(`${prefix}[quantity]`, String(lineItem.quantity));

    if ("price" in lineItem) {
      body.set(`${prefix}[price]`, lineItem.price);
      return;
    }

    body.set(`${prefix}[price_data][currency]`, lineItem.price_data.currency);
    body.set(
      `${prefix}[price_data][product_data][name]`,
      lineItem.price_data.product_data.name
    );
    body.set(
      `${prefix}[price_data][product_data][description]`,
      lineItem.price_data.product_data.description
    );
    body.set(
      `${prefix}[price_data][unit_amount]`,
      String(lineItem.price_data.unit_amount)
    );
  });
  Object.entries(payload.metadata).forEach(([key, value]) => {
    body.set(`metadata[${key}]`, value);
  });

  const response = await fetch("https://api.stripe.com/v1/checkout/sessions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${ENV.stripeSecretKey}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  const json = (await response.json()) as {
    id?: string;
    url?: string;
    error?: { message?: string };
  };

  if (!response.ok || !json.id || !json.url) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: json.error?.message ?? "Stripe Checkout Session failed.",
    });
  }

  return { id: json.id, url: json.url };
}

export async function createSignatureCheckout(input: {
  userId: number;
  userEmail?: string | null;
  productType: SignatureProductType;
}) {
  const product = SIGNATURE_PRODUCTS[input.productType];
  const appBaseUrl = requireAppBaseUrl();
  requireStripeSecret();
  const order = await db.createSignatureOrder({
    userId: input.userId,
    productType: input.productType,
    priceEur: product.priceEur,
    currency: product.currency,
    status: "pending_payment",
  });

  const payload = buildStripeCheckoutSessionRequest({
    appBaseUrl,
    orderId: order.id,
    productType: input.productType,
    userId: input.userId,
    customerEmail: input.userEmail,
  });
  const session = await fetchStripeCheckoutSession(payload);
  await db.setSignatureOrderCheckoutSession({
    orderId: order.id,
    userId: input.userId,
    checkoutSessionId: session.id,
  });

  return {
    orderId: order.id,
    checkoutSessionId: session.id,
    url: session.url,
  };
}

export type TetradicFounderEditionIntake = {
  birthDate: string;
  birthTime: string;
  birthPlace: string;
  birthCountry: string;
  questionOne: string;
  questionTwo: string;
  consent: boolean;
};

export async function createTetradicFounderEditionCheckpoint(input: {
  userId: number;
  userName: string | null | undefined;
  userEmail: string | null | undefined;
  intake: TetradicFounderEditionIntake;
}) {
  const name = input.userName?.trim() ?? "";
  const email = input.userEmail?.trim().toLowerCase() ?? "";
  if (!name || !email) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Your authenticated account must include a name and email.",
    });
  }
  if (!input.intake.consent) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Consent is required before saving the Founder Edition intake.",
    });
  }

  const checkpoint = await db.createTetradicFounderEditionCheckpoint({
    userId: input.userId,
    name,
    email,
    birthDate: input.intake.birthDate,
    birthTime: input.intake.birthTime,
    birthPlace: input.intake.birthPlace,
    birthCountry: input.intake.birthCountry,
    questionOne: input.intake.questionOne,
    questionTwo: input.intake.questionTwo,
    consent: true,
  });
  if (
    checkpoint.order.status !== "pending_payment" ||
    checkpoint.order.productType !==
      TETRADIC_FOUNDER_EDITION_PRODUCT.productType
  ) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Founder Edition checkpoint was created in an invalid state.",
    });
  }

  return {
    orderId: checkpoint.order.id,
    status: checkpoint.order.status,
    product: TETRADIC_FOUNDER_EDITION_PRODUCT,
    intakeSaved: Boolean(checkpoint.intake),
  };
}

async function attachTetradicFounderEditionPayPalOrder(input: {
  orderId: number;
  userId: number;
  paypalOrderId: string;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  assertFounderEditionOrder(order);
  if (order.status !== "pending_payment") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Founder Edition order is not awaiting payment.",
    });
  }

  const paypalOrderId = input.paypalOrderId.trim();
  if (!paypalOrderId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "A PayPal order ID is required.",
    });
  }
  if (order.paypalOrderId && order.paypalOrderId !== paypalOrderId) {
    throw new TRPCError({
      code: "CONFLICT",
      message: "This Founder Edition order already has a PayPal order.",
    });
  }

  return db.attachTetradicFounderEditionPayPalOrder({
    orderId: input.orderId,
    userId: input.userId,
    paypalOrderId,
  });
}

export async function createFounderEditionPayPalOrder(input: {
  orderId: number;
  userId: number;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  assertFounderEditionOrder(order);
  if (order.status !== "pending_payment") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Founder Edition order is not awaiting payment.",
    });
  }

  const appBaseUrl = requireAppBaseUrl();
  const adapter = createFounderEditionPayPalAdapter();
  const created = await adapter.createOrder({
    orderId: input.orderId,
    returnUrl: `${appBaseUrl}/signature-order/${input.orderId}?paid=1`,
    cancelUrl: `${appBaseUrl}/signature-order/${input.orderId}?cancelled=1`,
  });
  await attachTetradicFounderEditionPayPalOrder({
    orderId: input.orderId,
    userId: input.userId,
    paypalOrderId: created.paypalOrderId,
  });

  return {
    orderId: input.orderId,
    paypalOrderId: created.paypalOrderId,
    approveUrl: created.approveUrl,
    status: created.status,
  };
}

export async function recordValidatedTetradicFounderEditionCaptureForUser(
  input: {
    orderId: number;
    userId: number;
    capture: TetradicSignatureCompletedOrder;
  }
) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  assertFounderEditionOrder(order);
  const paidAt = validateCompletedFounderEditionCapture(
    input.orderId,
    input.capture
  );
  if (order.paypalOrderId !== input.capture.paypalOrderId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Validated PayPal capture does not belong to this order.",
    });
  }

  return db.recordTetradicFounderEditionPayPalCapture({
    orderId: input.orderId,
    userId: input.userId,
    paypalOrderId: input.capture.paypalOrderId,
    paypalCaptureId: input.capture.captureId,
    paidAt,
    currency: input.capture.currency,
    amount: input.capture.amount,
  });
}

export async function captureFounderEditionPayPalOrder(input: {
  orderId: number;
  userId: number;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  assertFounderEditionOrder(order);
  if (!order.paypalOrderId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Founder Edition order has no attached PayPal order.",
    });
  }

  const adapter = createFounderEditionPayPalAdapter();
  const capture = await adapter.captureOrder({
    orderId: input.orderId,
    paypalOrderId: order.paypalOrderId,
  });
  const persistedOrder =
    await recordValidatedTetradicFounderEditionCaptureForUser({
      orderId: input.orderId,
      userId: input.userId,
      capture,
    });

  return {
    orderId: input.orderId,
    status: persistedOrder.status,
    captureId: capture.captureId,
  };
}

export async function recordValidatedTetradicFounderEditionCaptureFromWebhook(
  input: { capture: TetradicSignatureCompletedOrder }
) {
  const order = await db.getSignatureOrderByPaypalOrderId(
    input.capture.paypalOrderId
  );
  assertAdminOrder(order);
  assertFounderEditionOrder(order);
  const paidAt = validateCompletedFounderEditionCapture(
    order.id,
    input.capture
  );

  return db.recordTetradicFounderEditionPayPalCapture({
    orderId: order.id,
    userId: order.userId,
    paypalOrderId: input.capture.paypalOrderId,
    paypalCaptureId: input.capture.captureId,
    paidAt,
    currency: input.capture.currency,
    amount: input.capture.amount,
  });
}

export async function getSignatureOrderBundleForUser(input: {
  orderId: number;
  userId: number;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);

  return {
    order,
    intake: await db.getSignatureIntakeByOrderId(input.orderId),
    snapshot: await db.getLatestSignatureSnapshot(input.orderId),
    draft: await db.getSignatureLetterDraft(input.orderId),
  };
}

export async function submitSignatureIntake(input: {
  orderId: number;
  userId: number;
  intake: SignatureIntakePayload;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  assertCanAccessIntake(order.status);

  if (!input.intake.consentAccepted) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Consent is required before ORIEL can prepare this reading.",
    });
  }

  await db.upsertSignatureIntake({
    orderId: input.orderId,
    userId: input.userId,
    name: input.intake.name,
    email: input.intake.email,
    birthDate: input.intake.birthDate,
    birthTime: input.intake.birthTime,
    birthPlace: input.intake.birthPlace,
    birthCountry: input.intake.birthCountry,
    timezone: input.intake.timezone,
    focusQuestion: input.intake.focusQuestion,
    preferredTone: input.intake.preferredTone,
    avoidAssumptions: input.intake.avoidAssumptions || null,
    consentAccepted: true,
    consentAcceptedAt: new Date(),
    locationResolutionStatus: "unresolved",
  });

  return getSignatureOrderBundleForUser(input);
}

export async function listSignatureLetterAdminOrders() {
  const orders = await db.listSignatureOrders(200);
  return Promise.all(
    orders.map(async order => ({
      order,
      intake: await db.getSignatureIntakeByOrderId(order.id),
      snapshot: await db.getLatestSignatureSnapshot(order.id),
      draft: await db.getSignatureLetterDraft(order.id),
    }))
  );
}

export async function getSignatureLetterAdminOrder(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  return {
    order,
    intake: await db.getSignatureIntakeByOrderId(orderId),
    snapshot: await db.getLatestSignatureSnapshot(orderId),
    draft: await db.getSignatureLetterDraft(orderId),
  };
}

export async function generateSignatureSnapshotForOrder(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  const intake = await db.getSignatureIntakeByOrderId(orderId);
  assertCanGenerateSnapshot({
    status: order.status,
    intakeReceived: Boolean(intake),
    consentAccepted: Boolean(intake?.consentAccepted),
  });

  if (!intake) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Intake is required before snapshot generation.",
    });
  }

  let latitude = intake.latitude;
  let longitude = intake.longitude;

  if (latitude === null || longitude === null) {
    try {
      const location = await geocodeCity(
        `${intake.birthPlace}, ${intake.birthCountry}`
      );
      latitude = location.latitude;
      longitude = location.longitude;
      await db.updateSignatureIntakeLocation({
        orderId,
        latitude,
        longitude,
        locationResolutionStatus: "resolved",
      });
    } catch (error) {
      await db.updateSignatureIntakeLocation({
        orderId,
        latitude: null,
        longitude: null,
        locationResolutionStatus: "failed",
      });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message:
          error instanceof Error
            ? error.message
            : "Birth location could not be resolved.",
      });
    }
  }

  const birthDate = new Date(intake.birthDate);
  const timezone = getTimezoneForCoords(latitude, longitude, birthDate);
  const rawSignature = await buildUserStaticProfile(String(order.userId), {
    birthDate: intake.birthDate,
    birthTime: intake.birthTime,
    birthCity: intake.birthPlace,
    birthCountry: intake.birthCountry,
    latitude,
    longitude,
    timezoneId: intake.timezone || timezone.tzId,
    timezoneOffset: timezone.offsetHours,
  });
  const productType = requireLegacySignatureProductType(order.productType);
  const normalized = normalizeSignatureSnapshot(
    rawSignature,
    productType
  );

  return db.createSignatureSnapshot({
    orderId,
    userId: order.userId,
    rawSignatureJson: JSON.stringify(rawSignature),
    normalizedSignatureJson: JSON.stringify(normalized),
    engineVersion: rawSignature.engineVersion ?? normalized.engineVersion,
  });
}

export async function generateSignatureDraftForOrder(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  const productType = requireLegacySignatureProductType(order.productType);
  const intake = await db.getSignatureIntakeByOrderId(orderId);
  const snapshot = await db.getLatestSignatureSnapshot(orderId);

  if (!intake || !snapshot) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Snapshot and intake are required before draft generation.",
    });
  }

  const markdown = generateSignatureLetterDraftMarkdown({
    intake: intakePayloadFromRow(intake),
    normalized: normalizedSnapshotFromRow(snapshot),
    productType,
  });

  const draft = await db.upsertSignatureLetterDraft({
    orderId,
    userId: order.userId,
    markdown,
    productType,
    status: "draft_ready",
  });

  if (order.productType === "founding") {
    await db.upsertSignatureFollowup({
      orderId,
      userId: order.userId,
      used: false,
    });
  }

  return draft;
}

export async function saveSignatureDraft(input: {
  orderId: number;
  markdown: string;
}) {
  await db.updateSignatureLetterDraftMarkdown(input);
  return db.getSignatureLetterDraft(input.orderId);
}

export async function markSignatureInCuration(orderId: number) {
  await db.markSignatureLetterDraftStatus({
    orderId,
    status: "in_curation",
  });
  return getSignatureLetterAdminOrder(orderId);
}

export async function markFounderEditionInProgress(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  try {
    assertCanMarkFounderEditionInProgress({
      productType: order.productType,
      status: order.status,
    });
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        error instanceof Error
          ? error.message
          : "Founder Edition cannot enter curation.",
    });
  }

  return db.transitionTetradicFounderEditionStatus({
    orderId,
    fromStatuses: ["intake_received", "in_curation"],
    status: "in_curation",
  });
}

export async function markFounderEditionDelivered(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  try {
    assertCanMarkFounderEditionDelivered({
      productType: order.productType,
      status: order.status,
    });
  } catch (error) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        error instanceof Error
          ? error.message
          : "Founder Edition cannot be marked delivered.",
    });
  }

  return db.transitionTetradicFounderEditionStatus({
    orderId,
    fromStatuses: ["in_curation", "delivered"],
    status: "delivered",
  });
}

export async function uploadFinalSignaturePdf(input: {
  orderId: number;
  fileName: string;
  mimeType: string;
  base64: string;
}) {
  const order = await db.getSignatureOrderById(input.orderId);
  assertAdminOrder(order);
  requireLegacySignatureProductType(order.productType);
  requirePdfStorageConfig();

  if (input.mimeType !== "application/pdf") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only PDF files can be uploaded.",
    });
  }

  const buffer = Buffer.from(input.base64, "base64");
  if (buffer.byteLength > MAX_FINAL_PDF_BYTES) {
    throw new TRPCError({
      code: "PAYLOAD_TOO_LARGE",
      message: "Final PDF must be 15MB or smaller.",
    });
  }

  const storageKey = `signature-letters/${input.orderId}/${randomUUID()}-${input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  await storagePut(storageKey, buffer, input.mimeType);
  await db.setSignatureLetterDraftPdf({
    orderId: input.orderId,
    storageKey,
    fileName: input.fileName,
    mimeType: input.mimeType,
  });

  return getSignatureLetterAdminOrder(input.orderId);
}

export async function markSignatureDelivered(orderId: number) {
  const order = await db.getSignatureOrderById(orderId);
  assertAdminOrder(order);
  const productType = requireLegacySignatureProductType(order.productType);
  const intake = await db.getSignatureIntakeByOrderId(orderId);
  const draft = await db.getSignatureLetterDraft(orderId);
  assertCanMarkDelivered({
    status: order.status,
    finalPdfStorageKey: draft?.finalPdfStorageKey,
  });

  if (!intake) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Cannot deliver without intake email.",
    });
  }

  await db.markSignatureLetterDraftStatus({
    orderId,
    status: "delivered",
  });

  await sendSignatureLetterDeliveryEmail({
    email: intake.email,
    name: intake.name,
    productTitle: SIGNATURE_PRODUCTS[productType].title,
    deliveryUrl: `${requireAppBaseUrl()}/signature-intake/${orderId}`,
  });

  return getSignatureLetterAdminOrder(orderId);
}

export async function markSignatureFollowupUsed(input: {
  orderId: number;
  notes?: string | null;
}) {
  const order = await db.getSignatureOrderById(input.orderId);
  assertAdminOrder(order);
  await db.upsertSignatureFollowup({
    orderId: input.orderId,
    userId: order.userId,
    used: true,
    notes: input.notes,
  });
  return getSignatureLetterAdminOrder(input.orderId);
}

export async function getFinalSignaturePdfUrl(input: {
  orderId: number;
  userId: number;
}) {
  const order = await db.getSignatureOrderForUser(input.orderId, input.userId);
  assertOwner(order, input.userId);
  requireLegacySignatureProductType(order.productType);
  const draft = await db.getSignatureLetterDraft(input.orderId);

  if (!draft?.finalPdfStorageKey) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: "Final PDF is not ready yet.",
    });
  }

  return storageGet(draft.finalPdfStorageKey);
}
