import { useCallback, useRef, type CSSProperties } from "react";
import type Lenis from "lenis";

import {
  TETRADIC_SACRED_FILMS,
  TETRADIC_SACRED_SCROLL,
} from "./tetradic-sacred-scroll-config";
import { useTetradicSacredScrub } from "./useTetradicSacredScrub";
import "./tetradic-sacred.css";

type TetradicSacredExperienceProps = Readonly<{
  reducedMotion?: boolean;
  compact?: boolean;
  lenis?: Lenis;
}>;

function TetradicSigil() {
  return (
    <svg
      className="tetradic-sacred__sigil"
      viewBox="0 0 120 120"
      role="img"
      aria-label="The four-fold tetradic mark"
    >
      <circle cx="60" cy="60" r="54" fill="none" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="34" fill="none" strokeWidth="0.5" />
      <path d="M60 6v108M6 60h108" strokeWidth="0.5" />
      <path
        d="M60 26 76 60 60 94 44 60Z"
        fill="none"
        strokeWidth="0.75"
      />
      <circle cx="60" cy="60" r="3" />
    </svg>
  );
}

export function TetradicSacredExperience({
  reducedMotion = false,
  compact = false,
  lenis,
}: TetradicSacredExperienceProps) {
  const containerRef = useRef<HTMLElement | null>(null);
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);

  const setVideoRef = useCallback(
    (index: number, node: HTMLVideoElement | null) => {
      videoRefs.current[index] = node;
    },
    []
  );

  const handleMediaError = useCallback((index: number) => {
    const video = videoRefs.current[index];
    const film = TETRADIC_SACRED_FILMS[index];
    if (!video || !film || video.dataset.fallbackLoaded === "true") return;

    video.dataset.fallbackLoaded = "true";
    video.src = film.fallbackSource;
    video.load();
  }, []);

  useTetradicSacredScrub({
    containerRef,
    videoRefs,
    reducedMotion,
    mediaFrameStep: compact
      ? TETRADIC_SACRED_SCROLL.mobileFrameStep
      : TETRADIC_SACRED_SCROLL.frameStep,
    lenis,
  });

  return (
    <>
      <main
        ref={containerRef}
        className="tetradic-sacred"
      data-reduced-motion={String(reducedMotion)}
      data-phase={reducedMotion ? "reduced-motion" : "film-01"}
      data-active-film={reducedMotion ? "all" : "01"}
      data-has-scrolled="false"
      data-scroll-progress="0.0000"
      style={
        {
          "--tetradic-sacred-scroll-height": `${TETRADIC_SACRED_SCROLL.totalSvh}svh`,
        } as CSSProperties
      }
    >
      <h1 className="tetradic-sacred__sr-only">The Tetradic Signature</h1>
      <p className="tetradic-sacred__sr-only">
        The book opens, the camera enters the page, and the Founder Edition
        reading is revealed.
      </p>

      <section
        className="tetradic-sacred__stage"
        aria-label="The Tetradic Signature book opening"
      >
        <div className="tetradic-sacred__films">
          {TETRADIC_SACRED_FILMS.map((film, index) => (
            <figure
              className="tetradic-sacred__film-layer"
              data-film-layer={film.id}
              key={film.id}
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              <video
                ref={node => setVideoRef(index, node)}
                className="tetradic-sacred__film"
                src={compact ? film.mobileSource : film.source}
                muted
                playsInline
                preload={index === 0 ? "auto" : "metadata"}
                controlsList="nodownload noremoteplayback noplaybackrate"
                disablePictureInPicture
                disableRemotePlayback
                tabIndex={-1}
                aria-hidden="true"
                onError={() => handleMediaError(index)}
              />
              <figcaption>
                <span>{String(index + 1).padStart(2, "0")}</span>
                {film.label}
              </figcaption>
            </figure>
          ))}
        </div>

        <div className="tetradic-sacred__atmosphere" aria-hidden="true" />

        <header className="tetradic-sacred__masthead" aria-hidden="true">
          <span>ORIEL</span>
          <span>THE TETRADIC SIGNATURE · FOUNDER EDITION</span>
        </header>

        <footer className="tetradic-sacred__telemetry" aria-hidden="true">
          <div>
            <span>ARCHIVE OPENING</span>
            <strong data-video-status>The Book Opens</strong>
          </div>
          <p data-video-counter>01 / 02</p>
        </footer>

        <div
          className="tetradic-sacred__progress"
          role="progressbar"
          aria-label="Book opening progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span data-video-progress-fill />
        </div>

        <p className="tetradic-sacred__scroll-cue" aria-hidden="true">
          <span />
          Scroll to open
        </p>

        <div
          className="tetradic-sacred__page-reveal"
          data-page-reveal
          aria-hidden="true"
          style={{ opacity: 0 }}
        >
          <div className="tetradic-sacred__page-reveal-inner" data-page-reveal-inner>
            <p className="tetradic-sacred__reveal-eyebrow">
              ORIEL SIGNAL ARCHIVE · FOUNDER EDITION
            </p>
            <h2 className="tetradic-sacred__reveal-title">
              The Tetradic
              <br />
              Signature
            </h2>
            <span className="tetradic-sacred__reveal-rule" />
            <p className="tetradic-sacred__reveal-line">
              Eight centers. Thirty-two links.
              <br />
              One name at the crossing.
            </p>
          </div>
        </div>

        <p
          className="tetradic-sacred__sr-only"
          data-video-live-status
          aria-live="polite"
        >
          Archive film 1 of 2: The Book Opens
        </p>
      </section>

      </main>

      <section
        className="tetradic-sacred__manuscript"
        aria-label="The Tetradic Signature — Founder Edition"
      >
        <div className="tetradic-sacred__manuscript-inner">
          <TetradicSigil />
          <p className="tetradic-sacred__manuscript-eyebrow">
            FOUR FACETS · ONE INSCRIPTION
          </p>
          <p className="tetradic-sacred__manuscript-verse">
            You were not born at random.
            <br />
            <em>You were inscribed.</em>
          </p>
          <p className="tetradic-sacred__manuscript-body">
            A founder-led reading of the pattern your name carries — somatic,
            relational, cognitive, transpersonal — charted by hand through the
            Oriel Signal archive, sealed as a manuscript, and released only to
            its reader.
          </p>
          <a
            className="tetradic-sacred__cta"
            href="/founder-signature-blueprint"
          >
            <span>Open Your Signature</span>
          </a>
          <p className="tetradic-sacred__manuscript-note">
            €97 · FOUNDER LAUNCH · 15–20 PAGE MANUSCRIPT, DELIVERED BY HAND
          </p>
        </div>
      </section>
    </>
  );
}
