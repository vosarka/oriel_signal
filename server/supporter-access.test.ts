import { describe, expect, it } from "vitest";
import { supporterKind } from "../shared/supporter-access";

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
