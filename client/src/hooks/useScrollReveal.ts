import { useEffect, useRef, useState } from "react";

/**
 * useScrollReveal
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Reusable IntersectionObserver hook. Returns a ref and a boolean for whether
 * the element is currently in view. Used across immersive pages to:
 *   - trigger decode/reveal animations as content enters the viewport
 *   - PAUSE expensive node animations when off-screen (60fps discipline)
 *
 * Two modes via `once`:
 *   once=true  → latches true the first time it enters (reveal-once)
 *   once=false → tracks live in/out of view (for pausing animation)
 *
 * Reduced-motion safe: callers should still gate motion on the media query;
 * this hook only reports visibility.
 */

export interface ScrollRevealOptions {
  /** Visibility ratio that counts as "in view" (0–1). Default 0.25. */
  threshold?: number;
  /** rootMargin string, e.g. "-10% 0px". Default "0px 0px -10% 0px". */
  rootMargin?: string;
  /** Latch true on first entry and stop observing. Default true. */
  once?: boolean;
}

export function useScrollReveal<T extends Element = HTMLElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.25, rootMargin = "0px 0px -10% 0px", once = true } =
    options;
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // SSR / unsupported → reveal immediately so content is never hidden.
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            if (once) observer.disconnect();
          } else if (!once) {
            setInView(false);
          }
        }
      },
      { threshold, rootMargin }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, once]);

  return { ref, inView };
}
