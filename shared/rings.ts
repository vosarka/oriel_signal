/**
 * The rings of the field: how far a Seeker has come by everything they have
 * given, donations and Garden payments alike. Thresholds decided with Vos,
 * 2026-10-25, lowered so a Garden member climbs within months.
 *
 * A ring is reached once the total passes `above`; Seed opens with the first
 * cent given.
 */

export type RingTier = "seed" | "keeper" | "steward" | "pillar" | "keystone";

/**
 * `bonus`: messages a day the ring adds to any plan, Free included, for as
 * long as it is held, which is always (Vos, 2026-10-25).
 */
export const RING_LADDER = [
  { tier: "seed", rank: 1, above: 0, label: "Seed", bonus: 5 },
  { tier: "keeper", rank: 2, above: 30, label: "Keeper", bonus: 10 },
  { tier: "steward", rank: 3, above: 100, label: "Steward", bonus: 20 },
  { tier: "pillar", rank: 4, above: 250, label: "Pillar", bonus: 35 },
  { tier: "keystone", rank: 5, above: 500, label: "Keystone", bonus: 50 },
] as const satisfies ReadonlyArray<{ tier: RingTier; rank: number; above: number; label: string; bonus: number }>;

/** 0 means no ring yet. */
export function ringRankForTotal(totalEur: number): number {
  let rank = 0;
  for (const ring of RING_LADDER) if (totalEur > ring.above) rank = ring.rank;
  return rank;
}

export function ringTierForRank(rank: number): RingTier | null {
  return RING_LADDER.find(ring => ring.rank === rank)?.tier ?? null;
}
