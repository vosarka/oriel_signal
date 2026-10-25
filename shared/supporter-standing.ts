/**
 * A Seeker's place in the field, as their profile and the chat show it: the
 * plan, the day's measure, the permanent ring and its bonus, how far the
 * next ring is, when a key ends or a Garden renews, and the seal. Read from
 * the same rules as the limits (supporter-access), so the two never disagree.
 */
import {
  accessTier,
  dailyMeasure,
  freeBook,
  GARDEN_PLANS,
  ringBonus,
  ringOf,
  supporterKind,
  TIER_ACCESS,
  type AccessTier,
  type SupporterFields,
} from "./supporter-access";
import { RING_LADDER, type RingTier } from "./rings";

/** 0 none · 1 one ring · 2 two rings · 3 three rings and rays · 4 full halo. */
export type SealLevel = 0 | 1 | 2 | 3 | 4;

/** The profile's gold frame: the plan's depth, or the ring's when it is deeper. */
const PLAN_SEAL: Record<AccessTier, SealLevel> = { free: 0, garden: 2, deep_garden: 3 };
const ringSeal = (rank: number): SealLevel => (rank >= 4 ? 4 : rank >= 1 ? 1 : 0);

export interface SupporterStanding {
  tier: AccessTier;
  label: string;
  kind: "free" | "garden" | "patron";
  seal: SealLevel;
  /** The day's measure: the plan's base plus the ring's bonus. */
  messagesPerDay: number;
  /** Equal to messagesPerDay: each reply may be heard aloud. */
  voicePerDay: number;
  /** Messages a day the ring adds to the plan. */
  ringBonus: number;
  /** The book, once Pillar is reached: permanent, like the ring. */
  freeBook: boolean;
  /** Everything given: donations plus Garden payments, in euros. */
  donated: number;
  /** The permanent ring, shown even while no plan is open. */
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

/** The Garden plan open now: a subscription or a month bought. A donation's key alone is none. */
export function openPlan(user: SupporterFields, now: Date = new Date()): "garden" | "deep_garden" | null {
  const kind = supporterKind(user, now);
  if (kind === null) return null;
  if (user.paypalPlanId === GARDEN_PLANS.deep_garden) return "deep_garden";
  if (kind === "garden" || user.paypalPlanId === GARDEN_PLANS.garden) return "garden";
  return null;
}

export function holdsPlan(user: SupporterFields, plan: "garden" | "deep_garden", now: Date = new Date()): boolean {
  return openPlan(user, now) === plan;
}

/** What to call a Seeker's standing, the same on their profile and in /admin. */
export function supporterLabel(user: SupporterFields, now: Date = new Date()): string {
  const kind = supporterKind(user, now);
  // A donation's key opens the Garden base but is no Garden of its own.
  if (kind === "patron" && !openPlan(user, now)) return "Supporter";
  return TIER_ACCESS[accessTier(user, now)].label;
}

export function supporterStanding(
  user: SupporterFields & { role?: string | null },
  now: Date = new Date()
): SupporterStanding {
  const kind = supporterKind(user, now) ?? "free";
  const tier = accessTier(user, now);
  const measure = dailyMeasure(user, now);
  const donated = Number(user.ringTotal ?? user.donated ?? 0);
  const ring = ringOf(user);
  const ringRank = RING_LADDER.find(l => l.tier === ring)?.rank ?? 0;
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  const cancelled = kind === "garden" && user.subscriptionStatus === "cancelled";

  const step = donated > 0 ? RING_LADDER.find(l => donated <= l.above) : undefined;
  const plan = openPlan(user, now);

  const standing: SupporterStanding = {
    tier,
    label: supporterLabel(user, now),
    kind,
    seal: Math.max(PLAN_SEAL[tier], ringSeal(ringRank)) as SealLevel,
    messagesPerDay: measure.messagesPerDay,
    voicePerDay: measure.voicePerDay,
    ringBonus: ringBonus(user),
    freeBook: user.role === "admin" || freeBook(user),
    donated,
    ring,
    ringRank,
    plan,
    next: step
      ? { label: step.label, above: step.above, remaining: Math.max(0, step.above - donated) }
      : null,
    renewsOn: kind === "garden" && !cancelled ? until : null,
    endsOn: (kind === "patron" || cancelled) && until ? until : null,
    cancelled,
  };

  // The architect stands outside the ladder, unmeasured.
  if (user.role === "admin") {
    return { ...standing, label: "Architect", seal: 4, ringRank: 5, next: null };
  }
  return standing;
}
