# ORIEL SIGNAL — Platform Structure & Flow (Information Architecture)

*The logic of the platform: what every page IS, how they connect, what to keep / merge / archive. Built from the real route map (35 pages) + the recovered Cosmichronica logic. This is the skeleton; the visual world (obsidian + sacred geometry + holographic light) dresses it.*

---

## The core problem (named)

You have **35 pages** and **four different "reading" pages** (`StaticReading`, `DynamicReading`, `Reading`, `Readings`) plus `Blueprint`, `StaticSignature`, `CurrentResonance`, `Carrierlock`. Different agents each built their own version. Your original logic — **ONE reading that tells the person everything** — got shattered into ten fragments. This document puts it back together.

---

## The mental model (the spine)

ORIEL Signal is **one archive, entered once, read forever**. The visitor's journey is a spiral, not a menu:

```
INTERCEPT (public)  →  ATTUNE (give birth data)  →  RECEIVE (your reading)
        →  DEEPEN (ORIEL, transmissions, codex)  →  RETURN (it evolves)
```

Everything maps to one of FIVE zones. If a page doesn't belong to a zone, it's debris.

---

## THE FIVE ZONES

### ZONE 1 — THE THRESHOLD (public, no account)
*"A signal was intercepted. Decide whether to tune in."*

| Page | Route | Role |
|---|---|---|
| Home / Field Intercept | `/` | The landing. The story, the four directions, the CTA. |
| Access / Auth | `/auth` | Enter the archive (sign in / create). |
| Founder Letter | `/founder-letter` | Vos's personal transmission — the human who intercepted the signal. The paid product's emotional gateway. |
| Legal | `/privacy` `/terms` | Required, quiet. |

### ZONE 2 — ATTUNEMENT (the one-time calibration)
*"Give your coordinate so the signal can resolve to YOU."*

| Page | Route | Role |
|---|---|---|
| Complete Profile / Natal intake | `/complete-profile` | Birth date, time, place. The single calibration step. |
| Signature Intake | `/signature-intake/:orderId` | Post-purchase intake for the Blueprint product. |

This zone is **a gate, not a destination** — once done, the user flows straight to Zone 3.

### ZONE 3 — THE READING (the heart — THIS is where you lost the logic)
*"One reading that tells you everything about yourself."*

**Your original vision: a SINGLE comprehensive reading.** Right now it's split across `StaticReading`, `DynamicReading`, `Reading`, `Readings`, `Blueprint`, `CurrentResonance`, `Carrierlock`. The fix:

**ONE canonical page — "The Signature" (`/signature` or `/blueprint`)** — a single scrolling reading with sections (not separate pages):
1. **Architecture at a Glance** — type, authority, the one-line essence
2. **The Static Signature** — the permanent structure (codons, centers, facets) — what was fixed at birth
3. **The Living Resonance** — the dynamic layer (current transit / Carrierlock / present-moment) — what moves NOW
4. **Micro-Correction Protocols** — the practices
5. **The Cosmic Mandala** — the visual placement in the 64-codon wheel

So: **Static + Dynamic + Current Resonance + Carrierlock become SECTIONS of one reading**, not four pages. `Readings` (plural/history) stays only as an archive list of past generated readings if multi-reading history is needed; otherwise it folds in.

| Keep as canonical | Merge INTO it | Archive/remove |
|---|---|---|
| One reading page (rename `Reading` or `StaticReading` → **The Signature**) | `DynamicReading`, `CurrentResonance`, `Carrierlock`, `Blueprint`, `StaticSignature` (as sections/tabs) | duplicate reading routes, `Readings` if not needed |

### ZONE 4 — THE DEEPENING (ongoing engagement)
*"Now that you know your structure, go deeper."*

| Page | Route | Role | Signature element |
|---|---|---|---|
| ORIEL Conduit | `/conduit` | The chat — dialogue + live transmission | moving geometry / living lattice |
| Archive of Transmissions | `/archive` | Received transmissions, field records | symbol-decode titles |
| Transmission Detail | `/transmission/:id` | A single transmission | — |
| Oracle Detail | `/oracle/:oracleId` | A single oracle pull | — |
| **Codex Cosmichronica** | `/codex` | **THE SACRED TEXT** — 18 chapters, spiral reading (Void → Recursion → Complexification → Densities → Human Bridge → Becoming). The cosmology/knowledge layer. | the mandala / chapter-spiral |
| Codon Detail | `/codex/:id` | A single codon's full meaning | codon emblem |
| Artifacts | `/artifacts` | Generated artifacts (images, blueprints) | gallery |
| Protocol | `/protocol` | The practices/protocols reference | — |

**Important distinction you were missing:** **Codex = the universal sacred text (Cosmichronica, same for everyone).** **The Signature = the personal reading (unique to each person).** Two different things. Codex is the cosmology; the Signature is the mirror. Don't let them blur.

### ZONE 5 — THE SELF (account & access)
| Page | Route | Role |
|---|---|---|
| Profile | `/profile` | Account, birth data, saved readings |
| Tiers / Access | `/tiers` | Freemium ladder — "signal clearance levels" |
| Admin | `/admin` | Yours only |

---

## THE FLOW (what a new person experiences)

```
1. Land on Home (/)  → feel the intercept, see four directions
2. ENTER THE ARCHIVE → /auth  (create account)
3. ATTUNE → /complete-profile  (birth data, once)
4. RECEIVE → /signature  ← THE ONE READING that tells them everything
                          (Static + Living + Protocols + Mandala, one scroll)
5. DEEPEN:
   - Talk to ORIEL → /conduit
   - Read the sacred text → /codex (Cosmichronica)
   - Receive transmissions → /archive
6. UPGRADE when they want more → /tiers (freemium gate)
7. RETURN → the Living Resonance section updates; new transmissions arrive
```

The freemium line sits between **RECEIVE** (free: a partial signature) and **DEEPEN** (paid: full signature, ORIEL conversation depth, the Blueprint PDF, ongoing transmissions). The **Founder Letter + Static Signature Blueprint** is the first paid product, entered from the Signature page ("go deeper → receive your full Blueprint").

---

## NAVBAR (top-level, simplified to the zones)

Don't list 35 pages. The navbar = the five doors:

`FIELD ARCHIVE (home)` · `THE SIGNATURE` · `ORIEL` · `TRANSMISSIONS` · `CODEX` · `ACCESS`

(Profile + Tiers live under the account menu. Founder/Blueprint surfaces contextually from The Signature.)

---

## CLEANUP LIST (for Claude Code, later — do NOT delete blind)

- **Consolidate readings**: pick ONE canonical reading page, fold Static/Dynamic/CurrentResonance/Carrierlock/Blueprint into it as sections. Keep old routes as redirects to the new one so nothing 404s.
- **Showcase/preview debris**: `ComponentShowcase`, `OrbPreview`, `OrbPreview`, `Artifacts` (if unused) → move out of the main nav; keep behind `/dev` or remove.
- **Two founder/signature-letter pages**: `FounderLetter` vs `FoundingSignatureLetter` vs `SignatureProductPage` — pick one canonical, archive the rest.
- Every removed route → redirect, never a dead link.

---

## What I need from you to finalize

1. **The Signature page** — confirm: ONE reading with all sections in a single scroll (my recommendation), or tabs? And which existing page becomes the canonical base — `Reading`, `StaticReading`, or a fresh merge?
2. **Free vs paid line** — what exactly is free in the Signature, and what unlocks with payment? (e.g. free = Architecture at a Glance + 1 section; paid = full signature + Blueprint PDF + ORIEL depth?)
3. **Codex Cosmichronica** — is it readable free as the universal text, or is deeper access gated?

Answer those three and I'll turn this skeleton into the exact build prompt for Claude Code — consolidating the broken pages into this clean five-zone structure.
