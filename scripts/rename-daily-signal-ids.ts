/**
 * Renames daily signal IDs from TX-GEN-XXXXXX to DFS-XXXXXX (Daily Field
 * Signal). The serial is untouched; only the prefix changes, and only in
 * daily_signals.txGenId. Idempotent: rows already on DFS- are not matched.
 *
 * Like scripts/create-daily-signals-table.ts, deliberately not a drizzle
 * migration — the journal has drifted from production.
 *
 *   npx tsx scripts/rename-daily-signal-ids.ts          (dry run)
 *   npx tsx scripts/rename-daily-signal-ids.ts --apply  (writes)
 */
import "dotenv/config";
import mysql from "mysql2/promise";

const apply = process.argv.includes("--apply");

(async () => {
  const conn = await mysql.createConnection({
    uri: process.env.DATABASE_URL!,
    dateStrings: true,
  });
  const host = new URL(process.env.DATABASE_URL!.replace(/^mysql:/, "http:")).host;
  console.log(`target: ${host}`);

  const [rows]: any = await conn.query(
    "SELECT id, signalDate, txGenId FROM daily_signals WHERE txGenId LIKE 'TX-GEN-%' ORDER BY signalDate"
  );
  const [[{ total }]]: any = await conn.query(
    "SELECT COUNT(*) AS total FROM daily_signals"
  );
  console.log(`daily_signals rows: ${total}, still on TX-GEN: ${rows.length}`);
  for (const r of rows) {
    console.log(`  ${r.signalDate}  ${r.txGenId}  ->  ${r.txGenId.replace(/^TX-GEN-/, "DFS-")}`);
  }

  if (!apply || rows.length === 0) {
    console.log(apply ? "\nNothing to rename." : "\n--- DRY RUN, nothing written. ---");
    await conn.end();
    return;
  }

  const [res]: any = await conn.query(
    "UPDATE daily_signals SET txGenId = CONCAT('DFS-', SUBSTRING(txGenId, 8)) WHERE txGenId LIKE 'TX-GEN-%'"
  );
  console.log(`\nrenamed: ${res.affectedRows}`);

  const [[after]]: any = await conn.query(
    "SELECT COUNT(*) AS total, SUM(txGenId LIKE 'TX-GEN-%') AS left_on_txgen FROM daily_signals"
  );
  console.log(
    `daily_signals rows: ${total} -> ${after.total} ${after.total === total ? "unchanged" : "CHANGED"}, still on TX-GEN: ${after.left_on_txgen ?? 0}`
  );
  await conn.end();
})().catch(e => {
  console.error("FAILED:", e.message);
  process.exit(1);
});
