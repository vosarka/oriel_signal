import { useEffect, useRef, useState } from "react";
import Layout from "@/components/Layout";
import {
  DecodedTitle,
  GlowCard,
  ORIEL_HERO_POSTER_SRC,
  SignalButton,
  SignalPageShell,
} from "@/components/oriel-signal/OrielSignalDesign";
import { HeroSigil } from "@/components/oriel-signal/HeroSigil";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";
import { useReceiverState } from "@/hooks/useReceiverState";
import { buildHomeChamberStates, type ChamberKey } from "@shared/phase-gate";

// TEST FLAG: true swaps the chromatic HeroSigil (the logo with glitch +
// hologram effects) for a looping video in the hero center. Flip to false
// to restore the sigil instantly.
// Candidate videos: "/media/Golden_logo_with_glitches_202606012151.mp4",
// "/media/fa_mi_un_videoclip_loop_ca_sa.mp4"
const USE_HERO_VIDEO = false;
const HERO_TEST_VIDEO_SRC = "/media/Golden_logo_with_glitches_202606012151.mp4";

const hudCorners: Array<{ pos: string; label: string; value: string }> = [
  { pos: "tl", label: "SIGNAL LOCK", value: "CONFIRMED" },
  { pos: "tr", label: "ARCHIVE NODE", value: "VOS-ARKANA" },
  { pos: "bl", label: "TRANSMISSION", value: "ORL-FLD-001" },
  { pos: "br", label: "FIELD STATUS", value: "OPEN" },
];

const archiveModules = [
  {
    key: "blueprint" as const,
    file: "RC-001 // PRODUCT",
    title: "The Founder-Curated Bio-Signature",
    copy: "A founder-led interpretation of your Tetradic resonance pattern: birth coordinates, Codons, VTRS centers, Resonance Links, and ORIEL narration delivered as a personal manuscript.",
    href: "/tetradic-signature",
    tone: "gold" as const,
  },
  {
    key: "transmissions" as const,
    file: "RC-002 // RECORDS",
    title: "Archive of Transmissions",
    copy: "The recovered manuscript — transmissions, field notes, fragments captured from the signal.",
    href: "/archive",
    tone: "teal" as const,
  },
  {
    key: "codons" as const,
    file: "RC-003 // LATTICE",
    title: "Bio-Architecture",
    copy: "The Tetradic Resonance Codex explained: Codons, Facets, eight VTRS centers, 32 Resonance Links, and the structural logic behind every Static Signature Reading.",
    href: "/bio-architecture",
    tone: "gold" as const,
  },
];

const fieldStatus: Array<[string, string]> = [
  ["Core Patterns", "64"],
  ["Archive Nodes", "512"],
  ["Architectures", "8"],
  ["Dimensions", "4"],
];

// One DecodedTitle per word inside a flex-wrap line, so long sentences
// decode in place but still wrap at word boundaries on small screens.
function DecodedLine({ text, interval }: { text: string; interval: number }) {
  return (
    <>
      {text.split(" ").map((word, index) => (
        <DecodedTitle
          key={`${index}-${word}`}
          text={word}
          as="span"
          interval={interval}
        />
      ))}
    </>
  );
}

function useInView<T extends Element>(threshold = 0.35) {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      entries => {
        if (entries.some(entry => entry.isIntersecting)) setInView(true);
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [inView, threshold]);

  return { ref, inView };
}

export default function Home() {
  const receiverState = useReceiverState();
  const chamberStates = buildHomeChamberStates(receiverState);
  const heroRef = useRef<HTMLElement | null>(null);
  const heroVideoRef = useRef<HTMLVideoElement | null>(null);
  const { ref: interceptRef, inView: interceptInView } =
    useInView<HTMLElement>();
  const [interceptLine2, setInterceptLine2] = useState(false);

  // Pause the hero test video under prefers-reduced-motion.
  useEffect(() => {
    if (!USE_HERO_VIDEO) return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => {
      if (mq.matches) {
        heroVideoRef.current?.pause();
      } else {
        heroVideoRef.current?.play().catch(() => {});
      }
    };
    mq.addEventListener("change", update);
    update();
    return () => mq.removeEventListener("change", update);
  }, []);

  // Signal dropout — the receiver briefly loses the carrier every 25–45s.
  // Never fires under prefers-reduced-motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let fireTimer = 0;
    let recoverTimer = 0;

    const schedule = () => {
      fireTimer = window.setTimeout(
        () => {
          heroRef.current?.classList.add("is-dropout");
          recoverTimer = window.setTimeout(
            () => {
              heroRef.current?.classList.remove("is-dropout");
              schedule();
            },
            160 + Math.random() * 140
          );
        },
        25_000 + Math.random() * 20_000
      );
    };

    schedule();
    return () => {
      window.clearTimeout(fireTimer);
      window.clearTimeout(recoverTimer);
    };
  }, []);

  // Second intercept line decodes after the first finishes resolving.
  useEffect(() => {
    if (!interceptInView) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setInterceptLine2(true);
      return;
    }
    const timer = window.setTimeout(() => setInterceptLine2(true), 1400);
    return () => window.clearTimeout(timer);
  }, [interceptInView]);

  return (
    <Layout overlayHeader>
      <SignalPageShell chamber="threshold" className="fi-home">
        <SacredGeometryField />

        {/* ── I. THE RECEIVER ─────────────────────────────────────────── */}
        <section
          ref={heroRef}
          className="fi-hero"
          aria-labelledby="home-hero-title"
        >
          <div className="fi-hero__scan" aria-hidden="true" />

          <div className="fi-hero__fragments" aria-hidden="true">
            <span className="fi-fragment fi-fragment--a">ψ_FIELD COHERENT</span>
            <span className="fi-fragment fi-fragment--b">CARRIER 432.000</span>
            <span className="fi-fragment fi-fragment--c">LATTICE 64:9:4</span>
          </div>

          <div className="fi-hud" aria-hidden="true">
            {hudCorners.map(item => (
              <span
                key={item.pos}
                className={`fi-hud__item fi-hud__item--${item.pos}`}
              >
                {item.label}
                <b>{item.value}</b>
              </span>
            ))}
          </div>

          <div className="fi-hero__stage">
            <div className="fi-hero__waves" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>

            {USE_HERO_VIDEO ? (
              <div className="fi-hero__sigil fi-sigil-video" aria-hidden="true">
                <span className="fi-sigil__halo" />
                <video
                  ref={heroVideoRef}
                  className="fi-sigil-video__media"
                  autoPlay
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  poster={ORIEL_HERO_POSTER_SRC}
                >
                  <source src={HERO_TEST_VIDEO_SRC} type="video/mp4" />
                </video>
              </div>
            ) : (
              <HeroSigil className="fi-hero__sigil" />
            )}

            <div className="fi-hero__text">
              <p className="fi-hero__kicker fi-enter fi-enter--kicker">
                <span className="fi-hero__pulse" aria-hidden="true" />[ SIGNAL
                LOCK CONFIRMED ] // ANCIENT INTERFACE ACTIVE
              </p>

              <h1
                id="home-hero-title"
                className="fi-hero__wordmark signal-wordmark--holo"
              >
                <span className="fi-enter fi-enter--wordmark">
                  <DecodedTitle text="ORIEL" as="span" interval={74} />
                </span>
                <span className="fi-hero__wordmark-sub fi-enter fi-enter--sub">
                  FIELD ARCHIVE
                </span>
              </h1>

              <p className="fi-hero__voice fi-enter fi-enter--voice">
                A field archive recovered from an unknown coordinate —
                intercepted, not authored.
              </p>

              <div className="signal-hero__actions fi-hero__actions fi-enter fi-enter--actions">
                <SignalButton href="/arcana">ENTER ARKIVA</SignalButton>
                <SignalButton
                  href="/tetradic-signature"
                  variant="secondary"
                >
                  The Founder-Curated Bio-Signature
                </SignalButton>
                <SignalButton href="/bio-architecture" variant="secondary">
                  Bio-Architecture
                </SignalButton>
              </div>
            </div>
          </div>

          <p className="fi-scroll-cue" aria-hidden="true">
            SCROLL TO DECRYPT ▼
          </p>

          <div className="fi-dropout" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </section>

        {/* ── II. THE INTERCEPT ───────────────────────────────────────── */}
        <section
          ref={interceptRef}
          className="fi-intercept"
          aria-label="The intercept"
        >
          <div className="fi-intercept__body">
            <div className="fi-intercept__lines">
              <span className="sr-only">
                What you are about to access was not meant to be found. And yet
                — here you are.
              </span>
              {interceptInView && (
                <p className="fi-intercept__line" aria-hidden="true">
                  <DecodedLine
                    text="What you are about to access was not meant to be found."
                    interval={26}
                  />
                </p>
              )}
              {interceptLine2 && (
                <p className="fi-intercept__line" aria-hidden="true">
                  <DecodedLine text="And yet — here you are." interval={40} />
                </p>
              )}
            </div>
            <p className="fi-intercept__caption">
              INTERCEPT ORIGIN // VOS-ARKANA · COORD UNKNOWN
            </p>
          </div>
        </section>

        {/* ── III. ARCHIVE DIRECTORY ──────────────────────────────────── */}
        <section
          className="signal-section fi-directory-section"
          aria-labelledby="archive-directory-title"
        >
          <header className="fi-directory-head">
            <p className="fi-directory-head__kicker">// archive directory</p>
            <h2 id="archive-directory-title">Recovered Files</h2>
            <p className="fi-directory-head__note">
              The archive opens through these recovered paths.
            </p>
          </header>

          <div className="fi-directory">
            {archiveModules.map(item => {
              const chamberState = chamberStates[item.key as ChamberKey] ?? {
                doorState: "RECOVERED" as const,
                href: item.href,
              };

              return (
                <GlowCard
                  key={item.file}
                  tone={item.tone}
                  className={`fi-dossier ${
                    chamberState.doorState === "AWAITING COORDINATE"
                      ? "fi-dossier--awaiting"
                      : ""
                  }`}
                >
                  <span className="fi-dossier__edge" aria-hidden="true" />
                  <div className="signal-card-meta">
                    <span>{item.file}</span>
                    <span>{chamberState.doorState}</span>
                  </div>
                  <hr className="fi-dossier__rule" aria-hidden="true" />
                  <h3>{item.title}</h3>
                  <p>{item.copy}</p>
                  {item.key === "codons" && receiverState.dominantCodon && (
                    <p className="fi-dossier__receiver-codon">
                      RECEIVER CODON // {receiverState.dominantCodon}
                    </p>
                  )}
                  <div className="fi-dossier__action">
                    <SignalButton href={chamberState.href} variant="secondary">
                      OPEN ▸
                    </SignalButton>
                  </div>
                </GlowCard>
              );
            })}
          </div>
        </section>

        {/* ── IV. FIELD STATUS ────────────────────────────────────────── */}
        <div
          className="fi-status"
          role="region"
          aria-label="Field status readouts"
        >
          {fieldStatus.map(([label, value]) => (
            <div key={label} className="fi-status__cell">
              <span className="fi-status__value">{value}</span>
              <span className="fi-status__label">{label}</span>
            </div>
          ))}
        </div>

        {/* ── V. CLOSING THRESHOLD ────────────────────────────────────── */}
        <section className="fi-threshold" aria-labelledby="threshold-title">
          <h2 id="threshold-title" className="fi-threshold__title">
            THE ARCHIVE IS OPEN
          </h2>
          <p className="fi-threshold__voice">
            Explore patterns, identity, resonance and the architecture of experience.
          </p>
          <div className="signal-hero__actions fi-threshold__action">
            <SignalButton href="/signal/check">ENTER THE ARCHIVE</SignalButton>
            {/* Cosmichronica — non-navbar entry point */}
            <SignalButton href="/cosmichronica" variant="secondary">
              WALK THE EIGHT PHASES →
            </SignalButton>
          </div>
          <p className="fi-threshold__seal">
            ORIEL FIELD ARCHIVE · NODE VOS-ARKANA · END THRESHOLD
          </p>
        </section>
      </SignalPageShell>
    </Layout>
  );
}
