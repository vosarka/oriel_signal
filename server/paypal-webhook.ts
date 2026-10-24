import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, sql } from "drizzle-orm";

/**
 * PayPal webhook event types
 */
export type PayPalWebhookEvent =
  | "BILLING.SUBSCRIPTION.CREATED"
  | "BILLING.SUBSCRIPTION.UPDATED"
  | "BILLING.SUBSCRIPTION.ACTIVATED"
  | "BILLING.SUBSCRIPTION.CANCELLED"
  | "BILLING.SUBSCRIPTION.EXPIRED"
  | "BILLING.SUBSCRIPTION.SUSPENDED"
  | "PAYMENT.CAPTURE.COMPLETED"
  | "PAYMENT.CAPTURE.REFUNDED"
  /** Each payment of a Garden subscription. Must be ticked in PayPal's dashboard. */
  | "PAYMENT.SALE.COMPLETED";

/**
 * PayPal webhook event payload
 */
export interface PayPalWebhookPayload {
  id: string;
  event_type: PayPalWebhookEvent;
  resource: {
    id: string;
    status: string;
    subscriber?: {
      email_address: string;
    };
    custom_id?: string;
    /** The plan of a subscription: tells Garden from Deep Garden. */
    plan_id?: string;
    start_time?: string;
    billing_info?: {
      next_billing_time?: string;
      last_payment?: { time?: string };
    };
    /** The subscription a PAYMENT.SALE.COMPLETED belongs to. */
    billing_agreement_id?: string;
    /**
     * Captures carry value/currency_code; sales (the older API that
     * subscription payments still use) carry total/currency.
     */
    amount?: {
      value?: string;
      currency_code?: string;
      total?: string;
      currency?: string;
    };
    billing_cycles?: Array<{
      pricing_scheme?: {
        fixed_price?: {
          value: string;
          currency_code: string;
        };
      };
    }>;
  };
  create_time: string;
}

/**
 * Handle PayPal webhook events
 */
export async function handlePayPalWebhook(
  payload: PayPalWebhookPayload
): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[PayPal Webhook] Database not available");
    return;
  }

  const subscriptionId = payload.resource.id;
  const eventType = payload.event_type;

  console.log(
    `[PayPal Webhook] Processing event: ${eventType} for subscription: ${subscriptionId}`
  );

  try {
    switch (eventType) {
      case "BILLING.SUBSCRIPTION.CREATED":
        await handleSubscriptionCreated(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.ACTIVATED":
        await handleSubscriptionActivated(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.UPDATED":
        await handleSubscriptionUpdated(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.CANCELLED":
        await handleSubscriptionCancelled(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.EXPIRED":
        await handleSubscriptionExpired(db, payload);
        break;

      case "BILLING.SUBSCRIPTION.SUSPENDED":
        await handleSubscriptionSuspended(db, payload);
        break;

      case "PAYMENT.CAPTURE.COMPLETED":
        await handlePaymentCompleted(db, payload);
        break;

      case "PAYMENT.CAPTURE.REFUNDED":
        await handlePaymentRefunded(db, payload);
        break;
      case "PAYMENT.SALE.COMPLETED":
        await handleSaleCompleted(payload);
        break;

      default:
        console.log(`[PayPal Webhook] Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(
      `[PayPal Webhook] Error processing event: ${eventType}`,
      error
    );
    throw error;
  }
}

/**
 * Handle subscription creation
 */
async function handleSubscriptionCreated(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(
      `[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`
    );
    return;
  }

  // Parse custom_id format: "user-{userId}"
  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  // Update user subscription in database
  await db
    .update(users)
    .set({
      paypalSubscriptionId: subscriptionId,
      subscriptionStatus: "free", // Will be activated on BILLING.SUBSCRIPTION.ACTIVATED
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription created for user ${userId}`);
}

/**
 * Handle subscription activation
 */
async function handleSubscriptionActivated(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(
      `[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`
    );
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);
  const startTime = payload.resource.start_time
    ? new Date(payload.resource.start_time)
    : new Date();
  const renewalDate = new Date(startTime);
  renewalDate.setMonth(renewalDate.getMonth() + 1);

  await db
    .update(users)
    .set({
      subscriptionStatus: "active",
      paypalSubscriptionId: subscriptionId,
      paypalPlanId: payload.resource.plan_id ?? null,
      subscriptionStartDate: startTime,
      subscriptionRenewalDate: renewalDate,
      subscribed: true,
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription activated for user ${userId}`);
}

/**
 * Handle subscription update
 */
async function handleSubscriptionUpdated(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;
  const status = payload.resource.status;

  if (!customId) {
    console.warn(
      `[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`
    );
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  // Map PayPal status to our subscription status
  let subscriptionStatus = "active";
  if (status === "SUSPENDED") {
    subscriptionStatus = "cancelled";
  } else if (status === "EXPIRED") {
    subscriptionStatus = "expired";
  }

  await db
    .update(users)
    .set({
      subscriptionStatus,
    })
    .where(eq(users.id, userId));

  console.log(
    `[PayPal Webhook] Subscription updated for user ${userId}, status: ${subscriptionStatus}`
  );
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionCancelled(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(
      `[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`
    );
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  // The month already paid for stays open; supporterKind closes it when
  // this date passes. Without a last payment there is nothing to honour.
  const lastPayment = payload.resource.billing_info?.last_payment?.time;
  const paidThrough = lastPayment ? new Date(lastPayment) : null;
  paidThrough?.setMonth(paidThrough.getMonth() + 1);

  await db
    .update(users)
    .set(
      paidThrough && paidThrough > new Date()
        ? { subscriptionStatus: "cancelled", subscriptionRenewalDate: paidThrough }
        : { subscriptionStatus: "cancelled", subscribed: false }
    )
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription cancelled for user ${userId}`);
}

/**
 * Handle subscription expiration
 */
async function handleSubscriptionExpired(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(
      `[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`
    );
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  await db
    .update(users)
    .set({
      subscriptionStatus: "expired",
      subscribed: false,
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription expired for user ${userId}`);
}

/**
 * Handle subscription suspension
 */
async function handleSubscriptionSuspended(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const subscriptionId = payload.resource.id;
  const customId = payload.resource.custom_id;

  if (!customId) {
    console.warn(
      `[PayPal Webhook] No custom_id found for subscription ${subscriptionId}`
    );
    return;
  }

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) {
    console.warn(`[PayPal Webhook] Invalid custom_id format: ${customId}`);
    return;
  }

  const userId = parseInt(userIdMatch[1], 10);

  await db
    .update(users)
    .set({
      subscriptionStatus: "cancelled",
      subscribed: false,
    })
    .where(eq(users.id, userId));

  console.log(`[PayPal Webhook] Subscription suspended for user ${userId}`);
}

/**
 * Handle payment completion — increment donated total on the user record.
 * PayPal sets custom_id on the subscription resource; for capture events the
 * payer is identified via the linked subscription's custom_id.
 */
async function handlePaymentCompleted(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  const amount = parseFloat(payload.resource.amount?.value ?? "0");
  const customId = payload.resource.custom_id;

  console.log(
    `[PayPal Webhook] Payment completed: ${payload.resource.id}, amount: ${amount}`
  );

  if (!customId || amount <= 0) return;

  const userIdMatch = customId.match(/user-(\d+)/);
  if (!userIdMatch) return;

  const userId = parseInt(userIdMatch[1], 10);

  // Atomically increment cumulative donated total
  await db
    .update(users)
    .set({ donated: sql`donated + ${amount}` })
    .where(eq(users.id, userId));

  console.log(
    `[PayPal Webhook] Recorded $${amount} donation for user ${userId}`
  );

  // The donation is already counted. A ring that cannot be settled now must
  // not fail the webhook: PayPal would send it again and the increment above
  // would count it twice. The Seeker's next visit settles the ring.
  try {
    const { settleRing } = await import("./rings-service");
    await settleRing(userId);
  } catch (error) {
    console.error(`[PayPal Webhook] Could not settle the ring of user ${userId}:`, error);
  }
}

/** A Garden payment, read off a PAYMENT.SALE.COMPLETED; null for anything else. */
export function saleContribution(
  payload: PayPalWebhookPayload
): { paymentId: string; subscriptionId: string; amountEur: number } | null {
  const { id, billing_agreement_id: subscriptionId, amount } = payload.resource;
  const amountEur = parseFloat(amount?.total ?? "");
  // The rings are counted in euros; a sale in any other currency is left out
  // rather than counted at the wrong value.
  if (!id || !subscriptionId || !(amountEur > 0) || amount?.currency !== "EUR") return null;
  return { paymentId: id, subscriptionId, amountEur };
}

/**
 * Every Garden payment climbs the Seeker's ring. Keyed by PayPal's payment
 * id, so a webhook PayPal sends again is counted once.
 */
export async function handleSaleCompleted(payload: PayPalWebhookPayload): Promise<void> {
  const sale = saleContribution(payload);
  if (!sale) {
    console.log(`[PayPal Webhook] Sale ${payload.resource.id} is not a Garden payment in EUR; not counted`);
    return;
  }
  const { addContribution, userIdForSubscription } = await import("./rings-db");
  const userId = await userIdForSubscription(sale.subscriptionId);
  if (!userId) {
    // PayPal can send the first payment before the subscription is linked to
    // an account. Failing makes PayPal send it again (for up to three days)
    // instead of dropping it for good.
    throw new Error(`Sale ${sale.paymentId}: subscription ${sale.subscriptionId} is not linked to an account yet`);
  }
  const fresh = await addContribution({
    paypalPaymentId: sale.paymentId,
    userId,
    amountEur: sale.amountEur,
    source: "subscription",
  });
  if (!fresh) return;
  const { settleRing } = await import("./rings-service");
  await settleRing(userId);
  console.log(`[PayPal Webhook] Counted €${sale.amountEur} toward the ring of user ${userId}`);
}

/**
 * Handle payment refund
 */
async function handlePaymentRefunded(
  db: any,
  payload: PayPalWebhookPayload
): Promise<void> {
  console.log(`[PayPal Webhook] Payment refunded: ${payload.resource.id}`);
  // Additional refund processing logic can be added here
}
