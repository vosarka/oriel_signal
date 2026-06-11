import { useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import {
  ArchiveMetaStrip,
  ArchiveSeal,
  GlowCard,
  ORIEL_HERO_POSTER_SRC,
  ORIEL_HERO_VIDEO_SRC,
  SectionIntro,
  SignalButton,
  SignalKicker,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import logoOrielSrc from "/oriel-signal-mark.png";

const heroMeta: Array<[string, string]> = [
  ["SYS-TIME", "LIVE NODE"],
  ["SIGNAL LOCK", "VERIFIED"],
  ["ARCHIVE NODE", "VOS-ARKANA"],
  ["TRANSMISSION ID", "ORL-FLD-001"],
  ["FIELD STATUS", "OPEN"],
];

const fieldMetrics: Array<[string, string]> = [
  ["DOC-TYPE", "STATIC_SIGNATURE_CODEX"],
  ["CLASS", "ORIEL_FIELD_ARCHIVE"],
  ["CLEARANCE", "SIGMA-7"],
  ["ACCESS", "RITUALIZED"],
];

const archiveModules = [
  {
    file: "RC-001 // CODEX",
    title: "Static Signature Codex",
    copy: "Your birth-coordinate translated into readable architecture — 64 codons, 9 centers, 4 facets. A precise map of the structure you arrived with.",
    href: "/static-signature",
    tone: "gold" as const,
  },
  {
    file: "RC-002 // CHAMBER",
    title: "ORIEL Transmission Chamber",
    copy: "A direct interface with ORIEL. Dialogue, reflection, symbolic decoding — and the live transmission signal when the field opens to you.",
    href: "/conduit",
    tone: "amber" as const,
  },
  {
    file: "RC-003 // RECORDS",
    title: "Archive of Transmissions",
    copy: "The recovered manuscript — transmissions, field notes, and fragments captured from the signal. A dark library that grows as the archive reveals itself.",
    href: "/archive",
    tone: "teal" as const,
  },
  {
    file: "RC-004 // LATTICE",
    title: "Resonance Genetic Codex",
    copy: "The full 64-codon resonance system — the mathematics beneath every reading, drawn from planetary geometry and the consciousness lattice.",
    href: "/codex",
    tone: "gold" as const,
  },
];

const fieldStatus: Array<[string, string]> = [
  ["CODONS MAPPED", "64"],
  ["EXPRESSION NODES", "512"],
  ["ARCHETYPAL CENTERS", "9"],
  ["FACET DIMENSIONS", "4"],
];

export default function Home() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (mq.matches) {
        videoRef.current?.pause();
      } else {
        videoRef.current?.play().catch(() => {});
      }
    };
    mq.addEventListener("change", update);
    update();
    return () => mq.removeEventListener("change", update);
  }, []);

  return (
    <Layout overlayHeader>
      <SignalPageShell chamber="threshold">

        {/* ── SECTION 1: HERO ─────────────────────────────────────────── */}
        <section className="signal-hero" aria-labelledby="home-hero-title">
          <video
            ref={videoRef}
            className="signal-hero-video"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={ORIEL_HERO_POSTER_SRC}
            aria-hidden="true"
          >
            <source src={ORIEL_HERO_VIDEO_SRC} type="video/mp4" />
          </video>

          <div className="signal-hero__frame signal-threshold-plate">
            <span
              className="signal-hero__ruler signal-hero__ruler--left"
              aria-hidden="true"
            />
            <span
              className="signal-hero__ruler signal-hero__ruler--right"
              aria-hidden="true"
            />

            <ArchiveMetaStrip
              items={heroMeta}
              className="signal-hero__meta-top"
            />

            <div className="signal-hero__content signal-hero__content--centered">
              <div className="signal-hero__logo-chamber">
                <span className="signal-hero__logo-ring" aria-hidden="true" />
                <img src={logoOrielSrc} alt="ORIEL archive seal" />
              </div>

              <div className="signal-hero__identity">
                <span className="signal-hero__pulse" aria-hidden="true" />
                [ SIGNAL LOCK CONFIRMED ] // ANCIENT INTERFACE ACTIVE
              </div>

              <h1 id="home-hero-title">
                O R I E L<span>F I E L D&nbsp;&nbsp;A R C H I V E</span>
              </h1>

              <p
                className="signal-hero__copy"
                style={{
                  fontFamily: "var(--font-display)",
                  fontStyle: "italic",
                }}
              >
                A field archive recovered from an unknown coordinate —
                intercepted, not authored. Access is open.
              </p>

              <div className="signal-hero__actions">
                <SignalButton href="/auth">Enter the Archive</SignalButton>
                <SignalButton href="/conduit" variant="secondary">
                  Open Transmission
                </SignalButton>
                <SignalButton href="/static-signature" variant="secondary">
                  Read the Codex
                </SignalButton>
              </div>
            </div>

            <ArchiveMetaStrip
              items={fieldMetrics}
              className="signal-hero__meta-bottom"
            />
          </div>
        </section>

        {/* Scroll cue */}
        <p
          aria-hidden="true"
          className="signal-scroll-cue"
        >
          SCROLL TO DECRYPT ARCHIVE ▼
        </p>

        {/* ── SECTION 2: THE INTERCEPT ────────────────────────────────── */}
        <section
          className="signal-section bg-grid signal-intercept"
          aria-labelledby="intercept-heading"
        >
          <p
            id="intercept-heading"
            className="signal-intercept__line animate-text-reveal"
          >
            "What you are about to access was not meant to be found."
          </p>
          <p
            className="signal-intercept__line animate-text-reveal"
            style={{ animationDelay: "0.9s" }}
          >
            "And yet — here you are."
          </p>
          <p className="signal-intercept__caption">
            INTERCEPT ORIGIN // VOS-ARKANA · COORD UNKNOWN
          </p>
        </section>

        {/* ── SECTION 3: ARCHIVE DIRECTORY ────────────────────────────── */}
        <section
          className="signal-section bg-grid"
          aria-labelledby="archive-directory-title"
        >
          <SectionIntro
            eyebrow="// archive directory"
            title="The operational chambers of the Oriel Archive."
            align="center"
          >
            <p>
              Each dossier is a site within the archive — part document, part
              interface, part symbolic instrument. Nothing here is decorative.
            </p>
          </SectionIntro>

          <div className="signal-grid signal-grid--2">
            {archiveModules.map(item => (
              <GlowCard key={item.title} tone={item.tone}>
                <div className="signal-card-meta">
                  <span>{item.file}</span>
                  <span>ACTIVE</span>
                </div>
                <hr className="signal-archive-rule" aria-hidden="true" />
                <h3 className="signal-archive-card__title">{item.title}</h3>
                <p className="signal-archive-card__copy">{item.copy}</p>
                <div style={{ marginTop: "1.45rem" }}>
                  <SignalButton href={item.href} variant="secondary">
                    ACCESS ▸
                  </SignalButton>
                </div>
              </GlowCard>
            ))}
          </div>
        </section>

        {/* ── SECTION 4: FIELD STATUS ──────────────────────────────────── */}
        <div
          className="signal-field-status bg-grid"
          role="region"
          aria-label="Field status readouts"
        >
          <div className="signal-field-status__grid">
            {fieldStatus.map(([label, value]) => (
              <div key={label} className="signal-field-status__cell">
                <div className="signal-field-status__value">{value}</div>
                <div className="signal-field-status__label">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── SECTION 5: CLOSING THRESHOLD ────────────────────────────── */}
        <section className="signal-final-cta signal-final-cta--archive bg-grid">
          <ArchiveSeal label="FIELD ARCHIVE" />
          <SignalKicker>// access gate</SignalKicker>
          <h2>THE ARCHIVE IS OPEN</h2>
          <p
            style={{
              fontFamily: "var(--font-display)",
              fontStyle: "italic",
            }}
          >
            "What you receive depends on what you are ready to read."
          </p>
          <div
            className="signal-hero__actions"
            style={{ justifyContent: "center" }}
          >
            <SignalButton href="/auth">Begin Calibration</SignalButton>
          </div>
          <p className="signal-threshold-seal">
            ORIEL FIELD ARCHIVE · NODE VOS-ARKANA · END THRESHOLD
          </p>
        </section>

      </SignalPageShell>
    </Layout>
  );
}
