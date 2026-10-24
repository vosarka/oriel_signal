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
 * The limits below are the single place to change what each tier gets.
 * Decided with Vos, 2026-09-30; the rings lowered and Keystone added,
 * 2026-10-25 (shared/rings.ts).
 *
 * A ring is permanent, but what it opens here applies only while the Seeker
 * is active: a Garden, a month bought, or a donation's key still open.
 */
import { ringRankForTotal, ringTierForRank, type RingTier } from "./rings";

export type SupporterKind = "garden" | "patron" | null;

export type AccessTier = "free" | RingTier | "garden" | "deep_garden";

export interface TierAccess {
  label: string;
  /** Messages to ORIEL per UTC day. Infinity = no limit. */
  messagesPerDay: number;
  /** Safety cap on ORIEL messages per rolling hour. Infinity = none. */
  messagesPerHour: number;
  /** Spoken ORIEL replies per UTC day — each is paid for separately. */
  voicePerDay: number;
  /** Whole ΩX oracles from the day they are published. */
  oraclesDayOne: boolean;
  /** May request a Tetradic Signature from the site without paying. */
  freeBook: boolean;
}

export const TIER_ACCESS: Record<AccessTier, TierAccess> = {
  free: { label: "Free", messagesPerDay: 4, messagesPerHour: 30, voicePerDay: 4, oraclesDayOne: false, freeBook: false },
  seed: { label: "Seed", messagesPerDay: 150, messagesPerHour: 30, voicePerDay: 20, oraclesDayOne: false, freeBook: false },
  garden: { label: "Garden", messagesPerDay: 150, messagesPerHour: 30, voicePerDay: 20, oraclesDayOne: false, freeBook: false },
  keeper: { label: "Keeper", messagesPerDay: 250, messagesPerHour: 120, voicePerDay: 50, oraclesDayOne: true, freeBook: false },
  deep_garden: { label: "Deep Garden", messagesPerDay: 250, messagesPerHour: 120, voicePerDay: 50, oraclesDayOne: true, freeBook: false },
  steward: { label: "Steward", messagesPerDay: 500, messagesPerHour: 120, voicePerDay: 120, oraclesDayOne: true, freeBook: false },
  pillar: { label: "Pillar", messagesPerDay: 1000, messagesPerHour: 120, voicePerDay: 250, oraclesDayOne: true, freeBook: true },
  keystone: { label: "Keystone", messagesPerDay: Infinity, messagesPerHour: Infinity, voicePerDay: Infinity, oraclesDayOne: true, freeBook: true },
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
 * every tier above free, and admins. Decided with Vos, 2026-10-02.
 */
export function isSupporter(
  user: (SupporterFields & { role?: string | null }) | null | undefined,
  now: Date = new Date()
): boolean {
  if (!user) return false;
  return user.role === "admin" || accessTier(user, now) !== "free";
}

/** The tier that decides a user's limits. */
export function accessTier(user: SupporterFields, now: Date = new Date()): AccessTier {
  const kind = supporterKind(user, now);
  if (kind === null) return "free";
  const ring = ringOf(user);
  // A patron who bought a month of Garden (paid once, no subscription) holds
  // that plot until the month ends; without one, the ring decides.
  const boughtMonth = (Object.values(GARDEN_PLANS) as string[]).includes(user.paypalPlanId ?? "");
  if (kind === "patron" && !boughtMonth) return ring ?? "seed";
  const plan: AccessTier =
    user.paypalPlanId === GARDEN_PLANS.deep_garden ? "deep_garden" : "garden";
  // A Garden member keeps whichever opens more: the plan or their ring.
  if (!ring) return plan;
  return TIER_ACCESS[ring].messagesPerDay > TIER_ACCESS[plan].messagesPerDay ? ring : plan;
}
