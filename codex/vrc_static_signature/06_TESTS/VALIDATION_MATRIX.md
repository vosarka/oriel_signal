# Validation Matrix & QA Test Suite

This document defines the mathematical test suite, timezone edge scenarios, and engine verification rules.

---

## 1. PRIMARY SYSTEM TEST CASE (CALIBRATION VECTOR)

This is the baseline test vector. Any modification to the Swiss Ephemeris bindings, timezone offset conversions, or Mandala index mappings must pass this case before release.

### Inputs

- **Date**: `2024-01-01`
- **Time**: `12:00:00` UTC
- **Coordinates**: $0^\circ \text{N}, 0^\circ \text{E}$ (Geocentric)
- **Timezone**: `UTC`

### Expected Placements (Conscious)

- **Sun Longitude**: $280.55^\circ \pm 0.01^\circ$ (Capricorn)
- **Sun Codon Index**:
  $$\text{index} = \lfloor \frac{280.55 - 11.25}{5.625} \rfloor = \lfloor 47.876 \rfloor = 47$$
- **Mandala Sequence Index 47**: Codon `38` (Struggle / _The Fighter_)
- **Local Degree Offset**:
  $$\text{offset} = (280.55 - 11.25) \pmod{5.625} \approx 4.925^\circ$$
- **Sun Facet Index**:
  $$\text{facet\_index} = \lfloor \frac{4.925}{1.40625} \rfloor = 3 \rightarrow \text{Transpersonal (D)}$$

### Expected Design Calculations (Solar Arc)

- **Design Sun Longitude**:
  $$\lambda_{\text{target}} = (280.55^\circ - 88.0000^\circ) \pmod{360^\circ} = 192.55^\circ \pm 0.01^\circ$$
- **Design Sun Codon Index**:
  $$\text{index} = \lfloor \frac{192.55 - 11.25}{5.625} \rfloor = \lfloor 32.231 \rfloor = 32$$
- **Mandala Sequence Index 32**: Codon `57` (Intuition / _Intuitive Clarity_)
- **Local Degree Offset**:
  $$\text{offset} = (192.55 - 11.25) \pmod{5.625} \approx 1.300^\circ$$
- **Design Sun Facet Index**:
  $$\text{facet\_index} = \lfloor \frac{1.300}{1.40625} \rfloor = 0 \rightarrow \text{Somatic (A)}$$
- **Target Backtrack Date**: Must resolve to the exact second in October 2023 when the Sun reached $192.55^\circ$ Tropical longitude (approximately October 5-6, 2023).

---

## 2. TIMEZONE & CORRECTION TEST CASES

### Case 2: DST Transition Offset Check

- **Local Birth Input**: `2026-03-29 01:30:00` in London (Europe/London).
- **Behavior**: The IANA library must detect that 01:30:00 does not exist on this date due to the forward shift (clocks skip from 01:00 to 02:00 for British Summer Time).
- **Pass Condition**: The system must catch the invalid local time and throw an `INVALID_LOCAL_TIME` error.

### Case 3: Missing Timezone Resolution

- **Birth Input**: `1990-05-15 08:30:00`, Location coordinates missing, City: `"Unknown Island"`.
- **Pass Condition**: The engine must block calculation, return status `DRAFT`, and trigger an `INSUFFICIENT_INPUT_DATA` warning.

---

## 4. STRUCTURAL RESOLUTION TESTS

### Case 4: Reflector Verification

- **Input Placements**: Setup mock placements so that no Resonance Links are active.
- **Pass Condition**:
  - All 8 Centers must return status `OPEN`.
  - Type must evaluate to `REFLECTOR`.
  - Authority must evaluate to `Lunar Cycle`.

### Case 5: Manifesting Resonator Sub-type check

- **Input Placements**: Activate Codons `3` and `60` (link `3-60` connects Origin to Saturation).
- **Pass Condition**:
  - `ORIGIN` and `SATURATION` centers return `DEFINED`.
  - Type evaluates to `RESONATOR`.
  - Subtype evaluates to `Manifesting Resonator`.

### Case 6: Catalyst Type check

- **Input Placements**: Activate Codons `35` and `36` (link `35-36` connects Collapse to Becoming). Ensure Saturation is open.
- **Pass Condition**:
  - `BECOMING` (motor) and `COLLAPSE` return `DEFINED`.
  - Type evaluates to `CATALYST`.
  - Authority evaluates to `Emotional Resonance`.
