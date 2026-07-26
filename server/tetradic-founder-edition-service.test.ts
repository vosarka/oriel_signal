import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCheckpoint: vi.fn(),
  getOrderForUser: vi.fn(),
  getOrderByPaypalOrderId: vi.fn(),
  attachPaypalOrder: vi.fn(),
  recordCapture: vi.fn(),
  getOrderById: vi.fn(),
  transitionStatus: vi.fn(),
  createPaypalOrder: vi.fn(),
  capturePaypalOrder: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const original = await importOriginal<typeof import("./db")>();
  return {
    ...original,
    createTetradicFounderEditionCheckpoint: mocks.createCheckpoint,
    getSignatureOrderForUser: mocks.getOrderForUser,
    getSignatureOrderByPaypalOrderId: mocks.getOrderByPaypalOrderId,
    attachTetradicFounderEditionPayPalOrder: mocks.attachPaypalOrder,
    recordTetradicFounderEditionPayPalCapture: mocks.recordCapture,
    getSignatureOrderById: mocks.getOrderById,
    transitionTetradicFounderEditionStatus: mocks.transitionStatus,
  };
});

vi.mock("./_core/env", () => ({
  ENV: {
    appBaseUrl: "https://oriel.example",
    paypalApiBaseUrl: "https://api-m.sandbox.paypal.com",
    paypalClientId: "test-client-id",
    paypalClientSecret: "test-client-secret",
    paypalWebhookId: "test-webhook-id",
  },
}));

vi.mock("./tetradic-signature-paypal", async importOriginal => {
  const original =
    await importOriginal<typeof import("./tetradic-signature-paypal")>();
  return {
    ...original,
    createTetradicSignaturePayPalAdapter: () => ({
      createOrder: mocks.createPaypalOrder,
      captureOrder: mocks.capturePaypalOrder,
    }),
  };
});

import {
  captureFounderEditionPayPalOrder,
  createFounderEditionPayPalOrder,
  createTetradicFounderEditionCheckpoint,
  getFinalSignaturePdfUrl,
  markFounderEditionDelivered,
  markFounderEditionInProgress,
  recordValidatedTetradicFounderEditionCaptureForUser,
  recordValidatedTetradicFounderEditionCaptureFromWebhook,
  uploadFinalSignaturePdf,
} from "./signature-letter-service";

const pendingOrder = {
  id: 91,
  userId: 42,
  productType: "tetradic_founder_edition",
  paymentProvider: "paypal",
  priceEur: 81.32,
  currency: "eur",
  status: "pending_payment",
  paypalOrderId: "PAYPAL-ORDER-91",
  paypalCaptureId: null,
};

const completedCapture = {
  paypalOrderId: "PAYPAL-ORDER-91",
  captureId: "CAPTURE-91",
  capturedAt: "2026-07-26T08:30:00.000Z",
  status: "COMPLETED" as const,
  captureStatus: "COMPLETED" as const,
  customId: "tetradic-signature-order-91",
  invoiceId: "TETRADIC-SIGNATURE-91",
  currency: "EUR" as const,
  amount: "81.32" as const,
};

describe("Tetradic Founder Edition persistence service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.createCheckpoint.mockResolvedValue({
      order: pendingOrder,
      intake: { orderId: 91, questionTwo: "What should I protect?" },
    });
    mocks.attachPaypalOrder.mockResolvedValue(pendingOrder);
    mocks.recordCapture.mockResolvedValue({
      ...pendingOrder,
      status: "intake_received",
      paypalCaptureId: "CAPTURE-91",
    });
    mocks.transitionStatus.mockImplementation(
      async ({ status }: { status: string }) => ({ ...pendingOrder, status })
    );
    mocks.createPaypalOrder.mockResolvedValue({
      paypalOrderId: "PAYPAL-ORDER-91",
      approveUrl: "https://www.sandbox.paypal.com/checkoutnow?token=91",
      status: "PAYER_ACTION_REQUIRED",
    });
    mocks.capturePaypalOrder.mockResolvedValue(completedCapture);
  });

  it("persists identity from the authenticated user and leaves the checkpoint pending", async () => {
    const result = await createTetradicFounderEditionCheckpoint({
      userId: 42,
      userName: "  Elena Ionescu  ",
      userEmail: "  ELENA@example.com ",
      intake: {
        birthDate: "1990-01-02",
        birthTime: "03:04",
        birthPlace: "Bucharest",
        birthCountry: "Romania",
        questionOne: "What is asking to be embodied?",
        questionTwo: "What should I protect?",
        consent: true,
      },
    });

    expect(mocks.createCheckpoint).toHaveBeenCalledWith({
      userId: 42,
      name: "Elena Ionescu",
      email: "elena@example.com",
      birthDate: "1990-01-02",
      birthTime: "03:04",
      birthPlace: "Bucharest",
      birthCountry: "Romania",
      questionOne: "What is asking to be embodied?",
      questionTwo: "What should I protect?",
      consent: true,
    });
    expect(result).toMatchObject({
      orderId: 91,
      status: "pending_payment",
      intakeSaved: true,
    });
  });

  it("creates and attaches the PayPal order exclusively on the server", async () => {
    mocks.getOrderForUser.mockResolvedValue({
      ...pendingOrder,
      paypalOrderId: null,
    });

    const result = await createFounderEditionPayPalOrder({
      orderId: 91,
      userId: 42,
    });

    expect(mocks.createPaypalOrder).toHaveBeenCalledWith({
      orderId: 91,
      returnUrl: "https://oriel.example/signature-order/91?paid=1",
      cancelUrl: "https://oriel.example/signature-order/91?cancelled=1",
    });
    expect(mocks.attachPaypalOrder).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
    });
    expect(result.approveUrl).toContain("sandbox.paypal.com");

    mocks.getOrderForUser.mockResolvedValue(null);
    await expect(
      createFounderEditionPayPalOrder({
        orderId: 91,
        userId: 7,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.createPaypalOrder).toHaveBeenCalledTimes(1);
  });

  it("captures only the PayPal order already attached to the owner", async () => {
    mocks.getOrderForUser.mockResolvedValue(pendingOrder);

    await captureFounderEditionPayPalOrder({
      orderId: 91,
      userId: 42,
    });

    expect(mocks.capturePaypalOrder).toHaveBeenCalledWith({
      orderId: 91,
      paypalOrderId: "PAYPAL-ORDER-91",
    });
    expect(mocks.recordCapture).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
      paypalCaptureId: "CAPTURE-91",
      paidAt: new Date("2026-07-26T08:30:00.000Z"),
      currency: "EUR",
      amount: "81.32",
    });
  });

  it("records only a server-validated capture owned by the current user", async () => {
    mocks.getOrderForUser.mockResolvedValue(pendingOrder);

    await recordValidatedTetradicFounderEditionCaptureForUser({
      orderId: 91,
      userId: 42,
      capture: completedCapture,
    });

    expect(mocks.recordCapture).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
      paypalCaptureId: "CAPTURE-91",
      paidAt: new Date("2026-07-26T08:30:00.000Z"),
      currency: "EUR",
      amount: "81.32",
    });

    mocks.getOrderForUser.mockResolvedValue(null);
    await expect(
      recordValidatedTetradicFounderEditionCaptureForUser({
        orderId: 91,
        userId: 7,
        capture: completedCapture,
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(mocks.recordCapture).toHaveBeenCalledTimes(1);
  });

  it("rejects capture evidence whose server-validated order identity is inconsistent", async () => {
    mocks.getOrderForUser.mockResolvedValue(pendingOrder);

    await expect(
      recordValidatedTetradicFounderEditionCaptureForUser({
        orderId: 91,
        userId: 42,
        capture: {
          ...completedCapture,
          customId: "tetradic-signature-order-92",
        },
      })
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(mocks.recordCapture).not.toHaveBeenCalled();
  });

  it("supports a verified-webhook fallback by resolving the attached PayPal order", async () => {
    mocks.getOrderByPaypalOrderId.mockResolvedValue(pendingOrder);

    await recordValidatedTetradicFounderEditionCaptureFromWebhook({
      capture: completedCapture,
    });

    expect(mocks.getOrderByPaypalOrderId).toHaveBeenCalledWith(
      "PAYPAL-ORDER-91"
    );
    expect(mocks.recordCapture).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
      paypalCaptureId: "CAPTURE-91",
      paidAt: new Date("2026-07-26T08:30:00.000Z"),
      currency: "EUR",
      amount: "81.32",
    });
  });

  it("uses manual-only admin transitions without requiring a PDF", async () => {
    mocks.getOrderById.mockResolvedValue({
      ...pendingOrder,
      status: "intake_received",
    });
    await expect(markFounderEditionInProgress(91)).resolves.toMatchObject({
      status: "in_curation",
    });
    expect(mocks.transitionStatus).toHaveBeenCalledWith({
      orderId: 91,
      fromStatuses: ["intake_received", "in_curation"],
      status: "in_curation",
    });

    mocks.getOrderById.mockResolvedValue({
      ...pendingOrder,
      status: "in_curation",
    });
    await expect(markFounderEditionDelivered(91)).resolves.toMatchObject({
      status: "delivered",
    });
    expect(mocks.transitionStatus).toHaveBeenCalledWith({
      orderId: 91,
      fromStatuses: ["in_curation", "delivered"],
      status: "delivered",
    });
  });

  it("keeps Founder Edition orders outside all shared PDF upload and download paths", async () => {
    mocks.getOrderById.mockResolvedValue(pendingOrder);
    await expect(
      uploadFinalSignaturePdf({
        orderId: 91,
        fileName: "founder-edition.pdf",
        mimeType: "application/pdf",
        base64: "JVBERi0xLjQ=",
      })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/manual curation.*not generated PDFs/i),
    });

    mocks.getOrderForUser.mockResolvedValue(pendingOrder);
    await expect(
      getFinalSignaturePdfUrl({ orderId: 91, userId: 42 })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
      message: expect.stringMatching(/manual curation.*not generated PDFs/i),
    });
  });
});
