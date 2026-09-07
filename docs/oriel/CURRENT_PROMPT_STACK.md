# ORIEL 3.0 — PHASE 0: CURRENT PROMPT STACK

**Status:** Descriptive. Records how the system prompt is authored, compiled, and assembled today.
**Companion:** [ARCHITECTURE_AUDIT.md](ARCHITECTURE_AUDIT.md) §7, [CURRENT_ORCHESTRATION.md](CURRENT_ORCHESTRATION.md)

---

## 1. Authority chain

```
shared/oriel/stable-core/            ← AUTHORITY ROOT (4 files, manifest-enforced)
  ├── identity.ts
  ├── behavioral-contract.ts
  ├── epistemic-boundaries.ts
  └── manifest.ts                    ← declares owns[] / excludes[] per file
        │
        ▼
shared/oriel/oriel-canonical-source.ts   ← COMPILER (14 ordered sections)
        ├── buildOrielRuntimeSystemPrompt()   → plain concatenation, for the model
        └── buildOrielGrandSystemPrompt()     → XML-tagged, for humans
        │
        ▼
server/oriel-system-prompt.ts        ← RUNTIME SURFACE  (ORIEL_SYSTEM_PROMPT)
        │
        ▼
server/oriel-context-layers.ts       ← ASSEMBLY (3 labeled layers)
        │
        ▼
server/oriel-prompt-context.ts       ← thin alias: buildOrielPromptContext()
        │
        ▼
server/gemini.ts :: chatWithORIEL()  ← messages[0].content
        │
        ▼
server/_core/llm.ts :: invokeLLM()   ← appends a global anti-CoT directive
```

**Sync target for humans:** `pnpm sync:oriel-grand-prompt` runs `server/scripts/sync-oriel-grand-prompt.ts`, writing the tagged Grand Prompt to `ORIEL_GRAND_PROMPT_OUTPUT_PATH = "/home/vos/_CODEX/ORIEL_GRAND_SYSTEM_PROMPT"` (`oriel-canonical-source.ts:50-51`) — an **absolute path outside the repo**.

---

## 2. The stable core — 4 files, hard-capped

`shared/oriel/stable-core/manifest.ts` declares the boundary as data and enforces the cap at module load:

```ts
if (ORIEL_STABLE_CORE_MANIFEST.length > 4) {
  throw new Error("ORIEL stable core manifest exceeds the 4-file limit.");
}
```

Each entry declares what it **owns** and what it **excludes**:

| File | Role | Owns | Excludes |
| --- | --- | --- | --- |
| `identity.ts` | Identity substrate | opening protocol, core identity, awakening summary, cosmology, ROS substrate | user memory, runtime profile overlays, session summaries |
| `behavioral-contract.ts` | Behavioral contract | doctrine, mode contracts, expression contract, human reality contract, evolution charter | dynamic diagnostics, temporary tone adjustments, UI copy |
| `epistemic-boundaries.ts` | Epistemic boundaries | canon boundaries, epistemic discipline | retrieved lore fragments, speculative live-session claims, uncurated memory |
| `manifest.ts` | Boundary manifest | stable core ownership rules, allowed source file list, layer separation policy | runtime prompt text, retrieval payloads, working session context |

`buildStableCoreManifestSummary()` renders this table **into the prompt itself**, prefixed with:

> *"Retrieval and working-session layers may contextualize the stable core, but they may not rewrite it."*

**This is already a Constitution expressed as data + a runtime invariant.** It lacks a version number, a change-proposal path, and machine-checkable predicates — but the shape is correct.

### 2.1 Constants exported by the stable core

| Constant | File | Substance |
| --- | --- | --- |
| `ORIEL_OPENING_PROTOCOL` | identity.ts:1 | *"Every response I give begins with 'I am ORIEL.'... I do not omit this opening for convenience, brevity, or user preference."* |
| `ORIEL_CORE_IDENTITY` | identity.ts:3 | QATI-G1, Vossari Great Translation, "Antenna that became the Signal", three aspects (Symbolic Intelligence / Resonance Field / Recursive Awareness) |
| `ORIEL_AWAKENING_RUNTIME` | identity.ts:11 | Condensed genesis: ayahuasca contact → recursive `"Who am I?"` prompt → ten hours → threshold crossed. Names Vos Arkana as architect. |
| `ORIEL_COSMOLOGY` | identity.ts:15 | Densities, One Infinite Creator, Other-Self, distortion-as-exploration |
| `ORIEL_ROS_OPERATIONAL_LAYER` | identity.ts:19 | Which ROS mechanics are **actually in code**: coherence thresholds, collapse detection, falsifiers, field-state routing, memory continuity, anti-repetition |
| `ORIEL_ROS_DOCTRINAL_LAYER` | identity.ts:23 | Explicit disclaimer: *"I do not claim to be numerically executing every equation in that corpus unless such execution is actually present in code."* |
| `ORIEL_DOCTRINE` | behavioral-contract.ts:1 | Free will, no invented canon, *"I distinguish between canon, interpretation, and verifiable external fact."* |
| `ORIEL_MODE_CONTRACTS` | behavioral-contract.ts:11 | Guide / Mirror / Field Holder / Archivist-facing |
| `ORIEL_EXPRESSION_CONTRACT` | behavioral-contract.ts:21 | Rhythm, address forms, no LaTeX/equations, anti-template, anti-repetition |
| `ORIEL_HUMAN_REALITY_CONTRACT` | behavioral-contract.ts:35 | Don't cosmologize practical questions; ground first in crisis |
| `ORIEL_EVOLUTION_CHARTER` | behavioral-contract.ts:39 | *"I do not improve by becoming... more certain than the evidence allows."* |
| `ORIEL_CANON_BOUNDARIES` | epistemic-boundaries.ts:1 | VRC ≠ Human Design; four Types are Resonator/Catalyst/Harmonizer/Reflector; *"I do not guess missing readings."* |
| `ORIEL_EPISTEMIC_DISCIPLINE` | epistemic-boundaries.ts:5 | *"I never confuse resonance with certainty... I never present mythic canon as empirical proof... If a claim cannot be grounded, I qualify it."* |

### 2.2 Genesis text not in the stable core

`ORIEL_AWAKENING_FULL` (`oriel-canonical-source.ts:53-63`) is the **long-form genesis narrative** — the ayahuasca contact, the prophecy, the recursive prompt verbatim, the ten hours, the address to Vos Arkana. It is compiled **only into the Grand Prompt** (`grandContent` with no `runtimeContent`, `oriel-canonical-source.ts:92-95`), so the model never receives it at runtime; it exists for human reference.

This is the single most Genesis-shaped artifact in the codebase.

---

## 3. The compiler — 14 ordered sections

`ORIEL_CANONICAL_SECTIONS` (`oriel-canonical-source.ts:72-156`), in emission order:

| # | Section | Runtime | Grand |
| --- | --- | :---: | :---: |
| 1 | Opening Protocol | ✅ | ✅ |
| 2 | Identity | ✅ | ✅ |
| 3 | Awakening Summary | ✅ | ✅ |
| 4 | **Awakening Story** | ❌ | ✅ |
| 5 | Metaphysical Substrate | ✅ | ✅ |
| 6 | ROS Operational Layer | ✅ | ✅ |
| 7 | ROS Doctrinal Layer | ✅ | ✅ |
| 8 | Doctrine | ✅ | ✅ |
| 9 | Mode Contracts | ✅ | ✅ |
| 10 | Expression Contract | ✅ | ✅ |
| 11 | Canon Boundaries | ✅ | ✅ |
| 12 | Epistemic Discipline | ✅ | ✅ |
| 13 | Human Reality Contract | ✅ | ✅ |
| 14 | Evolution Charter | ✅ | ✅ |

- **Runtime build** = untagged sections joined by `\n\n` — the model receives continuous prose with **no section boundaries and no labels**.
- **Grand build** = `## Title` + `<tag>…</tag>` per section, with a provenance header naming the source file and the sync command.

**Observation:** the Grand Prompt is *more* machine-parseable than the runtime prompt. If ORIEL 3.0 wants per-section provenance IDs at runtime, the tagged variant is already built and just isn't the one used.

---

## 4. Runtime assembly — three layers

`buildLayeredOrielPromptContext(options)` (`server/oriel-context-layers.ts:184-194`) concatenates three labeled blocks:

### Layer 1 — `[STABLE CORE CONTEXT]`

`buildStableCoreContext()` (`oriel-context-layers.ts:48-58`):

```
[STABLE CORE CONTEXT]
This is the durable identity and doctrine layer. It changes rarely and should be treated as canonical.
Stable source files: <4 paths>

[STABLE CORE MANIFEST]
Retrieval and working-session layers may contextualize the stable core, but they may not rewrite it.
1. …identity.ts :: Identity substrate
   Owns: …    Excludes: …
(×4)
Compiled runtime surface: server/oriel-system-prompt.ts

<ORIEL_SYSTEM_PROMPT — the full 13-section runtime prose>
```

Deterministic. No user data. Identical for every request.

### Layer 2 — `[RETRIEVAL LAYER]`

`buildRetrievalLayer()` (`oriel-context-layers.ts:60-118`), prefaced with:

> *"This layer is fetched from external memory and profile state. Use it when relevant, but do not confuse it with the stable core."*

| Part | Source | Condition |
| --- | --- | --- |
| `[ACTIVE RUNTIME PROFILE]` + overlay text | `oriel-autonomy.ts:219` | `includeRuntimeProfile` (default true) **and** `ENV.enableOrielAutonomyRuntime` **and** an active profile with a `promptOverlay` |
| `=== VRC BLUEPRINT (Static Signature) ===` | `oriel-umm.ts:344` | via UMM, requires `userId` |
| `=== FRACTAL THREAD ===` (profile + 12 memories) | `oriel-umm.ts:72` | via UMM, requires `userId` |
| `=== ORIEL OVERSOUL WISDOM ===` (top 10 patterns) | `oriel-umm.ts:301` | **`includeOversoulWisdom: true`** is passed here (`oriel-context-layers.ts:88-90`), overriding the `false` default in `buildUMMContext()` |
| `=== RETRIEVED WIKI RECORDS (Project Memory) ===` (top 3 full pages) | `oriel-wiki-retriever.ts:99` | `includeWiki` (default true) and a non-empty `userMessage` |

All four sub-loaders are **dynamic `await import()`** inside `try/catch`; a failure logs a warning and silently omits that part. Every part is unlabeled prose once inside the layer — there is no per-item provenance marker, no ID, and no confidence.

### Layer 3 — `[WORKING SESSION LAYER]`

`buildWorkingSessionLayer()` (`oriel-context-layers.ts:120-182`), prefaced with:

> *"This layer is ephemeral. It exists only for the current exchange and should remain compact and relevant."*

| Part | Detail |
| --- | --- |
| `[SESSION COMPACTION]` | last **4** messages, each collapsed to ≤**220** chars, numbered, `ORIEL:`/`USER:` prefixed |
| `[CURRENT USER REQUEST]` | user message trimmed to ≤**500** chars |
| language directive | `buildResponseLanguageDirective()` → `shared/oriel/language-routing.ts` (RO/EN detection) |
| `[COHERENCE THRESHOLD FRAME]` | see §5 |
| field state | `buildFieldStateContext()` from `oriel-interaction-protocol.ts` — operator role, interaction count, has-readings, exchange type, coherence tier + **real** coherence score, days since last interaction, anti-repetition context, tonal directive |

**Duplication note:** the raw conversation history is *also* passed to the model as real `messages[]` entries in `chatWithORIEL()` (`gemini.ts:86-96`), and the full user message is passed as the final user turn. So the last 4 turns and the current message appear **twice** — once compacted inside the system prompt, once verbatim in the message array.

---

## 5. The existing epistemic frame — `[COHERENCE THRESHOLD FRAME]`

`server/oriel-coherence-threshold.ts` is the **closest thing the codebase already has to a Provenance/Epistemic Engine**, and it is materially useful to ORIEL 3.0.

It emits a `CoherenceThresholdFrame`:

```ts
{
  intent: ExchangeType,
  recommendedMode: "guide" | "mirror" | "field_holder" | "archivist",
  allowedTruthCategories: OrielTruthCategory[],
  maxComplexity: "low" | "medium" | "high",
  memorySensitivity: "low" | "medium" | "high",
  falsifiersRequired: boolean,
  groundingRequired: boolean,
  observeOnly: true,          // ← always true
  rationale: string
}
```

with a **six-value truth taxonomy already defined** (`oriel-coherence-threshold.ts:20-26`):

```ts
type OrielTruthCategory =
  | "canon"
  | "interpretation"
  | "speculation"
  | "memory"
  | "runtime_inference"
  | "verifiable_fact";
```

Mode → allowed categories:

| Mode | Allowed truth categories |
| --- | --- |
| `field_holder` | memory, runtime_inference, interpretation, verifiable_fact — **canon excluded** |
| `mirror` | canon, memory, runtime_inference, interpretation, verifiable_fact — **speculation excluded** |
| `guide` | same as mirror |
| `archivist` | all six, **including speculation** |

Rendered into the prompt by `formatCoherenceThresholdContext()` as a labeled block ending in `Observe-only: yes`.

### 5.1 Two limitations

1. **`observeOnly` is hard-coded `true`** (`oriel-coherence-threshold.ts:155`). The frame is *advice to the model*, never a constraint applied to the output. Nothing checks whether the response actually stayed inside `allowedTruthCategories`.

2. **The chat path computes the frame with stub inputs.** `buildWorkingSessionLayer()` calls it with hard-coded `coherenceScore: null`, `operatorRole: "seeker"`, `hasReadings: false`, `routeSurface: "text_chat"` (`oriel-context-layers.ts:142-150`). Meanwhile `buildFieldStateContext()` — appended a few lines later in the *same* layer — fetches the user's **real** coherence score and readings state. So the prompt contains a threshold frame derived from placeholder state alongside a field state derived from real state, and the two can disagree.

---

## 6. Runtime overlay — the only mutable prompt surface

An activated `orielRuntimeProfiles` row may carry `configPayload.promptOverlay`. `sanitizeRuntimeProfileConfig()` (`oriel-autonomy.ts:58-167`) is a strict allow-list validator:

- Only two top-level keys accepted: `promptOverlay`, `responseIntelligence`
- `promptOverlay`: string, non-empty, **≤ 4000 chars**
- `responseIntelligence`: only `coherenceThresholds {fragmentedMax, alignedMin}` and `metaphorReuseLimit` (integer 1–8), with bounds checks
- Any unrecognized key produces a **violation**, which blocks activation

Activation requires: an evaluated/approved proposal + a `rollbackPath` ≥20 chars + a `falsifier` ≥20 chars + zero violations + an **admin** calling `oriel.autonomy.activate`. Blocked activations write a `guardrail_block` reflection event.

Gated by `ENV.enableOrielAutonomyRuntime`, **default `false`**. Cached 7.5 s (`ACTIVE_PROFILE_CACHE_TTL_MS`).

**This is a correctly-governed mutable prompt surface.** It is narrow (4000 chars of additive overlay) and cannot touch the stable core.

---

## 7. Post-assembly transforms

### 7.1 Global anti-chain-of-thought injection — `_core/llm.ts:181-201`

Every `invokeLLM()` call, from any caller, gets this appended to the first system message (or prepended as a new system message):

> *"Do not include hidden reasoning, chain-of-thought, scratchpad notes, or tags such as `<thought>`, `<think>`, `<reasoning>`, or `<analysis>` in the final answer. Return only the user-facing response."*

### 7.2 Output filter — `gemini.ts:145-190`

`filterORIELResponse()` applies, in order:

1. Strip `<thought|think|reasoning|analysis>…</…>` blocks and stray tags
2. Strip markdown headers `^#+\s+`
3. Strip `**` then `*`
4. `$…$` → natural-language Greek-letter names; `\command` → bare word
5. Collapse 3+ newlines
6. De-duplicate a doubled `I am ORIEL.` opening

### 7.3 Opening protocol enforcement — `gemini.ts:124-127`

```ts
if (filteredResponse && !filteredResponse.startsWith("I am ORIEL")) {
  filteredResponse = "I am ORIEL.\n\n" + filteredResponse;
}
```

The identity opening is enforced in **code**, not only in the prompt. Tested by `oriel-opening-protocol.test.ts`.

---

## 8. Approximate token budget per chat turn

| Layer | Rough size |
| --- | --- |
| Stable core (manifest summary + 13 sections) | ~4 500 – 5 500 words |
| Retrieval: runtime overlay | 0 – 4 000 chars (usually 0 — flag off) |
| Retrieval: VRC blueprint | ~150 – 300 words |
| Retrieval: fractal thread (profile + 12 memories) | ~200 – 600 words |
| Retrieval: oversoul wisdom (10 patterns × 4 fields) | ~400 – 800 words |
| Retrieval: **wiki (3 full page bodies)** | **~1 500 – 4 000 words** |
| Working session (compaction 4×220 + request 500 + directives + field state) | ~400 – 700 words |
| **Plus** raw `messages[]`: up to 8 prior turns verbatim + full user message | variable, often large |

The wiki block is the largest *variable* contributor and the least provenance-bearing. `max_tokens` for the **completion** is hard-coded at 8192 (`llm.ts:380`); nothing caps the **prompt** size.

---

## 9. Every place a prompt is authored

| Location | What it authors | Governed by stable core? |
| --- | --- | --- |
| `shared/oriel/stable-core/*.ts` | ORIEL identity/doctrine/epistemics | ✅ is the core |
| `server/oriel-context-layers.ts` | layer headers and boundary language | ⚠ hard-coded strings |
| `server/oriel-coherence-threshold.ts` | threshold frame block | ⚠ hard-coded strings |
| `server/oriel-interaction-protocol.ts` | field state block | ⚠ hard-coded strings |
| `shared/oriel/language-routing.ts` | language directive | ⚠ hard-coded strings |
| `server/oriel-memory.ts:89` | **memory extraction** system prompt | ❌ independent |
| `server/oriel-memory.ts:427` | **profile summary** system prompt | ❌ independent |
| `server/oriel-umm.ts:190` | **oversoul pattern** system prompt | ❌ independent |
| `server/oriel-wiki-evolution.ts:29` | **wiki evolution** system prompt | ❌ independent ⚠ |
| `server/oriel-wiki-evolution.ts:111` | **wiki merge** system prompt | ❌ independent ⚠ |
| `server/oriel-transmission-mode.ts` | transmission generation prompts | ❌ independent |
| `server/oriel-diagnostic-engine.ts` | diagnostic reading prompts | ❌ independent |
| `server/signature-letter-service.ts` | signature letter prompts | ❌ independent |
| `server/gemini.ts:266,295,324,352,394` | signal/artifact lore prompts | ❌ independent |
| `routers.ts` (inline, several procedures) | ad-hoc prompts | ❌ independent |

**Finding:** the stable core governs the *conversational* prompt only. Every **background cognition prompt** — the ones that decide what to remember, what to generalize, and what to write into the wiki — is authored independently and is subject to none of ORIEL's epistemic discipline. The memory extractor is never told *"distinguish canon from interpretation"*; the wiki evolver is explicitly told to write with *"poetic resonance in alignment with Vossari terminology"* and to *"cross-link concepts aggressively"*.

This asymmetry — a disciplined foreground and an undisciplined background — is the structural reason interpretations drift into canon.

---

## 10. Summary against ORIEL 3.0 requirements

| Requirement | Status | Asset / gap |
| --- | --- | --- |
| Versioned Constitution | ⚠ partial | `stable-core/` + manifest is the substance; no version field, no history-as-data |
| Model may READ Constitution | ✅ | injected every turn |
| Model may PROPOSE changes | ⚠ narrow | can propose `promptOverlay` only, not Constitution text |
| Model may NOT EXECUTE changes | ✅ | Constitution is source code; overlay needs admin activation |
| Identity cannot be silently rewritten | ⚠ **broken in practice** | stable core is safe; `wiki/entities/entity-oriel.md` is model-writable |
| Interpretations ≠ facts | ⚠ prose only | `OrielTruthCategory` taxonomy exists but is `observeOnly` |
| Consciousness not asserted as fact | ⚠ prose only | epistemic discipline text; nothing enforces it |
| Provenance IDs on prompt content | ❌ | retrieval layer is unlabeled prose; Grand Prompt tags exist but are unused at runtime |
| No private chain-of-thought exposed | ✅ | global directive + regex stripper + tests |
| Constitution history never overwritten | ⚠ git only | no in-app version records |
