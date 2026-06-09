# MISSION: Overhaul Vossari Resonance Codex Visuals, Dynamic Codon Symbols, & Detail Page Layout

We are updating the platform to a dark slate, gold-ruled technical manual blueprint theme (Oriel Field Archive). Additionally, we are moving from generic codon layouts to a dynamic sacred geometry system where every codon displays a unique custom central symbol representing its specific name, and overhauling the Codon Detail page to a high-density double-panel blueprint display.

---

## 1. Core Visual Reference & Rules

### A. Dynamic Codon Glyphs (Sacred Geometry Metatron System)

Modify `client/src/components/CodonGlyph.tsx` to support this structure:

- **Outer Geometry**: A hexagon of 6 nodes (`R=40`) connected by thin golden lines forming Metatron's Cube, and curved double side-arcs creating a spherical 3D globe effect.
- **Dynamic Binary Mapping**:
  - The 6 outer nodes must correspond to the 6 bits of the codon's binary string (loaded dynamically from the codon data).
  - Map nodes **counter-clockwise starting from the top node (12 o'clock)**:
    - Node 1 (Top, 12 o'clock) = Bit 1
    - Node 2 (Top-Left, 10 o'clock) = Bit 2
    - Node 3 (Bottom-Left, 8 o'clock) = Bit 3
    - Node 4 (Bottom, 6 o'clock) = Bit 4
    - Node 5 (Bottom-Right, 4 o'clock) = Bit 5
    - Node 6 (Top-Right, 2 o'clock) = Bit 6
  - Mathematically compute coordinates using: `angle = (-90 - i * 60) * (Math.PI / 180)` for index `i = 0` to `5`.
  - Active nodes (`1`) render as glowing gold-leaf spheres (`radialGradient` using `#D4AF37` and `#bda36b`).
  - Inactive nodes (`0`) render as thin, low-opacity gold outlines.
  - Draw the binary digit labels (`0` or `1`) slightly outside each node coordinate.
- **Dynamic Center Symbol Registry**:
  - Map each codon ID to its unique central SVG paths.
  - Create the SVG paths for the following 4 distinct center symbol templates:
    1. **Codon 22 (Resonance / Emitter)**: Double-ring boundary, vertical axis with beads, upward resonance arcs, and downward perspective grounding ripples.
    2. **Vortex Portal (Hooded Figure)**: Hooded shadow silhouette, circular dark vortex at base, crescent moons and orbiting nodes on sides.
    3. **Cyclic Arrow (Rotating Circle)**: Thick counter-clockwise golden arrow arc looping around a glowing center node, concentric dotted lines.
    4. **Winged Lotus Goddess**: Goddess figure outline with spinal beads, lotus base, winged flourishes, and a four-pointed star at the crown.
  - **Fallback Core**: For all other codons where the unique design is still in progress, fall back to rendering the elegant **Codon 22 Emitter** (double rings, vertical axis, waves, and ripples) as a premium temporary center.

---

### B. Codon Detail Page Layout Overhaul (`CodonDetail.tsx` - See Mockup)

Replace the current tabbed layout with a unified, double-panel blueprint design:

- **Global Page Styling**:
  - Deep slate/charcoal background with an organic noise overlay.
  - Framed by a thin gold boundary line, with coordinate ticks and footnote:
    `VOSSARI RESONANCE CODEX • ALL CODONS ARE PORTALS OF THE LIVING LATTICE • DO NOT USE OUTSIDE YOUR SOVEREIGN ALIGNMENT`
- **Left Panel (Vossari Codex Emitter)**:
  - Header: `VRC | VOSSARI RESONANCE CODEX` (top left); `RC[ID] | [ARCHETYPE] CODON` (top center, next to a circular logo).
  - Center: Large Metatron codon glyph with outer binary labels (`0` or `1`), and glowing cyan-ish aura threads radiating from the center ring to the 6 outer nodes.
  - Below Glyph: Large gold title `THE SOURCE` and subtitle `PRIMORDIAL INITIATION` (wide tracking).
  - Bottom Row: `PLANETARY KEYS` (astrological symbols with active/inactive dots) and `RESONANCE ROLE` (e.g. `Initiator / Catalyst`).
- **Right Panel (Technical Specifications)**:
  - Header: `CODON IDENTIFIER / RC[ID]` (top left); `CODON SEAL` box (top right, containing a mini circular seal with the central symbol).
  - `BINARY CODE`: The 6-bit binary sequence with wide letter-spacing and cyan glow (e.g. `0 1 0 1 1 0`).
  - `HEX POSITION MAP`: 6 small circles numbered 1 to 6. Under each, the corresponding bit (`0` or `1`).
  - `CORE MEANING`: A brief paragraph description.
  - `REGULATORY CENTER` & `POLARITY` side-by-side.
  - `FOUR FACETS`: Display all 4 facets (Somatic, Relational, Cognitive, Transpersonal) vertically.
    - Each facet has a custom SVG icon (e.g. body outline for Somatic, goggles for Relational, head for Cognitive, star for Transpersonal).
  - `POTENTIAL SPECTRUM`: Stacked display of Shadow Potential, Gift Potential, and Siddhi Potential (no tabs!).
  - Bottom Metrics: `FREQUENCY SPECTRUM` (e.g. `174.00 Hz`), `CONFIDENCE` (e.g. `0.97`), `STABILITY` (e.g. `91%`).
  - Footer Row: `ELEMENT` (e.g., Aether triangle symbol + text), `MODE` (e.g. concentric circles + text), `STACK RANK` (e.g. `1 / 64`).

---

### C. Oriel Field Archive Aesthetic (Technical Manual Theme)

- **Backgrounds**: Slate/charcoal textured dark backgrounds. Combine a linear gradient from pure black to deep charcoal with a subtle, low-opacity SVG noise overlay.
- **Borders & Gridlines**: Extremely thin, sharp borders (0.5px or 1px) using a gold color palette (`#D4AF37` / `#bda36b`).
- **Typography**:
  - Titles: Elegant serif ("Cormorant Garamond") with tracking.
  - Labels & Metrics: Geometric monospace ("IBM Plex Mono") in uppercase with wide letter-spacing (`tracking-widest`).

---

## 2. Action Items

### Step 1: Update Global Design Variables

- Modify `client/src/index.css` to ensure `--primary`, `--secondary`, and utility variables map to gold (`#D4AF37` / `#bda36b` / `#f6b05e`) and that the background contains the subtle noise pattern.
- Update `VossArchiveShell.tsx` to set the core frame lines, ticks, and coordinate rules globally.

### Step 2: Redesign CodonGlyph

- Open `client/src/components/CodonGlyph.tsx` and rewrite the SVG renderer.
- Implement the counter-clockwise node labels, Metatron wireframe lines, and outer nodes.
- Set up the mapping registry dictionary for central symbols, loading the 4 templates (Resonance, Vortex, Cyclic Arrow, Winged Goddess) and mapping the fallback.

### Step 3: Implement Human Design Bodygraph Component

- Extract the constellation logic from `StaticReading.tsx` into a reusable, beautiful `ResonanceBodygraph.tsx` component.
- Build the sitting human silhouette SVG and the 9 formatted centers (using standard polygons for triangles, rects for squares).

### Step 4: Overhaul CodonDetail Page

- Rewrite `client/src/pages/CodonDetail.tsx` to display the double-panel blueprint layout.
- Bind all text and metrics (including the binary string, hex position map, and potential fields) dynamically to the loaded codon data.
- Draw the astrological planetary keys row and technical footer indicators.

### Step 5: Integrate Glitch Video Asset

- Update `client/src/components/oriel-signal/OrielSignalDesign.tsx`:
  Change `export const ORIEL_HERO_VIDEO_SRC` from `"/media/fa_mi_un_videoclip_loop_ca_sa.mp4"` to `"/media/Golden_logo_with_glitches_202606012151.mp4"`.
- Verify the video serves and loops cleanly on the Home landing page block.

---

## 3. Verification & Testing Constraints

- Use pnpm commands: `pnpm check` to verify TypeScript, `pnpm build` to verify production compiles.
- Ensure all hover states scale slightly (`scale-102`) and transition smoothly over `300ms`.
