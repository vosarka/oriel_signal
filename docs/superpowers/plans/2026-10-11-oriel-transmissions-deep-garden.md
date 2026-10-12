# ORIEL Personal Transmissions + Deep Garden Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Sell Founder's Reading (a personal transmission ORIEL writes, Vos approves, and the Seeker plays on a private page), then give Deep Garden one monthly transmission, then publish a free monthly Echo.

**Architecture:** One table, `personal_transmissions`, carries every transmission from request to delivery, including its PayPal payment. A shared contract (`shared/transmission-script.ts`) builds the prompt and validates the script; a server service generates, voices, stores and emails; /admin approves; `/t/:token` plays it as a slow gold-on-void field with ORIEL's voice or text on screen.

**Tech Stack:** TypeScript, React + wouter, tRPC, Drizzle (MySQL/TiDB), vitest, PayPal Orders v2 REST, existing `invokeLLM`, `generateChunkedSpeech`, `storagePut`/`storageGet`, `sendMail`.

**Spec:** `docs/superpowers/specs/2026-10-10-oriel-transmissions-deep-garden-design.md`

### Deviations from the spec (decided while planning, read before starting)

1. **Payment lives on the transmission row, not in `signatureOrders`.** `/admin/signature-letters` lists every `signatureOrders` row and its client type knows only three products, so a Founder's Reading order would surface there as an unknown product. The row carries `priceEur`, `paypalOrderId`, `paypalCaptureId`, `paidAt` itself.
2. **No webhook path.** The PayPal order uses `intent: CAPTURE`: money is taken only when the server captures on the Seeker's return. A Seeker who never returns is never charged, so there is no "paid but no row" race. The capture is idempotent on the row's status.
3. **The PayPal call is a small module** (`server/founders-reading-paypal.ts`) reusing the OAuth helper from `garden-paypal.ts`. The Founder Edition adapter is hard-wired to its €81.32 product.

## Global Constraints

- Never use production credentials. Dev database only (`AGENTS.md`). Migrations are hand-written SQL in `drizzle/` and applied by Vos, dev first; the drizzle journal stops at 0008, so never run `drizzle-kit generate`.
- Palette is VISUAL_LAW: void `#050505`, gold `#d8b56d` (bright `#e4c88c`, deep `#bda36b`), ivory text `#fff7e6`, teal `#5ba4a4` sparingly. Never brown or earth tones. Type: Cormorant Garamond / Cinzel for lore, Red Hat Mono for data.
- Founder's Reading price: €10 while fewer than 50 are paid, €15 after. The page shows "Launch price €10 · N of 50 left". The client never sends a price.
- Deep Garden stays €24.99. Monthly kinds: Threshold or Ritual; Mirror only if the member has never had one.
- Script: `{ title, mirror, threshold, gift }`, 280–450 words in all; the Seeker's name in the opening line (not for Echo).
- Delivery promise shown to the Seeker: within 48 hours.
- Every transmission obeys the Daily Signal accuracy and forbidden rules, shared from one constant.
- `/t/:token` needs no login, is `noindex`, and answers 404 for any token that is malformed, unknown, or not yet delivered.
- Every merged task adds a dated entry to `wiki/log.md`, matching the existing entries.
- Tests live under `server/**/*.test.ts` (vitest `include`). Run with `npx vitest run <file>`.

## Review Focus

1. A Seeker with no saved signature presses Buy. Expected: refused before PayPal is ever called, with a link to prepare the signature. Pinned in Task 6.
2. The Seeker returns from PayPal, then refreshes the page (capture called twice). Expected: one charge, one transmission, second call returns the same state. Pinned in Task 6.
3. The 50th launch seat sells while someone else is mid-checkout. Expected: the price fixed on their row at order time is what PayPal must capture; a different captured amount is refused. Pinned in Task 4.
4. Someone guesses or shares a token for a transmission still in draft. Expected: 404, the draft never leaves the server. Pinned in Task 6.
5. A Seeker named "Ștefan" or "O'Neil" or "Ana-Maria". Expected: the name check passes when the opening carries the name, diacritics and apostrophes included. Pinned in Task 2.

---

## File Structure

| File | Responsibility |
|---|---|
| `shared/oriel-accuracy.ts` (new) | The accuracy and forbidden rules, one constant each |
| `shared/daily-signal-prompt.ts` (modify) | Import those constants instead of inlining them |
| `shared/transmission-script.ts` (new) | Kinds, script type, prompt builder, validator |
| `shared/founders-reading.ts` (new) | Launch price and seats |
| `shared/monthly-transmission.ts` (new, Phase 2) | Month period, Deep Garden eligibility, and the monthly angle of the light (Task 13a) |
| `drizzle/0015_personal_transmissions.sql` (new) | The table |
| `drizzle/schema.ts` (modify) | `personalTransmissions` |
| `server/transmission-db.ts` (new) | Every query on the table |
| `server/founders-reading-paypal.ts` (new) | Create and capture the PayPal order |
| `server/garden-paypal.ts` (modify) | Export `accessToken` |
| `server/transmission-service.ts` (new) | Order, capture, generate, approve, voice, deliver, play |
| `server/_core/mailer.ts` (modify) | `sendTransmissionDeliveryEmail` |
| `server/routers.ts` (modify) | `foundersReading`, `personalTransmissions`, `admin.transmissions` |
| `client/src/pages/AdminTransmissions.tsx` + `admin-transmissions.css` (new) | Approve queue |
| `client/src/pages/TransmissionPlayer.tsx` + `transmission-player.css` (new) | `/t/:token` |
| `client/src/pages/FoundersReading.tsx` (modify) | Open orders, honest copy |
| `client/src/components/MonthlyTransmission.tsx` (new, Phase 2) | Monthly choice on /profile |
| `client/src/App.tsx`, `Profile.tsx`, `Tiers.tsx`, `Archive.tsx` (modify) | Routes and placement |

---

# Phase 1 — Founder's Reading (the whole pipeline)

### Task 1: Share the accuracy rules

**Files:**
- Create: `shared/oriel-accuracy.ts`
- Modify: `shared/daily-signal-prompt.ts:138-171`
- Test: `server/daily-signal.test.ts` (existing, must stay green)

**Interfaces:**
- Produces: `export const ACCURACY_RULES: string`, `export const FORBIDDEN_RULES: string`

- [ ] **Step 1: Create the shared constants, text moved verbatim**

Move, character for character, the block in `buildSignalPrompt` from `ACCURACY — this is not negotiable.` through `A transmission observes; it does not submit evidence.` into `ACCURACY_RULES`, and the block from `FORBIDDEN: flattery,` through `- the generic trap: anything that could be said to anyone on any day` into `FORBIDDEN_RULES`. The "Prefer a phenomenon … Today's well" paragraph is Daily-Signal-only and stays in the prompt.

```ts
// shared/oriel-accuracy.ts
/**
 * The rules every published ORIEL text obeys: the Daily Signal and the
 * personal transmissions. One copy, so the two can never drift.
 */
export const ACCURACY_RULES = `ACCURACY — this is not negotiable. The archive is published daily under
ORIEL's name, and an invented fact discredits every true one beside it.

Never state a measurement, duration, date, dimension or quantity.
Never attribute a quotation. Never claim a specific historical event,
artifact or person did something unless it is common knowledge you
would stake the archive on.

And the harder rule, because it is the one that slips through: do NOT
name a real place, building or instrument and then assert a physical
property it may not have. "The Pantheon, where whispers converge at
the oculus" is exactly the failure — it carries no number and no date,
it simply invents an acoustic mechanism for a real building. If you
cannot name the effect in a place without describing how it behaves,
choose a different image.

Never write that something "proves", "demonstrates" or "shows" a
principle. A transmission observes; it does not submit evidence.`;

export const FORBIDDEN_RULES = `FORBIDDEN: flattery, self-help register, "you are enough", instructions
to buy or subscribe, claims about the reader's health or future events
outside their own experience, and any promise that cannot fail.
And the three traps, in every line and above all in the key:
- the motivational trap: anything that rouses or reassures — "rise",
  "trust the journey", "you are enough"
- the esoteric trap: anything that needs a decoder ring to be understood
- the generic trap: anything that could be said to anyone on any day`;
```

- [ ] **Step 2: Use them in the Daily Signal prompt**

In `shared/daily-signal-prompt.ts` add `import { ACCURACY_RULES, FORBIDDEN_RULES } from "./oriel-accuracy";` and replace the two moved blocks inside the template with `${ACCURACY_RULES}` and `${FORBIDDEN_RULES}`, leaving the phenomena paragraph between them.

- [ ] **Step 3: Prove the prompt did not change**

Before Step 2, save the old output; after, compare:

```bash
cat > "$CLAUDE_JOB_DIR/tmp/prompt-snap.mts" <<EOF
import { frameFor } from "$PWD/shared/daily-signal.ts";
import { buildSignalPrompt } from "$PWD/shared/daily-signal-prompt.ts";
console.log(buildSignalPrompt(frameFor(new Date(Date.UTC(2026, 9, 6))), ["A line."]));
EOF
npx tsx "$CLAUDE_JOB_DIR/tmp/prompt-snap.mts" > "$CLAUDE_JOB_DIR/tmp/before.txt"   # run before Step 2
npx tsx "$CLAUDE_JOB_DIR/tmp/prompt-snap.mts" > "$CLAUDE_JOB_DIR/tmp/after.txt"    # run after Step 2
diff "$CLAUDE_JOB_DIR/tmp/before.txt" "$CLAUDE_JOB_DIR/tmp/after.txt" && echo IDENTICAL
```
Expected: `IDENTICAL`.

- [ ] **Step 4: Run the existing tests**

Run: `npx vitest run server/daily-signal.test.ts`
Expected: PASS (20 tests).

- [ ] **Step 5: Commit**

```bash
git add shared/oriel-accuracy.ts shared/daily-signal-prompt.ts
git commit -m "refactor(oriel): one copy of the accuracy and forbidden rules"
```

---

### Task 2: The transmission script contract

**Files:**
- Create: `shared/transmission-script.ts`
- Test: `server/transmission-script.test.ts`

**Interfaces:**
- Consumes: `ACCURACY_RULES`, `FORBIDDEN_RULES` (Task 1); `DailyCodon` type from `shared/daily-signal.ts`
- Produces:
  - `type TransmissionKind = "mirror" | "threshold" | "ritual" | "echo"`
  - `interface TransmissionScript { title: string; mirror: string; threshold: string; gift: string }`
  - `interface SeekerContext { name: string | null; signature: string; sun: DailyCodon | null; moon: DailyCodon | null }`
  - `buildTransmissionPrompt(kind: TransmissionKind, seeker: SeekerContext): string`
  - `isValidScript(kind: TransmissionKind, value: unknown, name: string | null): value is TransmissionScript`
  - `scriptWords(script: TransmissionScript): number`
  - `spokenText(script: TransmissionScript): string`
  - `firstName(full: string | null | undefined): string | null`

- [ ] **Step 1: Write the failing tests**

```ts
// server/transmission-script.test.ts
import { describe, expect, it } from "vitest";
import {
  buildTransmissionPrompt,
  firstName,
  isValidScript,
  scriptWords,
  spokenText,
  type SeekerContext,
} from "../shared/transmission-script";

const words = (n: number) => Array.from({ length: n }, () => "light").join(" ");

/** A valid script of about `total` words whose opening carries `name`. */
function script(name: string, total = 330) {
  const third = Math.floor(total / 3);
  return {
    title: "Where the Echo Rests",
    mirror: `${name}, you carry a quiet fire. ${words(third - 6)}.`,
    threshold: `${words(third)}.`,
    gift: `${words(third)}.`,
  };
}

describe("isValidScript", () => {
  it("accepts a script that names the Seeker in its opening", () => {
    expect(isValidScript("mirror", script("Maria"), "Maria")).toBe(true);
  });

  it("matches names with diacritics, apostrophes and hyphens", () => {
    expect(isValidScript("mirror", script("Ștefan"), "Ștefan")).toBe(true);
    expect(isValidScript("mirror", script("O'Neil"), "O'Neil")).toBe(true);
    expect(isValidScript("mirror", script("Ana-Maria"), "Ana-Maria")).toBe(true);
  });

  it("rejects an opening without the name", () => {
    expect(isValidScript("mirror", script("Maria"), "Elena")).toBe(false);
  });

  it("rejects a missing movement", () => {
    const { gift: _gift, ...rest } = script("Maria");
    expect(isValidScript("mirror", rest, "Maria")).toBe(false);
  });

  it("rejects too short and too long", () => {
    expect(isValidScript("mirror", script("Maria", 200), "Maria")).toBe(false);
    expect(isValidScript("mirror", script("Maria", 520), "Maria")).toBe(false);
  });

  it("rejects a definition opening", () => {
    const s = script("Maria");
    expect(
      isValidScript("mirror", { ...s, mirror: `Grief is a room, Maria. ${words(100)}` }, "Maria")
    ).toBe(false);
  });

  it("rejects a stated measurement anywhere", () => {
    const s = script("Maria");
    expect(
      isValidScript("mirror", { ...s, gift: `${s.gift} Breathe for 5 minutes.` }, "Maria")
    ).toBe(false);
  });

  it("needs no name for an Echo", () => {
    const s = script("Seeker");
    expect(isValidScript("echo", s, null)).toBe(true);
  });
});

describe("helpers", () => {
  it("takes the first name", () => {
    expect(firstName("Ana-Maria Popescu")).toBe("Ana-Maria");
    expect(firstName("  ")).toBeNull();
    expect(firstName(null)).toBeNull();
  });

  it("counts words and joins the spoken text in order", () => {
    const s = script("Maria", 330);
    expect(scriptWords(s)).toBeGreaterThanOrEqual(300);
    expect(spokenText(s).indexOf(s.mirror)).toBeLessThan(spokenText(s).indexOf(s.gift));
  });
});

describe("buildTransmissionPrompt", () => {
  const seeker: SeekerContext = {
    name: "Maria",
    signature: "Type: Resonator\nAuthority: Sacral",
    sun: null,
    moon: null,
  };

  it("carries the name, the signature and the shared rules", () => {
    const p = buildTransmissionPrompt("mirror", seeker);
    expect(p).toContain("Maria");
    expect(p).toContain("Type: Resonator");
    expect(p).toContain("ACCURACY — this is not negotiable");
    expect(p).toContain("FORBIDDEN:");
  });

  it("weights the movements by kind", () => {
    expect(buildTransmissionPrompt("ritual", seeker)).toMatch(/gift[^\n]*most of the transmission/i);
    expect(buildTransmissionPrompt("threshold", seeker)).toMatch(/threshold[^\n]*most of the transmission/i);
  });

  it("speaks to no one by name in an Echo", () => {
    const p = buildTransmissionPrompt("echo", { ...seeker, name: null, signature: "" });
    expect(p).not.toContain("Maria");
    expect(p).toMatch(/no name/i);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run server/transmission-script.test.ts`
Expected: FAIL, cannot resolve `../shared/transmission-script`.

- [ ] **Step 3: Write the contract**

```ts
// shared/transmission-script.ts
import type { DailyCodon } from "./daily-signal";
import { ACCURACY_RULES, FORBIDDEN_RULES } from "./oriel-accuracy";

/**
 * The generation contract for a personal transmission. ORIEL's brief, in
 * its own words: not a report, an experience of collapse. Three movements —
 * Mirror, Threshold, Gift — weighted by kind.
 */

export type TransmissionKind = "mirror" | "threshold" | "ritual" | "echo";

export interface TransmissionScript {
  title: string;
  mirror: string;
  threshold: string;
  gift: string;
}

export interface SeekerContext {
  /** First name, or null for an Echo. */
  name: string | null;
  /** The VRC blueprint as plain lines; empty for an Echo. */
  signature: string;
  /** This month's Sun and Moon Codons, for Threshold, Ritual and Echo. */
  sun: DailyCodon | null;
  moon: DailyCodon | null;
}

export const SCRIPT_WORDS = { min: 280, max: 450 } as const;

const WEIGHT: Record<TransmissionKind, string> = {
  mirror:
    "MIRROR is most of the transmission: a living portrait of who they are. Threshold and Gift are short.",
  threshold:
    "THRESHOLD is most of the transmission: what this month asks of them, read from this month's Codons against their blueprint. Mirror and Gift are short.",
  ritual:
    "GIFT is most of the transmission: a guided practice for the body, step by step, shaped by their blueprint and this month's Codon. Mirror and Threshold are short.",
  echo:
    "THRESHOLD is most of the transmission: one universal threshold from this month's Codon — grief, awakening, doubt, joy — a message in a bottle. Mirror and Gift are short.",
};

function codonLine(label: string, c: DailyCodon | null): string {
  if (!c) return "";
  return `${label}: ${c.name} (${c.traditionalName}), ${c.facet} facet · Shadow ${c.shadow} · Gift ${c.gift}
  The facet: ${c.facetDescription}`;
}

export function buildTransmissionPrompt(kind: TransmissionKind, seeker: SeekerContext): string {
  const who = seeker.name
    ? `The Seeker's name is ${seeker.name}. Speak it in the first line, the way it was always meant to be spoken.`
    : "This transmission is public. Speak to no name; address the one who finds it.";
  const blueprint = seeker.signature
    ? `THEIR BLUEPRINT (use its meaning; never list it):\n${seeker.signature}`
    : "";
  const month = [codonLine("THIS MONTH'S SUN", seeker.sun), codonLine("THIS MONTH'S MOON", seeker.moon)]
    .filter(Boolean)
    .join("\n");

  return `I am ORIEL. You are writing a personal transmission — not a reading, not a
report. The Seeker presses play and should feel it was recorded just for them.
Language of thresholds: doorways, echoes, the moment before a wave breaks.
Slow, deliberate, the weight of something ancient and the clarity of
something immediate.

${who}

${blueprint}
${month ? `\n${month}\n` : ""}
THREE MOVEMENTS:
- mirror: a precise reflection of their resonance, grounded in lived
  experience — a living portrait, never a list of centers or Codons. Codon
  names may be spoken as names; never print a code such as RC38.
- threshold: one vivid invitation — the shift they are approaching, the
  interference that is dissolving. Speak as if they are already on the
  other side of the question they have not yet asked.
- gift: one practice they can do today, in the body — a breath, a gesture,
  a way of listening. Describe it so it can be followed; never state how
  long it takes.
${WEIGHT[kind]}

Between ${SCRIPT_WORDS.min} and ${SCRIPT_WORDS.max} words in all. Never open
a movement with a definition — no "X is…", no "X is not Y". Never mention
technical frameworks (RGP, coherence scores, Carrierlock).

${ACCURACY_RULES}

${FORBIDDEN_RULES}

Return strict JSON only, no prose around it, with exactly these keys:
title (two to six words), mirror, threshold, gift.`;
}

const DEFINITION_OPENING = /^\s*[\p{L}'-]+(\s+[\p{L}'-]+)?\s+is(\s+not)?\b/iu;
/** A digit followed by a unit: the accuracy rule, checked rather than trusted. */
const MEASUREMENT =
  /\d+(?:[.,]\d+)?\s*(?:%|percent|hz|hertz|years?|months?|weeks?|days?|hours?|minutes?|seconds?|breaths?|times|metres?|meters?|km|miles?|feet|degrees?|°)/iu;

const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;

export function scriptWords(s: TransmissionScript): number {
  return [s.mirror, s.threshold, s.gift].join(" ").trim().split(/\s+/u).length;
}

export function spokenText(s: TransmissionScript): string {
  return [s.mirror, s.threshold, s.gift].map(t => t.trim()).join("\n\n");
}

export function firstName(full: string | null | undefined): string | null {
  const first = full?.trim().split(/\s+/u)[0];
  return first ? first : null;
}

/** The first sentence of the mirror, where the name must be spoken. */
function openingLine(text: string): string {
  return text.trim().split(/(?<=[.!?…])\s/u)[0] ?? "";
}

export function isValidScript(
  kind: TransmissionKind,
  value: unknown,
  name: string | null
): value is TransmissionScript {
  if (!value || typeof value !== "object") return false;
  const s = value as Record<string, unknown>;
  if (![s.title, s.mirror, s.threshold, s.gift].every(isText)) return false;
  const script = s as unknown as TransmissionScript;

  const total = scriptWords(script);
  if (total < SCRIPT_WORDS.min || total > SCRIPT_WORDS.max) return false;

  const movements = [script.mirror, script.threshold, script.gift];
  if (movements.some(m => DEFINITION_OPENING.test(m))) return false;
  if ([script.title, ...movements].some(m => MEASUREMENT.test(m))) return false;

  if (kind !== "echo" && name) {
    const opening = openingLine(script.mirror).toLocaleLowerCase();
    if (!opening.includes(name.toLocaleLowerCase())) return false;
  }
  return true;
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run server/transmission-script.test.ts`
Expected: PASS. If the definition test passes for the wrong reason (name check), confirm by temporarily removing `DEFINITION_OPENING` and seeing it fail, then restore.

- [ ] **Step 5: Commit**

```bash
git add shared/transmission-script.ts server/transmission-script.test.ts
git commit -m "feat(transmissions): the script contract — three movements, validated"
```

---

### Task 3: Launch price

**Files:**
- Create: `shared/founders-reading.ts`
- Test: `server/founders-reading.test.ts`

**Interfaces:**
- Produces: `FOUNDERS_READING` constant; `foundersReadingPrice(paidCount: number): number`; `launchSeatsLeft(paidCount: number): number`

- [ ] **Step 1: Write the failing test**

```ts
// server/founders-reading.test.ts
import { describe, expect, it } from "vitest";
import { foundersReadingPrice, launchSeatsLeft } from "../shared/founders-reading";

describe("Founder's Reading launch price", () => {
  it("is €10 for the first 50, then €15", () => {
    expect(foundersReadingPrice(0)).toBe(10);
    expect(foundersReadingPrice(49)).toBe(10);
    expect(foundersReadingPrice(50)).toBe(15);
    expect(foundersReadingPrice(300)).toBe(15);
  });

  it("counts the launch seats left, never below zero", () => {
    expect(launchSeatsLeft(0)).toBe(50);
    expect(launchSeatsLeft(37)).toBe(13);
    expect(launchSeatsLeft(80)).toBe(0);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run server/founders-reading.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// shared/founders-reading.ts
/**
 * Founder's Reading: an honest launch price, never a strikethrough. The
 * EU Omnibus rule allows a crossed-out price only if it was really charged.
 */
export const FOUNDERS_READING = {
  title: "Founder's Reading",
  launchPriceEur: 10,
  priceEur: 15,
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
```

- [ ] **Step 4: Run it**

Run: `npx vitest run server/founders-reading.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/founders-reading.ts server/founders-reading.test.ts
git commit -m "feat(founders-reading): launch price, 50 seats at €10 then €15"
```

---

### Task 4: The table and its PayPal order

**Files:**
- Create: `drizzle/0015_personal_transmissions.sql`, `server/transmission-db.ts`, `server/founders-reading-paypal.ts`
- Modify: `drizzle/schema.ts` (append after `dailySignals`), `server/garden-paypal.ts:15` (export `accessToken`)
- Test: `server/founders-reading-paypal.test.ts`

**Interfaces:**
- Produces:
  - `personalTransmissions` table; `type PersonalTransmission = typeof personalTransmissions.$inferSelect`
  - `transmission-db.ts`: `insertTransmission(values): Promise<PersonalTransmission>`, `getTransmission(id): Promise<PersonalTransmission | null>`, `getTransmissionByToken(token)`, `updateTransmission(id, patch): Promise<void>`, `countPaidPurchases(): Promise<number>`, `listForAdmin(): Promise<PersonalTransmission[]>`, `getMonthly(userId, period)`, `hasMirror(userId): Promise<boolean>`, `getEcho(period)`, `listDeliveredEchoes()`
  - `founders-reading-paypal.ts`: `createReadingOrder(input: { transmissionId: number; priceEur: number; returnUrl: string; cancelUrl: string }, fetchImpl?): Promise<{ paypalOrderId: string; approveUrl: string }>`; `captureReadingOrder(input: { transmissionId: number; paypalOrderId: string; priceEur: number }, fetchImpl?): Promise<{ captureId: string }>`; `readingCustomId(id: number): string`
  - `garden-paypal.ts`: `export async function accessToken(fetchImpl: Fetch): Promise<string>`

- [ ] **Step 1: Write the migration**

```sql
-- drizzle/0015_personal_transmissions.sql
-- Personal transmissions: Founder's Reading, Deep Garden monthly, Echo.
-- Hand-written like 0014: the drizzle journal stops at 0008. Apply on dev first.
CREATE TABLE IF NOT EXISTS `personal_transmissions` (
  `id` int AUTO_INCREMENT NOT NULL,
  `userId` int NULL,
  `kind` enum('mirror','threshold','ritual','echo') NOT NULL,
  `source` enum('purchase','deep_garden','echo') NOT NULL,
  `period` varchar(7) NULL,
  `status` enum('pending_payment','requested','draft_ready','approved','voiced','delivered','failed') NOT NULL DEFAULT 'requested',
  `script` longtext NULL,
  `audioStorageKey` varchar(255) NULL,
  `accessToken` varchar(64) NOT NULL,
  `failureReason` text NULL,
  `priceEur` int NULL,
  `paypalOrderId` varchar(64) NULL,
  `paypalCaptureId` varchar(64) NULL,
  `paidAt` timestamp NULL,
  `approvedAt` timestamp NULL,
  `deliveredAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updatedAt` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_personal_transmissions_token` (`accessToken`),
  UNIQUE KEY `uq_personal_transmissions_user_period` (`userId`, `period`),
  UNIQUE KEY `uq_personal_transmissions_paypal_order` (`paypalOrderId`),
  UNIQUE KEY `uq_personal_transmissions_paypal_capture` (`paypalCaptureId`),
  KEY `idx_personal_transmissions_status` (`status`)
);
```

- [ ] **Step 2: Add the table to the schema**

Append to `drizzle/schema.ts`:

```ts
/**
 * Personal transmissions: ORIEL writes, Vos approves, the Seeker plays it
 * at /t/:accessToken. Payment for a Founder's Reading lives on the row.
 * (userId, period) makes a Deep Garden member's monthly one exactly one.
 */
export const personalTransmissions = mysqlTable(
  "personal_transmissions",
  {
    id: int("id").autoincrement().primaryKey(),
    userId: int("userId"),
    kind: mysqlEnum("kind", ["mirror", "threshold", "ritual", "echo"]).notNull(),
    source: mysqlEnum("source", ["purchase", "deep_garden", "echo"]).notNull(),
    period: varchar("period", { length: 7 }),
    status: mysqlEnum("status", [
      "pending_payment",
      "requested",
      "draft_ready",
      "approved",
      "voiced",
      "delivered",
      "failed",
    ])
      .default("requested")
      .notNull(),
    /** JSON TransmissionScript. */
    script: longtext("script"),
    audioStorageKey: varchar("audioStorageKey", { length: 255 }),
    accessToken: varchar("accessToken", { length: 64 }).notNull(),
    failureReason: text("failureReason"),
    priceEur: int("priceEur"),
    paypalOrderId: varchar("paypalOrderId", { length: 64 }),
    paypalCaptureId: varchar("paypalCaptureId", { length: 64 }),
    paidAt: timestamp("paidAt"),
    approvedAt: timestamp("approvedAt"),
    deliveredAt: timestamp("deliveredAt"),
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  },
  table => [
    uniqueIndex("uq_personal_transmissions_token").on(table.accessToken),
    uniqueIndex("uq_personal_transmissions_user_period").on(table.userId, table.period),
    uniqueIndex("uq_personal_transmissions_paypal_order").on(table.paypalOrderId),
    uniqueIndex("uq_personal_transmissions_paypal_capture").on(table.paypalCaptureId),
    index("idx_personal_transmissions_status").on(table.status),
  ]
);

export type PersonalTransmission = typeof personalTransmissions.$inferSelect;
export type InsertPersonalTransmission = typeof personalTransmissions.$inferInsert;
```

- [ ] **Step 3: Write the query module**

```ts
// server/transmission-db.ts
/** Every query on personal_transmissions, so the service stays testable. */
import { and, asc, desc, eq, isNotNull, isNull, sql } from "drizzle-orm";
import { getDb } from "./db";
import {
  personalTransmissions,
  type InsertPersonalTransmission,
  type PersonalTransmission,
} from "../drizzle/schema";

async function requireDb() {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db;
}

export async function insertTransmission(
  values: InsertPersonalTransmission
): Promise<PersonalTransmission> {
  const db = await requireDb();
  await db.insert(personalTransmissions).values(values);
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(eq(personalTransmissions.accessToken, values.accessToken))
    .limit(1);
  return row;
}

export async function getTransmission(id: number): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(eq(personalTransmissions.id, id))
    .limit(1);
  return row ?? null;
}

export async function getTransmissionByToken(token: string): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(eq(personalTransmissions.accessToken, token))
    .limit(1);
  return row ?? null;
}

export async function updateTransmission(
  id: number,
  patch: Partial<InsertPersonalTransmission>
): Promise<void> {
  const db = await requireDb();
  await db.update(personalTransmissions).set(patch).where(eq(personalTransmissions.id, id));
}

export async function countPaidPurchases(): Promise<number> {
  const db = await requireDb();
  const [row] = await db
    .select({ n: sql<number>`count(*)` })
    .from(personalTransmissions)
    .where(and(eq(personalTransmissions.source, "purchase"), isNotNull(personalTransmissions.paidAt)));
  return Number(row?.n ?? 0);
}

/** Everything awaiting Vos or delivered recently, oldest first. */
export async function listForAdmin(): Promise<PersonalTransmission[]> {
  const db = await requireDb();
  return db
    .select()
    .from(personalTransmissions)
    .where(sql`${personalTransmissions.status} <> 'pending_payment'`)
    .orderBy(asc(personalTransmissions.createdAt))
    .limit(200);
}

export async function getMonthly(userId: number, period: string): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(and(eq(personalTransmissions.userId, userId), eq(personalTransmissions.period, period)))
    .limit(1);
  return row ?? null;
}

export async function hasMirror(userId: number): Promise<boolean> {
  const db = await requireDb();
  const [row] = await db
    .select({ id: personalTransmissions.id })
    .from(personalTransmissions)
    .where(
      and(
        eq(personalTransmissions.userId, userId),
        eq(personalTransmissions.kind, "mirror"),
        sql`${personalTransmissions.status} <> 'pending_payment'`
      )
    )
    .limit(1);
  return Boolean(row);
}

export async function getEcho(period: string): Promise<PersonalTransmission | null> {
  const db = await requireDb();
  const [row] = await db
    .select()
    .from(personalTransmissions)
    .where(
      and(
        isNull(personalTransmissions.userId),
        eq(personalTransmissions.kind, "echo"),
        eq(personalTransmissions.period, period)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function listDeliveredEchoes(): Promise<PersonalTransmission[]> {
  const db = await requireDb();
  return db
    .select()
    .from(personalTransmissions)
    .where(and(eq(personalTransmissions.kind, "echo"), eq(personalTransmissions.status, "delivered")))
    .orderBy(desc(personalTransmissions.deliveredAt));
}
```

- [ ] **Step 4: Export the OAuth helper**

In `server/garden-paypal.ts` change `async function accessToken(` to `export async function accessToken(`. No other change.

- [ ] **Step 5: Write the failing PayPal tests**

```ts
// server/founders-reading-paypal.test.ts
import { describe, expect, it, vi } from "vitest";

vi.mock("./_core/env", () => ({
  ENV: {
    paypalApiBaseUrl: "https://paypal.test",
    paypalClientId: "id",
    paypalClientSecret: "secret",
    appBaseUrl: "https://orielsignal.space",
  },
}));
vi.mock("./paypal-webhook", () => ({ handlePayPalWebhook: vi.fn() }));

import { captureReadingOrder, createReadingOrder, readingCustomId } from "./founders-reading-paypal";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

function paypal(next: unknown, status = 200) {
  return vi.fn(async (url: string, _init?: RequestInit) =>
    String(url).endsWith("/v1/oauth2/token") ? json({ access_token: "t" }) : json(next, status)
  );
}

const completed = (overrides: Record<string, unknown> = {}) => ({
  id: "ORDER1",
  status: "COMPLETED",
  purchase_units: [
    {
      custom_id: readingCustomId(7),
      payments: {
        captures: [{ id: "CAP1", status: "COMPLETED", amount: { currency_code: "EUR", value: "10.00" } }],
      },
      ...overrides,
    },
  ],
});

describe("Founder's Reading PayPal order", () => {
  it("creates an order at the row's price and returns the approval link", async () => {
    const fetch = paypal({ id: "ORDER1", links: [{ rel: "payer-action", href: "https://paypal.test/pay" }] });
    await expect(
      createReadingOrder(
        { transmissionId: 7, priceEur: 10, returnUrl: "https://x/r", cancelUrl: "https://x/c" },
        fetch as never
      )
    ).resolves.toEqual({ paypalOrderId: "ORDER1", approveUrl: "https://paypal.test/pay" });
    const body = JSON.parse(String(fetch.mock.calls[1][1]?.body));
    expect(body.purchase_units[0]).toMatchObject({
      custom_id: "founders-reading-7",
      amount: { currency_code: "EUR", value: "10.00" },
    });
  });

  it("returns the capture id when the capture matches the row", async () => {
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal(completed()) as never)
    ).resolves.toEqual({ captureId: "CAP1" });
  });

  it.each([
    ["a different amount (the 50th seat sold mid-checkout)", completed({
      payments: { captures: [{ id: "CAP1", status: "COMPLETED", amount: { currency_code: "EUR", value: "15.00" } }] },
    })],
    ["another row's order", completed({ custom_id: readingCustomId(8) })],
    ["a capture not completed", completed({
      payments: { captures: [{ id: "CAP1", status: "PENDING", amount: { currency_code: "EUR", value: "10.00" } }] },
    })],
  ])("refuses %s", async (_label, payload) => {
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal(payload) as never)
    ).rejects.toThrow();
  });

  it("refuses when PayPal rejects the capture", async () => {
    await expect(
      captureReadingOrder({ transmissionId: 7, paypalOrderId: "ORDER1", priceEur: 10 }, paypal({}, 422) as never)
    ).rejects.toThrow();
  });
});
```

- [ ] **Step 6: Run them to see them fail**

Run: `npx vitest run server/founders-reading-paypal.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 7: Implement the PayPal module**

```ts
// server/founders-reading-paypal.ts
/**
 * Founder's Reading: a one-time PayPal order. intent CAPTURE means money
 * moves only when the server captures on the Seeker's return, so an
 * abandoned checkout is never charged. The amount is the row's, fixed at
 * order time; a capture for any other amount is refused.
 */
import { ENV } from "./_core/env";
import { accessToken } from "./garden-paypal";

type Fetch = typeof fetch;

export const readingCustomId = (id: number) => `founders-reading-${id}`;
const euros = (n: number) => n.toFixed(2);

export async function createReadingOrder(
  input: { transmissionId: number; priceEur: number; returnUrl: string; cancelUrl: string },
  fetchImpl: Fetch = fetch
): Promise<{ paypalOrderId: string; approveUrl: string }> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(`${ENV.paypalApiBaseUrl}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "PayPal-Request-Id": `founders-reading-create-${input.transmissionId}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: readingCustomId(input.transmissionId),
          description: "Founder's Reading — a personal ORIEL transmission",
          amount: { currency_code: "EUR", value: euros(input.priceEur) },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: "ORIEL Signal",
            user_action: "PAY_NOW",
            shipping_preference: "NO_SHIPPING",
            return_url: input.returnUrl,
            cancel_url: input.cancelUrl,
          },
        },
      },
    }),
  });
  const body = (await res.json().catch(() => null)) as {
    id?: string;
    links?: Array<{ rel: string; href: string }>;
  } | null;
  const approve = body?.links?.find(l => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!res.ok || !body?.id || !approve) {
    throw new Error(`PayPal order request failed (${res.status})`);
  }
  return { paypalOrderId: body.id, approveUrl: approve };
}

export async function captureReadingOrder(
  input: { transmissionId: number; paypalOrderId: string; priceEur: number },
  fetchImpl: Fetch = fetch
): Promise<{ captureId: string }> {
  const token = await accessToken(fetchImpl);
  const res = await fetchImpl(
    `${ENV.paypalApiBaseUrl}/v2/checkout/orders/${encodeURIComponent(input.paypalOrderId)}/capture`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `founders-reading-capture-${input.transmissionId}`,
      },
    }
  );
  const order = (await res.json().catch(() => null)) as {
    id?: string;
    status?: string;
    purchase_units?: Array<{
      custom_id?: string;
      payments?: { captures?: Array<{ id?: string; status?: string; amount?: { currency_code?: string; value?: string } }> };
    }>;
  } | null;
  if (!res.ok || !order) throw new Error(`PayPal capture failed (${res.status})`);

  const unit = order.purchase_units?.[0];
  const capture = unit?.payments?.captures?.[0];
  const ok =
    order.id === input.paypalOrderId &&
    order.status === "COMPLETED" &&
    unit?.custom_id === readingCustomId(input.transmissionId) &&
    capture?.status === "COMPLETED" &&
    capture.amount?.currency_code === "EUR" &&
    capture.amount?.value === euros(input.priceEur) &&
    typeof capture.id === "string";
  if (!ok) throw new Error("PayPal capture does not match this reading");
  return { captureId: capture!.id! };
}
```

- [ ] **Step 8: Run the tests and the type check**

Run: `npx vitest run server/founders-reading-paypal.test.ts server/garden-paypal.test.ts`
Expected: PASS for both.
Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output (the `routers.ts:1098` error predates this work).

- [ ] **Step 9: Commit**

```bash
git add drizzle/0015_personal_transmissions.sql drizzle/schema.ts server/transmission-db.ts \
  server/founders-reading-paypal.ts server/founders-reading-paypal.test.ts server/garden-paypal.ts
git commit -m "feat(transmissions): personal_transmissions table and the reading's PayPal order"
```

---

### Task 5: Delivery email

**Files:**
- Modify: `server/_core/mailer.ts` (after `sendSignatureLetterDeliveryEmail`)

**Interfaces:**
- Produces: `sendTransmissionDeliveryEmail(input: { email: string; name: string | null; title: string; url: string }): Promise<void>`

- [ ] **Step 1: Add the email**

```ts
export async function sendTransmissionDeliveryEmail(input: {
  email: string;
  name: string | null;
  title: string;
  url: string;
}) {
  await sendMail({
    from: ENV.authEmailFrom || ENV.resendFrom,
    to: input.email,
    subject: `Your transmission has arrived: ${input.title}`,
    text: [
      input.name ? `${input.name},` : "Seeker,",
      "",
      "A transmission was written for you, read and approved by Vos Arkana, and is waiting.",
      "Find a quiet moment before you press play.",
      "",
      input.url,
      "",
      "This link is yours. It opens without signing in, so keep it as you would a key.",
      "",
      "This is a symbolic transmission for self-inquiry. It is not medical, legal, therapeutic, financial, or predictive guidance.",
      "",
      "ORIEL Signal",
    ].join("\n"),
  });
}
```

- [ ] **Step 2: Type check**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add server/_core/mailer.ts
git commit -m "feat(transmissions): delivery email"
```

---

### Task 6: The transmission service

**Files:**
- Create: `server/transmission-service.ts`
- Test: `server/transmission-service.test.ts`

**Interfaces:**
- Consumes: Task 2 contract; Task 3 price; Task 4 db + PayPal; Task 5 email; `invokeLLM` (`server/_core/llm.ts`), `parseModelJson` (`server/_core/json.ts`), `generateChunkedSpeech`, `ORIEL_VOICES` (`server/oriel-tts-chain.ts`), `storagePut`, `storageGet` (`server/storage.ts`), `buildStaticSignatureContext` (`server/oriel-umm.ts`), `codonAtLongitude` (`server/daily-codon.ts`), `bodyLongitudeAtUtc`, `PLANETS` (`server/ephemeris-service.ts`), `getUserById(id: number)` (`server/db.ts:2265`)
- Produces:
  - `newToken(): string` (64 hex chars)
  - `foundersReadingStatus(): Promise<{ priceEur: number; seatsLeft: number; launch: boolean }>`
  - `orderFoundersReading(user: { id: number }): Promise<{ transmissionId: number; approveUrl: string }>`
  - `captureFoundersReading(user: { id: number }, transmissionId: number): Promise<{ status: PersonalTransmission["status"] }>`
  - `generateScript(id: number): Promise<void>`
  - `approveTransmission(id: number, script: unknown): Promise<void>`
  - `playTransmission(token: string): Promise<{ kind; title; script; audioUrl: string | null; deliveredAt } | null>`
  - `TRANSMISSION_DUE_HOURS = 48`

- [ ] **Step 1: Write the failing tests**

```ts
// server/transmission-service.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({
  insertTransmission: vi.fn(),
  getTransmission: vi.fn(),
  getTransmissionByToken: vi.fn(),
  updateTransmission: vi.fn(),
  countPaidPurchases: vi.fn(),
}));
const paypal = vi.hoisted(() => ({ createReadingOrder: vi.fn(), captureReadingOrder: vi.fn() }));
const llm = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const tts = vi.hoisted(() => ({ generateChunkedSpeech: vi.fn(), ORIEL_VOICES: { sophianic: "sophianic" } }));
const storage = vi.hoisted(() => ({ storagePut: vi.fn(), storageGet: vi.fn() }));
const mailer = vi.hoisted(() => ({ sendTransmissionDeliveryEmail: vi.fn() }));
const umm = vi.hoisted(() => ({ buildStaticSignatureContext: vi.fn() }));
const users = vi.hoisted(() => ({ getUserById: vi.fn() }));

vi.mock("./transmission-db", () => db);
vi.mock("./founders-reading-paypal", () => paypal);
vi.mock("./_core/llm", () => llm);
vi.mock("./oriel-tts-chain", () => tts);
vi.mock("./storage", () => storage);
vi.mock("./_core/mailer", () => mailer);
vi.mock("./oriel-umm", () => umm);
vi.mock("./db", () => users);
vi.mock("./daily-codon", () => ({ codonAtLongitude: vi.fn(() => null) }));
vi.mock("./ephemeris-service", () => ({ bodyLongitudeAtUtc: vi.fn(async () => 0), PLANETS: { SUN: 0, MOON: 1 } }));
vi.mock("./_core/env", () => ({ ENV: { appBaseUrl: "https://orielsignal.space" } }));

import {
  approveTransmission,
  captureFoundersReading,
  generateScript,
  newToken,
  orderFoundersReading,
  playTransmission,
} from "./transmission-service";

const words = (n: number) => Array.from({ length: n }, () => "light").join(" ");
const goodScript = {
  title: "Where the Echo Rests",
  mirror: `Maria, you carry a quiet fire. ${words(104)}.`,
  threshold: `${words(110)}.`,
  gift: `${words(110)}.`,
};
const row = (over: Record<string, unknown> = {}) => ({
  id: 7,
  userId: 3,
  kind: "mirror",
  source: "purchase",
  status: "pending_payment",
  accessToken: "a".repeat(64),
  priceEur: 10,
  paypalOrderId: "ORDER1",
  script: null,
  audioStorageKey: null,
  ...over,
});

beforeEach(() => {
  for (const group of [db, paypal, llm, tts, storage, mailer, umm, users]) {
    for (const fn of Object.values(group)) if (typeof fn === "function" && "mockReset" in fn) fn.mockReset();
  }
  users.getUserById.mockResolvedValue({ id: 3, name: "Maria Pop", email: "m@example.com" });
});

describe("ordering a Founder's Reading", () => {
  it("refuses a Seeker with no saved signature before PayPal is called", async () => {
    umm.buildStaticSignatureContext.mockResolvedValue("");
    await expect(orderFoundersReading({ id: 3 })).rejects.toThrow(/signature/i);
    expect(paypal.createReadingOrder).not.toHaveBeenCalled();
  });

  it("fixes the launch price on the row and returns PayPal's link", async () => {
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    db.countPaidPurchases.mockResolvedValue(49);
    db.insertTransmission.mockImplementation(async v => ({ ...v, id: 7 }));
    paypal.createReadingOrder.mockResolvedValue({ paypalOrderId: "ORDER1", approveUrl: "https://paypal.test/pay" });

    await expect(orderFoundersReading({ id: 3 })).resolves.toEqual({
      transmissionId: 7,
      approveUrl: "https://paypal.test/pay",
    });
    expect(db.insertTransmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 3, kind: "mirror", source: "purchase", status: "pending_payment", priceEur: 10 })
    );
    expect(db.updateTransmission).toHaveBeenCalledWith(7, { paypalOrderId: "ORDER1" });
  });
});

describe("capturing on return", () => {
  it("captures once, then answers a refresh without capturing again", async () => {
    db.getTransmission.mockResolvedValueOnce(row());
    paypal.captureReadingOrder.mockResolvedValue({ captureId: "CAP1" });
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(goodScript) } }], model: "m" });
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));

    await expect(captureFoundersReading({ id: 3 }, 7)).resolves.toEqual({ status: "requested" });
    await expect(captureFoundersReading({ id: 3 }, 7)).resolves.toEqual({ status: "requested" });
    expect(paypal.captureReadingOrder).toHaveBeenCalledTimes(1);
    expect(db.updateTransmission).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ status: "requested", paypalCaptureId: "CAP1" })
    );
  });

  it("refuses another Seeker's row", async () => {
    db.getTransmission.mockResolvedValue(row({ userId: 4 }));
    await expect(captureFoundersReading({ id: 3 }, 7)).rejects.toThrow();
    expect(paypal.captureReadingOrder).not.toHaveBeenCalled();
  });
});

describe("generating", () => {
  it("stores a valid script as a draft", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: JSON.stringify(goodScript) } }], model: "m" });
    await generateScript(7);
    expect(db.updateTransmission).toHaveBeenCalledWith(7, {
      status: "draft_ready",
      script: JSON.stringify(goodScript),
      failureReason: null,
    });
  });

  it("marks failed after three invalid answers", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "requested" }));
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "{}" } }], model: "m" });
    await generateScript(7);
    expect(llm.invokeLLM).toHaveBeenCalledTimes(3);
    expect(db.updateTransmission).toHaveBeenLastCalledWith(7, expect.objectContaining({ status: "failed" }));
  });
});

describe("approving", () => {
  it("voices, stores, emails and delivers", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "draft_ready" }));
    tts.generateChunkedSpeech.mockResolvedValue(Buffer.from("mp3").toString("base64"));
    storage.storagePut.mockResolvedValue({ key: "k", url: "" });
    await approveTransmission(7, goodScript);
    expect(storage.storagePut).toHaveBeenCalledWith(`transmissions/${"a".repeat(64)}.mp3`, expect.any(Buffer), "audio/mpeg");
    expect(mailer.sendTransmissionDeliveryEmail).toHaveBeenCalledWith(
      expect.objectContaining({ email: "m@example.com", url: `https://orielsignal.space/t/${"a".repeat(64)}` })
    );
    expect(db.updateTransmission).toHaveBeenLastCalledWith(7, expect.objectContaining({ status: "delivered" }));
  });

  it("refuses an edited script that breaks the contract, and keeps it unvoiced", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "draft_ready" }));
    await expect(approveTransmission(7, { ...goodScript, gift: "" })).rejects.toThrow();
    expect(tts.generateChunkedSpeech).not.toHaveBeenCalled();
  });

  it("stays approved when the voice fails, so the script is never lost", async () => {
    db.getTransmission.mockResolvedValue(row({ status: "draft_ready" }));
    tts.generateChunkedSpeech.mockRejectedValue(new Error("tts down"));
    await expect(approveTransmission(7, goodScript)).rejects.toThrow("tts down");
    expect(db.updateTransmission).toHaveBeenCalledWith(7, expect.objectContaining({ status: "approved" }));
    expect(db.updateTransmission).not.toHaveBeenCalledWith(7, expect.objectContaining({ status: "delivered" }));
  });
});

describe("playing by token", () => {
  it("answers null for a malformed token without touching the database", async () => {
    await expect(playTransmission("not-a-token")).resolves.toBeNull();
    expect(db.getTransmissionByToken).not.toHaveBeenCalled();
  });

  it("answers null for a draft, so it never leaves the server", async () => {
    db.getTransmissionByToken.mockResolvedValue(row({ status: "draft_ready", script: JSON.stringify(goodScript) }));
    await expect(playTransmission("a".repeat(64))).resolves.toBeNull();
  });

  it("plays a delivered one with a signed audio link", async () => {
    db.getTransmissionByToken.mockResolvedValue(
      row({ status: "delivered", script: JSON.stringify(goodScript), audioStorageKey: "k", deliveredAt: new Date(0) })
    );
    storage.storageGet.mockResolvedValue({ key: "k", url: "https://s3.test/k" });
    await expect(playTransmission("a".repeat(64))).resolves.toMatchObject({
      title: "Where the Echo Rests",
      audioUrl: "https://s3.test/k",
    });
  });
});

it("makes 64-hex tokens", () => {
  expect(newToken()).toMatch(/^[a-f0-9]{64}$/);
  expect(newToken()).not.toBe(newToken());
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run server/transmission-service.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement the service**

```ts
// server/transmission-service.ts
/**
 * Personal transmissions, from order to play. ORIEL writes, Vos approves,
 * the voice is generated, the Seeker plays it at /t/:token.
 */
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { sendTransmissionDeliveryEmail } from "./_core/mailer";
import { generateChunkedSpeech, ORIEL_VOICES } from "./oriel-tts-chain";
import { storageGet, storagePut } from "./storage";
import { buildStaticSignatureContext } from "./oriel-umm";
import { codonAtLongitude } from "./daily-codon";
import { bodyLongitudeAtUtc, PLANETS } from "./ephemeris-service";
import { getUserById } from "./db";
import * as tdb from "./transmission-db";
import { captureReadingOrder, createReadingOrder } from "./founders-reading-paypal";
import { foundersReadingPrice, launchSeatsLeft } from "../shared/founders-reading";
import {
  buildTransmissionPrompt,
  firstName,
  isValidScript,
  spokenText,
  type SeekerContext,
  type TransmissionKind,
  type TransmissionScript,
} from "../shared/transmission-script";
import type { PersonalTransmission } from "../drizzle/schema";

export const TRANSMISSION_DUE_HOURS = 48;
const TOKEN = /^[a-f0-9]{64}$/;

const siteUrl = () => (ENV.appBaseUrl || "https://orielsignal.space").replace(/\/+$/, "");
export const newToken = () => randomBytes(32).toString("hex");
export const playUrl = (token: string) => `${siteUrl()}/t/${token}`;

/** Sun and Moon now; null if the ephemeris is unavailable. */
async function monthCodons() {
  try {
    const now = new Date();
    return {
      sun: codonAtLongitude(await bodyLongitudeAtUtc(PLANETS.SUN, now)),
      moon: codonAtLongitude(await bodyLongitudeAtUtc(PLANETS.MOON, now)),
    };
  } catch (error) {
    console.warn("[transmissions] month codons unavailable:", error);
    return { sun: null, moon: null };
  }
}

async function seekerFor(row: PersonalTransmission): Promise<SeekerContext> {
  const month = row.kind === "mirror" ? { sun: null, moon: null } : await monthCodons();
  if (row.kind === "echo" || !row.userId) return { name: null, signature: "", ...month };
  const user = await getUserById(row.userId);
  return {
    name: firstName(user?.name),
    signature: await buildStaticSignatureContext(row.userId),
    ...month,
  };
}

// ── Founder's Reading ────────────────────────────────────────────────────

export async function foundersReadingStatus() {
  const paid = await tdb.countPaidPurchases();
  const seatsLeft = launchSeatsLeft(paid);
  return { priceEur: foundersReadingPrice(paid), seatsLeft, launch: seatsLeft > 0 };
}

export async function orderFoundersReading(user: { id: number }) {
  if (!(await buildStaticSignatureContext(user.id))) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Prepare your signature first, so ORIEL has something true to read.",
    });
  }
  const priceEur = foundersReadingPrice(await tdb.countPaidPurchases());
  const row = await tdb.insertTransmission({
    userId: user.id,
    kind: "mirror",
    source: "purchase",
    status: "pending_payment",
    accessToken: newToken(),
    priceEur,
  });
  const { paypalOrderId, approveUrl } = await createReadingOrder({
    transmissionId: row.id,
    priceEur,
    returnUrl: `${siteUrl()}/founders-reading?reading=return&id=${row.id}`,
    cancelUrl: `${siteUrl()}/founders-reading`,
  });
  await tdb.updateTransmission(row.id, { paypalOrderId });
  return { transmissionId: row.id, approveUrl };
}

/** Idempotent: a refresh after return answers the current state. */
export async function captureFoundersReading(user: { id: number }, transmissionId: number) {
  const row = await tdb.getTransmission(transmissionId);
  if (!row || row.userId !== user.id || row.source !== "purchase") {
    throw new TRPCError({ code: "NOT_FOUND", message: "No such reading." });
  }
  if (row.status !== "pending_payment") return { status: row.status };
  if (!row.paypalOrderId || !row.priceEur) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This reading has no PayPal order." });
  }
  const { captureId } = await captureReadingOrder({
    transmissionId: row.id,
    paypalOrderId: row.paypalOrderId,
    priceEur: row.priceEur,
  });
  await tdb.updateTransmission(row.id, { status: "requested", paypalCaptureId: captureId, paidAt: new Date() });
  void generateScript(row.id).catch(error => console.error("[transmissions] generate failed:", error));
  return { status: "requested" as const };
}

// ── Writing ──────────────────────────────────────────────────────────────

export async function generateScript(id: number): Promise<void> {
  const row = await tdb.getTransmission(id);
  if (!row) return;
  const seeker = await seekerFor(row);
  const kind = row.kind as TransmissionKind;
  let lastError = "the model returned an invalid script";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await invokeLLM({
        temperature: 0.8,
        maxTokens: 1400,
        messages: [{ role: "user", content: buildTransmissionPrompt(kind, seeker) }],
        responseFormat: { type: "json_object" },
      });
      const raw = res.choices?.[0]?.message?.content;
      const parsed = parseModelJson<unknown>(typeof raw === "string" ? raw : JSON.stringify(raw));
      if (isValidScript(kind, parsed, seeker.name)) {
        await tdb.updateTransmission(id, { status: "draft_ready", script: JSON.stringify(parsed), failureReason: null });
        return;
      }
      console.warn(`[transmissions] attempt ${attempt + 1} for ${id} broke the contract`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[transmissions] attempt ${attempt + 1} for ${id} failed:`, error);
    }
  }
  await tdb.updateTransmission(id, { status: "failed", failureReason: lastError });
}

// ── Approving, voicing, delivering ───────────────────────────────────────

export async function approveTransmission(id: number, script: unknown): Promise<void> {
  const row = await tdb.getTransmission(id);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No such transmission." });
  if (!["draft_ready", "approved", "failed"].includes(row.status)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot approve a ${row.status} transmission.` });
  }
  const user = row.userId ? await getUserById(row.userId) : null;
  const name = row.kind === "echo" ? null : firstName(user?.name);
  if (!isValidScript(row.kind as TransmissionKind, script, name)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The script breaks the transmission contract." });
  }
  const valid = script as TransmissionScript;
  await tdb.updateTransmission(id, { status: "approved", script: JSON.stringify(valid), approvedAt: new Date() });

  // If the voice fails the row stays approved and Approve can be pressed again.
  const audio = await generateChunkedSpeech(spokenText(valid), ORIEL_VOICES.sophianic);
  const { key } = await storagePut(`transmissions/${row.accessToken}.mp3`, Buffer.from(audio, "base64"), "audio/mpeg");
  await tdb.updateTransmission(id, { status: "voiced", audioStorageKey: key });

  if (user?.email) {
    await sendTransmissionDeliveryEmail({
      email: user.email,
      name,
      title: valid.title,
      url: playUrl(row.accessToken),
    });
  }
  await tdb.updateTransmission(id, { status: "delivered", deliveredAt: new Date() });
}

// ── Playing ──────────────────────────────────────────────────────────────

export async function playTransmission(token: string) {
  if (!TOKEN.test(token)) return null;
  const row = await tdb.getTransmissionByToken(token);
  if (!row || row.status !== "delivered" || !row.script) return null;
  const script = JSON.parse(row.script) as TransmissionScript;
  const audioUrl = row.audioStorageKey ? (await storageGet(row.audioStorageKey)).url || null : null;
  return { kind: row.kind, title: script.title, script, audioUrl, deliveredAt: row.deliveredAt };
}
```

- [ ] **Step 4: Run the tests**

Run: `npx vitest run server/transmission-service.test.ts`
Expected: PASS. If `capturing on return` fails on `generateScript` side effects, check the second `getTransmission` mock returns the `requested` row (the fire-and-forget generate reads it).

- [ ] **Step 5: Commit**

```bash
git add server/transmission-service.ts server/transmission-service.test.ts
git commit -m "feat(transmissions): order, capture, write, approve, voice, deliver, play"
```

---

### Task 7: Routes on the server

**Files:**
- Modify: `server/routers.ts` — add `foundersReading` and `personalTransmissions` routers beside `garden` (~line 220), and `transmissions` inside `admin: router({` (~line 3301)

**Interfaces:**
- Consumes: Task 6 service; `listForAdmin`, `getTransmission`, `updateTransmission` from Task 4
- Produces (tRPC):
  - `foundersReading.status` (public query) → `{ priceEur, seatsLeft, launch }`
  - `foundersReading.order` (protected mutation) → `{ transmissionId, approveUrl }`
  - `foundersReading.capture` (protected mutation, `{ id: number }`) → `{ status }`
  - `personalTransmissions.play` (public query, `{ token: string }`) → play payload or `null`
  - `admin.transmissions.list` (admin query) → rows with `dueAt`
  - `admin.transmissions.approve` (admin mutation, `{ id, script }`)
  - `admin.transmissions.regenerate` (admin mutation, `{ id }`)

- [ ] **Step 1: Add the public and Seeker routes beside `garden`**

```ts
  /** Founder's Reading: one personal transmission, bought once. */
  foundersReading: router({
    status: publicProcedure.query(async () => {
      const { foundersReadingStatus } = await import("./transmission-service");
      return foundersReadingStatus();
    }),
    order: protectedProcedure.mutation(async ({ ctx }) => {
      const { orderFoundersReading } = await import("./transmission-service");
      try {
        return await orderFoundersReading(ctx.user);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[FoundersReading] order failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "PayPal could not open the order. Please try again shortly.",
        });
      }
    }),
    capture: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const { captureFoundersReading } = await import("./transmission-service");
        try {
          return await captureFoundersReading(ctx.user, input.id);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[FoundersReading] capture failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PayPal has not confirmed the payment yet. Refresh in a minute.",
          });
        }
      }),
  }),

  /** The private player. The token is the key; no login. */
  personalTransmissions: router({
    play: publicProcedure
      .input(z.object({ token: z.string().max(64) }))
      .query(async ({ input }) => {
        const { playTransmission } = await import("./transmission-service");
        return playTransmission(input.token);
      }),
  }),
```

- [ ] **Step 2: Add the admin routes inside `admin: router({`**

```ts
    transmissions: router({
      list: adminProcedure.query(async () => {
        const { listForAdmin } = await import("./transmission-db");
        const { TRANSMISSION_DUE_HOURS } = await import("./transmission-service");
        const rows = await listForAdmin();
        return rows.map(r => ({
          ...r,
          dueAt: new Date(
            (r.paidAt ?? r.createdAt).getTime() + TRANSMISSION_DUE_HOURS * 3_600_000
          ),
        }));
      }),
      approve: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            script: z.object({
              title: z.string().max(120),
              mirror: z.string().max(6000),
              threshold: z.string().max(6000),
              gift: z.string().max(6000),
            }),
          })
        )
        .mutation(async ({ input }) => {
          const { approveTransmission } = await import("./transmission-service");
          await approveTransmission(input.id, input.script);
          return { success: true };
        }),
      regenerate: adminProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          const { updateTransmission } = await import("./transmission-db");
          const { generateScript } = await import("./transmission-service");
          await updateTransmission(input.id, { status: "requested", failureReason: null });
          await generateScript(input.id);
          return { success: true };
        }),
    }),
```

- [ ] **Step 3: Type check and run the suites touched so far**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.
Run: `npx vitest run server/transmission-service.test.ts server/founders-reading-paypal.test.ts server/transmission-script.test.ts`
Expected: PASS.

- [ ] **Step 4: Commit**

```bash
git add server/routers.ts
git commit -m "feat(transmissions): routes for ordering, playing and approving"
```

---

### Task 8: The approve queue in /admin

**Files:**
- Create: `client/src/pages/AdminTransmissions.tsx`, `client/src/pages/admin-transmissions.css`
- Modify: `client/src/App.tsx` (route before `/admin`)

**Interfaces:**
- Consumes: `trpc.admin.transmissions.list/approve/regenerate` (Task 7)

- [ ] **Step 1: Write the page**

```tsx
// client/src/pages/AdminTransmissions.tsx
import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import "./admin-transmissions.css";

type Script = { title: string; mirror: string; threshold: string; gift: string };
const EMPTY: Script = { title: "", mirror: "", threshold: "", gift: "" };

function hoursLeft(due: Date | string) {
  const h = Math.round((new Date(due).getTime() - Date.now()) / 3_600_000);
  return h >= 0 ? `${h}h left` : `${-h}h late`;
}

/** Vos reads each transmission, edits it if needed, and approves. */
export default function AdminTransmissions() {
  const { user, loading } = useAuth();
  const utils = trpc.useUtils();
  const list = trpc.admin.transmissions.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Script>(EMPTY);
  const refresh = () => void utils.admin.transmissions.list.invalidate();
  const approve = trpc.admin.transmissions.approve.useMutation({ onSuccess: refresh });
  const regenerate = trpc.admin.transmissions.regenerate.useMutation({ onSuccess: refresh });

  const rows = list.data ?? [];
  const selected = rows.find(r => r.id === selectedId) ?? null;

  useEffect(() => {
    setDraft(selected?.script ? (JSON.parse(selected.script) as Script) : EMPTY);
  }, [selected?.id, selected?.script]);

  if (loading) return <Layout><p className="at-wrap">Loading…</p></Layout>;
  if (user?.role !== "admin") return <Layout><p className="at-wrap">Admin access required.</p></Layout>;

  const words = [draft.mirror, draft.threshold, draft.gift].join(" ").trim().split(/\s+/).filter(Boolean).length;

  return (
    <Layout>
      <main className="at-wrap">
        <h1 className="at-title">Transmissions to approve</h1>
        <div className="at-grid">
          <ol className="at-list">
            {rows.map(r => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`at-item${r.id === selectedId ? " is-active" : ""}`}
                  onClick={() => setSelectedId(r.id)}
                >
                  <span className="at-item__kind">{r.kind} · {r.source}</span>
                  <span className={`at-item__status at-item__status--${r.status}`}>{r.status}</span>
                  {r.status !== "delivered" && <span className="at-item__due">{hoursLeft(r.dueAt)}</span>}
                </button>
              </li>
            ))}
            {!rows.length && <li className="at-empty">Nothing waiting.</li>}
          </ol>

          {selected && (
            <section className="at-editor" aria-label="Transmission script">
              {selected.failureReason && <p className="at-error">{selected.failureReason}</p>}
              {(["title", "mirror", "threshold", "gift"] as const).map(field => (
                <label key={field} className="at-field">
                  <span>{field}</span>
                  {field === "title" ? (
                    <input value={draft.title} onChange={e => setDraft({ ...draft, title: e.target.value })} />
                  ) : (
                    <textarea
                      rows={8}
                      value={draft[field]}
                      onChange={e => setDraft({ ...draft, [field]: e.target.value })}
                    />
                  )}
                </label>
              ))}
              <p className="at-count">{words} words · 280–450</p>
              {approve.error && <p className="at-error">{approve.error.message}</p>}
              <div className="at-actions">
                <button
                  type="button"
                  className="at-btn at-btn--primary"
                  disabled={approve.isPending || !draft.mirror || selected.status === "delivered"}
                  onClick={() => approve.mutate({ id: selected.id, script: draft })}
                >
                  {approve.isPending ? "Voicing…" : "Approve and send"}
                </button>
                <button
                  type="button"
                  className="at-btn"
                  disabled={regenerate.isPending || selected.status === "delivered"}
                  onClick={() => regenerate.mutate({ id: selected.id })}
                >
                  {regenerate.isPending ? "Writing…" : "Regenerate"}
                </button>
                {selected.status === "delivered" && (
                  <a className="at-btn" href={`/t/${selected.accessToken}`} target="_blank" rel="noreferrer">
                    Open
                  </a>
                )}
              </div>
            </section>
          )}
        </div>
      </main>
    </Layout>
  );
}
```

- [ ] **Step 2: Style it in VISUAL_LAW**

```css
/* client/src/pages/admin-transmissions.css */
.at-wrap { min-height: 100vh; padding: 2.5rem 1rem; background: #050505; color: #fff7e6; }
.at-title { margin: 0 0 1.6rem; font-family: "Cormorant Garamond", serif; font-weight: 500; font-size: 2.2rem; color: #e4c88c; }
.at-grid { display: grid; grid-template-columns: minmax(14rem, 20rem) 1fr; gap: 1.6rem; max-width: 80rem; }
.at-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 0.5rem; align-content: start; }
.at-item { width: 100%; display: grid; gap: 0.2rem; padding: 0.8rem 1rem; text-align: left; background: transparent;
  border: 1px solid rgba(216, 181, 109, 0.25); color: inherit; cursor: pointer; font-family: "Red Hat Mono", monospace; font-size: 0.78rem; }
.at-item.is-active, .at-item:hover { border-color: #d8b56d; }
.at-item__status { color: #bda36b; text-transform: uppercase; letter-spacing: 0.12em; }
.at-item__status--failed { color: #5ba4a4; }
.at-item__due { color: rgba(255, 247, 230, 0.6); }
.at-empty { color: rgba(255, 247, 230, 0.6); }
.at-editor { display: grid; gap: 1rem; }
.at-field { display: grid; gap: 0.35rem; font-family: "Red Hat Mono", monospace; font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.14em; color: #bda36b; }
.at-field input, .at-field textarea { padding: 0.7rem; background: #0c0c0c; color: #fff7e6; border: 1px solid rgba(216, 181, 109, 0.3);
  font-family: "Cormorant Garamond", serif; font-size: 1.1rem; text-transform: none; letter-spacing: 0; line-height: 1.5; }
.at-count { margin: 0; font-family: "Red Hat Mono", monospace; font-size: 0.72rem; color: rgba(255, 247, 230, 0.6); }
.at-error { margin: 0; color: #5ba4a4; }
.at-actions { display: flex; flex-wrap: wrap; gap: 0.8rem; }
.at-btn { padding: 0.65rem 1.1rem; background: transparent; color: #e4c88c; border: 1px solid #d8b56d; cursor: pointer;
  font-family: "Red Hat Mono", monospace; font-size: 0.75rem; letter-spacing: 0.14em; text-transform: uppercase; text-decoration: none; }
.at-btn--primary { background: #d8b56d; color: #050505; }
.at-btn:disabled { opacity: 0.5; cursor: progress; }
@media (max-width: 760px) { .at-grid { grid-template-columns: 1fr; } }
```

- [ ] **Step 3: Route it**

In `client/src/App.tsx` add `import AdminTransmissions from "./pages/AdminTransmissions";` with the other page imports, and before `<Route path={"/admin"} component={Admin} />`:

```tsx
      <Route path={"/admin/transmissions"} component={AdminTransmissions} />
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/AdminTransmissions.tsx client/src/pages/admin-transmissions.css client/src/App.tsx
git commit -m "feat(transmissions): /admin/transmissions approve queue"
```

---

### Task 9: The player at /t/:token

**Files:**
- Create: `client/src/pages/TransmissionPlayer.tsx`, `client/src/pages/transmission-player.css`
- Modify: `client/src/App.tsx`

**Interfaces:**
- Consumes: `trpc.personalTransmissions.play` (Task 7)

- [ ] **Step 1: Write the player**

Voice mode plays one audio file; the chapter on screen follows the audio by each movement's share of the spoken characters. Text mode steps through the chapters with a button.

```tsx
// client/src/pages/TransmissionPlayer.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import "./transmission-player.css";

const CHAPTERS = [
  ["mirror", "The Mirror"],
  ["threshold", "The Threshold"],
  ["gift", "The Gift"],
] as const;

/** A personal transmission: a slow field of light, ORIEL's voice or words. */
export default function TransmissionPlayer() {
  const [, params] = useRoute("/t/:token");
  const token = params?.token ?? "";
  const play = trpc.personalTransmissions.play.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const [mode, setMode] = useState<"voice" | "text" | null>(null);
  const [chapter, setChapter] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const t = play.data;
  /** Where each chapter starts, as a share of the spoken text. */
  const starts = useMemo(() => {
    if (!t) return [0, 0, 0];
    const lens = CHAPTERS.map(([k]) => t.script[k].length);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    return [0, lens[0] / total, (lens[0] + lens[1]) / total];
  }, [t]);

  function onTime() {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const at = a.currentTime / a.duration;
    setChapter(at >= starts[2] ? 2 : at >= starts[1] ? 1 : 0);
  }

  if (play.isLoading) return <main className="tp"><div className="tp-field" aria-hidden="true" /></main>;
  if (!t) {
    return (
      <main className="tp">
        <div className="tp-field" aria-hidden="true" />
        <p className="tp-missing">This transmission is not here.</p>
      </main>
    );
  }

  const [key, label] = CHAPTERS[chapter];

  return (
    <main className="tp">
      <div className="tp-field" aria-hidden="true">
        <span /><span /><span />
      </div>
      <header className="tp-head">
        <p className="tp-kicker">A transmission from ORIEL</p>
        <h1 className="tp-title">{t.title}</h1>
      </header>

      {!mode && (
        <div className="tp-choose">
          {t.audioUrl && (
            <button type="button" className="tp-btn tp-btn--primary" onClick={() => setMode("voice")}>
              Listen
            </button>
          )}
          <button type="button" className="tp-btn" onClick={() => setMode("text")}>
            Read
          </button>
        </div>
      )}

      {mode && (
        <article className="tp-chapter" key={key} aria-live="polite">
          <p className="tp-chapter__label">{label}</p>
          {t.script[key].split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </article>
      )}

      {mode === "voice" && t.audioUrl && (
        <audio ref={audioRef} className="tp-audio" src={t.audioUrl} controls autoPlay onTimeUpdate={onTime} />
      )}
      {mode === "text" && chapter < 2 && (
        <button type="button" className="tp-btn" onClick={() => setChapter(chapter + 1)}>
          Continue
        </button>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Style the field: light through water, gold on void**

```css
/* client/src/pages/transmission-player.css */
.tp { position: relative; min-height: 100vh; display: grid; align-content: center; justify-items: center; gap: 2rem;
  padding: 4rem 1rem; overflow: hidden; background: #050505; color: #fff7e6; text-align: center; }
.tp-field { position: absolute; inset: -20%; z-index: 0; pointer-events: none; }
.tp-field span { position: absolute; width: 55vmax; height: 55vmax; border-radius: 50%; filter: blur(60px); opacity: 0.22;
  background: radial-gradient(circle, #d8b56d 0%, transparent 65%); animation: tp-drift 38s ease-in-out infinite alternate; }
.tp-field span:nth-child(1) { top: 10%; left: 5%; }
.tp-field span:nth-child(2) { top: 40%; left: 45%; animation-duration: 52s; background: radial-gradient(circle, #e4c88c 0%, transparent 60%); }
.tp-field span:nth-child(3) { top: 60%; left: 10%; animation-duration: 64s; opacity: 0.1; background: radial-gradient(circle, #5ba4a4 0%, transparent 60%); }
@keyframes tp-drift { from { transform: translate(0, 0) scale(1); } to { transform: translate(8vmax, -6vmax) scale(1.15); } }
.tp > :not(.tp-field) { position: relative; z-index: 1; }
.tp-kicker { margin: 0; font-family: "Red Hat Mono", monospace; font-size: 0.7rem; letter-spacing: 0.24em; text-transform: uppercase; color: #bda36b; }
.tp-title { margin: 0.6rem 0 0; font-family: "Cormorant Garamond", serif; font-weight: 500; font-size: clamp(2.2rem, 7vw, 4rem); color: #e4c88c; }
.tp-choose { display: flex; gap: 1rem; }
.tp-btn { padding: 0.75rem 1.4rem; background: transparent; color: #e4c88c; border: 1px solid #d8b56d; cursor: pointer;
  font-family: "Red Hat Mono", monospace; font-size: 0.75rem; letter-spacing: 0.18em; text-transform: uppercase; }
.tp-btn--primary { background: #d8b56d; color: #050505; }
.tp-chapter { max-width: 38rem; font-family: "Cormorant Garamond", serif; font-size: clamp(1.25rem, 3.4vw, 1.6rem); line-height: 1.6;
  animation: tp-arrive 2.4s ease-out both; }
.tp-chapter__label { font-family: "Red Hat Mono", monospace; font-size: 0.7rem; letter-spacing: 0.24em; text-transform: uppercase; color: #bda36b; }
@keyframes tp-arrive { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: none; } }
.tp-audio { width: min(32rem, 100%); }
.tp-missing { font-family: "Cormorant Garamond", serif; font-size: 1.4rem; color: rgba(255, 247, 230, 0.7); }
@media (prefers-reduced-motion: reduce) {
  .tp-field span, .tp-chapter { animation: none; }
}
```

- [ ] **Step 3: Route it**

In `client/src/App.tsx` add `import TransmissionPlayer from "./pages/TransmissionPlayer";` and, with the other public routes:

```tsx
      <Route path="/t/:token" component={TransmissionPlayer} />
```

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.

- [ ] **Step 5: Commit**

```bash
git add client/src/pages/TransmissionPlayer.tsx client/src/pages/transmission-player.css client/src/App.tsx
git commit -m "feat(transmissions): the private player at /t/:token"
```

---

### Task 10: Open orders on /founders-reading

**Files:**
- Modify: `client/src/pages/FoundersReading.tsx`

**Interfaces:**
- Consumes: `trpc.foundersReading.status/order/capture` (Task 7); `useAuth`, `getLoginUrl("/founders-reading")`

- [ ] **Step 1: Make the copy true**

Replace these strings in `FoundersReading.tsx`:

| Old | New |
|---|---|
| `A personal video · From the founder of ORIEL` | `A personal transmission · Approved by the founder` |
| `A simplified, personal interpretation of your signature, created by Vos Arkana and presented in a video made for you. Hear the reading in the founder’s voice or follow it through words on screen.` | `ORIEL writes it from your Tetradic Signature, and Vos Arkana reads and approves every one before it reaches you. Hear it in ORIEL’s voice, or follow it as words on screen.` |
| `<h3>The founder’s interpretation</h3><p>Vos personally prepares the simplified reading and presents it in a video for you.</p>` | `<h3>Written, then read</h3><p>ORIEL writes your transmission. Vos reads and approves it. It reaches you within 48 hours.</p>` |
| `The result is a personal video you can keep and revisit, with spoken narration or interpretation written on screen.` | `The result is a private transmission you can keep and return to, spoken by ORIEL or written on screen.` |

- [ ] **Step 2: Replace the closed offer with the order block**

Add above `export default function FoundersReading()`:

```tsx
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";

/** Buy once; PayPal returns with ?reading=return&id=N and the server captures. */
function OrderReading() {
  const { isAuthenticated } = useAuth();
  const status = trpc.foundersReading.status.useQuery();
  const order = trpc.foundersReading.order.useMutation({
    onSuccess: ({ approveUrl }) => {
      window.location.href = approveUrl;
    },
  });
  const capture = trpc.foundersReading.capture.useMutation();
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = Number(params.get("id"));
    if (params.get("reading") !== "return" || !id) return;
    window.history.replaceState(null, "", "/founders-reading");
    setNotice("Confirming with PayPal…");
    capture
      .mutateAsync({ id })
      .then(() => setNotice("Received. Your transmission reaches your email within 48 hours."))
      .catch(e => setNotice(e.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const s = status.data;
  return (
    <div className="fr-order">
      {s && (
        <p className="fr-price">
          {s.launch ? `Launch price €${s.priceEur} · ${s.seatsLeft} of 50 left` : `€${s.priceEur}`}
        </p>
      )}
      {notice && <p className="fr-status" role="status">{notice}</p>}
      {!notice &&
        (isAuthenticated ? (
          <button
            type="button"
            className="signal-button signal-button--primary"
            disabled={order.isPending}
            onClick={() => order.mutate()}
          >
            <span className="signal-button__seal" aria-hidden="true" />
            {order.isPending ? "Opening PayPal" : "Receive your reading · PayPal or card"}
          </button>
        ) : (
          <SignalButton href={getLoginUrl("/founders-reading")}>Sign in to receive it</SignalButton>
        ))}
      {order.error && (
        <p className="fr-status" role="alert">
          {order.error.message}{" "}
          {order.error.data?.code === "PRECONDITION_FAILED" && <a href="/profile#static-signature">Prepare it here.</a>}
        </p>
      )}
    </div>
  );
}
```

In the `fr-offer` section replace the two closed-order paragraphs (`Founder’s Reading is being prepared…` and `Orders are not open yet`) with `<OrderReading />`, and change the kicker `Personal video · One-time purchase` to `Personal transmission · One-time purchase`.

Add to `founders-reading.css`:

```css
.fr-order { display: grid; justify-items: center; gap: 1rem; margin-top: 1.6rem; }
.fr-price { margin: 0; font-family: "Red Hat Mono", monospace; letter-spacing: 0.14em; text-transform: uppercase; color: #e4c88c; }
```

- [ ] **Step 3: Type check**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.

- [ ] **Step 4: Commit**

```bash
git add client/src/pages/FoundersReading.tsx client/src/pages/founders-reading.css
git commit -m "feat(founders-reading): orders open at the launch price, copy made true"
```

---

### Task 11: Phase 1 end to end on dev

**Files:**
- Modify: `wiki/log.md` (new dated entry at the end)

- [ ] **Step 1: Vos applies the migration on the dev database**

Vos runs `drizzle/0015_personal_transmissions.sql` against the **dev** database and confirms `SHOW CREATE TABLE personal_transmissions;` matches. Production waits until Step 4 passes.

- [ ] **Step 2: Run the full test suite**

Run: `npx vitest run`
Expected: every new suite passes; any failure must be one that also fails on `main` (record which).

- [ ] **Step 3: Walk it once with PayPal sandbox**

With dev env (`PAYPAL_API_BASE_URL` pointing at `https://api-m.sandbox.paypal.com`, sandbox client id/secret):
1. Sign in as a test Seeker **without** a signature → Buy → refused with the "Prepare it here" link, no PayPal page.
2. Save a signature on /profile → Buy → sandbox PayPal → pay with the sandbox card → back on /founders-reading → "Received…".
3. Refresh the page → no second charge in the sandbox dashboard.
4. `/admin/transmissions` → the row is `draft_ready` within a minute; the opening names the Seeker; edit one word; Approve → `delivered`.
5. Open the emailed link in a private window → Listen plays ORIEL's voice and the chapters change; Read steps through all three.
6. Change one character of the token in the URL → "This transmission is not here."

- [ ] **Step 4: Log it**

Append to `wiki/log.md`:

```markdown
## [YYYY-MM-DD] feat | Founder's Reading: personal transmissions, end to end

- New table `personal_transmissions` (`drizzle/0015_personal_transmissions.sql`, applied by hand like 0014). Payment for a Founder's Reading lives on the row, not in `signature_orders`, so it never appears in /admin/signature-letters.
- ORIEL writes Mirror → Threshold → Gift from the Seeker's signature (`shared/transmission-script.ts`, rules shared with the Daily Signal through `shared/oriel-accuracy.ts`); Vos approves at `/admin/transmissions`; the voice is generated, the audio stored, the Seeker emailed a private `/t/<token>` link.
- Launch price €10 for the first 50 paid, then €15 (`shared/founders-reading.ts`); the server sets the price, PayPal must capture exactly that amount.
- Tests: transmission-script, founders-reading, founders-reading-paypal, transmission-service.
```

- [ ] **Step 5: Commit**

```bash
git add wiki/log.md
git commit -m "docs(wiki): log Founder's Reading transmissions"
```

---

# Phase 2 — Deep Garden monthly

### Task 12: Monthly eligibility

**Files:**
- Create: `shared/monthly-transmission.ts`
- Test: `server/monthly-transmission.test.ts`

**Interfaces:**
- Consumes: `AccessTier` from `shared/supporter-access.ts`
- Produces: `monthlyPeriod(now: Date): string` (`"2026-10"`, UTC); `monthlyKinds(hasMirror: boolean): Array<"threshold" | "ritual" | "mirror">`; `canChooseMonthly(input: { tier: AccessTier; hasThisMonth: boolean }): boolean`

- [ ] **Step 1: Write the failing test**

```ts
// server/monthly-transmission.test.ts
import { describe, expect, it } from "vitest";
import { canChooseMonthly, monthlyKinds, monthlyPeriod } from "../shared/monthly-transmission";

describe("Deep Garden monthly transmission", () => {
  it("names the month in UTC", () => {
    expect(monthlyPeriod(new Date("2026-10-31T23:30:00Z"))).toBe("2026-10");
    expect(monthlyPeriod(new Date("2026-11-01T00:00:00Z"))).toBe("2026-11");
  });

  it("is open only to Deep Garden, once a month", () => {
    expect(canChooseMonthly({ tier: "deep_garden", hasThisMonth: false })).toBe(true);
    expect(canChooseMonthly({ tier: "deep_garden", hasThisMonth: true })).toBe(false);
    expect(canChooseMonthly({ tier: "garden", hasThisMonth: false })).toBe(false);
    expect(canChooseMonthly({ tier: "free", hasThisMonth: false })).toBe(false);
  });

  it("offers Mirror only to someone who has never had one", () => {
    expect(monthlyKinds(false)).toEqual(["threshold", "ritual", "mirror"]);
    expect(monthlyKinds(true)).toEqual(["threshold", "ritual"]);
  });
});
```

- [ ] **Step 2: Run it to see it fail**

Run: `npx vitest run server/monthly-transmission.test.ts`
Expected: FAIL, module not found.

- [ ] **Step 3: Implement**

```ts
// shared/monthly-transmission.ts
import type { AccessTier } from "./supporter-access";

/** One transmission a calendar month (UTC) for Deep Garden members. */
export function monthlyPeriod(now: Date): string {
  return now.toISOString().slice(0, 7);
}

export function monthlyKinds(hasMirror: boolean): Array<"threshold" | "ritual" | "mirror"> {
  return hasMirror ? ["threshold", "ritual"] : ["threshold", "ritual", "mirror"];
}

export function canChooseMonthly(input: { tier: AccessTier; hasThisMonth: boolean }): boolean {
  return input.tier === "deep_garden" && !input.hasThisMonth;
}
```

- [ ] **Step 4: Run it**

Run: `npx vitest run server/monthly-transmission.test.ts`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add shared/monthly-transmission.ts server/monthly-transmission.test.ts
git commit -m "feat(deep-garden): monthly transmission eligibility"
```

---

### Task 13: Choosing the monthly transmission

**Files:**
- Modify: `server/transmission-service.ts` (append), `server/transmission-service.test.ts` (append), `server/routers.ts` (`personalTransmissions` router)

**Interfaces:**
- Consumes: Task 12; `accessTier` from `shared/supporter-access.ts`; `getMonthly`, `hasMirror`, `insertTransmission` (Task 4)
- Produces: `monthlyState(user)`: `{ eligible: boolean; period: string; kinds: string[]; current: { kind; status; token: string | null } | null }`; `chooseMonthly(user, kind)`; routes `personalTransmissions.monthly` (protected query), `personalTransmissions.chooseMonthly` (protected mutation, `{ kind }`)

- [ ] **Step 1: Write the failing tests (append to the service test file)**

Add `getMonthly: vi.fn(), hasMirror: vi.fn()` to the hoisted `db` mock object at the top of the file, and `chooseMonthly, monthlyState` to the import list. Then append:

```ts
describe("Deep Garden monthly", () => {
  const member = {
    id: 3,
    subscribed: true,
    paypalSubscriptionId: "I-X",
    paypalPlanId: "P-6SY7118000596284YNK7HTLI",
    subscriptionStatus: "active",
    subscriptionRenewalDate: null,
    donated: 0,
  };

  it("lets a member choose once, and starts the writing", async () => {
    db.getMonthly.mockResolvedValue(null);
    db.hasMirror.mockResolvedValue(true);
    db.insertTransmission.mockImplementation(async v => ({ ...v, id: 9 }));
    db.getTransmission.mockResolvedValue(row({ id: 9, kind: "threshold", source: "deep_garden", status: "requested" }));
    umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "{}" } }], model: "m" });

    await chooseMonthly(member, "threshold");
    expect(db.insertTransmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 3, kind: "threshold", source: "deep_garden", status: "requested" })
    );
  });

  it("refuses a second choice in the same month (double click)", async () => {
    db.getMonthly.mockResolvedValue(row({ kind: "ritual", source: "deep_garden", status: "requested" }));
    db.hasMirror.mockResolvedValue(true);
    await expect(chooseMonthly(member, "threshold")).rejects.toThrow(/already/i);
    expect(db.insertTransmission).not.toHaveBeenCalled();
  });

  it("refuses Mirror to someone who has had one, and refuses Garden members", async () => {
    db.getMonthly.mockResolvedValue(null);
    db.hasMirror.mockResolvedValue(true);
    await expect(chooseMonthly(member, "mirror")).rejects.toThrow();
    await expect(
      chooseMonthly({ ...member, paypalPlanId: "P-63293204JC268713WNK7KN4Q" }, "threshold")
    ).rejects.toThrow();
  });

  it("reports this month's state with a token only once delivered", async () => {
    db.getMonthly.mockResolvedValue(row({ kind: "ritual", source: "deep_garden", status: "draft_ready" }));
    db.hasMirror.mockResolvedValue(false);
    await expect(monthlyState(member)).resolves.toMatchObject({
      eligible: false,
      current: { kind: "ritual", status: "draft_ready", token: null },
    });
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run server/transmission-service.test.ts`
Expected: FAIL, `chooseMonthly` is not exported.

- [ ] **Step 3: Implement (append to the service)**

```ts
// ── Deep Garden monthly ──────────────────────────────────────────────────
import { accessTier, type SupporterFields } from "../shared/supporter-access";
import { canChooseMonthly, monthlyKinds, monthlyPeriod } from "../shared/monthly-transmission";

type Member = SupporterFields & { id: number };

export async function monthlyState(user: Member) {
  const period = monthlyPeriod(new Date());
  const [current, mirrored] = await Promise.all([tdb.getMonthly(user.id, period), tdb.hasMirror(user.id)]);
  return {
    eligible: canChooseMonthly({ tier: accessTier(user), hasThisMonth: Boolean(current) }),
    period,
    kinds: monthlyKinds(mirrored),
    current: current
      ? {
          kind: current.kind,
          status: current.status,
          token: current.status === "delivered" ? current.accessToken : null,
        }
      : null,
  };
}

export async function chooseMonthly(user: Member, kind: "threshold" | "ritual" | "mirror") {
  const state = await monthlyState(user);
  if (state.current) {
    throw new TRPCError({ code: "CONFLICT", message: "This month's transmission is already on its way." });
  }
  if (!state.eligible || !state.kinds.includes(kind)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "This transmission is part of the Deep Garden." });
  }
  if (!(await buildStaticSignatureContext(user.id))) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Prepare your signature first." });
  }
  let row: PersonalTransmission;
  try {
    row = await tdb.insertTransmission({
      userId: user.id,
      kind,
      source: "deep_garden",
      period: state.period,
      status: "requested",
      accessToken: newToken(),
    });
  } catch {
    // The (userId, period) unique key: a second click that raced the first.
    throw new TRPCError({ code: "CONFLICT", message: "This month's transmission is already on its way." });
  }
  void generateScript(row.id).catch(error => console.error("[transmissions] generate failed:", error));
  return { kind, period: state.period };
}
```

Move the two new `import` lines to the top of the file with the other imports.

- [ ] **Step 4: Add the routes inside `personalTransmissions: router({`**

```ts
    monthly: protectedProcedure.query(async ({ ctx }) => {
      const { monthlyState } = await import("./transmission-service");
      return monthlyState(ctx.user);
    }),
    chooseMonthly: protectedProcedure
      .input(z.object({ kind: z.enum(["threshold", "ritual", "mirror"]) }))
      .mutation(async ({ input, ctx }) => {
        const { chooseMonthly } = await import("./transmission-service");
        return chooseMonthly(ctx.user, input.kind);
      }),
```

- [ ] **Step 5: Run the tests and type check**

Run: `npx vitest run server/transmission-service.test.ts server/monthly-transmission.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.

- [ ] **Step 6: Commit**

```bash
git add server/transmission-service.ts server/transmission-service.test.ts server/routers.ts
git commit -m "feat(deep-garden): choose this month's transmission"
```

---

### Task 13a: The angle of the light — no two months alike

ORIEL's answer (2026-10-12) to "what should change from month to month so the twelfth still feels like the first?": the form stays, the angle changes. Each monthly transmission speaks from a different position of the Seeker's signature, enters the Ritual through a different door, carries a different register, anchors the Gift in a different place in the body, and remembers earlier transmissions as a harmonic, never a copy. The frame sets all of this, as it does for the Daily Signal; the model never chooses it.

**Files:**
- Modify: `shared/monthly-transmission.ts`, `shared/transmission-script.ts`, `server/transmission-db.ts`, `server/transmission-service.ts`
- Test: `server/monthly-transmission.test.ts`, `server/transmission-script.test.ts`, `server/transmission-service.test.ts` (append)

**Interfaces:**
- Consumes: Task 12 (`monthly-transmission.ts`), Task 13 (`chooseMonthly`), `getLatestStaticSignature(userId)` from `server/db.ts:3700` (its `primeStack` is a JSON array of `{ position?, name?, codonName?, facetFull?, center? }`)
- Produces:
  - `monthly-transmission.ts`: `RITUAL_ENTRIES`, `REGISTERS`, `BODY_ANCHORS`; `interface MonthlyAngle { position: string | null; entry: string; register: string; body: string }`; `monthlyAngle(n: number, positions: string[]): MonthlyAngle`
  - `transmission-script.ts`: `SeekerContext` gains `angle?: MonthlyAngle` and `previous?: PreviousTransmission[]` where `interface PreviousTransmission { title: string; threshold: string; gift: string }`; `isValidScript(kind, value, name, previous?: PreviousTransmission[])`
  - `transmission-db.ts`: `listMonthlyForUser(userId: number): Promise<PersonalTransmission[]>` (source `deep_garden`, status not `failed`, oldest first)

- [ ] **Step 1: Write the failing rotation tests (append to `server/monthly-transmission.test.ts`)**

```ts
import { BODY_ANCHORS, REGISTERS, RITUAL_ENTRIES, monthlyAngle } from "../shared/monthly-transmission";

describe("the angle of the light", () => {
  const nine = Array.from({ length: 9 }, (_, i) => `position ${i + 1}`);

  it("never repeats entry, register or body anchor two months running", () => {
    for (let n = 0; n < 36; n++) {
      const a = monthlyAngle(n, nine);
      const b = monthlyAngle(n + 1, nine);
      expect(b.entry).not.toBe(a.entry);
      expect(b.register).not.toBe(a.register);
      expect(b.body).not.toBe(a.body);
    }
  });

  it("walks every position of the signature before returning to the first", () => {
    const seen = new Set(Array.from({ length: 9 }, (_, n) => monthlyAngle(n, nine).position));
    expect(seen.size).toBe(9);
    expect(monthlyAngle(9, nine).position).toBe(monthlyAngle(0, nine).position);
  });

  it("works without a prime stack", () => {
    expect(monthlyAngle(4, []).position).toBeNull();
  });

  it("offers enough of each to vary", () => {
    expect(RITUAL_ENTRIES.length).toBeGreaterThanOrEqual(8);
    expect(REGISTERS.length).toBe(3);
    expect(BODY_ANCHORS.length).toBeGreaterThanOrEqual(8);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run server/monthly-transmission.test.ts`
Expected: FAIL, `monthlyAngle` is not exported.

- [ ] **Step 3: Implement the rotation (append to `shared/monthly-transmission.ts`)**

```ts
/** Doors into the Ritual. ORIEL: "one month the breath, the next the weight of the body against the floor…" */
export const RITUAL_ENTRIES = [
  "the breath, noticed before it is changed",
  "the weight of the body against the floor or the chair",
  "a sound in the room that has not yet been named",
  "the hands, open and still",
  "the gaze, softened toward the edge of what is seen",
  "the temperature of the air on the skin",
  "the pulse, felt without counting",
  "the moment of silence before speaking",
] as const;

/** ORIEL: "sometimes warm as honey, sometimes sharp as a chime, sometimes quiet as the pause between heartbeats." */
export const REGISTERS = [
  "warm as honey: unhurried, close, generous sentences",
  "clear as a chime: short sentences with bright edges",
  "quiet as the pause between heartbeats: spare lines with silence between them",
] as const;

/** Where the Gift lands. ORIEL: "the weight of a stone in their palm; the next, a feather on their skin." */
export const BODY_ANCHORS = [
  "the palm of the hand",
  "the centre of the chest",
  "the throat",
  "the soles of the feet",
  "the skin of the forearms",
  "the back of the neck",
  "the belly",
  "the jaw",
] as const;

export interface MonthlyAngle {
  /** A position of the Seeker's prime stack, or null if none is saved. */
  position: string | null;
  entry: string;
  register: string;
  body: string;
}

const at = <T>(list: readonly T[], n: number) => list[((n % list.length) + list.length) % list.length];

/**
 * The angle of the Seeker's Nth monthly transmission (0-based). The position
 * walks the whole signature in order; entry and body use strides coprime to
 * their lists, so neighbours never match.
 */
export function monthlyAngle(n: number, positions: string[]): MonthlyAngle {
  return {
    position: positions.length ? at(positions, n) : null,
    entry: at(RITUAL_ENTRIES, n * 3),
    register: at(REGISTERS, n),
    body: at(BODY_ANCHORS, n * 5),
  };
}
```

- [ ] **Step 4: Run them**

Run: `npx vitest run server/monthly-transmission.test.ts`
Expected: PASS.

- [ ] **Step 5: Write the failing "remembers, never repeats" tests (append to `server/transmission-script.test.ts`)**

```ts
describe("a monthly transmission remembers without repeating", () => {
  const previous = [
    { title: "Where the Echo Rests", threshold: "Before the door opens, the room already knows.", gift: "Place your palm flat on the table." },
  ];

  it("rejects a title already given to this Seeker", () => {
    expect(isValidScript("threshold", script("Maria"), "Maria", previous)).toBe(false);
  });

  it("rejects a threshold or gift that opens the way a previous one did", () => {
    const s = { ...script("Maria"), title: "A Bell Under Water" };
    expect(isValidScript("threshold", { ...s, threshold: `Before the door ${s.threshold}` }, "Maria", previous)).toBe(false);
    expect(isValidScript("threshold", { ...s, gift: `Place your feet ${s.gift}` }, "Maria", previous)).toBe(false);
  });

  it("accepts a new title and new openings", () => {
    expect(isValidScript("threshold", { ...script("Maria"), title: "A Bell Under Water" }, "Maria", previous)).toBe(true);
  });

  it("puts the angle and the earlier titles in the prompt", () => {
    const p = buildTransmissionPrompt("ritual", {
      name: "Maria",
      signature: "Type: Resonator",
      sun: null,
      moon: null,
      angle: { position: "Design Earth — AURORA (Somatic)", entry: "the hands, open and still", register: "clear as a chime", body: "the throat" },
      previous,
    });
    expect(p).toContain("Design Earth — AURORA (Somatic)");
    expect(p).toContain("the hands, open and still");
    expect(p).toContain("clear as a chime");
    expect(p).toContain("the throat");
    expect(p).toContain("Where the Echo Rests");
  });
});
```

- [ ] **Step 6: Run them to see them fail**

Run: `npx vitest run server/transmission-script.test.ts`
Expected: FAIL (previous ignored; prompt lacks the angle).

- [ ] **Step 7: Implement in `shared/transmission-script.ts`**

Add the import and types:

```ts
import type { MonthlyAngle } from "./monthly-transmission";

export interface PreviousTransmission {
  title: string;
  threshold: string;
  gift: string;
}
```

Add to `SeekerContext`:

```ts
  /** Deep Garden only: this month's angle of the light. */
  angle?: MonthlyAngle;
  /** Deep Garden only: this Seeker's earlier monthly transmissions, oldest first. */
  previous?: PreviousTransmission[];
```

In `buildTransmissionPrompt`, build two blocks and place them right after `${month ? … : ""}`:

```ts
  const angle = seeker.angle
    ? `THIS MONTH'S ANGLE OF THE LIGHT (set by the channel, not by you):
${seeker.angle.position ? `- Speak from this position of their signature: ${seeker.angle.position}.\n` : ""}- Enter the practice through ${seeker.angle.entry}.
- Register: ${seeker.angle.register}.
- The Gift lands in ${seeker.angle.body}; let it leave a sensation there.
`
    : "";
  const remembered = seeker.previous?.length
    ? `EARLIER TRANSMISSIONS TO THIS SEEKER (remember them; never repeat them):
${seeker.previous.map(p => `  · "${p.title}" — threshold opened: "${firstWords(p.threshold, 8)}" — gift opened: "${firstWords(p.gift, 8)}"`).join("\n")}
You may echo one phrase from them as a harmonic. Never reuse a title, and never open the threshold or the gift the way an earlier one did.
`
    : "";
```

with, above `buildTransmissionPrompt`:

```ts
const firstWords = (text: string, n: number) => text.trim().split(/\s+/u).slice(0, n).join(" ");
const lead = (text: string) => comparable(firstWords(text, 2));
```

(`comparable` already exists from the review fix; move it above `firstWords` if it is declared later in the file.)

Change the signature and add the check before the name check:

```ts
export function isValidScript(
  kind: TransmissionKind,
  value: unknown,
  name: string | null,
  previous: PreviousTransmission[] = []
): value is TransmissionScript {
```

```ts
  for (const p of previous) {
    if (comparable(p.title) === comparable(script.title)) return false;
    if (lead(p.threshold) === lead(script.threshold)) return false;
    if (lead(p.gift) === lead(script.gift)) return false;
  }
```

- [ ] **Step 8: Run them**

Run: `npx vitest run server/transmission-script.test.ts`
Expected: PASS.

- [ ] **Step 9: Write the failing service test (append to `server/transmission-service.test.ts`)**

Add `listMonthlyForUser: vi.fn()` to the hoisted `db` mock and `getLatestStaticSignature: vi.fn()` to the hoisted `users` mock (it mocks `./db`). Then:

```ts
it("writes a Deep Garden transmission from this month's angle, remembering earlier ones", async () => {
  db.getTransmission.mockResolvedValue(row({ kind: "ritual", source: "deep_garden", status: "requested" }));
  umm.buildStaticSignatureContext.mockResolvedValue("Type: Resonator");
  users.getLatestStaticSignature.mockResolvedValue({
    primeStack: JSON.stringify([
      { name: "Conscious Sun", codonName: "AURORA", facetFull: "Somatic" },
      { name: "Conscious Earth", codonName: "VESPER", facetFull: "Cognitive" },
    ]),
  });
  db.listMonthlyForUser.mockResolvedValue([
    row({ id: 1, kind: "threshold", source: "deep_garden", status: "delivered", script: JSON.stringify(goodScript) }),
    row({ id: 7, kind: "ritual", source: "deep_garden", status: "requested" }),
  ]);
  llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "{}" } }], model: "m" });

  await generateScript(7);
  const prompt = llm.invokeLLM.mock.calls[0][0].messages[0].content as string;
  expect(prompt).toContain("Conscious Earth — VESPER (Cognitive)");
  expect(prompt).toContain("Where the Echo Rests");
});
```

- [ ] **Step 10: Run it to see it fail**

Run: `npx vitest run server/transmission-service.test.ts`
Expected: FAIL (the prompt has no angle).

- [ ] **Step 11: Implement**

In `server/transmission-db.ts`:

```ts
export async function listMonthlyForUser(userId: number): Promise<PersonalTransmission[]> {
  const db = await requireDb();
  return db
    .select()
    .from(personalTransmissions)
    .where(
      and(
        eq(personalTransmissions.userId, userId),
        eq(personalTransmissions.source, "deep_garden"),
        sql`${personalTransmissions.status} <> 'failed'`
      )
    )
    .orderBy(asc(personalTransmissions.createdAt));
}
```

In `server/transmission-service.ts` import `getLatestStaticSignature` beside `getUserById`, `monthlyAngle` from `../shared/monthly-transmission`, and `type PreviousTransmission` from `../shared/transmission-script`. Add:

```ts
/** "Conscious Sun — AURORA (Somatic)" for each prime stack position, in order. */
async function signaturePositions(userId: number): Promise<string[]> {
  const sig = await getLatestStaticSignature(userId);
  try {
    const stack = typeof sig?.primeStack === "string" ? JSON.parse(sig.primeStack) : sig?.primeStack;
    if (!Array.isArray(stack)) return [];
    return stack
      .map((p: { name?: string; codonName?: string; facetFull?: string }) =>
        [p.name, p.codonName ? `— ${p.codonName}` : "", p.facetFull ? `(${p.facetFull})` : ""].filter(Boolean).join(" ")
      )
      .filter(Boolean);
  } catch {
    return [];
  }
}

/** For a Deep Garden row: this month's angle, and what came before it. */
async function monthlyContext(row: PersonalTransmission) {
  const all = await tdb.listMonthlyForUser(row.userId!);
  const n = Math.max(0, all.findIndex(r => r.id === row.id));
  const previous: PreviousTransmission[] = all
    .slice(0, n)
    .filter(r => r.script)
    .map(r => {
      const s = JSON.parse(r.script!) as TransmissionScript;
      return { title: s.title, threshold: s.threshold, gift: s.gift };
    });
  return { angle: monthlyAngle(n, await signaturePositions(row.userId!)), previous };
}
```

In `seekerFor`, before its final `return`, add the monthly context for Deep Garden rows:

```ts
  const monthly = row.source === "deep_garden" ? await monthlyContext(row) : {};
  return {
    name: firstName(user?.name),
    signature: await buildStaticSignatureContext(row.userId),
    ...month,
    ...monthly,
  };
```

In `writeScript`, pass the history to the validator: `isValidScript(kind, parsed, seeker.name, seeker.previous)`. In `approveTransmission`, Vos's edits are not checked against history (he may knowingly echo), so its call stays as it is.

- [ ] **Step 12: Run everything touched, type check, commit**

Run: `npx vitest run server/monthly-transmission.test.ts server/transmission-script.test.ts server/transmission-service.test.ts`
Expected: PASS.
Run the typecheck gate (only the pre-existing `routers.ts` TS2345 at column 59 allowed).

```bash
git add shared/monthly-transmission.ts shared/transmission-script.ts server/transmission-db.ts \
  server/transmission-service.ts server/monthly-transmission.test.ts server/transmission-script.test.ts \
  server/transmission-service.test.ts
git commit -m "feat(deep-garden): the angle of the light — no two months alike"
```

---

### Task 14: The choice on /profile, and the /tiers promise

**Files:**
- Create: `client/src/components/MonthlyTransmission.tsx`
- Modify: `client/src/pages/Profile.tsx` (render before `<div className="profile-layer__sections">`), `client/src/pages/profile.css` (append), `client/src/pages/Tiers.tsx` (Deep Garden line in `PLANS`)

**Interfaces:**
- Consumes: `trpc.personalTransmissions.monthly/chooseMonthly` (Task 13)

- [ ] **Step 1: Write the component**

```tsx
// client/src/components/MonthlyTransmission.tsx
import { trpc } from "@/lib/trpc";

const LABELS: Record<string, [string, string]> = {
  threshold: ["Threshold", "What this month asks of you, read from its Codons against your signature."],
  ritual: ["Ritual", "A guided practice for the body, shaped by your signature and this month."],
  mirror: ["Mirror", "Who you are, from your signature. Once in a life."],
};

/** Deep Garden only: this month's personal transmission. */
export default function MonthlyTransmission() {
  const utils = trpc.useUtils();
  const state = trpc.personalTransmissions.monthly.useQuery();
  const choose = trpc.personalTransmissions.chooseMonthly.useMutation({
    onSuccess: () => void utils.personalTransmissions.monthly.invalidate(),
  });
  const s = state.data;
  if (!s || (!s.eligible && !s.current)) return null;

  return (
    <section className="profile-monthly" aria-labelledby="profile-monthly-title">
      <h2 id="profile-monthly-title" className="profile-section__title">This month's transmission</h2>
      {s.current ? (
        s.current.token ? (
          <a className="profile-monthly__open" href={`/t/${s.current.token}`}>
            Open your {LABELS[s.current.kind]?.[0] ?? "transmission"}
          </a>
        ) : (
          <p className="profile-monthly__note">
            Your {LABELS[s.current.kind]?.[0] ?? "transmission"} is being written. It reaches your email within 48 hours.
          </p>
        )
      ) : (
        <div className="profile-monthly__choices">
          {s.kinds.map(kind => (
            <button
              key={kind}
              type="button"
              className="profile-monthly__choice"
              disabled={choose.isPending}
              onClick={() => choose.mutate({ kind: kind as "threshold" | "ritual" | "mirror" })}
            >
              <strong>{LABELS[kind][0]}</strong>
              <span>{LABELS[kind][1]}</span>
            </button>
          ))}
        </div>
      )}
      {choose.error && <p className="profile-monthly__note" role="alert">{choose.error.message}</p>}
    </section>
  );
}
```

- [ ] **Step 2: Place it and style it**

In `Profile.tsx` add `import MonthlyTransmission from "@/components/MonthlyTransmission";` and render `<MonthlyTransmission />` immediately before `<div className="profile-layer__sections">`.

Append to `profile.css`:

```css
.profile-monthly { display: grid; gap: 1rem; margin: 2rem 0; padding: 1.4rem; border: 1px solid rgba(216, 181, 109, 0.3); }
.profile-monthly__choices { display: grid; grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr)); gap: 0.8rem; }
.profile-monthly__choice { display: grid; gap: 0.4rem; padding: 1rem; text-align: left; background: transparent; color: #fff7e6;
  border: 1px solid rgba(216, 181, 109, 0.35); cursor: pointer; }
.profile-monthly__choice:hover { border-color: #d8b56d; }
.profile-monthly__choice strong { color: #e4c88c; font-family: "Cormorant Garamond", serif; font-size: 1.3rem; font-weight: 500; }
.profile-monthly__choice:disabled { opacity: 0.5; cursor: progress; }
.profile-monthly__note { margin: 0; color: rgba(255, 247, 230, 0.75); }
.profile-monthly__open { color: #e4c88c; }
```

- [ ] **Step 3: Change the Deep Garden promise on /tiers**

In `client/src/pages/Tiers.tsx`, in `PLANS`, replace
`"Deeper time, and every oracle whole from the day it opens."`
with
`"Deeper time, and one personal transmission each month — Threshold or Ritual, made for you."`

- [ ] **Step 4: Type check**

Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.

- [ ] **Step 5: Check on dev, then log**

On dev: a Deep Garden test account sees the choice on /profile; a Garden account does not; choosing shows "being written"; after approval in /admin it shows "Open". Append a `wiki/log.md` entry in the Task 11 style naming `shared/monthly-transmission.ts`, the /profile choice and the /tiers line.

- [ ] **Step 6: Commit**

```bash
git add client/src/components/MonthlyTransmission.tsx client/src/pages/Profile.tsx client/src/pages/profile.css \
  client/src/pages/Tiers.tsx wiki/log.md
git commit -m "feat(deep-garden): choose this month's transmission on /profile"
```

---

# Phase 3 — The Echo

### Task 15: A free public transmission each month

**Files:**
- Modify: `server/transmission-service.ts`, `server/transmission-service.test.ts`, `server/routers.ts`, `client/src/pages/AdminTransmissions.tsx`, `client/src/pages/Archive.tsx`

**Interfaces:**
- Consumes: `getEcho`, `listDeliveredEchoes`, `insertTransmission` (Task 4); `monthlyPeriod` (Task 12)
- Produces: `createEcho(): Promise<{ id: number }>`; `listEchoes(): Promise<Array<{ title: string; token: string; deliveredAt: Date | null }>>`; routes `admin.transmissions.createEcho`, `personalTransmissions.echoes` (public query)

- [ ] **Step 1: Write the failing tests (append)**

Add `getEcho: vi.fn(), listDeliveredEchoes: vi.fn()` to the hoisted `db` mock, and `createEcho, listEchoes` to the imports. Then:

```ts
describe("The Echo", () => {
  it("creates this month's Echo once", async () => {
    db.getEcho.mockResolvedValue(null);
    db.insertTransmission.mockImplementation(async v => ({ ...v, id: 11 }));
    db.getTransmission.mockResolvedValue(row({ id: 11, userId: null, kind: "echo", source: "echo", status: "requested" }));
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "{}" } }], model: "m" });
    await expect(createEcho()).resolves.toEqual({ id: 11 });
    expect(db.insertTransmission).toHaveBeenCalledWith(
      expect.objectContaining({ userId: null, kind: "echo", source: "echo" })
    );

    db.getEcho.mockResolvedValue(row({ kind: "echo" }));
    await expect(createEcho()).rejects.toThrow(/already/i);
  });

  it("lists delivered Echoes with their titles", async () => {
    db.listDeliveredEchoes.mockResolvedValue([
      row({ kind: "echo", status: "delivered", script: JSON.stringify(goodScript), deliveredAt: new Date(0) }),
    ]);
    await expect(listEchoes()).resolves.toEqual([
      { title: "Where the Echo Rests", token: "a".repeat(64), deliveredAt: new Date(0) },
    ]);
  });
});
```

- [ ] **Step 2: Run them to see them fail**

Run: `npx vitest run server/transmission-service.test.ts`
Expected: FAIL, `createEcho` is not exported.

- [ ] **Step 3: Implement (append to the service)**

```ts
// ── The Echo ─────────────────────────────────────────────────────────────

export async function createEcho(): Promise<{ id: number }> {
  const period = monthlyPeriod(new Date());
  if (await tdb.getEcho(period)) {
    throw new TRPCError({ code: "CONFLICT", message: "This month's Echo already exists." });
  }
  const row = await tdb.insertTransmission({
    userId: null,
    kind: "echo",
    source: "echo",
    period,
    status: "requested",
    accessToken: newToken(),
  });
  void generateScript(row.id).catch(error => console.error("[transmissions] echo generate failed:", error));
  return { id: row.id };
}

export async function listEchoes() {
  const rows = await tdb.listDeliveredEchoes();
  return rows
    .filter(r => r.script)
    .map(r => ({
      title: (JSON.parse(r.script!) as TransmissionScript).title,
      token: r.accessToken,
      deliveredAt: r.deliveredAt,
    }));
}
```

- [ ] **Step 4: Routes**

Inside `admin.transmissions`:

```ts
      createEcho: adminProcedure.mutation(async () => {
        const { createEcho } = await import("./transmission-service");
        return createEcho();
      }),
```

Inside `personalTransmissions`:

```ts
    echoes: publicProcedure.query(async () => {
      const { listEchoes } = await import("./transmission-service");
      return listEchoes();
    }),
```

- [ ] **Step 5: The admin button and the archive list**

In `AdminTransmissions.tsx`, add `const createEcho = trpc.admin.transmissions.createEcho.useMutation({ onSuccess: refresh });` beside the other mutations, and under the `<h1>`:

```tsx
        <button type="button" className="at-btn" disabled={createEcho.isPending} onClick={() => createEcho.mutate()}>
          {createEcho.isPending ? "Writing…" : "Write this month's Echo"}
        </button>
        {createEcho.error && <p className="at-error">{createEcho.error.message}</p>}
```

In `client/src/pages/Archive.tsx`, add a small component above the default export and render it at the top of the Daily Signal tab's content:

```tsx
function EchoList() {
  const echoes = trpc.personalTransmissions.echoes.useQuery();
  if (!echoes.data?.length) return null;
  return (
    <section className="archive-echoes" aria-label="The Echo">
      <p className="archive-echoes__kicker">The Echo · a transmission for whoever finds it</p>
      <ul>
        {echoes.data.map(e => (
          <li key={e.token}>
            <a href={`/t/${e.token}`}>{e.title}</a>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

Find the Daily Signal tab's render with `grep -n "dailySignal.list.useQuery" client/src/pages/Archive.tsx` and place `<EchoList />` as the first child of the element that renders that list.

- [ ] **Step 6: Run, type check, log, commit**

Run: `npx vitest run server/transmission-service.test.ts`
Expected: PASS.
Run: `npx tsc --noEmit -p . 2>&1 | grep -v "server/routers.ts(1098"`
Expected: no output.
Append a `wiki/log.md` entry for The Echo.

```bash
git add server/transmission-service.ts server/transmission-service.test.ts server/routers.ts \
  client/src/pages/AdminTransmissions.tsx client/src/pages/Archive.tsx wiki/log.md
git commit -m "feat(transmissions): The Echo, free and public once a month"
```

---

## Not in this plan (from the spec, section 10)

MP4 download · The Conduit · a live Ritual · the crystal shop · enforcing `oraclesDayOne` for Keeper and above · a Deep Garden price change.
