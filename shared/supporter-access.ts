/**
 * Who is past the free threshold, read from columns `users` already has —
 * no schema change:
 *
 * - Garden member: `subscribed` with a PayPal subscription id. The signed
 *   webhook sets and clears it; renewal dates are PayPal's business.
 * - Patron: `subscribed` without one, marked by Vos in /admin. Open-ended,
 *   or with an end date in `subscriptionRenewalDate` (the 30-day key a
 *   one-time donation opens) after which it lapses on its own.
 */
export type SupporterKind = "garden" | "patron" | null;

export interface SupporterFields {
  subscribed: boolean | null;
  paypalSubscriptionId: string | null;
  subscriptionRenewalDate: Date | string | null;
}

export function supporterKind(user: SupporterFields, now: Date = new Date()): SupporterKind {
  if (!user.subscribed) return null;
  if (user.paypalSubscriptionId) return "garden";
  const until = user.subscriptionRenewalDate ? new Date(user.subscriptionRenewalDate) : null;
  return until && until <= now ? null : "patron";
}
