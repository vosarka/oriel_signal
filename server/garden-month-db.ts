/** Every query for a month of Garden bought once, so the service stays testable. */
import { and, eq, or } from "drizzle-orm";
import { getDb } from "./db";
import { gardenMonthOrders, users, type GardenMonthOrder } from "../drizzle/schema";
import { GARDEN_PLANS, supporterKind } from "../shared/supporter-access";
import type { GardenMonthPlan } from "../shared/garden-month";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function insertMonthOrder(values: {
  paypalOrderId: string;
  userId: number;
  plan: GardenMonthPlan;
  priceEur: number;
  customId: string;
}): Promise<void> {
  const db = await requireDb();
  await db.insert(gardenMonthOrders).values(values);
}

/** By PayPal's order id, or by the custom id we put in the return address. */
export async function getMonthOrder(ref: string): Promise<GardenMonthOrder | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(gardenMonthOrders)
    .where(or(eq(gardenMonthOrders.paypalOrderId, ref), eq(gardenMonthOrders.customId, ref)))
    .limit(1);
  return row ?? null;
}

/** True only for the call that turns this order from created to paid. */
export async function markMonthOrderPaid(paypalOrderId: string, captureId: string): Promise<boolean> {
  const db = await requireDb();
  const [result] = await db
    .update(gardenMonthOrders)
    .set({ status: "paid", captureId, paidAt: new Date() })
    .where(and(eq(gardenMonthOrders.paypalOrderId, paypalOrderId), eq(gardenMonthOrders.status, "created")));
  return Number((result as { affectedRows?: number })?.affectedRows ?? 0) === 1;
}

/**
 * Open the plot: a patron holding that Garden plan until the date given (or
 * open-ended, for a patron who already had no end). A running PayPal
 * subscription is left to PayPal. One that was cancelled and has closed is
 * not running: its id is cleared, or the month would never open (nothing
 * else ever clears it).
 */
export async function grantGardenMonth(userId: number, plan: GardenMonthPlan, until: Date | null): Promise<void> {
  const db = await requireDb();
  const planId = GARDEN_PLANS[plan];
  const [user] = await db
    .select({
      subscribed: users.subscribed,
      paypalSubscriptionId: users.paypalSubscriptionId,
      subscriptionStatus: users.subscriptionStatus,
      subscriptionRenewalDate: users.subscriptionRenewalDate,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user || (user.paypalSubscriptionId && supporterKind(user) === "garden")) return;
  await db
    .update(users)
    .set({
      subscribed: true,
      subscriptionStatus: "active",
      paypalSubscriptionId: null,
      paypalPlanId: planId,
      subscriptionRenewalDate: until,
    })
    .where(eq(users.id, userId));
}
