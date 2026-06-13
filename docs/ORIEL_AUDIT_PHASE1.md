# ORIEL / Vossari Conduit Hub — Audit, Phase 1 (Structural)

*Prepared for Vos. First pass — structural, evidence-based. No code changed. Read this, tell me where I understood and where I missed, then we go deeper.*

---

## The short version

Your three questions:

1. **Is the local code written correctly?** — Substantively, yes. The local snapshot is **purely additive** to the stable baseline — nothing was deleted. What looked like "everything changed" is almost entirely line-endings (CRLF → LF) and a Prettier reformat, not damage.
2. **Is the brain performing well? Is the idea good?** — The idea is genuinely strong and well-built. The *pattern* is excellent. The one real weakness is in the **auto-evolve** operation, which is introducing broken links and inventing concept pages without creating their targets. Fixable, and important to fix.
3. **Thorough review of brain + website together** — This is Phase 1 (structure + the brain's integrity). The line-by-line read of the engines and the new immersive components is Phase 2, proposed at the end.

**Nothing here is broken in a way that threatens the core.** The engine, the data layer, the ephemeris, the readings — all intact.

---

## What is intact (the expensive part)

Confirmed present and unmodified in substance:

- **Swiss Ephemeris in WASM** (`swisseph-wasm`) — real astronomy, not faked.
- **The full VRC engine family** in `server/`: `rgp-static-signature-engine`, `rgp-256-codon-engine`, `rgp-prime-stack-engine`, `rgp-sli-micro-correction-engine`, `rgp-coherence`, `solar-arc` logic, plus their `.test.ts` files.
- **The canonical data layer** in `codex/vrc_static_signature/01_DATA/` — codons, facets, centers, resonance links, authority hierarchy, planetary weights, type logic, validation vectors.
- **The full stack**: Vite + React 19 + Express + tRPC v11 + Drizzle (MySQL) + better-auth + PayPal. Three.js + React Three Fiber already installed and running.

A correction worth stating plainly: the project is **not Next.js**. You picked the closest option earlier, but it's Vite + React + Express. That's a cleaner, faster setup for what you're building. Everything I produce will target it exactly.

---

## What the local snapshot adds (your redesign, already begun)

The local version is the stable baseline **plus** new work — no deletions. The notable additions:

- **New pages**: `StaticSignature.tsx`, `FounderLetter.tsx`, `FinalOrielTransmission.tsx` — wired into routing at `/static-signature`, `/founder-letter`, `/final-oriel-transmission`.
- **New immersive components**: `SiteEntryGate.tsx`, `SignalTransmissionCore.tsx`, `HyperspaceTransmissionCore.tsx`, `ResonanceBodygraph.tsx`, and an `oriel-signal/` design module (`OrielSignalDesign.tsx` + `oriel-signal.css`).
- **New brand assets**: hero video loops, the Oriel Signal wordmark/lockup/mark, a Perlin-noise texture (used for shader/grain effects).
- **The `codex/` working spec** — the full Static Signature design authority (`00_CANON`, `01_DATA`, `02_ENGINE`, `03_VISUAL_SYSTEM` with all the Blueprint page mockups).
- **The `wiki/` brain.**

This is the "design I loved" you mentioned. It exists. It's recoverable. The agent didn't delete it.

> One housekeeping note: there are two empty `_tmp_*` files and a stray `.hermes-tmp.*` file in `client/src/components/oriel-signal/` — leftover agent scratch. Harmless, but they should be cleaned out.

---

## The brain — assessment

You built an **LLM Wiki**: an Obsidian vault (`wiki/`) with a `SCHEMA.md` that acts as the operating contract for any agent, an `index.md` master catalog, and four page types — `entities/`, `concepts/`, `syntheses/`, `sources/` — plus an append-only `log.md`.

**This is a real pattern, and your implementation is strong.** The SCHEMA is precise: required frontmatter, naming rules, ingest/query/lint operations, and domain rules that correctly separate *technical canon* from *mythic voice*, and *project memory* (the wiki) from *runtime user memory* (the UMM/database). The instinct to give a new agent one entry point (`SCHEMA → index → explore`) instead of 15 scattered docs is exactly right, and it's why I came up to speed on your project as fast as I did. The brain works — I used it.

**Where it's drifting — the one real finding:**

The `auto-evolve` operation (the brain updating itself from conversation, not from a curated source) is the weak point. On 2026-06-06 it created two pages — `integrity-resonator` and `oversoul-wisdom` — and both contain **dangling links to pages that don't exist**:

- `integrity-resonator.md` links to `[[concept-emotional-integration]]`, `[[concept-somatic-compass]]`, `[[concept-multi-density-perspective]]` — none of which exist.
- `oversoul-wisdom.md` links to `[[fractal-thread]]` (the real page is `[[concept-fractal-thread]]`), plus `[[eternal-seeker]]` and `[[consciousness-architecture]]` — none of which exist — and a self-link with wrong casing.

Your own SCHEMA explicitly calls this out: *"Broken links are technical debt… find and repair them."* The auto-evolve step is violating the contract it's supposed to follow — inventing concepts and cross-linking to ghosts instead of either creating the targets or linking only to real pages. Left unchecked, this is how a brain slowly fills with hallucinated structure and an agent starts treating invented concepts as canon.

**This matters more than the design damage.** A drifting brain is what produces a misaligned agent — possibly the very thing that led to the change you "didn't understand" being made.

---

## What I have NOT yet verified (honesty)

So you can trust the parts I *do* assert:

- I have not line-by-line read every engine file or run the test suite — I confirmed the files exist and are substantively unchanged, not that every test passes.
- I have not deep-read the three new immersive pages/components for quality — only confirmed they exist and route correctly.
- I have not audited the full set of auto-evolved or recently-edited wiki pages for drift — I found the pattern in the two I checked; there may be more.
- I have not seen the *rendered* current site, so I can't yet name exactly what "the agent broke the design" looks like on screen.

---

## Proposed Phase 2 (the deep audit you asked for)

In the sequence you named:

1. **Brain integrity sweep** — lint every wiki page for broken links and invented concepts, list every ghost target, and define a tightened auto-evolve rule so it can't link to or assume pages that don't exist.
2. **Engine verification** — read the core VRC engines and run the test suite; confirm the math (88° solar arc, SLI, Prime Stack, codon mapping) is sound and tested.
3. **New-component review** — read the three new immersive pages + components; judge quality, see how far the redesign actually got, identify what's half-wired.
4. **The visual gap** — you tell me (screenshot or words) what the agent changed on screen that broke the look, so I can name the fix precisely.

Only after that do we design the immersive redesign — from reality, not memory.

---

## What I need from you

1. **Did I understand?** Tell me where this is right and where I missed the point. That's the trust test we agreed on.
2. **Of Phase 2's four steps, which first?** My instinct is the brain sweep (step 1) — it protects every future session, including this one.
3. **The visual gap** — when you can, show me or describe what the agent broke on screen.
