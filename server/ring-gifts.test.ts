import { TRPCError } from "@trpc/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  getGift: vi.fn(),
  getGiftByToken: vi.fn(),
  claimGiftRow: vi.fn(),
  markGiftRedeemed: vi.fn(),
  clearGiftRedeemed: vi.fn(),
  listGifts: vi.fn(),
  nameOf: vi.fn(),
}));
const grants = vi.hoisted(() => ({ grantGardenMonth: vi.fn(), startGiftReading: vi.fn(), signature: vi.fn() }));
vi.mock("./rings-db", () => store);
vi.mock("./garden-month-db", () => ({ grantGardenMonth: grants.grantGardenMonth }));
vi.mock("./garden-month", () => ({ monthUntil: () => new Date("2026-11-24T00:00:00Z") }));
vi.mock("./transmission-service", () => ({ startGiftReading: grants.startGiftReading }));
vi.mock("./oriel-umm", () => ({ buildStaticSignatureContext: grants.signature }));
vi.mock("./_core/env", () => ({ ENV: { appBaseUrl: "https://orielsignal.space" } }));

import { claimGift, redeemBlock, redeemGift } from "./ring-gifts";

const now = new Date("2026-10-25T12:00:00Z");
const nobody = { id: 9, subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null };
const activeGarden = {
  ...nobody,
  subscribed: true,
  paypalSubscriptionId: "I-LIVE",
  subscriptionStatus: "active",
  subscriptionRenewalDate: "2026-11-20T00:00:00Z",
};
const token = "a".repeat(32);
const giftRow = (kind: "garden_month" | "founders_reading") => ({ id: 3, userId: 7, ringRank: 2, kind, token, redeemedAt: null });

beforeEach(() => {
  vi.clearAllMocks();
  store.markGiftRedeemed.mockResolvedValue(true);
  grants.signature.mockResolvedValue("a signature");
});

describe("redeemBlock", () => {
  it("keeps a Garden month from someone already in a live Garden", () => {
    expect(redeemBlock("garden_month", activeGarden, true, now)).toBe("active_garden");
  });

  it("lets someone whose Garden was cancelled and has closed receive a month", () => {
    const closed = { ...activeGarden, subscriptionStatus: "cancelled", subscriptionRenewalDate: "2026-10-01T00:00:00Z" };
    expect(redeemBlock("garden_month", closed, true, now)).toBeNull();
  });

  it("asks for a signature before a reading can be written", () => {
    expect(redeemBlock("founders_reading", nobody, false, now)).toBe("needs_signature");
    expect(redeemBlock("founders_reading", nobody, true, now)).toBeNull();
  });
});

describe("claimGift", () => {
  it("refuses a gift that is not the claimer's", async () => {
    store.getGift.mockResolvedValue({ id: 3, userId: 7, kind: null, token: null });
    await expect(claimGift(8, 3, "garden_month")).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("returns the link of a gift already claimed instead of making a second one", async () => {
    store.getGift.mockResolvedValue({ id: 3, userId: 7, kind: "garden_month", token });
    await expect(claimGift(7, 3, "founders_reading")).resolves.toEqual({ url: `https://orielsignal.space/gift/${token}` });
    expect(store.claimGiftRow).not.toHaveBeenCalled();
  });
});

describe("redeemGift", () => {
  it("opens a month of Garden for whoever opens the link", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("garden_month"));
    await expect(redeemGift(nobody, token)).resolves.toEqual({ kind: "garden_month" });
    expect(grants.grantGardenMonth).toHaveBeenCalledWith(9, "garden", new Date("2026-11-24T00:00:00Z"));
  });

  it("keeps a bought Deep Garden month deep when a Garden month is added to it", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("garden_month"));
    const deepMonth = {
      ...nobody,
      subscribed: true,
      subscriptionStatus: "active",
      paypalPlanId: "P-6SY7118000596284YNK7HTLI",
      subscriptionRenewalDate: "2026-11-10T00:00:00Z",
    };
    await redeemGift(deepMonth, token);
    expect(grants.grantGardenMonth).toHaveBeenCalledWith(9, "deep_garden", expect.any(Date));
  });

  it("keeps it deep even when the receiver's ring opens more than Deep Garden", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("garden_month"));
    const deepStewardMonth = {
      ...nobody,
      subscribed: true,
      subscriptionStatus: "active",
      paypalPlanId: "P-6SY7118000596284YNK7HTLI",
      subscriptionRenewalDate: "2026-11-10T00:00:00Z",
      ringRank: 3,
    };
    await redeemGift(deepStewardMonth, token);
    expect(grants.grantGardenMonth).toHaveBeenCalledWith(9, "deep_garden", expect.any(Date));
  });

  it("refuses a second receiver, without granting anything", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("garden_month"));
    store.markGiftRedeemed.mockResolvedValue(false);
    await expect(redeemGift(nobody, token)).rejects.toMatchObject({ code: "CONFLICT" });
    expect(grants.grantGardenMonth).not.toHaveBeenCalled();
  });

  it("leaves the link valid when the receiver is already in the Garden", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("garden_month"));
    await expect(redeemGift(activeGarden, token)).rejects.toMatchObject({ code: "PRECONDITION_FAILED", message: "active_garden" });
    expect(store.markGiftRedeemed).not.toHaveBeenCalled();
  });

  it("gives the gift back to the link when the grant fails", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("founders_reading"));
    grants.startGiftReading.mockRejectedValue(new Error("db down"));
    await expect(redeemGift(nobody, token)).rejects.toThrow("db down");
    expect(store.clearGiftRedeemed).toHaveBeenCalledWith(token);
  });

  it("starts a reading for the receiver", async () => {
    store.getGiftByToken.mockResolvedValue(giftRow("founders_reading"));
    grants.startGiftReading.mockResolvedValue({ id: 51 });
    await expect(redeemGift(nobody, token)).resolves.toEqual({ kind: "founders_reading", transmissionId: 51 });
    expect(grants.startGiftReading).toHaveBeenCalledWith(9);
  });

  it("knows no gift behind an unknown link", async () => {
    store.getGiftByToken.mockResolvedValue(null);
    await expect(redeemGift(nobody, token)).rejects.toBeInstanceOf(TRPCError);
  });
});
