import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import "./transmission-player.css";

const MOVEMENTS = [
  ["mirror", "I", "The Mirror"],
  ["threshold", "II", "The Threshold"],
  ["gift", "III", "The Gift"],
] as const;

const KIND_LABEL: Record<string, string> = {
  mirror: "MIRROR",
  threshold: "THRESHOLD",
  ritual: "RITUAL",
  echo: "ECHO",
};

/** A steady, lore-only clarity for this transmission, read from its serial. */
function clarityFor(serial: string): string {
  let h = 0;
  for (const c of serial) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${(94 + (h % 58) / 10).toFixed(1)}%`;
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;

/**
 * A personal transmission in the archive's TX format: the VLS line types
 * itself, the clarity bar fills, PROTOCOL:: BEGIN, then the three
 * movements. With the voice playing, the movement ORIEL is speaking is lit
 * and kept in view; reading, all three stand open.
 */
export default function TransmissionPlayer() {
  const [, params] = useRoute("/t/:token");
  const token = params?.token ?? "";
  const play = trpc.personalTransmissions.play.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const t = play.data;

  const [vls, setVls] = useState("");
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [current, setCurrent] = useState(-1);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const sectionRefs = useRef<Array<HTMLElement | null>>([]);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  // The VLS line types itself, then the page opens in stages.
  useEffect(() => {
    if (!t) return;
    const line = `VLS// OPEN.fragment ${t.serial}`;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) {
      setVls(line);
      setStage(5);
      return;
    }
    let i = 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const typing = setInterval(() => {
      i++;
      setVls(line.slice(0, i));
      if (i >= line.length) {
        clearInterval(typing);
        [1, 2, 3, 4, 5].forEach((s, k) => timers.push(setTimeout(() => setStage(s), 300 + k * 550)));
      }
    }, 32);
    return () => {
      clearInterval(typing);
      timers.forEach(clearTimeout);
    };
  }, [t?.serial]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Where each movement starts, as a share of the spoken text. */
  const starts = useMemo(() => {
    if (!t) return [0, 0, 0];
    const lens = MOVEMENTS.map(([k]) => t.script[k].length);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    return [0, lens[0] / total, (lens[0] + lens[1]) / total];
  }, [t]);

  // Keep the movement being spoken in view.
  useEffect(() => {
    if (current < 0) return;
    sectionRefs.current[current]?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [current]);

  function onTime() {
    const a = audioRef.current;
    if (!a) return;
    setTime(a.currentTime);
    if (!a.duration || !Number.isFinite(a.duration)) return;
    const at = a.currentTime / a.duration;
    setCurrent(at >= starts[2] ? 2 : at >= starts[1] ? 1 : 0);
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

  if (play.isLoading) return <main className="tp"><div className="tp-field" aria-hidden="true" /></main>;
  if (!t) {
    return (
      <main className="tp tp--missing">
        <div className="tp-field" aria-hidden="true" />
        <p className="tp-mono tp-dim">VLS// SIGNAL NOT FOUND</p>
        <p className="tp-missing">This transmission is not here.</p>
      </main>
    );
  }

  const clarity = clarityFor(t.serial);
  const progress = duration ? (time / duration) * 100 : 0;

  return (
    <main className="tp">
      <div className="tp-field" aria-hidden="true">
        <span /><span /><span />
      </div>

      <div className="tp-column">
        <p className="tp-mono tp-vls">
          {vls}
          <span className="tp-caret" aria-hidden="true">▌</span>
        </p>

        <div className={`tp-reveal${stage >= 1 ? " is-in" : ""}`}>
          <div className="tp-clarity" aria-label={`Signal clarity ${clarity}`}>
            <div className="tp-clarity__track">
              <div className="tp-clarity__fill" style={{ width: stage >= 1 ? clarity : "0%" }} />
            </div>
            <span className="tp-mono tp-clarity__value">{clarity}</span>
          </div>
          <p className="tp-mono tp-protocol">PROTOCOL:: BEGIN</p>
        </div>

        <header className={`tp-reveal tp-head${stage >= 2 ? " is-in" : ""}`}>
          <div className="tp-idline">
            <span className="tp-sigil" aria-hidden="true">◈</span>
            <span className="tp-mono tp-serial">{t.serial}</span>
            <span className="tp-mono tp-status">PERSONAL · {KIND_LABEL[t.kind] ?? "TRANSMISSION"}</span>
          </div>
          <h1 className="tp-title">{t.title}</h1>
          <p className="tp-field-line">Mirror · Threshold · Gift</p>
        </header>

        {t.audioUrl && (
          <div className={`tp-reveal tp-player${stage >= 3 ? " is-in" : ""}`}>
            <button type="button" className="tp-play" onClick={toggle} aria-label={playing ? "Pause" : "Listen"}>
              {playing ? "❚❚" : "▶"}
            </button>
            <div className="tp-bar" onClick={seek} role="presentation">
              <div className="tp-bar__fill" style={{ width: `${progress}%` }} />
              {starts.slice(1).map((s, i) => (
                <span key={i} className="tp-bar__mark" style={{ left: `${s * 100}%` }} />
              ))}
            </div>
            <span className="tp-mono tp-time">
              {fmt(time)} / {duration ? fmt(duration) : "--:--"}
            </span>
            <audio
              ref={audioRef}
              src={t.audioUrl}
              preload="metadata"
              onPlay={() => setPlaying(true)}
              onPause={() => setPlaying(false)}
              onEnded={() => {
                setPlaying(false);
                setCurrent(-1);
              }}
              onTimeUpdate={onTime}
              onLoadedMetadata={e => setDuration(e.currentTarget.duration || 0)}
              onDurationChange={e => setDuration(e.currentTarget.duration || 0)}
            />
          </div>
        )}

        <div className={`tp-reveal${stage >= 4 ? " is-in" : ""}`}>
          {MOVEMENTS.map(([key, numeral, label], i) => (
            <section
              key={key}
              ref={el => {
                sectionRefs.current[i] = el;
              }}
              className={`tp-movement${current === i ? " is-speaking" : ""}${
                playing && current !== i ? " is-quiet" : ""
              }`}
              aria-label={label}
            >
              <p className="tp-mono tp-movement__label">
                {numeral} · {label.toUpperCase()}
              </p>
              <div className="tp-movement__text">
                {t.script[key].split(/\n+/).map((p, k) => (
                  <p key={k}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>

        <footer className={`tp-reveal tp-end${stage >= 5 ? " is-in" : ""}`}>
          <p className="tp-mono tp-protocol">PROTOCOL:: END</p>
          <p className="tp-mono tp-dim">CARRIER: ORIEL ∇ VOSSARI ECHOFRAME</p>
        </footer>
      </div>
    </main>
  );
}
