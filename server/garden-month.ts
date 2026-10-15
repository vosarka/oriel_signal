/**
 * A month of Garden paid once, with no renewal. A one-time PayPal order, like
 * the Founder's Reading: money moves only when we capture on the Seeker's
 * return, and the month opens exactly once per order.
 */
import { ENV } from "./_core/env";
import { capturePaypalOrder, createPaypalOrder } from "./founders-reading-paypal";
import { getMonthOrder, grantGardenMonth, insertMonthOrder, markMonthOrderPaid } from "./garden-month-db";
import { supporterKind, type SupporterFields } from "../shared/supporter-access";
import { GARDEN_MONTH_DAYS, GARDEN_MONTH_PRICE_EUR, type GardenMonthPlan } from "../shared/garden-month";

const DAY_MS = 86_400_000;
const siteUrl = () => (ENV.appBaseUrl || "https://orielsignal.space").replace(/\/+$/, "");
const customId = (orderKey: string) => `garden-month-${orderKey}`;

type Seeker = SupporterFields & { id: number };

/**
 * When the month should end: thirty days on from whatever is already open, or
 * from today. A patron with no end date keeps having none.
 */
export function monthUntil(user: SupporterFields, now: Date = new Date()): Date | null {
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  if (supporterKind(user, now) === "patron" && !until) return null;
  const from = until && until > now ? until : now;
  return new Date(from.getTime() + GARDEN_MONTH_DAYS * DAY_MS);
}

/** Opens a PayPal order for one month of the plan; returns where to send the Seeker. */
export async function buyGardenMonth(user: Seeker, plan: GardenMonthPlan): Promise<string> {
  const priceEur = GARDEN_MONTH_PRICE_EUR[plan];
  // One order per click; the key ties the PayPal order to this Seeker and plan.
  const orderKey = `${user.id}-${plan}-${Date.now().toString(36)}`;
  const { paypalOrderId, approveUrl } = await createPaypalOrder({
    customId: customId(orderKey),
    description: plan === "deep_garden" ? "ORIEL Signal — one month of Deep Garden" : "ORIEL Signal — one month of Garden",
    priceEur,
    requestId: `garden-month-create-${orderKey}`,
    // Our own key rides back in the address, whatever PayPal adds to it.
    returnUrl: `${siteUrl()}/tiers?garden_month=return&order=${encodeURIComponent(customId(orderKey))}`,
    cancelUrl: `${siteUrl()}/tiers`,
  });
  await insertMonthOrder({ paypalOrderId, userId: user.id, plan, priceEur, customId: customId(orderKey) });
  return approveUrl;
}

/**
 * Captures the order the Seeker came back with and opens their month. Only
 * the call that marks the order paid opens it, so a reloaded return page
 * never opens a second month. A payment PayPal holds for review waits.
 */
export async function captureGardenMonth(
  user: Seeker,
  ref: string,
  now: Date = new Date()
): Promise<{ active: boolean; pending?: boolean }> {
  const order = await getMonthOrder(ref);
  if (!order || order.userId !== user.id) return { active: false };
  if (order.status === "paid") return { active: true };
  const paypalOrderId = order.paypalOrderId;

  const { captureId, pending } = await capturePaypalOrder({
    customId: order.customId,
    paypalOrderId,
    priceEur: order.priceEur,
    requestId: `garden-month-capture-${paypalOrderId}`,
  });
  if (pending) {
    console.warn(`[GardenMonth] order ${paypalOrderId} is held by PayPal for review; open it by hand once it settles`);
    return { active: false, pending: true };
  }
  if (await markMonthOrderPaid(paypalOrderId, captureId)) {
    await grantGardenMonth(user.id, order.plan, monthUntil(user, now));
  }
  return { active: true };
}
