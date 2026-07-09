import { useEffect, useMemo, useRef, useState } from "react";
import { RESONANCE_BODY_MESH as M } from "@/lib/resonance-body-mesh";
import {
  VTRS_BODY_CENTER_COUNT,
  VTRS_BODY_DEMO_DEFINED,
  VTRS_BODY_LINK_COUNT,
  VTRS_BODY_ORDER,
  VTRS_BODY_POSITIONS,
  VTRS_BODY_SHORT_LABELS,
  getVtrsBodyLinkPairs,
  getVtrsCenterMeta,
  hexToRgb,
} from "@/lib/vtrs-body-layout";
import { CENTER_SYMBOL } from "@/components/oriel-signal/CodonWheel";
import type {
  CenterEntry,
  ChannelEntry,
} from "@/components/ResonanceBodygraph";

const CYAN = "0, 217, 255";
const GOLD = "246, 176, 94";

const bb = { minX: 1, minY: 1, maxX: 0, maxY: 0 };
for (const [x, y] of M.points) {
  if (x < bb.minX) bb.minX = x;
  if (x > bb.maxX) bb.maxX = x;
  if (y < bb.minY) bb.minY = y;
  if (y > bb.maxY) bb.maxY = y;
}
const bw = bb.maxX - bb.minX;
const bh = bb.maxY - bb.minY;

const LINK_PAIRS = getVtrsBodyLinkPairs();

function pairKey(centerA: string, centerB: string) {
  return [centerA, centerB].sort().join("|");
}

type ResonanceBodyProps = {
  centers?: CenterEntry[];
  channels?: ChannelEntry[];
  /** Dot markers (lab) or bio-architecture center sigils. */
  nodeStyle?: "dot" | "icon";
  /** Side HUD + footer caption. Off for profile hero embed. */
  showHud?: boolean;
  /** Fills parent instead of viewport; transparent canvas backdrop. */
  embedded?: boolean;
  className?: string;
};

export default function ResonanceBody({
  centers,
  channels,
  nodeStyle = "dot",
  showHud = true,
  embedded = false,
  className = "",
}: ResonanceBodyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const centerScreenRef = useRef<Record<string, [number, number]>>({});
  const iconsRef = useRef<Record<string, HTMLImageElement>>({});
  const [iconsRevision, setIconsRevision] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);

  const dataById = useMemo(
    () => new Map((centers ?? []).map(center => [center.id, center])),
    [centers]
  );
  const hasRealCenterData = Boolean(centers?.length);
  const hasRealChannelData = Boolean(channels?.length);

  const defined = useMemo(() => {
    if (centers?.length) {
      return new Set(centers.filter(center => center.defined).map(center => center.id));
    }
    return new Set(VTRS_BODY_DEMO_DEFINED);
  }, [centers]);

  const activePairKeys = useMemo(() => {
    const keys = new Set<string>();
    for (const channel of channels ?? []) {
      if (!channel.active) continue;
      keys.add(pairKey(channel.centerA, channel.centerB));
    }
    return keys;
  }, [channels]);

  const selectedRef = useRef<string | null>(null);
  selectedRef.current = selected;
  const definedRef = useRef(defined);
  definedRef.current = defined;
  const activePairKeysRef = useRef(activePairKeys);
  activePairKeysRef.current = activePairKeys;
  const hasRealCenterDataRef = useRef(hasRealCenterData);
  hasRealCenterDataRef.current = hasRealCenterData;
  const hasRealChannelDataRef = useRef(hasRealChannelData);
  hasRealChannelDataRef.current = hasRealChannelData;
  const nodeStyleRef = useRef(nodeStyle);
  nodeStyleRef.current = nodeStyle;
  const showHudRef = useRef(showHud);
  showHudRef.current = showHud;

  useEffect(() => {
    if (nodeStyle !== "icon") return;
    let pending = VTRS_BODY_ORDER.length;
    const next: Record<string, HTMLImageElement> = {};
    for (const centerId of VTRS_BODY_ORDER) {
      const symbol = CENTER_SYMBOL[centerId];
      if (!symbol) {
        pending -= 1;
        continue;
      }
      const img = new Image();
      img.onload = () => {
        pending -= 1;
        if (pending <= 0) setIconsRevision(rev => rev + 1);
      };
      img.onerror = () => {
        pending -= 1;
        if (pending <= 0) setIconsRevision(rev => rev + 1);
      };
      img.src = `/9-centers/${symbol}.png`;
      next[centerId] = img;
    }
    iconsRef.current = next;
  }, [nodeStyle]);

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
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
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
      const definedSet = definedRef.current;
      const activePairs = activePairKeysRef.current;
      const { scale, offX, offY } = project();
      const fx = (f: number) => (bb.minX + f * bw) * scale + offX;
      const fy = (f: number) => (bb.minY + f * bh) * scale + offY;
      const cpos = (name: string) => {
        const c = VTRS_BODY_POSITIONS[name];
        return [fx(c[0]), fy(c[1])] as const;
      };
      const unit = bh * scale;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (!embedded) {
        ctx.fillStyle = "#08080c";
        ctx.fillRect(0, 0, W, H);
      }

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

      const [originX, originY] = cpos("Origin");
      const [satX, satY] = cpos("Saturation");

      ctx.beginPath();
      ctx.arc(originX, originY - unit * 0.02, unit * 0.09, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${GOLD}, 0.14)`;
      ctx.lineWidth = 1;
      ctx.stroke();

      const spine = ctx.createLinearGradient(originX, originY, satX, satY);
      spine.addColorStop(0, `rgba(${GOLD}, 0.22)`);
      spine.addColorStop(0.5, `rgba(${CYAN}, 0.08)`);
      spine.addColorStop(1, `rgba(${GOLD}, 0.16)`);
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      ctx.lineTo(satX, satY);
      ctx.strokeStyle = spine;
      ctx.lineWidth = 1;
      ctx.setLineDash([unit * 0.012, unit * 0.018]);
      ctx.stroke();
      ctx.setLineDash([]);

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

      for (let i = 0; i < M.points.length; i++) {
        const [x, y] = pos(i);
        const c = M.sides[i] === 0 ? CYAN : GOLD;
        const b = M.bright[i];
        ctx.beginPath();
        ctx.arc(x, y, 0.7 + b * 0.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${c}, ${0.3 + b * 0.45})`;
        ctx.fill();
      }

      const linkLit = (centerA: string, centerB: string) => {
        if (hasRealChannelDataRef.current) {
          return activePairs.has(pairKey(centerA, centerB));
        }
        return definedSet.has(centerA) && definedSet.has(centerB);
      };

      for (const pair of LINK_PAIRS) {
        if (pair.selfLoop) {
          const [x, y] = cpos(pair.centerA);
          const lit = linkLit(pair.centerA, pair.centerB);
          const loopR = unit * 0.028;
          ctx.beginPath();
          ctx.arc(x, y - loopR * 0.85, loopR, Math.PI * 0.12, Math.PI * 0.88);
          ctx.strokeStyle = lit ? `rgba(${GOLD}, 0.62)` : `rgba(${GOLD}, 0.12)`;
          ctx.lineWidth = lit ? 1.6 : 0.75;
          ctx.stroke();
          continue;
        }

        const [ax, ay] = cpos(pair.centerA);
        const [bx, by] = cpos(pair.centerB);
        const lit = linkLit(pair.centerA, pair.centerB);
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        const dx = bx - ax;
        const dy = by - ay;
        const dist = Math.hypot(dx, dy) || 1;
        const bow = Math.min(unit * 0.04, dist * 0.12);
        const cx = mx + (-dy / dist) * bow;
        const cy = my + (dx / dist) * bow;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(cx, cy, bx, by);
        ctx.strokeStyle = lit ? `rgba(${GOLD}, 0.62)` : `rgba(${GOLD}, 0.1)`;
        ctx.lineWidth = lit ? 1.6 : 0.8;
        ctx.stroke();
      }

      const pulse = reduced ? 1 : 0.85 + Math.sin(t * 0.0022) * 0.15;
      const useIcons = nodeStyleRef.current === "icon";
      const r = Math.max(useIcons ? 3.6 : 4.2, unit * (useIcons ? 0.009 : 0.011));
      const screen: Record<string, [number, number]> = {};

      for (const centerId of VTRS_BODY_ORDER) {
        const [x, y] = cpos(centerId);
        screen[centerId] = [x, y];
        const meta = getVtrsCenterMeta(centerId);
        const [cr, cg, cb] = hexToRgb(meta?.color ?? "#bda36b");
        const isDefined = definedSet.has(centerId);
        const icon = iconsRef.current[centerId];
        const iconReady = Boolean(icon?.complete && icon.naturalWidth > 0);

        if (selectedRef.current === centerId) {
          ctx.beginPath();
          ctx.arc(x, y, r * (useIcons ? 3.4 : 2.6), 0, Math.PI * 2);
          ctx.strokeStyle = "rgba(255, 244, 214, 0.92)";
          ctx.lineWidth = 1.5;
          ctx.stroke();
        }

        if (isDefined) {
          const glow = ctx.createRadialGradient(x, y, 0, x, y, r * (useIcons ? 5.5 : 4.5));
          glow.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, ${0.78 * pulse})`);
          glow.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, r * (useIcons ? 5.5 : 4.5), 0, Math.PI * 2);
          ctx.fill();
        }

        if (useIcons && iconReady) {
          const iconSize = r * 5.2;
          ctx.save();
          ctx.globalAlpha = isDefined ? 1 : 0.38;
          ctx.beginPath();
          ctx.arc(x, y, iconSize * 0.52, 0, Math.PI * 2);
          ctx.strokeStyle = isDefined
            ? `rgba(${cr}, ${cg}, ${cb}, 0.82)`
            : `rgba(${cr}, ${cg}, ${cb}, 0.34)`;
          ctx.lineWidth = isDefined ? 1.4 : 1;
          ctx.stroke();
          ctx.drawImage(
            icon,
            x - iconSize / 2,
            y - iconSize / 2,
            iconSize,
            iconSize
          );
          ctx.restore();
        } else if (isDefined) {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.45, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.35)`;
          ctx.lineWidth = 1;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.96)`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, r * 0.42, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(255, 248, 230, 0.92)";
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${cr}, ${cg}, ${cb}, 0.08)`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, r * 1.2, 0, Math.PI * 2);
          ctx.strokeStyle = `rgba(${cr}, ${cg}, ${cb}, 0.5)`;
          ctx.lineWidth = 1.2;
          ctx.stroke();
        }

        if (!useIcons) {
          ctx.font = "9px 'IBM Plex Mono', ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = isDefined
            ? `rgba(${cr}, ${cg}, ${cb}, 0.98)`
            : "rgba(154,150,142,0.62)";
          ctx.fillText(meta?.roman ?? "", x, y - r * 2.2);

          ctx.font = "7px 'IBM Plex Mono', ui-monospace, monospace";
          ctx.fillStyle = isDefined
            ? `rgba(${cr}, ${cg}, ${cb}, 0.72)`
            : "rgba(154,150,142,0.45)";
          ctx.fillText(VTRS_BODY_SHORT_LABELS[centerId] ?? "", x, y + r * 2.6);
        } else {
          ctx.font = "8px 'IBM Plex Mono', ui-monospace, monospace";
          ctx.textAlign = "center";
          ctx.fillStyle = isDefined
            ? `rgba(${cr}, ${cg}, ${cb}, 0.9)`
            : "rgba(154,150,142,0.55)";
          ctx.fillText(meta?.roman ?? "", x, y + r * 3.4);
        }
      }
      centerScreenRef.current = screen;

      if (!showHudRef.current) {
        ctx.globalCompositeOperation = "source-over";
        return;
      }

      const beam = ctx.createLinearGradient(0, originY - H * 0.18, 0, originY);
      beam.addColorStop(0, `rgba(${GOLD}, 0)`);
      beam.addColorStop(1, `rgba(${GOLD}, 0.85)`);
      ctx.strokeStyle = beam;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(originX, originY - H * 0.18);
      ctx.lineTo(originX, originY);
      ctx.stroke();

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
      const definedCount = VTRS_BODY_ORDER.filter(id => definedSet.has(id)).length;
      const openCount = VTRS_BODY_CENTER_COUNT - definedCount;
      const activeLinks = hasRealChannelDataRef.current
        ? (channels ?? []).filter(channel => channel.active).length
        : LINK_PAIRS.filter(
            pair =>
              !pair.selfLoop && linkLit(pair.centerA, pair.centerB)
          ).length;
      const source = hasRealCenterDataRef.current
        ? "STATIC SIGNATURE"
        : "DEMO FIELD";

      drawStat(lx, H * 0.22, "FIELD SOURCE", source, "left");
      drawStat(lx, H * 0.4, "VTRS MAP", `${VTRS_BODY_CENTER_COUNT} CENTERS`, "left");
      drawStat(lx, H * 0.58, "DEFINED", `${definedCount} / ${VTRS_BODY_CENTER_COUNT}`, "left");
      drawStat(rx, H * 0.22, "OPEN", `${openCount} / ${VTRS_BODY_CENTER_COUNT}`, "right");
      drawStat(
        rx,
        H * 0.4,
        "RESONANCE LINKS",
        `${activeLinks} / ${VTRS_BODY_LINK_COUNT}`,
        "right"
      );
      drawStat(rx, H * 0.58, "INSPECT", "CLICK CENTER", "right");

      ctx.textAlign = "center";
      ctx.font = "10px 'IBM Plex Mono', ui-monospace, monospace";
      ctx.fillStyle = "rgba(189,163,107,0.5)";
      ctx.fillText(
        "V O S S A R I   V T R S   R E S O N A N C E   B O D Y",
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
  }, [channels, embedded, iconsRevision, nodeStyle, showHud]);

  const centerAt = (clientX: number, clientY: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let hit: string | null = null;
    let best = 32 * 32;
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
  const meta = selected ? getVtrsCenterMeta(selected) : undefined;

  const wrapClass = [
    "resonance-body",
    embedded ? "resonance-body--embedded" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      ref={wrapRef}
      className={wrapClass}
      style={
        embedded
          ? { position: "relative", width: "100%", height: "100%" }
          : { position: "absolute", inset: 0, background: "#08080c" }
      }
      onClick={e => setSelected(centerAt(e.clientX, e.clientY))}
      onPointerMove={e => {
        const c = canvasRef.current;
        if (c) {
          c.style.cursor = centerAt(e.clientX, e.clientY) ? "pointer" : "default";
        }
      }}
    >
      <canvas ref={canvasRef} style={{ display: "block" }} />

      {selected && meta ? (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: "absolute",
            left: "50%",
            bottom: "9%",
            transform: "translateX(-50%)",
            width: "min(480px, 88vw)",
            padding: "16px 20px 18px",
            background: "rgba(10, 10, 14, 0.86)",
            border: `1px solid ${meta.color}55`,
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
              color: isDef ? meta.color : "rgba(154,150,142,0.7)",
              marginBottom: 7,
            }}
          >
            {isDef ? "● DEFINED" : "○ OPEN"} · {meta.roman}
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
            {meta.name}
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
            {isDef ? meta.definedState : meta.openState}
          </div>
        </div>
      ) : null}
    </div>
  );
}