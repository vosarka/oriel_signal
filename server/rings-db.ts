/**
 * Every query for the rings of the field, so rings-service stays testable.
 *
 * The tables create themselves, as intro_film_views does: RUN_MIGRATIONS is
 * off unless someone turns it on, and a column added to users instead would
 * break every read of users on a deploy that had not migrated.
 */
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import { ringContributions, ringGifts, ringStanding, users, type RingGift } from "../drizzle/schema";
import type { DrizzleDb } from "./_core/mysql";

let tablesReady: Promise<unknown> | null = null;

function ensureRingTables(db: DrizzleDb) {
  tablesReady ??= Promise.all([
    db.execute(sql`CREATE TABLE IF NOT EXISTS \`ring_standing\` (
      \`userId\` int NOT NULL,
      \`ringRank\` int NOT NULL,
      \`updatedAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY(\`userId\`)
    )`),
    db.execute(sql`CREATE TABLE IF NOT EXISTS \`ring_contributions\` (
      \`paypalPaymentId\` varchar(64) NOT NULL,
      \`userId\` int NOT NULL,
      \`amountEur\` double NOT NULL,
      \`source\` enum('subscription','garden_month') NOT NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(\`paypalPaymentId\`),
      KEY \`idx_ring_contributions_user\` (\`userId\`)
    )`),
    db.execute(sql`CREATE TABLE IF NOT EXISTS \`ring_gifts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`ringRank\` int NOT NULL,
      \`kind\` enum('founders_reading','garden_month') NULL,
      \`token\` varchar(48) NULL,
      \`redeemedBy\` int NULL,
      \`redeemedAt\` timestamp NULL,
      \`createdAt\` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY(\`id\`),
      UNIQUE KEY \`ring_gifts_token_unique\` (\`token\`),
      KEY \`idx_ring_gifts_user\` (\`userId\`)
    )`),
  ]).catch(error => {
    tablesReady = null;
    throw error;
  });
  return tablesReady;
}

export async function ringDb(): Promise<DrizzleDb> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await ensureRingTables(db);
  return db;
}

export function affectedRows(result: unknown): number {
  const header = Array.isArray(result) ? result[0] : result;
  return Number((header as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
}

/** Donations plus every Garden payment, in euros. */
export async function ringTotalOf(userId: number): Promise<number> {
  const db = await ringDb();
  const [user] = await db.select({ donated: users.donated }).from(users).where(eq(users.id, userId)).limit(1);
  const [sum] = await db
    .select({ total: sql<number>`COALESCE(SUM(${ringContributions.amountEur}), 0)` })
    .from(ringContributions)
    .where(eq(ringContributions.userId, userId));
  return Number(user?.donated ?? 0) + Number(sum?.total ?? 0);
}

/** Null when this Seeker has never been settled. */
export async function storedRing(userId: number): Promise<number | null> {
  const db = await ringDb();
  const [row] = await db
    .select({ ringRank: ringStanding.ringRank })
    .from(ringStanding)
    .where(eq(ringStanding.userId, userId))
    .limit(1);
  return row ? row.ringRank : null;
}

/** True only for the request that wrote the first ring. */
export async function insertRingIfAbsent(userId: number, rank: number): Promise<boolean> {
  const db = await ringDb();
  return affectedRows(await db.insert(ringStanding).ignore().values({ userId, ringRank: rank })) === 1;
}

/** True only for the request that raised it; a lower rank never applies. */
export async function raiseRing(userId: number, rank: number): Promise<boolean> {
  const db = await ringDb();
  const result = await db.execute(
    sql`UPDATE \`ring_standing\` SET \`ringRank\` = ${rank} WHERE \`userId\` = ${userId} AND \`ringRank\` < ${rank}`
  );
  return affectedRows(result) === 1;
}

export async function insertGift(userId: number, ringRank: number): Promise<void> {
  const db = await ringDb();
  await db.insert(ringGifts).values({ userId, ringRank });
}

/** The Seeker a PayPal subscription belongs to, or null. */
export async function userIdForSubscription(subscriptionId: string): Promise<number | null> {
  const db = await ringDb();
  const [row] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.paypalSubscriptionId, subscriptionId))
    .limit(1);
  return row?.id ?? null;
}

/** True only the first time PayPal tells us of this payment. */
export async function addContribution(row: {
  paypalPaymentId: string;
  userId: number;
  amountEur: number;
  source: "subscription" | "garden_month";
}): Promise<boolean> {
  const db = await ringDb();
  return affectedRows(await db.insert(ringContributions).ignore().values(row)) === 1;
}

// ─── Gifts ───────────────────────────────────────────────────────────────

export type GiftKind = "founders_reading" | "garden_month";

export async function getGift(id: number): Promise<RingGift | null> {
  const db = await ringDb();
  const [row] = await db.select().from(ringGifts).where(eq(ringGifts.id, id)).limit(1);
  return row ?? null;
}

export async function getGiftByToken(token: string): Promise<RingGift | null> {
  const db = await ringDb();
  const [row] = await db.select().from(ringGifts).where(eq(ringGifts.token, token)).limit(1);
  return row ?? null;
}

/** True only for the request that chose this gift's kind and link. */
export async function claimGiftRow(id: number, userId: number, kind: GiftKind, token: string): Promise<boolean> {
  const db = await ringDb();
  const result = await db
    .update(ringGifts)
    .set({ kind, token })
    .where(and(eq(ringGifts.id, id), eq(ringGifts.userId, userId), isNull(ringGifts.token)));
  return affectedRows(result) === 1;
}

/** True only for the one receiver who opened it first. */
export async function markGiftRedeemed(token: string, userId: number): Promise<boolean> {
  const db = await ringDb();
  const result = await db
    .update(ringGifts)
    .set({ redeemedBy: userId, redeemedAt: new Date() })
    .where(and(eq(ringGifts.token, token), isNull(ringGifts.redeemedAt)));
  return affectedRows(result) === 1;
}

/** Hands the gift back to its link when granting it failed. */
export async function clearGiftRedeemed(token: string): Promise<void> {
  const db = await ringDb();
  await db.update(ringGifts).set({ redeemedBy: null, redeemedAt: null }).where(eq(ringGifts.token, token));
}

export async function listGifts(userId: number): Promise<RingGift[]> {
  const db = await ringDb();
  return db.select().from(ringGifts).where(eq(ringGifts.userId, userId)).orderBy(desc(ringGifts.createdAt));
}

export async function nameOf(userId: number): Promise<string | null> {
  const db = await ringDb();
  const [row] = await db.select({ name: users.name }).from(users).where(eq(users.id, userId)).limit(1);
  return row?.name ?? null;
}
