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

export interface SupporterFields {
  subscribed: boolean | null;
  paypalSubscriptionId: string | null;
  subscriptionRenewalDate: Date | string | null;
  donated?: number | null;
}

export function supporterKind(user: SupporterFields, now: Date = new Date()): SupporterKind {
  if (!user.subscribed) return null;
  if (user.paypalSubscriptionId) return "garden";
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  return until && until <= now ? null : "patron";
}

/**
 * The tier that decides a user's limits.
 * ponytail: every PayPal subscription reads as Garden for now; Deep Garden
 * needs the plan id stored when Etapa 2 wires the two PayPal plans.
 */
export function accessTier(user: SupporterFields, now: Date = new Date()): AccessTier {
  const kind = supporterKind(user, now);
  if (kind === "garden") return "garden";
  if (kind === "patron") return patronLevel(Number(user.donated ?? 0));
  return "free";
}
