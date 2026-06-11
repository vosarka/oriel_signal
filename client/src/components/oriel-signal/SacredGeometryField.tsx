import { useEffect, useMemo, useRef } from "react";

// Flower of Life background field — fine silver blueprint circles on a hex
// lattice that draw themselves in as the user scrolls, building outward from
// the center seed like a signal decoding into form.
//
// One scroll listener writes a single CSS custom property (--fi-geo-p, 0..1)
// on the container; every circle resolves its own stroke-dashoffset from it
// via CSS clamp() against a per-ring stagger window. No per-circle JS, no
// layout reads beyond the cached document height.
//
// Reduced motion: the listener never attaches and CSS forces the geometry
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

    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const scrolled = max > 0 ? window.scrollY / max : 1;
      // Keep the center seed faintly present behind the hero at page top.
      const progress = Math.max(0.06, Math.min(1, scrolled / 0.85));
      field.style.setProperty("--fi-geo-p", progress.toFixed(4));
    };

    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
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
