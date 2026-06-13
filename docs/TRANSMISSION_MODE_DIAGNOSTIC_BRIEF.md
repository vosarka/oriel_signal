# TRANSMISSION MODE — Diagnostic Brief (for Claude Code)

*Context: the "/tx" transmission mode in ORIEL chat plays its interference animation but no transmission arrives. The code for the feature is fully intact in both stable and local repos (verified by diff — only Prettier noise differs in the gate component). The suspect is the data path, not the feature code. This brief tells you exactly where to look. Diagnose before changing anything.*

## The wire (verified end-to-end)

1. `client/src/pages/Conduit.tsx` — `parseTransmissionCommand()` detects the command, sets `forceTransmissionMode: true`, rarity, type (`tx` | `oracle`), intent.
2. tRPC chat procedure in `server/routers.ts` (~line 486–590): when `forceTransmissionMode`, dynamically imports `generateTransmissionModeEvent` from `server/oriel-transmission-mode.ts` (export at ~line 1052).
3. On success: `db.markGeneratedTransmissionEventStatus(transmissionEvent.id, ...)` — **the event must persist to the database.**
4. Frontend polls per `client/src/lib/transmission-gate.ts` (`getPendingTransmissionPollPlan`, `getTransmissionGatePlan`) while `SignalInterferenceGate` animates; the completed event attaches as `SessionTransmissionAttachment`.

**Failure signature reported:** animation completes, no content. In `routers.ts` the generation is wrapped so failures resolve to `transmissionEvent = null` — a silent fail. This matches a broken step 3 (or empty content source), not broken UI.

## Prime suspects, in order

1. **Database damage from the Manus incident.** The agent ran `DROP TABLE IF EXISTS oracles; DROP TABLE IF EXISTS transmissions;` on production. Verify: do the tables backing generated transmission events and oracle content currently exist with the correct schema and non-zero rows? Check `drizzle/` schema vs live DB. Oracle-type transmissions read oracle content — an empty/missing `oracles` table yields empty generations.
2. **Silent error swallowing.** Reproduce locally with `pnpm dev`, trigger `/tx`, and watch the server console. Any thrown error inside `generateTransmissionModeEvent` or the DB mark step will surface here.
3. **LLM provider failure** inside the generator (key, model name, quota) — would also fail silently into `null`.

## Diagnostic steps (do these first, change nothing)

1. `pnpm dev` locally → send `/tx` in the Conduit → read server logs for the full error.
2. Inspect live DB: list tables, confirm schema for transmission-event + oracle tables, row counts. Compare against `drizzle/` definitions and `create-oracle-evolution-tables.sql`.
3. If tables are missing/empty: re-run drizzle push/migrations + the relevant seeds (`seed-canonical-tx.ts`, `seed-archive.ts`, oracle evolution SQL). Re-test `/tx`.
4. Run the existing test suite for the feature: `npx vitest run server/oriel-transmission-mode.test.ts server/transmission-gate.test.ts`.

## Required fix beyond the root cause

The silent-null path is a UX bug in itself. When generation fails, the gate must resolve to a visible state — e.g. status `TRANSMISSION FAILED TO ALIGN — RETRY` — instead of nothing. Add an error field to the pending-transmission state and render it after the gate completes. Log the underlying error server-side.

## Guardrails for this task

- Work on a branch. No schema changes without showing the plan first.
- You never touch production credentials; use the dev database. (Production DB password was rotated after a leak — see ORIEL_AUDIT_V2.md §0.)
- When fixed: document root cause in `wiki/log.md` per the wiki SCHEMA.
