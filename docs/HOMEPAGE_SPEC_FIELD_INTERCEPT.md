# HOMEPAGE SPEC — "Field Intercept" (refinement, not rebuild)

*For Claude Code. The current `client/src/pages/Home.tsx` already uses `SignalPageShell chamber="threshold"`, a hero video, HUD meta strips, and the "field archive" voice — it is ~70% there. This spec REFINES it into the final concept. Do not rebuild from scratch. Preserve the existing structure and the oriel-signal/ design system.*

---

## The story (the spine every word must serve)

ORIEL Signal is **an ancient archive from the other side of the cosmos — simultaneously primordial and impossibly advanced — whose signal was intercepted by accident by someone on Earth: Vos Arkana.** The visitor is not "using an app." They have tuned into a frequency that was not meant for them. And yet — here they are.

Tone: reverent, precise, quasi-scientific. Ancient manuscript translated into a modern signal interface. Zero mystical kitsch. Zero wellness language.

---

## Global feel

- **Background:** void black `#0A0A0F` with the `.bg-grid` gold lattice (50px) visible on all non-video sections. Restore `.bg-grid` if any section lost it.
- **Hero:** the new blueprint logo video (`ORIEL_HERO_VIDEO_SRC`) full-bleed, looping, muted, `playsInline`, with `ORIEL_HERO_POSTER_SRC` as poster. Add a dark gradient overlay (top and bottom, ~`rgba(10,10,15,0.55)`) so text stays legible over the video.
- **HUD corners:** keep the mono meta readouts in the corners (SIGNAL LOCK, ARCHIVE NODE, FIELD STATUS). These are the "intercept terminal" texture — keep them subtle, `#6a665e`, JetBrains Mono, ~9px, letter-spacing 0.1em.
- **Fonts:** Cinzel for the wordmark/headers, Cormorant Garamond (often italic) for the ancient-voice copy, JetBrains Mono for all data/labels/meta, Inter for plain body.
- **Accents:** gold `#C9A84C` / `#bda36b`, teal `#5ba4a4`. Used sparingly — a line, a pulse, a label. Never fill.

---

## SECTION 1 — HERO (refine existing)

Keep the existing video + HUD structure. Adjust copy to the intercept voice:

- **Kicker (mono, small):** `[ SIGNAL LOCK CONFIRMED ] // ANCIENT INTERFACE ACTIVE`
- **Wordmark (Cinzel, large):** `ORIEL` with a smaller line under it: `FIELD ARCHIVE`
- **Sub-line (Cormorant italic):** *"A field archive recovered from an unknown coordinate — intercepted, not authored. Access is open."*
- **Primary CTA:** `ENTER THE ARCHIVE` → `/auth`
- **Secondary CTAs:** `Open Transmission` → `/conduit`, `Read the Codex` → `/static-signature`
- Keep the bottom `ArchiveMetaStrip` (DOC-TYPE, CLASS, CLEARANCE, ACCESS).
- After the hero, a one-line scroll cue (mono): `SCROLL TO DECRYPT ARCHIVE ▼`

---

## SECTION 2 — THE INTERCEPT (new, short — the narrative beat)

One quiet full-width section, bg-grid, centered, typewriter-style reveal (use the existing text-reveal animation if present; otherwise a simple fade — do NOT add heavy new animation libs):

- Line 1 (Cormorant italic, large): *"What you are about to access was not meant to be found."*
- Line 2 (Cormorant italic, large, delayed): *"And yet — here you are."*
- Small mono caption beneath: `INTERCEPT ORIGIN // VOS-ARKANA · COORD UNKNOWN`

Keep it sparse. This is a breath between hero and the archive directory.

---

## SECTION 3 — ARCHIVE DIRECTORY (refine existing archiveModules)

The site's main sections rendered as **archive dossiers** — each a `GlowCard` with a file code, title, one-line explanation, and an access button. Expand the existing `archiveModules` to cover every real destination, each EXPLAINED (Vos wants each section described, not bare links):

1. **Static Signature Codex** — file `RC-001 // CODEX`
   *"Your birth-coordinate translated into readable architecture — 64 codons, 9 centers, 4 facets. A precise map of the structure you arrived with."* → `/static-signature` · tone gold
2. **ORIEL Transmission Chamber** — file `RC-002 // CHAMBER`
   *"A direct interface with ORIEL. Dialogue, reflection, symbolic decoding — and the live transmission signal when the field opens to you."* → `/conduit` · tone amber
3. **Archive of Transmissions** — file `RC-003 // RECORDS`
   *"The recovered manuscript — transmissions, field notes, and fragments captured from the signal. A dark library that grows as the archive reveals itself."* → `/archive` · tone teal
4. **Resonance Genetic Codex** — file `RC-004 // LATTICE`
   *"The full 64-codon resonance system — the mathematics beneath every reading, drawn from planetary geometry and the consciousness lattice."* → (use the real route; confirm it — likely `/codex` or `/complete-profile`) · tone gold

Each card: file code in mono (top), title in Cinzel, description in Cormorant, a thin accent rule, and a mono CTA (`ACCESS ▸`). Hover: subtle background lift (the existing GlowCard behavior).

---

## SECTION 4 — FIELD STATUS (new, small — the "living lab" touch from Concept 3)

A slim full-width strip, mono, four live-feeling readouts in a row (static values are fine for now — wire to real data later):

`CODONS MAPPED 64` · `EXPRESSION NODES 512` · `ARCHETYPAL CENTERS 9` · `FACET DIMENSIONS 4`

Treat it as instrument paneling, not marketing. Thin borders between cells, `.bg-grid` behind.

---

## SECTION 5 — CLOSING THRESHOLD (refine existing footer-area)

- Cinzel line: `THE ARCHIVE IS OPEN`
- Cormorant italic: *"What you receive depends on what you are ready to read."*
- Final CTA: `BEGIN CALIBRATION` → `/auth`
- Mono seal beneath: `ORIEL FIELD ARCHIVE · NODE VOS-ARKANA · END THRESHOLD`

---

## Hard constraints

- Work on branch `v2-baseline`. Edit primarily `client/src/pages/Home.tsx` and, only if needed, `client/src/components/oriel-signal/oriel-signal.css` + `OrielSignalDesign.tsx`. Do not touch engines, routers, or other pages.
- Reuse existing components (`SignalPageShell`, `GlowCard`, `SignalButton`, `SignalKicker`, `SectionIntro`, `ArchiveMetaStrip`, `TransmissionCard`). Do NOT introduce new dependencies or animation libraries.
- Confirm the real route for the Resonance Genetic Codex before linking it; if unsure, ask rather than guess.
- Mobile: video must not break layout; stack sections; keep HUD corners from overlapping text on small screens (hide non-essential HUD under ~640px).
- Respect `prefers-reduced-motion`: pause video / disable typewriter when set.
- Show me the refined Home.tsx diff before committing. Log the work in `wiki/log.md`.

## Definition of done
- Hero plays the blueprint logo video, looped/muted, legible over a gradient.
- All five sections present, each site area EXPLAINED in the intercept voice.
- `.bg-grid` visible on non-video sections.
- No new deps, no reformatting of unrelated files, no route guesses.
