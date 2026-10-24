# Rings and Gifts Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Five lower rings that grow from donations and every Garden payment, stored so they never drop, each new ring handing the Seeker one gift link (a Founder's Reading or a Garden month) for themselves or anyone.

**Architecture:** The ladder is pure code in `shared/rings.ts`, used by the existing `accessTier` / `supporterStanding`. A Seeker's stored ring and running total live in self-creating tables (`ring_standing`, `ring_contributions`, `ring_gifts`), never in columns on `users`, and the request context attaches them to `ctx.user`, so the existing callers of `accessTier` see the ring without change. One function, `settleRing(userId)`, is the only place a ring rises and a gift is born; every way money arrives calls it.

**Tech Stack:** TypeScript, tRPC, Drizzle (MySQL/TiDB), React + wouter, Vitest (`server/**/*.test.ts` only).

**Spec:** `docs/superpowers/specs/2026-10-24-rings-and-gifts-design.md`

## Global Constraints

- Thresholds, in euros of total given: Seed > 0, Keeper > 30, Steward > 100, Pillar > 250, Keystone > 500.
- Total = `users.donated` + `SUM(ring_contributions.amountEur)`.
- Daily limits (messages / hour cap / voice / oracles day one / book): seed 150/30/20/no/no · keeper 250/120/50/yes/no · steward 500/120/120/yes/no · pillar 1000/120/250/yes/**yes** · keystone ∞/∞/∞/yes/yes. `garden`, `deep_garden`, `free` unchanged.
- A ring never drops. A ring's limits apply only while `supporterKind(user) !== null`; inactive Seekers are `free` for limits and still show their ring.
- One gift per rise of the stored ring, however many rings the rise crosses.
- New tables create themselves (`CREATE TABLE IF NOT EXISTS`, memoised, reset on failure), as `intro_film_views` does in `server/db.ts`. No new column on `users`; `RUN_MIGRATIONS` is off by default.
- Any failure reading ring tables must leave the site working: the ring falls back to the ring of `users.donated`.
- `giftAccess` is removed everywhere (type, table, standing, Profile).
- Copy is English, in the site's voice. Ring names: Seed, Keeper, Steward, Pillar, Keystone.

## Review Focus

1. **The same PayPal payment delivered twice** (webhooks retry): counted once. Pinned in Task 4.
2. **Two requests settling the same Seeker at once** (first visit after launch, two tabs): one gift, not two. Pinned in Task 2 (the rise is a conditional UPDATE / INSERT IGNORE whose affected-row count decides the gift).
3. **A gift link opened twice, or by two people at once**: redeemed once; the second sees "already received". Pinned in Task 5.
4. **A Garden-month gift opened by someone with an active Garden subscription**: refused, link still valid. Someone whose subscription is cancelled and lapsed: granted. Pinned in Task 5.
5. **Vos lowering `donated` in /admin**: ring and gifts unchanged. Pinned in Task 2.

---

### Task 1: The ladder and what each ring opens

**Files:**
- Create: `shared/rings.ts`
- Modify: `shared/supporter-access.ts`, `shared/supporter-standing.ts`, `client/src/pages/Profile.tsx:657`
- Test: `server/rings.test.ts`; update `server/supporter-access.test.ts`, `server/supporter-standing.test.ts`

**Interfaces:**
- Produces:
  - `type RingTier = "seed" | "keeper" | "steward" | "pillar" | "keystone"`
  - `RING_LADDER: ReadonlyArray<{ tier: RingTier; rank: 1|2|3|4|5; above: number; label: string }>` (above = 0, 30, 100, 250, 500)
  - `ringRankForTotal(totalEur: number): number` (0 = no ring)
  - `ringTierForRank(rank: number): RingTier | null`
  - `AccessTier` gains `"keystone"`; `TIER_ACCESS` per Global Constraints; `TierAccess` loses `giftAccess`.
  - `SupporterFields` gains optional `ringRank?: number | null` and `ringTotal?: number | null`.
  - `patronLevel(total)` keeps its name and returns `RingTier`, `"seed"` for totals ≤ 30 (an active patron with no total is a Seed, as today).
  - `accessTier`: inactive → `"free"`; otherwise the larger (by `messagesPerDay`) of the plan tier (garden/deep_garden, or none for a patron) and the ring tier, where ring = `ringTierForRank(ringRank)` if `ringRank` is a number, else `patronLevel(donated)`.
  - `SupporterStanding`: loses `giftAccess`; `donated` becomes the total (`ringTotal ?? donated`); new `ring: RingTier | null` (the permanent ring, shown even when inactive); `next` computed from the total against `RING_LADDER`, null at Keystone; `SEAL.keystone = 4`.

- [ ] **Step 1: Write the failing tests** in `server/rings.test.ts`:
  - `ringRankForTotal(0) === 0`, `(0.01) === 1`, `(30) === 1`, `(30.01) === 2`, `(100) === 2`, `(101) === 3`, `(250) === 3`, `(251) === 4`, `(500) === 4`, `(500.01) === 5`, `(9999) === 5`.
  - `ringTierForRank(0) === null`, `(5) === "keystone"`.
  - `TIER_ACCESS.pillar.freeBook === true`, `TIER_ACCESS.steward.freeBook === false`, `TIER_ACCESS.keystone.messagesPerDay === Infinity`.
  - `accessTier` for an active Garden member with `ringRank: 3` → `"steward"`; for the same user unsubscribed → `"free"`; for an active patron with `ringRank: 2` and `donated: 0` → `"keeper"`; for an active patron without `ringRank` and `donated: 120` → `"steward"`.
  - `supporterStanding` for an unsubscribed user with `ringRank: 4, ringTotal: 300` → `ring === "pillar"`, `tier === "free"`, `next.label === "Keystone"`, `next.remaining === 200`.
- [ ] **Step 2:** Update the old expectations in `server/supporter-access.test.ts` (the `patronLevel` thresholds at lines 34–41) and `server/supporter-standing.test.ts` to the new ladder, then run `npx vitest run server/rings.test.ts server/supporter-access.test.ts server/supporter-standing.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement `shared/rings.ts` and the changes above. Remove the `giftAccess` line from `Profile.tsx:657`.
- [ ] **Step 4:** Run the same command. Expected: PASS. Run `npx tsc --noEmit -p .`: no new errors (the existing one in `server/oriel-chat.ts` is known).
- [ ] **Step 5: Commit** `feat(rings): five lower rings, and what each one opens`

### Task 2: Stored rings and the one place they rise

**Files:**
- Create: `server/rings-db.ts`, `server/rings-service.ts`
- Modify: `drizzle/schema.ts` (three tables), `server/_core/context.ts`
- Test: `server/rings-service.test.ts`

**Interfaces:**
- Consumes: `ringRankForTotal` (Task 1).
- Produces (`server/rings-db.ts`, every function calls `ensureRingTables()` first):
  - `ringTotalOf(userId: number): Promise<number>` = donated + SUM(contributions)
  - `storedRing(userId: number): Promise<number | null>` (null = no row yet)
  - `insertRingIfAbsent(userId: number, rank: number): Promise<boolean>` (INSERT IGNORE; true if inserted)
  - `raiseRing(userId: number, rank: number): Promise<boolean>` (`UPDATE … SET ringRank = ? WHERE userId = ? AND ringRank < ?`; true if one row changed)
  - `insertGift(userId: number, ringRank: number): Promise<void>`
  - `addContribution(row: { paypalPaymentId: string; userId: number; amountEur: number; source: "subscription" | "garden_month" }): Promise<boolean>` (INSERT IGNORE; true if new)
- Produces (`server/rings-service.ts`):
  - `ringDecision(stored: number | null, totalRank: number): { write: "insert" | "raise" | "none"; rank: number }` (pure)
  - `settleRing(userId: number): Promise<{ ringRank: number; ringTotal: number }>`. Inserts or raises per `ringDecision`; creates one gift only when the write returned true and the new rank > 0.
  - `ringForContext(userId: number): Promise<{ ringRank: number; ringTotal: number } | null>`: `settleRing`, returning null on any error (logged). The context builds on every tRPC request, so the result is kept per user for 60 seconds in a module-level `Map` (`// ponytail: per-process cache, fine on one Railway instance`); `settleRing` called from any other path deletes that user's entry.
- Tables:
  - `ring_standing(userId int PK, ringRank int NOT NULL, updatedAt timestamp)`
  - `ring_contributions(paypalPaymentId varchar(64) PK, userId int NOT NULL, amountEur double NOT NULL, source enum('subscription','garden_month') NOT NULL, createdAt timestamp)`
  - `ring_gifts(id int AUTO_INCREMENT PK, userId int NOT NULL, ringRank int NOT NULL, kind enum('founders_reading','garden_month') NULL, token varchar(48) NULL UNIQUE, redeemedBy int NULL, redeemedAt timestamp NULL, createdAt timestamp)`

- [ ] **Step 1: Write the failing tests** for `ringDecision`:
  - `(null, 0)` → `{ write: "insert", rank: 0 }`; `(null, 3)` → `insert, 3`; `(2, 4)` → `raise, 4`; `(4, 2)` → `none, 4` (a lowered total never lowers the ring); `(3, 3)` → `none, 3`.
  - And for `settleRing` with `vi.mock("./rings-db")`: stored 1, total rank 4, `raiseRing` resolves true → `insertGift` called once with `(id, 4)`; `raiseRing` resolves false (another request won) → `insertGift` not called; stored null, total rank 0 → `insertRingIfAbsent` called, `insertGift` not called.
- [ ] **Step 2:** `npx vitest run server/rings-service.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the tables, `rings-db.ts`, `rings-service.ts`. In `context.ts`, after `user` is resolved: `if (user) Object.assign(user, await ringForContext(user.id) ?? {})`.
- [ ] **Step 4:** Run the tests. Expected: PASS. `npx tsc --noEmit -p .`: no new errors.
- [ ] **Step 5: Commit** `feat(rings): rings are stored, rise once, and never fall`

### Task 3: Garden months and admin totals settle the ring

**Files:**
- Modify: `server/garden-month.ts` (`captureGardenMonth`), `server/patrons.ts` (`setDonated`, `withKind`), `server/paypal-webhook.ts` (`handlePaymentCompleted`)
- Test: `server/garden-month.test.ts` (extend)

**Interfaces:**
- Consumes: `addContribution`, `settleRing` (Task 2).
- When `markMonthOrderPaid` returns true: `addContribution({ paypalPaymentId: captureId, userId, amountEur: order.priceEur, source: "garden_month" })`, then `settleRing(userId)`. A failure there is logged and never fails the capture.
- `setDonated` and `handlePaymentCompleted` call `settleRing(userId)` after writing `donated`.
- `withKind` in `patrons.ts` shows the ring of `donated` (admin list; no extra queries).

- [ ] **Step 1: Write the failing test** in `garden-month.test.ts`: a capture that marks the order paid calls `addContribution` with `{ paypalPaymentId: <captureId>, amountEur: 9.99, source: "garden_month" }` and `settleRing` once; a reload (order already paid) calls neither.
- [ ] **Step 2:** Run `npx vitest run server/garden-month.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** `feat(rings): bought Garden months and admin totals climb the rings`

### Task 4: Every subscription payment counts

**Files:**
- Modify: `server/paypal-webhook.ts`
- Test: `server/paypal-webhook-sale.test.ts`

**Interfaces:**
- Consumes: `addContribution`, `settleRing` (Task 2).
- Produces: `saleContribution(payload: PayPalWebhookPayload): { paymentId: string; subscriptionId: string; amountEur: number } | null` (pure). Reads `resource.id`, `resource.billing_agreement_id`, `resource.amount.total`; null when any is missing, the amount is not positive, or `resource.amount.currency` is not `EUR`.
- `PayPalWebhookEvent` gains `"PAYMENT.SALE.COMPLETED"`; the payload type gains `billing_agreement_id?: string` and `amount.total?` / `amount.currency?`.
- Handler: find the user by `users.paypalSubscriptionId = subscriptionId`; unknown → log and return. `addContribution({ source: "subscription", … })`; only when it returns true, `settleRing`.

- [ ] **Step 1: Write the failing tests:** `saleContribution` on a sale with `id "S1"`, `billing_agreement_id "I-ABC"`, `amount { total: "24.99", currency: "EUR" }` → `{ paymentId: "S1", subscriptionId: "I-ABC", amountEur: 24.99 }`; missing `billing_agreement_id` → null; `total "0.00"` → null; currency `USD` → null. And with `rings-db` mocked: the same sale handled twice where `addContribution` resolves true then false → `settleRing` called once.
- [ ] **Step 2:** Run `npx vitest run server/paypal-webhook-sale.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5: Commit** `feat(rings): every Garden payment climbs the rings`

### Task 5: Gifts: claim, open, receive

**Files:**
- Create: `server/ring-gifts.ts`
- Modify: `server/rings-db.ts` (gift queries), `server/garden-month-db.ts` (`grantGardenMonth`), `server/routers.ts` (new `rings` router), `server/transmission-service.ts` (export a gift-reading starter)
- Test: `server/ring-gifts.test.ts`

**Interfaces:**
- Consumes: `supporterKind` (Task 1), `grantGardenMonth`, `monthUntil`, `buildStaticSignatureContext`, `insertTransmission`, `generateScript`.
- Produces (`server/ring-gifts.ts`):
  - `redeemBlock(kind: GiftKind, recipient: SupporterFields, hasSignature: boolean, now?: Date): "active_garden" | "needs_signature" | null` (pure). `garden_month` + `supporterKind(recipient) === "garden"` → `"active_garden"`; `founders_reading` + `!hasSignature` → `"needs_signature"`.
  - `claimGift(userId: number, giftId: number, kind: GiftKind): Promise<{ url: string }>`: only the owner, only an unclaimed gift; token = 32 random hex; url = `${siteUrl}/gift/${token}`. Claiming an already-claimed gift returns its existing url.
  - `giftByToken(token: string): Promise<{ kind: GiftKind; fromName: string | null; redeemed: boolean } | null>`
  - `redeemGift(user: User, token: string): Promise<{ kind: GiftKind; transmissionId?: number }>`: check `redeemBlock` first (TRPCError `PRECONDITION_FAILED` with message `"active_garden"` or `"needs_signature"`, link untouched); then `UPDATE ring_gifts SET redeemedBy, redeemedAt WHERE token = ? AND redeemedAt IS NULL`; zero rows → `CONFLICT` "already received"; then grant. If the grant throws, clear `redeemedBy`/`redeemedAt` and rethrow.
  - `myGifts(userId: number): Promise<Array<{ id: number; ringRank: number; kind: GiftKind | null; url: string | null; redeemed: boolean }>>`
  - `type GiftKind = "founders_reading" | "garden_month"`
- Grants: Garden month → `grantGardenMonth(userId, "garden", monthUntil(user))`; `grantGardenMonth` must also grant when `paypalSubscriptionId` is set but `supporterKind` of that user is not `"garden"` (cancelled and lapsed), clearing `paypalSubscriptionId` and `subscriptionStatus` as it does so. Founder's Reading → `startGiftReading(userId)` in `transmission-service.ts`: `insertTransmission({ userId, kind: "mirror", source: "purchase", status: "requested", accessToken: newToken() })` with no price and no `paidAt` (so `countPaidPurchases` never counts it), then `generateScript` in the background, as `createTestTransmission` does.
- Router `rings`: `myGifts` (protected query), `claim` (protected, `{ giftId: int, kind: enum }`), `gift` (public query, `{ token: string(32..64) }`), `redeem` (protected, `{ token }`).

- [ ] **Step 1: Write the failing tests:** `redeemBlock("garden_month", activeGardenMember, true)` → `"active_garden"`; with a member whose `subscriptionStatus "cancelled"` and renewal date in the past → `null`; `redeemBlock("founders_reading", anyone, false)` → `"needs_signature"`. With `rings-db` mocked: `redeemGift` where the conditional update affects 0 rows → throws `CONFLICT`, grant not called; where the grant throws → the redeemed mark is cleared; `claimGift` by a non-owner → `NOT_FOUND`.
- [ ] **Step 2:** Run `npx vitest run server/ring-gifts.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS. Typecheck: no new errors.
- [ ] **Step 5: Commit** `feat(rings): a gift at every ring, kept or given by link`

### Task 6: The rings on the page

**Files:**
- Modify: `client/src/pages/Tiers.tsx` (`KEEPERS`, `RINGS`, copy), `client/src/pages/Profile.tsx` (ring, total, next ring, gifts), `client/src/App.tsx` (route)
- Create: `client/src/pages/GiftRedeem.tsx`

**Interfaces:**
- Consumes: `RING_LADDER`, `supporterStanding().ring/next/donated` (Task 1); `trpc.rings.*` (Task 5).
- `/tiers` `KEEPERS` becomes five rows with ranges `€1–30`, `€31–100`, `€101–250`, `€251–500`, `over €500`, lines:
  - Seed: "The first ring. You gave, and the field remembers."
  - Keeper: "You tend what others will walk through." Extra: "Every oracle whole, from the day it opens."
  - Steward: "You hold the door for others." Extra: "More room with ORIEL, every day."
  - Pillar: "You hold the weight of the field." Extra: "Your own Tetradic Signature."
  - Keystone: "The stone that holds the arch. Nothing here is measured for you."
  - Under the rings: "Everything you give counts: your Garden months and every gift. Each new ring brings a gift to keep or pass on: a Founder's Reading or a month of Garden. Your rings never go back."
  - `RINGS` (the ring diagram radii) gains a fifth value continuing the spacing (208).
- Profile: ring name and seal, "€X given", "€Y to <next ring>", and a Gifts list. Unclaimed: two buttons, "A Founder's Reading" / "A month of Garden". Claimed: the link with a copy button and "Received" once redeemed.
- `/gift/:token`: shows the gift and who sent it. Signed out: sign in to receive. `needs_signature`: link to `/complete-profile`, "Your gift waits here." `active_garden`: "You already walk the Garden. Pass this gift to someone who doesn't." Success: Garden → "Your month of Garden is open."; reading → "ORIEL is writing your reading. It reaches you once Vos has approved it."

- [ ] **Step 1:** Implement the three pages.
- [ ] **Step 2:** Run `npm run build`. Expected: `✓ built`.
- [ ] **Step 3:** Run the dev client (`npx vite --port 5199`) and check `/tiers` shows five rings and `/gift/<any 32-hex>` renders its not-found state without errors in the console.
- [ ] **Step 4: Commit** `feat(rings): five rings on the tiers page, gifts on the profile, and the gift page`

### Task 7: Whole-branch check

- [ ] **Step 1:** `npx vitest run server/rings.test.ts server/rings-service.test.ts server/ring-gifts.test.ts server/paypal-webhook-sale.test.ts server/garden-month.test.ts server/supporter-access.test.ts server/supporter-standing.test.ts`: all PASS.
- [ ] **Step 2:** `npm run build`: passes. `npx tsc --noEmit -p .`: only the known `server/oriel-chat.ts` error.
- [ ] **Step 3:** Push `feat/rings-and-gifts`. Note in the PR body: **Vos must add `PAYMENT.SALE.COMPLETED` to the webhook's events in the PayPal developer dashboard.**
