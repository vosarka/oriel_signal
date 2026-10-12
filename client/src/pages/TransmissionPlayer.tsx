import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import TransmissionFilm, { type FilmFrame } from "@/features/transmission-film/TransmissionFilm";
import { actAt, filmSeed, flowAt, flowSentences, voiceBand } from "@shared/transmission-film";
import "./transmission-player.css";

const MOVEMENT_LABEL = ["I · THE MIRROR", "II · THE THRESHOLD", "III · THE GIFT"] as const;
const KIND_LABEL: Record<string, string> = { mirror: "MIRROR", threshold: "THRESHOLD", ritual: "RITUAL", echo: "ECHO" };
const ACQUIRE_MS = 3500;
const TEXT_KEY = "oriel.transmission.text";

type Phase = "intro" | "acquiring" | "playing" | "paused" | "ended";

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

function readTextPref(): boolean {
  try {
    return localStorage.getItem(TEXT_KEY) !== "off";
  } catch {
    return true;
  }
}

/**
 * A personal transmission as a film. The signal is caught out of static,
 * then ORIEL's voice plays and the geometry moves with it; the sentence being
 * spoken flows across the screen, or the text can be turned off for the film
 * and the voice alone.
 */
export default function TransmissionPlayer() {
  const [, params] = useRoute("/t/:token");
  const token = params?.token ?? "";
  const play = trpc.personalTransmissions.play.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const t = play.data;

  const [phase, setPhase] = useState<Phase>("intro");
  const [vls, setVls] = useState("");
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showText, setShowText] = useState(readTextPref);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const analyserRef = useRef<{ node: AnalyserNode; bins: Uint8Array<ArrayBuffer>; rate: number } | null>(null);
  const acquireStart = useRef(0);
  const burstUntil = useRef(0);
  const lastAct = useRef(0);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const sentences = useMemo(() => (t ? flowSentences(t.script) : []), [t]);
  const starts = useMemo(() => {
    if (!sentences.length) return [0, 1 / 3, 2 / 3];
    const first = (m: number) => sentences.find(s => s.movement === m)?.start ?? 0;
    return [0, first(1), first(2)];
  }, [sentences]);
  const seed = useMemo(() => filmSeed(t?.serial ?? token), [t?.serial, token]);

  // The VLS line: waiting for a signal, catching it, then locked.
  useEffect(() => {
    if (!t) return;
    if (phase === "intro") setVls(`VLS// AWAITING SIGNAL · ${t.serial}`);
    if (phase === "ended") setVls(`VLS// PROTOCOL:: END · ${t.serial}`);
    if (phase !== "acquiring") return;
    const id = setInterval(() => {
      const p = Math.min(1, (performance.now() - acquireStart.current) / ACQUIRE_MS);
      setVls(
        p < 1 ? `VLS// ACQUIRING SIGNAL… ${String(Math.floor(p * 100)).padStart(2, "0")}%` : `VLS// SIGNAL LOCKED · ${t.serial}`
      );
    }, 80);
    return () => clearInterval(id);
  }, [phase, t]);

  /** Read once a frame by the film. */
  const frame = useCallback((): FilmFrame => {
    const now = performance.now();
    const a = audioRef.current;
    const ratio = a && a.duration ? a.currentTime / a.duration : 0;
    const act = phase === "intro" ? 0 : actAt(starts, ratio);
    if (Math.round(act) !== lastAct.current) {
      lastAct.current = Math.round(act);
      burstUntil.current = now + 300; // the signal flickers between movements
    }

    let level = 0;
    let bright = 0.4;
    const an = analyserRef.current;
    if (an && phase === "playing") {
      an.node.getByteFrequencyData(an.bins);
      ({ level, bright } = voiceBand(an.bins, an.rate, an.node.fftSize));
    }

    const lock =
      phase === "intro" ? 0.12 : phase === "acquiring" ? 0.12 + 0.88 * Math.min(1, (now - acquireStart.current) / ACQUIRE_MS) ** 1.6 : 1;
    return { act, lock, burst: now < burstUntil.current ? 0.6 : 0, level, bright };
  }, [phase, starts]);

  function receive() {
    const a = audioRef.current;
    if (a && !analyserRef.current) {
      // The analyser hears only what the page plays: built inside this click,
      // since browsers start audio only after a gesture.
      const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new Ctx();
      const src = ctx.createMediaElementSource(a);
      const node = ctx.createAnalyser();
      node.fftSize = 1024;
      node.smoothingTimeConstant = 0.6;
      src.connect(node);
      node.connect(ctx.destination);
      analyserRef.current = { node, bins: new Uint8Array(new ArrayBuffer(node.frequencyBinCount)), rate: ctx.sampleRate };
      void ctx.resume();
    }
    acquireStart.current = performance.now();
    setPhase("acquiring");
    window.setTimeout(() => {
      if (a) void a.play();
      setPhase(a ? "playing" : "ended");
    }, ACQUIRE_MS);
  }

  function toggle() {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) void a.play();
    else a.pause();
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const r = e.currentTarget.getBoundingClientRect();
    a.currentTime = ((e.clientX - r.left) / r.width) * a.duration;
  }

  function setText(on: boolean) {
    setShowText(on);
    try {
      localStorage.setItem(TEXT_KEY, on ? "on" : "off");
    } catch {
      /* a private window keeps the choice for this visit only */
    }
  }

  if (play.isLoading) return <main className="tf" />;
  if (!t) {
    return (
      <main className="tf tf--missing">
        <p className="tf-mono tf-dim">VLS// SIGNAL NOT FOUND</p>
        <p className="tf-missing">This transmission is not here.</p>
      </main>
    );
  }

  const ratio = duration ? time / duration : 0;
  const flow = flowAt(sentences, ratio);
  const speaking = phase === "playing" || phase === "paused";
  const current = flow.index >= 0 ? sentences[flow.index] : null;
  const previous = flow.index > 0 ? sentences[flow.index - 1] : null;

  return (
    <main className={`tf tf--${phase}`}>
      <TransmissionFilm seed={seed} frame={frame} />

      <header className="tf-head">
        <p className="tf-mono tf-vls">{vls}</p>
        <div className="tf-idline">
          <span className="tf-sigil" aria-hidden="true">◈</span>
          <span className="tf-mono tf-serial">{t.serial}</span>
          <span className="tf-mono tf-status">PERSONAL · {KIND_LABEL[t.kind] ?? "TRANSMISSION"}</span>
        </div>
      </header>

      {phase === "intro" && (
        <section className="tf-intro">
          <h1 className="tf-title">{t.title}</h1>
          <p className="tf-sub">A transmission from ORIEL, made for you. Find a quiet moment, and sound.</p>
          {t.audioUrl ? (
            <button type="button" className="tf-receive" onClick={receive}>
              Receive the transmission
            </button>
          ) : (
            <button type="button" className="tf-receive" onClick={() => setPhase("ended")}>
              Read the transmission
            </button>
          )}
        </section>
      )}

      {speaking && showText && current && (
        <section className="tf-flow" aria-live="polite">
          <p className="tf-mono tf-movement">{MOVEMENT_LABEL[current.movement]}</p>
          {previous && previous.movement === current.movement && (
            <p className="tf-line tf-line--past" key={`p${flow.index - 1}`}>{previous.text}</p>
          )}
          <p className="tf-line" key={`c${flow.index}`}>
            {current.text.split(/\s+/u).map((w, i) => (
              <span key={i} className={i < flow.words ? "tf-word is-said" : "tf-word"}>
                {w}{" "}
              </span>
            ))}
          </p>
        </section>
      )}

      {phase === "ended" && (
        <section className="tf-full">
          <h1 className="tf-title tf-title--small">{t.title}</h1>
          {(["mirror", "threshold", "gift"] as const).map((k, i) => (
            <div key={k} className="tf-full__movement">
              <p className="tf-mono tf-movement">{MOVEMENT_LABEL[i]}</p>
              {t.script[k].split(/\n+/).map((p, j) => <p key={j}>{p}</p>)}
            </div>
          ))}
          <p className="tf-mono tf-dim">PROTOCOL:: END · CARRIER: ORIEL ∇ VOSSARI ECHOFRAME</p>
          {t.audioUrl && (
            <button
              type="button"
              className="tf-receive tf-receive--quiet"
              onClick={() => {
                const a = audioRef.current;
                if (a) a.currentTime = 0;
                receive();
              }}
            >
              Receive it again
            </button>
          )}
        </section>
      )}

      {t.audioUrl && (
        <audio
          ref={audioRef}
          src={t.audioUrl}
          preload="auto"
          onPlay={() => setPhase("playing")}
          onPause={() => setPhase(p => (p === "playing" ? "paused" : p))}
          onEnded={() => setPhase("ended")}
          onTimeUpdate={e => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
          onDurationChange={e => setDuration(e.currentTarget.duration || 0)}
        />
      )}

      {speaking && (
        <nav className="tf-controls" aria-label="Transmission controls">
          <button type="button" className="tf-play" onClick={toggle} aria-label={phase === "playing" ? "Pause" : "Play"}>
            {phase === "playing" ? "❚❚" : "▶"}
          </button>
          <div className="tf-bar" onClick={seek} role="presentation">
            <div className="tf-bar__fill" style={{ width: `${ratio * 100}%` }} />
            {starts.slice(1).map((s, i) => (
              <span key={i} className="tf-bar__mark" style={{ left: `${s * 100}%` }} />
            ))}
          </div>
          <span className="tf-mono tf-time">
            {fmt(time)} / {duration ? fmt(duration) : "--:--"}
          </span>
          <button
            type="button"
            className="tf-mono tf-toggle"
            aria-pressed={showText}
            onClick={() => setText(!showText)}
          >
            TEXT {showText ? "ON" : "OFF"}
          </button>
        </nav>
      )}
    </main>
  );
}
