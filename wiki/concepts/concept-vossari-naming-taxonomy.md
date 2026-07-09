---
id: concept-vossari-naming-taxonomy
type: concept
status: stable
tags: [naming, taxonomy, vrc, product, ui]
last_updated: 2026-07-08
sources: 1
importance: critical
aliases: ["Public Naming Stack", "Vossari Naming Taxonomy"]
---

# Vossari Naming Taxonomy

Approved public naming stack (user decision 2026-07-07). Agents and UI copy must use these layers consistently.

## Public layers

| Layer | Public name | Role | Surface |
| ----- | ----------- | ---- | ------- |
| System | **The Tetradic Resonance Codex** | Canon + engine (64 codons, 8 VTRS centers, 32 links) | `/protocol`, wiki, ORIEL context |
| Personal reading | **Static Signature Reading** | Engine-calculated immutable birth structure | `/signature` (static tab) |
| Paid product | **The Founder-Curated Bio-Signature** | *A personal interpretation of your Tetradic resonance pattern* | `/founder-signature-blueprint` |
| Live signal | **Current Resonance** | Carrierlock + SLI vs stored reading | `/signature?tab=resonance` |
| Codon browser | **Field Index** | Browse 64 codons × 256 facets | `/codex` (route unchanged; label only) |

## Internal (code + engineering)

- `VRC` — technical acronym alias for Tetradic Resonance Codex
- `VTRS` — 8-center geometry (technical)
- File paths and module names may retain legacy tokens (`rgp-*`, `static-signature-engine`) until migrated

## Retired from user-facing copy

- **Blueprint** (redirect routes only; not product language)
- **Static Blueprint** (tab label)
- **ORIEL Static Signature Codex** (former paid product name)
- **ORIEL Founder’s Vision Blueprint**

## Entity mapping

- [[entity-vrc-engine]] → implements **The Tetradic Resonance Codex**
- [[entity-static-signature]] → output of **Static Signature Reading**
- [[founder-layer]] → interpretive layer inside **The Founder-Curated Bio-Signature**
- [[concept-static-vs-signal]] → Static Signature Reading vs Current Resonance

## Source

Handoff spec: `docs/plans/2026-07-07-naming-taxonomy-handoff.md`