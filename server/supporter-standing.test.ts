import { describe, expect, it } from "vitest";
import { supporterStanding } from "../shared/supporter-standing";
import { GARDEN_PLANS } from "../shared/supporter-access";

const now = new Date("2026-10-15T12:00:00Z");
const free = { subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null, donated: 0 };
const patron = { subscribed: true, paypalSubscriptionId: null, subscriptionRenewalDate: null };

describe("supporterStanding", () => {
  it("shows a free Seeker their daily measure, with no seal", () => {
    const s = supporterStanding(free, now);
    expect(s).toMatchObject({ tier: "free", label: "Free", seal: 0, messagesPerDay: 4, voicePerDay: 4, next: null });
  });

  it("gives a patron their level, what it opens, and how far the next one is", () => {
    const s = supporterStanding({ ...patron, donated: 280 }, now);
    expect(s).toMatchObject({ tier: "keeper", label: "Keeper", kind: "patron", donated: 280, seal: 2 });
    expect(s.next).toEqual({ label: "Steward", above: 400, remaining: 120 });
  });

  it("starts a small gift at Seed, with Keeper ahead", () => {
    const s = supporterStanding({ ...patron, donated: 20 }, now);
    expect(s).toMatchObject({ tier: "seed", seal: 1 });
    expect(s.next).toEqual({ label: "Keeper", above: 100, remaining: 80 });
  });

  it("crowns a Pillar with the full seal and nothing further", () => {
    const s = supporterStanding({ ...patron, donated: 1500 }, now);
    expect(s).toMatchObject({ tier: "pillar", seal: 4, next: null, messagesPerDay: Infinity });
  });

  it("tells a 30-day key when it ends", () => {
    const s = supporterStanding({ ...patron, donated: 30, subscriptionRenewalDate: "2026-11-01T00:00:00Z" }, now);
    expect(s.endsOn?.toISOString()).toBe("2026-11-01T00:00:00.000Z");
  });

  it("shows a Garden member their plan and renewal, and a cancelled one when it closes", () => {
    const garden = {
      subscribed: true,
      paypalSubscriptionId: "I-ABC",
      paypalPlanId: GARDEN_PLANS.deep_garden,
      subscriptionStatus: "active",
      subscriptionRenewalDate: "2026-11-02T00:00:00Z",
      donated: 0,
    };
    expect(supporterStanding(garden, now)).toMatchObject({ tier: "deep_garden", label: "Deep Garden", kind: "garden", seal: 3, cancelled: false });
    expect(supporterStanding(garden, now).renewsOn?.toISOString()).toBe("2026-11-02T00:00:00.000Z");
    const cancelled = supporterStanding({ ...garden, subscriptionStatus: "cancelled" }, now);
    expect(cancelled).toMatchObject({ cancelled: true, renewsOn: null });
    expect(cancelled.endsOn?.toISOString()).toBe("2026-11-02T00:00:00.000Z");
  });

  it("gives the architect the full seal", () => {
    expect(supporterStanding({ ...free, role: "admin" }, now)).toMatchObject({ label: "Architect", seal: 4 });
  });
});
