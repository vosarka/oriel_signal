import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import Layout from "@/components/Layout";
import { SignalPageShell } from "@/components/oriel-signal/OrielSignalDesign";
import { StarsBackground } from "@/components/ui/stars";
import { getSignatureProductByType } from "./signature-products";

const FOUNDER_SIGNATURE_PAYPAL_URL =
  "https://www.paypal.com/ncp/payment/RFPAFFLR7U5RY";

const COVER_SRC = "/assets/cover.png";
const LOGO_SRC = "/oriel-signal-mark.png";
const POSITIONING_PAGE = "/assets/page2.png";
const FOUNDER_NOTE_PAGE = "/assets/page 14.png";

const MANUSCRIPT_PLATES = [
  { roman: "I", label: "DECRYPTION PROTOCOL", image: "/assets/page3.png" },
  { roman: "II", label: "FOUNDER'S ADDRESS", image: "/assets/page 4.png" },
  { roman: "III", label: "ARCHITECTURAL OVERVIEW", image: "/assets/page 5.png" },
  { roman: "IV", label: "FRACTAL ROLE", image: "/assets/page 6.png" },
  { roman: "V", label: "DECISION COMPASS", image: "/assets/page 7.png" },
  { roman: "VI", label: "CENTER ARCHITECTURE", image: "/assets/page 8.png" },
  { roman: "VII", label: "SHADOW MECHANICS", image: "/assets/page 10.png" },
  { roman: "VIII", label: "INTEGRATION PROTOCOL", image: "/assets/page 13.png" },
];

const ARCHITECTURE_CARDS = [
  { n: "01", title: "Identity Architecture", desc: "Maps your primary fractal role, secondary pattern, and core symbolic function." },
  { n: "02", title: "Decision Compass", desc: "Reveals how your system is designed to decide, respond, initiate, or wait." },
  { n: "03", title: "Resonance Codons", desc: "Shows the active symbolic codons shaping your conscious and unconscious architecture." },
  { n: "04", title: "Shadow & Gift Mechanics", desc: "Identifies distortion patterns, bottlenecks, coherence points, and integration pathways." },
];

const TETRAD_NODES = [
  { roman: "I", label: "ORIGIN", angle: 270 },
  { roman: "II", label: "RECURSION", angle: 0 },
  { roman: "III", label: "TENSION", angle: 90 },
  { roman: "IIII", label: "SATURATION", angle: 180 },
];
const TETRAD_BRIDGE = { roman: "IIII'I", label: "NEW CYCLE · BRIDGE", angle: 315 };

const DELIVERABLES = [
  { n: "01", title: "Personalized Founder-Curated Manuscript", desc: "A high-end PDF artifact built around your unique resonance structure." },
  { n: "02", title: "Architectural Overview", desc: "A visual dashboard of your role, authority, coherence, codons, centers, and active links." },
  { n: "03", title: "Codon & Center Analysis", desc: "A symbolic breakdown of your active and receptive systems." },
  { n: "04", title: "Shadow Mechanics", desc: "A precise map of recurring distortion patterns and energetic bottlenecks." },
  { n: "05", title: "Gift & Coherence Layer", desc: "A reading of your stable gifts, high-coherence functions, and integration direction." },
  { n: "06", title: "Integration Protocol", desc: "Practical reflection prompts and micro-corrections for applying the manuscript over time." },
];

const PROCESS_STEPS = [
  { n: "01", title: "Submit Your Data", desc: "Name, birth date, birth time, and location." },
  { n: "02", title: "Structural Mapping", desc: "The system calculates your resonance architecture and symbolic codon structure." },
  { n: "03", title: "Founder Curation", desc: "Vos Arkana reviews the architecture and writes the interpretive synthesis." },
  { n: "04", title: "Manuscript Delivery", desc: "You receive your Founder-Curated Bio-Signature as a premium PDF manuscript." },
];

function Reveal({
  children,
  className,
  style,
  delay = 0,
  y = 26,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
  y?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      className={className}
      style={style}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12% 0px" }}
      transition={{ duration: 0.95, ease: [0.16, 1, 0.3, 1], delay }}
    >
      {children}
    </motion.div>
  );
}

function tetradPoint(angleDeg: number, r: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return { x: 50 + r * Math.cos(rad), y: 50 + r * Math.sin(rad) };
}

function TetradicDiagram() {
  const radius = 34;
  return (
    <div className="fsg-tetrad">
      <svg viewBox="0 0 100 100" className="fsg-tetrad__svg" aria-hidden="true">
        <circle cx={50} cy={50} r={radius} fill="none" stroke="rgba(201,162,74,0.18)" strokeWidth={0.4} />
        {TETRAD_NODES.map(node => {
          const p = tetradPoint(node.angle, radius);
          return (
            <motion.line
              key={node.roman}
              x1={50}
              y1={50}
              x2={p.x}
              y2={p.y}
              stroke="#C9A24A"
              strokeWidth={0.4}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 0.6 }}
              viewport={{ once: true }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          );
        })}
        <motion.circle
          cx={50}
          cy={50}
          r={1.4}
          fill="#FFD700"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </svg>

      {TETRAD_NODES.map((node, i) => {
        const p = tetradPoint(node.angle, radius);
        return (
          <Reveal
            key={node.roman}
            delay={i * 0.08}
            className="fsg-tetrad__node"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            <span className="fsg-tetrad__roman">{node.roman}</span>
            <span className="fsg-tetrad__label">{node.label}</span>
          </Reveal>
        );
      })}

      {(() => {
        const p = tetradPoint(TETRAD_BRIDGE.angle, radius * 1.55);
        return (
          <Reveal delay={0.4} className="fsg-tetrad__node fsg-tetrad__node--bridge" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
            <span className="fsg-tetrad__roman">{TETRAD_BRIDGE.roman}</span>
            <span className="fsg-tetrad__label">{TETRAD_BRIDGE.label}</span>
          </Reveal>
        );
      })()}
    </div>
  );
}

export default function FounderCuratedBlueprint() {
  const product = getSignatureProductByType("founding");
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  useEffect(() => {
    document.title = "The Founder-Curated Bio-Signature · Vos Arkana";
  }, []);

  function beginCheckout() {
    setIsOpeningCheckout(true);
    window.location.href = FOUNDER_SIGNATURE_PAYPAL_URL;
  }

  return (
    <Layout overlayHeader>
      <style>{PAGE_STYLES}</style>

      <StarsBackground
        className="fsg-stars bg-none bg-transparent"
        starColor="#f0e6cc"
        speed={90}
        factor={0.02}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />

      <SignalPageShell chamber="threshold" className="fsg-shell">
      <div className="fsg-page">
        {/* ════════ 1 — HERO / THE SEALED MANUSCRIPT ════════ */}
        <section className="fsg-hero">
          <div className="fsg-hero__bg" style={{ backgroundImage: `url(${COVER_SRC})` }} aria-hidden="true" />
          <div className="fsg-hero__overlay" aria-hidden="true" />
          <motion.div
            className="fsg-hero__topline"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            aria-hidden="true"
          />

          <motion.div
            className="fsg-hero__body"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          >
            <p className="fsg-mono">VOS ARKANA / ORIEL SYSTEM ASSET</p>
            <h1 className="fsg-hero__title">The Founder-Curated Bio-Signature</h1>
            <p className="fsg-hero__subtitle">{product.subtitle}</p>
            <p className="fsg-mono fsg-hero__system">The Tetradic Resonance Codex</p>
            <p className="fsg-hero__body-copy">
              A personalized symbolic manuscript that maps your structural identity, resonance
              patterns, shadow mechanics, gift architecture, and integration path.
            </p>
            <div className="fsg-hero__actions">
              <button type="button" onClick={beginCheckout} disabled={isOpeningCheckout} className="fsg-btn fsg-btn--gold">
                {isOpeningCheckout ? "Opening…" : "Begin My Signature"}
                <ArrowRight size={16} />
              </button>
              <a href="#manuscript" className="fsg-btn">Preview the Manuscript</a>
            </div>
          </motion.div>

          <p className="fsg-hero__cue">Scroll to open the chamber</p>
        </section>

        {/* ════════ 2 — PRODUCT POSITIONING ════════ */}
        <section className="fsg-scene fsg-position">
          <div className="fsg-position__col">
            <Reveal>
              <p className="fsg-mono fsg-kicker">POSITIONING</p>
              <h2 className="fsg-heading">This Is Not What You Think It Is</h2>
              <p className="fsg-body fsg-strike">This is not astrology.</p>
              <p className="fsg-body fsg-strike">It is not Human Design.</p>
              <p className="fsg-body fsg-strike">It is not a personality test.</p>
              <p className="fsg-body fsg-strike">It is not a belief system.</p>
              <p className="fsg-body fsg-position__gold">
                It is a founder-curated symbolic architecture report: a structured manuscript that
                translates your personal data into a resonance map of identity, pressure,
                distortion, coherence, and integration.
              </p>
              <a href="#manuscript" className="fsg-btn" style={{ marginTop: "1.6rem" }}>See What Is Inside</a>
            </Reveal>
          </div>
          <div className="fsg-position__divider" aria-hidden="true" />
          <div className="fsg-position__col fsg-position__visual">
            <Reveal delay={0.15} className="fsg-plate fsg-plate--tilt">
              <img src={POSITIONING_PAGE} alt="Manuscript page — architecture overview" className="fsg-plate__img" />
            </Reveal>
          </div>
        </section>

        {/* ════════ 3 — MANUSCRIPT PREVIEW ════════ */}
        <section className="fsg-scene fsg-manuscript" id="manuscript">
          <Reveal className="fsg-section-head">
            <p className="fsg-mono fsg-kicker">THE PAGES EMERGE</p>
            <h2 className="fsg-heading">Inside the manuscript, your signature is translated into a complete symbolic system — not as a prediction, but as an architectural reading.</h2>
          </Reveal>

          <div className="fsg-manuscript__grid">
            {MANUSCRIPT_PLATES.map((page, i) => (
              <Reveal key={page.roman} delay={(i % 4) * 0.06} y={40} className={`fsg-plate fsg-plate--card ${i % 2 === 1 ? "fsg-plate--tiltR" : "fsg-plate--tiltL"}`}>
                <img src={page.image} alt={`${page.label} manuscript page`} loading="lazy" className="fsg-plate__img" />
                <span className="fsg-plate__tag">{page.roman}. {page.label}</span>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ════════ 4 — ARCHITECTURAL OVERVIEW ════════ */}
        <section className="fsg-scene fsg-overview">
          <Reveal className="fsg-section-head">
            <p className="fsg-mono fsg-kicker">STRUCTURE</p>
            <h2 className="fsg-heading">A Complete Architectural Overview</h2>
          </Reveal>

          <div className="fsg-overview__grid">
            {ARCHITECTURE_CARDS.map((card, i) => (
              <Reveal key={card.n} delay={i * 0.06} className="fsg-card">
                <span className="fsg-card__corner fsg-card__corner--tl" />
                <span className="fsg-card__corner fsg-card__corner--br" />
                <span className="fsg-mono fsg-card__n">{card.n}</span>
                <h3 className="fsg-card__title">{card.title}</h3>
                <p className="fsg-card__desc">{card.desc}</p>
                <span className="fsg-card__glyph" aria-hidden="true" />
              </Reveal>
            ))}
          </div>
        </section>

        {/* ════════ 5 — FOUNDER-CURATED LAYER ════════ */}
        <section className="fsg-scene fsg-founder">
          <div className="fsg-founder__visual">
            <Reveal className="fsg-plate fsg-plate--note">
              <img src={FOUNDER_NOTE_PAGE} alt="A Message From Vos Arkana — founder note page" className="fsg-plate__img" />
            </Reveal>
          </div>
          <div className="fsg-founder__col">
            <Reveal delay={0.1}>
              <p className="fsg-mono fsg-kicker">CURATION</p>
              <h2 className="fsg-heading fsg-heading--gold">Not Generated. Curated.</h2>
              <p className="fsg-body">
                The Static Signature Reading is not delivered as raw system output. Each manuscript includes
                a founder-curated interpretive layer: a symbolic synthesis that translates the
                architecture into human meaning, direction, and integration.
              </p>
              <p className="fsg-body fsg-founder__line">The system calculates the structure.</p>
              <p className="fsg-body fsg-founder__line">The founder layer interprets the resonance.</p>
              <p className="fsg-body fsg-founder__line fsg-founder__line--gold">The manuscript becomes the bridge.</p>
              <a href="#manuscript" className="fsg-btn" style={{ marginTop: "1rem" }}>Read the Founder Layer</a>
            </Reveal>
          </div>
        </section>

        {/* ════════ 6 — TETRADIC RESONANCE SYSTEM ════════ */}
        <section className="fsg-scene fsg-system">
          <Reveal className="fsg-section-head">
            <p className="fsg-mono fsg-kicker">THE ENGINE</p>
            <h2 className="fsg-heading">The Tetradic Resonance Codex</h2>
            <p className="fsg-body" style={{ margin: "1.2rem auto 0" }}>
              The manuscript is organized through tetradic logic: a fourfold architecture of origin,
              recursion, tension, and saturation — read not as a fixed personality, but as a living
              configuration of pattern, pressure, signal, and coherence.
            </p>
          </Reveal>

          <TetradicDiagram />

          <a href="/codex" className="fsg-btn" style={{ marginTop: "3rem" }}>Explore the Field Index</a>
        </section>

        {/* ════════ 7 — WHAT YOU RECEIVE ════════ */}
        <section className="fsg-scene fsg-deliverables">
          <Reveal className="fsg-section-head">
            <p className="fsg-mono fsg-kicker">THE OFFER</p>
            <h2 className="fsg-heading">What You Receive</h2>
          </Reveal>

          <div className="fsg-deliverables__grid">
            {DELIVERABLES.map((item, i) => (
              <Reveal key={item.n} delay={(i % 3) * 0.06} className="fsg-deliverable">
                <span className="fsg-mono fsg-deliverable__n">{item.n}</span>
                <h3 className="fsg-deliverable__title">{item.title}</h3>
                <p className="fsg-deliverable__desc">{item.desc}</p>
              </Reveal>
            ))}
          </div>

          <button type="button" onClick={beginCheckout} disabled={isOpeningCheckout} className="fsg-btn fsg-btn--gold" style={{ marginTop: "3rem" }}>
            {isOpeningCheckout ? "Opening…" : "Begin My Bio-Signature"}
            <ArrowRight size={16} />
          </button>
        </section>

        {/* ════════ 8 — PROCESS ════════ */}
        <section className="fsg-scene fsg-process">
          <Reveal className="fsg-section-head">
            <p className="fsg-mono fsg-kicker">EXPERIENCE</p>
            <h2 className="fsg-heading">How The Manuscript Is Created</h2>
          </Reveal>

          <div className="fsg-process__list">
            {PROCESS_STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.08} className="fsg-process__step">
                <span className="fsg-process__marker">{step.n}</span>
                <div className="fsg-process__rule" aria-hidden="true" />
                <div>
                  <div className="fsg-process__title">{step.title}</div>
                  <div className="fsg-process__desc">{step.desc}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ════════ 9 — FINAL CTA / THE SEAL ════════ */}
        <section className="fsg-seal">
          <div className="fsg-seal__stack" aria-hidden="true">
            {[FOUNDER_NOTE_PAGE, POSITIONING_PAGE, COVER_SRC].map((src, i) => (
              <img key={i} src={src} alt="" className="fsg-seal__page" style={{ zIndex: i }} />
            ))}
          </div>
          <div className="fsg-seal__overlay" aria-hidden="true" />

          <Reveal className="fsg-seal__body">
            <div className="fsg-seal__ring" aria-hidden="true">
              <img src={LOGO_SRC} alt="ORIEL seal" className="fsg-seal__logo" />
            </div>
            <h2 className="fsg-heading">Begin Your Bio-Signature</h2>
            <p className="fsg-body fsg-seal__copy">
              Receive a founder-curated manuscript that does not tell you who to become. It reflects
              the architecture that was already there.
            </p>

            <div className="fsg-seal__actions">
              <button type="button" onClick={beginCheckout} disabled={isOpeningCheckout} className="fsg-btn fsg-btn--gold">
                {isOpeningCheckout ? "Opening…" : "Begin My Founder-Curated Manuscript"}
                <ArrowRight size={16} />
              </button>
              <a href="#manuscript" className="fsg-btn">Preview Sample Pages</a>
              <a href="/conduit" className="fsg-btn">Speak With ORIEL</a>
            </div>

            <div className="fsg-seal__price">{product.price} <span>· {product.priceNote}</span></div>
            <p className="fsg-seal__closing">Enter as static. Leave as signal.</p>
          </Reveal>
        </section>

        <section className="fsg-disclaimer">
          <p>
            The Founder-Curated Bio-Signature is a symbolic, reflective, resonance-based reading. Not
            medical, psychological, legal, financial, or predictive advice.
          </p>
        </section>
      </div>
      </SignalPageShell>
    </Layout>
  );
}

const PAGE_STYLES = `
  .fsg-shell {
    position: relative;
    z-index: 1;
  }

  .fsg-page {
    --gold: #C9A24A;
    --gold-bright: #FFD700;
    --void: #050505;
    --ivory: #FDFBF7;
    --graphite: #1E2229;
    --muted: #8A8378;
    position: relative;
    background: transparent;
    color: var(--ivory);
    overflow: hidden;
  }

  .fsg-mono {
    font-family: var(--font-ritual);
    font-size: 0.62rem;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .fsg-kicker { color: var(--gold); margin-bottom: 1.1rem; }

  .fsg-heading {
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(1.8rem, 3.6vw, 2.9rem);
    line-height: 1.18;
    letter-spacing: -0.015em;
    color: var(--ivory);
    text-wrap: balance;
  }
  .fsg-heading--gold { color: var(--gold); }

  .fsg-body {
    font-family: var(--font-body);
    font-weight: 300;
    font-size: 0.98rem;
    line-height: 1.85;
    color: rgba(253,251,247,0.62);
    max-width: 30rem;
  }
  .fsg-strike { text-decoration: line-through; text-decoration-color: rgba(138,131,120,0.4); color: var(--muted); max-width: none; }
  .fsg-position__gold { color: rgba(253,251,247,0.85); font-family: var(--font-display); font-size: 1.1rem; line-height: 1.6; max-width: none; margin-top: 1.2rem; }

  .fsg-section-head { text-align: center; max-width: 42rem; margin: 0 auto 3.5rem; }

  .fsg-btn {
    display: inline-flex;
    align-items: center;
    gap: 0.7rem;
    border: 1px solid rgba(201,162,74,0.28);
    background: rgba(201,162,74,0.05);
    color: rgba(253,251,247,0.9);
    font-family: var(--font-ritual);
    font-size: 0.66rem;
    letter-spacing: 0.18em;
    text-transform: uppercase;
    text-decoration: none;
    padding: 0.95rem 1.6rem;
    cursor: pointer;
    transition: transform 0.4s cubic-bezier(0.16,1,0.3,1), border-color 0.4s ease, box-shadow 0.4s ease;
  }
  .fsg-btn:hover { transform: translateY(-2px); border-color: rgba(255,215,0,0.55); box-shadow: 0 0 30px rgba(201,162,74,0.12); }
  .fsg-btn--gold {
    border-color: rgba(255,215,0,0.5);
    color: var(--ivory);
    background: linear-gradient(135deg, rgba(255,215,0,0.14), rgba(201,162,74,0.08));
    text-shadow: 0 0 20px rgba(201,162,74,0.3);
  }

  .fsg-scene { position: relative; padding: 8rem 1.5rem; display: flex; flex-direction: column; align-items: center; }

  /* ── 1: HERO ── */
  .fsg-hero {
    position: relative;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 2rem 1.5rem;
    overflow: hidden;
  }
  .fsg-hero__bg {
    position: absolute;
    inset: 0;
    background-size: cover;
    background-position: center 30%;
    animation: fsgHeroZoom 26s ease-in-out infinite alternate;
  }
  @keyframes fsgHeroZoom { from { transform: scale(1); } to { transform: scale(1.08); } }
  .fsg-hero__overlay {
    position: absolute; inset: 0;
    background: radial-gradient(circle at 50% 42%, rgba(5,5,5,0.55) 0%, rgba(5,5,5,0.88) 60%, #050505 100%);
  }
  .fsg-hero__topline {
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, rgba(201,162,74,0.6), transparent);
    transform-origin: center;
  }
  .fsg-hero__body { position: relative; z-index: 1; display: flex; flex-direction: column; align-items: center; }
  .fsg-hero__title {
    margin-top: 1.2rem;
    font-family: var(--font-display);
    font-weight: 300;
    font-size: clamp(2.4rem, 6vw, 4.6rem);
    letter-spacing: -0.02em;
    line-height: 1.05;
    color: var(--ivory);
    text-shadow: 0 0 60px rgba(201,162,74,0.18);
  }
  .fsg-hero__subtitle {
    margin-top: 1rem;
    font-family: var(--font-ritual);
    font-size: 0.85rem;
    letter-spacing: 0.26em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .fsg-hero__system { margin-top: 0.6rem; color: rgba(138,131,120,0.85); }
  .fsg-hero__body-copy { margin-top: 1.6rem; max-width: 34rem; font-family: var(--font-body); font-weight: 300; font-size: 1rem; line-height: 1.85; color: rgba(253,251,247,0.68); }
  .fsg-hero__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 2.4rem; }
  .fsg-hero__cue {
    position: absolute; bottom: 2.2rem; left: 50%; transform: translateX(-50%);
    font-family: var(--font-ritual); font-size: 0.6rem; letter-spacing: 0.3em; text-transform: uppercase;
    color: rgba(138,131,120,0.6); z-index: 1;
  }

  /* ── PLATES (shared) ── */
  .fsg-plate { position: relative; border: 1px solid rgba(201,162,74,0.16); box-shadow: 0 40px 100px rgba(0,0,0,0.65), 0 0 50px rgba(201,162,74,0.06); background: #0a0a0a; }
  .fsg-plate__img { width: 100%; display: block; object-fit: cover; }
  .fsg-plate--tilt { transform: perspective(1400px) rotateY(-6deg) rotateX(2deg); max-width: 26rem; }
  .fsg-plate--note { max-width: 24rem; }
  .fsg-plate--card { width: 100%; }
  .fsg-plate--tiltL { transform: perspective(1200px) rotateY(4deg) rotate(-1.2deg); }
  .fsg-plate--tiltR { transform: perspective(1200px) rotateY(-4deg) rotate(1.2deg); }
  .fsg-plate__tag {
    display: block; margin-top: 1rem; font-family: var(--font-ritual); font-size: 0.6rem; letter-spacing: 0.18em;
    text-transform: uppercase; color: var(--gold); text-align: center;
  }

  /* ── 2: POSITIONING ── */
  .fsg-position { flex-direction: row; align-items: center; gap: 3rem; max-width: 78rem; margin: 0 auto; }
  .fsg-position__col { flex: 1; min-width: 0; }
  .fsg-position__divider { width: 1px; align-self: stretch; background: linear-gradient(to bottom, transparent, rgba(201,162,74,0.3), transparent); }
  .fsg-position__visual { display: flex; justify-content: center; }

  /* ── 4: OVERVIEW CARDS ── */
  .fsg-overview__grid { display: grid; gap: 1.5rem; width: 100%; max-width: 68rem; grid-template-columns: 1fr; }
  .fsg-card {
    position: relative; border: 1px solid rgba(138,131,120,0.18); background: rgba(30,34,41,0.35);
    padding: 2rem 1.8rem; transition: border-color 0.4s ease, transform 0.4s ease;
  }
  .fsg-card:hover { border-color: rgba(201,162,74,0.4); transform: translateY(-4px); }
  .fsg-card__corner { position: absolute; width: 16px; height: 16px; border: 1px solid var(--gold); opacity: 0.6; }
  .fsg-card__corner--tl { top: -1px; left: -1px; border-right: none; border-bottom: none; }
  .fsg-card__corner--br { bottom: -1px; right: -1px; border-left: none; border-top: none; }
  .fsg-card__n { display: block; margin-bottom: 1rem; }
  .fsg-card__title { font-family: var(--font-display); font-size: 1.3rem; font-weight: 300; color: var(--ivory); margin-bottom: 0.6rem; }
  .fsg-card__desc { font-family: var(--font-body); font-size: 0.88rem; color: rgba(253,251,247,0.55); line-height: 1.65; }
  .fsg-card__glyph {
    display: block; width: 26px; height: 1px; background: rgba(201,162,74,0.3); margin-top: 1.2rem;
    transition: width 0.4s ease;
  }
  .fsg-card:hover .fsg-card__glyph { width: 48px; background: rgba(255,215,0,0.6); }

  /* ── 3: MANUSCRIPT GRID ── */
  .fsg-manuscript__grid { display: grid; gap: 2.2rem; width: 100%; max-width: 72rem; grid-template-columns: 1fr; }

  /* ── 5: FOUNDER LAYER ── */
  .fsg-founder { flex-direction: row; align-items: center; gap: 3.5rem; max-width: 76rem; margin: 0 auto; background: radial-gradient(ellipse at 30% 50%, rgba(201,162,74,0.05), transparent 60%); }
  .fsg-founder__visual { flex: 0 0 auto; display: flex; justify-content: center; }
  .fsg-founder__col { flex: 1; min-width: 0; }
  .fsg-founder__line { margin-top: 0.5rem; font-style: italic; }
  .fsg-founder__line--gold { color: var(--gold); }

  /* ── 6: TETRAD ── */
  .fsg-tetrad { position: relative; width: min(90vw, 24rem); aspect-ratio: 1; margin: 2rem auto 0; }
  .fsg-tetrad__svg { width: 100%; height: 100%; overflow: visible; }
  .fsg-tetrad__node { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 0.35rem; text-align: center; }
  .fsg-tetrad__roman { font-family: var(--font-display); font-size: 1.3rem; color: var(--gold); }
  .fsg-tetrad__label { font-family: var(--font-ritual); font-size: 0.52rem; letter-spacing: 0.16em; color: var(--muted); white-space: nowrap; }
  .fsg-tetrad__node--bridge .fsg-tetrad__roman { font-size: 0.95rem; color: var(--gold-bright); }

  /* ── 7: DELIVERABLES ── */
  .fsg-deliverables__grid { display: grid; gap: 1px; background: rgba(138,131,120,0.12); border: 1px solid rgba(138,131,120,0.12); width: 100%; max-width: 68rem; grid-template-columns: 1fr; }
  .fsg-deliverable { background: #070707; padding: 1.8rem 1.6rem; }
  .fsg-deliverable__n { display: block; margin-bottom: 0.8rem; }
  .fsg-deliverable__title { font-family: var(--font-display); font-size: 1.05rem; font-weight: 300; color: var(--ivory); margin-bottom: 0.5rem; }
  .fsg-deliverable__desc { font-family: var(--font-body); font-size: 0.85rem; color: rgba(253,251,247,0.55); line-height: 1.6; }

  /* ── 8: PROCESS ── */
  .fsg-process__list { width: min(100%, 36rem); }
  .fsg-process__step { position: relative; display: flex; gap: 1.6rem; align-items: flex-start; padding: 1.8rem 0; }
  .fsg-process__marker {
    font-family: var(--font-ritual); font-size: 0.85rem; color: var(--gold); border: 1px solid rgba(201,162,74,0.4);
    width: 2.4rem; height: 2.4rem; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .fsg-process__rule { position: absolute; left: 1.2rem; top: 3rem; bottom: -0.4rem; width: 1px; background: rgba(201,162,74,0.16); }
  .fsg-process__step:last-child .fsg-process__rule { display: none; }
  .fsg-process__title { font-family: var(--font-display); font-size: 1.1rem; color: var(--ivory); margin-bottom: 0.35rem; }
  .fsg-process__desc { font-family: var(--font-body); font-size: 0.88rem; color: rgba(253,251,247,0.58); line-height: 1.6; }

  /* ── 9: SEAL ── */
  .fsg-seal { position: relative; min-height: 100vh; display: flex; align-items: center; justify-content: center; overflow: hidden; padding: 4rem 1.5rem; }
  .fsg-seal__stack { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; opacity: 0.25; }
  .fsg-seal__page { position: absolute; width: min(70vw, 20rem); aspect-ratio: 3/4; object-fit: cover; filter: blur(1px) saturate(0.6) brightness(0.5); }
  .fsg-seal__page:nth-child(1) { transform: rotate(-8deg) translateX(-30%); }
  .fsg-seal__page:nth-child(2) { transform: rotate(6deg) translateX(28%); }
  .fsg-seal__page:nth-child(3) { transform: rotate(-1deg); }
  .fsg-seal__overlay { position: absolute; inset: 0; background: radial-gradient(circle at 50% 50%, rgba(5,5,5,0.5) 0%, #050505 72%); }
  .fsg-seal__body { position: relative; z-index: 1; text-align: center; display: flex; flex-direction: column; align-items: center; max-width: 34rem; }
  .fsg-seal__ring {
    width: 84px; height: 84px; border-radius: 50%; border: 1px solid rgba(201,162,74,0.35);
    display: flex; align-items: center; justify-content: center; margin-bottom: 2rem;
    box-shadow: 0 0 40px rgba(201,162,74,0.14);
  }
  .fsg-seal__logo { width: 42px; height: 42px; object-fit: contain; filter: drop-shadow(0 0 16px rgba(201,162,74,0.4)); }
  .fsg-seal__copy { margin: 1.4rem auto 0; }
  .fsg-seal__actions { display: flex; flex-wrap: wrap; justify-content: center; gap: 1rem; margin-top: 2.2rem; }
  .fsg-seal__price { margin-top: 2rem; font-family: var(--font-ritual); font-size: 0.72rem; letter-spacing: 0.16em; color: var(--gold); }
  .fsg-seal__price span { color: var(--muted); }
  .fsg-seal__closing { margin-top: 2.4rem; font-family: var(--font-display); font-style: italic; font-size: 1.05rem; color: rgba(253,251,247,0.6); }

  .fsg-disclaimer { padding: 3rem 1.5rem; text-align: center; border-top: 1px solid rgba(138,131,120,0.1); }
  .fsg-disclaimer p { max-width: 34rem; margin: 0 auto; font-family: var(--font-body); font-size: 0.75rem; line-height: 1.7; color: rgba(138,131,120,0.6); }

  @media (min-width: 780px) {
    .fsg-overview__grid { grid-template-columns: repeat(2, 1fr); }
    .fsg-manuscript__grid { grid-template-columns: repeat(2, 1fr); }
    .fsg-deliverables__grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .fsg-manuscript__grid { grid-template-columns: repeat(4, 1fr); }
    .fsg-deliverables__grid { grid-template-columns: repeat(3, 1fr); }
  }
  @media (max-width: 860px) {
    .fsg-position { flex-direction: column; }
    .fsg-position__divider { display: none; }
    .fsg-founder { flex-direction: column; }
  }

  @media (prefers-reduced-motion: reduce) {
    .fsg-hero__bg { animation: none; }
  }
`;
