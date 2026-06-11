import { useEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// Flower of Life background field — fine silver blueprint circles on a hex
// lattice that draw themselves in as the user scrolls, building outward from
// the center seed like a signal decoding into form.
//
// A GSAP ScrollTrigger scrub (0.6s catch-up) drives a single proxy value
// written to one CSS custom property (--fi-geo-p, 0..1) on the container;
// every circle resolves its own stroke-dashoffset from it via CSS clamp()
// against a per-ring stagger window. No per-circle JS.
//
// Reduced motion: no ScrollTrigger is created and CSS forces the geometry
// fully drawn and static.

const RING_COUNT = 5; // rings around the center seed (0 = seed circle)
const RADIUS = 118; // circle radius in viewBox units
const VIEW = 1200; // viewBox is -VIEW/2..VIEW/2 square

type GeoCircle = {
  cx: number;
  cy: number;
  ring: number;
};

function buildFlowerOfLife(): GeoCircle[] {
  const circles: GeoCircle[] = [{ cx: 0, cy: 0, ring: 0 }];
  const seen = new Set(["0,0"]);

  // Hex lattice: each ring r has 6r centers at distance r*RADIUS, generated
  // by walking the six hex directions from each ring corner.
  for (let ring = 1; ring <= RING_COUNT; ring++) {
    for (let side = 0; side < 6; side++) {
      const cornerAngle = (Math.PI / 3) * side;
      const nextAngle = (Math.PI / 3) * (side + 1);
      const corner = {
        x: Math.cos(cornerAngle) * RADIUS * ring,
        y: Math.sin(cornerAngle) * RADIUS * ring,
      };
      const next = {
        x: Math.cos(nextAngle) * RADIUS * ring,
        y: Math.sin(nextAngle) * RADIUS * ring,
      };
      for (let step = 0; step < ring; step++) {
        const t = step / ring;
        const cx = corner.x + (next.x - corner.x) * t;
        const cy = corner.y + (next.y - corner.y) * t;
        const key = `${Math.round(cx)},${Math.round(cy)}`;
        if (seen.has(key)) continue;
        seen.add(key);
        circles.push({ cx, cy, ring });
      }
    }
  }

  return circles;
}

export function SacredGeometryField() {
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const circles = useMemo(buildFlowerOfLife, []);
  const circumference = 2 * Math.PI * RADIUS;

  useEffect(() => {
    const field = fieldRef.current;
    if (!field) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      field.style.setProperty("--fi-geo-p", "1");
      return;
    }

    const proxy = { p: 0.06 };
    const apply = () =>
      field.style.setProperty("--fi-geo-p", proxy.p.toFixed(4));
    // Keep the center seed faintly present behind the hero at page top.
    apply();

    const tween = gsap.fromTo(
      proxy,
      { p: 0.06 },
      {
        p: 1,
        ease: "none",
        onUpdate: apply,
        scrollTrigger: {
          trigger: document.documentElement,
          start: 0,
          end: () => ScrollTrigger.maxScroll(window) * 0.85,
          scrub: 0.6,
          invalidateOnRefresh: true,
        },
      }
    );

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, []);

  return (
    <div ref={fieldRef} className="fi-geometry" aria-hidden="true">
      <svg
        viewBox={`${-VIEW / 2} ${-VIEW / 2} ${VIEW} ${VIEW}`}
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {circles.map((c, index) => {
          // Each ring draws inside its own slice of the scroll progress,
          // overlapping the next so the build flows instead of stepping.
          const start = (c.ring / (RING_COUNT + 1)) * 0.8;
          const window_ = 0.34;
          return (
            <circle
              key={index}
              cx={c.cx}
              cy={c.cy}
              r={RADIUS}
              className="fi-geometry__circle"
              style={
                {
                  "--c": circumference,
                  "--g-start": start,
                  "--g-win": window_,
                  "--g-alpha": Math.max(0.1, 0.16 - c.ring * 0.013),
                } as React.CSSProperties
              }
            />
          );
        })}
      </svg>
    </div>
  );
}
