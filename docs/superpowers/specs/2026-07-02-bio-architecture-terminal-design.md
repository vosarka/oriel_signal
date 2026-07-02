# Bio-Architecture — Interactive System Terminal (VTRS) — Design Spec

**Date:** 2026-07-02
**Status:** Approved direction (user: "da go")
**Supersedes:** the lore-journey concept — this page is PURELY TECHNICAL. Cosmichronica owns the story; Bio-Architecture owns the system.
**Canon source:** `wiki/sources/source-consciousness-lattice-v2.md` (VTRS v2.0 — 8 Centers, 32 Links, VTIP) + `Downloads/The Vossari TETRADIC Resonance System`

## Concept

The page is an **interactive technical cockpit** for the Vossari Tetradic Resonance System — the "CONDUIT HUB INTERACTIVE TERMINAL" from spec Part XII. The Codon Wheel (already built) sits at the center from the start. Around it, 7 technical modules orbit as HUD stations. Clicking a module shrinks the wheel aside (same scene, no overlay) and the module's interactive visualization flows into the freed space.

**Explanation IS the visualization** — no long prose. Every concept is demonstrated interactively.

## The 7 Technical Modules

1. **VTIP — The Tetrad** — Animated 4-bit register: I → II → III → IIII light up sequentially, then Register Break (') spills into the next register. Interactive "+1" button lets the user accumulate and watch the overflow logic (`state = value mod 4`).

2. **The Two-Timing Algorithm** — Animated solar diagram: ecliptic circle, Sun at T_birth, the −88.0000° arc drawing backwards in time to T_design. Personality and Design layers shown as two overlapping rings.

3. **The 512-Node Lattice** — Interactive 9-bit address decoder: user toggles bits (Layer / Facet / Codon-position / Center) and sees the resolved node live (e.g. `0b110110100 → Codon 57 · Facet C · Design`). Optional R3F 3D lattice view.

4. **The 8 Centers** — Vertical column Origin → Omega (spec diagram), each with VTIP phase syntax (I … IIII'IIII), biological substrate, codon cluster. Defined/Open toggle per center shows behavioral difference.

5. **The 32 Resonance Links** — Network graph between the 8 centers: 32 lines, hover → link name, endpoint codons, circuit type. The 4×8 symmetry made visible.

6. **The 16 Roles** — Existing RoleGrid extended with Gift/Shadow per role + the calculation pipeline (26 activations → planetary weights → aggregate by family → Primary/Secondary Role).

7. **The Codon Wheel** — The centerpiece, already built (`CodonWheel.tsx` + `CodonDetailPanel.tsx` + `RoleGrid.tsx`). Facet arcs (1.40625°) shown in the detail panel. NOT changed — user said don't touch it.

## Layout & Behavior

- **State 1 (terminal):** wheel large at center; 7 module labels orbit it, HUD-style mono eyebrows (`01 · VTIP`, `02 · TWO-TIMING`, …).
- **State 2 (module open):** wheel scales to ~30% and slides to a corner (still alive, still rotating); module content staggers in. A "← TERMINAL" control returns to State 1.
- Permanent header strip: `SYSTEM STATUS: ACTIVE · 64 CODONS · 8 CENTERS · 32 LINKS · 512 NODES`.
- Transitions: same-scene morph (no overlays, no route changes). Framer Motion layout animations.
- Reduced motion: transitions become instant fades; wheel rotation stops.

## Visual Direction

- Palette: void `#08070b`, gold `#cda14a`/`#e8c477`, **cyan `#6fb7c7` as the dominant technical accent** (differentiates from gold/narrative Cosmichronica), red `#c8584a` for shadow states.
- Typography: Space Mono for all data/labels/formulas; Cormorant Garamond only for module titles.
- Visualizations: SVG-first; R3F only where 3D earns it (512-node lattice). **No Spline runtime** (deploy weight; prior decision).
- Mobile: modules stack vertically below the wheel; orbit labels become a horizontal scroll strip.

## Exclusions

- No Vossari/ORIEL narrative lore (link out to Cosmichronica for the myth).
- No personal data (Profile owns that).
- No Carrierlock/SLI diagnostics (product/profile concern, not system explanation).

## Components (planned)

- `client/src/pages/BioArchitecture.tsx` — terminal shell, state machine (terminal ⇄ module), header strip. Existing wheel/panel/grid imports kept.
- `client/src/components/oriel-signal/vtrs/TetradModule.tsx` — VTIP register animation.
- `client/src/components/oriel-signal/vtrs/TwoTimingModule.tsx` — solar arc diagram.
- `client/src/components/oriel-signal/vtrs/LatticeModule.tsx` — 9-bit decoder (+ optional R3F).
- `client/src/components/oriel-signal/vtrs/CentersModule.tsx` — 8-center column.
- `client/src/components/oriel-signal/vtrs/LinksModule.tsx` — 32-link network graph.
- `client/src/components/oriel-signal/vtrs/RolesModule.tsx` — RoleGrid + pipeline.
- All module data hardcoded from canon (centers, links, roles) — single `vtrs-data.ts` file, sourced from V2 spec, matching `server/vrc-mandala.ts` values exactly.

## Testing / Verification

- `pnpm run check` (tsc), `pnpm run test` (593 suite must stay green), `pnpm run build`.
- Browser smoke: terminal state renders, each module opens/closes, wheel keeps working, 0 console errors.
- Data audit: vtrs-data.ts values diffed against server/vrc-mandala.ts (centers/links must match exactly).
