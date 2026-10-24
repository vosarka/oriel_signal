# Rings of the field: lower thresholds, Garden months that count, a gift at every ring

Date: 2026-10-24 · Decided with Vos in conversation.

## Intent

The rings of the field (Seed, Keeper, Steward, Pillar) were reachable only by
donating, and the thresholds were far: a Garden member paying €9.99 a month
would never climb, because Garden payments did not count at all.

Vos wants the rings to be a path people actually walk:

- thresholds low enough to feel progress within months;
- **everything given counts**: donations and every Garden or Deep Garden
  payment, so staying subscribed climbs the rings, and Deep Garden climbs
  faster (Vos hopes this nudges people toward the bigger plan);
- **a gift at every new ring**, which the Seeker can keep or pass on;
- a fifth ring at the top.

## The rings

| Ring | Total given | Unlocks (beyond the ring below) |
|---|---|---|
| Seed | €1–30 | Garden limits (150 messages, 20 voice / day) |
| Keeper | €31–100 | Deep Garden limits (250 / 50), every oracle whole from day one |
| Steward | €101–250 | 500 messages / 120 voice a day |
| Pillar | €251–500 | 1,000 / 250 a day, **their own *Tetradic Signature* book** |
| **Keystone** (new) | over €500 | no limits |

Vos decided the five thresholds, the name Keystone, and that the book moves
to Pillar. The daily limits per ring are **Claude's call**: the existing
limits slid down one ring, with a new step for Pillar so that "no limits"
stays the top ring's alone. Vos agreed the existing perks slide down with
the thresholds.

## What counts toward the total

One total per Seeker, in euros:

- `users.donated`, as today: donations captured by the PayPal webhook
  (`PAYMENT.CAPTURE.COMPLETED` with `custom_id` `user-N`) and amounts Vos
  enters in /admin;
- **plus** every paid Garden or Deep Garden subscription payment;
- **plus** every paid one-time Garden month (`garden_month_orders`, status
  `paid`, `priceEur`).

Founder's Reading purchases and book orders do **not** count (Claude's
call: Vos named donations and subscriptions; a reading is something bought,
not something given to the field).

### Recording subscription payments

Today the webhook sees only subscription lifecycle events, never the
payments. Add `PAYMENT.SALE.COMPLETED`: its `resource.billing_agreement_id`
is the subscription id, matched to `users.paypalSubscriptionId`;
`resource.amount.total` is the amount.

Payments go into a new ledger table, one row per PayPal payment id, so a
webhook PayPal re-sends is never counted twice:

```
ring_contributions(paypalPaymentId PK, userId, amountEur, source enum('subscription','garden_month'), createdAt)
```

Garden months are written to the same ledger when the order is marked paid,
so the total is `donated + SUM(ring_contributions.amountEur)`.

**Vos must add `PAYMENT.SALE.COMPLETED`** to the webhook's subscribed events
in the PayPal developer dashboard; without it no subscription payment
arrives. Payments made before this ships are not backfilled (Claude's call;
Vos can add them by hand through `donated` in /admin).

Known gap, left as is: the existing donation path adds to `donated` without
an idempotency key, so a re-sent donation webhook double-counts. Out of
scope here; noted for later.

### Where a crossing is detected (Claude's call)

The ring is **stored** on the Seeker, not recomputed from the total, so
lowering `donated` in /admin never takes away a ring or a gift already
given. After every change to the total (a ledger row, an admin `setDonated`,
the launch pass), compute the ring from the total; if it is above the stored
ring, store it and create one `ring_gifts` row. If it is below, change
nothing.

Note: donations do not reach accounts automatically today. `DonateButton`
is a hosted PayPal button with no `custom_id`, so Vos enters totals by hand
through `setDonated` in /admin, which sets the total. Admin edits are
therefore the main way donations cross rings, and must run the check above.

## Rings stay, access follows payment

A ring, once reached, never drops (Vos agreed). What it **opens** depends on
whether the Seeker is currently active:

- **The ring itself, its seal, and its gift are permanent.**
- **The ring's daily limits and oracle access apply while the Seeker is
  active**: an active Garden subscription, a Garden month still open, or a
  donation's 30-day key still open (today's rule, unchanged).
- While active, the Seeker gets whichever is larger: their plan's limits or
  their ring's limits (today's rule for donors, extended to rings).
- When inactive, they are a free account for limits, still showing their
  ring.

This is Claude's reading of "rings never go back" plus how access works
today.

- **Open-ended patrons** that Vos marked with no end date stay active, as
  today (Claude's call: Vos granted them deliberately).
- **The Pillar book** is permanent, like the ring: once unlocked it stays
  unlocked. Vos sends books by hand, at his own pace.
- **`giftAccess` ("your access, to one person") is retired**, replaced by the
  ring gifts; Profile stops showing it (Claude's call).

## The gift at every ring

Each time a Seeker's total crosses into a new ring, they receive **one
gift**. Never per month.

**One gift per jump** (Vos): a payment, an admin edit, or the launch itself
that carries a Seeker across several rings at once gives one gift, not one
per ring crossed. At launch, every Seeker whose stored total already sits on
a ring above free receives one gift.

- **Choice:** when they claim it, they choose a **Founder's Reading** or
  **one month of Garden**.
- **For whom:** themselves, or anyone. Claiming produces **a link**. The
  Seeker opens it themselves or sends it to someone.
- **Redeeming:** whoever opens the link signs in (or creates an account),
  and the gift lands on their account:
  - *Garden month*: `grantGardenMonth(userId, "garden", monthUntil(...))`,
    the same path a bought month takes. `grantGardenMonth` does nothing for
    anyone with a `paypalSubscriptionId`, and that column is never cleared.
    Claude's call: a Seeker whose Garden subscription is **active** cannot
    redeem a Garden-month gift; the page says so and the link stays valid,
    so it can be passed on. A Seeker whose subscription is cancelled and
    lapsed redeems normally (the grant must treat that state as no
    subscription).
  - *Founder's Reading*: a personal transmission with no price, status
    `requested` (left to the builder: a new `gift` value in the existing
    `personal_transmissions.source` enum, or `purchase` with no price), the same path `createTestTransmission` takes
    after payment. The recipient must have their signature prepared first
    (today's rule for readings); the redeem page sends them to
    /complete-profile if not, and the link stays valid.
- **One use.** A redeemed link is spent. A link never expires (Claude's
  call, per "a gift does not expire").
- **Where it lives:** the Seeker's profile shows unclaimed gifts and the
  links of claimed ones, so a lost link can be found again.
- Gift Founder's Readings go through Vos's approval queue in /admin like
  any other.

```
ring_gifts(id PK, userId, ring, kind enum('founders_reading','garden_month') NULL,
           token unique NULL, redeemedBy NULL, redeemedAt NULL, createdAt)
```

A row is created when a ring is reached (kind and token empty); claiming
fills kind and token; redeeming fills redeemedBy and redeemedAt.

## Where the code changes

- `shared/supporter-access.ts`: thresholds, the Keystone tier, limits per
  ring, `patronLevel` → ring from total.
- `shared/supporter-standing.ts`: ladder, seal for Keystone, "how far to the
  next ring".
- `server/paypal-webhook.ts`: `PAYMENT.SALE.COMPLETED` into the ledger.
- `server/garden-month.ts`: a paid month writes to the ledger.
- Ring and gift logic, the ledger and gifts tables (self-creating, like
  `intro_film_views`, because `RUN_MIGRATIONS` is off by default).
- `client/src/pages/Tiers.tsx`: five rings, new ranges, the gift line.
- Profile: ring, total, next ring, gifts.
- A redeem page at `/gift/:token`.

## Goals

- A Garden member sees their ring climb month by month.
- Every new ring hands them a gift they can give.
- Nothing already given is lost: current donors keep their totals and land
  on the new, lower rings.

## Non-goals

- The Deep Garden monthly transmission. Designed on 2026-10-10 but never
  built; Vos agreed (2026-10-25) it comes next, as its own project: a
  **Threshold** each month, or the **Mirror** (Founder's Reading) first for
  a member who has never had one.
- Backfilling past subscription payments.
- Fixing the double-count risk on the old donation path.
- Changing Garden or Deep Garden prices or their own limits.
- Shipping the *Tetradic Signature* book automatically. Pillar shows it as
  unlocked; how the book is requested stays as today.

## Anti-goals

- A ring that drops, or a total that shrinks.
- A gift counted twice, or a payment counted twice.
- Permanent unlimited access for a one-off €31 gift: rings open limits only
  while active.
