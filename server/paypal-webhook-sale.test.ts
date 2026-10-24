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
const fakeDb = vi.hoisted(() => ({ update: vi.fn(() => ({ set: () => ({ where: async () => undefined }) })) }));
vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));

import { handlePayPalWebhook, handleSaleCompleted, saleContribution, type PayPalWebhookPayload } from "./paypal-webhook";

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

  it("asks PayPal to send again a payment that arrived before its subscription was linked", async () => {
    rings.userIdForSubscription.mockResolvedValue(null);
    await expect(handleSaleCompleted(good)).rejects.toThrow(/not linked/);
    expect(rings.addContribution).not.toHaveBeenCalled();
  });
});

describe("a donation whose ring cannot be settled", () => {
  it("is still answered as received, so PayPal does not send it again and count it twice", async () => {
    rings.settleRing.mockRejectedValue(new Error("ring tables down"));
    const donation = {
      id: "WH-2",
      event_type: "PAYMENT.CAPTURE.COMPLETED",
      create_time: "2026-10-25T00:00:00Z",
      resource: { id: "C1", status: "COMPLETED", custom_id: "user-7", amount: { value: "20.00", currency_code: "EUR" } },
    } as unknown as PayPalWebhookPayload;
    await expect(handlePayPalWebhook(donation)).resolves.toBeUndefined();
    expect(fakeDb.update).toHaveBeenCalledTimes(1);
  });
});
