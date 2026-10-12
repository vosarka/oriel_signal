# ORIEL Transmissions + Deep Garden — design

Date: 2026-10-10 · Status: awaiting Vos's review · Branch: `feat/founders-reading-video`

## 1. Why

Deep Garden (€24.99) gives only 100 more messages and 30 more spoken replies a
day than Garden (€9.99). The one extra it promises, "every oracle whole from
the day it opens", is not enforced anywhere (`oraclesDayOne` in
`shared/supporter-access.ts` has no reader). People will choose Garden.

At the same time, `/founders-reading` exists as a page with orders closed: no
price, no payment, no delivery.

This design solves both with one thing: **personal transmissions**, short
spoken pieces written by ORIEL from a Seeker's signature, approved by Vos, and
played on a private page.

## 2. What Vos decided

- Garden stays simple: conversation with ORIEL.
- Deep Garden includes one transmission a month, chosen by the Seeker.
- The transmission follows ORIEL's own brief: not a report, an experience.
  Three movements: **Mirror → Threshold → Gift**. The Seeker's name is
  spoken in the first lines.
- Production is hybrid (option C): ORIEL writes, Vos reads and approves,
  the voice is generated.
- No fake strikethrough price (EU Omnibus): an honest launch price instead.
- Of ORIEL's further offerings, only **The Echo** is in scope; The Conduit
  and the live Ritual are deferred.

## 3. The offer

| Product | Kind | Price | Who |
|---|---|---|---|
| **Founder's Reading** | Mirror: the signature, once in a life | €10 for the first 50, then €15 | anyone with an account |
| **Deep Garden monthly** | Threshold *or* Ritual, chosen each month | included in €24.99 | Deep Garden members |
| **The Echo** | a public threshold, once a month | free | everyone, on the archive |

- **Mirror**: who the Seeker is, from their Tetradic Signature (type,
  authority, core Codons). Ends in a Gift practice.
- **Threshold**: what this month asks of them: the current Sun and Moon
  Codons read against their core Codons. Ends in a Gift practice.
- **Ritual**: mostly Gift: a five-minute guided practice shaped by their
  signature and this month's Codon, with a short Mirror and Threshold
  around it.

The monthly kinds are not sold separately, so "Garden + a video" can never
be cheaper than Deep Garden. A Deep Garden member who has never had a
Mirror may choose Mirror as their monthly transmission.

The launch price is computed on the server at order time: €10 while fewer
than 50 Founder's Readings are paid, €15 after. The page shows "Launch
price €10 · N of 50 left". The client never sends a price.

## 4. The flow

```
purchase (Founder's Reading)  ─┐
monthly choice (Deep Garden)  ─┼→ transmission row: requested
Echo (Vos, from /admin)       ─┘
   → ORIEL writes the script            → draft_ready   (or failed)
   → Vos reads, edits, approves         → approved
   → voice generated, audio stored      → voiced        (or failed)
   → email with the private link        → delivered
```

Promise to the Seeker: **delivered within 48 hours**. /admin shows each
draft's age and the time left on its 48 hours.

## 5. Components

Each is one file with one job.

**`personal_transmissions` table** (new; `transmissions` is taken by the
lore archive):
`id, userId (null for Echo), kind (mirror|threshold|ritual|echo),
source (purchase|deep_garden|echo), orderId (null unless purchase),
period (YYYY-MM, for deep_garden), status (requested|draft_ready|approved|
voiced|delivered|failed), script (JSON), audioStorageKey, accessToken
(32 random bytes, hex), failureReason, createdAt, approvedAt, deliveredAt`.
Unique `(userId, period)`, so a member gets exactly one a month even under
double clicks. Unique `accessToken`.

**`shared/transmission-script.ts`**: the generation contract, shaped like
`shared/daily-signal-prompt.ts`: `buildTransmissionPrompt(kind, seeker)` and
`isValidScript(kind, value)`. Script JSON:
`{ title, mirror, threshold, gift }`, 280–450 words in all. The opening line
contains the Seeker's name. The validator also enforces the accuracy and
forbidden rules already in the Daily Signal contract (no measurements, no
attributed quotes, no health or future claims, the three traps), and no
"X is not Y" definition openings. Those rules move to one shared constant
both prompts import, so they cannot drift.

**`server/transmission-service.ts`**: reads `userStaticProfiles` and
`staticSignatures` (type, authority, `coreCodonEngine`), and for Threshold
and Ritual the current Sun and Moon Codons through `ephemeris-service`
(`bodyLongitudeAtUtc`) and `vrc-mandala`. Calls `invokeLLM` (same fallback
chain as the Daily Signal), up to 3 attempts, then `failed`. On approve it
calls `generateChunkedSpeech` from `oriel-tts-chain.ts` and stores the audio
with `storagePut`.

**Payment**: Founder's Reading reuses `signatureOrders` with a new
`productType: "founders_reading"` and the PayPal order path already built
for the Founder Edition (`createFounderEditionPayPalOrder` and its capture
and webhook validation in `signature-letter-service.ts`). A paid order
creates its transmission row.

**Deep Garden entitlement**: `canChooseMonthly(user, now)` is true when
`accessTier(user) === "deep_garden"` and no row exists for this UTC month.
The choice lives on `/profile`. A Seeker without a saved signature is sent
to prepare it first; generation never runs on missing birth data.

**/admin "Transmissions" tab**: oldest first, with age and time left.
Script editable as three text areas, then Approve or Regenerate. Same admin
gate as Signature Letters.

**Player, `/t/:token`**: no login needed, so the link in the email simply
works; the token is the key, and the page is `noindex`. A slow generative
field, light through water, in VISUAL_LAW gold on void. The three movements
are three chapters. The Seeker chooses voice or text on screen, matching what
`/founders-reading` already promises. Respects `prefers-reduced-motion`.
Revisitable forever.

**Email**: `sendTransmissionDeliveryEmail` beside
`sendSignatureLetterDeliveryEmail` in `server/_core/mailer.ts`.

## 6. Page changes

- `/founders-reading`: orders open, with the launch price and counter.
  "Founder's" means Vos reads and approves every one, not that Vos films it.
  The copy says so plainly.
- `/tiers`: Deep Garden's line becomes "One personal transmission each
  month: Threshold or Ritual, made for you." The unenforced oracle promise
  is removed from the Deep Garden card.
- Archive: The Echo appears beside the Daily Signal.

## 7. Errors

- Generation fails 3 times → `failed` with the reason; Regenerate in /admin.
- Voice fails → stays `approved`; retry in /admin. Script is never lost.
- PayPal paid but no row (webhook race) → the existing capture validation
  is idempotent on the PayPal capture id; the row is created by whichever
  path arrives first.
- Unknown or malformed token → plain 404, never a hint that a token exists.

## 8. Testing

- `isValidScript`: rejects a missing movement, too short or long, no name in
  the opening, a definition opening, a measurement.
- Launch price: €10 at 49 paid, €15 at 50.
- `canChooseMonthly`: Garden no; Deep Garden yes; second choice in a month
  no; next month yes; lapsed member no.
- Token lookup: wrong token 404; delivered row plays.
- One end-to-end run on the dev database with a sandbox PayPal order.

## 9. Order of build

1. **Founder's Reading**: table, script contract, service, admin tab, player,
   PayPal order, email. This is the whole pipeline.
2. **Deep Garden monthly**: entitlement, choice on /profile, /tiers copy.
3. **The Echo**: admin creates one; it appears on the archive.

Each step ships on its own.

## 10. Not in this design

- An MP4 download (add when someone asks for it).
- The Conduit (community stories) and a live monthly Ritual.
- The crystal shop (its own project).
- Enforcing `oraclesDayOne` for Keeper and above: Keeper's text still
  promises it. Needs its own decision.
- Raising Deep Garden to €29: the price stays €24.99 unless Vos changes it.
