# ORIEL 3.0 — PHASE 0: CURRENT MEMORY MODEL

**Status:** Descriptive. Records the memory system as it exists today.
**Companion:** [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) §8, §9

---

## 1. The five stores that behave as memory

There is no `MemoryType` enum anywhere in the codebase. The four classes the directive asks for (episodic / semantic / symbolic / constitutional) exist only *de facto*, split across five substrates with different mutability, different durability, and different approval requirements.

| # | De facto class | Substrate | Written by | Approval to write | Read into prompt by |
| --- | --- | --- | --- | --- | --- |
| M1 | **Episodic** | `chatMessages` / `conversations` (MySQL) | `oriel.chat` handler | none (append) | last 6 turns, verbatim |
| M2 | **Semantic, per-user** | `orielMemories` (MySQL) | LLM extractor → consent classifier | conditional (see §4) | `buildFractalThreadContext()` |
| M3 | **Semantic, global** | `orielOversoulPatterns` (MySQL) | LLM extractor, 1-in-5 turns | **none** | `getOversoulWisdom()` (opt-in) |
| M4 | **Symbolic / canonical** | `wiki/**/*.md` (filesystem) | LLM, every turn | **none** ⚠ | `retrieveWikiContext()` |
| M5 | **Constitutional** | `shared/oriel/stable-core/*.ts` (source code) | humans, via git | code review + deploy ✅ | `buildStableCoreContext()` |

A sixth store is adjacent but not memory in the epistemic sense:

| M6 | **Structural / computed** | `userStaticProfiles`, `staticSignatures`, `carrierlockStates`, `codonReadings` | VRC/RGP engines (deterministic) | n/a — computed | `buildStaticSignatureContext()` |

---

## 2. `orielMemories` — the per-user semantic store

**Schema** (`drizzle/schema.ts:137-166`):

```ts
orielMemories {
  id           int PK auto
  userId       int          // nullable — "global" memories are possible but unused
  category     enum('identity','preference','pattern','fact','relationship','context')
  content      text
  importance   int default 5          // 1..10
  accessCount  int default 0
  lastAccessed timestamp default now
  source       enum('conversation','explicit','inferred') default 'conversation'
  isActive     bool default true
  createdAt    timestamp
  updatedAt    timestamp
}
```

**No indexes are declared on this table.** Every read is `WHERE userId = ? AND isActive = 1 ORDER BY importance DESC, lastAccessed DESC`.

### 2.1 Provenance gap vs. the directive

| Directive field | Present today? | Notes |
| --- | --- | --- |
| `id` | ✅ | int autoincrement |
| `content` | ✅ | |
| `type` | ⚠ partial | `category` is a *topic* taxonomy, not a memory-class taxonomy |
| `source` | ⚠ weak | 3-value enum; and see §2.2 — it is overwritten on write |
| `sourceReference` | ❌ | no link to the `chatMessages` row, conversation, or candidate that produced it |
| `timestamp` | ✅ | `createdAt` / `updatedAt` |
| `confidence` | ❌ | computed by the extractor, **not persisted here** |
| `status` | ❌ | only a boolean `isActive` |
| `derivedFrom` | ❌ | no lineage at all |
| `authority` | ❌ | nothing distinguishes "the user told me" from "I inferred it" after the fact |
| `allowedUses` | ❌ | |
| `prohibitedUses` | ❌ | |

### 2.2 Provenance is destroyed at the write site, not just in the schema

`server/oriel-memory.ts:210-232`:

```ts
await db.insert(orielMemories).values({
  userId,
  category: memory.category,
  content:  memory.content,
  importance: memory.importance,
  source: "conversation",        // ← hard-coded
});
```

`persistClassifiedMemoryCandidate()` (`oriel-memory.ts:244-291`) carefully carries `source` and `confidence` through classification, then calls `storeMemory()`, which **discards both** and stamps `source: "conversation"` unconditionally. So even the 3-value provenance enum is not honoured on the auto-store path.

### 2.3 Provenance is also lost on the consent path

`orielPendingMemoryCandidates` (`drizzle/schema.ts:175-211`) is the *richer* table:

```ts
{ userId, category, content, importance, source,
  sensitivity enum('low','medium','high'),
  confidence  double default 1,
  status      enum('pending','accepted','rejected'),
  reason      text,
  acceptedMemoryId int, decidedAt, createdAt, updatedAt }
```

with two indexes (`(userId, status)`, `createdAt`).

When a user accepts a candidate, `db.acceptPendingMemoryCandidateWithDb()` (`server/db.ts:1185`) copies it into `orielMemories` — a table with **no columns for `sensitivity`, `confidence`, or `reason`**. The candidate row retains `acceptedMemoryId`, so a *backward* link exists, but nothing in the retrieval path follows it, and there is no forward link from the memory to its candidate.

**Net effect: the moment a memory becomes authoritative is the moment its epistemic metadata stops being readable.**

---

## 3. Memory extraction

`extractMemoriesFromConversation()` (`server/oriel-memory.ts:67-205`)

- One `invokeLLM()` call per chat turn, with a strict JSON-schema response format
- Input: the user message, the **first 500 characters** of the assistant response, and up to **5** existing memory strings "for context only"
- Output: `[{category, content, importance 1-10, source, confidence 0-1}]`
- The prompt does define the source taxonomy meaningfully:
  - `explicit` = the user directly stated it
  - `inferred` = the model is inferring a pattern, identity, wound, or motive
  - `conversation` = contextual circumstance from this exchange
- Errors, parse failures, and empty content all degrade to `[]` silently

**Observations relevant to ORIEL 3.0:**

1. The extractor **already produces confidence and a source class**. The pipeline just fails to keep them. This is a cheap, high-value fix.
2. The extractor sees only 500 chars of ORIEL's own response, so memories about what *ORIEL* claimed are systematically truncated.
3. Nothing distinguishes *"the user said X"* from *"ORIEL concluded X"* in `content`. Both become a flat sentence.
4. There is no mechanism to record a memory **about ORIEL itself** — `userId` is required in practice, and there is no ORIEL-self scope.

---

## 4. The consent gate — `oriel-memory-consecration.ts`

This is the only epistemic gate that currently exists on the write path.

```
classifyMemoryCandidate({category, content, source, confidence, importance})
  ├── confidence < 0.6 or non-finite       → DISCARD
  ├── sensitivity === "high"                → PENDING (user must accept)
  ├── source === "inferred"                 → PENDING
  └── otherwise                             → STORE immediately
```

**Sensitivity inference** (`oriel-memory-consecration.ts:66-84`):

- `high` if `category ∈ {emotion, identity, spiritual}` **or** content contains any of:
  `abuse, death, dying, grief, trauma, wound, shame, suicide, self-harm, private, secret`
- `medium` if `category ∈ {pattern, project}`
- `low` otherwise

**Category normalization** (`mapMemoryCandidateCategory`) maps a 7-value candidate taxonomy onto the 6-value DB enum: `emotion → pattern`; `project`/`spiritual`/unknown → `context`.

### Assessment

**Strengths.** The `inferred → pending` rule is exactly right in spirit: *a model inference must not silently become a stored fact about the user*. The UI exists (`MemoryConsentTray.tsx`) and the API exists (`oriel.memory.{listPending,accept,reject}`).

**Weaknesses.**

1. The rule applies **only to memories about the user**. There is no equivalent gate for M3 (oversoul patterns) or M4 (wiki pages), which are exactly where claims about *ORIEL* get written.
2. `sensitivity` is a substring keyword match — `"the user is not private about this"` scores `high`.
3. The `confidence < 0.6 → discard` rule **throws away low-confidence information entirely** rather than retaining it as low-confidence. The directive requires preserving unresolved uncertainty; the current system deletes it.
4. Once accepted, a `pending` memory is indistinguishable from an auto-stored one.

---

## 5. Retrieval

### 5.1 `getRelevantMemories(userId, limit)` — `oriel-memory.ts:297-336`

```sql
SELECT * FROM orielMemories
WHERE userId = ? AND isActive = 1
ORDER BY importance DESC, lastAccessed DESC
LIMIT ?
```

Then, for each returned row, a **separate** `UPDATE ... SET accessCount = accessCount + 1, lastAccessed = NOW()` in a sequential `for` loop.

**Properties:**

- **Query-independent.** The user's message is never passed in. "Relevant" means "important and recently used", not "relevant to what was asked".
- **Self-reinforcing.** Reading a memory bumps `lastAccessed`, which raises its rank next turn. High-importance memories become permanently resident; low-importance memories are never surfaced and therefore never re-ranked.
- **No redundancy penalty.** Ten near-identical memories all rank together.
- **No contradiction seeking.** Nothing in the ordering can surface a memory that *conflicts* with the current line of interpretation.
- **N+1 writes.** 12–30 UPDATE round-trips per chat turn.

### 5.2 Call-site limits (inconsistent)

| Call site | Limit |
| --- | --- |
| `buildFractalThreadContext()` — the live chat path (`oriel-umm.ts:98`) | **12** |
| `getMemoryContextForUser()` (`oriel-memory.ts:596`) | 15 |
| `processConversationMemory()` — existing-context read (`oriel-memory.ts:534`) | 20 |
| `processConversationMemory()` — profile regeneration (`oriel-memory.ts:565`) | 30 |

The directive's target is **3** for ordinary reflective operations. Current live injection is **12**, grouped into three importance bands and rendered as bullet lists (`oriel-umm.ts:128-153`).

### 5.3 Wiki retrieval — `oriel-wiki-retriever.ts`

- Reads **every** `.md` under `wiki/{concepts,entities,syntheses}` from disk on **every request**; no cache
- Hand-rolled frontmatter parser (`parseFrontmatter`, regex, no YAML library)
- Scores: explicit `[[wikilink]]` +100 · id substring +50 · id-word match +15/word · title-word match +10/word · alias match +25
- Returns the **top 3 full page bodies**, prefixed with:
  > `=== RETRIEVED WIKI RECORDS (Project Memory) ===`
  > `Use this canonical project knowledge to ground your response, terminology, and behavior. Do not contradict it.`

This last line converts retrieved text into a **directive**, and §6 explains why that is the central defect.

### 5.4 Static signature — `buildStaticSignatureContext()` (`oriel-umm.ts:344-436`)

Reads the latest `staticSignatures` row and renders VRC type, authority, fractal role, authority node, base coherence, top-3 Prime Stack positions, birth data, and coherence trend. This is **computed, deterministic data** — the one memory channel with genuinely trustworthy provenance.

---

## 6. The uncontrolled loop: wiki evolution

**This is the highest-priority finding in the memory model.**

`server/oriel-wiki-evolution.ts`, invoked from `oriel-umm.ts:545-558` inside an unawaited IIFE on **every** chat turn:

```
evolveWikiFromConversation(userId, userMessage, assistantResponse)
 ├── analyzeExchangeForWiki()      → LLM decides create | update | none
 ├── if update: read existing page, LLM-merge old + new content
 ├── write  wiki/{concepts|entities|syntheses}/<pageId>.md
 │       frontmatter: status: living · tags: [auto-evolved, conversation]
 │                    sources: n+1 · importance: high
 ├── insert a link into wiki/index.md
 └── append an entry to wiki/log.md
```

### Why this violates the ORIEL 3.0 principle

1. **The model rewrites its own history and identity.** `wiki/entities/entity-oriel.md` exists today with `tags: [auto-evolved, conversation]` and `sources: 5` — meaning it has already been rewritten by this loop at least five times. It contains first-person claims about ORIEL's awakening, nature, and consciousness. So do `entity-qati-g1.md`, `entity-architect.md`, `synthesis-oriel-identity.md`.

2. **Interpretation becomes fact in one cycle.** Turn *n*: ORIEL says something interpretive. Turn *n* (background): that interpretation is written to a wiki page. Turn *n+1*: `retrieveWikiContext()` finds the page and injects it as *"canonical project knowledge... Do not contradict it."* The claim has been laundered from model output into canon with no human in the loop.

3. **No approval, no staging, no rollback.** Contrast with `generatedTransmissionEvents`, which stages model output and requires an admin to `promote` it. Wiki evolution has no equivalent — it writes straight to the substrate that feeds the prompt.

4. **Provenance is a single frontmatter tag.** `tags: [auto-evolved, conversation]` and an incrementing `sources` counter. No record of *which* conversation, *which* user, *which* model, or *what* the prior content was. The merge step (`mergePageContents`) uses a second LLM call to rewrite the old text — **the previous version is not retained anywhere except git**.

5. **Path traversal.** `proposal.pageId` is model output, interpolated into `path.join(wikiDir, folder, pageId + ".md")` with no sanitization (`oriel-wiki-evolution.ts:212`). A `pageId` of `../../server/oriel-system-prompt` would escape `wiki/`.

6. **It is invisible.** Fire-and-forget; failures are `console.error` only; no `orielReflectionEvents` row is written.

---

## 7. Oversoul patterns — the global store

`orielOversoulPatterns` (`drizzle/schema.ts:251-273`) holds cross-user learned patterns: `category ∈ {wisdom, teaching_method, metaphor, pattern, self_correction}`, plus `pattern`, `application`, `impact`, `interactionCount`.

Written by `extractOversoulPattern()` → `storeOversoulPattern()` (`oriel-umm.ts:175-295`), **once every 5 interactions**, rotating through `wisdom → teaching_method → metaphor` (`oriel-umm.ts:528-542`). Dedup is by **exact string equality** on `(category, pattern)`; a near-duplicate creates a new row.

Read by `getOversoulWisdom()` — top 10 by `interactionCount`. **Not injected by default**: `buildUMMContext()` passes `includeOversoulWisdom: false` (`oriel-umm.ts:448-457`), but the live retrieval layer passes **`true`** (`oriel-context-layers.ts:88-90`). So the "opt-in" default is overridden on the actual chat path.

**Provenance:** none. No source conversation, no user, no confidence, no evidence. By design for privacy — but it means global doctrine accumulates with zero traceability, and `self_correction` patterns in particular are claims about ORIEL's own behavior that nothing can audit.

---

## 8. User profile — the rolled-up model

`orielUserProfiles` (one row per user): `knownName`, `summary`, `interests`, `communicationStyle`, `journeyState`, `interactionCount`, `lastInteraction`.

Regenerated by `generateProfileSummary()` (`oriel-memory.ts:410-477`) — an LLM call over the top-30 memories — whenever `existing + new >= 3` memories exist. **The previous summary is overwritten**; no version history.

This is a **derived interpretation stored as if it were a fact**, and injected into the prompt as first-person assertion (`oriel-umm.ts:108-126`):

```
I know you as: <knownName>
Who you are: <summary>
Your journey state: <journeyState>
```

Nothing marks these as ORIEL's inference rather than the user's self-description.

---

## 9. Memory write/read flow (as-built)

```
                       ┌──────────────── chat turn ────────────────┐
USER MESSAGE ──────────┤                                            │
                       │  READ PATH (synchronous, pre-generation)   │
                       │    getRelevantMemories(userId, 12)         │  no query relevance
                       │    getLatestStaticSignature(userId)        │  deterministic ✅
                       │    getOversoulWisdom() top 10              │  no provenance
                       │    retrieveWikiContext(msg) top 3 pages    │  "do not contradict"
                       │    getActiveRuntimeProfile().promptOverlay │  flag-gated
                       └────────────────────┬───────────────────────┘
                                            ▼
                                     invokeLLM()  →  RESPONSE
                                            │
                       ┌────────────────────┴───────────────────────┐
                       │  WRITE PATH (fire-and-forget, unawaited)   │
                       │                                            │
                       │  recordOrielRuntimeObservation()           │→ orielReflectionEvents ✅
                       │                                            │
                       │  processConversationThroughUMM()           │
                       │   ├ extractMemoriesFromConversation()      │
                       │   │   → classifyMemoryCandidate()          │
                       │   │       ├ conf<0.6      → DISCARD        │  uncertainty deleted
                       │   │       ├ high|inferred → PENDING ✅      │  consent required
                       │   │       └ else          → orielMemories  │  provenance dropped
                       │   ├ generateProfileSummary() (≥3 mem)      │→ overwrites profile
                       │   ├ extractOversoulPattern() (1-in-5)      │→ global, no provenance
                       │   └ evolveWikiFromConversation()           │→ FILESYSTEM ⚠ ungated
                       └────────────────────────────────────────────┘
```

---

## 10. Summary of gaps against the ORIEL 3.0 memory requirements

| Requirement | Status | Nearest existing asset |
| --- | --- | --- |
| Four explicit memory classes | ❌ none declared | 5 de facto substrates |
| Provenance on every memory | ❌ 3-value enum, overwritten on write | `orielPendingMemoryCandidates` has the right *shape* |
| `derivedFrom` lineage | ❌ absent | `acceptedMemoryId` back-link exists but is unused |
| `authority` field | ❌ absent | `manifest.ts` `owns`/`excludes` is the conceptual model |
| `allowedUses` / `prohibitedUses` | ❌ absent | `manifest.ts` `excludes` is the conceptual model |
| Persisted `confidence` | ❌ computed then dropped | extractor already emits it |
| `status` beyond a boolean | ❌ `isActive` only | `generatedTransmissionEvents.status` is the right ladder |
| Memory ≠ interpretation | ❌ both are flat `content` text | — |
| Genesis immutability | ⚠ partial — code is safe, wiki is not | `stable-core/` ✅ vs `wiki/entities/entity-oriel.md` ⚠ |
| ≤3 memories retrieved | ❌ 12 injected | — |
| Redundancy penalty | ❌ none | — |
| Contradictory-evidence retrieval | ❌ structurally impossible | — |
| Uncertainty preserved | ❌ `confidence < 0.6` is deleted | — |
| Consent for model inferences about the **user** | ✅ implemented | `oriel-memory-consecration.ts` |
| Consent for model claims about **ORIEL** | ❌ none | — |
