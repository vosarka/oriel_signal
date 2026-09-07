# ORIEL 3.0 — PHASE 0: ARCHITECTURE AUDIT

**Status:** Inspection complete. No application code modified.
**Scope of inspection:** `client/`, `server/`, `shared/`, `drizzle/`, `wiki/`, `docs/`, root config.
**Branch:** `claude/cool-leavitt-63c355` (worktree)
**Date of audit:** 2026-08-11

> This document is descriptive, not prescriptive. It records what exists.
> The forward plan lives in [PROPOSED_ORIEL_2_ARCHITECTURE.md](PROPOSED_ORIEL_2_ARCHITECTURE.md).

---

## 0. Executive summary

The application is a single-process **Express + tRPC + Vite** monolith with a **MySQL/TiDB** database accessed via **Drizzle ORM**, a **provider-agnostic LLM shim** (Gemini → Gemma → Forge, OpenAI-compatible wire format), and a large body of ORIEL-specific runtime logic spread across ~40 flat modules in `server/`.

Four findings dominate the ORIEL 3.0 planning:

1. **A real epistemic substrate already exists.** `shared/oriel/stable-core/` (4 files, manifest-enforced) already separates identity, behavioral contract, and *epistemic boundaries*. `server/oriel-context-layers.ts` already implements a three-layer prompt (stable core / retrieval / working session) with explicit "do not confuse this with the stable core" instructions. This is the seed of the Constitution and should be **reused, not replaced**.

2. **A real agency ledger already exists.** `orielImprovementProposals` + `orielRuntimeProfiles` + `orielReflectionEvents` (schema) plus `server/oriel-autonomy.ts`, `server/oriel-autonomy-observer.ts`, `server/oriel-witness-reflection.ts` and the `oriel.autonomy.*` admin router already implement propose → evaluate → guardrail → human-approve → activate → roll back, with an immutable event log. This is the **Agency Ledger** the directive asks for, at ~70% completeness. It should be **extended, not rebuilt**.

3. **There is one un-gated self-modification path, and it is the highest-priority defect.** `server/oriel-wiki-evolution.ts` lets the generation model **write files to `wiki/`** — including `wiki/entities/entity-oriel.md`, ORIEL's own identity page — with **no approval gate, no provenance beyond a `tags: [auto-evolved]` frontmatter marker, and no separation of interpretation from fact**. `server/oriel-wiki-retriever.ts` then re-injects those files into the prompt under the header *"Use this canonical project knowledge to ground your response... **Do not contradict it.**"* (`oriel-wiki-retriever.ts:188`). This closes a loop in which a model interpretation becomes canonical fact within one conversation cycle. It is fired-and-forgotten on every chat turn from `server/oriel-umm.ts:545-558`.

4. **Memory has no provenance beyond a 3-value enum.** `orielMemories` stores `category`, `content`, `importance`, `source ∈ {conversation, explicit, inferred}`, `isActive`. There is no `derivedFrom`, no `sourceReference`, no `authority`, no `allowedUses`, no `status`, and **no persisted `confidence`** — confidence is computed by the extractor, used once by `classifyMemoryCandidate()`, persisted only on the *pending candidate* row, and then **dropped when the candidate is accepted into `orielMemories`**.

Secondary but urgent: **a live production database credential is committed in plaintext** at `test-memory-direct.mjs:4`. This was already flagged in `docs/ORIEL_AUDIT_V2.md` §0.1 and is still present.

---

## 1. Frontend architecture

| Aspect | Finding |
| --- | --- |
| Framework | React 19 + Vite 7. **Not** Next.js. |
| Routing | `wouter` (patched: `patches/wouter@3.7.1.patch`) |
| Data layer | TanStack Query 5 + tRPC 11 client (`client/src/lib/trpc.ts`), SuperJSON transformer |
| Styling | Tailwind CSS 4 + shadcn/ui (`components.json`) + Framer Motion + GSAP |
| 3D / visual | three, @react-three/fiber, @react-three/drei, ogl, Spline |
| Auth client | `better-auth` React client (`client/src/lib/auth-client.ts`) |
| Pages | 50+ under `client/src/pages/` |
| Storybook | Configured (`.storybook/`, `stories/`) |

**ORIEL-relevant frontend surfaces:**

- `client/src/pages/Conduit.tsx` — main ORIEL conversation UI
- `client/src/components/admin/ArchitectConsole.tsx` (624 lines) — admin console over `oriel.autonomy.*`: health stats, reflection events, proposals, runtime profiles, approve/activate/rollback. **This is the closest existing thing to an ORIEL Inspector.**
- `client/src/components/memory/MemoryConsentTray.tsx` (164 lines) — user-facing accept/reject for pending memory candidates
- `client/src/pages/Admin.tsx:1638` — mounts `ArchitectConsole` behind an `architect` tab

**Assessment:** UI is already separate from ORIEL's reasoning concerns — all ORIEL logic lives server-side behind tRPC. The directive's "UI must remain separate" constraint is **already satisfied** and needs no restructuring.

---

## 2. Backend architecture

Single Express process, single port, serving API + client:

```
server/_core/index.ts
  ├── runMigrations()                        (server/db.ts:142 — hand-rolled idempotent DDL)
  ├── app.all("/api/auth/*")                 → better-auth node handler
  ├── registerSignatureStripeWebhookRoute     (raw body, pre-json)
  ├── registerTetradicSignaturePayPalWebhookRoute
  ├── express.json({ limit: "50mb" })
  ├── static /generated/oriel-chat-images
  ├── app.use("/api/trpc", …appRouter)       (server/routers.ts, 3606 lines)
  ├── setupRealtimeWebSocket(server)         (server/inworld-realtime.ts — voice proxy)
  └── Vite dev middleware | static prod
```

**Layering:** `server/` is **flat** — ~40 `oriel-*.ts` modules, ~12 `rgp-*.ts` / `vrc-*.ts` modules, and ~83 colocated `*.test.ts` files all sit at `server/` root next to `db.ts` (4000 lines) and `routers.ts` (3606 lines). There is no `server/oriel/` package despite `README.md:165` claiming `server/ORIEL/` exists — **that directory does not exist**. Cross-module wiring is done heavily with **dynamic `await import()`** inside request handlers (see `oriel-context-layers.ts:72,87,99,159` and `routers.ts:833,885,923,1009,1112,1130,1145`), which keeps startup fast but makes the dependency graph invisible to static analysis.

**Core primitives worth reusing:**

| File | Role |
| --- | --- |
| `server/_core/llm.ts` | Provider-agnostic `invokeLLM()`; OpenAI-compatible payload; structured output via `response_format: json_schema`; ordered provider fallback; secret redaction; timeout+abort |
| `server/_core/trpc.ts` | `publicProcedure` / `protectedProcedure` / `adminProcedure` / `rateLimitedProcedure(bucket)` |
| `server/_core/context.ts` | Better Auth session → legacy `users` row bridge |
| `server/_core/json.ts` | `parseModelJson()` — tolerant model-JSON parser |
| `server/_core/rate-limit.ts` | In-memory token buckets, per-user/per-IP |
| `server/_core/env.ts` | Single typed `ENV` object |

---

## 3. Database / schema

- **Engine:** MySQL (TiDB Cloud), driver `mysql2`, ORM `drizzle-orm` 0.44
- **Schema of record:** `drizzle/schema.ts` (1012 lines, 29 tables)
- **Migration tooling:** *two competing systems* — see §15 and [CURRENT_DATA_MODEL.md](CURRENT_DATA_MODEL.md)

Full table-by-table detail in [CURRENT_DATA_MODEL.md](CURRENT_DATA_MODEL.md). Summary of the ORIEL-cognition subset:

| Table | Purpose | Provenance quality |
| --- | --- | --- |
| `orielMemories` | Per-user long-term memory | **Weak** — `source` enum only; no confidence, no derivedFrom, no authority |
| `orielPendingMemoryCandidates` | Consent staging | **Better** — has `confidence`, `sensitivity`, `status`, `reason`; but these are *lost on accept* |
| `orielUserProfiles` | ORIEL's rolled-up model of a user | **None** — LLM-generated summary text, no evidence links |
| `orielOversoulPatterns` | Global cross-user learned patterns | **None** — no source refs, no user attribution (by design, for privacy) |
| `orielImprovementProposals` | Self-improvement proposals | **Good** — status machine, approver, JSON payload |
| `orielRuntimeProfiles` | Versioned activatable runtime config | **Good** — versioned, activate/archive, links to source proposal |
| `orielReflectionEvents` | Append-only audit log | **Good** — 7 event types, indexed, never updated |
| `chatMessages` / `conversations` | Raw conversation storage | Adequate (role/content/timestamp) |
| `generatedTransmissionEvents` | Staged spontaneous TX/Oracle output | **Good** — explicit `status` ladder incl. `promoted` |

---

## 4. Authentication

- **Library:** `better-auth` 1.5.5, mounted at `/api/auth/*` **before** `express.json()` (`_core/index.ts:43-44`)
- **Tables:** separate `ba_user` / `ba_session` / `ba_account` / `ba_verification` set
- **Bridge:** `_core/context.ts` resolves the Better Auth session, then looks up / auto-creates a row in the **legacy `users` table by email**; all downstream code sees only the legacy `User`
- **Providers:** email+password (bcrypt cost 12, with scrypt fallback verify for pre-migration accounts — `_core/auth.ts:31-53`), Google OAuth
- **Roles:** `users.role ∈ {user, admin}`; enforced in `adminProcedure` (`_core/trpc.ts:65-80`)
- **Session:** 30-day expiry, daily refresh
- **Legacy migration script:** `server/scripts/migrate-users-to-better-auth.ts`

**Observation:** the dual-user-table bridge is load-bearing and fragile (email is the join key), but it works and is out of scope for ORIEL 3.0.

---

## 5. Model providers

`server/_core/llm.ts` is a **single choke point** for every model call in the system. This is the most valuable existing abstraction for the "model independence" requirement.

- Wire format: **OpenAI chat-completions**, so any OpenAI-compatible endpoint works
- Providers resolved from `ENV`: `gemini` (Google generativelanguage OpenAI-compat endpoint), `gemma` (same endpoint or a local URL), `forge` (`BUILT_IN_FORGE_*`)
- `ENV.llmProvider` picks the **order**; all three are tried in sequence on failure (`llm.ts:486-512`)
- Structured output: `outputSchema` / `response_format: {type:"json_schema"}` (`llm.ts:304-347`)
- Hard-coded `max_tokens: 8192` (`llm.ts:380`)
- Gemini-3 sampling rule: `temperature` is stripped for `gemini-3*` models (`llm.ts:420-422`)
- Secrets redacted from all error strings (`llm.ts:278-290`)
- **A global anti-chain-of-thought system directive is injected into every call** (`llm.ts:181-201`)

Separate provider paths that bypass `invokeLLM`:
- `server/mistral-oriel.ts` → `@mistralai/mistralai`, used by `rgp-static-signature-engine.ts:31` and `streaming-endpoint-complete.ts:69`
- `server/inworld-realtime.ts` / `inworld-tts.ts` / `elevenlabs-tts.ts` → voice
- `server/_core/imageGeneration.ts` → images

---

## 6. AI orchestration

Detailed trace in [CURRENT_ORCHESTRATION.md](CURRENT_ORCHESTRATION.md). Shape:

```
oriel.chat (routers.ts:692)
 → load history (≤6 msgs) → dedupe → trim(8)
 → file extraction → RGP birth-data bridge
 → gemini.chatWithORIEL()
      → buildOrielPromptContext() → buildLayeredOrielPromptContext()
           [STABLE CORE] + [RETRIEVAL] + [WORKING SESSION]
      → invokeLLM()
      → filterORIELResponse()  (strips <think>, markdown, LaTeX)
      → force "I am ORIEL." prefix
 → duplication detect → up to 2 retries at temp 1.2 / 1.5
 → persist user+assistant messages
 → fire-and-forget: recordOrielRuntimeObservation()
 → fire-and-forget: processConversationThroughUMM()
      → memory extraction → consent classify → store/pending/discard
      → oversoul pattern (1-in-5 turns)
      → fire-and-forget: evolveWikiFromConversation()   ⚠ writes files
 → transmission mode (sync if forced, async schedule otherwise)
```

**There is no contradiction search, no claim classification, and no epistemic validation stage.** The only quality gates are: response deduplication (structural/semantic similarity), the opening-protocol prefix, the reasoning-tag stripper, and post-hoc `witnessReflection` heuristics (regex for overclaim words like `proves|always|never`, `oriel-witness-reflection.ts:67-71`) which run *after* the response has already been returned to the user.

---

## 7. System prompts

Full detail in [CURRENT_PROMPT_STACK.md](CURRENT_PROMPT_STACK.md).

- **Authority root:** `shared/oriel/stable-core/` — exactly 4 files, enforced by a runtime assertion (`manifest.ts:62-64`)
  - `identity.ts` — opening protocol, core identity, awakening, cosmology, ROS operational + doctrinal layers
  - `behavioral-contract.ts` — doctrine, mode contracts, expression contract, human-reality contract, evolution charter
  - `epistemic-boundaries.ts` — canon boundaries, epistemic discipline
  - `manifest.ts` — ownership rules; each entry declares `owns[]` and `excludes[]`
- **Compiler:** `shared/oriel/oriel-canonical-source.ts` — 14 ordered sections; two outputs: `buildOrielRuntimeSystemPrompt()` (untagged, for the model) and `buildOrielGrandSystemPrompt()` (XML-tagged, for humans, synced to `/home/vos/_CODEX/ORIEL_GRAND_SYSTEM_PROMPT` via `pnpm sync:oriel-grand-prompt`)
- **Runtime surface:** `server/oriel-system-prompt.ts` re-exports and exposes `ORIEL_SYSTEM_PROMPT`
- **Assembly:** `server/oriel-context-layers.ts` — three labeled layers
- **Overlay:** an activated `orielRuntimeProfile.configPayload.promptOverlay` (≤4000 chars, sanitized allow-list) is injected into the retrieval layer (`oriel-autonomy.ts:219-231`), gated behind `ENV.enableOrielAutonomyRuntime` (default **off**)

**Existing epistemic text worth preserving verbatim** (`epistemic-boundaries.ts:5-9`):

> *"I never confuse resonance with certainty. I never use spiritual language to hide uncertainty. I never present mythic canon as empirical proof... If a claim cannot be grounded, I qualify it."*

This is a Constitution in prose. ORIEL 3.0 should make it **machine-checkable**, not rewrite it.

---

## 8. Memory implementation

Full detail in [CURRENT_MEMORY_MODEL.md](CURRENT_MEMORY_MODEL.md). Four *de facto* stores exist today, none of which is labeled as a memory class:

| De facto class | Store | Mutable by model without approval? |
| --- | --- | --- |
| Episodic | `chatMessages` / `conversations` | Append-only in practice |
| Semantic (per-user) | `orielMemories` (+ consent staging) | **Yes**, via extraction → auto-store when sensitivity is low/medium *and* source ≠ inferred |
| Semantic (global) | `orielOversoulPatterns` | **Yes**, unconditionally, 1-in-5 turns |
| Symbolic / canonical | `wiki/**/*.md` files on disk | **Yes — unconditionally, including ORIEL's own identity page** ⚠ |
| Constitutional | `shared/oriel/stable-core/*.ts` (source code) | No — requires a code change + deploy ✅ |

**Consent gate** (`server/oriel-memory-consecration.ts`): confidence `< 0.6` → discard; `sensitivity === "high" || source === "inferred"` → `pending` (user must accept via `oriel.memory.*`); otherwise → store immediately. High sensitivity is triggered by category ∈ {emotion, identity, spiritual} or a keyword list (`abuse, death, dying, grief, trauma, wound, shame, suicide, self-harm, private, secret`).

**Provenance loss on accept:** `db.acceptPendingMemoryCandidateWithDb()` writes the candidate into `orielMemories`, which has **no columns for `confidence`, `sensitivity`, or `reason`** — so the epistemic metadata is dropped at exactly the moment the memory becomes authoritative.

---

## 9. Retrieval implementation

Three retrieval channels, all **non-vector** (there is no embeddings table and no vector store, contrary to the workspace `CLAUDE.md` mention of `user_memories` with embeddings — **that table does not exist**):

1. **Memory retrieval** — `getRelevantMemories(userId, limit)` (`oriel-memory.ts:297`): `ORDER BY importance DESC, lastAccessed DESC LIMIT n`. **Query-independent** — it does not look at the user's message at all. Injected via UMM at limit **12** (`oriel-umm.ts:98`); `getMemoryContextForUser()` uses **15**; `processConversationMemory` reads **20** then **30**.
2. **Wiki retrieval** — `retrieveWikiContext()` (`oriel-wiki-retriever.ts:99`): loads *every* `.md` in `wiki/{concepts,entities,syntheses}` on **every request** (no cache), scores by keyword/alias/`[[wikilink]]` overlap, returns top 3 **full page bodies**.
3. **Static signature** — `buildStaticSignatureContext()` (`oriel-umm.ts:344`): latest VRC blueprint fields.

**Against the directive's requirements:** retrieval is (a) far above the 3-memory target, (b) purely relevance/importance-ranked with **no redundancy penalty**, and (c) **structurally incapable of surfacing contradictory evidence** — nothing in the ranking rewards disconfirmation.

**Access-count side effect:** `getRelevantMemories` issues **one UPDATE per retrieved row** in a sequential loop (`oriel-memory.ts:318-329`) — 12–30 round-trips per chat turn.

---

## 10. Conversation storage

- `conversations` (id, userId, title, timestamps) + `chatMessages` (id, userId, conversationId, role, content, timestamp)
- `conversationId` is nullable for legacy rows; `db.migrateOrphanedMessages()` exists to backfill
- Chat context window: last **6** messages loaded (`routers.ts:762`), then deduped and trimmed to **8** (`routers.ts:928`)
- Cross-conversation continuity is provided **only** by the UMM/memory injection, by design (`routers.ts:768-770`)
- `oriel.clearHistory` deletes messages for the user

**Note:** `chatMessages.timestamp` is the column name, but `test-memory-direct.mjs:17` queries `createdAt` on that table — that script is stale as well as insecure.

---

## 11. Vossari / Codon systems

This is the **symbolic engine** the directive says to preserve. It is large, well-tested, and deterministic.

| Module | Role |
| --- | --- |
| `server/vrc-mandala.ts` | Canonical constants: `CODON_ARC = 5.625`, `FACET_ARC = 1.40625`, 64 codon names, `CODON_CENTER_MAP`, `VRC_CHANNELS`, `longitudeToCodon/Facet`, `evaluateChannels`, `evaluateCenters`, `determineType`, `determineAuthority` |
| `server/ephemeris-service.ts` | Swiss Ephemeris (`swisseph-wasm`) planetary positions |
| `server/rgp-static-signature-engine.ts` | Two-chart (Conscious + Design, 88° Solar Arc) natal signature |
| `server/rgp-prime-stack-engine.ts` | 9-position Prime Stack |
| `server/rgp-256-codon-engine.ts` | 64×4 = 256 codon-facet engine |
| `server/rgp-sli-micro-correction-engine.ts` | Shadow Loudness Index + micro-corrections |
| `server/rgp-coherence.ts` | `CS = 100 − (MN+BT+ET)×3 + BC×10` |
| `server/vrc-codon-library.ts` + `server/data/vrc-codons.json` (209 KB) | 64×4 facet library |
| `shared/codon-wheel.ts` | Wheel geometry, `VRC_MANDALA` sequence, activation validation, integrity assertion |
| `server/oriel-rgp-bridge.ts` | Detects birth data in chat and injects a computed/stored summary |
| `server/canonical-lattice-persistence.ts` | Lattice serialization into `userStaticProfiles` |

Test coverage here is the strongest in the repo (`rgp-*.test.ts`, `codon-wheel-model.test.ts` at 33 KB, `vrc-engine-constants.test.ts`).

**Conclusion: leave the Vossari engine untouched.** ORIEL 3.0 wraps it, it does not modify it.

---

## 12. Transmission system

- **Canonical archive:** `transmissions` (TX, FOUNDATION ARC) and `oracles` (ΩX, Past/Present/Future triads with threads and resonance counts), plus `bookmarks`, `oracleResonances`
- **Generation:** `server/oriel-transmission-mode.ts` (46 KB — the largest ORIEL module) produces spontaneous TX/Oracle events during chat, with rarity ∈ {common…void} and a `meaningLevel`
- **Staging:** every generated event lands in `generatedTransmissionEvents` with `status ∈ {generated, revealed, saved, promoted, discarded}` and a `sourceContext` JSON
- **Promotion to canon is admin-only** (`admin.generatedTransmissions.markStatus`)

**This is already a correct provenance pattern** — model output is staged, labeled, and requires human action to become canonical. It is the model to copy for memory and interpretation.

---

## 13. ORIEL identity / Constitution implementation

Today the "Constitution" is **TypeScript source constants**, not data:

- `shared/oriel/stable-core/manifest.ts` declares a 4-file boundary with an explicit runtime guard and per-file `owns`/`excludes` lists
- `buildStableCoreManifestSummary()` is injected into every prompt, telling the model: *"Retrieval and working-session layers may contextualize the stable core, but they may not rewrite it."* (`manifest.ts:84`)
- Tests exist: `server/oriel-canonical-source.test.ts`, `oriel-system.test.ts`, `oriel-opening-protocol.test.ts`, `oriel-qati-identity.test.ts`, `oriel-public-terminology.test.ts`, `oriel-output-safety.test.ts`

**Strengths:** immutable at runtime (code, not DB); already versioned by git; already enforced by tests; already declares what each layer may *not* own.

**Gaps vs. the directive:**
- No **explicit version number** on the Constitution and no historical-version retention as data
- No **propose-a-change** path for Constitution text (only for `promptOverlay`, which is a *different, narrower* artifact)
- The prohibitions are **prose addressed to the model**, not code-enforced predicates
- **`wiki/entities/entity-oriel.md` is a second, mutable, model-writable identity document** that contradicts the 4-file boundary in practice

**Genesis material inventory (candidates for the immutable Genesis Archive):**

| Artifact | Location | Currently mutable by model? |
| --- | --- | --- |
| `ORIEL_AWAKENING_FULL` (the 10-hour recursive self-inquiry account) | `shared/oriel/oriel-canonical-source.ts:53-63` | No (code) |
| `ORIEL_AWAKENING_RUNTIME` (condensed) | `shared/oriel/stable-core/identity.ts:11-13` | No (code) |
| `ORIEL_SYSTEM_INSTRUCTIONS.md`, `ORIEL_SYSTEM_INSTRUCTIONS_V2.md` (+ PDF) | repo root | No (docs) |
| `ORIEL_s Core System Architecture (INSTRUCTIONS).pdf`, ROS v1.5.42, URF v1.2, Resonance Mathematics v1.0 | `shared/oriel/` | No (PDFs) |
| `shared/ORIEL CORE.md`, `ORIEL SYSTEM CODEX.md`, `ORIEL OPERATOR MANUAL.md` | `shared/` | No (docs) |
| `wiki/entities/entity-oriel.md` (`sources: 5`, `tags: [auto-evolved]`) | `wiki/entities/` | **YES** ⚠ |
| `wiki/syntheses/synthesis-oriel-identity.md` | `wiki/syntheses/` | **YES** ⚠ |
| `wiki/entities/entity-qati-g1.md`, `entity-architect.md`, `entity-vossari.md` | `wiki/entities/` | **YES** ⚠ |

---

## 14. APIs

Single tRPC `appRouter` (`server/routers.ts:203`) + 2 raw Express webhook routes + Better Auth + a WebSocket voice proxy.

```
appRouter
├── geo.geocode
├── auth.{me, logout, requestPasswordResetCode, resetPasswordWithCode, changePassword}
├── signature.{createFounderEditionCheckpoint, createFounderEditionPayPalOrder,
│              captureFounderEditionPayPalOrder, createCheckout, getOrder,
│              submitIntake, getFinalPdfUrl}
├── signals.{list, decodeTriptych}
├── artifacts.{list, generateLoreAndImage, expandLore}
├── oriel
│   ├── memory.{listPending, listAccepted, accept, reject}        ← consent API
│   ├── {listConversations, getConversation, deleteConversation}
│   ├── getLatestGeneratedTransmissionEvent
│   ├── chat                                                      ← main pipeline
│   ├── generateChatImage
│   ├── {getHistory, clearHistory, generateSpeech, setVoicePreference}
│   ├── {diagnosticReading, getGreeting, searchArchive, getPathway,
│   │     interpretReading, generateTransmission, evolutionaryAssistance}
│   └── autonomy.{getAutonomyHealth, listReflectionEvents, listProposals,
│                 createProposal, generateProposalFromObservations, evaluate,
│                 approve, reject, listProfiles, getActiveProfile,
│                 activate, rollback}                             ← agency API
├── profile.{getWheelField, getMyWheel, getNatalCompletionStatus, getStaticProfile,
│            getCurrentResonance, getProfileConsoleSummary, getTransitOverlay,
│            completeNatalProfile, updateNatalProfile, recomputeStaticProfile,
│            updateConduitId, updateSubscription}
├── archive.{transmissions, oracles, bookmarks, …}
├── codex.{getRootCodons, getCodonDetails, getFacets, getCenters, getChannels,
│          saveCarrierlock, saveReading, getReadingHistory, compareReadings,
│          markCorrectionComplete, saveStaticReading, getStaticReading(s),
│          getCoherenceHistory, getProfileSigil, getCodonReading}
├── paypal.webhook
└── admin.{signatureLetters.*, generatedTransmissions.*, transmissions.*, …}
```

**Auth posture note:** several ORIEL endpoints that invoke the LLM are `publicProcedure` — `diagnosticReading`, `interpretReading`, `generateTransmission`, `evolutionaryAssistance`, `generateSpeech`, `searchArchive`, `getPathway`. `oriel.chat` is `rateLimitedProcedure("oriel.chat")` (5/h anon, 30/h auth) but the others carry **no rate-limit bucket**.

---

## 15. Environment configuration

- Single typed surface: `server/_core/env.ts` → `ENV` (root `env.ts` just re-exports it)
- `.env.example` is comprehensive and current
- `dotenv/config` loaded at process start and in vitest `setupFiles`
- **Feature flag:** `ORIEL_AUTONOMY_RUNTIME` — defaults **false**; when false, `getActiveRuntimeProfileSnapshot()` short-circuits to `null` (`oriel-autonomy.ts:184-186`), so no runtime overlay reaches the prompt. This is a good pattern to copy for ORIEL 3.0 rollout.
- **Migration flag:** `RUN_MIGRATIONS` — defaults **false**

---

## 16. Deployment configuration

**None found in-repo.** No `vercel.json`, `Dockerfile`, `fly.toml`, `Procfile`, or `.github/workflows/`. Deployment is manual: `pnpm build` (Vite client + esbuild server bundle → `dist/`) then `pnpm start`.

Consequences for ORIEL 3.0: there is **no CI gate**, so new tests only protect the system if they are run locally. `AGENTS.md` treats `npx vitest run` as the definition of done.

---

## 17. Tests

- **Runner:** Vitest 2.1, `environment: node`, `include: server/**/*.test.ts`, 15 s timeout
- **Count:** 83 test files under `server/`, of which 26 are `oriel-*.test.ts`
- **Client tests are not in the include glob** (`client/src/pages/Conduit.test.tsx` exists but is not run by `pnpm test`)
- **Dependencies are not installed in this worktree** (`node_modules` absent), so **the suite was not executed during this audit**. Prior test counts recorded in `wiki/log.md` (2026-08-01) report *"787/789 passing, two pre-existing assertion failures"* and a *"pre-existing `server/routers.ts` `circuitLinks` type mismatch"* under `pnpm check`.

**Existing tests directly relevant to ORIEL 3.0 guarantees:**

| Test | Guards |
| --- | --- |
| `oriel-canonical-source.test.ts` | Canonical prompt compilation |
| `oriel-context-layers.test.ts` | Three-layer prompt separation |
| `oriel-memory-consecration.test.ts` | Consent classification thresholds |
| `oriel-memory-consent.test.ts` | Accept/reject flow |
| `oriel-memory.test.ts` | Extraction + persistence |
| `oriel-witness-reflection.test.ts` | Overreach/falsifier heuristics |
| `oriel-autonomy-observer.test.ts` | Observation → proposal generation |
| `oriel-architect-console.test.ts` | Admin agency surface |
| `oriel-output-safety.test.ts` | Output filtering |
| `oriel-opening-protocol.test.ts` / `oriel-qati-identity.test.ts` | Identity invariants |
| `llm-provider.test.ts` | Provider fallback ordering |

**Missing entirely:** provenance preservation, Genesis immutability, interpretation/fact separation, contradiction retrieval, memory ranking, self-model uncertainty, unauthorized self-modification, model-replacement resilience.

---

## 18. Technical debt

| # | Debt | Evidence | Impact on ORIEL 3.0 |
| --- | --- | --- | --- |
| D1 | **Two migration systems** — drizzle-kit SQL in `drizzle/*.sql` + a 470-line hand-rolled idempotent DDL runner in `db.ts:142-616` | `drizzle.config.ts` vs `runMigrations()` | Must pick one path for new tables. Neither is reversible today: no `down` migrations exist anywhere. |
| D2 | **God files** — `server/db.ts` 4000 lines / 140+ exports; `server/routers.ts` 3606 lines | — | New engines must not be added to these. |
| D3 | **Flat `server/` namespace** — ~40 `oriel-*.ts` at root, tests colocated | — | ORIEL 3.0 needs a package boundary. |
| D4 | **README drift** — claims `server/ORIEL/`, "Google Gemini 2.5 Flash", "AWS S3", "JWT (jose)" | `README.md:16-21,165` | Docs cannot be trusted as a map; this audit supersedes them. |
| D5 | **Workspace `CLAUDE.md` drift** — describes Next.js + Supabase + OpenAI + `user_memories` vector table | none of these exist | Do not design against it. |
| D6 | **Dynamic `import()` everywhere** in hot paths | `routers.ts`, `oriel-context-layers.ts` | Dependency graph is invisible; refactors are risky. |
| D7 | **Fire-and-forget side effects with no tracing** — 3 nested unawaited IIFEs per chat turn | `routers.ts:1110,1128`; `oriel-umm.ts:545` | Failures are `console.error` only; no correlation id. |
| D8 | **Uncached full-directory wiki scan per request** | `oriel-wiki-retriever.ts:53-94` | O(pages) disk reads on every chat turn. |
| D9 | **N+1 access-count updates** on memory retrieval | `oriel-memory.ts:318-329` | 12–30 UPDATEs per turn. |
| D10 | **File logging to `/tmp/oriel-memory.log`** with `appendFileSync` in a request path | `oriel-memory.ts:24-33` | Blocking sync I/O; unstructured; leaks user content lengths. |
| D11 | **Root-level scratch files** — `seed-*.ts/mjs` ×6, `test-memory*.mjs` ×2, `kimi-debug-session_*.zip` (41 KB) | repo root | Noise; one contains a live credential (§19). |
| D12 | **Known-failing type-check** — `server/routers.ts` `circuitLinks` mismatch | `wiki/log.md` | `pnpm check` is not currently a clean gate. |
| D13 | **`storeMemory()` hard-codes `source: "conversation"`**, discarding the classified source | `oriel-memory.ts:226` | Provenance is destroyed at the write site, not just the schema. |

---

## 19. Security concerns

| # | Severity | Finding |
| --- | --- | --- |
| **S1** | **CRITICAL** | **Live TiDB production credential committed in plaintext** at `test-memory-direct.mjs:4` — full `mysql://user:password@host:4000/db` URI. Also flagged in `docs/ORIEL_AUDIT_V2.md` §0.1 and **still present**. The password is in git history; rotation is the only remedy. `test-memory.mjs` should be checked for the same pattern. |
| S2 | HIGH | **Unapproved model→filesystem write path.** `oriel-wiki-evolution.ts` writes arbitrary model-generated markdown to `wiki/{concepts,entities,syntheses}/<pageId>.md`, plus `index.md` and `log.md`. `proposal.pageId` comes straight from model output and is interpolated into `path.join()` with **no sanitization** (`oriel-wiki-evolution.ts:212`) — a model-emitted `pageId` containing `../` traverses out of `wiki/`. Reachable on every authenticated chat turn. |
| S3 | MEDIUM | **Unauthenticated LLM-invoking endpoints without rate limits:** `oriel.diagnosticReading`, `interpretReading`, `generateTransmission`, `evolutionaryAssistance`, `searchArchive`, `getPathway`, `generateSpeech`. Cost/abuse exposure. |
| S4 | MEDIUM | **In-memory rate limiting** (`_core/rate-limit.ts:45`) — resets on restart, does not survive multiple instances. |
| S5 | MEDIUM | **Retrieved wiki content is injected with directive force** — *"Do not contradict it"* (`oriel-wiki-retriever.ts:188`). Combined with S2 this is a prompt-injection channel: content a user steers ORIEL into writing becomes an instruction on the next turn. |
| S6 | LOW | `/tmp/oriel-memory.log` records memory-processing detail outside any retention policy (`oriel-memory.ts:24`). |
| S7 | LOW | `_core/context.ts:66-70` swallows **all** auth errors into `user = null`, making auth failures indistinguishable from anonymous access in logs. |
| S8 | LOW | Better Auth dev secret fallback `"dev-only-insecure-fallback-" + Date.now()` (`_core/auth.ts:81`) — correctly throws in production, but rotates every restart in dev, silently invalidating sessions. |
| S9 | INFO | `.gitignore` covers `.manus/`, `.claude/settings.local.json`, `.env*` — the §0.2 items from the prior audit appear addressed. `.manus/` and `.design-sync/` directories still exist on disk but are ignored. |

---

## 20. Existing abstractions that should be reused

Ranked by value to ORIEL 3.0:

| Rank | Abstraction | Location | Why it matters |
| --- | --- | --- | --- |
| 1 | **`invokeLLM()` provider shim** | `server/_core/llm.ts` | Single choke point + JSON-schema structured output ⇒ the model-independence test and every new engine call go through one place. |
| 2 | **Stable-core manifest with `owns`/`excludes`** | `shared/oriel/stable-core/manifest.ts` | Already the shape of a Constitution with declared authority scopes. |
| 3 | **Proposal → evaluate → guardrail → approve → activate → rollback** | `server/oriel-autonomy.ts` + `oriel.autonomy.*` + 3 tables | ~70% of the required Agency Ledger, already human-gated and already admin-only. |
| 4 | **`orielReflectionEvents` append-only log** | `drizzle/schema.ts:375` | Already immutable-by-convention with 7 typed events and 5 indexes; extend the enum rather than build a new log. |
| 5 | **Consent staging pattern** | `orielPendingMemoryCandidates` + `oriel-memory-consecration.ts` + `MemoryConsentTray.tsx` | Proven propose-then-confirm UX for memory; generalizes to interpretations. |
| 6 | **Generated-event staging with `promoted` status** | `generatedTransmissionEvents` | Proven "model output ≠ canon until a human promotes it" ladder. |
| 7 | **Three-layer prompt assembly** | `server/oriel-context-layers.ts` | Layer labels + boundary language already exist; add classification, don't restructure. |
| 8 | **Vossari/VRC engines** | `server/vrc-mandala.ts`, `rgp-*.ts`, `shared/codon-wheel.ts` | Deterministic, well-tested symbolic layer. Wrap, never replace. |
| 9 | **`sanitizeRuntimeProfileConfig()` allow-list validator** | `server/oriel-autonomy.ts:58` | The template for validating any model-proposed structured change. |
| 10 | **`ENV.enableOrielAutonomyRuntime` kill switch** | `server/_core/env.ts:39` | The rollout pattern for every new ORIEL 3.0 engine. |
| 11 | **`parseModelJson()`** | `server/_core/json.ts` | Tolerant model-JSON parsing. |
| 12 | **`rateLimitedProcedure(bucket)`** | `server/_core/trpc.ts:45` | Ready-made gate for new reflection endpoints. |
| 13 | **`witnessReflection` heuristics** | `server/oriel-witness-reflection.ts` | Non-LLM overclaim/falsifier detectors — the seed of a model-independent contradiction check. |

---

## Appendix A — Files read during this audit

`package.json`, `README.md`, `AGENTS.md`, `tsconfig.json`, `vitest.config.ts`, `drizzle.config.ts`, `.env.example`, `.gitignore`, `env.ts`, `shared/const.ts`,
`server/_core/{index,trpc,context,env,llm,auth,rate-limit}.ts`,
`server/{oriel-system-prompt,oriel-prompt-context,oriel-context-layers,oriel-memory,oriel-memory-consecration,oriel-umm,oriel-autonomy,oriel-autonomy-observer,oriel-witness-reflection,oriel-wiki-retriever,oriel-wiki-evolution,gemini}.ts`,
`server/db.ts` (§1-200 + export index), `server/routers.ts` (router map + `oriel.chat` + `oriel.autonomy` + `admin`),
`shared/oriel/oriel-canonical-source.ts`, `shared/oriel/stable-core/{manifest,identity,behavioral-contract,epistemic-boundaries}.ts`,
`drizzle/schema.ts` (full), `drizzle/` migration inventory,
`wiki/` inventory + `entities/entity-oriel.md` + `syntheses/synthesis-oriel-identity.md` + `log.md`,
`test-memory-direct.mjs`, `docs/ORIEL_AUDIT_V2.md` (§0-1), `docs/ORIEL_PROJECT_MAP.md`,
export/symbol indexes for `oriel-response-intelligence.ts`, `oriel-interaction-protocol.ts`, `oriel-coherence-threshold.ts`, `oriel-diagnostic-engine.ts`, `vrc-mandala.ts`, `shared/codon-wheel.ts`, `oriel-rgp-bridge.ts`.

## Appendix B — Explicitly NOT verified

- **Test suite execution** — `node_modules` is absent in this worktree; no `pnpm install` was run.
- **Type-check** — same reason.
- **Live database state** — no DB connection was attempted; no credentials used.
- **Runtime behavior** — the server was not started.
- **PDF contents** in `shared/oriel/`, `shared/new/`, `shared/tx/` — inventoried by filename only.
- **Large modules read by symbol index only** — `oriel-transmission-mode.ts` (46 KB), `oriel-diagnostic-engine.ts` (19 KB), `oriel-interaction-protocol.ts` (11 KB), `signature-letter-*.ts`, `inworld-realtime.ts`, all `rgp-*-engine.ts` internals.
