import * as React from "react";
import {
  FACETS,
  type CodonLayerActivationSummary,
  type Facet,
  type Layer,
} from "@shared/codon-wheel";
import {
  ROLES,
  ROLE_VECTORS,
  CENTER_COLORS,
  CODON_CENTER_MAP,
  type Codon,
  type WheelSignatureContext,
} from "./CodonWheel";

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
  selectedFacetKey: Facet;
  selectedLayer: Layer;
  signatureContext: WheelSignatureContext;
  onFacetChange: (key: Facet) => void;
  onLayerChange: (layer: Layer) => void;
  onSelectCodon: (id: number) => void;
}

const PHASE_ROMAN = ["I", "II", "III", "IIII", "IIII'I", "IIII'II", "IIII'III", "IIII'IIII"];
const FACET_NAMES: Readonly<Record<Facet, string>> = {
  A: "Somatic",
  B: "Relational",
  C: "Cognitive",
  D: "Transpersonal",
};

function describeLayer(summary: CodonLayerActivationSummary) {
  if (summary.activations.length === 0) return "NOT PRESENT";
  return summary.facets
    .map(facet => {
      const planets = summary.activations
        .filter(activation => activation.facet === facet)
        .map(activation => activation.planet);
      return `${facet} · ${planets.join(", ")}`;
    })
    .join(" / ");
}

export function CodonDetailPanel({
  codon,
  selectedFacetKey,
  selectedLayer,
  signatureContext,
  onFacetChange,
  onLayerChange,
  onSelectCodon,
}: CodonDetailPanelProps) {
  const roleIdx = Math.floor((codon.id - 1) / 4);
  const role = ROLES[roleIdx];
  const phaseIdx = Math.floor((codon.id - 1) / 8);
  const phaseRoman = PHASE_ROMAN[phaseIdx];

  // The 4 codons of the current role's tetrad
  const tetradCodonIds = Array.from({ length: 4 }, (_, i) => roleIdx * 4 + 1 + i);

  const activeFacet = codon.facets[selectedFacetKey] || codon.facets.A;
  const signatureSummary =
    signatureContext.mode === "mine" &&
    signatureContext.summary?.codonId === codon.id
      ? signatureContext.summary
      : null;
  const selectedCellActivations =
    signatureSummary?.[selectedLayer].activations.filter(
      activation => activation.facet === selectedFacetKey
    ) ?? [];
  const signatureHeader =
    signatureSummary?.presence === "both"
      ? "IN YOUR SIGNATURE · BOTH LAYERS"
      : signatureSummary?.presence === "conscious"
        ? "IN YOUR SIGNATURE · CONSCIOUS LAYER"
        : signatureSummary?.presence === "design"
          ? "IN YOUR SIGNATURE · DESIGN LAYER"
          : "NOT ACTIVATED IN YOUR SIGNATURE";
  const convergenceCopy =
    signatureSummary?.presence !== "both"
      ? null
      : signatureSummary.exactSharedFacets.length > 0
        ? `Exact codon-facet convergence at ${signatureSummary.exactSharedFacets.join(", ")}.`
        : "Same codon, different facet expression.";

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

        {/* The four codons in this role; facet and layer are independent. */}
        <div className="cz-tetrad-row">
          {tetradCodonIds.map(tcId => {
            const isSelected = tcId === codon.id;
            const tcCode = `RC${String(tcId).padStart(2, "0")}`;
            const centerColor = CENTER_COLORS[CODON_CENTER_MAP[tcId] || "Origin"];
            return (
              <button
                key={tcId}
                type="button"
                data-control-kind="tetrad-codon"
                aria-label={`Select ${tcCode}`}
                aria-pressed={isSelected}
                onClick={() => onSelectCodon(tcId)}
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
                  {tcCode}
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

        {/* 5 empty/fill nodes from binary code (for Bio-Arch lists/panels; not inside wheel) */}
        {codon.binary && (
          <div style={{ display: 'inline-flex', gap: 3, margin: '4px 0 8px', alignItems: 'center' }}>
            {codon.binary.slice(0, 5).split('').map((bit, idx) => (
              <span
                key={idx}
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  border: '1px solid var(--gold)',
                  background: bit === '1' ? 'var(--cyan)' : 'transparent',
                  display: 'inline-block',
                }}
                title={`bit ${idx + 1}: ${bit}`}
              />
            ))}
            <span style={{ fontSize: 9, color: 'var(--mut)', marginLeft: 4, fontFamily: 'var(--font-ritual)' }}>
              {codon.binary.slice(0,5)}
            </span>
          </div>
        )}

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
        <div className="cz-cell-address">
          <div className="cz-flex-between">
            <span className="cz-label-ritual">CELL ADDRESS</span>
            <span className="cz-label-mono">
              {codon.code} · {selectedLayer.toUpperCase()} · {selectedFacetKey}
            </span>
          </div>

          <div
            className="cz-layer-picker"
            role="group"
            aria-label="Expression layer"
          >
            {(["conscious", "design"] as const).map(layer => {
              const active = selectedLayer === layer;
              return (
                <button
                  key={layer}
                  type="button"
                  data-control-kind="layer"
                  className={`cz-layer-btn is-${layer} ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onLayerChange(layer)}
                >
                  <span>{layer === "conscious" ? "CONSCIOUS" : "DESIGN"}</span>
                  <small>
                    {layer === "conscious"
                      ? "OUTER · PERSONALITY"
                      : "INNER · UNCONSCIOUS"}
                  </small>
                </button>
              );
            })}
          </div>

          <div
            className="cz-facet-picker"
            role="group"
            aria-label="Codon facet"
          >
            {FACETS.map(facet => {
              const active = selectedFacetKey === facet;
              return (
                <button
                  key={facet}
                  type="button"
                  data-control-kind="facet"
                  className={`cz-facet-btn ${active ? "is-active" : ""}`}
                  aria-pressed={active}
                  onClick={() => onFacetChange(facet)}
                >
                  <b>{facet}</b>
                  <span>{FACET_NAMES[facet]}</span>
                </button>
              );
            })}
          </div>
        </div>

        <div
          className={`cz-signature-context is-${signatureContext.mode}`}
          data-signature-mode={signatureContext.mode}
          aria-live="polite"
        >
          {signatureContext.mode === "mine" ? (
            signatureSummary ? (
              <>
                <div className="cz-flex-between">
                  <span className="cz-signature-status">{signatureHeader}</span>
                  <span className="cz-selected-cell-status">
                    {selectedCellActivations.length > 0
                      ? `SELECTED CELL · ${selectedCellActivations.map(row => row.planet).join(", ")}`
                      : "SELECTED CELL · NOT ACTIVE"}
                  </span>
                </div>
                <dl className="cz-layer-readout">
                  <div>
                    <dt>CONSCIOUS</dt>
                    <dd>{describeLayer(signatureSummary.conscious)}</dd>
                  </div>
                  <div>
                    <dt>DESIGN</dt>
                    <dd>{describeLayer(signatureSummary.design)}</dd>
                  </div>
                </dl>
                {convergenceCopy && (
                  <p className="cz-convergence-copy">{convergenceCopy}</p>
                )}
              </>
            ) : (
              <span className="cz-signature-status">
                SIGNATURE CONTEXT · READING
              </span>
            )
          ) : (
            <>
              <span className="cz-signature-status">FIELD ADDRESS</span>
              <p className="cz-convergence-copy">
                Full Field shows the universal 512-cell structure. Personal
                activation data remains hidden.
              </p>
            </>
          )}
          <span className="cz-current-reading">
            CURRENTLY READING · {selectedLayer.toUpperCase()} · FACET{" "}
            {selectedFacetKey}
          </span>
        </div>

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
