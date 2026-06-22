import Layout from "@/components/Layout";
import {
  GlowCard,
  SignalButton,
  SignalPageShell,
  DecodedTitle,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";

const arcanaCards = [
  {
    title: "COSMICHRONICA",
    copy: "A map of reality, emergence, time, consciousness and the unfolding of structure.",
    href: "/cosmichronica",
    tone: "gold" as const,
  },
  {
    title: "TRANSMISSIONS",
    copy: "Essays, field notes and fragments exploring meaning, perception and symbolic intelligence.",
    href: "/archive",
    tone: "teal" as const,
  },
  {
    title: "CORE CONCEPTS",
    copy: "The essential ideas behind the archive: pattern, resonance, identity, coherence and attention.",
    href: "/bio-architecture",
    tone: "gold" as const,
  },
  {
    title: "MODELS & MAPS",
    copy: "Visual frameworks and explanatory diagrams for understanding inner and outer reality.",
    href: "/cosmichronica",
    tone: "amber" as const,
  },
  {
    title: "ARCHIVE INDEX",
    copy: "A structured directory of all available writings, systems and knowledge entries.",
    href: "/archive",
    tone: "teal" as const,
  },
];

export default function Arcana() {
  return (
    <Layout>
      <SignalPageShell chamber="threshold" className="arcana-page">
        <SacredGeometryField static />

        <style>{`
          .arcana-page {
            min-height: 100vh;
            padding: clamp(7.5rem, 12vw, 10rem) 1.5rem 6rem;
          }

          .arcana-page__wrap {
            position: relative;
            z-index: 1;
            width: min(1180px, 100%);
            margin: 0 auto;
          }

          .arcana-kicker {
            margin: 0 0 0.9rem;
            color: rgba(246, 176, 94, 0.7);
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 0.62rem;
          }

          .arcana-page h1 {
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

          .arcana-voice {
            max-width: 780px;
            margin: 1.4rem 0 1.8rem;
            color: rgba(232, 228, 220, 0.72);
            font-family: var(--font-voice);
            font-style: italic;
            font-size: clamp(1.08rem, 2vw, 1.35rem);
            line-height: 1.72;
          }

          .arcana-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 0.75rem;
            margin-bottom: 3rem;
          }

          .arcana-cards-section {
            margin-top: clamp(1.5rem, 4vw, 2.5rem);
          }

          .arcana-cards-section h2 {
            font-family: var(--font-ritual);
            text-transform: uppercase;
            letter-spacing: 0.18em;
            font-size: 0.7rem;
            color: rgba(246, 176, 94, 0.7);
            margin-bottom: 1rem;
          }

          .arcana-grid {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 1rem;
          }

          .arcana-card {
            min-height: 100%;
            padding: clamp(1.25rem, 3vw, 1.75rem);
            position: relative;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }

          .arcana-card:hover {
            transform: translateY(-1px);
          }

          /* Subtle hover line to background geometry */
          .arcana-card:hover::after {
            content: '';
            position: absolute;
            left: 20%;
            right: 20%;
            bottom: -2px;
            height: 1px;
            background: linear-gradient(to right, transparent, rgba(246, 176, 94, 0.35), transparent);
            pointer-events: none;
          }

          .arcana-card h3 {
            margin: 1.2rem 0 0.7rem;
            color: #fff7e6;
            font-family: var(--font-display);
            font-size: clamp(1.6rem, 2.8vw, 2.1rem);
            font-weight: 300;
            line-height: 1;
            letter-spacing: -0.02em;
          }

          .arcana-card p {
            margin: 0;
            color: rgba(232, 228, 220, 0.68);
            font-family: var(--font-body);
            font-size: 0.95rem;
            line-height: 1.82;
          }

          .arcana-card__action {
            margin-top: 1.2rem;
          }

          .arcana-seal {
            margin-top: 2.5rem;
            color: rgba(154, 150, 142, 0.78);
            font-family: var(--font-ritual);
            font-size: 0.58rem;
            letter-spacing: 0.18em;
          }

          @media (max-width: 900px) {
            .arcana-grid {
              grid-template-columns: 1fr;
            }
          }

          /* SUBTLE MOTION ONLY - no redesign, slow and faint */

          /* Slow background geometry drift (on top of SacredGeometryField) */
          .arcana-geo-drift {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            opacity: 0.08;
            mix-blend-mode: screen;
            animation: arcana-drift 42s linear infinite;
          }

          @keyframes arcana-drift {
            0% { transform: translate(0, 0); }
            50% { transform: translate(1.2%, -0.8%); }
            100% { transform: translate(0, 0); }
          }

          /* Tiny golden archive nodes */
          .arcana-nodes {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            overflow: hidden;
          }

          .arcana-node {
            position: absolute;
            width: 3px;
            height: 3px;
            background: #f6b05e;
            border-radius: 50%;
            opacity: 0.12;
            animation: arcana-node-pulse 8s ease-in-out infinite;
          }

          .arcana-node:nth-child(1) { top: 18%; left: 12%; animation-delay: 0s; }
          .arcana-node:nth-child(2) { top: 32%; left: 78%; animation-delay: 2.4s; }
          .arcana-node:nth-child(3) { top: 61%; left: 22%; animation-delay: 5.1s; }
          .arcana-node:nth-child(4) { top: 74%; left: 65%; animation-delay: 1.8s; }
          .arcana-node:nth-child(5) { top: 41%; left: 45%; animation-delay: 7.2s; }

          @keyframes arcana-node-pulse {
            0%, 100% { opacity: 0.06; transform: scale(0.6); }
            50% { opacity: 0.22; transform: scale(1); }
          }

          /* Thin connection lines */
          .arcana-lines {
            position: absolute;
            inset: 0;
            pointer-events: none;
            z-index: 0;
            opacity: 0.07;
          }

          .arcana-line {
            position: absolute;
            background: linear-gradient(90deg, transparent, rgba(246,176,94,0.6), transparent);
            height: 1px;
            animation: arcana-line-draw 18s ease-in-out infinite;
          }

          @keyframes arcana-line-draw {
            0%, 100% { opacity: 0.04; }
            40%, 60% { opacity: 0.14; }
          }

          /* Title inscription resolve feel is handled by DecodedTitle component */
        `}</style>

        <main className="arcana-page__wrap">
          {/* HERO */}
          <div className="arcana-hero" style={{ position: "relative" }}>
            <div className="arcana-geo-drift" aria-hidden="true" />
            <div className="arcana-nodes" aria-hidden="true">
              <span className="arcana-node" />
              <span className="arcana-node" />
              <span className="arcana-node" />
              <span className="arcana-node" />
              <span className="arcana-node" />
            </div>
            <div className="arcana-lines" aria-hidden="true">
              <div className="arcana-line" style={{ top: "28%", left: "8%", width: "18%", animationDelay: "0s" }} />
              <div className="arcana-line" style={{ top: "47%", left: "62%", width: "14%", animationDelay: "4s" }} />
            </div>

            <p className="arcana-kicker">FIRST LAYER OF THE ARCHIVE</p>

            <h1>
              <DecodedTitle text="ARCANA" as="span" interval={58} />
            </h1>

            <p className="arcana-voice">
              Explore consciousness, patterns, identity and the hidden structures of experience.
            </p>

            <div className="arcana-actions">
              <SignalButton href="#cards">ENTER ARCANA</SignalButton>
              <SignalButton href="#index" variant="secondary">
                VIEW INDEX
              </SignalButton>
            </div>
          </div>

          {/* ARCHIVE CARDS */}
          <section id="cards" className="arcana-cards-section" aria-label="Arcana archive cards">
            <h2>// public knowledge layer</h2>

            <div className="arcana-grid">
              {arcanaCards.map((card, index) => (
                <GlowCard
                  key={index}
                  tone={card.tone}
                  className="arcana-card"
                >
                  <h3>{card.title}</h3>
                  <p>{card.copy}</p>
                  <div className="arcana-card__action">
                    <SignalButton href={card.href} variant="secondary">
                      EXPLORE
                    </SignalButton>
                  </div>
                </GlowCard>
              ))}
            </div>
          </section>

          <p id="index" className="arcana-seal">
            ORIEL ARCANA · CONSCIOUSNESS · PATTERNS · RESONANCE · IDENTITY
          </p>
        </main>
      </SignalPageShell>
    </Layout>
  );
}
