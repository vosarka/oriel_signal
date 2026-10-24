import { useAuth } from "@/_core/hooks/useAuth";
import {
  decideIntroFilm,
  INTRO_FILM_YOUTUBE_URL,
  introFilmSeenInBrowser,
  rememberIntroFilmInBrowser,
} from "@/lib/introFilm";
import {
  getYouTubeEmbedUrl,
  getYouTubeThumbnailUrl,
} from "@/lib/transmission-media";
import { trpc } from "@/lib/trpc";
import { useCallback, useEffect, useRef, useState } from "react";

const EMBED_URL = getYouTubeEmbedUrl(INTRO_FILM_YOUTUBE_URL);
const POSTER_URL = getYouTubeThumbnailUrl(INTRO_FILM_YOUTUBE_URL);

/**
 * The intro film, full screen, once per Seeker, on whichever page they land.
 *
 * It opens on a gate rather than playing by itself: browsers refuse sound
 * without a touch first, and ORIEL's voice is the point of the film. Closing
 * it counts as seen, the same as watching to the end.
 */
export default function IntroFilm() {
  const { user, loading } = useAuth();
  const { mutate: markSeen } = trpc.auth.markIntroFilmSeen.useMutation();
  const [phase, setPhase] = useState<"hidden" | "gate" | "playing">("hidden");
  const decidedRef = useRef(false);

  const signedIn = Boolean(user);
  const seenOnAccount = Boolean(
    (user as { introFilmSeen?: boolean } | null)?.introFilmSeen
  );

  useEffect(() => {
    // Decided once per page load. Signing in while the film is open must not
    // pull it away, and closing it must not bring it back.
    if (decidedRef.current || !EMBED_URL) return;
    const decision = decideIntroFilm({
      authLoading: loading,
      signedIn,
      seenOnAccount,
      seenInBrowser: introFilmSeenInBrowser(),
    });
    if (decision === "wait") return;
    decidedRef.current = true;
    if (decision === "show") setPhase("gate");
    if (decision === "record") markSeen();
  }, [loading, signedIn, seenOnAccount, markSeen]);

  const recordSeen = useCallback(() => {
    rememberIntroFilmInBrowser();
    if (signedIn) markSeen();
  }, [signedIn, markSeen]);

  const close = useCallback(() => {
    recordSeen();
    setPhase("hidden");
  }, [recordSeen]);

  const play = () => {
    // Counted from the first touch: a Seeker who reloads halfway through has
    // seen it, and a replay on every reload is what this exists to prevent.
    recordSeen();
    setPhase("playing");
  };

  useEffect(() => {
    if (phase === "hidden") return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [phase, close]);

  if (phase === "hidden" || !EMBED_URL) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="ORIEL Signal: The Paradox of Fear"
      className="fixed inset-0 z-[100000] flex items-center justify-center"
      style={{ background: "#050505" }}
    >
      {phase === "playing" ? (
        <iframe
          src={`${EMBED_URL}?autoplay=1&rel=0&playsinline=1`}
          title="ORIEL Signal: The Paradox of Fear"
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          // A strip above the player keeps the close button off YouTube's
          // own controls, which sit in the same corner.
          className="absolute inset-x-0 bottom-0 top-14 h-[calc(100%-3.5rem)] w-full border-0"
        />
      ) : (
        <>
          {POSTER_URL && (
            <img
              src={POSTER_URL}
              alt=""
              className="absolute inset-0 h-full w-full object-cover"
              style={{ opacity: 0.35 }}
            />
          )}
          <div className="relative flex flex-col items-center justify-center gap-6 px-4 text-center">
            <p
              className="font-mono text-[10px] uppercase tracking-[0.35em]"
              style={{ color: "#5ba4a4" }}
            >
              A transmission for you
            </p>
            <h2
              className="text-3xl md:text-5xl"
              style={{ fontFamily: "var(--font-display)", color: "#fff7e6" }}
            >
              The Paradox of Fear
            </h2>
            <button
              type="button"
              onClick={play}
              className="rounded-full px-8 py-3 font-mono text-xs uppercase tracking-[0.3em] transition-colors"
              style={{
                color: "#050505",
                background: "#d8b56d",
                border: "1px solid #e4c88c",
              }}
            >
              ▶ Play
            </button>
          </div>
        </>
      )}

      <button
        type="button"
        onClick={close}
        aria-label="Close the film"
        className="absolute right-4 top-4 rounded-full px-3 py-1 font-mono text-lg leading-none transition-opacity hover:opacity-100"
        style={{
          color: "#d8b56d",
          border: "1px solid rgba(216,181,109,0.35)",
          background: "rgba(5,5,5,0.6)",
          opacity: 0.8,
        }}
      >
        ×
      </button>
    </div>
  );
}
