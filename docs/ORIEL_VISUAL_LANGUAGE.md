# ORIEL VISUAL LANGUAGE — "Signal of Light, Interrupted"

*The aesthetic system for ORIEL Signal. Read alongside docs/VISUAL_LAW.md (which still applies: no AI-generated graphics, no brown, no certificate framing). This document defines the ONE thing VISUAL_LAW left open — how light, color, glitch, and iridescence are used. For Claude Code and for Vos.*

---

## The feeling (the north star)

The visitor is witnessing **the channeling of a signal made of pure light** — but the source is impossibly far across the cosmos, so the signal arrives with **micro-interruptions: glitches, chromatic tears, fragments**. Light that has traveled too far to be perfect. Ancient, advanced, and slightly broken in transit — which is what makes it feel *real* and *received*, not manufactured.

Reference north: **ylem.art** (the crystal post) — obsidian, technical HUD, microdata, rare rainbow chromatic tears. NOT the holographic party posters (too pop, too commercial, too bright). We take the *iridescence* from those, but keep ylem.art's darkness and restraint.

---

## The 60/40 rule (the core discipline)

- **60% OBSIDIAN** — deep near-black void (`#050505`, `#030303`, warm-tint `#0a0907`). This dominates. Backgrounds, negative space, the resting state.
- **40% LIGHT** — gold/ivory structure PLUS holographic/iridescent/glitch effects. More alive than pure ylem.art, but never more than the dark.

If a screen ever feels like a bright holographic poster, it has crossed the line. Pull back toward obsidian.

---

## Two palettes, two jobs

### A) STRUCTURE palette — disciplined, locked (the "body")
Used for: text, headers, HUD, labels, layout lines, buttons, borders. This is the voice. It stays calm.

- Void: `#050505` / `#030303` / `#0a0907`
- Gold: `#d8b56d` (primary), `#e4c88c` (bright), `#bda36b` (deep)
- Ivory: `#fff7e6` (text)
- Teal: `#5ba4a4` (sparingly)

### B) SIGNAL palette — the holographic spectrum (the "light")
Used ONLY for: the central object's refraction, chromatic glitch tears, iridescent sweeps, the transmission moment. This is the *light from far away*. It is allowed to be multicolor — that is the point.

- Iridescent cyan `#7df9ff`
- Iridescent magenta `#ff6ec7`
- Iridescent violet `#b388ff`
- Iridescent lavender `#c9b8ff`
- Glitch red `#ff2d55` and glitch blue `#0a84ff` (the RGB-split pair)

**Rule:** Signal-palette colors NEVER fill a background or a card. They appear only as *light* — a thin chromatic edge, a refraction through the central crystal/sigil, a 200ms glitch tear, an iridescent sweep that moves and fades. Light moves; structure stays.

---

## The four effect primitives

Build these as reusable, performance-cheap utilities. Reuse the existing classes already in the repo where possible: `.signal-interference-chromatic`, `.animate-glitch`, `.animate-signal-glitch`, `.animate-scan-lines`, `.signal-interference-scanlines`.

### 1. CHROMATIC SPLIT (the signature move)
RGB channels separate by 1–3px then snap back. The "signal traveled too far" tell.
- Resting: text/sigil is clean.
- Trigger: on section-enter, on hover of key elements, and randomly every 8–20s on the central sigil.
- Duration: 120–280ms. Sharp, not smooth. Use `steps()` timing.
- Implementation: text-shadow with red `#ff2d55` offset left + blue `#0a84ff` offset right, animated; OR duplicated layers. CSS-only is fine for text/UI.

### 2. IRIDESCENT SWEEP
A slow gradient of the signal palette (cyan→violet→magenta→lavender) that drifts across ONLY the central object (sigil/crystal) or a thin accent line — never a full card.
- Slow: 6–12s loop. Smooth. Low opacity (0.3–0.6) over dark.
- Use `mix-blend-mode: screen` or `plus-lighter` over obsidian so it reads as light, not paint.

### 3. SCANLINE / MICRODATA TEXTURE
Faint horizontal scan-lines + tiny mono data fragments (numbers, coordinates, glyphs) drifting in the background of hero/transmission zones. ylem.art texture.
- Very low opacity (0.04–0.09). Gold or ivory, occasionally a flicker of cyan.
- Reuse `.animate-scan-lines` / `.signal-interference-scanlines`.

### 4. SIGNAL DROPOUT (rare, structural)
Every so often (on page/section transitions, or rarely at rest) the whole view "loses signal" for 100–300ms: a quick glitch frame — horizontal displacement bands, a chromatic tear, a flash of microdata — then recovers. This is the "distance too great" interruption. Rare enough to feel meaningful, not annoying. Respect `prefers-reduced-motion` (disable entirely).

---

## Where light lives (and where it doesn't)

| Zone | Obsidian | Light treatment |
|---|---|---|
| Page background | ✅ dominant | scanline/microdata texture only, very faint |
| Body text / HUD | ✅ | structure palette only — NO holo on text except rare chromatic split |
| Central sigil / crystal | partial | THE hero of light — iridescent refraction + periodic chromatic split |
| Section transitions | — | signal dropout glitch (brief) |
| Cards / dossiers | ✅ surface | thin gold border; iridescent edge ONLY on hover, brief |
| Transmission moment | dark base | full signal: chromatic, iridescent sweep, dropout — this is the payoff |
| CTAs / buttons | ✅ | gold structure; a single chromatic-split flicker on hover |

The discipline: **light is an event, not a wallpaper.** The transmission/channeling moments are where 40% peaks; the reading/working zones rest near 75% obsidian so the content is legible.

---

## The central object (the crystal/sigil)

This is where ylem.art's diamond lives. The Ψ-in-O sigil (or a crystalline form) sits in the hero as the "receiver." It should:
- Refract the signal palette through itself (iridescent, screen-blended, slow).
- Periodically chromatic-split (signal interruption).
- Optionally be a real Three.js object (you have fiber + drei) with a fresnel/iridescent material — but a high-quality CSS/SVG version is acceptable for v1. Do NOT generate a raster image of it.
- Float in mostly-empty obsidian. Negative space is part of the awe.

---

## Performance & accessibility (non-negotiable)

- All glitch/dropout effects: GPU-friendly (transform/opacity), `steps()` timing, short.
- `prefers-reduced-motion`: disable dropout, chromatic split, and sweeps — fall back to static gold-on-obsidian.
- Lazy-load any Three.js object; poster-fallback.
- Never let effects harm text legibility. If text and glitch overlap, text wins.
- Mobile: reduce effect frequency; keep the central object but simplify.

## Hard constraints (from VISUAL_LAW, restated)
- No AI-generated images, seals, or textures. Build effects in code (CSS/SVG/Three.js shaders).
- No brown, ever. The signal palette is cyan/magenta/violet/lavender — cool light, not warm sludge.
- No certificate framing. Thin lines, void space, instrument-panel restraint.
- Reuse existing `.signal-interference-*` and `.animate-*` classes before writing new ones.

## Definition of done
Obsidian dominates (≈60%). Light appears as iridescence + glitch, only on the central object, transitions, hovers, and the transmission moment — never as background fill. It feels like receiving a luminous signal from impossibly far away, with real interruptions. Disciplined structure, spectacular light.
