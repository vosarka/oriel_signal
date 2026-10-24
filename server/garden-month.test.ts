import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  insertMonthOrder: vi.fn(),
  getMonthOrder: vi.fn(),
  markMonthOrderPaid: vi.fn(),
  grantGardenMonth: vi.fn(),
}));
const paypal = vi.hoisted(() => ({ createPaypalOrder: vi.fn(), capturePaypalOrder: vi.fn() }));
vi.mock("./garden-month-db", () => store);
vi.mock("./founders-reading-paypal", () => paypal);
vi.mock("./_core/env", () => ({ ENV: { appBaseUrl: "https://orielsignal.space" } }));

import { buyGardenMonth, captureGardenMonth, monthUntil } from "./garden-month";
import { accessTier, GARDEN_PLANS } from "../shared/supporter-access";
import { GARDEN_MONTH_PRICE_EUR } from "../shared/garden-month";

const now = new Date("2026-10-15T12:00:00Z");
const DAY = 86_400_000;
const seeker = { id: 7, subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null, donated: 0 };

beforeEach(() => {
  vi.clearAllMocks();
  paypal.createPaypalOrder.mockResolvedValue({ paypalOrderId: "ORDER1", approveUrl: "https://paypal.test/approve" });
  paypal.capturePaypalOrder.mockResolvedValue({ captureId: "CAP1", pending: false });
  store.markMonthOrderPaid.mockResolvedValue(true);
});

describe("a month of Garden, paid once", () => {
  it("opens the plan it was paid for, as a real Garden", () => {
    const month = { subscribed: true, paypalSubscriptionId: null, subscriptionRenewalDate: "2026-11-14T12:00:00Z" };
    expect(accessTier({ ...month, paypalPlanId: GARDEN_PLANS.garden }, now)).toBe("garden");
    expect(accessTier({ ...month, paypalPlanId: GARDEN_PLANS.deep_garden }, now)).toBe("deep_garden");
    expect(accessTier({ ...month, paypalPlanId: GARDEN_PLANS.garden, donated: 500 }, now)).toBe("pillar");
  });

  it("adds thirty days to what is already open, or starts them today", () => {
    expect(monthUntil(seeker, now).toISOString()).toBe(new Date(now.getTime() + 30 * DAY).toISOString());
    const open = { ...seeker, subscribed: true, subscriptionRenewalDate: "2026-10-20T00:00:00Z" };
    expect(monthUntil(open, now).toISOString()).toBe("2026-11-19T00:00:00.000Z");
    const lapsed = { ...seeker, subscribed: true, subscriptionRenewalDate: "2026-10-01T00:00:00Z" };
    expect(monthUntil(lapsed, now).toISOString()).toBe(new Date(now.getTime() + 30 * DAY).toISOString());
  });

  it("never puts an end date on an open-ended patron", () => {
    expect(monthUntil({ ...seeker, subscribed: true }, now)).toBeNull();
  });

  it("orders at the fixed price and remembers the order for this Seeker", async () => {
    const url = await buyGardenMonth(seeker, "garden");
    expect(url).toBe("https://paypal.test/approve");
    expect(paypal.createPaypalOrder).toHaveBeenCalledWith(
      expect.objectContaining({ priceEur: GARDEN_MONTH_PRICE_EUR.garden, returnUrl: expect.stringMatching(/\/tiers\?garden_month=return&order=garden-month-7-garden-/) })
    );
    expect(store.insertMonthOrder).toHaveBeenCalledWith(expect.objectContaining({ paypalOrderId: "ORDER1", userId: 7, plan: "garden" }));
  });

  it("opens the month once, on capture", async () => {
    store.getMonthOrder.mockResolvedValue({ paypalOrderId: "ORDER1", userId: 7, plan: "garden", status: "created" });
    expect(await captureGardenMonth(seeker, "ORDER1", now)).toEqual({ active: true });
    expect(store.grantGardenMonth).toHaveBeenCalledWith(7, "garden", new Date(now.getTime() + 30 * DAY));
  });

  it("does not open a second month when the return page is loaded again", async () => {
    store.getMonthOrder.mockResolvedValue({ paypalOrderId: "ORDER1", userId: 7, plan: "garden", status: "created" });
    store.markMonthOrderPaid.mockResolvedValue(false);
    expect(await captureGardenMonth(seeker, "ORDER1", now)).toEqual({ active: true });
    expect(store.grantGardenMonth).not.toHaveBeenCalled();
  });

  it("refuses an order that belongs to someone else", async () => {
    store.getMonthOrder.mockResolvedValue({ paypalOrderId: "ORDER1", userId: 99, plan: "garden", status: "created" });
    expect(await captureGardenMonth(seeker, "ORDER1", now)).toEqual({ active: false });
    expect(paypal.capturePaypalOrder).not.toHaveBeenCalled();
  });

  it("waits for PayPal when the payment is held for review", async () => {
    store.getMonthOrder.mockResolvedValue({ paypalOrderId: "ORDER1", userId: 7, plan: "garden", status: "created" });
    paypal.capturePaypalOrder.mockResolvedValue({ captureId: "CAP1", pending: true });
    expect(await captureGardenMonth(seeker, "ORDER1", now)).toEqual({ active: false, pending: true });
    expect(store.grantGardenMonth).not.toHaveBeenCalled();
  });
});
