/** Every query on vossari_lore, so the lore logic stays testable. */
import { asc, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { vossariLore, type InsertVossariLore, type VossariLore } from "../drizzle/schema";

type LoreStatus = VossariLore["status"];

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function listLoreByStatus(status: LoreStatus): Promise<VossariLore[]> {
  const db = await requireDb();
  return db
    .select()
    .from(vossariLore)
    .where(eq(vossariLore.status, status))
    .orderBy(status === "canon" ? asc(vossariLore.id) : desc(vossariLore.createdAt));
}

export async function getLore(id: number): Promise<VossariLore | null> {
  const db = await requireDb();
  const [row] = await db.select().from(vossariLore).where(eq(vossariLore.id, id)).limit(1);
  return row ?? null;
}

export async function listLoreSlugs(): Promise<string[]> {
  const db = await requireDb();
  const rows = await db.select({ slug: vossariLore.slug }).from(vossariLore);
  return rows.map(r => r.slug);
}

export async function insertLore(values: InsertVossariLore): Promise<void> {
  const db = await requireDb();
  await db.insert(vossariLore).values(values);
}

export async function updateLore(
  id: number,
  values: Partial<Pick<VossariLore, "title" | "body" | "keywords" | "status" | "approvedAt">>
): Promise<void> {
  const db = await requireDb();
  await db.update(vossariLore).set(values).where(eq(vossariLore.id, id));
}
