/**
 * Patrons: supporters Vos marks by hand in /admin. Donations through the
 * site's hosted PayPal button never reached the database, so this is the
 * only way to recognise them until donations are wired to accounts.
 */
import { and, desc, eq, isNull, like, ne, or } from "drizzle-orm";
import { getDb } from "./db";
import { paypalSubscriptionStatus } from "./garden-paypal";
import { users } from "../drizzle/schema";
import { supporterKind } from "../shared/supporter-access";
import { supporterLabel } from "../shared/supporter-standing";

const FIELDS = {
  id: users.id,
  name: users.name,
  email: users.email,
  subscribed: users.subscribed,
  paypalSubscriptionId: users.paypalSubscriptionId,
  paypalPlanId: users.paypalPlanId,
  subscriptionStatus: users.subscriptionStatus,
  subscriptionRenewalDate: users.subscriptionRenewalDate,
  donated: users.donated,
};

function withKind<T extends Parameters<typeof supporterKind>[0]>(row: T) {
  const kind = supporterKind(row);
  return {
    ...row,
    kind,
    lapsed: Boolean(row.subscribed && !kind),
    // The same name the Seeker sees on their profile: Supporter for a key.
    tier: supporterLabel(row),
  };
}

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

/** Everyone marked subscribed, including lapsed keys, newest end date first. */
export async function listSupporters() {
  const db = await requireDb();
  const rows = await db
    .select(FIELDS)
    .from(users)
    .where(eq(users.subscribed, true))
    .orderBy(desc(users.subscriptionRenewalDate), users.email);
  return rows.map(withKind);
}

/** Up to ten accounts whose email or name contains the query. */
export async function findAccounts(query: string) {
  const q = query.trim();
  if (q.length < 3) return [];
  const db = await requireDb();
  const rows = await db
    .select(FIELDS)
    .from(users)
    .where(or(like(users.email, `%${q}%`), like(users.name, `%${q}%`)))
    .limit(10);
  return rows.map(withKind);
}

/** No running PayPal subscription: never had one, or it was cancelled or expired. */
const noRunningSubscription = () =>
  or(isNull(users.paypalSubscriptionId), ne(users.subscriptionStatus, "active"));

/**
 * Mark a patron, open-ended or until a date. Leaves running Garden members
 * alone; a cancelled one's old subscription id is cleared so it cannot read
 * as a Garden again.
 */
export async function markPatron(userId: number, until: Date | null) {
  const db = await requireDb();
  await db
    .update(users)
    .set({ subscribed: true, subscriptionStatus: "active", subscriptionRenewalDate: until, paypalSubscriptionId: null })
    .where(and(eq(users.id, userId), noRunningSubscription()));
}

/**
 * Remove patron or Garden standing. A Garden our database still calls active
 * is checked with PayPal first: if PayPal is still billing it, nothing
 * changes (cancel it in PayPal); anything else — cancelled, expired, an
 * abandoned checkout, unknown — means the cancellation never reached us, so
 * the Garden closes now.
 */
export async function unmarkPatron(
  userId: number,
  readStatus: (subscriptionId: string) => Promise<string | null> = paypalSubscriptionStatus
): Promise<"removed" | "still_billing"> {
  const db = await requireDb();
  const [row] = await db
    .select({ subscriptionId: users.paypalSubscriptionId, status: users.subscriptionStatus })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (row?.subscriptionId && row.status === "active" && (await readStatus(row.subscriptionId)) === "ACTIVE") {
    return "still_billing";
  }
  await db
    .update(users)
    .set({ subscribed: false, subscriptionStatus: "free", subscriptionRenewalDate: null, paypalPlanId: null, paypalSubscriptionId: null })
    .where(eq(users.id, userId));
  return "removed";
}

/**
 * Set the total a person has donated, in euros. Donations through the old
 * hosted button never reached accounts, so Vos enters them here; the
 * patron level follows the total.
 */
export async function setDonated(userId: number, amount: number) {
  const db = await requireDb();
  await db.update(users).set({ donated: amount }).where(eq(users.id, userId));
  // A higher total may cross a ring (and bring its gift); a lower one never
  // takes a ring back. The total is saved either way.
  try {
    const { settleRing } = await import("./rings-service");
    await settleRing(userId);
  } catch (error) {
    console.error(`[Patrons] could not settle the ring of user ${userId}:`, error);
  }
}
