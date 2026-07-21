# Bio-Architecture Living Instrument + Receiver Cockpit

Date: 2026-07-21
Status: implemented

## Outcome

`/bio-architecture` becomes a reversible, scroll-driven reveal of the universal
VTRS system. `/profile` becomes the personal receiver cockpit that applies that
system to authenticated user data. The two pages remain visually related but do
different jobs.

## Bio-Architecture

- One sticky scene across seven chapters: Threshold, Double Signal, 88° Descent,
  256 Facets, 8 Centers, 32 Links, and Field Index.
- Scroll position directly controls the GSAP timeline; moving upward reverses it.
- Lenis is bridged to ScrollTrigger for smooth, synchronized motion.
- The existing Codon Wheel, center filters, roles, detail panel, and six VTRS
  modules remain the complete interactive terminal after the reveal.
- The same terminal wheel uses Framer Motion shared layout when it moves between
  the explorer and a technical module.
- Reduced-motion users receive the same seven chapters as a static reading flow.
- Visuals are procedural SVG/CSS/canvas assets, so the page does not depend on
  decorative stock imagery or WebGL availability.

## Profile

- Identity first: Resonance Role, receiver name, conduit ID, level, coherence,
  and node state form the header.
- Four page-level tabs separate Overview, Signature, Field History, and Settings.
- Overview combines the real VTRS body map, identity rows, actions, and an
  interaction lattice derived from existing profile summary counts.
- Signature preserves the complete embedded Static Signature / Current
  Resonance instrument and legacy incoming URLs.
- Field History uses only real latest conversation, reading, and transmission
  records. Missing records use quiet empty states.
- Password management lives only in Settings.

## Constraints and non-goals

- No database, role calculation, codon mapping, center/link, or API changes.
- No Human Design terminology and no new identity roles.
- No removal or simplification of existing technical modules.
- Profile remains an efficient dashboard; only Bio receives the long cinematic
  scroll treatment.

## Verification

- Production Vite build must pass.
- Existing profile model and summary tests must pass.
- Full TypeScript status must identify any unrelated baseline failure separately.
- `prefers-reduced-motion` must bypass the pinned animation.
- Desktop and mobile layouts must retain access to every chapter, tab, and action.
