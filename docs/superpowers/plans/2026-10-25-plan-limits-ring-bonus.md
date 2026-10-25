# Plan Limits and Ring Bonus Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The daily measure comes from the subscription, every ring adds a fixed daily bonus on top, and spoken replies equal messages.

**Architecture:** One pure function, `dailyMeasure(user)` in `shared/supporter-access.ts`, returns messages, the hourly cap and spoken replies. It is the plan's base plus the permanent ring's bonus, and every reader of limits (`daily-measure`, `rate-limit`, `supporterStanding`) switches to it. `accessTier` shrinks to the plan alone: `free`, `garden` or `deep_garden`. Rings stop carrying limits and carry a bonus instead.

**Tech Stack:** TypeScript, tRPC, React, Vitest (`server/**/*.test.ts`).

**Spec:** No spec document. This plan carries Vos's decisions from the conversation of 2026-10-25, listed below. The rings spec still holds for everything else: `docs/superpowers/specs/2026-10-24-rings-and-gifts-design.md`.

## Global Constraints

- Plan base, messages a day: Free **4**, Garden **150**, Deep Garden **250**. Hourly cap: Free 30, Garden 30, Deep Garden 120 (unchanged).
- Ring bonus, messages a day: Seed **+5**, Keeper **+10**, Steward **+20**, Pillar **+35**, Keystone **+50**.
- The bonus applies **always**, with or without a subscription, because the ring is permanent. Free + Keeper = 14.
- Nothing is unlimited except admins (`role === "admin"`: Infinity everywhere).
- Spoken replies a day = messages a day, for everyone. No separate voice limit. Vos will watch voice cost.
- A donation's active 30-day key (patron, no bought month) opens the **Garden** base. *Claude's call*: before this, a donor's ring gave the same 150.
- Unchanged: the book at Pillar, the gifts, profile features opening for any active supporter (`isSupporter`).
- On `/tiers`, plan cards show one figure, **Messages a day**, with the line "Every reply can also be heard in ORIEL's voice." Ring cards show their bonus, "+10 messages a day", instead of the figures.
- Copy is English. No ring claims "no limit" or "nothing measured".

## Review Focus

1. **Someone whose Garden lapses but who keeps a ring**: falls to Free base + bonus (4 + 10), not 4 and not 150. Pinned in Task 1.
2. **An active donor key with a ring**: Garden base + bonus (150 + 20 for Steward). Pinned in Task 1.
3. **An admin**: never measured: `messageMeasureReached` false, the hourly cap Infinity. Pinned in Task 2.
4. **A spoken reply when messages are exhausted but voice counts are lower**: still allowed up to `voicePerDay`, which equals `messagesPerDay`, because they are counted separately. Pinned in Task 2.
5. **Old copy left behind**: no "Without limit" or "No limit" text for any ring on `/tiers` or the profile. Pinned by the grep in Task 3.

---

### Task 0: One branch for the three unmerged changes

`fix/tiers-plain-benefits` and `feat/seal-rings-and-plans` both touch `shared/supporter-standing.ts` and the tiers and profile pages. Merge them first so this work does not conflict with either.

- [ ] Create `feat/plan-limits-ring-bonus` from `fix/tiers-plain-benefits`, then `git merge feat/seal-rings-and-plans` (both are Claude's unmerged branches, never `main`). Resolve conflicts, then run `npx vitest run server/rings.test.ts server/supporter-standing.test.ts`. Expected: PASS.

### Task 1: The measure: plan base plus ring bonus

**Files:**
- Modify: `shared/rings.ts` (bonus per ring), `shared/supporter-access.ts`
- Test: `server/rings.test.ts`; update `server/supporter-access.test.ts`, `server/supporter-standing.test.ts`, `server/garden-month.test.ts`

**Interfaces:**
- Produces:
  - `RING_LADDER` entries gain `bonus: number` (5, 10, 20, 35, 50).
  - `ringBonus(user: SupporterFields): number`: the bonus of `ringOf(user)`, 0 without a ring.
  - `type PlanTier = "free" | "garden" | "deep_garden"`. `AccessTier` becomes `PlanTier`, and `TIER_ACCESS` keeps only those three keys, with `voicePerDay` removed.
  - `accessTier(user, now)`: inactive → `"free"`; bought or subscribed Deep plan → `"deep_garden"`; any other active (Garden, bought Garden month, patron key) → `"garden"`. Rings no longer change it.
  - `dailyMeasure(user: SupporterFields & { role?: string | null }, now?: Date): { messagesPerDay: number; messagesPerHour: number; voicePerDay: number }`. Admin: all Infinity. Otherwise messages = plan base + `ringBonus(user)`, voice = messages, hour = plan cap.
  - `freeBook(user): boolean`: the ring is Pillar or above (`ringRankForTotal` / stored `ringRank` ≥ 4).
  - `patronLevel` keeps returning the ring tier (`RingTier`); only the gift logic and labels use it.

- [ ] **Step 1: Write the failing tests** in `server/rings.test.ts`, replacing the "what each ring opens" and "a stored ring decides the tier" blocks:
  - `dailyMeasure(free with ringRank 2)` → `{ messagesPerDay: 14, voicePerDay: 14, messagesPerHour: 30 }`.
  - `dailyMeasure(active Garden, ringRank 3)` → messages 170, voice 170.
  - `dailyMeasure(active Deep Garden, ringRank 5)` → messages 300, hour 120.
  - `dailyMeasure(patron key, donated 120, no ringRank)` → 150 + 20 = 170.
  - `dailyMeasure(lapsed Garden, ringRank 2)` → 14.
  - `dailyMeasure(admin)` → every field Infinity.
  - `accessTier(active Garden, ringRank 5)` → `"garden"`.
  - `freeBook({ ...free, ringRank: 4 })` → true, and `ringRank: 3` → false.
- [ ] **Step 2:** Update the old expectations. In `supporter-access.test.ts`, the Pillar/Keystone "no limit" test becomes `dailyMeasure(patron, donated 6000).messagesPerDay === 200`. "Keep the larger of the two" becomes `accessTier(garden + donated 2000) === "garden"`. In `supporter-standing.test.ts`, `tier` values become plan tiers. In `garden-month.test.ts:34`, donated 500 → `"garden"`. Run `npx vitest run server/rings.test.ts server/supporter-access.test.ts server/supporter-standing.test.ts server/garden-month.test.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement. `supporterStanding` takes `messagesPerDay`/`voicePerDay` from `dailyMeasure`, `freeBook` from `freeBook(user)`, adds `ringBonus: number`, and keeps `label` as the plan's label. `isSupporter` stays `admin || supporterKind(user) !== null`.
- [ ] **Step 4:** Run the same command. Expected: PASS. Run `npx tsc --noEmit -p .`. Expected: only the known `server/oriel-chat.ts:394` error, plus the errors in the readers Task 2 and Task 3 fix. List them in the ledger.
- [ ] **Step 5: Commit** `feat(limits): the plan sets the measure, the ring adds to it`

### Task 2: The server counts by the new measure

**Files:**
- Modify: `server/daily-measure.ts` (`limitsFor`), `server/_core/rate-limit.ts:111`
- Test: `server/daily-measure-admin.test.ts` (extend)

**Interfaces:**
- Consumes: `dailyMeasure` (Task 1).
- `limitsFor(user, now)` returns `dailyMeasure(user, now)`. The rate limit's hourly cap is `dailyMeasure(user).messagesPerHour`.

- [ ] **Step 1: Write the failing tests:** `limitsFor(admin)` all Infinity (already there); `limitsFor(free with ringRank 2).voicePerDay === 14`; `limitsFor(active Garden).voicePerDay === 150`.
- [ ] **Step 2:** Run `npx vitest run server/daily-measure-admin.test.ts`. Expected: FAIL on voice.
- [ ] **Step 3:** Implement both readers.
- [ ] **Step 4:** Run it, plus `server/rate-limit-*.test.ts` if they load. Expected: PASS. Typecheck: no new errors in `server/`.
- [ ] **Step 5: Commit** `feat(limits): spoken replies follow the messages`

### Task 3: The pages say it plainly

**Files:**
- Modify: `client/src/pages/Tiers.tsx`, `client/src/pages/Profile.tsx`

- [ ] **Step 1:** `/tiers` plan cards: one figure, "Messages a day" (`TIER_ACCESS[key].messagesPerDay`), followed by the line "Every reply can also be heard in ORIEL's voice." Ring cards: replace the two figures with "+{bonus} messages a day, every day". Keystone's line becomes "The stone that holds the arch." Under the rings: "Each ring adds to your daily measure, with or without a plan, and it never goes back."
- [ ] **Step 2:** Profile `StandingPanel`: drop the "Spoken replies a day" row and add "Your ring adds +N a day" when `ringBonus > 0`. The free note reads "{n} exchanges with ORIEL each day, each one in ORIEL's voice if you wish."
- [ ] **Step 3:** `grep -rn -E "No limit|Without limit|Nothing here is measured" client/src/pages`. Expected: no hit about rings or plans. The `fmt` helpers may keep the word for the admin case only.
- [ ] **Step 4:** `npm run build`. Expected: `✓ built`. In the dev client (`npx vite --port 5199`, run outside the sandbox), `/tiers` shows Free 4, Garden 150, Deep Garden 250 and ring bonuses +5 … +50.
- [ ] **Step 5: Commit** `copy(tiers): one measure per plan, a bonus per ring`

### Task 4: Whole-branch check

- [ ] `npx vitest run`: only the 2 known unrelated failures (`oriel-public-terminology`, `profile-console-model`) and the files that need `DATABASE_URL`. `npm run build` passes.
- [ ] Push `feat/plan-limits-ring-bonus`. Tell Vos this one PR **replaces** `fix/tiers-plain-benefits` and `feat/seal-rings-and-plans`, so he merges only this one.
