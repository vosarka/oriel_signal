import { describe, expect, it } from "vitest";
import { ringRankForTotal, ringTierForRank } from "../shared/rings";
import { accessTier, GARDEN_PLANS, TIER_ACCESS } from "../shared/supporter-access";
import { supporterStanding } from "../shared/supporter-standing";

const now = new Date("2026-10-25T12:00:00Z");

describe("the ladder of rings", () => {
  it("follows Vos's bands: Seed to 30, Keeper to 100, Steward to 250, Pillar to 500, Keystone above", () => {
    expect(ringRankForTotal(0)).toBe(0);
    expect(ringRankForTotal(0.01)).toBe(1);
    expect(ringRankForTotal(30)).toBe(1);
    expect(ringRankForTotal(30.01)).toBe(2);
    expect(ringRankForTotal(100)).toBe(2);
    expect(ringRankForTotal(101)).toBe(3);
    expect(ringRankForTotal(250)).toBe(3);
    expect(ringRankForTotal(251)).toBe(4);
    expect(ringRankForTotal(500)).toBe(4);
    expect(ringRankForTotal(500.01)).toBe(5);
    expect(ringRankForTotal(9999)).toBe(5);
  });

  it("names each rank, and none for no ring", () => {
    expect(ringTierForRank(0)).toBeNull();
    expect(ringTierForRank(1)).toBe("seed");
    expect(ringTierForRank(5)).toBe("keystone");
  });
});

describe("what each ring opens", () => {
  it("gives the book at Pillar, not before, and no limit at Keystone", () => {
    expect(TIER_ACCESS.steward.freeBook).toBe(false);
    expect(TIER_ACCESS.pillar.freeBook).toBe(true);
    expect(TIER_ACCESS.keystone.messagesPerDay).toBe(Infinity);
  });
});

describe("a stored ring decides the tier while the Seeker is active", () => {
  const garden = {
    subscribed: true,
    paypalSubscriptionId: "I-ABC",
    paypalPlanId: GARDEN_PLANS.garden,
    subscriptionStatus: "active",
    subscriptionRenewalDate: "2026-11-20T00:00:00Z",
  };
  const patron = { subscribed: true, paypalSubscriptionId: null, subscriptionRenewalDate: null };

  it("lifts a Garden member to their ring when it opens more", () => {
    expect(accessTier({ ...garden, ringRank: 3 }, now)).toBe("steward");
  });

  it("opens nothing for an inactive Seeker, whatever their ring", () => {
    expect(accessTier({ ...garden, subscribed: false, ringRank: 3 }, now)).toBe("free");
  });

  it("prefers the stored ring over the donated total", () => {
    expect(accessTier({ ...patron, ringRank: 2, donated: 0 }, now)).toBe("keeper");
  });

  it("falls back to the donated total when the ring could not be read", () => {
    expect(accessTier({ ...patron, donated: 120 }, now)).toBe("steward");
  });
});

describe("a ring is shown even when it opens nothing", () => {
  it("keeps an inactive Pillar's ring, total and next step", () => {
    const s = supporterStanding(
      { subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null, ringRank: 4, ringTotal: 300 },
      now
    );
    expect(s.ring).toBe("pillar");
    expect(s.tier).toBe("free");
    expect(s.next?.label).toBe("Keystone");
    expect(s.next?.remaining).toBe(200);
  });
});
