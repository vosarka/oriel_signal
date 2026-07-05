import { useState } from "react";
import { ROLES, ROLE_VECTORS, CENTER_COLORS, CODON_CENTER_MAP, type Codon } from "./CodonWheel";

export interface FacetDetail {
  title: string;
  degrees: string;
  description: string;
  micro_correction: string;
}

export interface CodonDetail {
  id: number;
  code: string;
  name: string;
  traditional_name: string;
  binary: string;
  chemical_marker: string;
  archetype_role: string;
  somatic_marker: string;
  frequency: {
    shadow: string;
    shadow_desc: string;
    gift: string;
    gift_desc: string;
    siddhi: string;
    siddhi_desc: string;
  };
  facets: {
    A: FacetDetail;
    B: FacetDetail;
    C: FacetDetail;
    D: FacetDetail;
  };
}

export interface CodonDetailPanelProps {
  codon: CodonDetail;
  selectedFacetKey: "A" | "B" | "C" | "D";
  onFacetChange: (key: "A" | "B" | "C" | "D") => void;
  onSelectCodon: (id: number) => void;
}

const PHASE_ROMAN = ["I", "II", "III", "IIII", "IIII'I", "IIII'II", "IIII'III", "IIII'IIII"];

export function CodonDetailPanel({
  codon,
  selectedFacetKey,
  onFacetChange,
  onSelectCodon,
}: CodonDetailPanelProps) {
  const roleIdx = Math.floor((codon.id - 1) / 4);
  const role = ROLES[roleIdx];
  const phaseIdx = Math.floor((codon.id - 1) / 8);
  const phaseRoman = PHASE_ROMAN[phaseIdx];

  // The 4 codons of the current role's tetrad
  const tetradCodonIds = Array.from({ length: 4 }, (_, i) => roleIdx * 4 + 1 + i);

  const activeFacet = codon.facets[selectedFacetKey] || codon.facets.A;

  return (
    <aside className="cz-detail-panel">
      {/* Role Band */}
      <div className="cz-panel-section cz-role-band">
        <div className="cz-flex-between">
          <span
            className="cz-label-ritual"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <img src={ROLE_VECTORS[roleIdx]} alt="" style={{ width: 16, height: 16 }} />
            RESONANCE ROLE
          </span>
          <span className="cz-label-mono">{role?.range} · TETRAD</span>
        </div>
        <h2 className="cz-role-title">{role?.name}</h2>
        <p className="cz-role-desc">{role?.desc}</p>

        {/* Tetrad Facet Picker */}
        <div className="cz-tetrad-row">
          {(["A", "B", "C", "D"] as const).map((key, i) => {
            const tcId = tetradCodonIds[i];
            const isSelected = tcId === codon.id;
            const tcCode = `RC${String(tcId).padStart(2, "0")}`;
            const centerColor = CENTER_COLORS[CODON_CENTER_MAP[tcId] || "Origin"];
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  onSelectCodon(tcId);
                  onFacetChange(key);
                }}
                className={`cz-tetrad-btn ${isSelected ? "is-active" : ""}`}
                style={{
                  border: isSelected ? "1px solid var(--gold)" : "1px solid var(--line)",
                  background: isSelected ? "rgba(205, 161, 74, 0.1)" : "transparent",
                }}
              >
                <div
                  className="cz-tetrad-symbol"
                  style={{
                    border: `1px solid ${centerColor}`,
                    background: "rgba(8, 7, 11, 0.85)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <img
                    src={`/symbols/${tcCode}.png`}
                    alt={tcCode}
                    style={{
                      width: "62%",
                      height: "62%",
                      objectFit: "contain",
                      filter: "brightness(0) invert(1)",
                      opacity: 0.82,
                    }}
                  />
                </div>
                <span
                  className="cz-tetrad-label"
                  style={{ color: isSelected ? "var(--gold2)" : "var(--mut)" }}
                >
                  {key}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Codon Identity */}
      <div className="cz-panel-section cz-identity-band">
        <div className="cz-flex-between cz-label-ritual">
          <span>
            {codon.code} · {codon.binary}
          </span>
          <span style={{ color: "var(--gold)" }}>FAZA {phaseRoman}</span>
        </div>
        <h2 className="cz-codon-title">{codon.name}</h2>
        <p className="cz-codon-subtitle">
          {codon.traditional_name} · {codon.archetype_role}
        </p>
        <div className="cz-metadata-row">
          <span>
            MARKER · <b>{codon.chemical_marker}</b>
          </span>
          <span>
            SOMA · <b>{codon.somatic_marker}</b>
          </span>
        </div>
      </div>

      {/* Spectrum */}
      <div className="cz-panel-section cz-spectrum-band">
        <div className="cz-spectrum-bar">
          <span className="cz-bar-shadow"></span>
          <span className="cz-bar-gift"></span>
          <span className="cz-bar-siddhi"></span>
        </div>
        <div className="cz-frequencies">
          <div className="cz-freq-block">
            <span className="cz-freq-label is-shadow">SHADOW · {codon.frequency.shadow}</span>
            <p className="cz-freq-desc">{codon.frequency.shadow_desc}</p>
          </div>
          <div className="cz-freq-block">
            <span className="cz-freq-label is-gift">GIFT · {codon.frequency.gift}</span>
            <p className="cz-freq-desc">{codon.frequency.gift_desc}</p>
          </div>
          <div className="cz-freq-block">
            <span className="cz-freq-label is-siddhi">SIDDHI · {codon.frequency.siddhi}</span>
            <p className="cz-freq-desc">{codon.frequency.siddhi_desc}</p>
          </div>
        </div>
      </div>

      {/* Facet Detail */}
      <div className="cz-panel-section cz-facet-band">
        <div className="cz-flex-between">
          <span className="cz-label-ritual is-active">{activeFacet?.title?.toUpperCase()} FACET</span>
          <span className="cz-label-mono">{activeFacet?.degrees}</span>
        </div>
        <p className="cz-facet-desc">{activeFacet?.description}</p>
        <div className="cz-micro-correction">
          <span className="cz-correction-header">MICRO-CORRECTION</span>
          <p className="cz-correction-desc">{activeFacet?.micro_correction}</p>
        </div>
      </div>
    </aside>
  );
}
