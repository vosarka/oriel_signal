import { describe, expect, it } from "vitest";
import { accessTier, GARDEN_PLANS, patronLevel, supporterKind, TIER_ACCESS } from "../shared/supporter-access";

const now = new Date("2026-10-01T12:00:00Z");
const base = { subscribed: true, paypalSubscriptionId: null, subscriptionRenewalDate: null };

describe("supporterKind", () => {
  it("treats an unmarked account as free", () => {
    expect(supporterKind({ ...base, subscribed: false }, now)).toBeNull();
  });

  it("reads a marked account without a PayPal subscription as an open-ended patron", () => {
    expect(supporterKind(base, now)).toBe("patron");
  });

  it("lets a 30-day key lapse on its own", () => {
    const key = { ...base, subscriptionRenewalDate: "2026-10-15T23:59:59Z" };
    expect(supporterKind(key, now)).toBe("patron");
    expect(supporterKind(key, new Date("2026-10-16T00:00:00Z"))).toBeNull();
  });

  it("leaves a Garden member's standing to PayPal, whatever the renewal date says", () => {
    const garden = {
      ...base,
      paypalSubscriptionId: "I-BW452GLLEP1G",
      subscriptionRenewalDate: "2026-09-01T00:00:00Z",
    };
    expect(supporterKind(garden, now)).toBe("garden");
  });
});

describe("patron levels and limits", () => {
  it("follows Vos's bands: Seed to 100, Keeper to 400, Steward to 1000, Pillar above", () => {
    expect(patronLevel(0)).toBe("seed");
    expect(patronLevel(100)).toBe("seed");
    expect(patronLevel(101)).toBe("keeper");
    expect(patronLevel(400)).toBe("keeper");
    expect(patronLevel(401)).toBe("steward");
    expect(patronLevel(1000)).toBe("steward");
    expect(patronLevel(1000.01)).toBe("pillar");
    expect(patronLevel(6000)).toBe("pillar");
  });

  it("gives a Pillar no limit anywhere, and the book", () => {
    const pillar = TIER_ACCESS[accessTier({ ...base, donated: 6000 }, now)];
    expect(pillar.messagesPerDay).toBe(Infinity);
    expect(pillar.voicePerDay).toBe(Infinity);
    expect(pillar.freeBook).toBe(true);
  });

  it("limits free visitors to 10 messages and 3 spoken replies", () => {
    const free = TIER_ACCESS[accessTier({ ...base, subscribed: false }, now)];
    expect(free).toMatchObject({ messagesPerDay: 10, voicePerDay: 3 });
  });

  it("drops a lapsed key back to free whatever was donated", () => {
    const lapsed = { ...base, donated: 6000, subscriptionRenewalDate: "2026-09-01T00:00:00Z" };
    expect(accessTier(lapsed, now)).toBe("free");
  });
});

describe("the Garden plans", () => {
  const garden = {
    ...base,
    paypalSubscriptionId: "I-BW452GLLEP1G",
    subscriptionStatus: "active",
    subscriptionRenewalDate: "2026-10-20T00:00:00Z",
  };

  it("tells Deep Garden from Garden by the PayPal plan", () => {
    expect(accessTier({ ...garden, paypalPlanId: GARDEN_PLANS.deep_garden }, now)).toBe("deep_garden");
    expect(accessTier({ ...garden, paypalPlanId: "P-ANY-OTHER" }, now)).toBe("garden");
  });

  it("keeps a cancelled Garden open until the paid month ends", () => {
    const cancelled = { ...garden, subscriptionStatus: "cancelled" };
    expect(accessTier(cancelled, now)).toBe("garden");
    expect(accessTier(cancelled, new Date("2026-10-20T00:00:01Z"))).toBe("free");
  });

  it("lets a patron who joins the Garden keep the larger of the two", () => {
    expect(accessTier({ ...garden, donated: 2000 }, now)).toBe("pillar");
    expect(accessTier({ ...garden, donated: 50, paypalPlanId: GARDEN_PLANS.deep_garden }, now)).toBe("deep_garden");
  });
});
