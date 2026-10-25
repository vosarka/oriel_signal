import { describe, expect, it } from "vitest";
import { ringRankForTotal, ringTierForRank } from "../shared/rings";
import { accessTier, dailyMeasure, freeBook, GARDEN_PLANS } from "../shared/supporter-access";
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

describe("the measure: the plan's base, and the ring's bonus on top", () => {
  const free = { subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null };
  const garden = {
    subscribed: true,
    paypalSubscriptionId: "I-ABC",
    paypalPlanId: GARDEN_PLANS.garden,
    subscriptionStatus: "active",
    subscriptionRenewalDate: "2026-11-20T00:00:00Z",
  };
  const patron = { subscribed: true, paypalSubscriptionId: null, subscriptionRenewalDate: null };

  it("gives a free Seeker their ring's bonus, voice equal to messages", () => {
    expect(dailyMeasure({ ...free, ringRank: 2 }, now)).toEqual({ messagesPerDay: 14, voicePerDay: 14, messagesPerHour: 30 });
  });

  it("adds the ring to a Garden", () => {
    expect(dailyMeasure({ ...garden, ringRank: 3 }, now)).toMatchObject({ messagesPerDay: 170, voicePerDay: 170 });
  });

  it("adds the ring to a Deep Garden, which keeps its hourly room", () => {
    expect(dailyMeasure({ ...garden, paypalPlanId: GARDEN_PLANS.deep_garden, ringRank: 5 }, now)).toMatchObject({ messagesPerDay: 300, messagesPerHour: 120 });
  });

  it("opens a Garden base for a donation's key, plus the ring of its total", () => {
    expect(dailyMeasure({ ...patron, donated: 120 }, now).messagesPerDay).toBe(170);
  });

  it("drops a lapsed Garden to the free base, keeping the ring's bonus", () => {
    expect(dailyMeasure({ ...garden, subscribed: false, ringRank: 2 }, now).messagesPerDay).toBe(14);
  });

  it("measures nothing for the architect", () => {
    expect(dailyMeasure({ ...free, role: "admin" }, now)).toEqual({ messagesPerDay: Infinity, voicePerDay: Infinity, messagesPerHour: Infinity });
  });

  it("leaves the plan as the tier, whatever the ring", () => {
    expect(accessTier({ ...garden, ringRank: 5 }, now)).toBe("garden");
  });

  it("gives the book at Pillar, not before, with or without a plan", () => {
    expect(freeBook({ ...free, ringRank: 4 })).toBe(true);
    expect(freeBook({ ...free, ringRank: 3 })).toBe(false);
  });
});

describe("the seal: a ring for the level, a mark for the plan", () => {
  const garden = {
    subscribed: true,
    paypalSubscriptionId: "I-ABC",
    paypalPlanId: GARDEN_PLANS.garden,
    subscriptionStatus: "active",
    subscriptionRenewalDate: "2026-11-20T00:00:00Z",
  };

  it("shows the plan only while it is open", () => {
    expect(supporterStanding({ ...garden, ringRank: 2 }, now)).toMatchObject({ ringRank: 2, plan: "garden" });
    expect(supporterStanding({ ...garden, paypalPlanId: GARDEN_PLANS.deep_garden, ringRank: 0 }, now).plan).toBe("deep_garden");
    expect(supporterStanding({ ...garden, subscribed: false, ringRank: 4 }, now)).toMatchObject({ ringRank: 4, plan: null });
  });

  it("shows a bought Garden month as its plan", () => {
    const month = { subscribed: true, paypalSubscriptionId: null, paypalPlanId: GARDEN_PLANS.deep_garden, subscriptionRenewalDate: "2026-11-20T00:00:00Z" };
    expect(supporterStanding(month, now).plan).toBe("deep_garden");
  });

  it("gives a patron without a plan their ring and no plan mark", () => {
    const patron = { subscribed: true, paypalSubscriptionId: null, subscriptionRenewalDate: null, donated: 120 };
    expect(supporterStanding(patron, now)).toMatchObject({ ringRank: 3, plan: null });
  });

  it("gives the architect the Keystone ring", () => {
    const admin = { subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null, role: "admin" };
    expect(supporterStanding(admin, now).ringRank).toBe(5);
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
