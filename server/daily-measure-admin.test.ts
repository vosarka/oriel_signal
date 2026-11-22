import { describe, expect, it, vi } from "vitest";

vi.mock("./db", () => ({ getDb: vi.fn() }));

import { limitsFor } from "./daily-measure";

describe("the architect's measure", () => {
  it("has no limit, now that Pillar has one", () => {
    const admin = { id: 1, role: "admin", subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null };
    expect(limitsFor(admin).messagesPerDay).toBe(Infinity);
    expect(limitsFor(admin).voicePerDay).toBe(Infinity);
  });
});

describe("spoken replies follow the messages", () => {
  it("gives a free Seeker with a Keeper ring the ring's messages but no voice", () => {
    const free = { id: 2, subscribed: false, paypalSubscriptionId: null, subscriptionRenewalDate: null, ringRank: 2 };
    expect(limitsFor(free)).toMatchObject({ messagesPerDay: 14, voicePerDay: 0 });
  });

  it("gives a Garden member 150 spoken replies, not 20", () => {
    const garden = {
      id: 3,
      subscribed: true,
      paypalSubscriptionId: "I-ABC",
      subscriptionStatus: "active",
      subscriptionRenewalDate: "2099-01-01T00:00:00Z",
      ringRank: 0,
    };
    expect(limitsFor(garden).voicePerDay).toBe(150);
  });
});
