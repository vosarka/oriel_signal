import { ENV } from "./_core/env";
import { GARDEN_PLANS } from "../shared/supporter-access";
import { handlePayPalWebhook, type PayPalWebhookPayload } from "./paypal-webhook";

/**
 * The Garden's two PayPal subscriptions. The server creates each one with
 * `custom_id: user-N`, so the account is known before PayPal ever answers,
 * and confirms it on return so access opens without waiting on the webhook.
 */

export type GardenPlan = keyof typeof GARDEN_PLANS;

type Fetch = typeof fetch;

async function accessToken(fetchImpl: Fetch): Promise<string> {
  const credentials = Buffer.from(`${ENV.paypalClientId}:${ENV.paypalClientSecret}`).toString("base64");
  const res = await fetchImpl(`${ENV.paypalApiBaseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  const body = (await res.json().catch(() => null)) as { access_token?: string } | null;
  if (!res.ok || !body?.access_token) throw new Error(`PayPal token request failed (${res.status})`);
  return body.access_token;
}

const siteUrl = () => (ENV.appBaseUrl || "https://orielsignal.space").replace(/\/+$/, "");

/** Creates the subscription and returns PayPal's approval link. */
export async function startGardenSubscription(
  userId: number,
  plan: GardenPlan,
  fetchImpl: Fetch = fetch
): Promise<string> {
  const planId = GARDEN_PLANS[plan];
  if (!planId) throw new Error(`The ${plan} plan is not open yet`);
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(`${ENV.paypalApiBaseUrl}/v1/billing/subscriptions`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      plan_id: planId,
      custom_id: `user-${userId}`,
      application_context: {
        brand_name: "ORIEL Signal",
        user_action: "SUBSCRIBE_NOW",
        shipping_preference: "NO_SHIPPING",
        return_url: `${siteUrl()}/tiers?garden=return`,
        cancel_url: `${siteUrl()}/tiers`,
      },
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    links?: Array<{ rel: string; href: string }>;
  } | null;
  const approve = body?.links?.find(l => l.rel === "approve")?.href;
  if (!res.ok || !approve) throw new Error(`PayPal subscription request failed (${res.status})`);
  return approve;
}

/**
 * Reads the subscription PayPal returned the Seeker with and, when it is
 * active, belongs to this account and is one of the Garden plans, opens the
 * Garden through the same path the signed webhook uses.
 */
export async function confirmGardenSubscription(
  userId: number,
  subscriptionId: string,
  fetchImpl: Fetch = fetch
): Promise<boolean> {
  if (!/^I-[A-Z0-9]{6,32}$/.test(subscriptionId)) return false;
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(
    `${ENV.paypalApiBaseUrl}/v1/billing/subscriptions/${subscriptionId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  if (!res.ok) return false;
  const sub = (await res.json()) as PayPalWebhookPayload["resource"];
  const ours =
    sub.status === "ACTIVE" &&
    sub.custom_id === `user-${userId}` &&
    (Object.values(GARDEN_PLANS) as string[]).includes(sub.plan_id ?? "");
  if (!ours || !sub.plan_id) return false;
  await handlePayPalWebhook({
    id: `return-${subscriptionId}`,
    event_type: "BILLING.SUBSCRIPTION.ACTIVATED",
    resource: sub,
    create_time: new Date().toISOString(),
  });
  return true;
}
