# Bio-Architecture Codon Wheel — Design Spec

**Date:** 2026-07-01
**Status:** Approved by Vos Arkana
**Source of truth:** `Downloads/Homepage upper section/Codon Wheel.dc.html` (working prototype) + `codex/vrc_static_signature/01_DATA/codons_master.json` (64 codons) + VTRS v2.0 canon (8 Tetradic Centers, 32 Resonance Links)

## Subject
The Vossari Resonance Codex — 64 archetypal codons arranged in a sacred Mandala wheel. The page's single job: let a visitor turn the wheel, explore any codon, and feel the structure of the entire system.

## Design Tokens (from prototype)
```
--bg:      #08070b
--bg2:     #0d0b11
--panel:   rgba(20,17,12,0.5)
--ink:     #f2ead7
--gold:    #cda14a
--gold2:   #e8c477
--cyan:    #6fb7c7
--red:     #c8584a
--mut:     #857a69
--line:    rgba(205,161,74,0.16)

Display: Cormorant Garamond (500-600)
Utility: Space Mono (400, 700)
```

## Components

### 1. CodonWheel.tsx (SVG, reusable)
- 760×760 viewBox
- 3 concentric guide circles (r=350, 244, 150)
- 64 codon nodes positioned in Mandala Sequence at r=290
- 16 role divider lines radiating from center
- Center hub (240px) with selected codon emblem (120px) + name + code
- Selection wedge highlighting the selected role's 4-codon sector
- Outer dashed ring slowly rotating (120s, reduced-motion safe)
- Props: `codons`, `selected`, `onSelect`, `activations?`
- Each node: circular div with codon emblem PNG, border color by center

### 2. CodonDetailPanel.tsx (sticky right panel)
- Role band: role name, roman numeral, function, 4-facet tetrad switcher
- Codon identity: RC code, binary, phase, name, traditional name, archetype
- Spectrum: shadow/gift/siddhi with colored bar (red→gold→white)
- Facet detail: description + micro-correction (cyan accent)

### 3. RoleGrid.tsx (4×4 grid)
- 16 role cards (name, roman, range, gift keyword)
- Click → filters wheel to that role's 4 codons
- Active state: gold left border

### 4. BioArchitecture.tsx (page rewrite)
- SignalPageShell + SacredGeometryField
- Header: "// VOSSARI RESONANCE CODEX · TETRADIC WHEEL" + "THE CODON WHEEL" title
- Layout: grid (wheel | 412px panel), role grid below
- Footer stats bar

## Data
- `codons_master.json` (64 codons, all fields)
- 64 emblem PNGs + 16 role SVGs → `client/public/codons/`

## Immersive layers
- Ambient ring rotation (120s, disabled on reduced-motion)
- Header flicker (11s, subtle)
- Selection wedge fade-in
- Center hub emblem scale-in

## Profile integration (future)
- Same CodonWheel component with `activations` prop
- User's 13 activated codons glow/pulse
- Defined centers colored, open centers white
