/**
 * Founder's Reading: an honest launch price, never a strikethrough. The
 * EU Omnibus rule allows a crossed-out price only if it was really charged.
 */
export const FOUNDERS_READING = {
  title: "Founder's Reading",
  launchPriceEur: 5,
  priceEur: 10,
  launchSeats: 50,
} as const;

export function foundersReadingPrice(paidCount: number): number {
  return paidCount < FOUNDERS_READING.launchSeats
    ? FOUNDERS_READING.launchPriceEur
    : FOUNDERS_READING.priceEur;
}

export function launchSeatsLeft(paidCount: number): number {
  return Math.max(0, FOUNDERS_READING.launchSeats - paidCount);
}
