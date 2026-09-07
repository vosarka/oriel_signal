#!/usr/bin/env node
/**
 * Local Calendly-session helper. Searches the July chat backup only.
 *
 *   pnpm exec tsx scripts/search-chat-phrase.ts "o frază pe care o țineau minte"
 *
 * Prints oldUserId, hit counts, and up to 2 short user-message quotes.
 * Does not connect to the database. Does not write production data.
 */

import fs from "node:fs";
import path from "node:path";
import {
  messagesFromChatCsv,
  searchChatPhrase,
  usersFromUsersCsv,
} from "../server/chat-phrase-search";

const HOME = process.env.HOME ?? "/home/vos";
const CHAT = path.join(
  HOME,
  "Downloads/000/chatMessages_20260728_173355.csv"
);
const USERS = path.join(
  HOME,
  "_CODEX/Vossari_Conduit-Hub/Untitled Folder/db-files/users_20260228_133000.csv"
);

function main() {
  const phrase = process.argv.slice(2).join(" ").trim();
  if (!phrase) {
    console.error(
      'Usage: pnpm exec tsx scripts/search-chat-phrase.ts "remembered sentence"'
    );
    process.exit(1);
  }

  if (!fs.existsSync(CHAT)) {
    throw new Error(`Missing chat backup: ${CHAT}`);
  }

  const messages = messagesFromChatCsv(fs.readFileSync(CHAT, "utf-8"));
  const users = fs.existsSync(USERS)
    ? usersFromUsersCsv(fs.readFileSync(USERS, "utf-8"))
    : [];

  const hits = searchChatPhrase(phrase, messages, users);

  if (hits.length === 0) {
    console.log("No user-message matches. Try a longer or more unusual phrase.");
    return;
  }

  console.log(`Candidates: ${hits.length} (user messages only)\n`);
  for (const hit of hits) {
    const emailNote = hit.emailIfKnown
      ? "email known in Feb users backup"
      : "no email in Feb users backup — they confirm, then you attach login email";
    console.log(`oldUserId ${hit.oldUserId}  hits=${hit.hitCount}  ${emailNote}`);
    if (hit.emailIfKnown) console.log(`  email: ${hit.emailIfKnown}`);
    for (const quote of hit.quotes) {
      console.log(`  "${quote.snippet}"`);
    }
    console.log("");
  }
}

main();
