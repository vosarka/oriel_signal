# ORIEL 3.0 — PHASE 0: CURRENT DATA MODEL

**Status:** Descriptive. Records the database technology, schema, indexes, and migration tooling as they exist today.
**Companion:** [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) §3, §15

---

## 1. Database technology

| Property | Value |
| --- | --- |
| Engine | **MySQL**, hosted on **TiDB Cloud** (per `.env.example` and `docs/ORIEL_AUDIT_V2.md`) |
| Driver | `mysql2` ^3.15.0 |
| ORM | `drizzle-orm` ^0.44.5, `drizzle-orm/mysql-core` |
| Schema of record | `drizzle/schema.ts` — **1012 lines, 29 tables** |
| Connection | `server/_core/mysql.ts` → `createDrizzleFromDatabaseUrl(ENV.databaseUrl)` |
| Instance | Lazy singleton in `server/db.ts:76-89`; returns `null` when `DATABASE_URL` is unset so tooling and tests can run without a DB |
| Data access | `server/db.ts` — 4000 lines, ~140 exported functions. **The only module that touches Drizzle**, apart from `server/oriel-memory.ts` and `server/oriel-umm.ts`, which import tables directly and query them themselves. |
| Foreign keys | **None declared anywhere.** All relations are logical (`userId int`), enforced only in application code. |
| JSON | Stored as `text`/`longtext` containing JSON strings; parsed with `safeJsonParse()` (`db.ts:63`) |

---

## 2. Migration tooling — two competing systems

This is the single most important thing to understand before adding tables for ORIEL 3.0.

### System A — drizzle-kit (declarative)

- Config: `drizzle.config.ts` → `schema: "./drizzle/schema.ts"`, `out: "./drizzle"`, `dialect: "mysql"`
- Command: `pnpm db:push` = `drizzle-kit generate && drizzle-kit migrate`
- Journal: `drizzle/meta/_journal.json`
- Snapshots: `drizzle/meta/0000_snapshot.json` … `0008_snapshot.json`

### System B — hand-rolled idempotent DDL runner (imperative)

- Location: `runMigrations()` in `server/db.ts:142` — roughly **470 lines** of inline `CREATE TABLE IF NOT EXISTS` / `ALTER TABLE ADD COLUMN` strings
- Executor: `executeMigrationStep(db, sql, ignorableFragments, successMessage)` (`db.ts:120-136`) — runs the statement, **swallows** any error whose message contains an "ignorable" fragment (e.g. `"Duplicate column"`), and merely `console.error`s anything else
- Entry points: called on **every server boot** (`server/_core/index.ts:38`) and by `pnpm db:migrate` → `server/scripts/apply-migrations.ts`
- Gated by `ENV.runMigrations` (`RUN_MIGRATIONS`, default **false**)

### Known divergences

1. **`drizzle/0009`–`0013` are not in the journal.** `_journal.json` stops at `0008_add_core_codon_engine`. The five newer SQL files —
   `0009_add_conversations.sql`, `0010_oracle_stream_evolution.sql`, `0011_static_profile_lattice_columns.sql`, `0012_widen_spec_version.sql`, `0013_tetradic_founder_edition_checkout.sql`
   — are hand-authored and **would be skipped by `drizzle-kit migrate`**, which is journal-driven. In practice they are applied by System B or by hand.

2. **A third folder exists.** `drizzle/migrations/0001_add_voice_preference.sql` sits in a *different* directory from `drizzle/*.sql`, is not referenced by `drizzle.config.ts` (`out: "./drizzle"`), and declares an obsolete enum `('fast','nostalgic','none')`. The live enum is `('sophianic','deep','none')`, reconciled by a 6-step ALTER/UPDATE sequence in System B (`db.ts:154-191`).

3. **No `down` migrations exist anywhere.** Neither system produces or stores a reverse migration. The directive's "keep migrations reversible" requirement is currently unmet by both paths.

4. **Migration failures are non-fatal.** System B logs and continues. A failed `CREATE TABLE` produces a running server with a missing table; `isMissingTableError()` (`db.ts:98`) exists specifically so read paths can degrade gracefully.

**Implication for ORIEL 3.0:** new tables must pick one path deliberately. System A gives real journaling and snapshots; System B is what actually runs on boot. Reversibility must be added regardless of which is chosen.

---

## 3. Table inventory — all 29 tables

Grouped by domain. `→` marks a logical (unenforced) reference.

### 3.1 Identity & auth (5)

| Table | Key columns | Indexes |
| --- | --- | --- |
| `users` | `id` PK · `openId` UQ · `email` · `googleId` UQ · `passwordHash` · `role enum(user,admin)` · `conduitId` UQ · `subscriptionStatus enum` · `paypalSubscriptionId` · `subscribed` · `donated` · `voicePreference enum(sophianic,deep,none)` · timestamps · `lastSignedIn` | uniques only |
| `ba_user` | `id varchar(36)` PK · `email` UQ · `emailVerified` · `phoneNumber` | unique on email |
| `ba_session` | `id` PK · `token` UQ · `expiresAt` · `userId varchar(36)` | unique on token |
| `ba_account` | `id` PK · `accountId` · `providerId` · `userId` · tokens · `password` | none |
| `ba_verification` | `id` PK · `identifier` · `value` · `expiresAt` | none |

`users` ↔ `ba_user` are joined **by email at request time** in `server/_core/context.ts`, not by a column.

### 3.2 Conversation (2)

| Table | Key columns | Indexes |
| --- | --- | --- |
| `conversations` | `id` PK · `userId` → users.id · `title` · timestamps | `conversations_userId_idx` (created in `0009.sql`, **not declared in `schema.ts`**) |
| `chatMessages` | `id` PK · `userId` → users.id · `conversationId` → conversations.id (**nullable**, legacy) · `role enum(user,assistant)` · `content text` · `timestamp` | `chatMessages_conversationId_idx` (created in `0009.sql`, **not declared in `schema.ts`**) |

Because those two indexes exist only in raw SQL, a future `drizzle-kit generate` diff against `schema.ts` may propose dropping them.

### 3.3 ORIEL cognition (7) — the ORIEL 3.0 working set

| Table | Key columns | Indexes |
| --- | --- | --- |
| `orielMemories` | `id` PK · `userId` (nullable) · `category enum(identity,preference,pattern,fact,relationship,context)` · `content text` · `importance int=5` · `accessCount` · `lastAccessed` · `source enum(conversation,explicit,inferred)` · `isActive bool=true` · timestamps | **none** |
| `orielPendingMemoryCandidates` | + `sensitivity enum(low,medium,high)` · `confidence double=1` · `status enum(pending,accepted,rejected)` · `reason text` · `acceptedMemoryId` · `decidedAt` | `(userId,status)`, `createdAt` |
| `orielUserProfiles` | `userId` **UQ** · `knownName` · `summary` · `interests` · `communicationStyle` · `journeyState` · `interactionCount` · `lastInteraction` | unique on userId |
| `orielOversoulPatterns` | `category enum(wisdom,teaching_method,metaphor,pattern,self_correction)` · `pattern` · `application` · `impact` · `interactionCount` · `lastRefined` | **none** |
| `orielImprovementProposals` | `title` · `scope enum(prompt_overlay,response_intelligence,interaction_protocol,routing,safety,memory,other)` · `objective` · `hypothesis` · `proposalPayload text(JSON)` · `safetyNotes` · `evaluationScore` · `evaluationSummary` · `status enum(proposed,evaluated,approved,rejected,applied,rolled_back,blocked)` · `createdByUserId` · `approvedByUserId` · `approvedAt` · `appliedProfileId` | `status`, `createdByUserId`, `appliedProfileId` |
| `orielRuntimeProfiles` | `profileKey` **UQ** · `name` · `description` · `configPayload text(JSON)` · `status enum(draft,active,archived)` · `createdFromProposalId` · `activatedByUserId` · `activatedAt` · `deactivatedAt` | `status`, `createdFromProposalId` |
| `orielReflectionEvents` | `eventType enum(proposal_created,proposal_evaluated,proposal_approved,profile_activated,profile_rolled_back,guardrail_block,runtime_observation)` · `sourceRoute` · `userId` · `proposalId` · `profileId` · `payload text(JSON)` · `createdAt` | `eventType`, `userId`, `proposalId`, `profileId`, `createdAt` |

**Notes.**
- `orielMemories` — the most-read ORIEL table — has **no index at all**, despite every query filtering `userId` + `isActive` and ordering by `importance, lastAccessed`.
- `orielReflectionEvents` is **append-only by convention**: `db.ts` exposes `createOrielReflectionEvent` and `listOrielReflectionEvents`, and **no update or delete function**. This is the strongest immutability guarantee currently in the data model.
- `orielRuntimeProfiles` is genuinely versioned: activation archives the previous active profile rather than mutating it (`db.activateOrielRuntimeProfile`, `db.ts:1008`).

### 3.4 Archive / transmissions (6)

| Table | Notes |
| --- | --- |
| `transmissions` | `txId` UQ · `txNumber` UQ · triptych panel prompts · `microSigil` · `cycle` · `status enum(Draft,Confirmed,Deprecated,Mythic)` |
| `oracles` | `oracleId` · `oracleNumber` · `part enum(Past,Present,Future)` · thread fields · `linkedCodons` JSON · `resonanceCount` · `status enum(Draft,Confirmed,Deprecated,Prophetic)` · indexes on `threadId`, `(threadId,threadOrder)` |
| `oracleResonances` | `(userId, oracleId)` **unique**, plus separate indexes on each |
| `generatedTransmissionEvents` | `eventKey` UQ · `eventType enum(tx,oracle)` · `rarity enum(common…void)` · `meaningLevel` · `triggerSource` · `status enum(generated,revealed,saved,promoted,discarded)` · `payload` JSON · `sourceContext` JSON · `promotedArchiveId` · **5 indexes** |
| `bookmarks` | `userId` + `transmissionId`, no indexes |
| `signals` / `artifacts` | legacy archive surfaces |

`generatedTransmissionEvents` is the **reference implementation of staged model output**: generated → revealed → saved → *promoted (admin only)*.

### 3.5 VRC / RGP computed state (4)

| Table | Notes |
| --- | --- |
| `carrierlockStates` | MN/BT/ET 0-10 · `breathCompletion` · `coherenceScore` · `createdAt` |
| `codonReadings` | `carrierlockId` · `readingText` · `flaggedCodons` · `sliScores` JSON · `activeFacets` JSON · `confidenceLevels` JSON · `microCorrection` · `correctionFacet enum(A,B,C,D)` · `falsifier` · `correctionCompleted` |
| `staticSignatures` | `readingId` UQ · birth data + lat/lon/tz · `primeStack` · `ninecenters` · `fractalRole` · `authorityNode` · `vrcType` · `vrcAuthority` · `circuitLinks` · `baseCoherence` · `coherenceTrajectory` · `microCorrections` · `ephemerisData` · `houses` · `diagnosticTransmission` · `coreCodonEngine` |
| `userStaticProfiles` | `userId` **UQ** — the canonical natal blueprint; adds `activations`, `channelStatuses`, `resonanceRole`, `calculationStatus`, `calculationContext`, `specVersion`, `engineVersion int=2` |

`codonReadings.confidenceLevels` and `codonReadings.falsifier` are notable: **per-claim confidence and a falsifier already exist in the VRC reading path**, just not in the memory path.

`userStaticProfiles.specVersion` + `engineVersion` are the only **version fields** in the schema — a working precedent for versioned derived artifacts.

### 3.6 Commerce (5)

`signature_orders` (7 indexes incl. 3 uniques on payment ids) · `signature_intakes` · `signature_snapshots` (`longtext` raw + normalized JSON, `engineVersion`) · `signature_letter_drafts` · `signature_followups`.

`signature_snapshots` is another useful precedent: it stores **both** the raw engine output and the normalized form, with an engine version — i.e. reproducible derivation.

---

## 4. Immutability posture, table by table

| Table | Updated in place? | Deleted? | Verdict |
| --- | --- | --- | --- |
| `orielReflectionEvents` | never | never | **Immutable** ✅ |
| `carrierlockStates` | never | never | Immutable (time series) ✅ |
| `staticSignatures` | never | never | Immutable (per-reading) ✅ |
| `signature_snapshots` | never | never | Immutable ✅ |
| `orielRuntimeProfiles` | status/activation fields only | never | Versioned ✅ |
| `orielImprovementProposals` | status/evaluation fields | never | Auditable ✅ |
| `generatedTransmissionEvents` | `status`, `payload` (`updateGeneratedTransmissionEventPayload`) | never | Mostly auditable ⚠ |
| `chatMessages` | never | `clearChatHistory` (user-initiated) | Append-only ✅ |
| `orielMemories` | `accessCount`/`lastAccessed` bumped on read; `isActive` togglable | soft only | Mutable ⚠ |
| `orielUserProfiles` | **fully overwritten** each regeneration | — | **Destructive** ⚠ |
| `orielOversoulPatterns` | `interactionCount`/`lastRefined` | — | Mutable ⚠ |
| `userStaticProfiles` | upsert (recompute overwrites) | — | Destructive but reproducible ⚠ |
| `wiki/**/*.md` (**not a table**) | **overwritten by LLM merge** | — | **Destructive, ungated** ⚠⚠ |

---

## 5. Indexing gaps relevant to ORIEL 3.0 retrieval

| Table | Hot query | Index today |
| --- | --- | --- |
| `orielMemories` | `WHERE userId=? AND isActive=1 ORDER BY importance DESC, lastAccessed DESC LIMIT n` | **none** |
| `orielOversoulPatterns` | `ORDER BY interactionCount DESC LIMIT 10` | **none** |
| `orielUserProfiles` | `WHERE userId=?` | unique ✅ |
| `chatMessages` | `WHERE conversationId=? ORDER BY timestamp` | raw-SQL index only, not in `schema.ts` |
| `bookmarks` | `WHERE userId=?` / `WHERE transmissionId=?` | **none** |
| `orielReflectionEvents` | `WHERE eventType=? ORDER BY createdAt DESC` | ✅ both |

Any provenance/retrieval work that adds selectivity columns should add the corresponding composite indexes at the same time, and should backfill the missing index on `orielMemories(userId, isActive, importance)`.

---

## 6. Entity-relationship sketch (logical; no FKs exist)

```
users(id) ─┬─< conversations ─< chatMessages
           ├─< orielMemories                        (userId nullable)
           ├─< orielPendingMemoryCandidates ──> orielMemories (acceptedMemoryId)
           ├─1 orielUserProfiles
           ├─< carrierlockStates ─< codonReadings
           ├─< staticSignatures
           ├─1 userStaticProfiles
           ├─< bookmarks ──> transmissions
           ├─< oracleResonances ──> oracles(oracleId)
           ├─< generatedTransmissionEvents          (userId, conversationId nullable)
           ├─< signature_orders ─┬─1 signature_intakes
           │                     ├─< signature_snapshots
           │                     ├─1 signature_letter_drafts
           │                     └─1 signature_followups
           └─< orielReflectionEvents                (userId nullable)

orielImprovementProposals ──> orielRuntimeProfiles (appliedProfileId)
orielRuntimeProfiles      ──> orielImprovementProposals (createdFromProposalId)
orielReflectionEvents     ──> both (proposalId, profileId)

orielOversoulPatterns     ── no relations (global)

ba_user ~(email)~ users        ← resolved at request time, not a column
```

---

## 7. Data that must not be lost

Per the directive ("never delete existing user data", "preserve existing records"), the following hold irreplaceable user data and must be treated as read-only during any ORIEL 3.0 migration:

| Table | Why irreplaceable |
| --- | --- |
| `users`, `ba_*` | account identity, credentials |
| `chatMessages`, `conversations` | the entire episodic record; not derivable |
| `orielMemories` | accumulated semantic memory; not derivable from chat without re-running extraction |
| `orielPendingMemoryCandidates` | consent decisions the user actually made |
| `carrierlockStates` | coherence time series; not recomputable |
| `staticSignatures`, `userStaticProfiles` | contain **birth date/time/place** — special-category personal data under GDPR |
| `transmissions`, `oracles` | canonical archive; previously destroyed once by an agent (`docs/ORIEL_AUDIT_V2.md` §1: `DROP TABLE IF EXISTS oracles; DROP TABLE IF EXISTS transmissions;`) |
| `signature_*` | paid-order records; financial + legal |
| `orielReflectionEvents` | the existing audit log |
| `wiki/**` (files) | contains the only copies of some auto-evolved canon; history exists only in git |

---

## 8. Summary against ORIEL 3.0 database requirements

| Requirement | Status |
| --- | --- |
| 1. Inspect current schema | ✅ done — 29 tables catalogued above |
| 2. Determine database technology | ✅ MySQL/TiDB + Drizzle |
| 3. Identify migration tooling | ⚠ **two systems, partially divergent** (§2) |
| 4. Create reversible migrations | ❌ **no `down` migration exists anywhere** — must be introduced |
| 5. Preserve existing records | ⚠ achievable; §7 lists the protected set |
| 6. Indexes for provenance and retrieval | ❌ `orielMemories` and `orielOversoulPatterns` have none |
| 7. Timestamps | ✅ near-universal (`createdAt` + `onUpdateNow` `updatedAt`) |
| 8. Version fields | ⚠ only `userStaticProfiles.{specVersion,engineVersion}` and `signature_snapshots.engineVersion` |
