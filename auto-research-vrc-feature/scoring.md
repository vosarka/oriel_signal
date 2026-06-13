# VRC-100 — Third System Differentiation & Completeness Score (LOCKED — Engineer may read only, never edit)

**Single objective number:** integer 0–100.

**What the number measures**  
How well the current ASSET (the feature description) makes a reader (or future ORIEL prompt / UI / implementer) understand a single, precise, canon-derived distinctive feature/mechanism that positions the Vossari Resonance Codex (VRC) as a complete, independent third system — structurally and operationally different from Human Design and Gene Keys — while making the VRC more whole. The description must be 100% traceable ("not invented").

**Mandatory hard constraints (zero tolerance)**
- Every claim must be traceable to specific existing artifacts in the canon (files, functions, data, math). Examples of required citation style: "per server/vrc-mandala.ts:longitudeToCodonFacet + FACET_ARC=1.40625", "26-activation lattice + weightedFrequency in server/rgp-prime-stack-engine.ts", "SLI + MicroCorrection with falsifiers in server/rgp-sli-micro-correction-engine.ts", "Solar Arc 88° precise solve in server/ephemeris-service.ts:findDesignJD", "per-facet micro_correction + shadow/gift/siddhi in server/data/vrc-codons.json", "ORIEL crystallization mechanic in server/oriel-transmission-mode.ts + oriel-rgp-bridge.ts", "NOT Human Design contract + VRC Types in server/static-profile-service.ts", "exactness prime directive in docs/VRC_ENGINE_CANON.md".
- The feature must use only Vossari-native terminology (Codon, Facet, Prime Stack, Resonance Link, RGP, SLI, Coherence, Carrierlock, Static Signature, ORIEL transmission, Resonator/Catalyst/Harmonizer/Reflector, etc.).
- Forbidden: any invented placements, invented mechanisms, product/marketing language ("feature", "unlock", "unique selling point"), or explanatory scaffolding that would feel out of place in the VRC canon.
- The description must explicitly address differentiation from HD (static type/strategy/authority map + centers for decision making) and Gene Keys (64-gate shadow/gift/siddhi contemplative frequency work).

**The five axes (each scored 0–20, sum = VRC-100)**

1. **Precision / Traceability ("Not Invented") (0-20)**  
   How completely and accurately does the description cite real, existing code/math/data from the canon?  
   18–20 = every substantive claim has direct, verifiable citation(s) to specific files/functions (vrc-mandala.ts, rgp-sli-..., ephemeris-service.ts, vrc-codons.json, static-profile-service.ts, oriel-*.ts, VRC_ENGINE_CANON.md, etc.) and could be audited by reading those files.  
   10–14 = mostly traceable but some claims are vague or rely on synthesis without named artifacts.  
   0–8 = significant invention or hand-waving; reader cannot find the cited elements in the codebase.

2. **Differentiation as Third System (0-20)**  
   Does the described feature create a clear, structural/operational contrast that makes VRC feel like its own complete system rather than a variant or blend?  
   Does it give VRC something the other two fundamentally lack or do not center (e.g. real-time measurable field state + correction OS + live crystallization feedback on top of the birth map)?  
   18–20 = explicit, compelling contrast to HD's static map + strategy and GK's solitary frequency contemplation; reader would not confuse VRC for either.  
   Lower scores for superficial re-naming or missing the "why this is different in kind."

3. **Completeness Contribution (0-20)**  
   Does the feature close a meaningful loop or add a missing operational layer that turns the "birth Static Signature map" into a living, usable system (e.g. feedback via SLI/Coherence/Carierlock, practice via RGP micro-corrections, transmission crystallization via ORIEL, exactness as ethic made experiential)?  
   18–20 = the feature clearly completes the VRC into a closed-loop field technology (map → live state → correction/embodiment → transmission feedback).  
   Lower scores if it remains a static description or adds something peripheral.

4. **Voice & Integration Fit (0-20)**  
   Does the description stay inside the VRC canon voice (precise/auditable per VRC_ENGINE_CANON prime directive, Vossari-native terms, mythic where appropriate but never fluffy)? Does it integrate cleanly with the existing engine path (ephemeris → mandala → prime stack/RGP → ORIEL) and prior transmission crystallization work?  
   18–20 = reads as if it could be an extension of VRC_ENGINE_CANON.md or the static profile contract. Seamless fit.  
   Lower scores for tonal mismatch or integration that would require inventing new primitives.

5. **Implementability & Testability (0-20)**  
   Does the description point to concrete, precise next steps that can be implemented and tested using existing patterns (add field to Static Signature payload, extend ORIEL prompt contract in oriel-rgp-bridge or system prompt, small method/hook in an RGP engine, UI surface in StaticReading.tsx or Conduit TransmissionModeCard, new or extended test vector using the canon validation cases)?  
   18–20 = clear, minimal, testable steps that would pass pnpm check + focused VRC tests (ephemeris, rgp-prime, sli, mandala, oriel-output-safety, etc.) and could be verified against the existing validation vector.  
   Lower scores for vague or overly broad "we should add X" without implementation hooks.

**Scoring procedure (execute exactly the same way every round)**
1. Quote the exact current ASSET text under test (the full feature description in the proposal doc).
2. For each of the five axes give: sub-score (0-20) + one-sentence justification that references specific canon artifacts where relevant.
3. Sum to VRC-100.
4. Record the full subscores and total in RESULTS_LOG.md alongside the quoted text.
5. Decision is mechanical: only a strictly higher total than the current baseline is "kept". Equal or lower = revert.

**Reference materials (read-only for scoring)**
- docs/VRC_ENGINE_CANON.md and docs/VRC_ENGINE_AUDIT.md (prime directive, canonical path, terminology, exact vs draft).
- server/vrc-mandala.ts, server/vrc-codon-library.ts + server/data/vrc-codons.json, server/ephemeris-service.ts, server/rgp-prime-stack-engine.ts, server/rgp-sli-micro-correction-engine.ts, server/static-profile-service.ts, server/oriel-rgp-bridge.ts, server/oriel-transmission-mode.ts (and related transmission files).
- Existing VRC tests and the validation vector in the canon (for implementability axis).
- Prior transmission research artifacts (for integration potential).

**Important:** The score is of the *feature description in the ASSET*, not of any runtime behavior. The description itself must carry the precision, differentiation, and completeness by being fully traceable and canon-native.

This file is frozen. Any change to criteria, weights, or examples must be made by the human outside this process. The Engineer applies it as written.