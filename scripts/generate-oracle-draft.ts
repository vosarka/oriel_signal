/**
 * Draft an ΩX oracle by hand, outside the oracle-day scheduler (e.g. the
 * first one). Two steps, so the owner reads the exact text that will be
 * stored:
 *
 *   npx tsx scripts/generate-oracle-draft.ts --out draft.json
 *       Generates the next oracle and prints its three captions.
 *       Reads the database (next number, recent titles); writes nothing.
 *
 *   npx tsx scripts/generate-oracle-draft.ts --insert draft.json
 *       Inserts that exact draft as three Draft rows. Nothing is public
 *       until it is published from /admin.
 *
 * Match production's model with MISTRAL_MODEL=mistral-large-latest.
 */
import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";
import { getNextOracleNumber } from "../server/db";
import {
  generateOracle,
  insertOracleDraft,
  oracleRows,
  recentOracles,
} from "../server/oracle-stream-service";
import { assembleOracle, drawFor, type GeneratedOracle } from "../shared/oracle-stream";

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i === -1 ? undefined : process.argv[i + 1];
}

(async () => {
  const insertFrom = arg("--insert");
  if (insertFrom) {
    const { number, gen } = JSON.parse(readFileSync(insertFrom, "utf8")) as {
      number: number;
      gen: GeneratedOracle;
    };
    if ((await getNextOracleNumber()) !== number) {
      throw new Error(`Oracle ${number} is no longer the next number; regenerate.`);
    }
    await insertOracleDraft(oracleRows(drawFor(number), gen));
    console.log(`Inserted ${drawFor(number).oracleId} as Draft. Publish it from /admin.`);
    process.exit(0);
  }

  const out = arg("--out");
  if (!out) throw new Error("Pass --out <file> or --insert <file>.");

  const number = await getNextOracleNumber();
  const draw = drawFor(number);
  console.log(
    `${draw.oracleId} · ${draw.domain} · ${draw.mode.split(":")[0]} · ${draw.seed.split(":")[0]} · motif "${draw.motif}"\n`
  );
  const result = await generateOracle(draw, await recentOracles());
  if (!result) throw new Error("Every attempt was rejected; see warnings above.");

  const captions = assembleOracle(draw, result.gen);
  console.log([captions.past, captions.present, captions.future].join("\n\n─────────\n\n"));
  writeFileSync(out, JSON.stringify({ number, model: result.model, gen: result.gen }, null, 2));
  console.log(`\nmodel: ${result.model}\nsaved: ${out} — nothing written to the database.`);
  process.exit(0);
})().catch(error => {
  console.error(error);
  process.exit(1);
});
