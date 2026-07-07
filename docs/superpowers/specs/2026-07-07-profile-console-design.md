# Profile Console Design

## Purpose

Redesign `/profile` as a real receiver profile, not a Home-style landing page. It should keep the Home visual language: dark field, gold signal geometry, Cormorant/Cinzel/JetBrains typography, precise archive-console density. The structure should behave like a profile dashboard: identity first, then real activity, then recent traces and links into deeper surfaces.

## Scope

In scope:

- Profile identity surface: avatar/seal, name, conduit ID, copy control.
- Canon identity data: resonance role when the saved profile exposes it, fractal role, VRC type, authority, prime codon, current resonance.
- Activity counters: Lumens, ORIEL interactions, readings, transmissions read, accepted memories if available.
- A small interaction graph connecting the user's relationship with ORIEL, readings, transmissions, memory, static signature, and current signal.
- Recent activity list using real available records.
- Soft Receiver Level presentation based on activity, without showing a formula.
- Future-ready empty states for unavailable counters.

Out of scope for this deploy:

- Paid access tiers.
- Content gating.
- Subscription UI.
- New monetization logic.
- Changing Static Signature, Current Resonance, or Lumens calculation semantics beyond adding missing real counters.

## Chosen Layout

Use the **Profile Console** structure.

### 1. Identity Header

The first viewport should read like a profile, not a hero landing page.

Left:

- Avatar/seal generated from the user's name or conduit ID.
- Name.
- Conduit ID with copy button.

Center:

- Resonance Role if a canonical saved value is available; otherwise show a quiet "Awaiting role" state rather than deriving it in the frontend.
- Fractal Role.
- Prime Codon.
- Authority.
- Static Signature status.

Right:

- Receiver Level.
- Lumens total.
- Current resonance state.
- Last ORIEL contact when available.

The header may reuse Home's signal field and fine geometry, but it should be shorter and denser than Home's hero. No giant "PROFILE" wordmark as the main content.

### 2. Activity Strip

Directly below the header, show four to five compact counters:

- Lumens.
- ORIEL interactions.
- Readings.
- Transmissions read.
- Accepted memories.

Each counter should show a real value or a clear empty state. Avoid sample values.

### 3. Interaction Graph

Show a compact node graph, not a complex analytics chart.

Nodes:

- ORIEL.
- Readings.
- Transmissions.
- Memory.
- Static Signature.
- Current Signal.

Edges should be visual only in the first release. The graph communicates relationship shape, not detailed math. Counts appear inside or beside nodes when available.

### 4. Recent Field

Show a recent activity column:

- Latest ORIEL conversation.
- Latest dynamic reading.
- Latest generated transmission that was revealed, saved, or promoted.
- Latest Current Resonance / Carrierlock state.

If a category has no data, show a quiet empty state such as "Awaiting signal" rather than hiding the entire section.

### 5. Static Signature Summary

Keep a compact signature panel:

- VRC type.
- Authority.
- Fractal role.
- Prime codon.
- Birth coordinate if present.
- Link to the full signature or Founder Blueprint route currently used by the app.

This is a summary, not a replacement for `/signature`.

## Receiver Level

Receiver Level is an earned relationship-depth signal. It should not look like a hard game score.

Display copy:

> Level rises through readings, transmissions, and contact with ORIEL.

Do not show the formula in the UI for this release.

Suggested first implementation:

- Add a backend helper that returns `receiverLevel`, `currentPoints`, and `nextLevelPoints`.
- Compute from existing real signals only:
  - dynamic reading count,
  - generated transmissions read,
  - ORIEL interaction count,
  - accepted memory count if available,
  - existing Lumens value.
- Keep the formula private in server code so it can change later without visible UI churn.

## Data Sources

Existing data already available:

- `profile.getStaticProfile`: Static Signature, VRC type, authority, fractal role, prime stack, birth coordinate.
- `profile.getCurrentResonance`: current resonance / Carrierlock-derived state.
- `codex.getProfileSigil`: fractal role, VRC type, authority, Lumens, reading count, donated amount.
- `oriel.listConversations`: conversation list for recent ORIEL contact.
- `oriel.memory.listAccepted`: accepted memories.
- `generatedTransmissionEvents`: generated TX / Oracle staging records.
- `orielUserProfiles.interactionCount`: existing ORIEL interaction count.

Needed read-only addition:

- Add one profile summary endpoint, for example `profile.getProfileConsoleSummary`.
- It should aggregate counts server-side:
  - `interactionCount` from `orielUserProfiles.interactionCount`, with fallback to 0.
  - `readingCount` from existing `db.getReadingCount`.
  - `lumens` using existing Lumens logic.
  - `transmissionsReadCount` from `generatedTransmissionEvents` for the user where `eventType = "tx"` and status is `revealed`, `saved`, or `promoted`.
  - `acceptedMemoryCount` from accepted user memories.
  - latest conversation metadata.
  - latest revealed/saved/promoted TX metadata.
  - latest reading metadata.

No schema migration is required for this release. If accepted memory counting is not already exposed by a helper, add a read-only count helper over existing rows rather than changing schema.

## Components

Keep implementation scoped to `/profile`.

Suggested components, either local to `Profile.tsx` or extracted only if the file gets hard to read:

- `ProfileIdentityHeader`
- `ProfileStatStrip`
- `ProfileInteractionGraph`
- `RecentFieldPanel`
- `StaticSignatureSummary`
- `ReceiverLevelBadge`

Use existing ORIEL signal classes and components where possible:

- `SignalPageShell`
- `SacredGeometryField`
- `GlowCard`
- `SignalButton`
- Home `fi-*` visual vocabulary where it fits

Avoid recreating Home's full hero layout.

## Empty States

- No Static Signature: show avatar/name and a clear "Static Signature awaiting coordinate" panel.
- No ORIEL interactions: show `0` and "Begin conversation".
- No readings: show `0` and link to Signal Check or readings flow.
- No transmissions read: show `0` and link to Conduit or Archive.
- No memories: show "No accepted memories yet".

All empty states should be calm, not alarming.

## Accessibility

- Avatar/seal must not be the only carrier of identity.
- Copy button needs an accessible label and visible copied state.
- Graph nodes must be readable as text cards; lines/geometry are decorative.
- Do not rely on hover-only details.
- Keep text sizes inside compact cards readable on mobile.

## Verification

Minimum checks:

- `pnpm run check`
- `npx vitest run`
- `pnpm run build`
- HTTP check for `/profile`
- Manual browser pass at desktop and mobile widths

Design-specific checks:

- Profile no longer reads as a landing page hero.
- Real counters do not show sample values.
- Receiver Level appears but does not expose a formula.
- Paid tiers do not appear.
- Static Signature calculations and current resonance logic are unchanged.
