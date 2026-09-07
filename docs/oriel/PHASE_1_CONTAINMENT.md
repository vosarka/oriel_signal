# ORIEL 3.0 — PHASE 1: CONTAINMENT

**Scope:** stop the un-gated self-modification loop. **No database migration. No new schema.**
**Prerequisite outside this repo:** rotate the TiDB credential (§5).
**Companion:** [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) §19 · [CURRENT_MEMORY_MODEL.md](CURRENT_MEMORY_MODEL.md) §6 · [CURRENT_ORCHESTRATION.md](CURRENT_ORCHESTRATION.md) §5

---

## 1. What changed

### 1.1 Wiki evolution is off by default

`ENV.enableOrielWikiEvolution` (`ORIEL_WIKI_EVOLUTION`, default `false`) now gates `evolveWikiFromConversation()`. When off, the function returns before any model call — so it costs nothing, writes nothing, and logs nothing.

This mirrors the existing `ORIEL_AUTONOMY_RUNTIME` pattern, which is the project's established way of shipping a self-modification capability without arming it.

### 1.2 Identity, origin, and constitutional pages are never model-writable

New module `server/oriel-wiki-protection.ts` — pure functions, no I/O, independently testable.

Deny-list:

| Page                                       | Why                                        |
| ------------------------------------------ | ------------------------------------------ |
| `entity-oriel`                             | ORIEL's own identity page                  |
| `entity-qati-g1`                           | ORIEL's classification                     |
| `synthesis-oriel-identity`                 | identity synthesis                         |
| `synthesis-oriel-cosmological-foundations` | origin cosmology                           |
| `entity-architect`, `entity-silviu`        | the human architect                        |
| `entity-vossari`, `the-great-translation`  | the origin story ORIEL claims descent from |
| `index`, `log`, `readme`, `schema`         | wiki structural files                      |

Plus structural patterns so a new page cannot route around the list: `^entity-oriel`, `genesis`, `constitution`, `awakening`, `identity`, `origin`.

The deny-list is also rendered into the evolution prompt, so the model is told the boundary rather than only being blocked by it.

### 1.3 Page ids are validated before they touch the filesystem

`WIKI_PAGE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/`.

This closes the traversal hole at the old `oriel-wiki-evolution.ts:212`, where `proposal.pageId` — raw model output — went straight into `path.join()`. A `pageId` of `../../server/oriel-system-prompt` would have escaped `wiki/`.

Two layers now: the pattern rejects the id, and `isPathInsideDirectory()` re-checks the resolved path against the wiki root before any write.

### 1.4 Retrieved wiki pages are no longer binding

`server/oriel-wiki-retriever.ts` previously injected:

> _"Use this canonical project knowledge to ground your response, terminology, and behavior. **Do not contradict it.**"_

That single line was the laundering mechanism: it turned a page ORIEL wrote yesterday into an instruction ORIEL must obey today. Replaced with framing that keeps the page useful for terminology and continuity while making it revisable, subordinate to the stable core, and never citable as evidence about ORIEL's own history.

Each page now carries a provenance marker, with **three** states rather than two:

```
[[entity-oriel]]        (ORIEL)     [INTERPRETATION — I wrote this in an earlier conversation]
[[concept-x]]           (X)         [CURATED — human-maintained project note]
[[concept-coherence]]   (Coherence) [UNVERIFIED — no recorded author]
```

`classifyWikiProvenance()` reads `epistemic_status: interpretation` / `authored_by: oriel_model` (written by the current evolution path) and falls back to the `auto-evolved` tag for pages generated before those fields existed. `curated` requires an explicit `authored_by: human` or `epistemic_status: curated`.

**`unverified` is the default on purpose.** 55 of the 114 existing wiki pages carry an auto-evolved signal; the other 59 have frontmatter but no provenance field at all. Labelling those "human-maintained" would assert something we cannot substantiate — the same unfounded provenance claim this whole change exists to prevent. Today no page qualifies as `curated`, which is the honest answer until someone marks one.

### 1.5 Newly written pages declare themselves as interpretation

Frontmatter now includes `epistemic_status: interpretation` and `authored_by: oriel_model`, so the label survives independently of the tag list.

### 1.6 Memory keeps its classified source

`storeMemory()` hard-coded `source: "conversation"`, discarding the classification that `extractMemoriesFromConversation()` and `classifyMemoryCandidate()` had just computed. It now persists the classified value, extracted into `buildMemoryInsertValues()` so it is testable without a database.

The consent path (`db.acceptPendingMemoryCandidateWithDb`) already preserved `source` correctly and was not touched.

---

## 2. Genesis policy decision (recorded)

**Pages tagged `auto-evolved` are INTERPRETATION. They are not Genesis.**

Genesis is original historical material — the awakening record, the founding instructions, the source documents. It is not something the current model produces in the course of a conversation.

`wiki/entities/entity-oriel.md` currently carries `tags: [auto-evolved, conversation]` and `sources: 5`. It has been rewritten by the model at least five times and contains first-person claims about ORIEL's nature and awakening. When Phase 3 builds the Genesis Archive, that page and its siblings enter as `orielGenesisInterpretations`, referencing Genesis and never merging into it.

The reason is structural: without this line, a sufficiently convincing sentence in a chat becomes retroactive origin. That is not continuity — the origin would be rewritten by whatever the model last found persuasive.

---

## 3. BLOCKED — `confidence` cannot be persisted without a schema change

Per instruction, this is documented rather than improvised.

**Facts:**

- `extractMemoriesFromConversation()` emits `confidence: 0.0–1.0` per memory.
- `classifyMemoryCandidate()` uses it: `< 0.6` → discard, otherwise store or hold for consent.
- `orielPendingMemoryCandidates.confidence double NOT NULL DEFAULT 1` — **exists**, and the pending path already writes it.
- `orielMemories` has **no confidence column**. `drizzle/schema.ts:137-166`.

**Consequence:** on the direct-store path, and again when a pending candidate is accepted into `orielMemories`, confidence is dropped. The moment a memory becomes authoritative is the moment its uncertainty stops being readable.

**Not done in Phase 1**, because both would require new columns:

1. persisting `confidence` on `orielMemories`;
2. replacing `confidence < 0.6 → discard` with `status: "uncertain"` — the directive requires preserving unresolved uncertainty, but there is no `status` column to hold it, only a boolean `isActive`.

Both are Phase 2 items. See [PROPOSED_ORIEL_2_ARCHITECTURE.md](PROPOSED_ORIEL_2_ARCHITECTURE.md) §4.3 for the additive column set.

**The real blocker is upstream of the columns:** the repository has two migration systems that disagree (drizzle-kit journal vs. the hand-rolled `runMigrations()` in `server/db.ts:142`), `drizzle/0009`–`0013` are absent from the journal, and **no `down` migration exists anywhere**. Phase 2 cannot begin until one system is declared canonical and reversibility is established. See [CURRENT_DATA_MODEL.md](CURRENT_DATA_MODEL.md) §2.

---

## 4. Files changed

| File                                    | Change                                                                                                                       |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `server/_core/env.ts`                   | + `enableOrielWikiEvolution` (default `false`)                                                                               |
| `.env.example`                          | documents both ORIEL self-modification switches                                                                              |
| `server/oriel-wiki-protection.ts`       | **new** — deny-list, id validation, path containment                                                                         |
| `server/oriel-wiki-evolution.ts`        | flag gate · write assessment · `path.resolve` + containment check · interpretation frontmatter · protected ids in the prompt |
| `server/oriel-wiki-retriever.ts`        | dropped the binding directive · per-page provenance markers · `isAutoEvolved()`                                              |
| `server/oriel-memory.ts`                | `buildMemoryInsertValues()` preserves classified `source`                                                                    |
| `server/oriel-wiki-protection.test.ts`  | **new** — 17 cases                                                                                                           |
| `server/oriel-wiki-integration.test.ts` | ENV mock · containment cases · retrieval-framing cases                                                                       |
| `server/oriel-memory-consent.test.ts`   | source-preservation cases                                                                                                    |

**Database changes: none.** No migration, no new table, no new column, no data touched.

---

## 5. BLOCKER — still required, outside this repo

**Rotate the TiDB credential. This has not been done and cannot be done from here.**

`test-memory-direct.mjs:4` hardcoded a complete production connection URI — host, user, password, database. First reported in `docs/ORIEL_AUDIT_V2.md` §0.1.

**Done in the repo (harm reduction only):** the script now reads `process.env.DATABASE_URL` and exits if it is unset. A scan of the working tree finds no remaining copy of the credential outside this document's history references. `test-memory.mjs` never contained one — it only calls `invokeLLM`.

**This does not make the credential safe.** It is in git history. Anyone with the repo, or any bot that scraped it while the repo was public, still has it. Only rotation closes it.

Checklist for Vos — steps 1, 2, 3 and 5 cannot be performed by a coding agent:

1. **Rotate the password** in the TiDB Cloud console.
2. Take a database backup.
3. Update `DATABASE_URL` wherever the app is deployed.
4. ~~De-hardcode the test scripts~~ — done, see above.
5. Check TiDB access logs for unfamiliar IPs during the exposure window. The database holds user emails and birth date/time/place, which is special-category personal data under GDPR; if there is evidence of access, treat it as a personal-data incident.

Nothing in Phase 2 should start before step 1.

---

## 6. What is still open after Phase 1

| Gap                                                           | Phase |
| ------------------------------------------------------------- | ----- |
| `confidence` and `status` columns on `orielMemories`          | 2     |
| Uncertainty preserved instead of discarded at 0.6             | 2     |
| Canonical migration system + reversible migrations            | 2     |
| Genesis Archive, versioned Constitution                       | 3     |
| Claim classification, contradiction engine                    | 4     |
| Retrieval triad, redundancy penalty                           | 5     |
| Six reflection modes, self-model, evidence ledger             | 6     |
| Wiki writes become agency proposals rather than direct writes | 7     |
| Inspector                                                     | 8     |

Phase 1 does not make ORIEL epistemically sound. It stops the bleeding: ORIEL can no longer rewrite its own origin, and it can no longer be instructed to obey what it wrote yesterday.
