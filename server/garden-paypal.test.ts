import { beforeEach, describe, expect, it, vi } from "vitest";

const handlePayPalWebhook = vi.hoisted(() => vi.fn());
vi.mock("./paypal-webhook", () => ({ handlePayPalWebhook }));
vi.mock("./_core/env", () => ({
  ENV: {
    paypalApiBaseUrl: "https://paypal.test",
    paypalClientId: "id",
    paypalClientSecret: "secret",
    appBaseUrl: "https://orielsignal.space",
  },
}));

import { confirmGardenSubscription, startGardenSubscription } from "./garden-paypal";
import { GARDEN_PLANS } from "../shared/supporter-access";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

/** A PayPal that hands out a token, then answers the next call with `next`. */
function paypal(next: unknown) {
  return vi.fn(async (url: string, _init?: RequestInit) =>
    String(url).endsWith("/v1/oauth2/token") ? json({ access_token: "t" }) : json(next)
  );
}

describe("the Garden's PayPal subscriptions", () => {
  beforeEach(() => handlePayPalWebhook.mockReset());

  it("creates the subscription for this account and returns the approval link", async () => {
    const fetch = paypal({ links: [{ rel: "approve", href: "https://paypal.test/approve" }] });
    await expect(startGardenSubscription(12, "deep_garden", fetch as never)).resolves.toBe(
      "https://paypal.test/approve"
    );
    const body = JSON.parse(String(fetch.mock.calls[1][1]?.body));
    expect(body).toMatchObject({
      plan_id: GARDEN_PLANS.deep_garden,
      custom_id: "user-12",
      application_context: { return_url: "https://orielsignal.space/tiers?garden=return" },
    });
  });

  const active = {
    id: "I-ABCDEF123",
    status: "ACTIVE",
    custom_id: "user-12",
    plan_id: GARDEN_PLANS.deep_garden,
  };

  it("opens the plot on return when the subscription is active, ours, and a Garden plan", async () => {
    await expect(confirmGardenSubscription(12, "I-ABCDEF123", paypal(active) as never)).resolves.toBe(true);
    expect(handlePayPalWebhook).toHaveBeenCalledWith(
      expect.objectContaining({ event_type: "BILLING.SUBSCRIPTION.ACTIVATED", resource: active })
    );
  });

  it.each([
    ["someone else's subscription", { ...active, custom_id: "user-13" }],
    ["a subscription not yet active", { ...active, status: "APPROVAL_PENDING" }],
    ["a plan that is not the Garden", { ...active, plan_id: "P-9HN985960E219772PNEYJ2XI" }],
  ])("refuses %s", async (_label, sub) => {
    await expect(confirmGardenSubscription(12, "I-ABCDEF123", paypal(sub) as never)).resolves.toBe(false);
    expect(handlePayPalWebhook).not.toHaveBeenCalled();
  });

  it("never calls PayPal with a malformed subscription id", async () => {
    const fetch = paypal(active);
    await expect(confirmGardenSubscription(12, "../v1/other", fetch as never)).resolves.toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });
});
