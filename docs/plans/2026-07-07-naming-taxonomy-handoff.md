# Handoff: Naming Taxonomy Cleanup

**Status:** Ready for a separate agent. Do not mix with v2 engine cleanup.

**Branch:** `feature/cosmichronica-spiral-remembers`

## Approved public naming (user decision 2026-07-07)

| Layer | Public name | Tagline / role | Surface |
|-------|-------------|----------------|---------|
| System | **The Tetradic Resonance Codex** | Canon + engine (64 codons, 8 VTRS centers, 32 links) | `/protocol`, wiki, ORIEL context |
| Personal | **Static Signature Reading** | Engine-calculated immutable birth structure | `/signature` tab 1 |
| Paid product | **The Founder-Curated Bio-Signature** | *A personal interpretation of your Tetradic resonance pattern* | `/founder-signature-blueprint` |
| Live signal | **Current Resonance** | Carrierlock + SLI vs stored reading | `/signature?tab=resonance` |

## Internal (keep in code)

- `VRC` = technical acronym alias for Tetradic Resonance Codex
- `VTRS` = 8-center geometry (technical)
- `/codex` nav → rename label to **Field Index** (not "Codex")

## Retire from UI copy

- Blueprint (redirects only)
- "Static Blueprint" tab label
- "ORIEL Static Signature Codex" as product name

## Implementation checklist

1. Create `wiki/concepts/concept-vossari-naming-taxonomy.md`
2. Update `wiki/index.md`, `entity-static-signature.md`, `entity-vrc-engine.md`, `SCHEMA.md`
3. Update `codex/vrc_static_signature/01_DATA/terminology_map.json`
4. UI: `StaticReading.tsx`, `FounderCuratedBlueprint.tsx`, `signature-products.ts`, `StaticSignature.tsx`, `Protocol.tsx`, `NatalProfile.tsx`
5. Routes: `/static-signature` → `/signature`
6. Log in `wiki/log.md`

## Out of scope for this handoff

- `rgp-engine.ts` retirement
- Drizzle `ninecenters` rename
- v2 engine constants (already done — see `wiki/syntheses/synthesis-v2-canon-resolution-status.md`)

## Verify

- `npx vitest run` + `pnpm run build`
- Smoke: `/signature` tabs, founder product page