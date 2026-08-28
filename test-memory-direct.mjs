import "dotenv/config";
import mysql from "mysql2/promise";

// This file previously hardcoded a production TiDB connection string, including
// the password. That credential is in git history and must be rotated — reading
// it from the environment here does not undo the exposure.
// See docs/oriel/PHASE_1_CONTAINMENT.md §5.
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error(
    "DATABASE_URL is not set. Point it at a development database — never production."
  );
  process.exit(1);
}

const conn = await mysql.createConnection(connectionString);

const day = process.argv[2] ?? new Date().toISOString().slice(0, 10);

console.log(`=== Testing Memory System (${day}) ===\n`);

const [memories] = await conn.execute(
  "SELECT COUNT(*) as count FROM orielMemories WHERE DATE(createdAt) = ?",
  [day]
);
console.log("Memories created:", memories[0].count);

const [chatMessages] = await conn.execute(
  "SELECT COUNT(*) as count FROM chatMessages WHERE DATE(timestamp) = ?",
  [day]
);
console.log("Chat messages:", chatMessages[0].count);

const [recentChats] = await conn.execute(
  `SELECT userId, role, content, timestamp
   FROM chatMessages
   WHERE DATE(timestamp) = ?
   ORDER BY timestamp DESC
   LIMIT 5`,
  [day]
);

console.log("\nRecent chat messages:");
recentChats.forEach(msg => {
  console.log(`  [${msg.role}] ${msg.content.substring(0, 60)}...`);
});

await conn.end();
