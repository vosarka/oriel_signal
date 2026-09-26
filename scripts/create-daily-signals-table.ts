/**
 * Creates the daily_signals table. Additive and idempotent.
 *
 * Deliberately NOT a drizzle-kit migration. The drizzle journal and
 * snapshots stop at 0008 while migrations 0009-0013 exist on disk and
 * are already applied in the database, so `drizzle-kit generate` would
 * diff against a stale snapshot and emit CREATE statements for tables
 * that already hold live rows. This script touches one new table and
 * nothing else.
 *
 * Safe to run more than once. Already applied in production. No deploy
 * step runs it: a fresh database needs it run once by hand before the
 * app starts, or the scheduler and the archive find no table.
 *
 * Do not "undo" it with DROP TABLE: the scheduler, the archive tab and
 * the bot feed all read this table, and every row is a published day
 * that cannot be regenerated identically.
 *
 * Column types here (DATE, JSON) are what production has. drizzle/schema.ts
 * declares signalDate as varchar and bodyLines as text on purpose; see the
 * note there before "aligning" them.
 *
 *   npx tsx scripts/create-daily-signals-table.ts          (dry run)
 *   npx tsx scripts/create-daily-signals-table.ts --apply  (writes)
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const DDL = `
CREATE TABLE IF NOT EXISTS daily_signals (
  id              INT AUTO_INCREMENT PRIMARY KEY,

  -- One signal per day for the whole community. This uniqueness IS the
  -- feature: without it every visitor generates their own text and the
  -- shared field the signal exists to create never forms.
  signalDate      DATE         NOT NULL UNIQUE,

  txGenId         VARCHAR(32)  NOT NULL UNIQUE,
  clarity         DECIMAL(4,1) NOT NULL,
  channelStatus   VARCHAR(32)  NOT NULL,
  clarityRegister VARCHAR(16)  NOT NULL,

  field           VARCHAR(128) NOT NULL,
  encodedNode     VARCHAR(128) NOT NULL,
  carrier         VARCHAR(128) NOT NULL,

  title           VARCHAR(255) NOT NULL,
  bodyLines       JSON         NOT NULL,
  encodedArchetype TEXT        NOT NULL,
  falsifier       TEXT         NOT NULL,
  finalInstruction TEXT        NOT NULL,

  generatedBy     VARCHAR(64),
  createdAt       TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
)`;

const apply = process.argv.includes("--apply");

(async () => {
  const conn = await mysql.createConnection(process.env.DATABASE_URL!);

  const host = new URL(process.env.DATABASE_URL!.replace(/^mysql:/, "http:")).host;
  console.log(`target: ${host}`);

  const [before]: any = await conn.query("SHOW TABLES");
  const names = before.map((r: any) => Object.values(r)[0]);
  console.log(`tables before: ${names.length}`);
  console.log(`daily_signals present: ${names.includes("daily_signals")}`);

  // Row counts on live tables, so we can prove nothing else moved.
  const witness = ["users", "conversations", "transmissions"];
  const counts: Record<string, number> = {};
  for (const t of witness) {
    if (!names.includes(t)) continue;
    const [r]: any = await conn.query("SELECT COUNT(*) AS n FROM ??", [t]);
    counts[t] = r[0].n;
  }
  console.log("witness rows before:", JSON.stringify(counts));

  if (!apply) {
    console.log("\n--- DRY RUN, nothing written. Statement that would run: ---");
    console.log(DDL.trim());
    await conn.end();
    return;
  }

  await conn.query(DDL);
  console.log("\nCREATE TABLE IF NOT EXISTS executed.");

  const [after]: any = await conn.query("SHOW TABLES");
  const afterNames = after.map((r: any) => Object.values(r)[0]);
  console.log(`tables after: ${afterNames.length}`);
  console.log(`daily_signals present: ${afterNames.includes("daily_signals")}`);

  for (const t of Object.keys(counts)) {
    const [r]: any = await conn.query("SELECT COUNT(*) AS n FROM ??", [t]);
    const same = r[0].n === counts[t];
    console.log(`  ${t}: ${counts[t]} -> ${r[0].n} ${same ? "unchanged" : "CHANGED"}`);
  }

  await conn.end();
})().catch(e => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
