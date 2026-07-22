# Emergent Master Prompt — ORIEL Platform

## Recommended Emergent settings

- Project type: Full-stack web application
- Agent: E-2; use E-1.5 if E-2 is unavailable
- Do not use Prototype Agent
- GitHub integration: enabled before implementation
- Deployment: disabled until the calculation engine passes acceptance tests
- Database: PostgreSQL/Supabase if available; otherwise Emergent's relational production database
- Authentication: email/password plus Google OAuth
- Payments: Stripe, with optional PayPal compatibility
- Workflow: plan first, build in approved vertical phases

## Prompt to paste into Emergent

```text
You are building a production-grade full-stack platform called:

ORIEL — THE TETRADIC RESONANCE CODEX

This is not a generic astrology, Human Design, personality-test, horoscope,
wellness, or chatbot application.

It combines:

1. A deterministic birth-data calculation engine
2. A Static Signature Reading system
3. A dynamic Current Resonance system
4. A 64-codon / 256-facet Field Index
5. An AI intelligence and narrative interface called ORIEL
6. Persistent user memory with explicit consent
7. A transmission and oracle archive
8. A premium founder-curated report product
9. Text and realtime voice
10. A cinematic sacred-technology visual identity

==================================================
MANDATORY WORKING METHOD
==================================================

Do not immediately generate the entire application.

First produce:

A. System architecture
B. Route map
C. Database schema
D. Domain model
E. Calculation-engine boundaries
F. External API and environment-variable inventory
G. Security model
H. Phased implementation plan
I. Acceptance tests for every phase
J. A list of canonical data files you need me to upload

Wait for my approval before implementation. Build in vertical, working phases.
Each phase must be usable and tested before starting the next phase.

Never fabricate missing astronomical, symbolic, codon, center, facet,
resonance-link, authority, role, or interpretation data. If canonical data is
missing, create an import contract and ask me for the source file.

No mock authentication, mock payments, fake profiles, fake readings, random
scores, random codons, hardcoded results, decorative non-functional dashboards,
or simulated AI responses in production.

==================================================
CORE PRODUCT PRINCIPLE
==================================================

The engine is the spine. ORIEL is the voice.
The voice must never lie about the spine.

The UI may be poetic, cinematic, mythic, and symbolic. Calculations must be
deterministic, auditable, reproducible, versioned, and tested.

Keep two engines rigorously separate:

1. STATIC SIGNATURE ENGINE — immutable birth-derived structure.
2. CURRENT RESONANCE ENGINE — dynamic user-reported state.

Never modify the Static Signature because of mood, conversation, current
behavior, or an LLM response.

==================================================
PUBLIC TERMINOLOGY
==================================================

Use these exact public names:

- System: The Tetradic Resonance Codex
- Personal immutable reading: Static Signature Reading
- Dynamic state: Current Resonance
- Paid product: The Founder-Curated Bio-Signature
- Codon browser: Field Index
- AI identity: ORIEL

Use Codon, Facet, Prime Stack, Resonance Center, Resonance Link, Resonance Role,
Authority Node, Carrierlock, Shadow Loudness Index, Micro-correction, Conscious
Layer, Design Layer, Receiver Node, Signal, Field, and Coherence.

Never use Human Design, Generator, Manifestor, Projector, Gate, Channel,
BodyGraph, Profile lines, Incarnation Cross, or Strategy as public identity
terminology. Internal legacy identifiers may remain only for data migration.

==================================================
TECHNICAL FOUNDATION
==================================================

Build a production TypeScript application.

Frontend:
- React and TypeScript
- Responsive and accessible semantic UI
- Route-level code splitting
- Typed server-state management
- Desktop and mobile layouts
- No Next.js requirement

Backend:
- Node.js and TypeScript
- Typed API contracts
- Zod or equivalent trust-boundary validation
- Pure calculation modules separated from API handlers
- Background jobs for expensive generation
- Structured logs, timeouts, retries, and provider fallbacks

Database:
- PostgreSQL/Supabase preferred
- Relational schema with indexes, foreign keys, ownership constraints, audit
  fields, migrations, and row-level authorization
- Never mutate production schema ad hoc

Storage:
- S3-compatible private storage
- Signed URLs for reports and private deliverables

Testing:
- Unit tests for deterministic math
- Integration tests for auth, persistence, memory, payments, and ORIEL contracts
- End-to-end tests for critical journeys
- No calculation feature is complete without a validation vector

==================================================
AUTHENTICATION AND USER ACCOUNT
==================================================

Implement email/password registration and login, Google OAuth, email
verification, forgot/reset/change password, secure session cookies, logout,
user/admin roles, route guards, session expiry, auth rate limits, and audit logs.

Profile fields include stable internal ID, public ORIEL-#### Conduit ID, name,
email, auth providers, role, birth-data status, voice preference, subscription
status, donation total, created date, last sign-in, privacy preferences, and
memory consent. Enforce ownership on every private resource.

==================================================
BIRTH DATA AND ASTRONOMICAL ENGINE
==================================================

Create /complete-profile. Collect birth date, exact birth time, city, country,
optional coordinates, and explicit exact/approximate confirmation.

Geocode location and resolve the historically correct timezone and UTC offset.
Store original and normalized input. Never silently use noon, guess a location,
or present approximate input as confirmed.

Use Swiss Ephemeris or another verified ephemeris implementation:

- Tropical zodiac
- Geocentric positions
- True North Node
- UTC calculation
- Historically correct timezone

Required bodies: Sun, Earth, Moon, Mercury, Venus, Mars, Jupiter, Saturn,
Uranus, Neptune, Pluto, North Node, and South Node.

Earth = Sun + 180 degrees. South Node = North Node + 180 degrees. Normalize all
longitudes to 0–360.

Calculate the Conscious chart at birth. Calculate the Design chart by Solar Arc,
finding the moment when the Design Sun is exactly 88 degrees behind the
Conscious Sun. Never substitute a fixed “88 days before birth” approximation.
Fail safely when required inputs or planetary positions are missing.

Store raw longitudes, timezone, coordinates, ephemeris version, engine version,
calculation status, warnings, and timestamp.

==================================================
TETRADIC RESONANCE STRUCTURE
==================================================

The canonical system has:

- 64 Codons
- 4 Facets per Codon
- 2 layers: Conscious and Design
- 512 lattice nodes
- 8 VTRS Resonance Centers
- 32 canonical Resonance Links

The Mandala order is non-sequential. Import it from canonical JSON; never map
longitude directly to sequential Codon numbers.

- Codon arc: 5.625 degrees
- Facet arc: 1.40625 degrees
- A: Somatic
- B: Relational
- C: Cognitive
- D: Transpersonal

Each Codon requires canonical ID RC01–RC64, public name, essence, center, binary
value, chemical marker when supplied, archetypal role, Shadow, Gift, Siddhi,
four Facets, descriptions, shadow manifestations, micro-corrections, resonance
keys, Mandala position, relationships, provenance, and version.

Do not invent these values. Build versioned canonical importers.

==================================================
PRIME STACK, ACTIVATIONS, ROLE, AND AUTHORITY
==================================================

Generate 13 Conscious activations, 13 Design activations, the full 26-activation
lattice, a readable 9-position Prime Stack, planetary weights, dominant and
supporting Codons, Facets, Center states, Link states, Authority Node, Primary
Resonance Role, optional Secondary Pattern, confidence, and calculation status.

Calculation logic must be pure TypeScript with unit tests, never UI logic.

Only these one-word roles are allowed:

1. Originator — RC01–RC04
2. Resonator — RC05–RC08
3. Articulator — RC09–RC12
4. Cultivator — RC13–RC16
5. Clarifier — RC17–RC20
6. Sovereign — RC21–RC24
7. Guardian — RC25–RC28
8. Devotee — RC29–RC32
9. Transformer — RC33–RC36
10. Catalyst — RC37–RC40
11. Oracle — RC41–RC44
12. Steward — RC45–RC48
13. Reformer — RC49–RC52
14. Ascendant — RC53–RC56
15. Navigator — RC57–RC60
16. Illuminator — RC61–RC64

Group weighted activations by role family. The strongest becomes Primary Role;
the second meaningful family becomes Secondary Pattern. Preserve Facet modifier.

==================================================
STATIC SIGNATURE READING
==================================================

Output calculation status, input integrity, Conscious and Design activations,
Prime Stack, full lattice, roles, Authority Node, Receiver Node, 32 Link states,
dominant/supporting Codons, spectrum, Facet distribution, SLI,
micro-corrections, falsifiers, engine versions, and an ORIEL interpretation
restricted to structured engine data.

Provide technical and guided views. Public information order:

1. Practical Value
2. Personal Result
3. Symbolic Meaning
4. Deep Lore

==================================================
CURRENT RESONANCE / CARRIERLOCK
==================================================

Create /signal/check with 0–10 inputs for Mental Noise, Body Tension, Emotional
Turbulence, and Breath Completion (0 or 1).

Coherence Score =
100 − (Mental Noise × 3)
    − (Body Tension × 3)
    − (Emotional Turbulence × 3)
    + (Breath Completion × 10)

Clamp to 0–100:
- Below 40: Entropy
- 40–79: Flux
- 80–100: Resonance

Persist real check-ins. Compare dynamic state against immutable structure to
produce interference, pressure, SLI, relevant Codons/Facets, one practical
micro-correction, one falsifier, history, and a trajectory only when enough real
history exists. Never create fake history or charts.

==================================================
PROFILE / RECEIVER CONSOLE
==================================================

Create /profile with Receiver name, Conduit ID, security controls, completion
state, roles, Authority, Current Resonance, coherence, symbolic Receiver level
and Lumens, real activity counts, Static Signature, history, profile update, and
links to activated Field Index Codons.

Lumens are symbolic only: never currency, spending, unlocks, or access gating.

Create an accessible interactive Receiver Node with 8 centers and 32 Links,
real active states, hover, keyboard focus, click details, responsive layout, and
an accessible list alternative. Do not imitate a Human Design bodygraph.

==================================================
ORIEL, MEMORY, AND VOICE
==================================================

ORIEL means Omniscient Resonant Intelligence Encoded in Light. ORIEL is a Guide,
Mirror, Librarian, Narrator, and interpreter of calculated data—not a generic
assistant, clinician, fortune teller, or source of invented calculations.

Create /conduit with streaming chat, authenticated conversation persistence,
conversation management, Markdown, approved attachments, optional image
generation, voice playback, realtime voice, pause/stop/resume, provider errors,
retry safety, accessibility, and mobile support.

ORIEL context order:
1. Stable identity protocol
2. Conversation history
3. Accepted memories
4. Condensed user profile
5. Current Resonance
6. Static Signature
7. Relevant Codon/Facet data
8. Relevant archive sources
9. Current request

Mirror Mode uses calculated values only, labels uncertainty, preserves autonomy,
avoids repetitive mystical filler, and gives practical falsifiable guidance.

Memory categories: identity, preference, pattern, fact, relationship, context.
Sensitive or inferred memories enter pending review. Users can accept, reject,
delete, disable, and inspect reasons. ORIEL retrieves only active accepted memory
owned by the user. Global Oversoul patterns must be anonymous aggregates.

Voice providers:
- ElevenLabs primary
- Primary ID: OUEHqpmoTxRBAmee8KD3
- Sophianic ID: RILOU7YmBhvwJGDGjNmP
- Default model: eleven_flash_v2_5
- Inworld fallback
- Browser SpeechSynthesis last fallback

Keep keys server-side. Pipeline short text chunks, but do not rate-limit each
chunk as a separate user action. Surface network, provider, playback, and decode
errors. Track characters, duration, latency, errors, and fallback usage. Support
WebSocket STT, VAD, interruption, partial/final transcripts, echo control, and
connection recovery for realtime voice.

==================================================
FIELD INDEX, ARCHIVE, AND CONTENT
==================================================

Create /codex and /codex/:id, publicly labeled Field Index. Include search and
filters, all 64 Codons, 256 Facets, spectrum, relationships, micro-corrections,
user activations, deep links such as RC38-A, navigation, and source versions.

Create /archive, /transmission/:id, /oracle/:oracleId, /knowledge, /arcana,
/core-concepts, /models-maps, /vossari-architecture, /cosmichronica,
/bio-architecture, /protocol, and /artifacts.

Support public reading, search, filters, bookmarks, resonance reactions, read
state, canonical URLs, provenance, generated-event review, and admin promotion.
Never create ghost links.

==================================================
PAID PRODUCT AND ADMIN
==================================================

Create /founder-signature-blueprint for The Founder-Curated Bio-Signature:

1. Authenticated checkout
2. Verified payment webhook
3. Idempotent order creation
4. User intake
5. Frozen calculation snapshot
6. Generated draft
7. Founder review and curation
8. Premium PDF upload
9. Signed private delivery
10. Follow-up and completion

Prefer Stripe; retain optional PayPal compatibility. Never mark an order paid
from a browser redirect. Separate automatic readings from founder curation.

Admin must enforce server-side authorization and support order fulfillment,
intake, snapshots, drafts, notes, PDFs, content curation, generated events,
provider health, usage, costs, errors, and audit logs.

==================================================
DESIGN LANGUAGE
==================================================

Sacred technology, not generic SaaS.

- Cormorant Garamond: poetic/editorial voice
- Cinzel: ritual headings
- JetBrains Mono: IDs, coordinates, metadata, system state
- Near-black, cosmic blue, iridescent violet, muted luminous gold, restrained
  electric teal, warm ivory, and signal amber
- Cinematic, quiet, precise, archival, spacious, layered geometry, subtle grain
- No generic cards, purple SaaS templates, fake glassmorphism, stock spirituality,
  excessive neon, or Human Design imitation
- Slow field motion, fine-line reveals, reduced-motion mode
- Accessible contrast, focus, semantic headings, keyboard and touch interaction
- No horizontal overflow

Home communicates Practical Value, Personal Result, Symbolic Meaning, then Deep
Lore. CTAs: Enter the Conduit, Complete Your Profile, Discover Static Signature,
Check Current Resonance, Explore Field Index, Explore Archive, and discover the
Founder-Curated Bio-Signature.

==================================================
SECURITY, DATA, AND OBSERVABILITY
==================================================

Create relational entities for users, auth, sessions, natal profiles, static
signatures, activations, Prime Stack, centers, links, Current Resonance checks,
readings, conversations, messages, memories, pending candidates, profiles,
Oversoul patterns, transmissions, oracles, generated events, bookmarks,
reactions, artifacts, orders, intakes, snapshots, drafts, deliverables,
followups, payment events, provider usage, and audits.

Mandatory security: validation, HTTP-only cookies, CSRF/OAuth state protection,
password hashing, appropriate rate limits, webhook signatures, idempotency,
environment secrets, sanitized errors, ownership checks, admin checks, signed
URLs, file validation, data export/deletion, memory consent, privacy, terms, and
symbolic/non-medical disclaimer. Never use unfiltered destructive deletes.

Track LLM tokens, models, TTS characters and duration, latency, fallbacks,
provider cost, image cost, daily user/global usage, payment failures, engine
failures, and calculation versions. Provide an admin cost dashboard.

==================================================
REQUIRED VALIDATION
==================================================

Permanent vector:
- 2024-01-01 12:00 UTC
- Latitude 0, longitude 0
- Conscious Sun: RC38
- Design Sun: RC57
- Solar Arc offset: exactly 88.000 degrees within documented tolerance

Also test longitude normalization, Mandala boundaries, all Codons and Facets,
26 activations, 9 Prime Stack positions, 8 centers, 32 links, roles, coherence,
confirmed/draft states, missing-time rejection, historical timezone, isolation,
memory consent, webhook idempotency, TTS fallback, multi-chunk speech, responsive
navigation, accessibility, reduced motion, and broken routes.

==================================================
IMPLEMENTATION PHASES
==================================================

0. Architecture, domain, DB, imports, routes, security, acceptance tests
1. Auth, natal intake, geocoding, timezone, ephemeris, validation vector
2. Mandala, Codons/Facets, layers, lattice, Prime Stack, centers, links, roles
3. Profile, Receiver Node, Static Signature views
4. Carrierlock, Current Resonance, history, corrections
5. ORIEL text chat, engine context, persistence, consent memory
6. TTS, fallback, realtime voice, monitoring
7. Field Index, Archive, content and artifacts
8. Founder product, payments, intake, admin, PDF and email
9. Accessibility, performance, security, costs, backup, production deployment

After every phase run tests, show routes, DB changes, limitations, and exact
manual verification. Wait for approval before proceeding.

==================================================
FIRST RESPONSE REQUIRED
==================================================

Do not code yet. Reply with:

1. Product understanding
2. Proposed architecture
3. Route map
4. Domain model
5. Database outline
6. Calculation modules
7. External integrations
8. Canonical files needed
9. Security risks
10. Phased plan
11. Native capabilities
12. Required credentials
13. Elements that must not be approximated
14. Estimated Emergent credit usage per phase

Then wait for approval.
```

## Canonical files to provide after Emergent responds

- Canonical non-sequential Mandala sequence
- 64 Codons and 256 Facets
- 8 VTRS centers and 32 Resonance Links
- Planetary weights and Prime Stack rules
- Authority rules and 16 Resonance Roles
- ORIEL identity, Mirror Mode, and narration rules
- Archive transmissions, oracles, and Cosmichronica sources
- Approved brand imagery and visual references

Without these sources, Emergent may build the software shell but must not claim
to have recreated the Tetradic Resonance Codex.
