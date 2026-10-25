/**
 * A Seeker's place in the field, as their profile and the chat show it: the
 * tier, what it opens, how far the next patron level is, when a key ends or a
 * Garden renews, and the seal it earns. Read from the same rules as the
 * limits (supporter-access), so the two can never disagree.
 */
import {
  accessTier,
  GARDEN_PLANS,
  ringOf,
  supporterKind,
  TIER_ACCESS,
  type AccessTier,
  type SupporterFields,
} from "./supporter-access";
import { RING_LADDER, type RingTier } from "./rings";

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
  keystone: 4,
};

export interface SupporterStanding {
  tier: AccessTier;
  label: string;
  kind: "free" | "garden" | "patron";
  seal: SealLevel;
  messagesPerDay: number;
  voicePerDay: number;
  oraclesDayOne: boolean;
  /** The book, once Pillar is reached: permanent, like the ring. */
  freeBook: boolean;
  /** Everything given: donations plus Garden payments, in euros. */
  donated: number;
  /** The permanent ring, shown even while it opens nothing. */
  ring: RingTier | null;
  /** The ring as a rank for the seal: 0 none … 5 Keystone. */
  ringRank: number;
  /** The Garden plan open right now, drawn as its own mark inside the ring. */
  plan: "garden" | "deep_garden" | null;
  /** The next ring and how far it is; null before the first gift and at Keystone. */
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
  const donated = Number(user.ringTotal ?? user.donated ?? 0);
  const ring = ringOf(user);
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  const cancelled = kind === "garden" && user.subscriptionStatus === "cancelled";

  const step = donated > 0 ? RING_LADDER.find(l => donated <= l.above) : undefined;
  // A subscription or a month bought; a patron's key alone is no plan.
  const plan =
    kind === "free"
      ? null
      : user.paypalPlanId === GARDEN_PLANS.deep_garden
        ? "deep_garden"
        : kind === "garden" || user.paypalPlanId === GARDEN_PLANS.garden
          ? "garden"
          : null;

  const standing: SupporterStanding = {
    tier,
    label: limits.label,
    kind,
    seal: SEAL[tier],
    messagesPerDay: limits.messagesPerDay,
    voicePerDay: limits.voicePerDay,
    oraclesDayOne: limits.oraclesDayOne,
    freeBook: limits.freeBook || Boolean(ring && TIER_ACCESS[ring].freeBook),
    donated,
    ring,
    ringRank: RING_LADDER.find(l => l.tier === ring)?.rank ?? 0,
    plan,
    next: step
      ? { label: step.label, above: step.above, remaining: Math.max(0, step.above - donated) }
      : null,
    renewsOn: kind === "garden" && !cancelled ? until : null,
    endsOn: (kind === "patron" || cancelled) && until ? until : null,
    cancelled,
  };

  // The architect stands outside the ladder, with every door open.
  if (user.role === "admin") {
    const keystone = TIER_ACCESS.keystone;
    return { ...standing, label: "Architect", seal: 4, ringRank: 5, next: null, messagesPerDay: keystone.messagesPerDay, voicePerDay: keystone.voicePerDay };
  }
  return standing;
}
