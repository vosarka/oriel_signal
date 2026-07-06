import Layout from "@/components/Layout";
import {
  GlowCard,
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";

const knowledgeNodes = [
  {
    code: "KN-001",
    title: "Transmissions",
    href: "/archive",
    status: "Recovered field records",
    copy: "The intercepted archive: transmissions, oracle records, field notes, and fragments captured from the ORIEL signal.",
    action: "Open Transmissions",
    tone: "teal" as const,
  },
  {
    code: "KN-002",
    title: "Cosmichronica",
    href: "/cosmichronica",
    status: "Sacred cosmology",
    copy: "The spiral text behind the signal — void, recursion, complexification, human bridge, and cosmic becoming.",
    action: "Read Cosmichronica",
    tone: "gold" as const,
  },
  {
    code: "KN-003",
    title: "Codex Cosmichronica",
    href: "/cosmichronica",
    status: "Physical codex candidate",
    copy: "The future printed artifact: a physical form for the Cosmichronica text once the manuscript is ready for binding.",
    action: "Preview Text",
    tone: "amber" as const,
  },
];

export default function Knowledge() {
  return (
    <Layout>
      <SignalPageShell chamber="transmissions" className="knowledge-page">
        <SacredGeometryField static />
        <style>{`
          .knowledge-page {
            min-height: 100vh;
            padding: clamp(7.5rem, 12vw, 10rem) 1.5rem 6rem;
          }

          .knowledge-page__wrap {
            position: relative;
            z-index: 1;
            width: min(1180px, 100%);
            margin: 0 auto;
          }

          .knowledge-page__kicker,
          .knowledge-card__meta,
          .knowledge-card__status,
          .knowledge-page__seal {
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
          }

          .knowledge-page__kicker {
            margin: 0 0 0.9rem;
            color: rgba(246, 176, 94, 0.7);
            font-size: 0.62rem;
          }

          .knowledge-page h1 {
            max-width: 860px;
            margin: 0;
            color: #fff7e6;
            font-family: var(--font-display);
            font-size: clamp(3.2rem, 8vw, 7.4rem);
            font-weight: 300;
            line-height: 0.9;
            letter-spacing: -0.045em;
            text-wrap: balance;
          }

          .knowledge-page__voice {
            max-width: 780px;
            margin: 1.4rem 0 0;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: clamp(1.08rem, 2vw, 1.35rem);
            line-height: 1.72;
          }

          .knowledge-page__grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
            margin-top: clamp(2.2rem, 5vw, 4rem);
          }

          .knowledge-card {
            min-height: 100%;
            padding: clamp(1.25rem, 3vw, 1.75rem);
          }

          .knowledge-card__meta {
            display: flex;
            justify-content: space-between;
            gap: 1rem;
            color: rgba(246, 176, 94, 0.54);
            font-size: 0.55rem;
          }

          .knowledge-card h2 {
            margin: 1.4rem 0 0.8rem;
            color: #fff7e6;
            font-family: var(--font-display);
            font-size: clamp(1.9rem, 3vw, 2.75rem);
            font-weight: 300;
            line-height: 1;
            letter-spacing: -0.025em;
          }

          .knowledge-card p {
            margin: 0;
            color: rgba(232, 228, 220, 0.68);
            font-family: var(--font-body);
            font-size: 0.95rem;
            line-height: 1.82;
          }

          .knowledge-card__action {
            margin-top: 1.35rem;
          }

          .knowledge-page__seal {
            margin-top: 2rem;
            color: rgba(154, 150, 142, 0.78);
            font-size: 0.58rem;
          }

          @media (max-width: 900px) {
            .knowledge-page__grid {
              grid-template-columns: 1fr;
            }
          }
        `}</style>

        <main className="knowledge-page__wrap">
          <p className="knowledge-page__kicker">// archiva layer</p>
          <h1>Archiva</h1>
          <p className="knowledge-page__voice">
            The public archive layer of ORIEL Signal: transmissions, sacred text,
            and the future physical Codex Cosmichronica gathered into one clear
            threshold.
          </p>

          <section
            className="knowledge-page__grid"
            aria-label="Archiva chambers"
          >
            {knowledgeNodes.map(node => (
              <GlowCard
                key={node.code}
                tone={node.tone}
                className="knowledge-card"
              >
                <div className="knowledge-card__meta">
                  <span>{node.code}</span>
                  <span>{node.status}</span>
                </div>
                <h2>{node.title}</h2>
                <p>{node.copy}</p>
                <div className="knowledge-card__action">
                  <SignalButton href={node.href} variant="secondary">
                    {node.action}
                  </SignalButton>
                </div>
              </GlowCard>
            ))}
          </section>

          <p className="knowledge-page__seal">
            ORIEL ARCHIVA · TRANSMISSIONS · COSMICHRONICA · PRINT CODEX
            CANDIDATE
          </p>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
