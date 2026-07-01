import { useEffect, useState } from "react";
import Layout from "@/components/Layout";
import { PageHeaderBand } from "@/components/oriel-signal/PageHeaderBand";
import { SignalPageShell } from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";
import { CodonWheel, type Codon } from "@/components/oriel-signal/CodonWheel";
import { CodonDetailPanel, type CodonDetail } from "@/components/oriel-signal/CodonDetailPanel";
import { RoleGrid } from "@/components/oriel-signal/RoleGrid";
import { Spinner } from "@/components/ui/spinner";

export default function BioArchitecture() {
  const [codons, setCodons] = useState<CodonDetail[] | null>(null);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [selectedFacetKey, setSelectedFacetKey] = useState<"A" | "B" | "C" | "D">("A");
  const [activeRoleIdx, setActiveRoleIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch("/codons.json")
      .then((res) => res.json())
      .then((data) => {
        setCodons(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load codons master:", err);
        setLoading(false);
      });
  }, []);

  const selectedCodon = codons?.find((c) => c.id === selectedId) || codons?.[0];

  return (
    <Layout>
      <SignalPageShell chamber="codex" className="bio-architecture-page">
        <SacredGeometryField static />
        
        <style>{`
          .bio-architecture-page {
            min-height: 100vh;
            padding: clamp(6rem, 10vw, 8rem) 1.5rem 6rem;
            background: radial-gradient(150% 90% at 50% -5%, #110d14 0%, #08070b 55%, #060508 100%);
          }

          .bio-architecture-page__wrap {
            position: relative;
            z-index: 1;
            width: min(1500px, 100%);
            margin: 0 auto;
          }

          .bio-architecture-page__intro {
            margin: 1.5rem 0 2.5rem;
          }

          .bio-architecture-page__voice {
            margin: 0;
            color: #cbc1ac;
            font-family: var(--font-voice, serif);
            font-style: italic;
            font-size: clamp(1.1rem, 2vw, 1.4rem);
            line-height: 1.55;
            max-width: 860px;
          }

          /* Main layout grid: Wheel Left | Panel Right */
          .cz-bio-grid {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 420px;
            gap: clamp(1.5rem, 4vw, 3.5rem);
            align-items: start;
            margin-top: 2rem;
          }

          @media (max-width: 1080px) {
            .cz-bio-grid {
              grid-template-columns: 1fr;
              gap: 3rem;
            }
          }

          /* ── Detail Panel Styles (matching prototype) ────────────────── */
          .cz-detail-panel {
            border: 1px solid var(--line);
            background: rgba(20, 17, 12, 0.45);
            backdrop-filter: blur(8px);
            font-family: 'Cormorant Garamond', Georgia, serif;
          }

          .cz-panel-section {
            padding: 20px 24px;
            border-bottom: 1px solid var(--line);
          }

          .cz-role-band {
            background: rgba(205, 161, 74, 0.04);
          }

          .cz-flex-between {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }

          .cz-label-ritual {
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            letter-spacing: 0.18em;
            color: var(--gold);
          }

          .cz-label-ritual.is-active {
            color: var(--gold2);
          }

          .cz-label-mono {
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            color: var(--mut);
          }

          .cz-role-title {
            font-size: 30px;
            font-family: var(--font-display, serif);
            font-weight: 500;
            margin: 5px 0 4px;
            letter-spacing: 0.03em;
            color: var(--ink);
            line-height: 1.1;
          }

          .cz-role-desc {
            font-size: 14.5px;
            color: #b8af9b;
            margin: 0;
            line-height: 1.45;
            font-style: italic;
            font-family: var(--font-voice, serif);
          }

          /* Tetrad picker */
          .cz-tetrad-row {
            display: flex;
            gap: 6px;
            margin-top: 14px;
          }

          .cz-tetrad-btn {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 5px;
            padding: 8px 4px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .cz-tetrad-btn:hover {
            background: rgba(205, 161, 74, 0.05);
          }

          .cz-tetrad-symbol {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            overflow: hidden;
            border: 1px solid var(--line);
            background: rgba(8, 7, 11, 0.8);
          }

          .cz-tetrad-symbol img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .cz-tetrad-label {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.06em;
          }

          /* Codon identity */
          .cz-identity-band {
            padding: 20px 24px;
          }

          .cz-codon-title {
            font-size: 34px;
            font-family: var(--font-display, serif);
            font-weight: 600;
            margin: 6px 0 1px;
            letter-spacing: 0.02em;
            line-height: 0.95;
            color: var(--ink);
          }

          .cz-codon-subtitle {
            font-style: italic;
            font-family: var(--font-voice, serif);
            font-size: 15px;
            color: #b8af9b;
            margin: 0;
          }

          .cz-metadata-row {
            display: flex;
            gap: 18px;
            font-family: var(--font-ritual, monospace);
            font-size: 9.5px;
            letter-spacing: 0.1em;
            color: var(--mut);
            margin-top: 14px;
          }

          .cz-metadata-row b {
            color: var(--ink);
            font-weight: 400;
          }

          /* Spectrum (Shadow / Gift / Siddhi) */
          .cz-spectrum-bar {
            display: flex;
            height: 5px;
            border-radius: 3px;
            overflow: hidden;
            margin-bottom: 15px;
            background: rgba(205, 161, 74, 0.08);
          }

          .cz-bar-shadow {
            flex: 1;
            background: var(--red);
            box-shadow: 0 0 8px var(--red);
          }

          .cz-bar-gift {
            flex: 1;
            background: var(--gold);
            box-shadow: 0 0 8px var(--gold);
          }

          .cz-bar-siddhi {
            flex: 1;
            background: #efe6cf;
            box-shadow: 0 0 8px #efe6cf;
          }

          .cz-frequencies {
            display: flex;
            flex-direction: column;
            gap: 12px;
          }

          .cz-freq-block {
            display: flex;
            flex-direction: column;
          }

          .cz-freq-label {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.14em;
          }

          .cz-freq-label.is-shadow { color: var(--red); }
          .cz-freq-label.is-gift { color: var(--gold2); }
          .cz-freq-label.is-siddhi { color: #e7ddc6; }

          .cz-freq-desc {
            margin: 3px 0 0;
            font-size: 14px;
            color: #b8af9b;
            line-height: 1.45;
          }

          /* Facet Detail */
          .cz-facet-band {
            border-bottom: none;
          }

          .cz-facet-desc {
            font-size: 14.5px;
            color: #cbc1ac;
            line-height: 1.5;
            margin: 9px 0 0;
          }

          .cz-micro-correction {
            border-left: 2px solid var(--cyan);
            padding-left: 12px;
            margin-top: 14px;
            background: rgba(111, 183, 199, 0.03);
            padding-top: 6px;
            padding-bottom: 6px;
          }

          .cz-correction-header {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.14em;
            color: var(--cyan);
            display: block;
          }

          .cz-correction-desc {
            font-size: 13.5px;
            color: #cbc1ac;
            margin: 4px 0 0;
            line-height: 1.45;
            font-style: italic;
            font-family: var(--font-voice, serif);
          }

          /* ── 16 Role Grid Styles (matching prototype) ────────────────── */
          .cz-role-legend {
            width: 100%;
            border-top: 1px solid var(--line);
            padding-top: 24px;
            margin-top: 3rem;
            font-family: 'Cormorant Garamond', Georgia, serif;
          }

          .cz-legend-header {
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            letter-spacing: 0.24em;
            color: var(--mut);
            margin: 0 0 14px;
          }

          .cz-legend-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
            gap: 1px;
            background: var(--line);
            border: 1px solid var(--line);
          }

          .cz-legend-card {
            padding: 12px 14px;
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .cz-legend-card:hover {
            background: #15120c !important;
          }

          .cz-legend-card-header {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }

          .cz-legend-card-name {
            font-size: 16px;
            color: var(--ink);
            letter-spacing: 0.02em;
          }

          .cz-legend-card-range {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            color: var(--mut);
          }

          .cz-legend-card-sub {
            display: block;
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.04em;
            color: var(--gold);
            margin-top: 2px;
          }
        `}</style>

        <main className="bio-architecture-page__wrap">
          <PageHeaderBand
            title="THE CODON WHEEL"
            descriptor="BIO-ARCHITECTURE · THE RESONANCE MANDALA"
            symbol="lattice"
            width="100%"
          />

          <section className="bio-architecture-page__intro" aria-label="Introduction">
            <p className="bio-architecture-page__voice">
              Sixty-four codons, sealed in sixteen Resonance Roles. Each role governs a tetrad — four codons, one for each facet: Somatic, Relational, Cognitive, Transpersonal. Turn the wheel; read the signal.
            </p>
          </section>

          {loading ? (
            <div className="flex h-[400px] items-center justify-center">
              <Spinner className="h-8 w-8 text-amber-500" />
            </div>
          ) : (
            codons && selectedCodon && (
              <>
                <div className="cz-bio-grid">
                  {/* LEFT: SVG CODON WHEEL */}
                  <CodonWheel
                    codons={codons}
                    selectedId={selectedId}
                    onSelect={(id) => setSelectedId(id)}
                    activeRoleIdx={activeRoleIdx}
                  />

                  {/* RIGHT: CODON DETAIL PANEL */}
                  <CodonDetailPanel
                    codon={selectedCodon}
                    selectedFacetKey={selectedFacetKey}
                    onFacetChange={(key) => setSelectedFacetKey(key)}
                    onSelectCodon={(id) => setSelectedId(id)}
                  />
                </div>

                {/* BOTTOM: 16 RESONANCE ROLE LEGEND GRID */}
                <RoleGrid
                  activeRoleIdx={activeRoleIdx}
                  onRoleSelect={(idx) => setActiveRoleIdx(idx)}
                />
              </>
            )
          )}
        </main>
      </SignalPageShell>
    </Layout>
  );
}
