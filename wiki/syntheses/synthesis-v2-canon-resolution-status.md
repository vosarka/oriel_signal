---
id: synthesis-v2-canon-resolution-status
type: synthesis
status: living
tags: [vtrs, v2, migration, canon, checklist]
last_updated: 2026-07-07
sources: 4
importance: critical
aliases: ["V2 Canon Resolution Status", "Canon v2 alignment checklist"]
---

# V2 Canon Resolution — Status & Next Steps

Living checklist for aligning live code, UI, and wiki with [[source-consciousness-lattice-v2]] (8 Tetradic centers, 32 resonance links). Tracks the session resolution plan executed 2026-07-07.

## Authority

- Active center/link canon: [[source-consciousness-lattice-v2]]
- Migration priorities: [[source-consciousness-lattice-v2-integration-roadmap]]
- ORIEL data contract: [[concept-oriel-vrc-bridge-contract]], [[synthesis-oriel-vrc-narration-safety]]

## Completed (runtime + wiki)

| Phase | Scope | Status |
|-------|--------|--------|
| 0 | Wiki contract pages updated to 8/32; v1 sources marked superseded | Done |
| 1 | `server/data/vrc-engine-constants.json` regenerated (8/32); `scripts/generate-vrc-engine-constants.mjs`; `server/vrc-engine-constants.test.ts` | Done |
| 2A | `SignalCheck` → `rgp.dynamicState` + `codex.saveReading`; SLI inline; link to `/signature?tab=resonance` | Done |
| 3 | `Protocol.tsx` copy (8 centers, SLI formula); `ResonanceBody.tsx` marked legacy lab | Done |
| UI | Current Resonance as tab on `/signature` (not orphan route); redirects from `/current-resonance`, `/resonance`, `/reading/dynamic/:id` | Done |
| 4 | `oriel-diagnostic-engine.ts` migrated off `vossari-codex-knowledge.ts` → `rgp-coherence`, `rgp-256-codon-engine`, `vrc-codon-library`, VTRS center names | Done |
| Ingest | [[source-unified-signal-comprehensive-guide]] (receiver digest, not new engineering canon) | Done |

**Tests:** 608/608 passing (includes `oriel-diagnostic-engine.test.ts`, `vrc-engine-constants.test.ts`).

## Live user path (verified design)

1. Natal / static profile → `/signature` tab **Static Blueprint**
2. Signal Check (authenticated + static profile) → SLI calculated and reading saved
3. `/signature?tab=resonance` → embedded `DynamicReadingPanel` (coherence, SLI table, transmission)

## Remaining (intentional legacy / doc debt)

| Item | Layer | Notes |
|------|--------|-------|
| ~~`rgp-engine.ts` + `vossari-codex-knowledge.ts`~~ | Runtime | **Removed** 2026-07-07; tests migrated to `rgp-coherence`, `vrc-codon-library`, existing static/SLI suites |
| `codex/vrc_static_signature/` | Docs | CANON_MASTER and siblings still describe 9/36; needs legacy banners or archive |
| `ninecenters` / `circuitLinks` DB fields | Schema | Legacy names; store v2 data alongside `channelStatuses`; rename via proposed Drizzle migration only |
| `CurrentResonance.tsx` | Client | Unrouted; superseded by signature tab |
| `ResonanceBody.tsx` | Client | `/resonance-body` legacy lab (9-center visualization) |
| ~~Broken wiki links~~ | Wiki | **Repaired** 2026-07-08 — `scripts/wiki-lint.py` passes (0 ghosts) |
| `entity-consciousness-lattice` status | Wiki | Keep in sync with this page |

## Recommended next steps (order)

1. ~~**Commit** branch `feature/cosmichronica-spiral-remembers`~~ — done (`70c0ea7`)
2. ~~**Naming taxonomy**~~ — done 2026-07-08; see [[concept-vossari-naming-taxonomy]] and `docs/plans/2026-07-07-naming-taxonomy-handoff.md`
3. **Doc cleanup** — superseded banner on `codex/vrc_static_signature/00_CANON/CANON_MASTER.md` (in progress)
4. ~~**Wiki lint**~~ — done 2026-07-08 (`scripts/wiki-lint.py`, 36 stubs, 24 pages repointed)
5. ~~**Retire** `rgp-engine.ts`~~ — done (`94fdcf1` follow-up commit)
6. **Schema proposal** — optional rename `ninecenters` → `vtrsCenters` (human approval + Drizzle migration)

## What this is not

- Not a visual redesign of `/signature` (spine alignment, not new UI chrome)
- Not full retirement of all v1 documents (historical sources stay with superseded notices)
- Not production DB migration (no destructive SQL in this track)

See [[entity-consciousness-lattice]] and [[entity-vrc-engine]] for entity-level context. Session log: `wiki/log.md` entries 2026-07-07.

---
*Maintained by agents. Update this checklist when a phase completes or scope changes.*