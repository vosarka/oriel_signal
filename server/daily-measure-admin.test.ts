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
