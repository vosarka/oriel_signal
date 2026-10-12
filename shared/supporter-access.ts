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
 * Decided with Vos, 2026-09-30.
 */
export type SupporterKind = "garden" | "patron" | null;

export type AccessTier =
  | "free"
  | "seed"
  | "keeper"
  | "steward"
  | "pillar"
  | "garden"
  | "deep_garden";

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
  /** May gift their access to one person. */
  giftAccess: boolean;
  /** May request a Tetradic Signature from the site without paying. */
  freeBook: boolean;
}

export const TIER_ACCESS: Record<AccessTier, TierAccess> = {
  free: { label: "Free", messagesPerDay: 10, messagesPerHour: 30, voicePerDay: 3, oraclesDayOne: false, giftAccess: false, freeBook: false },
  seed: { label: "Seed", messagesPerDay: 150, messagesPerHour: 30, voicePerDay: 20, oraclesDayOne: false, giftAccess: false, freeBook: false },
  garden: { label: "Garden", messagesPerDay: 150, messagesPerHour: 30, voicePerDay: 20, oraclesDayOne: false, giftAccess: false, freeBook: false },
  keeper: { label: "Keeper", messagesPerDay: 250, messagesPerHour: 120, voicePerDay: 50, oraclesDayOne: true, giftAccess: false, freeBook: false },
  deep_garden: { label: "Deep Garden", messagesPerDay: 250, messagesPerHour: 120, voicePerDay: 50, oraclesDayOne: true, giftAccess: false, freeBook: false },
  steward: { label: "Steward", messagesPerDay: 500, messagesPerHour: 120, voicePerDay: 120, oraclesDayOne: true, giftAccess: true, freeBook: false },
  pillar: { label: "Pillar", messagesPerDay: Infinity, messagesPerHour: Infinity, voicePerDay: Infinity, oraclesDayOne: true, giftAccess: true, freeBook: true },
};

/** Patron level from the total donated, in euros. */
export function patronLevel(donated: number): "seed" | "keeper" | "steward" | "pillar" {
  if (donated > 1000) return "pillar";
  if (donated > 400) return "steward";
  if (donated > 100) return "keeper";
  return "seed";
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
  if (kind === "patron") return patronLevel(Number(user.donated ?? 0));
  if (kind !== "garden") return "free";
  const plan: AccessTier =
    user.paypalPlanId === GARDEN_PLANS.deep_garden ? "deep_garden" : "garden";
  // A patron who also joins the Garden keeps whichever opens more.
  const donated = Number(user.donated ?? 0);
  if (donated <= 0) return plan;
  const level = patronLevel(donated);
  return TIER_ACCESS[level].messagesPerDay > TIER_ACCESS[plan].messagesPerDay ? level : plan;
}
