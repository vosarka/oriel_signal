Read AGENTS.md, docs/VISUAL_LAW.md, and docs/ORIEL_VISUAL_LANGUAGE.md first. All absolute. Work on branch v2-baseline. This is the ORIEL Signal homepage (client/src/pages/Home.tsx + client/src/components/oriel-signal/oriel-signal.css). Three connected upgrades. Show me a plan first, then build in passes, verify visually with pnpm dev, self-critique, show diff, wait for approval before commit. Log in wiki/log.md.

═══════════════════════════════════════════════════════════
UPGRADE 1 — SACRED GEOMETRY BACKGROUND (replace the square grid)
═══════════════════════════════════════════════════════════
The current page background uses square grid patterns (.bg-grid style linear-gradients, 50px squares) that visually collide with the card corner decorations and create noise. Replace the page background with a SACRED GEOMETRY field: the Flower of Life construction — fine intersecting circles forming the seed/flower pattern, drawn as thin blueprint lines, like an unfinished sacred-geometry drawing on an ancient manuscript.

Requirements:
- Build it as inline SVG (a dedicated <SacredGeometryField /> background component, position fixed/absolute behind content, z-index below everything). Do NOT generate or fetch a raster image. Pure SVG paths/circles.
- The Flower of Life: overlapping circles on a hex grid. Thin strokes (0.5–1px). Color: silver-grey, very discreet — stroke rgba(200, 205, 215, 0.10) to rgba(200,205,215,0.16). NOT gold, NOT brown. Cool silver.
- Visible but dark: it should read clearly as geometry against the obsidian void, but never dominate. Think 65% obsidian still. Layer it over the existing void background, optionally with a faint radial vignette so edges fade to pure black.
- SCROLL-BUILD: the geometry draws itself as the user scrolls down — use stroke-dasharray / stroke-dashoffset animated by scroll progress (IntersectionObserver or a scroll handler updating a CSS custom property), so lines progressively complete as you descend, like a signal decoding into form. Stagger circles so it builds outward from center.
- Respect prefers-reduced-motion: show the geometry fully drawn, static, no scroll animation.
- Performance: SVG only, transform/opacity, no layout thrash. One field for the whole page is fine; ensure it doesn't hurt scroll FPS (will-change sparingly).

Remove or disable the old square .bg-grid background on the homepage page wrapper so the two don't stack.

═══════════════════════════════════════════════════════════
UPGRADE 2 — FIX THE CARD CORNERS (stop the collision)
═══════════════════════════════════════════════════════════
The archive cards (.signal-glow-card / .archive-document-panel / .archive-overview-panel / .archive-sigil-panel) have an ::after pseudo-element (oriel-signal.css ~line 645) that paints an 18px×18px mini square-grid inside each card. This collides with the background and looks busy/ugly — the user specifically dislikes it.

- REMOVE that inner 18px grid ::after entirely (the background-image with the two linear-gradients at 18px 18px size on the card ::after).
- Replace the card separation with something cleaner that lifts the card OFF the new geometry background instead of competing with it. Your choice (the user said "surprise me"), but it must: (a) clearly separate card from background, (b) not use squares/grid, (c) stay on-palette. Strong option: a slightly darker semi-opaque card fill (rgba(5,5,7,0.55) with backdrop-blur 6px) + a thin 1px gold top accent line (keep the existing ::before top-line, it's nice) + on hover only, a brief iridescent edge glow per ORIEL_VISUAL_LANGUAGE. Keep it restrained.
- The result: cards read as calm dark panels floating above the silver sacred-geometry field, not boxes tangled in a grid.

═══════════════════════════════════════════════════════════
UPGRADE 3 — TEST: swap the color-shifting logo for the video
═══════════════════════════════════════════════════════════
TEST ONLY — make it easy to revert. Currently the hero center shows the logo (/oriel-signal-mark.png) with chromatic/holographic effects. The user wants to TEST replacing that central logo with the existing looping video.

- The video already exists at: /media/fa_mi_un_videoclip_loop_ca_sa.mp4 (already exported as ORIEL_HERO_VIDEO_SRC in OrielSignalDesign.tsx).
- In the hero, replace the central animated logo element with this video playing: autoPlay, loop, muted, playsInline, poster fallback. Size it to sit where the sigil was (contained, floating in void — not full-bleed background). Keep the chromatic-split / dropout effects layered OVER the video if feasible; if not, just the clean video for this test.
- Keep the old logo code commented or behind a simple boolean flag (e.g. const USE_HERO_VIDEO = true) so we can flip back instantly after the test.

═══════════════════════════════════════════════════════════
GLOBAL CONSISTENCY NOTE (for later, do not build now)
═══════════════════════════════════════════════════════════
The goal across the whole site is one continuous landscape: every page shares this obsidian + silver-sacred-geometry + gold-structure + holographic-light world, but each page keeps its OWN signature element (Transmissions = symbol-decode titles; Conduit/chat = moving geometry; etc). For THIS task only touch Home.tsx + oriel-signal.css (+ a new SacredGeometryField component). We will propagate to other pages in later passes.

CONSTRAINTS: no brown (zero rgba(132,96,54)), no AI-generated images, no certificate framing/rulers, no new dependencies, no reformatting unrelated files. Silver geometry must be cool-grey not gold/brown. Verify on pnpm dev before declaring done. Self-critique: does darkness still dominate? Is the geometry visible but calm? Do cards float cleanly? Is anything brown? Show diff, wait for approval.
