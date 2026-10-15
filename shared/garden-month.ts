/**
 * A month of Garden paid once, with no renewal: for Seekers whose banks or
 * countries refuse recurring payments (India's rules on automatic debits, for
 * one). Same price as the subscription; the month opens on capture.
 */
export const GARDEN_MONTH_PRICE_EUR = { garden: 9.99, deep_garden: 24.99 } as const;
export const GARDEN_MONTH_DAYS = 30;
export type GardenMonthPlan = keyof typeof GARDEN_MONTH_PRICE_EUR;
