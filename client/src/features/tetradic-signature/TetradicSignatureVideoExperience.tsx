import React, { useCallback, useRef, type CSSProperties } from "react";
import type Lenis from "lenis";

import {
  TETRADIC_SCROLL_FILMS,
  TETRADIC_VIDEO_SCROLL,
} from "./tetradic-video-scroll-config";
import { useTetradicVideoScrub } from "./useTetradicVideoScrub";
import "./tetradic-signature-video.css";

type TetradicSignatureVideoExperienceProps = Readonly<{
  reducedMotion?: boolean;
  compact?: boolean;
  lenis?: Lenis;
}>;

export function TetradicSignatureVideoExperience({
  reducedMotion = false,
  compact = false,
  lenis,
}: TetradicSignatureVideoExperienceProps) {
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
    const film = TETRADIC_SCROLL_FILMS[index];
    if (!video || !film || video.dataset.fallbackLoaded === "true") return;

    video.dataset.fallbackLoaded = "true";
    video.src = film.fallbackSource;
    video.load();
  }, []);

  useTetradicVideoScrub({
    containerRef,
    videoRefs,
    reducedMotion,
    mediaFrameStep: compact
      ? TETRADIC_VIDEO_SCROLL.mobileFrameStep
      : TETRADIC_VIDEO_SCROLL.frameStep,
    lenis,
  });

  return (
    <main
      ref={containerRef}
      className="tetradic-video-experience"
      data-reduced-motion={String(reducedMotion)}
      data-phase={reducedMotion ? "reduced-motion" : "film-01"}
      data-active-film={reducedMotion ? "all" : "01"}
      data-has-scrolled="false"
      data-scroll-progress="0.0000"
      style={
        {
          "--tetradic-video-scroll-height": `${TETRADIC_VIDEO_SCROLL.totalSvh}svh`,
        } as CSSProperties
      }
    >
      <h1 className="tetradic-video__sr-only">The Tetradic Signature</h1>
      <p className="tetradic-video__sr-only">
        A three-film scroll-controlled opening for the Founder Edition archive.
      </p>

      <section
        className="tetradic-video__stage"
        aria-label="The Tetradic Signature archive opening"
      >
        <div className="tetradic-video__films">
          {TETRADIC_SCROLL_FILMS.map((film, index) => (
            <figure
              className="tetradic-video__film-layer"
              data-film-layer={film.id}
              key={film.id}
              style={{ opacity: index === 0 ? 1 : 0 }}
            >
              <video
                ref={node => setVideoRef(index, node)}
                className="tetradic-video__film"
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

        <div className="tetradic-video__atmosphere" aria-hidden="true" />

        <header className="tetradic-video__masthead" aria-hidden="true">
          <span>ORIEL</span>
          <span>THE TETRADIC SIGNATURE · FOUNDER EDITION</span>
        </header>

        <footer className="tetradic-video__telemetry">
          <div>
            <span>ARCHIVE OPENING</span>
            <strong data-video-status>Artifact Reveal</strong>
          </div>
          <p data-video-counter>01 / 03</p>
        </footer>

        <div
          className="tetradic-video__progress"
          role="progressbar"
          aria-label="Archive opening progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={0}
        >
          <span data-video-progress-fill />
        </div>

        <p className="tetradic-video__scroll-cue" aria-hidden="true">
          <span />
          Scroll to enter
        </p>

        <p
          className="tetradic-video__sr-only"
          data-video-live-status
          aria-live="polite"
        >
          Archive film 1 of 3: Artifact Reveal
        </p>
      </section>
    </main>
  );
}
