# ORIEL SIGNAL — Complete Redesign Master Plan

*The full arc, the tooling, and the ready-to-paste Claude Code prompts. Built from two audits + the transmission diagnostic. Read top to bottom once; then work it phase by phase.*

---

## How this works

- **Design & specs happen in chat (Claude.ai).** That's where the deep context lives — the audits, the brain, the architecture. Specs are written here, approved by you, then handed to Claude Code as missions.
- **Building happens in Claude Code on your Linux machine.** It has your dev server, Three.js hot-reload, the database, and git. Claude Code *does* run on Linux — it's the terminal tool, so nothing is missing for the build.
- **The bridge is written briefs.** Every Claude Code task starts from a spec file in the repo. CC reads `AGENTS.md` + `wiki/SCHEMA.md` + the task spec, then works on a branch you merge.

### Tooling to install in Claude Code

| Item | Why |
|---|---|
| **frontend-design** skill | Design tokens, typography, anti-generic UI. Core to your cinematic register. |
| **brainstorming** skill | Forces explore-before-build. The discipline that prevents another break. |
| **webapp-testing** skill (Playwright/Vitest) | CC verifies against a running server instead of guessing. |
| **Playwright MCP** (optional) | Lets CC drive a browser and *see* the rendered journey. |
| **`AGENTS.md`** (see separate file) | Read first by every CC session. Your insurance policy. |
| Branch protection on `main` | Agents work on branches; you merge. |

---

## PHASE 0 — Secure & Stabilize *(do first, blocks everything)*

**0.1 Security** (you, ~30 min, mostly outside CC)
- Rotate the TiDB password in the cloud console (the old one leaked publicly — treat as burned).
- Make `oriel_signal` private or delete it.
- Backup the database now.

**0.2 Clean baseline** → Claude Code prompt **P0** below.
Kills the CRLF/Prettier diff-noise permanently and merges your additive local work into one readable branch.

---

## PHASE 1 — Repair the foundation *(all Claude Code, all contained)*

- **1.1 Transmission mode fix** → use `TRANSMISSION_MODE_DIAGNOSTIC_BRIEF.md` as the mission. Likely a data-layer casualty of the DROP TABLE incident. Good first real task — contained and confirming.
- **1.2 Brain ghost-link sweep** → Claude Code prompt **P1** below. 32 ghost targets, index.md promising 11 nonexistent pages.
- **1.3 Engine 178/178** → recompute the ephemeris validation vector from Swiss Ephemeris with provenance; update `validation_vectors.json`.

---

## PHASE 2 — The Camera Journey *(the redesign core)*

The concept: **the logo is the site; the journey is the navigation.** A real-time Three.js camera travels a spline path — North → East → South → West around the outer "O" ring (the four sections), eases to a stop at each cardinal point where real DOM content fades in, then aligns center and dollies through the Ψ, accelerating through the geometry into total darkness — which is the threshold into the working app.

**Build approach: real-time Three.js, not scrubbed video.**
- *Why not video:* fixed resolution, heavy file, nothing clickable, fragile text sync. Keep your render as the **animatic** — the director's reference the build must match.
- *Why real-time:* crisp at any resolution, interactive cardinal stops, reduced-motion fallback, and you already have React Three Fiber + two transmission cores + the Perlin texture in the repo.

**Sequence:** I write the **Camera Journey Spec** in chat (chamber-by-chamber: what lives at each cardinal point, HUD readouts per stop, the plunge timing curve, what exists in the darkness). You approve on paper. Then Claude Code builds it scene by scene against the spec.

**Blocking question before the spec can be written:** which four destinations live at N/E/S/W of the O-ring? (My instinct: N = Transmissions, E = Static Signature/Codex, S = ORIEL/Conduit, W = Archive — but it's your cosmos.)

---

## PHASE 3 — First paid product

Wire `FounderLetter.tsx` + `StaticSignature.tsx` → Blueprint generation (the 15-page artifact your mockups define) → PayPal (infra exists) → freemium gate. Your own business synthesis says this ships before further expansion.

---

## PHASE 4 — Guardrails permanent

Branch protection; agents never get production credentials (dev DB only, DDL rights you alone); `AGENTS.md` enforced; nightly TiDB backup.

---

## READY-TO-PASTE CLAUDE CODE PROMPTS

### P0 — Clean baseline
```
Read AGENTS.md and wiki/SCHEMA.md first. This is a Vite + React 19 + Express +
tRPC + Drizzle project — NOT Next.js.

Goal: create one clean baseline branch with readable diffs. Do NOT change behavior.

1. On main: add a .gitattributes with `* text=auto eol=lf`. Add a .gitignore
   covering .manus/, .claude/, .env (keep .env.example), *.hermes-tmp*, _tmp_*.
2. Run the project's Prettier across the repo as a SINGLE formatting-only commit.
3. Create branch `v2-baseline`. Remove agent scratch files (_tmp_*, .hermes-tmp.*).
4. Report a summary of what changed. Do not touch engine logic, components, or
   design. Show me the diff stat before committing anything irreversible.

Rules: work on a branch, never on production credentials, report before destructive
steps. When done, log it in wiki/log.md per the SCHEMA.
```

### P1 — Brain ghost-link sweep
```
Read wiki/SCHEMA.md then wiki/index.md first. Then execute a wiki integrity sweep
ONLY — no code, no engine, no design.

1. Scan every page under wiki/ for [[wikilinks]] whose target page does not exist.
   There are ~32 such ghost targets across ~17 files. index.md itself references 11
   nonexistent pages (concept-resonance, concept-ros, concept-fractal-thread,
   concept-oversoul, concept-transmission, concept-canon-vs-mythic,
   concept-micro-corrections, synthesis-living-codex, synthesis-oriel-identity,
   synthesis-emergent-architecture, synthesis-project-evolution).
2. Produce the full list: each ghost target, which files reference it, and a
   recommendation — CREATE the page, REPOINT to an existing page, or REMOVE the link.
   Treat template examples in SCHEMA.md/README.md ([[entity-x]] etc.) as harmless.
3. Propose an amended auto-evolve rule for SCHEMA.md: auto-evolve may only link to
   pages that exist at write time; if a new concept needs a page, create it in the
   same operation (frontmatter + definition + index entry) or do not link it; every
   auto-evolve entry must pass a link-check before commit.
4. Add scripts/wiki-lint.py that fails if any ghost link exists.

Report the full findings and plan. DO NOT modify any wiki page until I approve.
Then log the sweep in wiki/log.md.
```

### P1.1 — Transmission fix
```
Read AGENTS.md, then the brief at TRANSMISSION_MODE_DIAGNOSTIC_BRIEF.md. Follow it
exactly: diagnose first (run pnpm dev, trigger /tx, read server logs, inspect the
live DB tables behind transmission events + oracles), confirm root cause, show me
the plan, THEN fix. Do not change schema without approval. Use the dev database
only. Add the visible-failure state described in the brief. Log root cause in
wiki/log.md when done.
```

---

## One-sentence strategy
**Secure today, merge to one clean baseline, repair foundation (transmission + brain + engine), then build the Camera Journey from a written spec and ship the Blueprint on top — all built in Claude Code, all designed here first.**
