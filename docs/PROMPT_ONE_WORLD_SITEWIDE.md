Read AGENTS.md, docs/VISUAL_LAW.md, docs/ORIEL_VISUAL_LANGUAGE.md, and docs/HOMEPAGE_SPEC_FIELD_INTERCEPT.md first — all absolute. If a frontend-design or brainstorming skill is installed, use it. Work on branch v2-baseline.

The homepage (client/src/pages/Home.tsx) is the gold standard — obsidian void, silver sacred-geometry field, gold structure, holographic/glitch light, the SignalPageShell world. This task spreads that ONE world across the whole site and makes three specific hero/navbar fixes. Plan first, build in passes, verify with pnpm dev, self-critique, show diff, wait for approval before commit. Log in wiki/log.md.

═══════════════════════════════════════════════════════
PART A — HERO FIXES (Home.tsx + oriel-signal.css)
═══════════════════════════════════════════════════════
A1. BIGGER HERO VIDEO. The central hero video (ORIEL_HERO_VIDEO_SRC = /media/fa_mi_un_videoclip_loop_ca_sa.mp4) is too small. Make it noticeably larger — it is the centerpiece "receiver." Scale it up (e.g. responsive max width ~clamp(420px, 52vw, 760px)), keep it contained and floating in void (not full-bleed background), keep autoPlay/loop/muted/playsInline + poster. Keep the chromatic/dropout effects layered over it if present.

A2. MOVING GEOMETRIC WAVES. Add slow, looping geometric "signal waves" in the hero — concentric ring ripples / sine-wave lines emanating subtly from the sigil, drawn as SVG or CSS, in the SIGNAL palette as LIGHT (cyan #7df9ff / violet #b388ff, low opacity, mix-blend screen). Slow continuous loop (8–16s). This is the "signal radiating" feel. Keep it subtle — light as event, obsidian still dominates. Respect prefers-reduced-motion (freeze them).

═══════════════════════════════════════════════════════
PART B — NAVBAR (client/src/components/Header.tsx + css)
═══════════════════════════════════════════════════════
B1. REPLACE the navbar wordmark IMAGE with live TEXT. Currently the brand title uses a static image: orielSignalTextSrc = "/oriel-signal-wordmark-header.png". Replace that <img> with real text "ORIEL SIGNAL" rendered in the SAME font (Cinzel) and the SAME bright holographic title effect used on the hero <h1 id="home-hero-title"> (the bright iridescent/gradient look). Extract that title treatment into a reusable class (e.g. .signal-wordmark--holo) so hero and navbar share it exactly. Keep letter-spacing tasteful for the smaller navbar size.

B2. SWAP the navbar emblem to the hero sigil. Currently the navbar emblem is logoOrielSrc = "/oriel-signal-mark.png". Change it to the SAME logo/sigil asset used in the hero center. Confirm which asset the hero uses and point the navbar <img> (or component) to that same one so they match. (If the hero now shows the VIDEO, use the hero's still sigil image — oriel-signal-mark or whichever the hero's logo-chamber referenced — as the navbar emblem; do NOT put the video in the navbar.)

Keep the navbar layout, nav links, and auth buttons exactly as they are. Only the wordmark (image→holo text) and the emblem asset change.

═══════════════════════════════════════════════════════
PART C — ONE WORLD, EVERY PAGE (the big consistency pass)
═══════════════════════════════════════════════════════
Right now only Home, FounderLetter, StaticSignature, FinalOrielTransmission use the SignalPageShell world. The main destinations do NOT, so the site feels broken between pages. Bring these pages into the SAME landscape — obsidian void + silver sacred-geometry background + gold structure + holographic light + consistent typography (Cinzel display, Cormorant voice, JetBrains Mono data):

Priority pages (do in this order, one at a time, verify each):
1. Conduit.tsx (the ORIEL chat)
2. Archive.tsx (Transmissions)
3. Codex.tsx (Resonance codex)
4. Tiers.tsx (pricing/freemium)
5. StaticReading.tsx / Reading.tsx
6. Carrierlock.tsx, CurrentResonance.tsx, Readings.tsx, NatalProfile.tsx

For EACH page:
- Wrap content in the shared shell so it inherits the obsidian + sacred-geometry background and the page chrome. Reuse SignalPageShell / the shared design components (GlowCard, SignalButton, SignalKicker, ArchiveMetaStrip, etc.). Do NOT redesign the page's functional content or break its logic — only re-skin it into the world.
- Use the structure palette for all text/UI; signal-palette only as light. No brown, ever. No certificate frames/rulers. No 18px inner grids on cards.

CRUCIAL — each page keeps ONE signature element of its own (do not flatten them all the same):
- Conduit (chat): the moving geometry / living lattice motion it already has — preserve and harmonize it into the palette.
- Archive (Transmissions): the symbol-decode title animation (titles decoding from glyphs) — preserve/enhance it.
- Codex: the codon/mandala visualization as its hero motif.
- Tiers: the tiers presented as "access levels / signal clearance."
- Each reading page: the bodygraph / signature visual as its centerpiece.
The shared world unifies them; the signature element makes each one distinct. State, for each page, what its signature element is before reskinning.

═══════════════════════════════════════════════════════
PROCESS & CONSTRAINTS
═══════════════════════════════════════════════════════
- Do Part A and B first (small, high-impact, same files). Then Part C page-by-page, showing me each page's plan + diff before moving on. Do NOT do all pages blind in one giant commit.
- Touch only presentation: JSX structure, classNames, CSS, shared design components. Do NOT change routers, tRPC, engines, data logic, or auth behavior.
- No brown (zero rgba(132,96,54)), no AI-generated images, no certificate framing, no new dependencies, no reformatting unrelated files.
- prefers-reduced-motion respected for all new motion. Verify on pnpm dev. Self-critique each page: same world? darkness dominant? signature element intact? anything brown? Then show diff and wait for approval.

Start by reading Home.tsx + Header.tsx + oriel-signal.css, then give me: (1) the plan for Parts A & B, and (2) the list of each priority page with its identified signature element. Wait for my approval before building.
