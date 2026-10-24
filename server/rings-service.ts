/**
 * The one place a ring rises and a gift is born. Every way money arrives (a
 * Garden payment, a bought month, a donation, a total Vos enters by hand)
 * calls settleRing, and so does a Seeker's first visit after the rings
 * shipped, which is how existing donors receive their launch gift.
 */
import { ringRankForTotal } from "../shared/rings";
import { insertGift, insertRingIfAbsent, raiseRing, ringTotalOf, storedRing } from "./rings-db";

export function ringDecision(
  stored: number | null,
  totalRank: number
): { write: "insert" | "raise" | "none"; rank: number } {
  if (stored === null) return { write: "insert", rank: totalRank };
  if (totalRank > stored) return { write: "raise", rank: totalRank };
  return { write: "none", rank: stored };
}

const CONTEXT_TTL_MS = 60_000;
// ponytail: per-process cache, fine on one Railway instance; a second
// instance would show a fresh ring up to a minute late, nothing worse.
const contextCache = new Map<number, { at: number; value: { ringRank: number; ringTotal: number } }>();

export async function settleRing(userId: number): Promise<{ ringRank: number; ringTotal: number }> {
  contextCache.delete(userId);
  const [stored, ringTotal] = await Promise.all([storedRing(userId), ringTotalOf(userId)]);
  const decision = ringDecision(stored, ringRankForTotal(ringTotal));
  // The write's own row count decides the gift, so two requests settling the
  // same Seeker at once give one gift between them.
  const wrote =
    decision.write === "insert"
      ? await insertRingIfAbsent(userId, decision.rank)
      : decision.write === "raise"
        ? await raiseRing(userId, decision.rank)
        : false;
  if (wrote && decision.rank > 0) await insertGift(userId, decision.rank);
  return { ringRank: decision.rank, ringTotal };
}

/**
 * The ring every request sees on ctx.user. Null on any failure, so a ring
 * table that cannot be read leaves the site working on the donated total.
 */
export async function ringForContext(userId: number): Promise<{ ringRank: number; ringTotal: number } | null> {
  const cached = contextCache.get(userId);
  if (cached && Date.now() - cached.at < CONTEXT_TTL_MS) return cached.value;
  try {
    const value = await settleRing(userId);
    contextCache.set(userId, { at: Date.now(), value });
    return value;
  } catch (error) {
    console.error("[Rings] Could not settle the ring:", error);
    return null;
  }
}
