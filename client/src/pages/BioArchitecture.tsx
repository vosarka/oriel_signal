import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Layout from "@/components/Layout";
import { PageHeaderBand } from "@/components/oriel-signal/PageHeaderBand";
import { SignalPageShell } from "@/components/oriel-signal/OrielSignalDesign";
import {
  CodonWheel,
  type BaseView,
  type CenterName,
  type Codon,
  type Facet,
  type Layer,
  type WheelCellSelection,
  type WheelGeometry,
  type WheelSignatureContext,
} from "@/components/oriel-signal/CodonWheel";
import { CodonDetailPanel, type CodonDetail } from "@/components/oriel-signal/CodonDetailPanel";
import { RoleGrid } from "@/components/oriel-signal/RoleGrid";
import { CenterGrid } from "@/components/oriel-signal/CenterGrid";
import { TetradModule } from "@/components/oriel-signal/vtrs/TetradModule";
import { TwoTimingModule } from "@/components/oriel-signal/vtrs/TwoTimingModule";
import { LatticeModule } from "@/components/oriel-signal/vtrs/LatticeModule";
import { CentersModule } from "@/components/oriel-signal/vtrs/CentersModule";
import { LinksModule } from "@/components/oriel-signal/vtrs/LinksModule";
import { RolesModule } from "@/components/oriel-signal/vtrs/RolesModule";

// The 6 technical HUD modules orbiting the wheel. The wheel itself is the
// 7th station — the default terminal state.
const MODULES = [
  { id: "vtip", num: "01", label: "VTIP · THE TETRAD", comp: TetradModule },
  { id: "twotiming", num: "02", label: "TWO-TIMING", comp: TwoTimingModule },
  { id: "lattice", num: "03", label: "512-NODE LATTICE", comp: LatticeModule },
  { id: "centers", num: "04", label: "8 CENTERS", comp: CentersModule },
  { id: "links", num: "05", label: "32 LINKS", comp: LinksModule },
  { id: "roles", num: "06", label: "16 ROLES", comp: RolesModule },
] as const;

type ModuleId = (typeof MODULES)[number]["id"];

const NEUTRAL_FIELD_CODONS: Codon[] = Array.from(
  { length: 64 },
  (_, index) => {
    const id = index + 1;
    return {
      id,
      code: `RC${String(id).padStart(2, "0")}`,
      name: `Codon ${id}`,
      traditional_name: "",
      binary: id.toString(2).padStart(6, "0"),
      chemical_marker: "",
      archetype_role: "",
      somatic_marker: "",
    };
  }
);

export default function BioArchitecture() {
  const [codons, setCodons] = useState<CodonDetail[] | null>(null);
  const [selectedId, setSelectedId] = useState<number>(1);
  const [selectedFacetKey, setSelectedFacetKey] = useState<Facet>("A");
  const [selectedLayer, setSelectedLayer] = useState<Layer>("conscious");
  const [wheelViewPreference, setWheelViewPreference] =
    useState<BaseView | null>(null);
  // The wheel always renders in the canonical astronomical Mandala Sequence
  // (VRC_MANDALA) — codon slot 0 = RC51 at 0°, matching real ecliptic order.
  // "numeric" (raw RC01→64) is never a valid rendering of real transits.
  const [wheelGeometry, setWheelGeometry] =
    useState<WheelGeometry>("astronomical");
  const [wheelSignatureContext, setWheelSignatureContext] =
    useState<WheelSignatureContext>({
      mode: "field",
      state: "loading",
      summary: null,
    });
  const [activeRoleIdx, setActiveRoleIdx] = useState<number | null>(null);
  const [activeCenter, setActiveCenter] = useState<CenterName | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeModule, setActiveModule] = useState<ModuleId | null>(null);

  const ActiveComp = activeModule ? MODULES.find(m => m.id === activeModule)?.comp : null;

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
  const selectCodon = (codonId: number) => {
    setSelectedId(codonId);
    if (wheelSignatureContext.mode === "field") setActiveCenter(null);
  };
  const selectWheelCell = (selection: WheelCellSelection) => {
    setSelectedId(selection.codonId);
    setSelectedFacetKey(selection.facet);
    setSelectedLayer(selection.layer);
    if (wheelSignatureContext.mode === "field") setActiveCenter(null);
  };
  const selectCenter = (center: CenterName | null) => {
    setActiveCenter(center);
    if (center !== null) setActiveRoleIdx(null);
  };

  return (
    <Layout>
      <SignalPageShell chamber="codex" className="bio-architecture-page">

        <style>{`
          .bio-architecture-page {
            min-height: 100vh;
            padding: clamp(6rem, 10vw, 8rem) 1.5rem 6rem;
            /* Transparent so the shared SignalBackdrop (obsidian void + gold
               bloom + starfield, same as Home) shows through. No flower-of-life. */
            background: transparent;
            /* VTRS terminal design tokens */
            --ink: #f2ead7;
            --gold: #cda14a;
            --gold2: #e8c477;
            --cyan: #6fb7c7;
            --red: #c8584a;
            --mut: #857a69;
            --line: rgba(205, 161, 74, 0.16);
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

          /* Main layout grid: Centers | Wheel | Panel */
          .cz-bio-grid {
            display: grid;
            grid-template-columns: 200px minmax(0, 1fr) 420px;
            gap: clamp(1.5rem, 4vw, 3.5rem);
            align-items: start;
            margin-top: 2rem;
          }

          @media (max-width: 1400px) {
            .cz-bio-grid {
              grid-template-columns: 180px minmax(0, 1fr) 380px;
            }
          }

          @media (max-width: 1080px) {
            .cz-bio-grid {
              grid-template-columns: 1fr;
              gap: 3rem;
            }
          }

          /* ── Center Sidebar (left of the wheel) ───────────────────────── */
          .cz-center-sidebar {
            font-family: 'Cormorant Garamond', Georgia, serif;
          }

          .cz-center-sidebar-list {
            display: flex;
            flex-direction: column;
            gap: 1px;
            background: var(--line);
            border: 1px solid var(--line);
          }

          .cz-center-card {
            appearance: none;
            width: 100%;
            padding: 10px 12px;
            border: 0;
            color: inherit;
            font: inherit;
            text-align: left;
            cursor: pointer;
            transition: all 0.25s ease;
            background: rgba(20, 17, 12, 0.35);
          }

          .cz-center-card:hover {
            background: #15120c !important;
          }

          .cz-center-card:focus-visible {
            outline: 1px solid var(--gold2);
            outline-offset: -2px;
          }

          .cz-center-card-header {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }

          .cz-center-card-name {
            font-size: 14px;
            color: var(--ink);
            letter-spacing: 0.02em;
          }

          .cz-center-card-sub {
            display: block;
            margin-top: 4px;
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.02em;
            line-height: 1.4;
            color: var(--mut);
          }

          @media (max-width: 1080px) {
            .cz-center-sidebar-list {
              flex-direction: row;
              flex-wrap: wrap;
            }
            .cz-center-card {
              flex: 1 1 160px;
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

          .cz-cell-address {
            padding-bottom: 16px;
            margin-bottom: 14px;
            border-bottom: 1px solid var(--line);
          }

          .cz-layer-picker {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            margin-top: 10px;
            border: 1px solid rgba(205, 161, 74, 0.22);
            background: rgba(8, 7, 11, 0.48);
          }

          .cz-layer-btn {
            min-width: 0;
            padding: 9px 10px 8px;
            border: 0;
            background: transparent;
            color: var(--mut);
            cursor: pointer;
            text-align: left;
            font-family: var(--font-ritual, monospace);
            transition: color 180ms ease, background 180ms ease, box-shadow 180ms ease;
          }

          .cz-layer-btn + .cz-layer-btn {
            border-left: 1px solid rgba(205, 161, 74, 0.18);
          }

          .cz-layer-btn > span {
            display: block;
            font-size: 9px;
            letter-spacing: 0.15em;
          }

          .cz-layer-btn small {
            display: block;
            margin-top: 3px;
            color: inherit;
            opacity: 0.62;
            font-size: 7.5px;
            letter-spacing: 0.1em;
          }

          .cz-layer-btn.is-conscious.is-active {
            color: var(--gold2);
            background: rgba(205, 161, 74, 0.1);
            box-shadow: inset 0 -1px var(--gold2);
          }

          .cz-layer-btn.is-design.is-active {
            color: var(--cyan);
            background: rgba(111, 183, 199, 0.1);
            box-shadow: inset 0 -1px var(--cyan);
          }

          .cz-facet-picker {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 4px;
            margin-top: 7px;
          }

          .cz-facet-btn {
            min-width: 0;
            min-height: 42px;
            padding: 6px 3px;
            border: 1px solid var(--line);
            background: transparent;
            color: var(--mut);
            cursor: pointer;
            font-family: var(--font-ritual, monospace);
            transition: border-color 180ms ease, color 180ms ease, background 180ms ease;
          }

          .cz-facet-btn b,
          .cz-facet-btn span {
            display: block;
          }

          .cz-facet-btn b {
            color: inherit;
            font-size: 10px;
            font-weight: 500;
          }

          .cz-facet-btn span {
            margin-top: 2px;
            overflow: hidden;
            text-overflow: ellipsis;
            font-size: 7px;
            letter-spacing: 0.04em;
          }

          .cz-facet-btn.is-active {
            border-color: rgba(232, 196, 119, 0.72);
            background: rgba(205, 161, 74, 0.08);
            color: var(--gold2);
          }

          .cz-layer-btn:hover,
          .cz-facet-btn:hover,
          .cz-tetrad-btn:hover {
            color: var(--ink);
          }

          .cz-layer-btn:focus-visible,
          .cz-facet-btn:focus-visible,
          .cz-tetrad-btn:focus-visible {
            outline: 1px solid currentColor;
            outline-offset: -2px;
          }

          .cz-signature-context {
            position: relative;
            margin: 0 0 16px;
            padding: 11px 12px 10px;
            border-left: 2px solid var(--cyan);
            background: rgba(111, 183, 199, 0.035);
            font-family: var(--font-ritual, monospace);
          }

          .cz-signature-context.is-mine {
            border-left-color: var(--gold2);
            background: rgba(205, 161, 74, 0.045);
          }

          .cz-signature-status,
          .cz-selected-cell-status,
          .cz-current-reading {
            font-size: 8px;
            letter-spacing: 0.12em;
          }

          .cz-signature-status {
            color: var(--gold2);
          }

          .cz-signature-context.is-field .cz-signature-status,
          .cz-current-reading {
            color: var(--cyan);
          }

          .cz-selected-cell-status {
            color: var(--mut);
            text-align: right;
          }

          .cz-layer-readout {
            display: grid;
            gap: 6px;
            margin: 9px 0 0;
          }

          .cz-layer-readout > div {
            display: grid;
            grid-template-columns: 78px minmax(0, 1fr);
            gap: 8px;
            padding-top: 6px;
            border-top: 1px solid rgba(205, 161, 74, 0.12);
          }

          .cz-layer-readout dt,
          .cz-layer-readout dd {
            margin: 0;
            font-size: 8px;
            line-height: 1.45;
          }

          .cz-layer-readout dt {
            color: var(--mut);
            letter-spacing: 0.12em;
          }

          .cz-layer-readout dd {
            color: #cbc1ac;
          }

          .cz-convergence-copy {
            margin: 8px 0 0;
            color: #b8af9b;
            font-family: var(--font-voice, serif);
            font-size: 12.5px;
            font-style: italic;
            line-height: 1.4;
          }

          .cz-current-reading {
            display: block;
            margin-top: 9px;
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

          @media (prefers-reduced-motion: reduce) {
            .cz-layer-btn,
            .cz-facet-btn {
              transition-duration: 120ms;
            }
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

          /* ═══ VTRS Terminal ═══════════════════════════════════════════ */
          .vtrs-status-strip {
            margin-top: 1.2rem;
            padding: 8px 14px;
            border: 1px solid rgba(111, 183, 199, 0.25);
            background: rgba(111, 183, 199, 0.04);
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            letter-spacing: 0.26em;
            color: var(--cyan);
            animation: vtrsFlicker 11s infinite;
          }

          @keyframes vtrsFlicker {
            0%, 96%, 100% { opacity: 1; }
            97% { opacity: 0.78; }
            98% { opacity: 0.94; }
          }

          @media (prefers-reduced-motion: reduce) {
            .vtrs-status-strip { animation: none; }
          }

          /* Module chips */
          .vtrs-chip-strip {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            margin-bottom: 1.6rem;
          }

          .vtrs-chip {
            display: flex;
            align-items: baseline;
            gap: 8px;
            padding: 9px 14px;
            border: 1px solid var(--line);
            background: rgba(8, 7, 11, 0.6);
            cursor: pointer;
            transition: border-color 0.25s ease, background 0.25s ease;
          }

          .vtrs-chip:hover {
            border-color: rgba(111, 183, 199, 0.6);
            background: rgba(111, 183, 199, 0.05);
          }

          .vtrs-chip.is-active {
            border-color: var(--cyan);
            background: rgba(111, 183, 199, 0.08);
          }

          .vtrs-chip__num {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            color: var(--cyan);
            letter-spacing: 0.12em;
          }

          .vtrs-chip__label {
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            letter-spacing: 0.14em;
            color: var(--ink);
            white-space: nowrap;
          }

          /* Module state layout */
          .vtrs-module-layout {
            display: grid;
            grid-template-columns: 290px minmax(0, 1fr);
            gap: clamp(1.5rem, 3.5vw, 3rem);
            align-items: start;
          }

          @media (max-width: 1080px) {
            .vtrs-module-layout { grid-template-columns: 1fr; }
            .vtrs-mini-wheel { max-width: 320px; margin: 0 auto; }
          }

          .vtrs-module-nav {
            display: flex;
            flex-direction: column;
            gap: 14px;
            position: sticky;
            top: 90px;
          }

          .vtrs-mini-wheel {
            width: 100%;
            pointer-events: auto;
          }

          .vtrs-chip-column {
            display: flex;
            flex-direction: column;
            gap: 6px;
          }

          .vtrs-module-stage {
            min-height: 60vh;
          }

          /* Shared module styles */
          .vtrs-module {
            border: 1px solid var(--line);
            background: rgba(20, 17, 12, 0.4);
            backdrop-filter: blur(6px);
            padding: clamp(1.4rem, 3vw, 2.4rem);
            font-family: 'Cormorant Garamond', Georgia, serif;
          }

          .vtrs-module__head { margin-bottom: 1.8rem; }

          .vtrs-module__eyebrow {
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            letter-spacing: 0.24em;
            color: var(--cyan);
            display: block;
            margin-bottom: 8px;
          }

          .vtrs-module__title {
            font-family: var(--font-display, serif);
            font-size: clamp(1.9rem, 3.4vw, 2.8rem);
            font-weight: 400;
            color: var(--ink);
            margin: 0 0 10px;
            line-height: 1.02;
          }

          .vtrs-module__lede {
            font-style: italic;
            font-size: 15.5px;
            color: #b8af9b;
            max-width: 640px;
            line-height: 1.55;
            margin: 0;
          }

          .vtrs-btn {
            font-family: var(--font-ritual, monospace);
            font-size: 10px;
            letter-spacing: 0.16em;
            padding: 10px 18px;
            border: 1px solid var(--line);
            background: transparent;
            color: var(--ink);
            cursor: pointer;
            transition: all 0.25s ease;
          }

          .vtrs-btn:hover:not(:disabled) {
            border-color: rgba(232, 196, 119, 0.5);
          }

          .vtrs-btn:disabled { opacity: 0.35; cursor: default; }

          .vtrs-btn--cyan {
            border-color: rgba(111, 183, 199, 0.45);
            color: var(--cyan);
          }

          .vtrs-btn--cyan:hover:not(:disabled) {
            border-color: var(--cyan);
            background: rgba(111, 183, 199, 0.07);
          }

          .vtrs-btn--back {
            width: 100%;
            text-align: left;
            color: var(--cyan);
            border-color: rgba(111, 183, 199, 0.35);
          }

          .vtrs-captions {
            margin-top: 1.8rem;
            border-top: 1px solid var(--line);
            padding-top: 1.1rem;
            display: grid;
            gap: 8px;
          }

          .vtrs-captions p {
            font-family: var(--font-ritual, monospace);
            font-size: 10.5px;
            line-height: 1.65;
            color: var(--mut);
            margin: 0;
            max-width: 74ch;
          }

          .vtrs-captions b { color: #cbc1ac; font-weight: 400; }

          /* ── Tetrad module ── */
          .vtip-registers {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 14px;
            min-height: 90px;
          }

          .vtip-register { display: flex; flex-direction: column; gap: 6px; }

          .vtip-register__label {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.16em;
            color: var(--mut);
          }

          .vtip-register__bits { display: flex; gap: 5px; }

          .vtip-bit {
            width: 52px;
            height: 52px;
            border: 1px solid rgba(205, 161, 74, 0.16);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .vtip-bit__glyph {
            font-family: var(--font-ritual, monospace);
            font-size: 13px;
            letter-spacing: 0.1em;
            color: var(--cyan);
          }

          .vtip-break {
            font-size: 30px;
            color: var(--gold2);
            align-self: center;
            margin-top: 14px;
          }

          .vtip-controls {
            display: flex;
            align-items: center;
            gap: 10px;
            margin: 1.4rem 0;
          }

          .vtip-cap-note {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.14em;
            color: var(--mut);
          }

          .vtip-readout {
            border: 1px solid rgba(111, 183, 199, 0.2);
            background: rgba(111, 183, 199, 0.03);
            padding: 14px 18px;
            display: grid;
            gap: 8px;
          }

          .vtip-readout__row {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            font-family: var(--font-ritual, monospace);
            font-size: 11px;
          }

          .vtip-readout__row span { color: var(--mut); letter-spacing: 0.14em; }
          .vtip-readout__row b { color: var(--ink); font-weight: 400; text-align: right; }
          .vtip-readout__syntax { color: var(--cyan) !important; font-size: 14px; letter-spacing: 0.14em; }

          /* ── Two-Timing module ── */
          .twotiming-stage {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 14px;
            margin-bottom: 1.4rem;
          }

          .twotiming-svg { width: min(440px, 100%); }

          .twotiming-tick-label, .twotiming-label {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.1em;
            fill: var(--mut);
          }

          .twotiming-label--gold { fill: #e8c477; }
          .twotiming-label--cyan { fill: #6fb7c7; }

          .twotiming-center-line {
            font-family: var(--font-ritual, monospace);
            font-size: 9.5px;
            letter-spacing: 0.14em;
          }

          .twotiming-center-sub {
            font-family: var(--font-voice, serif);
            font-style: italic;
            font-size: 11px;
            fill: var(--mut);
          }

          /* ── Lattice module ── */
          .lattice-bit-groups {
            display: flex;
            flex-wrap: wrap;
            gap: 18px;
            margin-bottom: 1.5rem;
          }

          .lattice-bit-group { display: flex; flex-direction: column; gap: 6px; }

          .lattice-bit-group__label {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.16em;
            color: var(--mut);
          }

          .lattice-bit-group__cells { display: flex; gap: 5px; }

          .lattice-bit {
            width: 46px;
            height: 56px;
            border: 1px solid rgba(205, 161, 74, 0.2);
            background: rgba(8, 7, 11, 0.6);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 2px;
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .lattice-bit:hover { border-color: rgba(111, 183, 199, 0.5); }

          .lattice-bit.is-on {
            border-color: var(--cyan);
            background: rgba(111, 183, 199, 0.1);
          }

          .lattice-bit__no {
            font-family: var(--font-ritual, monospace);
            font-size: 8px;
            color: var(--mut);
          }

          .lattice-bit__val {
            font-family: var(--font-ritual, monospace);
            font-size: 18px;
            color: var(--ink);
          }

          .lattice-bit.is-on .lattice-bit__val { color: var(--cyan); }

          .lattice-readout {
            border: 1px solid rgba(111, 183, 199, 0.2);
            background: rgba(111, 183, 199, 0.03);
            padding: 16px 20px;
            display: grid;
            gap: 10px;
          }

          .lattice-readout__binary {
            font-family: var(--font-ritual, monospace);
            font-size: 15px;
            letter-spacing: 0.1em;
            color: var(--cyan);
          }

          .lattice-readout__arrow { color: var(--mut); margin: 0 6px; }

          .lattice-readout__node {
            font-family: var(--font-ritual, monospace);
            font-size: 13px;
            color: var(--ink);
          }

          .lattice-readout__node b { font-weight: 400; }

          .lattice-readout__detail {
            font-family: var(--font-ritual, monospace);
            font-size: 9.5px;
            letter-spacing: 0.06em;
            color: var(--mut);
            line-height: 1.6;
          }

          /* ── Centers module ── */
          .centers-column { display: flex; flex-direction: column; }

          .centers-item { position: relative; }

          .centers-spine {
            width: 1px;
            height: 18px;
            background: rgba(111, 183, 199, 0.3);
            margin: 0 auto;
          }

          .centers-card {
            border: 1px solid;
            background: rgba(8, 7, 11, 0.55);
            padding: 14px 18px;
            transition: border-color 0.3s ease, box-shadow 0.3s ease;
          }

          .centers-card__head {
            display: flex;
            align-items: baseline;
            gap: 12px;
            width: 100%;
            background: none;
            border: none;
            cursor: pointer;
            padding: 0;
            text-align: left;
          }

          .centers-card__roman {
            font-family: var(--font-ritual, monospace);
            font-size: 13px;
            letter-spacing: 0.1em;
            min-width: 34px;
          }

          .centers-card__name {
            font-family: var(--font-display, serif);
            font-size: 19px;
            color: var(--ink);
            letter-spacing: 0.04em;
            flex: 1;
          }

          .centers-card__syntax {
            font-family: var(--font-ritual, monospace);
            font-size: 11px;
            letter-spacing: 0.1em;
          }

          .centers-card__meta {
            display: flex;
            justify-content: space-between;
            gap: 14px;
            margin-top: 6px;
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.08em;
            color: var(--mut);
            flex-wrap: wrap;
          }

          .centers-card__codons {
            display: flex;
            flex-wrap: wrap;
            gap: 4px;
            margin-top: 10px;
          }

          .centers-codon-chip {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.08em;
            color: #cbc1ac;
            border: 1px solid;
            padding: 3px 7px;
            transition: opacity 0.25s ease;
          }

          .centers-card__toggle-row { display: flex; gap: 6px; margin-top: 12px; }

          .centers-toggle {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.14em;
            padding: 6px 14px;
            border: 1px solid rgba(232, 228, 220, 0.15);
            background: transparent;
            color: var(--mut);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .centers-toggle.is-active { color: var(--ink); }
          .centers-toggle.is-open-state { border-color: rgba(232, 228, 220, 0.4); }

          .centers-card__state {
            font-family: var(--font-voice, serif);
            font-style: italic;
            font-size: 13.5px;
            color: #b8af9b;
            line-height: 1.5;
            margin: 10px 0 0;
          }

          .centers-card__role { overflow: hidden; }

          .centers-card__role-label {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.16em;
            color: var(--cyan);
            display: block;
            margin-top: 12px;
          }

          .centers-card__role p {
            font-size: 14px;
            color: #cbc1ac;
            line-height: 1.55;
            margin: 6px 0 0;
          }

          /* ── Links module ── */
          .links-filters {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
            margin-bottom: 1.2rem;
          }

          .links-filter-chip {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.12em;
            padding: 6px 11px;
            border: 1px solid var(--line);
            background: transparent;
            color: var(--mut);
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .links-filter-chip:hover { border-color: rgba(111, 183, 199, 0.4); }
          .links-filter-chip.is-active { background: rgba(111, 183, 199, 0.06); }

          .links-counter {
            margin-left: auto;
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.18em;
            color: var(--cyan);
          }

          .links-stage {
            display: grid;
            grid-template-columns: minmax(0, 1fr) 250px;
            gap: 1.4rem;
            align-items: start;
          }

          @media (max-width: 860px) {
            .links-stage { grid-template-columns: 1fr; }
          }

          .links-svg { width: 100%; }

          .links-node-roman {
            font-family: var(--font-ritual, monospace);
            font-size: 12px;
            letter-spacing: 0.06em;
          }

          .links-node-label {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.14em;
            fill: var(--mut);
          }

          .links-detail {
            border: 1px solid var(--line);
            background: rgba(8, 7, 11, 0.6);
            padding: 16px 18px;
            min-height: 170px;
            position: sticky;
            top: 100px;
          }

          .links-detail__id {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.16em;
            display: block;
          }

          .links-detail__name {
            font-family: var(--font-display, serif);
            font-size: 22px;
            font-weight: 400;
            color: var(--ink);
            margin: 6px 0 8px;
            line-height: 1.05;
          }

          .links-detail__codons {
            font-family: var(--font-ritual, monospace);
            font-size: 10.5px;
            letter-spacing: 0.06em;
            color: var(--cyan);
            margin-bottom: 10px;
          }

          .links-detail__profile {
            font-family: var(--font-voice, serif);
            font-style: italic;
            font-size: 14px;
            color: #b8af9b;
            line-height: 1.5;
            margin: 0;
          }

          .links-detail__hint {
            font-family: var(--font-ritual, monospace);
            font-size: 9.5px;
            letter-spacing: 0.1em;
            line-height: 1.8;
            color: var(--mut);
            margin: 0;
          }

          /* ── Roles module ── */
          .roles-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
            gap: 1px;
            background: var(--line);
            border: 1px solid var(--line);
            margin-bottom: 1.6rem;
          }

          .roles-card {
            background: rgba(8, 7, 11, 0.75);
            padding: 12px 14px;
            cursor: pointer;
            transition: background 0.25s ease;
          }

          .roles-card:hover { background: #15120c; }
          .roles-card.is-expanded { background: rgba(111, 183, 199, 0.04); }

          .roles-card__head {
            display: flex;
            justify-content: space-between;
            align-items: baseline;
          }

          .roles-card__name { font-size: 17px; color: var(--ink); }

          .roles-card__range {
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            color: var(--mut);
          }

          .roles-card__desc {
            display: block;
            font-family: var(--font-ritual, monospace);
            font-size: 8.5px;
            letter-spacing: 0.04em;
            color: var(--gold);
            margin-top: 3px;
            line-height: 1.5;
          }

          .roles-card__details { overflow: hidden; }

          .roles-card__gift, .roles-card__shadow {
            font-size: 12.5px;
            line-height: 1.5;
            margin: 8px 0 0;
            color: #b8af9b;
          }

          .roles-card__gift b {
            font-family: var(--font-ritual, monospace);
            font-size: 8px;
            letter-spacing: 0.14em;
            color: var(--gold2);
            font-weight: 400;
            margin-right: 6px;
          }

          .roles-card__shadow b {
            font-family: var(--font-ritual, monospace);
            font-size: 8px;
            letter-spacing: 0.14em;
            color: var(--red);
            font-weight: 400;
            margin-right: 6px;
          }

          .roles-pipeline {
            border: 1px solid rgba(111, 183, 199, 0.2);
            background: rgba(111, 183, 199, 0.03);
            padding: 16px 18px;
          }

          .roles-pipeline__label {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.2em;
            color: var(--cyan);
            display: block;
            margin-bottom: 12px;
          }

          .roles-pipeline__steps {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 6px;
          }

          .roles-pipeline__unit { display: flex; align-items: center; gap: 6px; }

          .roles-pipeline__chip {
            font-family: var(--font-ritual, monospace);
            font-size: 9px;
            letter-spacing: 0.1em;
            padding: 8px 12px;
            border: 1px solid var(--line);
            background: rgba(8, 7, 11, 0.5);
            color: var(--ink);
            cursor: pointer;
            transition: border-color 0.2s ease;
          }

          .roles-pipeline__chip.is-hot { border-color: var(--cyan); color: var(--cyan); }

          .roles-pipeline__arrow { color: var(--mut); font-size: 12px; }

          .roles-pipeline__hint {
            font-family: var(--font-voice, serif);
            font-style: italic;
            font-size: 13px;
            color: #b8af9b;
            margin: 12px 0 0;
            min-height: 20px;
          }
        `}</style>

        <main className="bio-architecture-page__wrap">
          <PageHeaderBand
            title="BIO-ARCHITECTURE"
            descriptor="VOSSARI TETRADIC RESONANCE SYSTEM · INTERACTIVE TERMINAL"
            symbol="lattice"
            width="100%"
          />

          {/* Permanent HUD status strip */}
          <div className="vtrs-status-strip">
            SYSTEM STATUS: ACTIVE · 64 CODONS · 8 CENTERS · 32 LINKS · 512 NODES
          </div>

          {/* Cross-reference to Profile: positions the terminal as the indispensable
              system layer that explains every user's personal Bio-Architecture. */}
          <p
            style={{
              fontFamily: "var(--font-voice, serif)",
              fontStyle: "italic",
              color: "#b8af9b",
              fontSize: "0.95rem",
              margin: "0.35rem 0 0.85rem",
              maxWidth: "860px",
            }}
          >
            The terminal teaches the universal structure. Anchor or view your own defined centers, active links, and Prime Stack in{" "}
            <a href="/profile" style={{ color: "var(--gold)", textDecoration: "underline" }}>your Profile</a>.
          </p>

          <section className="bio-architecture-page__intro" aria-label="Introduction">
            <p className="bio-architecture-page__voice">
              {activeModule === null
                ? "Sixty-four codons resolve into eight Resonance Centers — eight codons to a center — the functional architecture that governs Type and Authority. Beneath runs their sequential index: sixteen Roles, four codons apiece. Every codon holds four facets across Conscious and Design layers. Turn the wheel; read the signal."
                : "The wheel keeps turning while you inspect the machinery. Return to the terminal at any time."}
            </p>
          </section>

          {loading || !codons || !selectedCodon ? (
            <div style={{ maxWidth: 680, margin: "0 auto" }}>
              <CodonWheel
                codons={NEUTRAL_FIELD_CODONS}
                selectedId={selectedId}
                onSelect={selectCodon}
                selectedFacet={selectedFacetKey}
                selectedLayer={selectedLayer}
                viewPreference={wheelViewPreference}
                geometryPreference={wheelGeometry}
                onCellSelect={selectWheelCell}
                onViewPreferenceChange={setWheelViewPreference}
                onGeometryPreferenceChange={setWheelGeometry}
                onSignatureContextChange={setWheelSignatureContext}
                activeRoleIdx={activeRoleIdx}
                activeCenter={activeCenter}
                onCenterSelect={selectCenter}
                onDeselect={() => {
                  setActiveCenter(null);
                  setActiveRoleIdx(null);
                }}
              />
              <p
                role="status"
                style={{
                  margin: "8px 0 0",
                  textAlign: "center",
                  color: "var(--mut)",
                  fontFamily: "var(--font-voice, serif)",
                  fontSize: 12,
                  fontStyle: "italic",
                }}
              >
                {loading
                  ? "Codon names and glyph detail are arriving…"
                  : "Codon detail is unavailable; the universal field remains open."}
              </p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
                {activeModule === null ? (
                  /* ── TERMINAL STATE: full wheel + module chips + panel + roles ── */
                  <motion.div
                    key="terminal"
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3 }}
                  >
                    {/* Module HUD chips */}
                    <div className="vtrs-chip-strip" role="navigation" aria-label="VTRS modules">
                      {MODULES.map(m => (
                        <button
                          key={m.id}
                          type="button"
                          className="vtrs-chip"
                          onClick={() => setActiveModule(m.id)}
                        >
                          <span className="vtrs-chip__num">{m.num}</span>
                          <span className="vtrs-chip__label">{m.label}</span>
                        </button>
                      ))}
                    </div>

                    <div className="cz-bio-grid">
                      <CenterGrid
                        activeCenter={activeCenter}
                        onCenterSelect={selectCenter}
                      />
                      <CodonWheel
                        codons={codons}
                        selectedId={selectedId}
                        onSelect={selectCodon}
                        selectedFacet={selectedFacetKey}
                        selectedLayer={selectedLayer}
                        viewPreference={wheelViewPreference}
                        geometryPreference={wheelGeometry}
                        onCellSelect={selectWheelCell}
                        onViewPreferenceChange={setWheelViewPreference}
                        onGeometryPreferenceChange={setWheelGeometry}
                        onSignatureContextChange={setWheelSignatureContext}
                        activeRoleIdx={activeRoleIdx}
                        activeCenter={activeCenter}
                        onCenterSelect={selectCenter}
                        onDeselect={() => {
                          setActiveCenter(null);
                          setActiveRoleIdx(null);
                        }}
                      />
                      <CodonDetailPanel
                        codon={selectedCodon}
                        selectedFacetKey={selectedFacetKey}
                        selectedLayer={selectedLayer}
                        signatureContext={wheelSignatureContext}
                        onFacetChange={key => setSelectedFacetKey(key)}
                        onLayerChange={layer => setSelectedLayer(layer)}
                        onSelectCodon={selectCodon}
                      />
                    </div>

                    <RoleGrid
                      activeRoleIdx={activeRoleIdx}
                      onRoleSelect={idx => {
                        setActiveRoleIdx(idx);
                        if (idx !== null) setActiveCenter(null);
                      }}
                    />
                  </motion.div>
                ) : (
                  /* ── MODULE STATE: shrunken wheel + nav left, module right ── */
                  <motion.div
                    key={activeModule}
                    className="vtrs-module-layout"
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.35 }}
                  >
                    <aside className="vtrs-module-nav">
                      <button
                        type="button"
                        className="vtrs-btn vtrs-btn--back"
                        onClick={() => setActiveModule(null)}
                      >
                        ← TERMINAL
                      </button>

                      <div className="vtrs-mini-wheel">
                        <CodonWheel
                          codons={codons}
                          selectedId={selectedId}
                          onSelect={selectCodon}
                          selectedFacet={selectedFacetKey}
                          selectedLayer={selectedLayer}
                          viewPreference={wheelViewPreference}
                          geometryPreference={wheelGeometry}
                          onCellSelect={selectWheelCell}
                          onViewPreferenceChange={setWheelViewPreference}
                          onGeometryPreferenceChange={setWheelGeometry}
                          onSignatureContextChange={setWheelSignatureContext}
                          activeRoleIdx={activeRoleIdx}
                          activeCenter={activeCenter}
                          onCenterSelect={selectCenter}
                          onDeselect={() => {
                            setActiveCenter(null);
                            setActiveRoleIdx(null);
                          }}
                        />
                      </div>

                      <nav className="vtrs-chip-column" aria-label="VTRS modules">
                        {MODULES.map(m => (
                          <button
                            key={m.id}
                            type="button"
                            className={`vtrs-chip ${activeModule === m.id ? "is-active" : ""}`}
                            onClick={() => setActiveModule(m.id)}
                          >
                            <span className="vtrs-chip__num">{m.num}</span>
                            <span className="vtrs-chip__label">{m.label}</span>
                          </button>
                        ))}
                      </nav>
                    </aside>

                    <section className="vtrs-module-stage" aria-live="polite">
                      {ActiveComp && <ActiveComp />}
                    </section>
                  </motion.div>
                )}
            </AnimatePresence>
          )}
        </main>
      </SignalPageShell>
    </Layout>
  );
}
