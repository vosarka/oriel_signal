/** Every query on personal_transmissions, so the service stays testable. */
import { and, asc, desc, eq, getTableColumns, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  personalTransmissions,
  type InsertPersonalTransmission,
  type PersonalTransmission,
} from "../drizzle/schema";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function insertTransmission(
  values: InsertPersonalTransmission
): Promise<PersonalTransmission> {
  const db = await requireDb();
  await db.insert(personalTransmissions).values(values);
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(eq(personalTransmissions.accessToken, values.accessToken))
    .limit(1);
  return row;
}

export async function getTransmission(id: number): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(eq(personalTransmissions.id, id))
    .limit(1);
  return row ?? null;
}

/** Every column except the voice, which is megabytes. */
const { audioBase64: _audio, ...light } = getTableColumns(personalTransmissions);

/** A row without its voice, plus whether it has one. */
export async function getTransmissionByToken(token: string) {
  const db = await requireDb();
  const [row] = await db
    .select({ ...light, hasAudio: sql<number>`${personalTransmissions.audioBase64} IS NOT NULL` })
    .from(personalTransmissions)
    .where(eq(personalTransmissions.accessToken, token))
    .limit(1);
  return row ? { ...row, hasAudio: Boolean(row.hasAudio) } : null;
}

export async function getAudioByToken(token: string) {
  const db = await requireDb();
  const [row] = await db
    .select({ status: personalTransmissions.status, audioBase64: personalTransmissions.audioBase64 })
    .from(personalTransmissions)
    .where(eq(personalTransmissions.accessToken, token))
    .limit(1);
  return row ?? null;
}

export async function updateTransmission(
  id: number,
  patch: Partial<InsertPersonalTransmission>
): Promise<void> {
  const db = await requireDb();
  await db.update(personalTransmissions).set(patch).where(eq(personalTransmissions.id, id));
}

export async function countPaidPurchases(): Promise<number> {
  const db = await requireDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(personalTransmissions)
    .where(and(eq(personalTransmissions.source, "purchase"), isNotNull(personalTransmissions.paidAt)));
  return Number(row?.n ?? 0);
}

/**
 * The admin queue's raw rows: drops abandoned checkouts older than a week
 * and deliveries older than a month. adminQueue() in the service orders
 * and filters precisely; no row cap, since a cap hid new requests.
 */
export async function listForAdmin() {
  const db = await requireDb();
  return db
    .select({ ...light, hasAudio: sql<boolean>`${personalTransmissions.audioBase64} IS NOT NULL` })
    .from(personalTransmissions)
    .where(
      sql`NOT (${personalTransmissions.status} = 'pending_payment' AND ${personalTransmissions.createdAt} < NOW() - INTERVAL 7 DAY)
        AND NOT (${personalTransmissions.status} = 'delivered' AND ${personalTransmissions.deliveredAt} < NOW() - INTERVAL 30 DAY)`
    )
    .orderBy(asc(personalTransmissions.createdAt));
}

export async function getMonthly(userId: number, period: string): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(and(eq(personalTransmissions.userId, userId), eq(personalTransmissions.period, period)))
    .limit(1);
  return row ?? null;
}

export async function hasMirror(userId: number): Promise<boolean> {
  const db = await requireDb();
  const [row] = await db
    .select({ id: personalTransmissions.id })
    .from(personalTransmissions)
    .where(
      and(
        eq(personalTransmissions.userId, userId),
        eq(personalTransmissions.kind, "mirror"),
        sql`${personalTransmissions.status} <> 'pending_payment'`
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function getEcho(period: string): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(
      and(
        isNull(personalTransmissions.userId),
        eq(personalTransmissions.kind, "echo"),
        eq(personalTransmissions.period, period)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listDeliveredEchoes(): Promise<PersonalTransmission[]> {
  const db = await requireDb();
  return db
    .select()
    .from(personalTransmissions)
    .where(and(eq(personalTransmissions.kind, "echo"), eq(personalTransmissions.status, "delivered")))
    .orderBy(desc(personalTransmissions.deliveredAt));
}
