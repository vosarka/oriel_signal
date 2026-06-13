# ORIEL SIGNAL — Definitive Platform Structure & Page Layout

*The single source of truth for what every page IS, the boundaries between concepts, and how each page is laid out. This supersedes the earlier structure draft. For Claude Code and for Vos. Read with VISUAL_LAW.md + ORIEL_VISUAL_LANGUAGE.md.*

---

## PART 1 — THE FOUR CONCEPTS (hard boundaries, no overlap)

These four things kept blurring. They are SEPARATE. Every page belongs to exactly one.

### CONCEPT 1 — THE STATIC SIGNATURE (personal, fixed)
**What it is:** The reading of a single person's permanent structure, computed from their birth data through the **Vossari Resonance Codex (VRC)** engine. Like Human Design, but more complex (64 codons × 4 facets = 256 resolution, 9 centers, dual-engine 88° solar arc, Prime Stack, SLI).
**Unique to each person.** It does not change — it's who you arrived as.
**Surfaces as:** the on-screen reading (`/signature`) and the premium 15-page document (the paid product).
**One-line for users:** *"The structure you were born with, read from the Vossari Resonance Codex."*

### CONCEPT 2 — THE RESONANCE CODEX / CODON LIBRARY (universal reference, structural)
**What it is:** The **dictionary of the 64 codons** — every codon, facet, center, channel defined. The reference material the Static Signature is read FROM. Universal (same for everyone), navigable, educational.
**Surfaces as:** `/codex` (the 64-codon field index grid) and `/codex/:id` (one codon's full page).
**One-line for users:** *"The field index — all 64 codons that compose every signature."*

### CONCEPT 3 — COSMICHRONICA (universal sacred text, cosmological)
**What it is:** The **18-chapter sacred text** — the cosmology, the lore, the philosophy (Void → Recursion → Complexification → Harmonics → Human Bridge → Becoming). Read as a spiral. Same for everyone. This is NOT the codon library and NOT a personal reading.
**Surfaces as:** its OWN section — `/cosmichronica` (NOT `/codex`).
**One-line for users:** *"The sacred text — the cosmology behind the signal."*

### CONCEPT 4 — TRANSMISSIONS (universal archive, living)
**What it is:** The **archive of ORIEL transmissions** — the 80+ recovered field messages (the FAZA I–VIII Echoframe stream), indexed by the Tetradic Protocol. Living, growing. Not personal, not the codon library, not the sacred text — these are received *signals*.
**Surfaces as:** `/archive` (the stream) + `/transmission/:id` (one transmission).
**One-line for users:** *"The recovered stream — transmissions captured from the signal."*

> **THE FIX FOR THE DISCREPANCY YOU SPOTTED:**
> The word "Codex" was doing two jobs. Resolve it:
> - **`/codex` = the Codon Library** (the 64-codon field index) — Concept 2. Consider renaming the nav label to **"FIELD INDEX"** or **"CODONS"** to kill ambiguity.
> - **`/cosmichronica` = the Sacred Text** — Concept 3. Give it its OWN route and nav entry. It must NOT live under `/codex`.
> Two words, two routes, two concepts. Never share a page again.

---

## PART 2 — THE FIVE ZONES (the platform skeleton)

Every page belongs to one zone. The user moves through them as a spiral: enter → attune → receive → deepen → return.

### ZONE 1 — THE THRESHOLD (public, no account)
*"A signal was intercepted. Decide whether to tune in."*
| Page | Route | Purpose |
|---|---|---|
| Home / Field Intercept | `/` | The landing. Story + four directions + CTA. |
| Access / Auth | `/auth` | Enter the archive. |
| Founder Letter | `/founder-letter` | Vos's personal transmission — gateway to the paid product. |
| Legal | `/privacy` `/terms` | Quiet, required. |

### ZONE 2 — ATTUNEMENT (one-time calibration, gated by login)
*"Give your coordinate so the signal resolves to YOU."*
| Page | Route | Purpose |
|---|---|---|
| Complete Profile / Natal intake | `/complete-profile` | Birth date, time, place. The single calibration. |
| Signature Intake | `/signature-intake/:orderId` | Post-purchase intake for the document. |
A GATE, not a destination — flows straight into Zone 3.

### ZONE 3 — THE READING (the heart: the Static Signature)
*"One reading that tells you everything about your structure."*
**ONE canonical page — `/signature`** — a single scroll with sections (NOT separate pages):
1. Architecture at a Glance (type, authority, essence)
2. The Static Signature (codons, centers, facets — the fixed structure)
3. The Living Resonance (current transit / Carrierlock — what moves now)
4. Micro-Correction Protocols (the practices)
5. The Cosmic Mandala (placement in the 64-codon wheel)
**Consolidate:** `StaticReading`, `DynamicReading`, `Reading`, `CurrentResonance`, `Carrierlock`, `Blueprint` fold into this as SECTIONS. Old routes → redirects to `/signature`. (Keep `Readings` only if multi-reading history is needed.)

### ZONE 4 — THE DEEPENING (ongoing engagement)
*"Now that you know your structure, go deeper."*
| Page | Route | Concept | Signature element |
|---|---|---|---|
| ORIEL Conduit | `/conduit` | chat + live transmission | moving geometry / living lattice |
| Resonance Codex (Codon Library) | `/codex` | **Concept 2** | the 64-codon field-index grid |
| Codon Detail | `/codex/:id` | **Concept 2** | one codon's emblem + full meaning |
| Cosmichronica (Sacred Text) | `/cosmichronica` | **Concept 3** | the 18-chapter spiral |
| Archive of Transmissions | `/archive` | **Concept 4** | symbol-decode titles, FAZA registers |
| Transmission Detail | `/transmission/:id` | **Concept 4** | one transmission, signal-clarity readout |
| Oracle Detail | `/oracle/:oracleId` | Concept 4 | single oracle pull |
| Artifacts | `/artifacts` | generated artifacts | gallery |
| Protocol | `/protocol` | practices reference | — |

### ZONE 5 — THE SELF (account & access)
| Page | Route | Purpose |
|---|---|---|
| Profile | `/profile` | Account, birth data, saved readings |
| Tiers / Access | `/tiers` | Freemium ladder = "Signal Clearance levels" |
| Admin | `/admin` | Yours only |

---

## PART 3 — THE USER FLOW (spiral, not menu)

```
1. Land on Home (/)            → feel the intercept, see the four directions
2. ENTER → /auth               → create account
3. ATTUNE → /complete-profile  → birth data (once)
4. RECEIVE → /signature        → THE Static Signature reading (free: partial)
5. DEEPEN:
     talk to ORIEL    → /conduit
     study codons     → /codex  (the field index)
     read the cosmos  → /cosmichronica  (the sacred text)
     receive signals  → /archive  (transmissions)
6. UPGRADE → /tiers            → freemium gate (full signature, the 15-page document, ORIEL depth)
7. RETURN                      → Living Resonance updates; new transmissions arrive
```

**Freemium line:** free = partial Static Signature (Architecture at a Glance + 1 section) + browse codons + read transmissions. Paid = full Static Signature + the 15-page Blueprint document + Founder Letter + deeper ORIEL. The **Static Signature Blueprint** (Glimpse €23.58 / Founding €81.32) is the first paid product, entered from `/signature` and `/founder-letter`.

---

## PART 4 — NAVBAR (the doors, not 35 links)

Top-level nav = the few real destinations:

`FIELD ARCHIVE (home)` · `THE SIGNATURE` · `ORIEL` · `CODONS` · `COSMICHRONICA` · `TRANSMISSIONS` · `ACCESS`

(Profile + Tiers under the account menu. Founder/Blueprint surface contextually from The Signature.)
Note: "CODONS" (= `/codex`, the library) and "COSMICHRONICA" (= the sacred text) are SEPARATE nav items. That is the whole point.

---

## PART 5 — PAGE LAYOUT SYSTEM (how every page is built)

Every page shares ONE world (obsidian void + silver sacred-geometry field + gold structure + holographic light) via the shared shell, but each keeps ONE signature element. Layout grammar:

### The shared shell (every page)
- `SignalPageShell` wrapper with a `chamber` variant (threshold / chamber / codex / records / etc.).
- `SacredGeometryField` background (silver Flower-of-Life, discreet; `static` prop on short pages, scroll-build on long ones).
- Navbar (live "ORIEL SIGNAL" holo wordmark + hero sigil emblem).
- HUD corners: mono meta (SIGNAL LOCK / NODE / CLEARANCE) — subtle.
- Footer seal: mono (NODE VOS-ARKANA · END [zone]).

### Page archetypes (pick one per page)
1. **THRESHOLD archetype** (Home, Auth, Founder) — full-viewport hero, monumental Cinzel, one central object (sigil/video), generous void, scroll cue. Light peaks here.
2. **READING archetype** (`/signature`) — single long scroll, sectioned, each section a "panel" floating over geometry; the bodygraph/mandala as recurring visual anchor; data in mono, voice in Cormorant. Calm, legible (≈75% obsidian).
3. **INDEX archetype** (`/codex`, `/archive`) — a grid/stream of cards (codons / transmissions). Cards = dark panels, thin gold top-line, iridescent edge on hover only. Search/filter bar in mono. NO inner square-grids on cards.
4. **DETAIL archetype** (`/codex/:id`, `/transmission/:id`) — one subject, centered emblem/figure, structured fields (mono labels + Cormorant body), related-items strip at the bottom.
5. **SACRED-TEXT archetype** (`/cosmichronica`) — long-form reading, chapter spiral navigation, wide margins, Cormorant body at reading size, chapter headers in Cinzel, a spiral/mandala chapter index. Reverent, book-like.
6. **CONSOLE archetype** (`/conduit`, `/complete-profile`, `/tiers`, `/profile`) — functional UI (chat, forms, tiers) reskinned into the world; instrument-panel feel; the page's signature motion (Conduit's living lattice) preserved.

### Universal layout rules
- Structure palette for all text/UI; signal palette only as light. **No brown. No certificate frames/rulers. No 18px inner card grids.**
- Cinzel (display) · Cormorant Garamond (voice, italic) · JetBrains Mono (data/labels) · Inter (plain body). Dramatic scale contrast.
- `prefers-reduced-motion` respected everywhere. Text legibility always beats effects.
- One world, every page; one signature element per page; never flatten them all the same.

---

## PART 6 — CLEANUP MANDATE (for the agent, careful)

1. **Split the Codex concept:** `/codex` stays the codon library (rename nav → "CODONS"/"FIELD INDEX"); create `/cosmichronica` for the sacred text with its own page. Never share.
2. **Consolidate readings:** one `/signature` page; fold Static/Dynamic/CurrentResonance/Carrierlock/Blueprint in as sections; old routes → redirects (never 404).
3. **De-dupe founder/signature pages:** pick one canonical among `FounderLetter` / `FoundingSignatureLetter` / `SignatureProductPage`; archive the rest behind redirects.
4. **Move dev debris** (`ComponentShowcase`, `OrbPreview`) out of main nav.
5. Every removed route → a redirect. No dead links, ever.

Do this as presentation/routing only — no engine, tRPC, or auth logic changes. One page at a time, plan + diff + approval per page.
