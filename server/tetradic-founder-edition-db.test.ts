import { beforeEach, describe, expect, it, vi } from "vitest";

const harness = vi.hoisted(() => ({
  createDb: vi.fn(),
  transaction: vi.fn(),
  insert: vi.fn(),
  select: vi.fn(),
  update: vi.fn(),
  orderValues: vi.fn(),
  intakeValues: vi.fn(),
  returningId: vi.fn(),
  updateSet: vi.fn(),
  updateWhere: vi.fn(),
}));

vi.mock("./_core/env", () => ({
  ENV: {
    databaseUrl: "mysql://dev-only.invalid/oriel_test",
    runMigrations: false,
  },
}));

vi.mock("./_core/mysql", () => ({
  createDrizzleFromDatabaseUrl: harness.createDb,
}));

import { signatureIntakes, signatureOrders } from "../drizzle/schema";
import {
  createTetradicFounderEditionCheckpoint,
  recordTetradicFounderEditionPayPalCapture,
} from "./db";

const baseOrder = {
  id: 91,
  userId: 42,
  productType: "tetradic_founder_edition",
  priceEur: 81.32,
  currency: "eur",
  paymentProvider: "paypal",
  status: "pending_payment",
  stripeCheckoutSessionId: null,
  stripePaymentIntentId: null,
  paypalOrderId: "PAYPAL-ORDER-91",
  paypalCaptureId: null,
  createdAt: new Date("2026-07-26T08:00:00Z"),
  paidAt: null,
  deliveryDueAt: null,
  deliveredAt: null,
  cancelledAt: null,
  refundedAt: null,
  updatedAt: new Date("2026-07-26T08:00:00Z"),
};

const baseIntake = {
  id: 301,
  orderId: 91,
  userId: 42,
  questionTwo: "What should I protect?",
};

describe("Tetradic Founder Edition DB transactions", () => {
  let selectQueue: unknown[][];

  beforeEach(() => {
    vi.clearAllMocks();
    selectQueue = [];

    const fakeDb = {
      transaction: harness.transaction,
    };
    const tx = {
      insert: harness.insert,
      select: harness.select,
      update: harness.update,
    };
    harness.createDb.mockReturnValue(fakeDb);
    harness.transaction.mockImplementation(
      async (callback: (transaction: typeof tx) => Promise<unknown>) =>
        callback(tx)
    );

    harness.returningId.mockResolvedValue([{ id: 91 }]);
    harness.orderValues.mockReturnValue({
      $returningId: harness.returningId,
    });
    harness.intakeValues.mockResolvedValue(undefined);
    harness.insert.mockImplementation(table => {
      if (table === signatureOrders) {
        return { values: harness.orderValues };
      }
      if (table === signatureIntakes) {
        return { values: harness.intakeValues };
      }
      throw new Error("Unexpected insert table.");
    });

    harness.select.mockImplementation(() => ({
      from: () => ({
        where: () => ({
          limit: async () => selectQueue.shift() ?? [],
        }),
      }),
    }));

    harness.updateWhere.mockResolvedValue(undefined);
    harness.updateSet.mockReturnValue({ where: harness.updateWhere });
    harness.update.mockReturnValue({ set: harness.updateSet });
  });

  it("uses the exact returned order ID for both inserts in one transaction", async () => {
    selectQueue = [[baseOrder], [baseIntake]];

    await createTetradicFounderEditionCheckpoint({
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

    expect(harness.transaction).toHaveBeenCalledTimes(1);
    expect(harness.returningId).toHaveBeenCalledTimes(1);
    expect(harness.orderValues).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        productType: "tetradic_founder_edition",
        paymentProvider: "paypal",
        status: "pending_payment",
      })
    );
    expect(harness.intakeValues).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 91,
        userId: 42,
        name: "Elena Ionescu",
        email: "elena@example.com",
        questionOne: "What is asking to be embodied?",
        questionTwo: "What should I protect?",
      })
    );
  });

  it("does not continue after an intake insert failure in the order transaction", async () => {
    harness.intakeValues.mockRejectedValueOnce(
      new Error("simulated intake insert failure")
    );

    await expect(
      createTetradicFounderEditionCheckpoint({
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
      })
    ).rejects.toThrow(/simulated intake insert failure/i);

    expect(harness.transaction).toHaveBeenCalledTimes(1);
    expect(harness.select).not.toHaveBeenCalled();
  });

  it("records a matching capture once and treats the same capture as idempotent", async () => {
    const capturedOrder = {
      ...baseOrder,
      status: "intake_received",
      paypalCaptureId: "CAPTURE-91",
      paidAt: new Date("2026-07-26T08:30:00Z"),
      deliveryDueAt: new Date("2026-07-31T08:30:00Z"),
    };
    selectQueue = [[baseOrder], [capturedOrder]];

    await recordTetradicFounderEditionPayPalCapture({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
      paypalCaptureId: "CAPTURE-91",
      paidAt: new Date("2026-07-26T08:30:00Z"),
      currency: "EUR",
      amount: "81.32",
    });

    expect(harness.update).toHaveBeenCalledTimes(1);
    expect(harness.updateSet).toHaveBeenCalledWith(
      expect.objectContaining({
        paypalCaptureId: "CAPTURE-91",
        status: "intake_received",
        paidAt: new Date("2026-07-26T08:30:00Z"),
        deliveryDueAt: new Date("2026-07-31T08:30:00Z"),
      })
    );

    selectQueue = [[capturedOrder]];
    await recordTetradicFounderEditionPayPalCapture({
      orderId: 91,
      userId: 42,
      paypalOrderId: "PAYPAL-ORDER-91",
      paypalCaptureId: "CAPTURE-91",
      paidAt: new Date("2026-07-26T08:30:00Z"),
      currency: "EUR",
      amount: "81.32",
    });

    expect(harness.update).toHaveBeenCalledTimes(1);
  });

  it("rejects a mismatched amount before changing order state", async () => {
    selectQueue = [[baseOrder]];

    await expect(
      recordTetradicFounderEditionPayPalCapture({
        orderId: 91,
        userId: 42,
        paypalOrderId: "PAYPAL-ORDER-91",
        paypalCaptureId: "CAPTURE-91",
        paidAt: new Date("2026-07-26T08:30:00Z"),
        currency: "EUR",
        amount: "81.31",
      })
    ).rejects.toThrow(/amount/i);

    expect(harness.update).not.toHaveBeenCalled();
  });
});
