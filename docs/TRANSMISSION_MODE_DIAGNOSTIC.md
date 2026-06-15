# Transmission Mode Diagnostic

The /transmission command in ORIEL Conduit triggers the
SignalInterferenceGate animation ("signal acquiring") but
never delivers content — polling loops indefinitely.
It worked once at 20-30 seconds then stopped.
Intermittent silent failure.

## The wire
1. Conduit.tsx: detects /transmission command,
   sets forceTransmissionMode: true
2. server/routers.ts: calls generateTransmissionModeEvent
   from server/oriel-transmission-mode.ts
3. Success: db.markGeneratedTransmissionEventStatus()
   persists event with status "complete"
4. Frontend polls via client/src/lib/transmission-gate.ts
   waiting for status "complete"

Failures resolve to null silently.
Polling never gets "complete". Gate loops forever.

## Prime suspects in order
1. Empty oracles table — previous agent ran
   DROP TABLE IF EXISTS oracles.
   Table may exist but be empty. Oracle-type transmissions
   need content rows to pull from.
2. LLM provider error inside generateTransmissionModeEvent
   — API key, model name, quota, or timeout.
   Fails silently into null.
3. Missing DB status update after generation completes.

## Diagnostic steps — diagnose first, fix second
1. pnpm dev locally
2. Open server logs
3. Send /transmission in Conduit
4. Copy the FULL server console output
5. Check: SELECT COUNT(*) FROM oracles;
           SELECT COUNT(*) FROM transmissions;
6. Run: npx vitest run server/oriel-transmission-mode.test.ts
7. Report all findings. Do not touch code yet.

## Required UX fix regardless of root cause
When generation fails or times out, gate MUST resolve to:
"TRANSMISSION FAILED TO ALIGN — RETRY"
Never leave the user in infinite "signal acquiring".
