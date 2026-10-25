/**
 * Who is past the free threshold, and how far — read from columns `users`
 * already has, no schema change:
 *
 * - Garden member: `subscribed` with a PayPal subscription id. The signed
 *   webhook sets and clears it; renewal dates are PayPal's business.
 * - Patron: `subscribed` without one, marked by Vos in /admin. Open-ended,
 *   or with an end date in `subscriptionRenewalDate` (the 30-day key a
 *   one-time donation opens) after which it lapses on its own. The level
 *   follows `donated`, which Vos enters in /admin for donations made
 *   before accounts were wired to PayPal.
 *
 * The plan sets the daily measure; the ring adds a bonus on top of it, with
 * or without a plan, because a ring is never lost (Vos, 2026-10-25). Every
 * spoken reply is one of the day's messages heard aloud, so the two
 * measures are the same number. Only an admin is unmeasured.
 */
import { RING_LADDER, ringRankForTotal, ringTierForRank, type RingTier } from "./rings";

export type SupporterKind = "garden" | "patron" | null;

export type PlanTier = "free" | "garden" | "deep_garden";
/** The tier that decides a Seeker's base: their plan, never their ring. */
export type AccessTier = PlanTier;

export interface TierAccess {
  label: string;
  /** Messages to ORIEL per UTC day, before the ring's bonus. */
  messagesPerDay: number;
  /** Safety cap on ORIEL messages per rolling hour. */
  messagesPerHour: number;
}

export const TIER_ACCESS: Record<PlanTier, TierAccess> = {
  free: { label: "Free", messagesPerDay: 4, messagesPerHour: 30 },
  garden: { label: "Garden", messagesPerDay: 150, messagesPerHour: 30 },
  deep_garden: { label: "Deep Garden", messagesPerDay: 250, messagesPerHour: 120 },
};

/** Ring from a total, in euros. An active patron with no total is a Seed. */
export function patronLevel(total: number): RingTier {
  return ringTierForRank(ringRankForTotal(total)) ?? "seed";
}

/** The two PayPal plans of the Garden (Vos, 2026-10-01). Public ids. */
export const GARDEN_PLANS = {
  garden: "P-63293204JC268713WNK7KN4Q",
  deep_garden: "P-6SY7118000596284YNK7HTLI",
} as const;

export interface SupporterFields {
  subscribed: boolean | null;
  paypalSubscriptionId: string | null;
  paypalPlanId?: string | null;
  subscriptionStatus?: string | null;
  subscriptionRenewalDate: Date | string | null;
  donated?: number | null;
  /** The stored ring (server/rings-service.ts); absent when it could not be read. */
  ringRank?: number | null;
  /** Everything given: donations plus Garden payments. */
  ringTotal?: number | null;
}

/** The permanent ring: the stored one, or the ring of the donated total. */
export function ringOf(user: SupporterFields): RingTier | null {
  if (typeof user.ringRank === "number") return ringTierForRank(user.ringRank);
  return ringTierForRank(ringRankForTotal(Number(user.donated ?? 0)));
}

export function supporterKind(user: SupporterFields, now: Date = new Date()): SupporterKind {
  if (!user.subscribed) return null;
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  const lapsed = Boolean(until && until <= now);
  // A cancelled Garden stays open until the month already paid for ends.
  if (user.paypalSubscriptionId) {
    return user.subscriptionStatus === "cancelled" && lapsed ? null : "garden";
  }
  return lapsed ? null : "patron";
}

/**
 * Supporter features (the profile reading, the Bio-Architecture wheel):
 * everyone with an open plan or key, and admins. Decided with Vos, 2026-10-02.
 */
export function isSupporter(
  user: (SupporterFields & { role?: string | null }) | null | undefined,
  now: Date = new Date()
): boolean {
  if (!user) return false;
  return user.role === "admin" || supporterKind(user, now) !== null;
}

/**
 * The plan open now. A Garden subscription or a month bought gives its plan;
 * a donation's key gives the Garden base, the room a donor had before the
 * rings carried a bonus instead of limits.
 */
export function accessTier(user: SupporterFields, now: Date = new Date()): AccessTier {
  if (supporterKind(user, now) === null) return "free";
  return user.paypalPlanId === GARDEN_PLANS.deep_garden ? "deep_garden" : "garden";
}

/** Messages a day the ring adds, 0 without one. */
export function ringBonus(user: SupporterFields): number {
  const ring = ringOf(user);
  return RING_LADDER.find(l => l.tier === ring)?.bonus ?? 0;
}

/** The book opens at Pillar and stays, like the ring. */
export function freeBook(user: SupporterFields): boolean {
  const ring = ringOf(user);
  return ring === "pillar" || ring === "keystone";
}

/** The day's measure: the plan's base plus the ring's bonus; voice equals messages. */
export function dailyMeasure(
  user: SupporterFields & { role?: string | null },
  now: Date = new Date()
): { messagesPerDay: number; messagesPerHour: number; voicePerDay: number } {
  if (user.role === "admin") return { messagesPerDay: Infinity, messagesPerHour: Infinity, voicePerDay: Infinity };
  const plan = TIER_ACCESS[accessTier(user, now)];
  const messagesPerDay = plan.messagesPerDay + ringBonus(user);
  return { messagesPerDay, messagesPerHour: plan.messagesPerHour, voicePerDay: messagesPerDay };
}
