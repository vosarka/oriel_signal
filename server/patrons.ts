/**
 * Patrons: supporters Vos marks by hand in /admin. Donations through the
 * site's hosted PayPal button never reached the database, so this is the
 * only way to recognise them until donations are wired to accounts.
 */
import { and, desc, eq, isNull, like, or } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { supporterKind } from "../shared/supporter-access";

const FIELDS = {
  id: users.id,
  name: users.name,
  email: users.email,
  subscribed: users.subscribed,
  paypalSubscriptionId: users.paypalSubscriptionId,
  subscriptionRenewalDate: users.subscriptionRenewalDate,
};

function withKind<T extends Parameters<typeof supporterKind>[0]>(row: T) {
  return { ...row, kind: supporterKind(row), lapsed: row.subscribed && !supporterKind(row) };
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

/** Mark a patron, open-ended or until a date. Leaves Garden members alone. */
export async function markPatron(userId: number, until: Date | null) {
  const db = await requireDb();
  await db
    .update(users)
    .set({ subscribed: true, subscriptionStatus: "active", subscriptionRenewalDate: until })
    .where(and(eq(users.id, userId), isNull(users.paypalSubscriptionId)));
}

/** Remove patron standing. A Garden member is cancelled in PayPal, not here. */
export async function unmarkPatron(userId: number) {
  const db = await requireDb();
  await db
    .update(users)
    .set({ subscribed: false, subscriptionStatus: "free", subscriptionRenewalDate: null })
    .where(and(eq(users.id, userId), isNull(users.paypalSubscriptionId)));
}
