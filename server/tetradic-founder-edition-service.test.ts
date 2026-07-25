import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createCheckpoint: vi.fn(),
  getOrderForUser: vi.fn(),
  getOrderByPaypalOrderId: vi.fn(),
  attachPaypalOrder: vi.fn(),
  recordCapture: vi.fn(),
  getOrderById: vi.fn(),
  transitionStatus: vi.fn(),
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

import {
  attachTetradicFounderEditionPayPalOrder,
  createTetradicFounderEditionCheckpoint,
  markFounderEditionDelivered,
  markFounderEditionInProgress,
  recordValidatedTetradicFounderEditionCaptureForUser,
  recordValidatedTetradicFounderEditionCaptureFromWebhook,
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

  it("attaches a PayPal order only to the authenticated owner's pending edition", async () => {
    mocks.getOrderForUser.mockResolvedValue({
      ...pendingOrder,
      paypalOrderId: null,
    });

    await attachTetradicFounderEditionPayPalOrder({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
    });

    expect(mocks.attachPaypalOrder).toHaveBeenCalledWith({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
    });

    mocks.getOrderForUser.mockResolvedValue(null);
    await expect(
      attachTetradicFounderEditionPayPalOrder({
        orderId: 91,
        userId: 7,
        paypalOrderId: "PAYPAL-ORDER-91",
      })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
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
});
