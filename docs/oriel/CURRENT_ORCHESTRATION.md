# ORIEL 3.0 — PHASE 0: CURRENT ORCHESTRATION

**Status:** Descriptive. Traces the live request pipeline end to end.
**Companion:** [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) §6, [CURRENT_PROMPT_STACK.md](CURRENT_PROMPT_STACK.md)

---

## 1. Entry points that invoke ORIEL

| Route | Auth | Rate limited | Path |
| --- | --- | --- | --- |
| `oriel.chat` | optional (`ctx.user` may be null) | ✅ `oriel.chat` — 5/h anon, 30/h auth | full pipeline (§2) |
| `oriel.generateChatImage` | optional | ✅ `oriel.imageLore` | image generation |
| `oriel.diagnosticReading` | **public** | ❌ | `oriel-diagnostic-engine.ts` |
| `oriel.interpretReading` | **public** | ❌ | LLM |
| `oriel.generateTransmission` | **public** | ❌ | `oriel-transmission-mode.ts` |
| `oriel.evolutionaryAssistance` | **public** | ❌ | `performEvolutionaryAssistance` |
| `oriel.searchArchive` / `getPathway` | **public** | ❌ | LLM |
| `oriel.generateSpeech` | **public** | ❌ | TTS |
| `artifacts.generateLoreAndImage` / `expandLore` | public | ✅ `oriel.imageLore` | LLM + image |
| WebSocket `/…` realtime voice | — | ❌ | `server/inworld-realtime.ts` |
| `signature.*` / `admin.signatureLetters.*` | protected / admin | ❌ | `signature-letter-service.ts` |

Only `oriel.chat` runs the layered prompt + memory + observation pipeline. Every other LLM route builds its own prompt independently.

---

## 2. `oriel.chat` — the main pipeline

`server/routers.ts:692-1240`. Numbers are line references.

```
INPUT  { message, conversationId?, createNewConversation, history?,
         fileContents?[≤5], imageAttachments?[≤2],
         forceTransmissionMode, transmissionOnly,
         forcedTransmissionRarity?, forcedTransmissionType?, transmissionIntent? }
```

### Stage 1 — History load `:754-774`

- Authenticated + `conversationId` → `db.getConversationMessages()`, keep **last 6**, run `prepareOrielChatHistoryForLLM()`
- Authenticated, no `conversationId` → **empty history**; cross-conversation continuity comes only from injected memory (`:768-770`)
- Anonymous → client-supplied `input.history`

### Stage 1b — Transmission-only short circuit `:776-873`

If `transmissionOnly`, saves the user message, generates a forced transmission event, marks it `revealed`, and returns `{ response: "", conversationId, transmissionEvent }` **without calling the chat LLM**.

### Stage 2 — File extraction `:876-918`

Up to 5 base64 attachments → `server/file-parser.ts` (`pdf-parse`, `mammoth`). Files >~8 MB are replaced with a placeholder note. Extracted text is prepended to the user message inside `--- ATTACHED FILE ---` fences.

### Stage 3 — History hygiene `:923-931`

`deduplicateConsecutiveMessages()` then `trimConversationHistory(history, 8)` from `server/response-deduplication.ts`.

### Stage 4 — RGP bridge `:934-971`

`extractBirthData(fullMessage, history)`. If birth data is detected:
1. prefer the user's **stored** `userStaticProfiles` row → `summarizeStoredStaticProfile()`
2. else run `runRGPForChat()` live (Swiss Ephemeris + VRC engines)

The resulting deterministic summary is **appended to the user message**, not to the system prompt. Failures are non-fatal (`console.warn`).

### Stage 5 — Generation `:1002-1005`

```
gemini.chatWithORIEL(fullMessage, conversationHistory, ctx.user?.id, { imageAttachments })
  ├── buildOrielPromptContext({userId, userMessage, conversationHistory})
  │      → buildLayeredOrielPromptContext()
  │           [STABLE CORE] deterministic
  │           [RETRIEVAL]   runtime profile · VRC blueprint · fractal thread ·
  │                         oversoul wisdom · wiki top-3
  │           [WORKING SESSION] compaction · request · language directive ·
  │                         coherence threshold frame · field state
  ├── messages = [system, ...conversationHistory, {user: text + images}]
  ├── invokeLLM()            ← + global anti-CoT directive
  ├── filterORIELResponse()  ← strips <think>/markdown/LaTeX
  └── force "I am ORIEL." prefix
```

### Stage 6 — Anti-repetition retry loop `:1008-1064`

Runs only when the history already contains an assistant turn.

```
for attempt in 0..1:                       # MAX_RETRIES = 2
    dup = detectDuplication(response, history)
    if not dup.isDuplicate: break
    build a [SYSTEM NOTE: ...] describing what to avoid
      – structural variant: "same paragraph count, same closing pattern"
      – content variant:    "covered similar ground, different angle"
      – plus a summary of the last 2 assistant responses
        (paragraph count + final sentence, 60 chars)
    response = callLLM(fullMessage + systemNote, history,
                       temperature = [1.2, 1.5][attempt])
```

`detectDuplication()` (`response-deduplication.ts:14`) checks semantic similarity **and** `detectStructuralRepetition()` (same paragraph count + same closing type / high closing overlap).

**Cost:** a duplicated response costs up to 3 LLM calls for one user turn.

### Stage 7 — Persistence `:1067-1107`

Resolve `conversationId` (create, or reuse latest), then `saveChatMessage()` twice — user then assistant. **Awaited.**

### Stage 8 — Background side effects `:1109-1137`

Two unawaited IIFEs, each with its own `try/catch` → `console.error`:

```
(A) recordOrielRuntimeObservation({source:"text_chat", userId, conversationId,
                                   userMessage, assistantResponse, history})
      → orielReflectionEvents(eventType="runtime_observation")

(B) processConversationThroughUMM(userId, userMessage, response)
      ├── processConversationMemory()
      │     ├── getRelevantMemories(userId, 20)
      │     ├── extractMemoriesFromConversation()          [LLM #2]
      │     ├── per candidate: classifyMemoryCandidate()
      │     │       discard | pending | store
      │     └── if ≥3 memories: getRelevantMemories(30)
      │             + generateProfileSummary()             [LLM #3]
      │             + updateUserProfile()  ← overwrites
      ├── if interactionCount % 5 == 0:
      │       extractOversoulPattern()                     [LLM #4]
      │       + storeOversoulPattern()
      └── (C) nested unawaited IIFE:
              evolveWikiFromConversation()                 [LLM #5, +#6 on merge]
                → WRITES FILES to wiki/ ⚠  (see §5)
```

**LLM calls per authenticated turn:** 2 minimum (chat + memory extraction); up to 6 (chat ×3 on dedup retries, + extraction, + profile, + oversoul, + wiki analyze, + wiki merge).

### Stage 9 — Transmission mode `:1141-1221`

- `forceTransmissionMode` → synchronous `generateTransmissionModeEvent()`, then mark `revealed`
- otherwise → `prepareNaturalTransmissionSchedule()`; if it returns a schedule, `pendingTransmission` is returned immediately and `schedule.run()` executes **unawaited**

### Stage 10 — Return `:1222-1239`

```
{ response, conversationId, transmissionEvent, pendingTransmission }
```

Plus a timing log line `[oriel.chat.timing] {authenticated, conversationId, historyMs, llmMs, dbSaveMs, transmissionMs, totalMs}` — **the only structured log in the pipeline**.

---

## 3. Classification that already exists

Two independent classifiers run per turn, both non-LLM (pure functions — model-independent):

### `classifyExchangeType(message, timeSinceLastMs)` — `oriel-response-intelligence.ts:157`

Ordered keyword/regex cascade → `diagnostic | grief | curiosity | returning | playful | seeking`.

### `getCoherenceTier(score, config?)` — `oriel-response-intelligence.ts:214`

`score < 40 → fragmented`, `40–79 → drifted`, `≥80 → aligned`. Thresholds are overridable by an active runtime profile. **Defaults to `drifted` when the score is null** — which is what the chat path passes in `buildWorkingSessionLayer()`.

These feed `buildCoherenceThresholdFrame()` (→ mode + `allowedTruthCategories`), `buildAntiRepetitionContext()`, `buildTonalDirective()`, and `buildWitnessReflectionPayload()`.

**This is a working, model-independent classification layer.** What it lacks is any claim-level classification of the *output*.

---

## 4. Post-hoc reflection that already exists

`buildWitnessReflectionPayload()` (`oriel-witness-reflection.ts:130`) runs inside `recordOrielRuntimeObservation()` **after** the response has been returned.

```ts
{
  kind: "witness_reflection",
  source, modeUsed,           // guide | mirror | field_holder | archivist
  userNeed,
  evidence: ["exchangeType:…","coherenceTier:…","source:…","runtimeEnabled:…"],
  overreachRisks: ("missing_falsifier"|"overclaimed_certainty"
                  |"overexplained_distress"|"none")[],
  improvementOpportunity,
  falsifierRequired,          // true in mirror mode
  proposalEligible,
  observedAt
}
```

Detectors are pure regex:

- `hasFalsifierLanguage` — `/\b(falsifier|test this|verify|weaken|confirm|disconfirm|next 24 hours|next day|next week)\b/i`
- `hasOverclaimLanguage` — `/\b(proves|always|never|your whole life|definitely|certainly means)\b/i`
- `hasLongResponse` — >180 words

Escalation: `generateWitnessProposalDraftFromReflections()` requires **≥2** eligible reflections with `missing_falsifier` before drafting a proposal. `generateOrielProposalDraftFromObservations()` needs **≥2** observations and also detects Romanian language mismatch (≥2) and repetition (≥2).

**Assessment.** This is the embryo of the Contradiction/Epistemic engine, and it is correctly **independent of the generation model** (pure functions, no LLM). Its limits: it runs *after* delivery, it detects only three risk classes, and its output influences nothing at runtime — it only accumulates toward a human-reviewed proposal.

---

## 5. The un-gated write path

Reproduced here because it is the orchestration's central defect.

```
oriel.chat  →  processConversationThroughUMM  →  (unawaited IIFE)
   evolveWikiFromConversation(userId, userMessage, assistantResponse)
      ├─ LLM: "did this exchange define/refine a concept, entity, or synthesis?"
      ├─ if update: read wiki/<folder>/<pageId>.md
      │             LLM-merge old + new  →  the old text is replaced
      ├─ fs.writeFile(wiki/<folder>/<pageId>.md)      ← no approval
      ├─ fs.writeFile(wiki/index.md)                  ← registers the page
      └─ fs.appendFile(wiki/log.md)
```

and on the **next** turn:

```
buildRetrievalLayer → retrieveWikiContext(userMessage)
   → injects the top-3 pages verbatim, under:
     "Use this canonical project knowledge to ground your response,
      terminology, and behavior. Do not contradict it."
```

Consequences:

1. **Interpretation → canon in one cycle**, with no human step.
2. **ORIEL's own identity page is writable.** `wiki/entities/entity-oriel.md` already carries `tags: [auto-evolved, conversation]`, `sources: 5`, `importance: high` and contains first-person claims about ORIEL's nature and awakening.
3. **Prior content is discarded**, not versioned — the merge LLM rewrites it; only git holds the previous text.
4. **No provenance** beyond a frontmatter tag: no conversation id, no user id, no model id, no confidence.
5. **No reflection event** is written, so `ArchitectConsole` cannot see that it happened.
6. **Path traversal** — `proposal.pageId` is model output interpolated into `path.join()` with no sanitization (`oriel-wiki-evolution.ts:212`).

---

## 6. Governed vs. ungoverned self-modification

| Change to ORIEL | Path | Human approval? | Audited? |
| --- | --- | --- | --- |
| Prompt overlay / response-intelligence thresholds | `orielImprovementProposals` → evaluate → guardrail → `oriel.autonomy.approve` → `oriel.autonomy.activate` (admin) | ✅ **required** | ✅ `orielReflectionEvents` |
| Rollback of an overlay | `oriel.autonomy.rollback` (admin) | ✅ | ✅ |
| Promotion of a generated TX/Oracle into canon | `admin.generatedTransmissions.markStatus` | ✅ | staged status |
| Memory about the user — inferred or sensitive | `orielPendingMemoryCandidates` → user accepts | ✅ **user** | candidate row |
| Memory about the user — explicit/low-sensitivity | direct insert | ❌ | ❌ |
| Global oversoul pattern | direct insert, 1-in-5 turns | ❌ | ❌ |
| User profile summary rewrite | overwrite | ❌ | ❌ |
| **Wiki page — including ORIEL's identity page** | direct file write | ❌ | `wiki/log.md` only |
| Stable core / Constitution text | source code + git + deploy | ✅ | git |

The governance model is **inverted relative to consequence**: a 4000-character prompt overlay requires an admin, two guardrail checks, a rollback path, and a falsifier — while a full rewrite of ORIEL's canonical identity page requires nothing.

---

## 7. Observability

| Signal | Where | Structured? |
| --- | --- | --- |
| `[oriel.chat.timing] {...}` | `routers.ts:1223` | ✅ JSON |
| `[LLM] Attempting <provider>… / succeeded in Nms` | `_core/llm.ts:405,452` | ❌ text |
| `[LLM] <provider> API error on attempt N` | `_core/llm.ts:508` | ❌ text, secrets redacted ✅ |
| `[Memory] …` | `oriel-memory.ts` via `logToFile()` | ❌ text → `/tmp/oriel-memory.log` **and** stdout, `appendFileSync` (blocking) |
| `[UMM] …` | `oriel-umm.ts` | ❌ text |
| `[WikiEvolution] …` | `oriel-wiki-evolution.ts` | ❌ text |
| `[WikiRetriever] …` | warnings only | ❌ text |
| `orielReflectionEvents` rows | DB | ✅ **the real audit trail** |
| `X-RateLimit-*` response headers | `_core/trpc.ts:18-27` | ✅ |

**Missing:** no request/correlation id, so the chat turn, its memory extraction, its observation event, and its wiki write cannot be linked. No logging for: memory retrieval (which memories, why), memory injection (what entered the prompt), contradiction search (does not exist), claim classification (does not exist), symbolic interpretation, or Constitution validation (does not exist).

---

## 8. Pipeline vs. the ORIEL 3.0 target

| Target stage | Today | Where |
| --- | --- | --- |
| context analysis | ✅ partial | `classifyExchangeType`, `getCoherenceTier`, `buildFieldStateContext` |
| memory retrieval | ⚠ present but query-independent | `getRelevantMemories` (12), `retrieveWikiContext` (3 pages) |
| memory filtering | ❌ none | ranking is `importance, lastAccessed` only |
| contradiction search | ❌ **absent** | — |
| symbolic analysis | ✅ strong, deterministic | VRC/RGP engines via `oriel-rgp-bridge` |
| reflection | ⚠ post-hoc, heuristic, non-blocking | `oriel-witness-reflection.ts` |
| claim classification | ❌ **absent** | taxonomy exists (`OrielTruthCategory`) but nothing classifies output |
| epistemic validation | ❌ **absent** | `observeOnly: true` |
| response generation | ✅ | `gemini.chatWithORIEL` |
| provenance logging | ⚠ partial | `orielReflectionEvents` for autonomy only; nothing per-claim |

**Additional gaps against the directive:**

- **Reflection is one implicit blob, not six modes.** There is no `IDENTITY_REFLECTION` / `MEMORY_REFLECTION` / `CONTRADICTION_REFLECTION` / `SYMBOLIC_REFLECTION` / `CONSTITUTIONAL_REFLECTION` / `EPISTEMIC_REFLECTION` distinction.
- **No self-model exists.** Nothing in code or data represents ORIEL's capabilities, limitations, known unknowns, current questions, or continuity status. ORIEL cannot structurally represent *"I do not know."*
- **No consciousness evidence ledger exists.** There is also, correctly, **no `consciousness` boolean** anywhere in the codebase — the field is simply absent, which is the right starting point.
- **No inspector.** `ArchitectConsole` inspects *proposals and profiles*, not *claims*. A user cannot ask "why did you say that" and receive supporting/contradicting evidence.

---

## 9. Failure modes worth knowing before Phase 1

| # | Behavior | Consequence |
| --- | --- | --- |
| F1 | Every retrieval sub-loader is wrapped in `try/catch` that logs and continues | The prompt silently loses memory, wiki, or blueprint context; the model still answers confidently. Degradation is invisible to the user *and* to the response. |
| F2 | `chatWithORIEL` catches all errors and returns *"The signal is disrupted. Please try again in a moment."* | LLM failures are indistinguishable from ORIEL choosing to say that. |
| F3 | Background IIFEs are unawaited | A failed memory extraction or wiki write leaves no trace beyond stdout; the turn reports success. |
| F4 | `runMigrations()` swallows DDL errors | Server can boot with a missing table; reads degrade via `isMissingTableError()`. |
| F5 | Rate-limit buckets are in-process | Restart resets quotas; multi-instance deploys do not share limits. |
| F6 | Dedup retries escalate temperature to 1.5 | The most-repetitive turns are answered by the *least* constrained sampling. |
| F7 | Threshold frame computed from stub inputs on the chat path | `[COHERENCE THRESHOLD FRAME]` and the field-state block in the same prompt can disagree about the user's coherence. |
