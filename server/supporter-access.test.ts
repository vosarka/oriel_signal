import { describe, expect, it } from "vitest";
import { accessTier, GARDEN_PLANS, isSupporter, patronLevel, supporterKind, TIER_ACCESS } from "../shared/supporter-access";

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
  it("follows Vos's bands (2026-10-25): Seed to 30, Keeper to 100, Steward to 250, Pillar to 500, Keystone above", () => {
    expect(patronLevel(0)).toBe("seed");
    expect(patronLevel(30)).toBe("seed");
    expect(patronLevel(30.01)).toBe("keeper");
    expect(patronLevel(100)).toBe("keeper");
    expect(patronLevel(101)).toBe("steward");
    expect(patronLevel(250)).toBe("steward");
    expect(patronLevel(251)).toBe("pillar");
    expect(patronLevel(500)).toBe("pillar");
    expect(patronLevel(500.01)).toBe("keystone");
    expect(patronLevel(6000)).toBe("keystone");
  });

  it("gives a Keystone no limit anywhere, and the book", () => {
    const keystone = TIER_ACCESS[accessTier({ ...base, donated: 6000 }, now)];
    expect(keystone.messagesPerDay).toBe(Infinity);
    expect(keystone.voicePerDay).toBe(Infinity);
    expect(keystone.freeBook).toBe(true);
  });

  it("limits free visitors to 4 written messages and 4 spoken replies", () => {
    const free = TIER_ACCESS[accessTier({ ...base, subscribed: false }, now)];
    expect(free).toMatchObject({ messagesPerDay: 4, voicePerDay: 4 });
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
    expect(accessTier({ ...garden, donated: 2000 }, now)).toBe("keystone");
    expect(accessTier({ ...garden, donated: 50, paypalPlanId: GARDEN_PLANS.deep_garden }, now)).toBe("deep_garden");
  });
});

describe("supporter features (profile reading, Bio-Architecture)", () => {
  it("open for every tier above free and for admins, closed for free and signed-out", () => {
    expect(isSupporter(null)).toBe(false);
    expect(isSupporter({ ...base, subscribed: false }, now)).toBe(false);
    expect(isSupporter({ ...base, subscribed: false, role: "admin" }, now)).toBe(true);
    expect(isSupporter(base, now)).toBe(true); // a patron, Seed
    expect(isSupporter({ ...base, paypalSubscriptionId: "I-X", subscriptionStatus: "active" }, now)).toBe(true);
  });
});
