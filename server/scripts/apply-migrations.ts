import "dotenv/config";
import { runMigrations } from "../db";

async function main() {
  await runMigrations();
  console.log("[Migrations] apply-migrations script finished.");
}

main().catch(error => {
  console.error("[Migrations] apply-migrations script failed:", error);
  process.exit(1);
});