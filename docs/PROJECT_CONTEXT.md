# Project Context

ORIEL Signal / Vossari Conduit Hub — a consciousness technology
platform mapping birth data to a 64-codon archetypal system
via Swiss Ephemeris (swisseph-wasm). Delivers personalized
Static Signature Blueprints.

## What works
- All VRC engine files in server/ (177/178 tests pass)
- Swiss Ephemeris WASM, tRPC API, PayPal, better-auth
- oriel-signal/ design system in
  client/src/components/oriel-signal/
- Three.js + React Three Fiber installed and running
- wiki/ project brain (49 pages — has 32 ghost links to fix)

## What needs work
- Transmission mode: /transmission command gets stuck in
  "signal acquiring". See docs/TRANSMISSION_MODE_DIAGNOSTIC.md
- Voice delay: ORIEL responds visually but audio starts
  too late — TTS waits for full text before starting.
  See docs/VOICE_LATENCY_DIAGNOSTIC.md
- Homepage: needs bg-grid restored + hero video loop
- Wiki: 32 broken ghost links
- One ephemeris validation vector needs recalibration

## Design language
- Colors: void black #0A0A0F, gold #C9A84C, teal #4FC4CF
- Fonts: Cormorant Garamond, Cinzel, JetBrains Mono, Inter
- Register: reverent, cinematic, quasi-scientific. Zero kitsch.
- All new work must match oriel-signal/ design system
