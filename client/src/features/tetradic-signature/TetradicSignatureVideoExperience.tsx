import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
  type TransitionEvent,
} from "react";

import { SampleArchiveSeal } from "./SampleArchiveSeal";
import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_SPREAD_CONTENT,
} from "./tetradic-signature-config";
import "./tetradic-signature-video.css";

export const TETRADIC_OPENING_VIDEOS = [
  "/assets/tetradic-signature/01first_intro_vid.mp4",
  "/assets/tetradic-signature/02middle_intro_vid.mp4",
  "/assets/tetradic-signature/03last_intro_vid.mp4",
] as const;

export const VIDEO_CROSSFADE_MS = 650;
export const FINAL_FRAME_HOLD_MS = 500;

type IntroPhase =
  | "video-01"
  | "enter-ready"
  | "video-02-starting"
  | "video-02"
  | "open-ready"
  | "video-03-starting"
  | "video-03"
  | "final-frame-hold"
  | "html-crossfade"
  | "complete";

type VideoLayerProps = Readonly<{
  index: number;
  source: string;
  visible: boolean;
  autoPlay: boolean;
  setVideoRef: (index: number, node: HTMLVideoElement | null) => void;
  onPlaying: (index: number) => void;
  onLoadedData: (index: number) => void;
  onEnded: (index: number) => void;
  onPlaybackError: (index: number) => void;
}>;

function VideoLayer({
  index,
  source,
  visible,
  autoPlay,
  setVideoRef,
  onPlaying,
  onLoadedData,
  onEnded,
  onPlaybackError,
}: VideoLayerProps) {
  return (
    <video
      ref={node => setVideoRef(index, node)}
      className={"tetradic-video__film" + (visible ? " is-visible" : "")}
      src={source}
      autoPlay={autoPlay}
      muted
      playsInline
      preload="auto"
      controlsList="nodownload noremoteplayback noplaybackrate"
      disablePictureInPicture
      disableRemotePlayback
      tabIndex={-1}
      aria-hidden="true"
      onPlaying={() => onPlaying(index)}
      onLoadedData={() => onLoadedData(index)}
      onEnded={() => onEnded(index)}
      onError={() => onPlaybackError(index)}
    />
  );
}

function ArchiveDecision({
  visible,
  label,
  onActivate,
  buttonRef,
}: Readonly<{
  visible: boolean;
  label: string;
  onActivate: () => void;
  buttonRef?: Ref<HTMLButtonElement>;
}>) {
  return (
    <div
      className="tetradic-video__decision"
      data-visible={String(visible)}
      aria-hidden={!visible}
      inert={visible ? undefined : true}
    >
      <button ref={buttonRef} type="button" onClick={onActivate}>
        <span>{label}</span>
      </button>
    </div>
  );
}

function TetradOneArchive() {
  const { naming, sample } = TETRADIC_SIGNATURE_CONFIG;
  const chapter = TETRADIC_CHOREOGRAPHY[0];
  const spread = TETRADIC_SPREAD_CONTENT[0];
  const records = [
    ["RECEIVER", sample.receiver],
    ["RECORD STATUS", sample.recordStatus],
    ["BIRTH RECORD", sample.birthRecord],
    ["COORDINATES", sample.coordinates],
    ["ARCHIVE ID", sample.archiveId],
  ] as const;

  return (
    <section
      id="tetradic-archive-interior"
      className="tetradic-video-archive"
      aria-labelledby="tetradic-video-tetrad-one-title"
    >
      <h1
        id="tetradic-video-tetrad-one-title"
        className="tetradic-video-archive__sr-title"
        tabIndex={-1}
      >
        {chapter.title}
      </h1>

      <header className="tetradic-video-archive__masthead">
        <span>{naming.brand}</span>
        <span>{naming.edition}</span>
      </header>

      <article className="tetradic-video-archive__spread">
        <section
          className="tetradic-video-archive__page tetradic-video-archive__page--left"
          style={{
            backgroundImage: 'url("/assets/tetradic-signature/foaie1.png")',
          }}
        >
          <header className="tetradic-video-archive__running-head">
            <span>{naming.system}</span>
            <span>RECEIVER RECORD</span>
          </header>

          <div className="tetradic-video-archive__record-heading">
            <p>TETRAD 01 / 12</p>
            <h2>Receiver Record Initialization</h2>
          </div>

          <div className="tetradic-video-archive__record-field">
            <dl>
              {records.map(([label, value]) => (
                <div key={label}>
                  <dt>{label}</dt>
                  <dd>{value}</dd>
                </div>
              ))}
            </dl>
            <p>ILLUSTRATIVE RECORD · NO PRIVATE OR EPHEMERIS DATA</p>
          </div>

          <footer className="tetradic-video-archive__folio">
            <span>FOUNDER-CURATED STATIC READING</span>
            <b>02</b>
          </footer>
        </section>

        <section
          className="tetradic-video-archive__page tetradic-video-archive__page--right"
          style={{
            backgroundImage: 'url("/assets/tetradic-signature/foaie2.png")',
          }}
        >
          <header className="tetradic-video-archive__running-head">
            <span>ARCHIVE SEAL / SAMPLE</span>
            <span>64-SEGMENT CORONA</span>
          </header>

          <div className="tetradic-video-archive__seal">
            <SampleArchiveSeal
              archiveId={sample.archiveId}
              symbol={chapter.symbol}
            />
          </div>

          <div className="tetradic-video-archive__copy">
            <p>TETRAD 01 / 12</p>
            <h2 aria-hidden="true">{chapter.title}</h2>
            <blockquote>{chapter.statement}</blockquote>
            <p>{spread.semanticDescription}</p>
          </div>

          <div className="tetradic-video-archive__labels">
            {spread.technicalLabels.map(label => (
              <span key={label}>{label}</span>
            ))}
          </div>

          <footer className="tetradic-video-archive__folio tetradic-video-archive__folio--right">
            <b>03</b>
            <span>{naming.product}</span>
          </footer>
        </section>

        <div className="tetradic-video-archive__gutter" aria-hidden="true" />
      </article>
    </section>
  );
}

function scrollLock(active: boolean) {
  document.documentElement.classList.toggle(
    "tetradic-video-scroll-lock",
    active
  );
  document.body.classList.toggle("tetradic-video-scroll-lock", active);
}

export function TetradicSignatureVideoExperience() {
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([]);
  const holdTimerRef = useRef<number | null>(null);
  const revealFallbackRef = useRef<number | null>(null);
  const autoplayCheckRef = useRef<number | null>(null);
  const pendingFrameCleanupRef = useRef<(() => void) | null>(null);
  const enterButtonRef = useRef<HTMLButtonElement | null>(null);
  const openButtonRef = useRef<HTMLButtonElement | null>(null);
  const autoplayButtonRef = useRef<HTMLButtonElement | null>(null);
  const [phase, setPhase] = useState<IntroPhase>("video-01");
  const [visibleVideo, setVisibleVideo] = useState(0);
  const [archiveVisible, setArchiveVisible] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const setVideoRef = useCallback(
    (index: number, node: HTMLVideoElement | null) => {
      videoRefs.current[index] = node;
    },
    []
  );

  const finishArchiveReveal = useCallback(() => {
    setPhase(current => {
      if (current !== "html-crossfade") return current;
      scrollLock(false);
      return "complete";
    });
  }, []);

  const playVideo = useCallback(async (index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    setAutoplayBlocked(false);
    if (index === 1) setPhase("video-02-starting");
    if (index === 2) setPhase("video-03-starting");

    try {
      await video.play();
    } catch {
      if (index === 0) {
        setAutoplayBlocked(true);
        setPhase("video-01");
      } else {
        setPhase(index === 1 ? "enter-ready" : "open-ready");
      }
    }
  }, []);

  const handlePlaying = useCallback((index: number) => {
    const video = videoRefs.current[index];
    if (!video) return;

    if (autoplayCheckRef.current !== null) {
      window.clearTimeout(autoplayCheckRef.current);
      autoplayCheckRef.current = null;
    }

    pendingFrameCleanupRef.current?.();

    let cancelled = false;
    const revealDecodedFrame = () => {
      if (cancelled || video.error) return;
      pendingFrameCleanupRef.current = null;
      setVisibleVideo(index);
      setAutoplayBlocked(false);
      if (index === 0) setPhase("video-01");
      if (index === 1) setPhase("video-02");
      if (index === 2) setPhase("video-03");
    };

    if (typeof video.requestVideoFrameCallback === "function") {
      const callbackId = video.requestVideoFrameCallback(revealDecodedFrame);
      pendingFrameCleanupRef.current = () => {
        cancelled = true;
        video.cancelVideoFrameCallback(callbackId);
      };
      return;
    }

    const animationFrameId = window.requestAnimationFrame(revealDecodedFrame);
    pendingFrameCleanupRef.current = () => {
      cancelled = true;
      window.cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const handleLoadedData = useCallback((index: number) => {
    if (index !== 0) return;

    if (autoplayCheckRef.current !== null) {
      window.clearTimeout(autoplayCheckRef.current);
    }

    autoplayCheckRef.current = window.setTimeout(() => {
      const firstVideo = videoRefs.current[0];
      if (firstVideo?.paused && !firstVideo.ended) {
        setAutoplayBlocked(true);
      }
    }, 600);
  }, []);

  const handleEnded = useCallback(
    (index: number) => {
      if (index === 0 && phase === "video-01") {
        setPhase("enter-ready");
        return;
      }

      if (index === 1 && phase === "video-02") {
        setPhase("open-ready");
        return;
      }

      if (index !== 2 || phase !== "video-03") return;

      setPhase("final-frame-hold");
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
      holdTimerRef.current = window.setTimeout(() => {
        setArchiveVisible(true);
        setPhase("html-crossfade");
      }, FINAL_FRAME_HOLD_MS);
    },
    [phase]
  );

  const handlePlaybackError = useCallback(
    (index: number) => {
      pendingFrameCleanupRef.current?.();
      pendingFrameCleanupRef.current = null;

      if (index === 0 && phase === "video-01") {
        setAutoplayBlocked(true);
        return;
      }

      if (
        index === 1 &&
        (phase === "video-02-starting" || phase === "video-02")
      ) {
        setVisibleVideo(0);
        setPhase("enter-ready");
        return;
      }

      if (
        index === 2 &&
        (phase === "video-03-starting" || phase === "video-03")
      ) {
        setVisibleVideo(1);
        setPhase("open-ready");
      }
    },
    [phase]
  );

  const handleOpeningTransitionEnd = useCallback(
    (event: TransitionEvent<HTMLDivElement>) => {
      if (
        event.currentTarget === event.target &&
        event.propertyName === "opacity"
      ) {
        finishArchiveReveal();
      }
    },
    [finishArchiveReveal]
  );

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    scrollLock(true);

    return () => {
      if (holdTimerRef.current !== null) {
        window.clearTimeout(holdTimerRef.current);
      }
      if (revealFallbackRef.current !== null) {
        window.clearTimeout(revealFallbackRef.current);
      }
      if (autoplayCheckRef.current !== null) {
        window.clearTimeout(autoplayCheckRef.current);
      }
      pendingFrameCleanupRef.current?.();
      scrollLock(false);
    };
  }, []);

  useEffect(() => {
    if (phase !== "html-crossfade") return;

    revealFallbackRef.current = window.setTimeout(
      finishArchiveReveal,
      VIDEO_CROSSFADE_MS + 150
    );

    return () => {
      if (revealFallbackRef.current !== null) {
        window.clearTimeout(revealFallbackRef.current);
        revealFallbackRef.current = null;
      }
    };
  }, [finishArchiveReveal, phase]);

  useLayoutEffect(() => {
    const target =
      phase === "enter-ready"
        ? enterButtonRef.current
        : phase === "open-ready"
          ? openButtonRef.current
          : autoplayBlocked
            ? autoplayButtonRef.current
            : phase === "complete"
              ? document.querySelector<HTMLHeadingElement>(
                  "#tetradic-video-tetrad-one-title"
                )
              : null;
    target?.focus({ preventScroll: true });
  }, [autoplayBlocked, phase]);

  const showOpening = phase !== "complete";
  const archiveIsInteractive = archiveVisible || phase === "complete";

  return (
    <main
      className="tetradic-video-experience"
      data-intro-phase={phase}
      data-visible-video={String(visibleVideo + 1).padStart(2, "0")}
    >
      {showOpening && (
        <div
          className={
            "tetradic-video__opening" +
            (phase === "html-crossfade" ? " is-crossfading" : "")
          }
          onTransitionEnd={handleOpeningTransitionEnd}
          aria-label="The Tetradic Signature opening"
        >
          <div className="tetradic-video__films" aria-hidden="true">
            {TETRADIC_OPENING_VIDEOS.map((source, index) => (
              <VideoLayer
                key={source}
                index={index}
                source={source}
                visible={visibleVideo === index}
                autoPlay={index === 0}
                setVideoRef={setVideoRef}
                onPlaying={handlePlaying}
                onLoadedData={handleLoadedData}
                onEnded={handleEnded}
                onPlaybackError={handlePlaybackError}
              />
            ))}
          </div>

          <ArchiveDecision
            visible={phase === "enter-ready"}
            label="Enter the Archive"
            onActivate={() => void playVideo(1)}
            buttonRef={enterButtonRef}
          />
          <ArchiveDecision
            visible={phase === "open-ready"}
            label="Open the Archive"
            onActivate={() => void playVideo(2)}
            buttonRef={openButtonRef}
          />

          <div
            className="tetradic-video__autoplay-fallback"
            data-visible={String(autoplayBlocked)}
            aria-hidden={!autoplayBlocked}
            inert={autoplayBlocked ? undefined : true}
          >
            <p>Your browser paused the opening film.</p>
            <button
              ref={autoplayButtonRef}
              type="button"
              onClick={() => void playVideo(0)}
            >
              Play the Opening
            </button>
          </div>
        </div>
      )}

      <div
        className={
          "tetradic-video__html" +
          (archiveVisible || phase === "complete" ? " is-visible" : "")
        }
        aria-hidden={!archiveIsInteractive}
        inert={archiveIsInteractive ? undefined : true}
      >
        <TetradOneArchive />
      </div>
    </main>
  );
}
