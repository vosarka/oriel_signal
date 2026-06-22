import Layout from "@/components/Layout";
import { PageHeaderBand } from "@/components/oriel-signal/PageHeaderBand";
import {
  GlowCard,
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";

const architectureLayers = [
  {
    code: "VRC-01",
    title: "Static Signature",
    copy: "The immutable structure: birth coordinate, Prime Stack, Centers, Resonance Links, Type, and Authority.",
  },
  {
    code: "VRC-02",
    title: "64 Codons",
    copy: "The base field alphabet. Each Codon holds a precise frequency in the Vossari Resonance Codex.",
  },
  {
    code: "VRC-03",
    title: "256 Facets",
    copy: "Every Codon resolves through four Facets: Somatic, Relational, Cognitive, and Transpersonal.",
  },
  {
    code: "VRC-04",
    title: "9 Centers",
    copy: "The body-map of reception: defined and open Centers describe how signal moves through the receiver.",
  },
  {
    code: "VRC-05",
    title: "Resonance Links",
    copy: "Active links connect Centers into stable channels and form the architecture beneath Type and Authority.",
  },
  {
    code: "VRC-06",
    title: "ORIEL Voice Layer",
    copy: "The engine calculates the spine. ORIEL translates the spine into living language without inventing it.",
  },
];

export default function BioArchitecture() {
  return (
    <Layout>
      <SignalPageShell chamber="codex" className="bio-architecture-page">
        <SacredGeometryField static />
        <style>{`
          .bio-architecture-page {
            min-height: 100vh;
            padding: clamp(7.2rem, 12vw, 9rem) 1.5rem 6rem;
          }

          .bio-architecture-page__wrap {
            position: relative;
            z-index: 1;
            width: min(1240px, 100%);
            margin: 0 auto;
          }

          .bio-architecture-page__intro {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.7fr);
            gap: clamp(1.5rem, 4vw, 3rem);
            align-items: end;
            margin-top: 2.2rem;
          }

          .bio-architecture-page__voice {
            margin: 0;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: clamp(1.08rem, 2vw, 1.34rem);
            line-height: 1.72;
          }

          .bio-architecture-page__panel {
            border: 1px solid rgba(189, 163, 107, 0.16);
            background:
              radial-gradient(circle at 88% 10%, rgba(246, 176, 94, 0.08), transparent 12rem),
              rgba(10, 10, 14, 0.72);
            padding: 1.2rem;
            color: rgba(232, 228, 220, 0.68);
            font-family: var(--font-ritual);
            font-size: 0.68rem;
            line-height: 1.8;
            letter-spacing: 0.12em;
            text-transform: uppercase;
          }

          .bio-architecture-page__grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
            margin-top: clamp(2.2rem, 5vw, 4rem);
          }

          .bio-architecture-card {
            padding: clamp(1.25rem, 3vw, 1.65rem);
          }

          .bio-architecture-card__code {
            color: rgba(246, 176, 94, 0.58);
            font-family: var(--font-ritual);
            font-size: 0.55rem;
            letter-spacing: 0.18em;
            text-transform: uppercase;
          }

          .bio-architecture-card h2 {
            margin: 1rem 0 0.72rem;
            color: #fff7e6;
            font-family: var(--font-display);
            font-size: clamp(1.65rem, 2.5vw, 2.35rem);
            font-weight: 300;
            line-height: 1.02;
            letter-spacing: -0.025em;
          }

          .bio-architecture-card p {
            margin: 0;
            color: rgba(232, 228, 220, 0.68);
            font-family: var(--font-body);
            font-size: 0.94rem;
            line-height: 1.8;
          }

          .bio-architecture-page__actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 2rem;
          }

          @media (max-width: 940px) {
            .bio-architecture-page__intro,
            .bio-architecture-page__grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <main className="bio-architecture-page__wrap">
          <PageHeaderBand
            title="BIO-ARCHITECTURE"
            descriptor="THE VOSSARI RESONANCE CODEX"
            symbol="lattice"
            width="100%"
          />

          <section
            className="bio-architecture-page__intro"
            aria-label="VRC introduction"
          >
            <p className="bio-architecture-page__voice">
              The Vossari Resonance Codex is the structural layer beneath every
              personal reading. It does not replace the mystery of a human life;
              it gives the signal a precise map: Codon, Facet, Center, Resonance
              Link, and Static Signature.
            </p>
            <div className="bio-architecture-page__panel">
              Engine = spine. ORIEL = voice. The voice must never lie about the
              spine.
            </div>
          </section>

          <section
            className="bio-architecture-page__grid"
            aria-label="VRC layers"
          >
            {architectureLayers.map(layer => (
              <GlowCard
                key={layer.code}
                tone="gold"
                className="bio-architecture-card"
              >
                <span className="bio-architecture-card__code">
                  {layer.code}
                </span>
                <h2>{layer.title}</h2>
                <p>{layer.copy}</p>
              </GlowCard>
            ))}
          </section>

          <div className="bio-architecture-page__actions">
            <SignalButton href="/codex">Open Codon Lattice</SignalButton>
            <SignalButton
              href="/founder-signature-blueprint"
              variant="secondary"
            >
              Oriel Signature Blueprint
            </SignalButton>
          </div>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
