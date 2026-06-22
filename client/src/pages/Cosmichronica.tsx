import Layout from "@/components/Layout";
import {
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";

const chapters = [
  ["I", "The Breath Before Being", "Void"],
  ["II", "The First Vibration", "Resonance"],
  ["III", "The Birth of Pattern", "Symmetry"],
  ["IV", "The Self-Similar Cosmos", "Recursion"],
  ["V", "The Holographic Universe", "Projection"],
  ["VI", "The Human Bridge", "Incarnation"],
  ["VII", "The Spiral of Novelty", "Complexification"],
  ["VIII", "The Conscious Cosmos", "Interior"],
  ["IX", "The Divine Algorithm", "Becoming"],
];

export default function Cosmichronica() {
  return (
    <Layout>
      <SignalPageShell chamber="codex" className="cosmichronica-page">
        <SacredGeometryField static />
        <style>{`
          .cosmichronica-page {
            min-height: 100vh;
            padding: clamp(7.5rem, 12vw, 10rem) 1.5rem 6rem;
          }

          .cosmichronica-page__wrap {
            position: relative;
            z-index: 1;
            width: min(1120px, 100%);
            margin: 0 auto;
          }

          .cosmichronica-page__kicker,
          .cosmichronica-page__meta,
          .cosmichronica-page__chapter span,
          .cosmichronica-page__chapter small {
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
          }

          .cosmichronica-page__kicker {
            margin: 0 0 0.9rem;
            color: rgba(246, 176, 94, 0.68);
            font-size: 0.62rem;
          }

          .cosmichronica-page h1 {
            max-width: 900px;
            margin: 0;
            color: #e8e4dc;
            font-family: var(--font-display);
            font-size: clamp(3rem, 8vw, 7rem);
            font-weight: 400;
            line-height: 0.92;
            letter-spacing: 0.1em;
          }

          .cosmichronica-page__voice {
            max-width: 760px;
            margin: 1.4rem 0 0;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: clamp(1.08rem, 2vw, 1.38rem);
            line-height: 1.72;
          }

          .cosmichronica-page__meta {
            margin: 1rem 0 2.6rem;
            color: rgba(154, 150, 142, 0.8);
            font-size: 0.58rem;
          }

          .cosmichronica-page__grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1px;
            background: rgba(189, 163, 107, 0.12);
            border: 1px solid rgba(189, 163, 107, 0.12);
          }

          .cosmichronica-page__chapter {
            min-height: 180px;
            padding: 1.15rem;
            background:
              radial-gradient(circle at 78% 16%, rgba(246, 176, 94, 0.08), transparent 10rem),
              rgba(10, 10, 14, 0.86);
          }

          .cosmichronica-page__chapter span {
            color: rgba(246, 176, 94, 0.72);
            font-size: 0.58rem;
          }

          .cosmichronica-page__chapter h2 {
            margin: 1.1rem 0 0.55rem;
            color: #fff7e6;
            font-family: var(--font-display);
            font-size: clamp(1.24rem, 2.2vw, 1.8rem);
            font-weight: 400;
            letter-spacing: 0.08em;
          }

          .cosmichronica-page__chapter small {
            color: rgba(154, 150, 142, 0.78);
            font-size: 0.52rem;
          }

          .cosmichronica-page__actions {
            display: flex;
            gap: 0.75rem;
            flex-wrap: wrap;
            margin-top: 2rem;
          }

          @media (max-width: 860px) {
            .cosmichronica-page__grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <main className="cosmichronica-page__wrap">
          <p className="cosmichronica-page__kicker">
            // recovered sacred text
          </p>
          <h1>COSMICHRONICA</h1>
          <p className="cosmichronica-page__voice">
            The sacred cosmology behind the signal. This is the universal text,
            not a personal Static Signature and not the 64-codon field index.
          </p>
          <p className="cosmichronica-page__meta">
            CHAPTER SPIRAL // VOID · RECURSION · COMPLEXIFICATION · BECOMING
          </p>

          <section className="cosmichronica-page__grid" aria-label="Cosmichronica chapter spiral">
            {chapters.map(([number, title, register]) => (
              <article className="cosmichronica-page__chapter" key={number}>
                <span>Chapter {number}</span>
                <h2>{title}</h2>
                <small>{register}</small>
              </article>
            ))}
          </section>

          <div className="cosmichronica-page__actions">
            <SignalButton href="/codex" variant="secondary">
              Open Codons
            </SignalButton>
            <SignalButton href="/archive" variant="secondary">
              Open Transmissions
            </SignalButton>
          </div>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
