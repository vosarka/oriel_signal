import { Suspense, lazy, useEffect, useRef, useState } from "react";

/**
 * CosmicAtmosphere — modular ambient depth layer
 * ════════════════════════════════════════════════════════════════════════════
 *
 * A single, swappable atmosphere component that sits BEHIND the Cosmichronica
 * axis. It exists only to create depth and motion — it must never dominate the
 * UI or steal interaction.
 *
 * Two backends, chosen automatically:
 *   1. Spline  — when a `scene` URL is provided (your Spline Pro export).
 *                Lazy-loaded so it never blocks first paint, and only mounted
 *                once it scrolls near view.
 *   2. Fallback — a GPU-cheap CSS/Canvas "energy core" used today (no Spline
 *                scene yet) and whenever reduced-motion is requested or the
 *                Spline scene fails to load.
 *
 * To plug in the real scene later, pass `scene="https://prod.spline.design/xxx/scene.splinecode"`.
 * Nothing else on the page needs to change.
 */

// Lazy import keeps the (large) Spline runtime out of the main bundle.
const Spline = lazy(() => import("@splinetool/react-spline"));

interface CosmicAtmosphereProps {
  /** Spline scene URL (.splinecode). When omitted, the CSS fallback renders. */
  scene?: string;
  /** Extra className on the wrapper. */
  className?: string;
}

function prefersReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches ?? false;
}

export default function CosmicAtmosphere({
  scene,
  className = "",
}: CosmicAtmosphereProps) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [reduced, setReduced] = useState(prefersReducedMotion);
  const [splineFailed, setSplineFailed] = useState(false);
  const [nearView, setNearView] = useState(false);

  // Track reduced-motion changes.
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Only mount Spline once the atmosphere is near the viewport.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setNearView(true);
      return;
    }
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNearView(true);
          obs.disconnect();
        }
      },
      { rootMargin: "400px 0px" }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  const useSpline = Boolean(scene) && !reduced && !splineFailed;

  return (
    <div
      ref={wrapRef}
      className={`cosmic-atmosphere ${className}`}
      aria-hidden="true"
    >
      {useSpline && nearView ? (
        <Suspense fallback={<AtmosphereFallback reduced={reduced} />}>
          <div className="cosmic-atmosphere__spline">
            <Spline scene={scene!} onError={() => setSplineFailed(true)} />
          </div>
        </Suspense>
      ) : (
        <AtmosphereFallback reduced={reduced} />
      )}
    </div>
  );
}

/**
 * CSS/SVG fallback — a slow volumetric "energy core": concentric rings + a
 * drifting nebula glow. Pure CSS transforms, GPU-friendly, paused under
 * reduced-motion (handled in cosmichronica.css).
 */
function AtmosphereFallback({ reduced }: { reduced: boolean }) {
  return (
    <div
      className={`cosmic-core ${reduced ? "is-still" : ""}`}
      aria-hidden="true"
    >
      <span className="cosmic-core__nebula" />
      <span className="cosmic-core__ring cosmic-core__ring--a" />
      <span className="cosmic-core__ring cosmic-core__ring--b" />
      <span className="cosmic-core__ring cosmic-core__ring--c" />
      <span className="cosmic-core__seed" />
    </div>
  );
}
