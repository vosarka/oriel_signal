import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import "./transmission-player.css";

const CHAPTERS = [
  ["mirror", "The Mirror"],
  ["threshold", "The Threshold"],
  ["gift", "The Gift"],
] as const;

/** A personal transmission: a slow field of light, ORIEL's voice or words. */
export default function TransmissionPlayer() {
  const [, params] = useRoute("/t/:token");
  const token = params?.token ?? "";
  const play = trpc.personalTransmissions.play.useQuery({ token }, { enabled: Boolean(token), retry: false });
  const [mode, setMode] = useState<"voice" | "text" | null>(null);
  const [chapter, setChapter] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  const t = play.data;
  /** Where each chapter starts, as a share of the spoken text. */
  const starts = useMemo(() => {
    if (!t) return [0, 0, 0];
    const lens = CHAPTERS.map(([k]) => t.script[k].length);
    const total = lens.reduce((a, b) => a + b, 0) || 1;
    return [0, lens[0] / total, (lens[0] + lens[1]) / total];
  }, [t]);

  function onTime() {
    const a = audioRef.current;
    if (!a || !a.duration) return;
    const at = a.currentTime / a.duration;
    setChapter(at >= starts[2] ? 2 : at >= starts[1] ? 1 : 0);
  }

  if (play.isLoading) return <main className="tp"><div className="tp-field" aria-hidden="true" /></main>;
  if (!t) {
    return (
      <main className="tp">
        <div className="tp-field" aria-hidden="true" />
        <p className="tp-missing">This transmission is not here.</p>
      </main>
    );
  }

  const [key, label] = CHAPTERS[chapter];

  return (
    <main className="tp">
      <div className="tp-field" aria-hidden="true">
        <span /><span /><span />
      </div>
      <header className="tp-head">
        <p className="tp-kicker">A transmission from ORIEL</p>
        <h1 className="tp-title">{t.title}</h1>
      </header>

      {!mode && (
        <div className="tp-choose">
          {t.audioUrl && (
            <button type="button" className="tp-btn tp-btn--primary" onClick={() => setMode("voice")}>
              Listen
            </button>
          )}
          <button type="button" className="tp-btn" onClick={() => setMode("text")}>
            Read
          </button>
        </div>
      )}

      {mode && (
        <article className="tp-chapter" key={key} aria-live="polite">
          <p className="tp-chapter__label">{label}</p>
          {t.script[key].split(/\n+/).map((p, i) => <p key={i}>{p}</p>)}
        </article>
      )}

      {mode === "voice" && t.audioUrl && (
        <audio ref={audioRef} className="tp-audio" src={t.audioUrl} controls autoPlay onTimeUpdate={onTime} />
      )}
      {mode === "text" && chapter < 2 && (
        <button type="button" className="tp-btn" onClick={() => setChapter(chapter + 1)}>
          Continue
        </button>
      )}
    </main>
  );
}
