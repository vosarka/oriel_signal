import { useEffect, useRef, useState } from "react";
import { RESONANCE_BODY_MESH as M } from "@/lib/resonance-body-mesh";
import type { CenterEntry } from "@/components/ResonanceBodygraph";

// Canon center identity (server/rgp-engine.ts) keyed by the bodygraph center id.
const CENTER_META: Record<string, string> = {
  Crown: "Crown Aperture",
  Ajna: "Ajna Lens",
  Throat: "Voice Portal",
  "G-Self": "Vector Core",
  Heart: "Heart Gateway",
  "Solar Plexus": "Solar Nexus",
  Sacral: "Sacral Generator",
  Spleen: "Instinct Node",
  Root: "Foundation Node",
};
const STATUS_TEXT = {
  defined:
    "Fixed frequency transmission — reliable, consistent expression you can trust.",
  open: "Receptive to external photonic downloads — samples and amplifies the field around you.",
};

// The Vossari Resonance Body — a 2D point-mesh human figure on canvas (no
// WebGL). The mesh is baked from a real full-body portrait
// (scripts/bake-resonance-body.mjs), so it keeps human identity; here it only
// breathes: each point drifts a tiny amount so the lines shimmer without the
// body deforming. Split cyan (left) / gold (right), additive glow, crown beam,
// and the 9 Centers of Photonic Resonance placed along the body with the
// channels between them. prefers-reduced-motion freezes to a static frame.

const CYAN = "0, 217, 255";
const GOLD = "246, 176, 94";

// 9 centers as fractions of the figure bounding box (0,0 = crown/top-left of
// bbox; 1,1 = feet/bottom-right). Tuned to the baked figure.
const CENTERS: Record<string, [number, number]> = {
  Crown: [0.5, 0.025],
  Ajna: [0.5, 0.072],
  Throat: [0.5, 0.135],
  "G-Self": [0.5, 0.25],
  Heart: [0.565, 0.265],
  Spleen: [0.435, 0.305],
  "Solar Plexus": [0.565, 0.305],
  Sacral: [0.5, 0.4],
  Root: [0.5, 0.465],
};

const CHANNELS: [string, string][] = [
  ["Crown", "Ajna"],
  ["Ajna", "Throat"],
  ["Throat", "G-Self"],
  ["Throat", "Heart"],
  ["Throat", "Spleen"],
  ["Throat", "Solar Plexus"],
  ["G-Self", "Heart"],
  ["G-Self", "Spleen"],
  ["G-Self", "Sacral"],
  ["Heart", "Spleen"],
  ["Heart", "Solar Plexus"],
  ["Spleen", "Sacral"],
  ["Sacral", "Root"],
  ["Solar Plexus", "Root"],
];

// Demo defined/open state for the standalone page. Real signature data
// (ninecenters) replaces this at integration.
const DEMO_DEFINED = new Set([
  "Crown",
  "Throat",
  "G-Self",
  "Spleen",
  "Sacral",
  "Root",
]);

// point bounding box (the figure doesn't fill the full 0..1 frame)
const bb = { minX: 1, minY: 1, maxX: 0, maxY: 0 };
for (const [x, y] of M.points) {
  if (x < bb.minX) bb.minX = x;
  if (x > bb.maxX) bb.maxX = x;
  if (y < bb.minY) bb.minY = y;
  if (y > bb.maxY) bb.maxY = y;
}
const bw = bb.maxX - bb.minX;
const bh = bb.maxY - bb.minY;

export default function ResonanceBody({
  centers,
}: {
  // Real signature centers (from normalizeCenters(ninecenters)). When omitted,
  // a demo defined/open set is shown (standalone test page).
  centers?: CenterEntry[];
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  // live projected screen position of each center, for click hit-testing
  const centerScreenRef = useRef<Record<string, [number, number]>>({});
  const [selected, setSelected] = useState<string | null>(null);

  const dataById = new Map((centers ?? []).map(c => [c.id, c]));
  const hasRealCenterData = Boolean(centers?.length);
  const defined =
    centers && centers.length
      ? new Set(centers.filter(c => c.defined).map(c => c.id))
      : DEMO_DEFINED;

  // refs so selection / data updates don't restart the animation loop
  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;
  const definedRef = useRef(defined);
  definedRef.current = defined;
  const hasRealCenterDataRef = useRef(hasRealCenterData);
  hasRealCenterDataRef.current = hasRealCenterData;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let W = 0;
    let H = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(2, window.devicePixelRatio || 1);
      W = wrap.clientWidth;
      H = wrap.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
    };
    resize();

    const project = () => {
      const pad = 0.08;
      const availW = W * (1 - 2 * pad);
      const availH = H * (1 - 2 * pad);
      const scale = Math.min(availW / bw, availH / bh);
      const offX = (W - bw * scale) / 2 - bb.minX * scale;
      const offY = (H - bh * scale) / 2 - bb.minY * scale;
      return { scale, offX, offY };
    };

    const draw = (t: number) => {
      const defined = definedRef.current;
      const { scale, offX, offY } = project();
      // figure → canvas helpers
      const fx = (f: number) => (bb.minX + f * bw) * scale + offX;
      const fy = (f: number) => (bb.minY + f * bh) * scale + offY;
      const cpos = (name: string) => {
        const c = CENTERS[name];
        return [fx(c[0]), fy(c[1])] as const;
      };
      const unit = bh * scale; // vertical scale for sizing furniture

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "#08080c";
      ctx.fillRect(0, 0, W, H);

      const amp = reduced ? 0 : H * 0.004;
      const pos = (i: number) => {
        const p = M.points[i];
        let x = p[0] * scale + offX;
        let y = p[1] * scale + offY;
        if (amp) {
          x +=
            Math.sin(t * 0.0006 + i * 1.7) * amp +
            Math.sin(t * 0.0011 + i * 0.9) * amp * 0.5;
          y +=
            Math.cos(t * 0.0007 + i * 2.3) * amp +
            Math.cos(t * 0.0013 + i * 1.3) * amp * 0.5;
        }
        return [x, y] as const;
      };

      ctx.globalCompositeOperation = "lighter";

      // small halo around the head
      ctx.beginPath();
      ctx.arc(fx(0.5), fy(0.06), unit * 0.085, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD}, 0.14)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      // body mesh edges (batched per side)
      for (const [color, side] of [
        [CYAN, 0],
        [GOLD, 1],
      ] as const) {
        ctx.beginPath();
        for (const [a, b] of M.edges) {
          if (M.sides[a] !== side) continue;
          const [ax, ay] = pos(a);
          const [bx, by] = pos(b);
          ctx.moveTo(ax, ay);
          ctx.lineTo(bx, by);
        }
        ctx.strokeStyle = `rgba(${color}, 0.15)`;
        ctx.lineWidth = 0.6;
        ctx.stroke();
      }

      // body mesh points
      for (let i = 0; i < M.points.length; i++) {
        const [x, y] = pos(i);
        const c = M.sides[i] === 0 ? CYAN : GOLD;
        const b = M.bright[i];
        ctx.beginPath();
        ctx.arc(x, y, 0.7 + b * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c}, ${0.3 + b * 0.45})`;
        ctx.fill();
      }

      // ── 9 Centers + channels (the message) ──
      // channels first (under the nodes): bright when both ends defined
      for (const [a, b] of CHANNELS) {
        const [ax, ay] = cpos(a);
        const [bx, by] = cpos(b);
        const lit = defined.has(a) && defined.has(b);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(bx, by);
        ctx.strokeStyle = lit ? `rgba(${GOLD}, 0.6)` : `rgba(${GOLD}, 0.12)`;
        ctx.lineWidth = lit ? 1.6 : 0.8;
        ctx.stroke();
      }

      // center nodes: defined = gold core + glow; open = dim hollow ring
      const pulse = reduced ? 1 : 0.85 + Math.sin(t * 0.0022) * 0.15;
      const r = Math.max(2.5, unit * 0.0065);
      const screen: Record<string, [number, number]> = {};
      for (const name of Object.keys(CENTERS)) {
        const [x, y] = cpos(name);
        screen[name] = [x, y];
        // highlight ring on the selected center
        if (selectedRef.current === name) {
          ctx.beginPath();
          ctx.arc(x, y, r * 2.4, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(255, 244, 214, 0.9)`;
          ctx.lineWidth = 1.4;
          ctx.stroke();
        }
        if (defined.has(name)) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, r * 3.6);
          g.addColorStop(0, `rgba(${GOLD}, ${0.6 * pulse})`);
          g.addColorStop(1, `rgba(${GOLD}, 0)`);
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.arc(x, y, r * 3.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(255, 244, 214, 0.95)`;
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.05, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${GOLD}, 0.45)`;
          ctx.lineWidth = 1.1;
          ctx.stroke();
        }
      }
      centerScreenRef.current = screen;

      // crown light-beam, from the Crown center upward
      const [cx, cy] = cpos("Crown");
      const beam = ctx.createLinearGradient(0, cy - H * 0.16, 0, cy);
      beam.addColorStop(0, `rgba(${GOLD}, 0)`);
      beam.addColorStop(1, `rgba(${GOLD}, 0.9)`);
      ctx.strokeStyle = beam;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx, cy - H * 0.16);
      ctx.lineTo(cx, cy);
      ctx.stroke();

      // ── HUD readouts: only signature-derived or explicitly scaffolded values ──
      ctx.globalCompositeOperation = "source-over";
      const small = "9px 'IBM Plex Mono', ui-monospace, monospace";
      const mono = "11px 'IBM Plex Mono', ui-monospace, monospace";
      const drawStat = (
        x: number,
        y: number,
        label: string,
        value: string,
        align: CanvasTextAlign
      ) => {
        ctx.textAlign = align;
        ctx.font = small;
        ctx.fillStyle = "rgba(154,150,142,0.55)";
        ctx.fillText(label, x, y);
        ctx.font = mono;
        ctx.fillStyle = `rgba(${GOLD}, 0.82)`;
        ctx.fillText(value, x, y + 16);
      };
      const lx = W * 0.06;
      const rx = W * 0.94;
      const definedCount = defined.size;
      const openCount = Math.max(0, Object.keys(CENTERS).length - definedCount);
      const activeLinks = CHANNELS.filter(
        ([a, b]) => defined.has(a) && defined.has(b)
      ).length;
      const source = hasRealCenterDataRef.current
        ? "STATIC SIGNATURE"
        : "DEMO FIELD";
      drawStat(lx, H * 0.22, "FIELD SOURCE", source, "left");
      drawStat(lx, H * 0.4, "CENTER MAP", "9 CENTERS", "left");
      drawStat(lx, H * 0.58, "DEFINED CENTERS", `${definedCount} / 9`, "left");
      drawStat(rx, H * 0.22, "OPEN CENTERS", `${openCount} / 9`, "right");
      drawStat(
        rx,
        H * 0.4,
        "RESONANCE LINKS",
        `${activeLinks} / ${CHANNELS.length}`,
        "right"
      );
      drawStat(rx, H * 0.58, "INSPECT MODE", "CLICK CENTER", "right");

      ctx.textAlign = "center";
      ctx.font = "10px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.fillStyle = "rgba(189,163,107,0.5)";
      ctx.fillText(
        "V O S S A R I   R E S O N A N C E   B O D Y",
        W / 2,
        H * 0.96
      );
    };

    const loop = (t: number) => {
      draw(t);
      rafRef.current = requestAnimationFrame(loop);
    };
    const onResize = () => resize();
    window.addEventListener("resize", onResize);
    if (reduced) draw(0);
    else rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // hit-test a pointer position against the live center screen positions
  const centerAt = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let hit: string | null = null;
    let best = 24 * 24;
    for (const [name, [cx, cy]] of Object.entries(centerScreenRef.current)) {
      const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
      if (d < best) {
        best = d;
        hit = name;
      }
    }
    return hit;
  };

  const isDef = selected ? defined.has(selected) : false;
  const entry = selected ? dataById.get(selected) : undefined;

  return (
    <div
      ref={wrapRef}
      style={{ position: "absolute", inset: 0, background: "#08080c" }}
      onClick={e => setSelected(centerAt(e.clientX, e.clientY))}
      onPointerMove={e => {
        const c = canvasRef.current;
        if (c)
          c.style.cursor = centerAt(e.clientX, e.clientY)
            ? "pointer"
            : "default";
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {selected && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "9%",
            transform: "translateX(-50%)",
            width: "min(440px, 84vw)",
            padding: "16px 20px 18px",
            background: "rgba(10, 10, 14, 0.82)",
            border: "1px solid rgba(246,176,94,0.28)",
            backdropFilter: "blur(10px)",
            boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
          }}
        >
          <button
            onClick={() => setSelected(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 8,
              right: 10,
              background: "none",
              border: "none",
              color: "rgba(154,150,142,0.7)",
              cursor: "pointer",
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 14,
            }}
          >
            ×
          </button>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              letterSpacing: "0.26em",
              color: isDef ? "rgba(246,176,94,0.9)" : "rgba(154,150,142,0.7)",
              marginBottom: 7,
            }}
          >
            {isDef ? "● DEFINED" : "○ OPEN"}
          </div>
          <div
            style={{
              fontFamily: "var(--font-display, 'Cormorant Garamond'), serif",
              fontSize: 22,
              color: "#f3ecdf",
              lineHeight: 1.1,
              marginBottom: 4,
            }}
          >
            {CENTER_META[selected] ?? selected}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 8,
              letterSpacing: "0.22em",
              color: "rgba(189,163,107,0.6)",
              marginBottom: 10,
            }}
          >
            {selected.toUpperCase()} CENTER
            {entry?.codon256Id ? ` · ${entry.codon256Id}` : ""}
            {entry?.frequency ? ` · ${Math.round(entry.frequency)} THz` : ""}
          </div>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 11,
              lineHeight: 1.7,
              color: "rgba(232,228,220,0.78)",
            }}
          >
            {isDef ? STATUS_TEXT.defined : STATUS_TEXT.open}
          </div>
        </div>
      )}
    </div>
  );
}
