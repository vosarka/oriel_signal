# Bio-Architecture VTRS Interactive System Terminal — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform `/bio-architecture` into a purely technical interactive cockpit for the VTRS: Codon Wheel at center, 7 orbiting technical modules that open in-scene (wheel shrinks aside, module content flows in).

**Architecture:** One state machine in `BioArchitecture.tsx` (`activeModule: string | null`). Six new module components under `client/src/components/oriel-signal/vtrs/`, all data from a single `vtrs-data.ts` matching `server/vrc-mandala.ts` exactly. Framer Motion layout transitions. Existing CodonWheel/CodonDetailPanel/RoleGrid untouched.

**Tech Stack:** React 19, TypeScript, SVG, Framer Motion, wouter. pnpm only. NO Spline. R3F optional (only lattice module, only if trivial).

## Global Constraints
- Palette: void `#08070b` · gold `#cda14a` / `#e8c477` · **cyan `#6fb7c7` dominant technical accent** · red `#c8584a` (shadow) · ink `#f2ead7` · mut `#857a69` · line `rgba(205,161,74,0.16)`
- Typography: Space Mono (`var(--font-ritual)`) for all data/labels/formulas; Cormorant Garamond (`var(--font-display)`) for module titles only
- Center/link/role data MUST match `server/vrc-mandala.ts` (V2 canon: 8 centers, 32 links) — no invention
- DO NOT modify `CodonWheel.tsx`, `CodonDetailPanel.tsx`, `RoleGrid.tsx` internals (user directive)
- Reduced motion: all transitions become fades, wheel rotation already stops (existing CSS)
- Verification gates after every task: `pnpm run check` && `pnpm run test` (593 green) && `pnpm run build`
- Commit after every task

---

### Task 1: vtrs-data.ts — single client-side canon data file

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/vtrs-data.ts`

**Interfaces (Produces):**
```typescript
export interface VtrsCenter { id: string; roman: string; name: string; phase: string; phaseSyntax: string; substrate: string; role: string; codons: number[]; definedState: string; openState: string; }
export interface VtrsLink { id: string; name: string; centerA: string; centerB: string; codonA: number; codonB: number; circuit: string; profile: string; }
export const VTRS_CENTERS: VtrsCenter[]  // 8 entries, Origin→Omega
export const VTRS_LINKS: VtrsLink[]      // 32 entries, L01–L32
export const CENTER_COLORS: Record<string, string>  // same 8 colors as CodonWheel.tsx
```

- [ ] **Step 1: Write the data file.** Transcribe the 8 centers (Part IV of spec: id, roman I–VIII, name, FAZA phase, VTIP syntax I…IIII'IIII, biological substrate, informational role, 8-codon cluster, defined/open behavior) and all 32 links (Part VI table: L01–L32 with name, centers, codons, circuit type, behavioral profile) from `wiki/sources/source-consciousness-lattice-v2.md`. Copy CENTER_COLORS from `CodonWheel.tsx` (Origin #527c8d, Mental #6db293, Collapse #68798e, Saturation #cf9b44, Bridge #a35d8d, Becoming #b8434a, Return #7a8c3d, Omega #8e44ad).
- [ ] **Step 2: Audit against server canon.** Run a quick node script or manual diff: every `codons` array in VTRS_CENTERS must equal the codon set for that center in `server/vrc-mandala.ts` CODON_CENTER_MAP; every (codonA, codonB) pair in VTRS_LINKS must exist in VRC_CHANNELS. Fix mismatches in vtrs-data.ts (server is the source of truth).
- [ ] **Step 3: Verify.** Run: `pnpm run check` → 0 errors.
- [ ] **Step 4: Commit.** `git add client/src/components/oriel-signal/vtrs/vtrs-data.ts && git commit -m "feat(vtrs): client-side canon data (8 centers, 32 links)"`

---

### Task 2: TetradModule — VTIP register animation

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/TetradModule.tsx`

**Interfaces:**
- Produces: `export function TetradModule()` — self-contained, no props.

- [ ] **Step 1: Implement.** State: `count: number` (starts 0). Render: a row of registers; each register = 4 bit-slots drawn as SVG squares that fill (cyan) as count accumulates. Register i shows `I / II / III / IIII` glyphs. When a register saturates (4 bits), render the prime `'` break symbol and spill into a new register (e.g. count 5 → `IIII'I`). Controls: `+1 PULSE` button (mono, cyan border) and `RESET`. Below, live readout: `VTIP_STATE = {count} mod 4 = {count % 4}` and the full syntax string (e.g. `IIII'I`). Include 3 explanatory captions (mono, ≤ 2 lines each): The Point/Line/Triangle/Square naming, accumulation-never-subtraction, Register Break overflow.
- [ ] **Step 2: Verify.** `pnpm run check` → 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(vtrs): VTIP tetrad register module"`

---

### Task 3: TwoTimingModule — solar arc diagram

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/TwoTimingModule.tsx`

**Interfaces:**
- Produces: `export function TwoTimingModule()` — self-contained.

- [ ] **Step 1: Implement.** SVG ecliptic circle (360°, tick marks every 30°). Gold dot = Sun at T_birth (place at 280.44° — the validation vector). On mount (and on `REPLAY` button), animate a cyan arc sweeping −88.0000° backwards to 192.44° where a cyan dot lands = T_design. Two concentric rings labeled `PERSONALITY LAYER (T_birth)` (gold) and `DESIGN LAYER (T_design)` (cyan). Readout panel: `L_target = (280.44° − 88.0000°) mod 360° = 192.44°`, plus the validation mapping `280.44° → RC38 · STRUGGLE` / `192.44° → RC57 · INTUITION`. Use framer-motion `animate` on strokeDashoffset for the arc sweep; instant on reduced motion.
- [ ] **Step 2: Verify.** `pnpm run check` → 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(vtrs): two-timing solar arc module"`

---

### Task 4: LatticeModule — 9-bit address decoder

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/LatticeModule.tsx`

**Interfaces:**
- Consumes: `VTRS_CENTERS` from vtrs-data.ts (to resolve center index → codon).
- Produces: `export function LatticeModule()`.

- [ ] **Step 1: Implement.** 9 toggleable bit cells (click flips 0/1), grouped and labeled: bit 8 LAYER · bits 7–6 FACET · bits 5–3 CODON POSITION · bits 2–0 CENTER. Live decode below: center (from index via VTRS_CENTERS order), codon (= center.codons[positionIndex], guard out-of-range), facet (00 Somatic A / 01 Relational B / 10 Cognitive C / 11 Transpersonal D), layer (0 Conscious / 1 Design). Big mono readout: `0b110110100 → DECIMAL 436 → RC57 · FACET C · DESIGN` style. Show the math caption: `64 × 4 × 2 = 512 = 2⁹`. Preload the spec's worked example (0b110110100) as initial state.
- [ ] **Step 2: Verify.** `pnpm run check` → 0. Manually verify initial state decodes to Codon 57 / Cognitive / Design (spec Part 2.2 example).
- [ ] **Step 3: Commit.** `git commit -m "feat(vtrs): 512-node 9-bit lattice decoder module"`

---

### Task 5: CentersModule — 8-center column

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/CentersModule.tsx`

**Interfaces:**
- Consumes: `VTRS_CENTERS`, `CENTER_COLORS` from vtrs-data.ts.

- [ ] **Step 1: Implement.** Vertical column (spec Part IV diagram): 8 center cards connected by a spine line, top→bottom Origin→Omega. Each card: roman numeral + name + VTIP syntax (mono, center color), FAZA label, biological substrate, 8 codon chips (RC01…, colored border). Per-card `DEFINED / OPEN` toggle: Defined → card border glows in center color + shows definedState text; Open → dim white border + openState text. Selecting a card expands it (accordion, one open at a time) revealing the informational role.
- [ ] **Step 2: Verify.** `pnpm run check` → 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(vtrs): 8 resonance centers module"`

---

### Task 6: LinksModule — 32-link network graph

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/LinksModule.tsx`

**Interfaces:**
- Consumes: `VTRS_CENTERS`, `VTRS_LINKS`, `CENTER_COLORS`.

- [ ] **Step 1: Implement.** SVG: 8 center nodes arranged in a circle (labeled discs in center colors), 32 link lines between them (slight curve for parallel links between same center pair — offset control points by link index). Hover/click a line → it brightens cyan, tooltip panel shows `L{id} · {name}` + endpoint codons + circuit type + behavioral profile. Side legend: circuit-type filter chips (Inspirational / Somatic / Expressive / Identity / Emotional / Survival / Storage) — clicking filters visible links. Counter: `32 LINKS · 4 × 8 SYMMETRY`.
- [ ] **Step 2: Verify.** `pnpm run check` → 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(vtrs): 32 resonance links network module"`

---

### Task 7: RolesModule — 16 roles + calc pipeline

**Files:**
- Create: `client/src/components/oriel-signal/vtrs/RolesModule.tsx`

**Interfaces:**
- Consumes: `ROLES` from `../CodonWheel` (existing export — 16 roles with name/roman/range/desc).

- [ ] **Step 1: Implement.** Reuse ROLES array. Grid of 16 role cards; click expands to show Gift line and Shadow line (from spec Part V — hardcode gift/shadow strings per role in this file as `ROLE_DETAILS: Record<string, {gift: string; shadow: string}>`). Below the grid, a horizontal 5-step pipeline diagram (mono, arrows): `26 ACTIVATIONS → PLANETARY WEIGHTS → AGGREGATE BY FAMILY → PRIMARY ROLE → SECONDARY PATTERN`. Each step is a bordered chip; hover shows 1-line explanation.
- [ ] **Step 2: Verify.** `pnpm run check` → 0.
- [ ] **Step 3: Commit.** `git commit -m "feat(vtrs): 16 resonance roles + pipeline module"`

---

### Task 8: Terminal shell — rewrite BioArchitecture.tsx state machine

**Files:**
- Modify: `client/src/pages/BioArchitecture.tsx`

**Interfaces:**
- Consumes: all 6 modules + existing CodonWheel/CodonDetailPanel/RoleGrid.
- Produces: the final page.

- [ ] **Step 1: Add module registry + state.** `const MODULES = [{id:'vtip', num:'01', label:'VTIP · THE TETRAD', comp: TetradModule}, {id:'twotiming', num:'02', label:'TWO-TIMING'}, {id:'lattice', num:'03', label:'512-NODE LATTICE'}, {id:'centers', num:'04', label:'8 CENTERS'}, {id:'links', num:'05', label:'32 LINKS'}, {id:'roles', num:'06', label:'16 ROLES'}]` and `const [activeModule, setActiveModule] = useState<string | null>(null)`. Wheel + detail panel remain the 7th "module" = the default terminal state.
- [ ] **Step 2: Header strip.** Add permanent mono status bar above the content: `SYSTEM STATUS: ACTIVE · 64 CODONS · 8 CENTERS · 32 LINKS · 512 NODES` (cyan, letter-spaced, subtle flicker animation reused from prototype, disabled reduced-motion).
- [ ] **Step 3: Terminal state layout.** When `activeModule === null`: current layout (wheel + detail panel + role grid) PLUS the 6 module chips rendered as two vertical HUD stacks flanking the wheel (3 left, 3 right) on desktop, horizontal scroll strip above wheel on mobile (`@media max-width 1080px`). Chip: mono number + label, cyan border on hover.
- [ ] **Step 4: Module state layout.** When a module is active: grid becomes `280px 1fr` — left column holds the shrunken wheel (CSS `transform: scale(...)` via a wrapping div with `max-width: 280px`, wheel stays interactive) + `← TERMINAL` button + the 6 chips as a vertical nav (active chip highlighted cyan); right column renders the active module component inside `<motion.div initial={{opacity:0, y:24}} animate={{opacity:1, y:0}}>`. Detail panel + role grid hidden in module state.
- [ ] **Step 5: Verify all gates.** `pnpm run check` → 0 && `pnpm run test` → 593 && `pnpm run build` → exit 0.
- [ ] **Step 6: Browser smoke.** Dev server: navigate `/bio-architecture`; confirm terminal state renders wheel + 6 chips; click `01 · VTIP` → wheel shrinks, module opens, `+1 PULSE` works; `← TERMINAL` returns; open each remaining module once; `browser_console` → 0 JS errors.
- [ ] **Step 7: Commit.** `git commit -m "feat(bio-architecture): VTRS interactive system terminal shell"`

---

### Task 9: Log + wrap-up

**Files:**
- Modify: `wiki/log.md`

- [ ] **Step 1: Log entry.** Append dated entry: VTRS terminal page — 6 interactive modules + wheel, data sourced from V2 canon, gates green.
- [ ] **Step 2: Final full verification.** `pnpm run check && pnpm run test && pnpm run build` — all green.
- [ ] **Step 3: Commit.** `git commit -m "docs(wiki): log VTRS terminal implementation"`

---

## Self-Review Notes
- Spec coverage: all 7 modules covered (wheel = existing, untouched — Tasks 2–7 build the other 6; Task 8 wires everything).
- Types consistent: modules are self-contained (no props) except data imports from vtrs-data.ts; ROLES import path verified (`CodonWheel.tsx` exports ROLES today).
- No placeholders: every task specifies exact content, initial states, and validation values (280.44°→RC38, 192.44°→RC57, 0b110110100→436).
- Risk: browser smoke may hit the known headless WebGL wedge — if so, verify via tsc/build/console-before-interaction and ask user to eyeball.
