/**
 * Creates the orielAmendments table in the database named by .env
 * (approved by Vos, 2026-10-01). Safe to run twice: CREATE TABLE IF NOT EXISTS.
 *   npx tsx scripts/apply-0015-oriel-amendments.ts
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { sql } from "drizzle-orm";
import { getDb } from "../server/db";

const db = await getDb();
if (!db) throw new Error("No database: check DATABASE_URL in .env");
await db.execute(sql.raw(readFileSync("drizzle/0015_oriel_amendments.sql", "utf8")));
const [cols] = (await db.execute(sql`SHOW COLUMNS FROM \`orielAmendments\``)) as unknown as [
  Array<{ Field: string; Type: string }>,
];
console.log("orielAmendments:", cols.map(c => `${c.Field} ${c.Type}`).join(", "));
process.exit(0);
