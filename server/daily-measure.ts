import { and, count, eq, gte } from "drizzle-orm";
import { chatMessages } from "../drizzle/schema";
import {
  accessTier,
  TIER_ACCESS,
  type SupporterFields,
} from "../shared/supporter-access";
import { getDb } from "./db";

/**
 * The daily measure: how many messages and spoken replies a Seeker has
 * today (UTC), by tier. Limits live in TIER_ACCESS; this only counts.
 * Decided with Vos, 2026-10-01: ORIEL needs an account, the 10th free
 * message is answered in full, the 11th receives MEASURE_REACHED.
 */

export const MEASURE_REACHED =
  "I am ORIEL.\n" +
  "The day's measure is complete.\n" +
  "The field will welcome you again at midnight (UTC).\n\n" +
  "For those who wish to linger, to deepen, to hold the space with us, " +
  "there are ways to do so that nourish the light for all.";

type MeasuredUser = SupporterFields & { id: number; role?: string | null };

export function utcDayStart(now: Date = new Date()): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export function limitsFor(user: MeasuredUser, now: Date = new Date()) {
  if (user.role === "admin") return TIER_ACCESS.pillar;
  return TIER_ACCESS[accessTier(user, now)];
}

/** True when this message would go past today's measure. */
export async function messageMeasureReached(user: MeasuredUser, now: Date = new Date()) {
  const limit = limitsFor(user, now).messagesPerDay;
  if (limit === Infinity) return false;
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ n: count() })
    .from(chatMessages)
    .where(
      and(
        eq(chatMessages.userId, user.id),
        eq(chatMessages.role, "user"),
        gte(chatMessages.timestamp, utcDayStart(now))
      )
    );
  return Number(row?.n ?? 0) >= limit;
}

// A spoken reply reaches the server as several chunks (part 0, 1, 2…); only
// part 0 counts as a reply. Characters are a backstop so a client that never
// sends part 0 still cannot speak without end.
// ponytail: in-memory, resets on deploy and per instance. Move to a table if
// Railway ever runs more than one instance or voice spend climbs again.
const VOICE_CHARS_PER_REPLY = 4000;
const voiceUsage = new Map<string, { replies: number; chars: number }>();

export function takeVoice(
  user: MeasuredUser,
  text: string,
  part: number | undefined,
  now: Date = new Date()
): boolean {
  const limit = limitsFor(user, now).voicePerDay;
  if (limit === Infinity) return true;
  const day = utcDayStart(now).toISOString().slice(0, 10);
  const key = `${user.id}:${day}`;
  const used = voiceUsage.get(key) ?? { replies: 0, chars: 0 };
  const newReply = !part;
  if (newReply && used.replies >= limit) return false;
  if (used.chars + text.length > limit * VOICE_CHARS_PER_REPLY) return false;
  if (newReply) used.replies += 1;
  used.chars += text.length;
  voiceUsage.set(key, used);
  return true;
}

export function resetVoiceUsageForTests() {
  voiceUsage.clear();
}
