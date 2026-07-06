# Bio-Architecture Codon Wheel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an immersive interactive Codon Wheel (64 codons in Mandala Sequence order) for the Bio-Architecture page, replacing the 6 static cards stub. The component is fully reusable and can accept an optional `activations` prop for the personal Profile page.

**Architecture:** One shared `CodonWheel.tsx` SVG component (render 64 clickable nodes, 16 dividers, center hub, selection wedge). Right-side sticky `CodonDetailPanel.tsx` shows selected codon specs. `RoleGrid.tsx` shows 16 Roles (click to filter/highlight codons on wheel).

**Tech Stack:** React 19, TypeScript, SVG, Framer Motion, tRPC v11

## Global Constraints
- **Color Palette:** --bg: #08070b | --bg2: #0d0b11 | --ink: #f2ead7 | --gold: #cda14a | --gold2: #e8c477 | --cyan: #6fb7c7 | --red: #c8584a | --mut: #857a69 | --line: rgba(205,161,74,0.16)
- **Typography:** Display: Cormorant Garamond | Utility: Space Mono (monospace)
- **Data layer:** Always read directly from `codex/vrc_static_signature/01_DATA/codons_master.json` (do not hardcode codon data)

---

### Task 1: Scaffolding Assets & Copying Symbol Files

**Files:**
- Create: `client/public/symbols/` (directory)
- Modify: `client/src/pages/BioArchitecture.tsx` (prepare for imports)

**Interfaces:**
- Produces: 64 PNG files located at `/symbols/RC01.png` through `/symbols/RC64.png` available to the frontend.

- [ ] **Step 1: Copy symbols folder**
Run: `cp -r "/home/vos/Downloads/Homepage upper section/symbols" "/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle (copy)/client/public/"`

- [ ] **Step 2: Verify copy**
Run: `ls -1 "/home/vos/_CODEX/Vossari_Conduit-Hub/Vossari_Conduit_HUB/oriel-resonance-circle (copy)/client/public/symbols/" | wc -l`
Expected: 64

- [ ] **Step 3: Commit**
```bash
git add client/public/symbols/
git commit -m "chore(codonwheel): copy 64 codon symbol PNGs to public folder"
```

---

### Task 2: Build the Reusable CodonWheel Component

**Files:**
- Create: `client/src/components/oriel-signal/CodonWheel.tsx`
- Test: `client/src/components/oriel-signal/CodonWheel.test.tsx` (stub/render test)

**Interfaces:**
- Produces: `export function CodonWheel({ codons, selected, onSelect, activations, activeRole }: CodonWheelProps)`
- Parameters:
  - `codons`: Codon[] from codons_master.json
  - `selected`: number (selected codon id, 1-64)
  - `onSelect`: (id: number) => void
  - `activations?`: Set<number> (optional, highlights user's personal codons)
  - `activeRole?`: string (optional, highlights current role sector)

- [ ] **Step 1: Create CodonWheel component**
Write `CodonWheel.tsx` using SVG geometry (cx=380, cy=380, r=350/244/150). Calculate positions for 64 nodes around 360° circle using the Mandala order from `vrc-mandala.ts`. Integrateslow rotation (`cwSpin` class) and hover/active states. Color node borders based on their V2 Tetradic Center (from `vrc-mandala.ts`).

- [ ] **Step 2: Write basic render test**
Create `client/src/components/oriel-signal/CodonWheel.test.tsx` ensuring it mounts cleanly without React errors.

- [ ] **Step 3: Run tests to verify**
Run: `npx vitest run client/src/components/oriel-signal/CodonWheel.test.tsx`
Expected: PASS

- [ ] **Step 4: Commit**
```bash
git add client/src/components/oriel-signal/CodonWheel.tsx client/src/components/oriel-signal/CodonWheel.test.tsx
git commit -m "feat(codonwheel): implement reusable SVG CodonWheel component"
```

---

### Task 3: Build the CodonDetailPanel & RoleGrid Components

**Files:**
- Create: `client/src/components/oriel-signal/CodonDetailPanel.tsx`
- Create: `client/src/components/oriel-signal/RoleGrid.tsx`

**Interfaces:**
- Produces: `export function CodonDetailPanel({ codon, facet, onFacetChange })`
- Produces: `export function RoleGrid({ activeRole, onRoleSelect })`

- [ ] **Step 1: Implement CodonDetailPanel**
Using styling from your prototype: draw the gold selection band, display Shadow/Gift/Siddhi with a custom colored spectrum bar (red→gold→white), and show the 4 facet tabs (Somatic, Relational, Cognitive, Transpersonal) with their respective degree ranges and cyan-accented micro-corrections.

- [ ] **Step 2: Implement RoleGrid**
Render the 4×4 grid of 16 roles. Map them exactly to your prototype definition (Originator, Resonator, Articulator, Cultivator, Clarifier, Sovereign, Guardian, Devotee, Transformer, Catalyst, Oracle, Steward, Reformer, Ascendant, Navigator, Illuminator). Clicking a role card highlights its 4 codons on the wheel.

- [ ] **Step 3: Verify build**
Run: `npx tsc --noEmit`
Expected: TSC: 0 (no type errors)

- [ ] **Step 4: Commit**
```bash
git add client/src/components/oriel-signal/CodonDetailPanel.tsx client/src/components/oriel-signal/RoleGrid.tsx
git commit -m "feat(codonwheel): implement CodonDetailPanel and 4x4 RoleGrid components"
```

---

### Task 4: Rewrite Bio-Architecture Page

**Files:**
- Modify: `client/src/pages/BioArchitecture.tsx`
- Modify: `client/src/components/oriel-signal/oriel-signal.css` (add wheel/panel styles)

**Interfaces:**
- Modifies: `/bio-architecture` route entry point. Displays the full interactive Codon Wheel experience.

- [ ] **Step 1: Load master codons JSON**
Add local fetch of `codex/vrc_static_signature/01_DATA/codons_master.json` or query via TRPC in `BioArchitecture.tsx`.

- [ ] **Step 2: Assemble layout**
Assemble the page: mount `CodonWheel`, `CodonDetailPanel`, and `RoleGrid` in a grid layout (wheel left, panel right, roles below). Apply the ambient flicker (11s) and subtle spin animations safely.

- [ ] **Step 3: Run Typecheck + Tests**
Run: `npx tsc --noEmit && npx vitest run`
Expected: 0 type errors, 593/593 tests passed.

- [ ] **Step 4: Run production build**
Run: `npm run build`
Expected: BUILD: 0

- [ ] **Step 5: Commit**
```bash
git add client/src/pages/BioArchitecture.tsx client/src/components/oriel-signal/oriel-signal.css
git commit -m "feat(codonwheel): completely rewrite Bio-Architecture with interactive Codon Wheel"
```
