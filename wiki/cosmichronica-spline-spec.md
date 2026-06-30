# Cosmichronica — Spline "Spiral of Time" Build Spec

> One-page brief for authoring the spiral scene in Spline so it drops into the
> Cosmichronica integration with zero rework. Build the **look + named objects +
> States** in Spline; the agent wires all behavior (scroll, lighting, top-down,
> chapter presentation) in React.

## 0. Canvas & export
- **Background:** transparent (Scene → Background → Alpha 0). The page void (#0a0a0e) shows through.
- **Camera:** one **Perspective** camera. Disable user orbit/zoom controls (it's driven by code/States).
- **Export:** Export → Code / React → copy the `https://prod.spline.design/XXXX/scene.splinecode` URL.
- **Color language:** gold `#bda36b`, amber `#f6b05e`, ivory `#e8e4dc`. Cold pre-light at the top of the spiral → warm gold toward the base.

## 1. Objects to create — EXACT names (case-sensitive)
| Name | What it is | Notes |
|------|-----------|-------|
| `Spiral` | The full spiral/helix group | **Pivot at the geometric center** of the helix axis. This object is rotated by scroll. |
| `Pair_01` … `Pair_08` | The 8 base pairs along the spiral | One per Register, ordered top→bottom (Origin→Omega). Each is its own selectable object/group. |
| `Camera` | The perspective camera | Single camera; code may adjust zoom for mobile. |
| `Vortex` *(optional)* | The inner vortex/lines seen from above | Lives at spiral center; reads as a flat circle of lines when viewed top-down. |

Keep names literal — the code finds objects by these strings. No spaces, no emoji.

## 2. States to author (this is what makes it interactive)
Spline **States + Events** are how the agent triggers visuals. Create these:

**A. Base-pair glow — on each `Pair_0X`:**
- Default State: dim / unlit (low emissive).
- Add State **`lit`**: bright emissive + slight scale-up + glow.
- Add Event type **Mouse Hover** on the object, transitioning Default → `lit` (ease ~0.6s).
  - The agent fires this programmatically as you scroll past each register: `emitEvent('mouseHover', 'Pair_03')`. You don't need real hover — we reuse the hover event as the trigger.

**B. Top-down camera — scene-level State `TOP_DOWN`:**
- Default State: the descent view (camera looking at the spiral from the side/3-quarter).
- Add State **`TOP_DOWN`**: camera positioned **directly overhead**, looking straight down the spiral axis, framed so the spiral reads as a **perfect circle with the vortex + lines centered**. Tighten framing to fill ~70% of the frame.
- Add a scene Event (any trigger; the agent calls it via code) transitioning Default ↔ `TOP_DOWN`, ease ~1.0s, `power3.inOut` feel.
  - The agent triggers `TOP_DOWN` when a chapter is clicked, then fades chapter content over it; reverses on close.

## 3. Pivots & orientation (critical)
- `Spiral` pivot **must** sit on the central axis so `rotation.y` spins it cleanly (no wobble). Set in the editor: select `Spiral` → move the pivot gizmo to the axis center.
- Orient the spiral so the **axis is vertical** in Default view, and so the **`TOP_DOWN` State looks straight down that same axis**.
- Base pairs should be children of (or move with) `Spiral` so they rotate together as the user descends.

## 4. Performance budget (you're deploying — keep it lean)
- **Target file size:** under ~3 MB. (Runtime itself is ~581 KB gz; keep the *scene* light.)
- **Triangles:** aim < 150k total. Use Spline's simplify/decimate on dense meshes.
- **Lights:** 2–3 max. Bake where possible.
- **Textures:** ≤ 1024px, compressed; avoid 4K maps.
- **Effects:** soft bloom OK; avoid heavy reflections/DOF/SSR.
- Self-loop any idle motion (slow drift) inside Spline so no JS is needed to keep it alive.

## 5. Division of labor
- **You (Spline):** geometry, materials, the vortex look, the glow `lit` States, the `TOP_DOWN` camera State, transparent bg, export URL.
- **Agent (React):** lazy-load into the existing `CosmicAtmosphere` slot; bind scroll `--cz-progress` → `Spiral.rotation.y`; fire `Pair_0X` glow at each register threshold; trigger `TOP_DOWN` + present chapter on click; reverse on close; mobile zoom + reduced-motion fallback.

## 6. Hand-off checklist
Send the agent:
1. The `.splinecode` URL.
2. Confirmation the names match §1 (`Spiral`, `Pair_01..08`, `Camera`, `TOP_DOWN`).
3. Note any object whose name differs so the code can be adjusted.

That's it. Build §1–§3, keep §4 in budget, send §6 — and the spiral wires in cleanly.
