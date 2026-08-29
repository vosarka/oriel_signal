#!/usr/bin/env node
/**
 * Read-only user-id mapping report from CSV backups.
 * Writes tmp/user-id-mapping.draft.csv (gitignored). Prints counts only — no emails.
 *
 *   pnpm exec tsx scripts/user-identity-audit.ts
 */

import fs from "node:fs";
import path from "node:path";
import {
  buildIdentityAudit,
  formatMappingCsv,
  tablesFromCsvFiles,
} from "../server/user-identity-audit";

const HOME = process.env.HOME ?? "/home/vos";
const CODEX = path.join(HOME, "_CODEX");
const DBFILES = path.join(
  CODEX,
  "Vossari_Conduit-Hub/Untitled Folder/db-files"
);
const DL = path.join(HOME, "Downloads/000");

const DEFAULTS = {
  users: path.join(DBFILES, "users_20260228_133000.csv"),
  baUsers: path.join(CODEX, "ba_user_20260329_124623.csv"),
  conversations: path.join(CODEX, "conversations_20260329_124503.csv"),
  chatMessages: path.join(DL, "chatMessages_20260728_173355.csv"),
  memories: path.join(DL, "orielMemories_20260727_184437.csv"),
};

function readRequired(filePath: string, label: string): string {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing ${label}: ${filePath}`);
  }
  return fs.readFileSync(filePath, "utf-8");
}

function main() {
  const tables = tablesFromCsvFiles({
    users: readRequired(DEFAULTS.users, "users"),
    baUsers: readRequired(DEFAULTS.baUsers, "ba_user"),
    conversations: readRequired(DEFAULTS.conversations, "conversations"),
    chatMessages: readRequired(DEFAULTS.chatMessages, "chatMessages"),
    memories: readRequired(DEFAULTS.memories, "orielMemories"),
  });

  const { rows, summary } = buildIdentityAudit(tables);

  const outDir = path.resolve(process.cwd(), "tmp");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, "user-id-mapping.draft.csv");
  fs.writeFileSync(outPath, formatMappingCsv(rows), "utf-8");

  console.log("Identity audit (counts only, emails stay in gitignored tmp/)");
  console.log(`  backup users:              ${summary.backupUserCount}`);
  console.log(`  ba_user emails:            ${summary.baUserEmailCount}`);
  console.log(`  chat user ids:             ${summary.chatUserCount}`);
  console.log(`  memory user ids:           ${summary.memoryUserCount}`);
  console.log(`  conversations:             ${summary.conversationCount}`);
  console.log(
    `  empty conversationId msgs: ${summary.messagesWithEmptyConversationId}`
  );
  console.log(`  matched:                   ${summary.matched}`);
  console.log(`  orphan-no-email:           ${summary.orphanNoEmail}`);
  console.log(`  needs-your-name:           ${summary.needsYourName}`);
  console.log(`  mapping rows:              ${rows.length}`);
  console.log(`  wrote: ${outPath}`);
}

main();
