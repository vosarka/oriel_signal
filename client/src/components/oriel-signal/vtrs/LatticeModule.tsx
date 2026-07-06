import { useMemo, useState } from "react";
import { VTRS_CENTERS, CENTER_COLORS } from "./vtrs-data";

// The 512-Node Address Space: 64 codons × 4 facets × 2 layers = 512 = 2⁹.
// Every expression node has a unique 9-bit address:
//   bit 8    — Layer   (0 Conscious/Personality, 1 Unconscious/Design)
//   bits 7–6 — Facet   (00 Somatic A, 01 Relational B, 10 Cognitive C, 11 Transpersonal D)
//   bits 5–3 — Codon position within its Center (0–7)
//   bits 0–2 — Center index (0–7, Origin…Omega)
// Spec worked example: 0b110110100 = 436 → Codon 57 · Facet C · Design.

const FACETS = [
  { code: "00", letter: "A", name: "Somatic" },
  { code: "01", letter: "B", name: "Relational" },
  { code: "10", letter: "C", name: "Cognitive" },
  { code: "11", letter: "D", name: "Transpersonal" },
];

const BIT_GROUPS = [
  { label: "LAYER", bits: [8] },
  { label: "FACET", bits: [7, 6] },
  { label: "CODON POSITION", bits: [5, 4, 3] },
  { label: "CENTER", bits: [2, 1, 0] },
];

// Initial state = the spec's worked example: 0b110110100
const INITIAL_BITS = [1, 1, 0, 1, 1, 0, 1, 0, 0]; // index 0 = bit 8 (MSB) … index 8 = bit 0 (LSB)

export function LatticeModule() {
  const [bits, setBits] = useState<number[]>(INITIAL_BITS);

  const decoded = useMemo(() => {
    // bits array is MSB-first: [bit8, bit7, ..., bit0]
    const value = bits.reduce((acc, b) => (acc << 1) | b, 0);
    const layerBit = bits[0];
    const facetIdx = (bits[1] << 1) | bits[2];
    const posIdx = (bits[3] << 2) | (bits[4] << 1) | bits[5];
    const centerIdx = (bits[6] << 2) | (bits[7] << 1) | bits[8];

    const center = VTRS_CENTERS[centerIdx];
    const codon = center?.codons[posIdx] ?? null;
    const facet = FACETS[facetIdx];
    const layer = layerBit === 0 ? "CONSCIOUS · PERSONALITY (T_birth)" : "DESIGN · UNCONSCIOUS (T_design)";

    return { value, binary: bits.join(""), center, codon, facet, layer, posIdx };
  }, [bits]);

  const toggleBit = (index: number) => {
    setBits(prev => prev.map((b, i) => (i === index ? 1 - b : b)));
  };

  return (
    <div className="vtrs-module">
      <header className="vtrs-module__head">
        <span className="vtrs-module__eyebrow">MODULE 03 · THE 512-NODE ADDRESS SPACE</span>
        <h2 className="vtrs-module__title">The Lattice Decoder</h2>
        <p className="vtrs-module__lede">
          64 codons × 4 facets × 2 layers = 512 = 2⁹. Every point of the consciousness lattice has
          a unique 9-bit address. Flip the bits — the node resolves in O(1).
        </p>
      </header>

      {/* Bit toggles */}
      <div className="lattice-bit-groups">
        {BIT_GROUPS.map(group => (
          <div key={group.label} className="lattice-bit-group">
            <span className="lattice-bit-group__label">{group.label}</span>
            <div className="lattice-bit-group__cells">
              {group.bits.map(bitNo => {
                const idx = 8 - bitNo; // convert bit number to array index (MSB-first)
                const on = bits[idx] === 1;
                return (
                  <button
                    key={bitNo}
                    type="button"
                    className={`lattice-bit ${on ? "is-on" : ""}`}
                    onClick={() => toggleBit(idx)}
                    title={`bit ${bitNo}`}
                  >
                    <span className="lattice-bit__no">b{bitNo}</span>
                    <span className="lattice-bit__val">{bits[idx]}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Big readout */}
      <div className="lattice-readout">
        <div className="lattice-readout__binary">
          0b{decoded.binary} <span className="lattice-readout__arrow">→</span> DECIMAL {decoded.value}
        </div>
        <div className="lattice-readout__node">
          {decoded.codon !== null ? (
            <>
              <b style={{ color: CENTER_COLORS[decoded.center.id] }}>
                RC{String(decoded.codon).padStart(2, "0")}
              </b>
              {" · FACET "}
              <b>{decoded.facet.letter}</b> ({decoded.facet.name})
              {" · "}
              <b>{decoded.layer}</b>
            </>
          ) : (
            <b>UNMAPPED POSITION</b>
          )}
        </div>
        <div className="lattice-readout__detail">
          CENTER {decoded.center?.roman} — {decoded.center?.name?.toUpperCase()} · POSITION{" "}
          {decoded.posIdx} OF [{decoded.center?.codons.map(c => `RC${String(c).padStart(2, "0")}`).join(" ")}]
        </div>
      </div>

      <div className="vtrs-captions">
        <p>
          <b>64 × 4 × 2 = 512 = 2⁹</b> — the node count is a clean power of two: a 9-bit register
          space where every behavioral expression state is directly addressable.
        </p>
        <p>
          <b>Worked example</b> — 0b110110100 (decimal 436) resolves to Codon 57, Cognitive Facet,
          Design layer: the exact case from the specification.
        </p>
      </div>
    </div>
  );
}
