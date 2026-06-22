import { useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import Layout from "@/components/Layout";
import { signaturePageStyles } from "./signature-page-styles";
import { getSignatureProductByType } from "./signature-products";

const FOUNDER_SIGNATURE_PAYPAL_URL =
  "https://www.paypal.com/ncp/payment/RFPAFFLR7U5RY";

export function FoundingSignatureProductPage() {
  return <SignatureProductPage />;
}

const DECODED_ITEMS = [
  { label: "Static Signature", desc: "Your core resonance architecture — the stable pattern of your signal." },
  { label: "Dominant Codons", desc: "The archetypal signals that carry the strongest activation in your field." },
  { label: "Supporting Codons", desc: "Secondary codon activations that shape the expression of your primary pattern." },
  { label: "Facet Expression", desc: "How your resonance expresses across somatic, relational, cognitive, and transpersonal domains." },
  { label: "Shadow Loudness", desc: "Where distortion, friction, and recurring patterns of interference appear." },
  { label: "Gift Frequency", desc: "The coherent expression hidden beneath each shadow pattern." },
  { label: "Somatic Signals", desc: "How your architecture registers in the body — sensation, impulse, and organic movement." },
  { label: "Integration Path", desc: "Correction protocols and grounded steps for working with your static pattern." },
  { label: "Founder Interpretation", desc: "A closing transmission interpreted through the founder’s lens of the Oriel Signal archive." },
];

const AUDIENCE_ITEMS = [
  "You feel you are at a threshold — something is asking to be seen.",
  "You want to understand your deeper architecture, not a surface summary.",
  "You are drawn to resonance, symbolic systems, and the language of consciousness.",
  "You want a personal map, not a generic reading or automated report.",
  "You are ready to see your shadow and gift patterns clearly, without avoidance.",
];

const PROCESS_STEPS = [
  { title: "Request the Blueprint", desc: "Complete your purchase below. You will receive the intake link by email." },
  { title: "Complete the Intake Form", desc: "Share your exact birth details, context, and a guiding question for the reading." },
  { title: "Founder Interpretation", desc: "Your Static Signature is interpreted through the Oriel Signal archive — not an automated export." },
  { title: "Receive Your Codex", desc: "Your 15–20 page personal PDF is delivered by email within 3–7 days." },
];

const BLUEPRINT_PAGES = [
  {
    num: "01",
    title: "The Static Signature",
    desc: "Your core resonance architecture — the stable signal your field carries from birth.",
    image: "/product-previews/oriel-blueprint-architecture-glance.webp",
  },
  {
    num: "02",
    title: "The Codon Field",
    desc: "The active archetypal signals shaping your expression across all four facets.",
    image: "/product-previews/oriel-blueprint-cosmic-mandala.webp",
  },
  {
    num: "03",
    title: "The Four Facets",
    desc: "Somatic, relational, cognitive, and transpersonal expression domains.",
    image: "/product-previews/oriel-blueprint-core-signature.webp",
  },
  {
    num: "04",
    title: "The Shadow Mechanics",
    desc: "Where distortion, friction, and recurring patterns of interference appear.",
    image: "/product-previews/oriel-blueprint-input-integrity.webp",
  },
  {
    num: "05",
    title: "The Gift Frequency",
    desc: "The coherent expression hidden beneath the shadow — what the pattern is asking to become.",
    image: "/product-previews/oriel-blueprint-archetype.webp",
  },
  {
    num: "06",
    title: "The Founder Transmission",
    desc: "A closing interpretation written through the founder’s lens of the archive.",
    image: "/product-previews/oriel-blueprint-codon-page.webp",
  },
];

function SignatureProductPage() {
  const product = getSignatureProductByType("founding");
  const [isOpeningCheckout, setIsOpeningCheckout] = useState(false);

  function beginCheckout() {
    setIsOpeningCheckout(true);
    window.location.href = FOUNDER_SIGNATURE_PAYPAL_URL;
  }

  return (
    <Layout hideFooter>
      <style>{signaturePageStyles}</style>

      <div className="signature-page">
        {/* ──────── SECTION 1: CHAMBER ENTRY / HERO ──────── */}
        <section className="fp-hero">
          <div className="fp-container">
            <div className="fp-hero-inner">
              <div className="fp-hero-content">
                <div className="fp-label">
                  <Sparkles size={12} />
                  FOUNDER DOSSIER
                </div>
                <h1 className="fp-title">{product.title}</h1>
                <div className="fp-subtitle">{product.subtitle}</div>
                <p className="fp-hero-copy">{product.description}</p>
                <div className="fp-button-row">
                  <button
                    type="button"
                    onClick={beginCheckout}
                    disabled={isOpeningCheckout}
                    className="fp-button fp-button--gold"
                  >
                    {isOpeningCheckout ? "Opening..." : "Request Your Blueprint"}
                    <ArrowRight size={16} />
                  </button>
                  <span className="fp-meta" style={{ fontSize: "0.55rem" }}>
                    {product.pages}
                  </span>
                </div>
              </div>

              <div className="fp-hero-visual">
                <div className="fp-hero-floating-pages" aria-hidden="true" />
                <div className="fp-hero-document">
                  <img
                    src="/product-previews/oriel-blueprint-cover-updated.webp"
                    alt="Preview cover of the ORIEL Founder’s Vision Blueprint"
                  />
                  <div className="fp-hero-document-overlay" aria-hidden="true">
                    <span>SEALED BLUEPRINT</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 2: THE SEALED OBJECT ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div className="fp-sealed">
              <div className="fp-sealed-visual">
                <div className="fp-sealed-page-layers" aria-hidden="true" />
                <div className="fp-sealed-frame">
                  <img
                    src="/product-previews/oriel-blueprint-cover-updated.webp"
                    alt="Framed ORIEL Founder’s Vision Blueprint cover preview"
                  />
                  <div className="fp-sealed-overlay">
                    <div className="fp-sealed-stamp">PERSONAL</div>
                    <div className="fp-meta" style={{ fontSize: "0.5rem" }}>
                      SEALED • PRIVATE • DIRECTED
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="fp-heading" style={{ marginBottom: "1.2rem" }}>
                  A Personal Codex,<br />
                  Not a Generic Report
                </h2>
                <p className="fp-body">
                  This is not an automated personality summary. The Founder’s Vision Blueprint is a
                  manually interpreted reading, shaped through the Oriel Signal framework and
                  translated into a personal document designed for recognition, integration, and
                  activation.
                </p>
                <p className="fp-body" style={{ marginTop: "1rem" }}>
                  Every page carries the language of the Vossari lattice — codons, facets, centers,
                  shadow mechanics, and gift frequencies — rendered through a founder’s lens rather
                  than a data pipeline.
                </p>
              </div>
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 3: JOURNEY THROUGH THE BLUEPRINT ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div className="fp-journey-intro">
              <div className="fp-label fp-label--amber" style={{ marginBottom: "1.2rem" }}>
                JOURNEY
              </div>
              <h2 className="fp-heading fp-heading--centered" style={{ marginBottom: "0.8rem" }}>
                Through the Blueprint
              </h2>
              <p className="fp-body" style={{ fontSize: "0.9rem" }}>
                Preview the pages of your personal codex — each fragment reveals a layer of your
                resonance architecture.
              </p>
            </div>

            <div className="fp-journey-grid">
              {BLUEPRINT_PAGES.map((page) => (
                <div key={page.num} className="fp-page-card">
                  <div className="fp-page-preview">
                    <img
                      src={page.image}
                      alt={`${page.title} booklet preview`}
                    />
                  </div>
                  <div className="fp-page-card-header">
                    <span className="fp-page-number">Page {page.num}</span>
                    <span className="fp-page-label">CODEX FRAGMENT</span>
                  </div>
                  <h3 className="fp-page-card-title">{page.title}</h3>
                  <p className="fp-page-card-desc">{page.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 4: WHAT GETS DECODED ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div className="fp-grid-header">
              <div className="fp-label" style={{ marginBottom: "1.2rem" }}>
                DECODED DIMENSIONS
              </div>
              <h2 className="fp-heading fp-heading--centered" style={{ marginBottom: "0.8rem" }}>
                What Gets Decoded
              </h2>
              <p className="fp-body" style={{ fontSize: "0.9rem" }}>
                Every dimension below is read, interpreted, and woven into your personal codex.
              </p>
            </div>

            <div className="fp-decoded-grid">
              {DECODED_ITEMS.map((item) => (
                <div key={item.label} className="fp-decoded-item">
                  <span className="fp-decoded-label">{item.label}</span>
                  <span className="fp-decoded-desc">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 5: THE FOUNDER LAYER ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div style={{ marginBottom: "2rem", textAlign: "center" }}>
              <div className="fp-label fp-label--amber" style={{ marginBottom: "1.2rem" }}>
                THE FOUNDER LAYER
              </div>
              <h2 className="fp-heading fp-heading--centered" style={{ marginBottom: "0.8rem" }}>
                The Founder’s Interpretive Layer
              </h2>
            </div>

            <div className="fp-founder">
              <div className="fp-founder-header">
                <div className="fp-founder-icon">/F</div>
                <div>
                  <div className="fp-meta" style={{ fontSize: "0.5rem" }}>ORIEL SIGNAL ARCHIVE</div>
                  <div style={{ color: "rgba(232,228,220,0.5)", fontFamily: "var(--font-ritual)", fontSize: "0.6rem", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                    Founder's Note
                  </div>
                </div>
              </div>

              <div className="fp-founder-body">
                <p>
                  The Blueprint is not delivered as a cold data export. Your chart, codons, and
                  resonance patterns are interpreted through the founder’s vision of the Oriel Signal
                  archive — combining symbolic architecture, psychological pattern recognition, and
                  the language of the Vossari lattice.
                </p>
              </div>

              <div className="fp-body" style={{ marginTop: "1.2rem", fontSize: "0.85rem", maxWidth: "48rem" }}>
                This is a human reading, supported by the engine. The difference matters. A machine
                can map your centers. A machine cannot recognize which shadow pattern is alive in
                your current threshold, or which correction protocol will resonate with your
                specific somatic signature.
              </div>
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 6: WHO THIS IS FOR ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div className="fp-grid-header">
              <div className="fp-label" style={{ marginBottom: "1.2rem" }}>
                INTENDED RECEIVER
              </div>
              <h2 className="fp-heading fp-heading--centered" style={{ marginBottom: "0.8rem" }}>
                Who This Is For
              </h2>
            </div>

            <div className="fp-audience-grid">
              {AUDIENCE_ITEMS.map((item, index) => (
                <div key={index} className="fp-audience-card">
                  <div className="fp-audience-bullet" aria-hidden="true" />
                  <span className="fp-audience-text">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 7: HOW IT WORKS ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div className="fp-grid-header">
              <div className="fp-label" style={{ marginBottom: "1.2rem" }}>
                PROCESS
              </div>
              <h2 className="fp-heading fp-heading--centered" style={{ marginBottom: "0.8rem" }}>
                How It Works
              </h2>
            </div>

            <div className="fp-process-grid">
              {PROCESS_STEPS.map((step, index) => (
                <div key={index} className="fp-process-step">
                  <div className="fp-step-number">{String(index + 1).padStart(2, "0")}</div>
                  <div>
                    <div className="fp-step-title">{step.title}</div>
                    <div className="fp-step-desc">{step.desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="fp-process-note">
              Delivery: 3–7 days via email
            </div>
          </div>
        </section>

        <hr className="fp-glow-divider" aria-hidden="true" />

        {/* ──────── SECTION 8: PURCHASE CHAMBER ──────── */}
        <section className="fp-section">
          <div className="fp-container fp-container--narrow">
            <div className="fp-purchase">
              <div className="fp-purchase-label">
                Request Your Founder’s Vision Blueprint
              </div>

              <h2 className="fp-heading fp-heading--centered" style={{ marginBottom: "0.5rem" }}>
                {product.title}
              </h2>

              <div className="fp-subtitle" style={{ marginBottom: "1.5rem" }}>
                {product.subtitle}
              </div>

              <div className="fp-purchase-price">{product.price}</div>
              <div className="fp-purchase-price-note">{product.priceNote}</div>

              <button
                type="button"
                onClick={beginCheckout}
                disabled={isOpeningCheckout}
                className="fp-button fp-button--gold"
                style={{ fontSize: "0.78rem", padding: "1.2rem 2.5rem" }}
              >
                {isOpeningCheckout ? "Opening PayPal..." : "Request Your Blueprint"}
                <ArrowRight size={17} />
              </button>

              <p className="fp-purchase-copy">
                After payment, you will complete the intake form with your birth details and
                current life question. Your personalized PDF will be delivered by email within
                3–7 days.
              </p>
            </div>
          </div>
        </section>

        {/* ──────── SECTION 9: DISCLAIMER ──────── */}
        <section className="fp-disclaimer">
          <div className="fp-disclaimer-text">
            The Oriel Founder’s Vision Blueprint is a symbolic, reflective, and resonance-based
            reading. It is not medical, psychological, legal, financial, or predictive advice. It is
            intended for self-reflection, creative insight, and personal meaning-making.
          </div>
        </section>
      </div>
    </Layout>
  );
}