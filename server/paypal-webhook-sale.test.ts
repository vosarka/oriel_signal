import { beforeEach, describe, expect, it, vi } from "vitest";

const rings = vi.hoisted(() => ({
  addContribution: vi.fn(),
  userIdForSubscription: vi.fn(),
  settleRing: vi.fn(),
}));
vi.mock("./rings-db", () => ({
  addContribution: rings.addContribution,
  userIdForSubscription: rings.userIdForSubscription,
}));
vi.mock("./rings-service", () => ({ settleRing: rings.settleRing }));
vi.mock("./db", () => ({ getDb: vi.fn() }));

import { handleSaleCompleted, saleContribution, type PayPalWebhookPayload } from "./paypal-webhook";

const sale = (resource: Record<string, unknown>) =>
  ({ id: "WH-1", event_type: "PAYMENT.SALE.COMPLETED", create_time: "2026-10-25T00:00:00Z", resource }) as unknown as PayPalWebhookPayload;

const good = sale({ id: "S1", state: "completed", billing_agreement_id: "I-ABC", amount: { total: "24.99", currency: "EUR" } });

beforeEach(() => vi.clearAllMocks());

describe("saleContribution", () => {
  it("reads a Garden payment: its id, its subscription, its amount", () => {
    expect(saleContribution(good)).toEqual({ paymentId: "S1", subscriptionId: "I-ABC", amountEur: 24.99 });
  });

  it("ignores a sale that is not a subscription payment", () => {
    expect(saleContribution(sale({ id: "S1", amount: { total: "24.99", currency: "EUR" } }))).toBeNull();
  });

  it("ignores an empty amount", () => {
    expect(saleContribution(sale({ id: "S1", billing_agreement_id: "I-ABC", amount: { total: "0.00", currency: "EUR" } }))).toBeNull();
  });

  it("ignores a currency the rings are not counted in", () => {
    expect(saleContribution(sale({ id: "S1", billing_agreement_id: "I-ABC", amount: { total: "24.99", currency: "USD" } }))).toBeNull();
  });
});

describe("handleSaleCompleted", () => {
  it("counts a payment PayPal sends twice only once", async () => {
    rings.userIdForSubscription.mockResolvedValue(7);
    rings.addContribution.mockResolvedValueOnce(true).mockResolvedValueOnce(false);
    await handleSaleCompleted(good);
    await handleSaleCompleted(good);
    expect(rings.addContribution).toHaveBeenCalledWith({ paypalPaymentId: "S1", userId: 7, amountEur: 24.99, source: "subscription" });
    expect(rings.settleRing).toHaveBeenCalledTimes(1);
  });

  it("leaves a payment for an unknown subscription alone", async () => {
    rings.userIdForSubscription.mockResolvedValue(null);
    await handleSaleCompleted(good);
    expect(rings.addContribution).not.toHaveBeenCalled();
  });
});
