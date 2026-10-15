/**
 * A Seeker's place in the field, as their profile and the chat show it: the
 * tier, what it opens, how far the next patron level is, when a key ends or a
 * Garden renews, and the seal it earns. Read from the same rules as the
 * limits (supporter-access), so the two can never disagree.
 */
import {
  accessTier,
  supporterKind,
  TIER_ACCESS,
  type AccessTier,
  type SupporterFields,
} from "./supporter-access";

/** 0 none · 1 one ring · 2 two rings · 3 three rings and rays · 4 full halo. */
export type SealLevel = 0 | 1 | 2 | 3 | 4;

const SEAL: Record<AccessTier, SealLevel> = {
  free: 0,
  seed: 1,
  garden: 2,
  keeper: 2,
  deep_garden: 3,
  steward: 3,
  pillar: 4,
};

/** The patron ladder: each level opens above the given total, in euros. */
const LADDER: Array<{ tier: AccessTier; above: number }> = [
  { tier: "keeper", above: 100 },
  { tier: "steward", above: 400 },
  { tier: "pillar", above: 1000 },
];

export interface SupporterStanding {
  tier: AccessTier;
  label: string;
  kind: "free" | "garden" | "patron";
  seal: SealLevel;
  messagesPerDay: number;
  voicePerDay: number;
  oraclesDayOne: boolean;
  giftAccess: boolean;
  freeBook: boolean;
  donated: number;
  /** The next patron level, for those on the patron ladder. */
  next: { label: string; above: number; remaining: number } | null;
  /** A Garden that renews on its own. */
  renewsOn: Date | null;
  /** A 30-day key, or a cancelled Garden, closes on this day. */
  endsOn: Date | null;
  cancelled: boolean;
}

export function supporterStanding(
  user: SupporterFields & { role?: string | null },
  now: Date = new Date()
): SupporterStanding {
  const kind = supporterKind(user, now) ?? "free";
  const tier = accessTier(user, now);
  const limits = TIER_ACCESS[tier];
  const donated = Number(user.donated ?? 0);
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  const cancelled = kind === "garden" && user.subscriptionStatus === "cancelled";

  const onLadder = ["seed", "keeper", "steward"].includes(tier);
  const step = onLadder ? LADDER.find(l => donated <= l.above) : undefined;

  const standing: SupporterStanding = {
    tier,
    label: limits.label,
    kind,
    seal: SEAL[tier],
    messagesPerDay: limits.messagesPerDay,
    voicePerDay: limits.voicePerDay,
    oraclesDayOne: limits.oraclesDayOne,
    giftAccess: limits.giftAccess,
    freeBook: limits.freeBook,
    donated,
    next: step
      ? { label: TIER_ACCESS[step.tier].label, above: step.above, remaining: Math.max(0, step.above - donated) }
      : null,
    renewsOn: kind === "garden" && !cancelled ? until : null,
    endsOn: (kind === "patron" || cancelled) && until ? until : null,
    cancelled,
  };

  // The architect stands outside the ladder, with every door open.
  if (user.role === "admin") {
    const pillar = TIER_ACCESS.pillar;
    return { ...standing, label: "Architect", seal: 4, next: null, messagesPerDay: pillar.messagesPerDay, voicePerDay: pillar.voicePerDay };
  }
  return standing;
}
