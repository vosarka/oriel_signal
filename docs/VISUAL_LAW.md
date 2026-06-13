# VISUAL LAW — Non-Negotiable Design Rules for Any Agent

*Append this to AGENTS.md and reference it in every UI task. It exists because agents keep generating mediocre graphics, muddy brown instead of gold, and certificate-style framing. None of that is the ORIEL design. These rules are absolute.*

## 1. NEVER generate graphics

Do not generate, invent, or AI-create any image, illustration, texture, gradient art, icon, seal, badge, or decorative asset. No "let me make a hero image." No generated backgrounds. No invented logos.

- Use ONLY assets that already exist in the repo (`/public`, `client/src/components/oriel-signal/`, existing media).
- If a visual is missing, leave a clearly-marked placeholder `div` with the correct dimensions and a mono label, and TELL the human what asset is needed. Do not fabricate one.

## 2. Colors are LOCKED to these exact tokens

The ORIEL palette is gold-on-void. It is NEVER brown. If a color reads as brown, muddy, beige, tan, or amber-sludge, it is WRONG — delete it.

| Role | Exact value | Notes |
|---|---|---|
| Void (base) | `#050505`, `#030303` | near-pure black |
| Void warm-tint | `#0a0907`, `#0b0a08` | barely-warm black, gradient mid only |
| Gold | `#d8b56d` | the primary accent — warm, luminous |
| Gold bright | `#e4c88c` | highlights |
| Gold deep | `#C9A84C` / `#bda36b` | from the legacy palette, acceptable |
| Ivory (text) | `#fff7e6` | warm white, primary text |
| Teal | `#5ba4a4` | secondary accent, used sparingly |

FORBIDDEN colors (never output these or anything near them): `#8a6d3b`, `#7a5c30`, `#a0784a`, any saturated brown, sienna, chocolate, tan, or "earth tone." If you find these in code, flag them for removal.

## 3. NO certificate framing

Do not wrap content in:
- ornate borders, double-line frames, or "certificate" boxes
- ruler / measurement-tape edges as decoration
- corner flourishes, laurel wreaths, wax-seal graphics generated on the fly

The aesthetic is **instrument panel + ancient archive**, not diploma. Thin single-pixel borders (`rgba(189,163,107,0.12)`), the `.bg-grid` lattice, and generous void space — that is the framing language. Nothing heavier.

## 4. Typography is locked

Cinzel (display/wordmark), Cormorant Garamond (voice copy, often italic), JetBrains Mono (all data/labels/HUD), Inter (plain body). Do not introduce other fonts.

## 5. Restraint over decoration

When unsure, do LESS. Empty void space is correct. A single thin gold line is more ORIEL than any generated ornament. The register is reverent and precise — every added element must earn its place.

## If a task seems to require new graphics
Stop and ask the human. Never solve a missing-asset problem by generating one.
