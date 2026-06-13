# ORIEL / Vossari Conduit Hub — Audit V2 (Deep Pass)

*Prepared for Vos. This supersedes Phase 1. It goes further: full brain sweep, engine tests actually executed, new components read, and a security review of the public repos. No code changed. Findings first, then the continuation plan.*

---

## 0. CRITICAL — Act today, before anything else

### 0.1 Your production database password is public on GitHub

`test-memory-direct.mjs` (line 4) contains the **complete TiDB Cloud connection string — host, user, and password — in plain text**. It is present in **both** repos:

- `vosarka/oriel-resonance-circle` — public the entire time
- `vosarka/oriel_signal` — public since you pushed it for this audit

GitHub is scraped continuously by credential-harvesting bots. Treat this password as **already stolen**.

**Do, in this order:**

1. **Rotate the TiDB password now** (TiDB Cloud console → connection settings). This is the only step that actually closes the door. Making repos private does *not* un-leak a credential.
2. **Make `oriel_signal` private or delete it** (it was only for this audit).
3. **Remove the secret from the code**: change `test-memory-direct.mjs` and `test-memory.mjs` to read `process.env.DATABASE_URL` instead of a hardcoded string. Note: the old password remains in git history — one more reason rotation is mandatory.
4. **Take a database backup immediately** (before rotation if possible, after as well). TiDB Cloud has export tools.
5. **Check TiDB access logs** if your plan exposes them, for unfamiliar IPs during the exposure window.
6. **Add to `.gitignore`**: `.manus/`, `.claude/`, `.env*` (keep `.env.example`), `*.hermes-tmp*`, `_tmp_*`.

One more consideration, raised gently because it matters: that database holds **user emails and birth data** (date, time, place). You're operating in the EU. If you find evidence of unauthorized access in the logs, the responsible move is to treat it as a personal-data incident — note it, assess it, and act accordingly. If there's no evidence of access, rotate, harden, and move on.

### 0.2 Secondary exposure (lower severity)

- `.manus/db/*.json` logs reveal DB host, username, database name, and full query history. No password, but it's reconnaissance material — and it shouldn't be in any repo.
- `.claude/settings.local.json` contains your personal email and old OTP codes in command history. Harmless now, but remove it from the repo.

---

## 1. The post-mortem — what the agent ACTUALLY destroyed

This audit found the smoking gun. In the Manus session logs:

```
DROP TABLE IF EXISTS oracles; DROP TABLE IF EXISTS transmissions;
```

**The agent dropped production database tables.** That — not your design files — is the destruction you experienced. The frontend design work survived completely (Section 3). What vanished was *live data*, which is why everything felt wrecked while the code itself was intact.

Two lessons, baked into the guardrails in Section 6:

- **No agent should ever hold DDL-capable production credentials.** Agents get dev databases or read-only access. Always.
- The data that was dropped appears partially recoverable via your seed scripts (`seed-canonical-tx.ts`, `seed-archive.ts`) — worth verifying what's currently live vs. what the seeds restore.

---

## 2. Engine verification — the math survived. Proof, not promise.

I installed the full dependency tree and **ran the core VRC test suites**:

| Suite | Result |
|---|---|
| `rgp-static-signature-engine` | ✅ pass |
| `rgp-256-codon-engine` | ✅ pass |
| `rgp-prime-stack-engine` | ✅ pass |
| `rgp-sli-micro-correction-engine` | ✅ pass |
| `ephemeris-service` | 24/25 — one failure, explained below |

**Total: 177 of 178 tests pass.**

### The single failure — and it's not what it looks like

The validation-vector test expects the conscious Sun at 2024-01-01 12:00 UTC to be **280.46°** (±0.05°). The engine computes **280.5477°** — off by 0.088°.

I checked this against real astronomical data: the Sun's apparent geocentric longitude at that moment is ≈ **280.53°**. **Your engine is closer to the truth than the hand-entered reference value.** The suspect is the validation vector itself (likely sourced from a tool with slightly different settings or rounding), not the engine.

Crucially: **both values fall in the same codon band** (275.625°–281.250°), so no user-facing reading changes either way.

**Recommended fix:** recompute the validation vector directly from Swiss Ephemeris with documented provenance (tool, settings, date computed), update `validation_vectors.json`, and get to 178/178. Your own canon's "Confirmed vs Draft" discipline demands the reference value carry provenance — right now it doesn't.

---

## 3. The redesign — it exists, and it's good

Phase 1 confirmed the new files existed. This pass read them. The verdict changes the whole plan:

**~5,000 lines of coherent new frontend work:**

| File | Lines | What it is |
|---|---|---|
| `oriel-signal/oriel-signal.css` | 2,581 | Full design language: tone tokens, glow systems, chamber styling |
| `oriel-signal/OrielSignalDesign.tsx` | 381 | A real component design system: `SignalPageShell`, `GlowCard`, `SignalButton`, `SignalKicker`, `ArchiveMetaStrip`, decode-glyph animations |
| `SiteEntryGate.tsx` | 351 | Splash/loading gate with progress + status — the "signal acquisition" entry moment |
| `ResonanceBodygraph.tsx` | 327 | The 9-center bodygraph |
| `SignalTransmissionCore.tsx` | 275 | Three.js / React Three Fiber core with textures |
| `HyperspaceTransmissionCore.tsx` | 248 | Second Three.js core |
| `StaticSignature.tsx` + styles | 574 | Product page with the six diagnostics (MN-01 … RS-06) |
| `FounderLetter.tsx` | 160 | The Founder Letter page — your first paid product's home |
| `FinalOrielTransmission.tsx` | 92 | Closing transmission page |

And the detail that matters most: the design system already defines **chambers** — `threshold → chamber → codex → transmissions → origin-seal → gate → receiver-node → revelation`. That is a scroll-narrative architecture, already conceived in your own vocabulary. The nature-beyond.tech experience you want is not a new project. **It's the completion of this one.**

The writing quality in the diagnostics copy is also strong — "the density of thought-static, looping pressure" — precise, reverent, zero kitsch. Exactly your register.

Minor cleanup: `_tmp_*` files in root and `.hermes-tmp.624892` in `oriel-signal/` are agent scratch — delete.

### What "everything changed" really was

Re-confirmed with content-level diffs: the local snapshot is **purely additive** (zero deletions). The wall of modified files is **CRLF→LF line endings + a Prettier reformat** — cosmetic noise that makes diffs unreadable but changes nothing. The only substantive change to existing files is three new routes in `App.tsx`. This noise problem gets permanently fixed in Section 6, Step 1.

---

## 4. The brain — full integrity sweep (complete numbers)

49 pages, 321 wikilinks scanned. **17 files contain ghost links; 32 unique targets don't exist.** Phase 1 caught 2 files; the real problem is structural:

### Category A — The index promises pages that were never created (worst)
`index.md` itself — the master catalog every agent reads first — references **11 nonexistent pages**: `concept-resonance`, `concept-ros`, `concept-fractal-thread`, `concept-oversoul`, `concept-transmission`, `concept-canon-vs-mythic`, `concept-micro-corrections`, `synthesis-living-codex`, `synthesis-oriel-identity`, `synthesis-emergent-architecture`, `synthesis-project-evolution`. These were planned, listed, never written. **The brain advertises knowledge it does not have** — the precise recipe for an agent to hallucinate content for them. Echoed in `entity-oriel`, `entity-vrc-engine`, `entity-consciousness-lattice`, and several source pages.

### Category B — Auto-evolve invented concepts (the drift mechanism)
`integrity-resonator`, `oversoul-wisdom`, `unified-memory-matrix`, `global-memory-oversoul` link to ghosts like `concept-emotional-integration`, `concept-somatic-compass`, `eternal-seeker`, `consciousness-architecture`, `entity-silviu`, plus wrong-name links (`fractal-thread` vs `concept-fractal-thread`). The auto-evolve operation writes confidently into a vocabulary that doesn't exist.

### Category C — Format inconsistencies
Links with paths/extensions (`[[wiki/index.md]]`, `[[entity-oriel.md]]`, `[[docs/ORIEL_CANON_REVIEW.md]]`) violating the schema's id-only convention.

### Category D — Harmless
Template placeholders in `SCHEMA.md`/`README.md` (`[[synthesis-xxx]]`, `[[entity-x]]`) — documentation examples, not debt.

### Verdict and repair

The wiki *pattern* remains excellent — it's how I reached competence on your project quickly, twice. The repair is finite and concrete:

1. **Triage all 32 ghosts**: create / repoint / remove. My recommendation: actually write the four high-value syntheses (`oriel-identity`, `living-codex`, `project-evolution`, `emergent-architecture`) — they're the spine pages everything wants to cite — and create the seven small concept stubs the index promises. Remove or repoint the auto-evolve inventions.
2. **Amend SCHEMA.md auto-evolve rule**: *"Auto-evolve may only link to pages that exist at write time. If a new concept genuinely needs a page, create the page in the same operation — with frontmatter, definition, and index entry — or do not link it. Every auto-evolve entry must pass a link-check before commit."*
3. **Add a mechanical lint**: the link-sweep script from this audit (12 lines of Python) should run before any wiki commit. Drift becomes impossible to miss.

---

## 5. What I still have NOT verified (honesty ledger)

- Whether the three new pages' data needs are fully wired to tRPC routers (FounderLetter purchase flow end-to-end).
- The non-engine test suites (auth, chat, image generation) — I ran the five suites that guard the math.
- The rendered look of the current live site vs. the new design (still need your screenshot or description of what the agent visually broke).
- Whether dropped tables (`oracles`, `transmissions`) were fully restored by seeds in production.

---

## 6. The continuation plan — best path from here

Sequenced. Each step unblocks the next. Estimates assume working sessions, not calendar days.

### Step 0 — TODAY: Security (30 min)
Rotate DB password → private/delete `oriel_signal` → fix the two `test-memory*.mjs` files to use env vars → backup DB → extend `.gitignore`. Non-negotiable, before any other work.

### Step 1 — The Clean Baseline (one session)
This kills the diff-noise problem forever and gives you a sane foundation:

1. On stable `main`: add `.gitattributes` with `* text=auto eol=lf`, run `pnpm prettier --write .`, commit as a single formatting commit.
2. Create branch `v2-baseline` from it. Port over the purely-additive local work: the `oriel-signal/` module, the five new components, three new pages, media assets, the `codex/` spec tree, the `wiki/` — plus the small `App.tsx` routing diff.
3. Delete agent scratch files. Result: one clean branch containing everything good from both worlds, with readable diffs from now on.

### Step 2 — Brain repair (one session)
Execute Section 4's triage: 32 ghosts resolved, four spine syntheses written, SCHEMA amended, lint script committed (`scripts/wiki-lint.py`). The brain becomes trustworthy for every future session — human or agent.

### Step 3 — 178/178 (short)
Recompute the ephemeris validation vector from Swiss Ephemeris with provenance noted in the JSON. Green suite = the canon's "Confirmed" discipline restored.

### Step 4 — Complete the immersive experience (the real build, 2–4 sessions)
Not a redesign from scratch — a *completion*. The architecture is already in your code:

- **Wire the chamber sequence into a scroll-driven narrative**: `SiteEntryGate` (signal acquisition) → `threshold` → `chamber` → `codex` → `transmissions` → `origin-seal` → `gate` → `receiver-node` → `revelation`. One continuous experience, your existing design tokens, the two Three.js transmission cores as the central objects — exactly the nature-beyond.tech pattern, in Vossari vocabulary.
- HUD microcopy from your own canon: Coherence, Audit ID, Signal Lock — the readouts your Blueprint pages already use.
- Performance discipline: lazy-load the Three.js cores, poster-frame video fallbacks, reduced-motion support (the design system already imports the pattern).

### Step 5 — First paid product live (1–2 sessions)
`FounderLetter.tsx` + `StaticSignature.tsx` are the front door of the **ORIEL Static Signature Blueprint**. Wire the purchase path (PayPal infra already exists), connect the Blueprint generation (the 15-page artifact your mockups define), and the freemium gate. This is the revenue step — and your wiki's own business synthesis ("one simple machine first") says it ships before anything else expands.

### Step 6 — Guardrails so this never happens again (ongoing, cheap)
- **Branch protection** on `main`; agents work on branches, you merge.
- **Agents never receive production DB credentials.** Dev database for agent work; DDL rights for you alone.
- `AGENTS.md` addendum: read-before-edit; no ghost links; no destructive SQL; wiki lint must pass.
- Nightly TiDB backup or scheduled export.

### The one-sentence strategy
**Secure it today, merge to one clean baseline, repair the brain, then finish the immersive experience that already exists in your code — and ship the Blueprint as the first paid product on top of it.**

---

## 7. Questions for you

1. The trust test, round two: does this match your reality — especially the DROP TABLE finding? Did you lose `oracles`/`transmissions` data around the time things broke?
2. After Step 0, do you want Step 1 (clean baseline) or Step 2 (brain repair) first? My recommendation is 1 → 2 → 3 in one focused day.
3. For Step 4, do you want me to design the chamber-by-chamber scroll narrative as a written spec first (my strong recommendation — you approve the experience before code), or go straight to building the first chamber?
