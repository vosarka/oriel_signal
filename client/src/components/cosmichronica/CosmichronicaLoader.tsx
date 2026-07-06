import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";

// ════════════════════════════════════════════════════════════════════════════
// CosmichronicaLoader — the boot sequence (Awwwards-grade)
// ════════════════════════════════════════════════════════════════════════════
// 0 → 100 counter with a filling progress rail, then a dramatic clip-path wipe
// that lifts the overlay away to reveal the field. Palette + type stay native to
// the frozen gold system (--font-display / --font-ritual, amber accent).
// Honors prefers-reduced-motion: instant fill, instant handoff.
// ════════════════════════════════════════════════════════════════════════════

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;

interface CosmichronicaLoaderProps {
  onComplete: () => void;
}

export function CosmichronicaLoader({ onComplete }: CosmichronicaLoaderProps) {
  const [pct, setPct] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLSpanElement>(null);
  const stackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setPct(100);
      const id = window.setTimeout(onComplete, 200);
      return () => window.clearTimeout(id);
    }

    const counter = { val: 0 };
    const tl = gsap.timeline({
      onComplete: () => {
        // Lift the counter stack, then wipe the whole panel upward.
        gsap.to(stackRef.current, {
          y: -24,
          opacity: 0,
          duration: 0.5,
          ease: "power3.in",
        });
        gsap.to(rootRef.current, {
          clipPath: "inset(0% 0% 100% 0%)",
          duration: 0.9,
          ease: "power4.inOut",
          delay: 0.15,
          onComplete,
        });
      },
    });

    tl.to(counter, {
      val: 100,
      duration: 1.9,
      ease: "power2.inOut",
      onUpdate: () => {
        const v = counter.val;
        setPct(Math.round(v));
        if (barRef.current) barRef.current.style.transform = `scaleX(${v / 100})`;
      },
    });

    return () => {
      tl.kill();
    };
  }, [onComplete]);

  return (
    <div
      ref={rootRef}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-void-gradient"
      style={{ clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div ref={stackRef} className="flex flex-col items-center">
        <span
          className="text-[10px] tracking-[0.45em] uppercase mb-6"
          style={{
            fontFamily: "var(--font-ritual)",
            color: "rgba(246, 176, 94, 0.6)",
          }}
        >
          Initializing Cosmichronica Signal
        </span>

        {/* Counter — masked digits inside a clipped row */}
        <span
          className="text-6xl md:text-8xl tabular-nums leading-none"
          style={{
            fontFamily: "var(--font-display)",
            color: "rgba(232, 228, 220, 0.94)",
          }}
        >
          {pct}
          <span style={{ color: "var(--oriel-amber)" }}>%</span>
        </span>

        {/* Progress rail — fills left→right via scaleX */}
        <span
          className="relative mt-8 block h-px w-56 overflow-hidden"
          style={{ background: "rgba(232, 228, 220, 0.12)" }}
        >
          <span
            ref={barRef}
            className="absolute inset-0 origin-left"
            style={{
              transform: "scaleX(0)",
              background:
                "linear-gradient(90deg, rgba(189,163,107,0.6), var(--oriel-amber))",
            }}
          />
        </span>
      </div>
    </div>
  );
}
