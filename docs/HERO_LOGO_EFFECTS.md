# HERO LOGO — Glitch + Holographic Treatment

*Two paths. PATH A is the Claude Code task (code effects over your existing logo — no generated graphics, respects VISUAL_LAW). PATH B is a video-generation prompt you paste into your own video tool (Veo / Runway / Kling) if you want a rendered loop. Read alongside ORIEL_VISUAL_LANGUAGE.md.*

---

## PATH A — Claude Code prompt (code effects over the real logo)

Paste this into Claude Code. It applies glitch + holographic light to your EXISTING logo asset in real time. No image generation.

```
Read AGENTS.md, docs/VISUAL_LAW.md, and docs/ORIEL_VISUAL_LANGUAGE.md first.
All three are absolute. Work on branch v2-baseline.

TASK: Build a HeroSigil component that takes the existing ORIEL logo
asset (the blueprint Ψ-in-O — find it in /public; likely
oriel-signal-mark.png, qinklogo.png, or similar — confirm which, do
NOT generate a new one) and applies live glitch + holographic effects
per ORIEL_VISUAL_LANGUAGE.md.

Requirements:
1. The logo sits centered in the hero, floating in obsidian void with
   generous negative space. Static PNG/SVG source — never generated.
2. CHROMATIC SPLIT: the logo periodically (random every 8-20s) splits
   its RGB channels (red #ff2d55 offset, blue #0a84ff offset, 1-3px)
   for 120-280ms using steps() timing, then snaps back clean.
   Also trigger once on mouse-hover.
3. IRIDESCENT REFRACTION: a slow (8-12s loop) gradient sweep of the
   signal palette (cyan #7df9ff, violet #b388ff, magenta #ff6ec7,
   lavender #c9b8ff) passes through the logo ONLY, using
   mix-blend-mode: screen or plus-lighter so it reads as light over
   dark, opacity 0.3-0.55. Never fills the background.
4. SCANLINE + MICRODATA: faint scan-lines (reuse .animate-scan-lines /
   .signal-interference-scanlines) and a few drifting mono data
   fragments behind the logo, opacity 0.04-0.09, gold/ivory with a
   rare cyan flicker.
5. SIGNAL DROPOUT: rarely (every ~25-45s, or on first mount) the whole
   sigil "loses signal" for 150-300ms — horizontal displacement bands +
   chromatic tear + microdata flash — then recovers.
6. Obsidian dominates ~60%. Light is event, not wallpaper.

Reuse existing classes first: .signal-interference-chromatic,
.animate-glitch, .animate-signal-glitch, .animate-scan-lines,
.signal-interference-scanlines. Add new CSS only if needed, in
oriel-signal.css.

Accessibility: respect prefers-reduced-motion — disable all glitch,
dropout, and sweeps; show the clean logo on obsidian.
Performance: transform/opacity only, GPU-friendly, no layout thrash.

Do NOT generate or fetch any image. Do NOT use brown. Do NOT add
new dependencies. Show me the component + CSS diff before committing.
Log the work in wiki/log.md.
```

---

## PATH B — Video generation prompt (for YOUR tool: Veo / Runway / Kling)

*You generate this yourself so you control quality. Save the result to `/public` and the hero plays it in loop. Upload your blueprint logo image as the reference/start frame where the tool allows it.*

> A technical blueprint sigil — the Greek letter Psi (Ψ) inside a circle (O), rendered as fine wireframe and low-poly faceted glass on a near-black obsidian background. The sigil floats in deep darkness, surrounded by faint technical HUD microdata, coordinate numbers, and thin survey lines. Pure light refracts THROUGH the crystalline sigil, splitting into subtle iridescent spectrum — cyan, violet, magenta, lavender — like a signal of light arriving from impossibly far away. Periodically the image suffers brief chromatic glitch interruptions: RGB channels separate by a few pixels and snap back, horizontal signal-dropout bands flicker for a fraction of a second, as if the transmission is breaking up over cosmic distance. Slow, reverent, hypnotic camera — barely moving, breathing. 85% darkness, 15% luminous spectral light. Mood: ancient cosmic archive meets quantum laboratory. Seamless loop. No text, no logos other than the Psi sigil, no bright party colors, no warm brown or beige — only cool spectral light over obsidian black.

**Settings to aim for:** seamless loop, 10-20s, vertical or square depending on hero, muted (audio added separately if wanted), highest resolution the tool allows.

**Negative prompt (if supported):** brown, beige, tan, warm earth tones, bright pastel, party poster, busy background, text overlays, watermark, cartoon, glossy plastic.

---

## My recommendation
Do PATH A now — it's safe, fast, crisp at any resolution, fully on-brand, and respects VISUAL_LAW (zero generated graphics). Keep PATH B as an option if you later want a rendered cinematic loop you control. If you ever want the most spectacular version, we add a real-time Three.js 3D sigil later (you already have fiber + drei).
```
