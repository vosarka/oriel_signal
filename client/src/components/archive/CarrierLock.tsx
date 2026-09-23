import { useCallback, useEffect, useRef, useState } from "react";
import { HeroSigil } from "@/components/oriel-signal/HeroSigil";

/**
 * CARRIERLOCK — the register does not open on a click.
 * It opens when the receiver holds the signal long enough to seat it.
 *
 * Geometry is drawn (SVG strokes, drawn rings and nodes). The emblem at
 * centre is the existing recovered mark — nothing here is generated art.
 */

const HOLD_MS = 1400;
const R_OUTER = 92;
const CIRC = 2 * Math.PI * R_OUTER;

// Nodes seated on the rings. Cardinal + two offset markers.
const NODES: Array<{ r: number; deg: number; hollow?: boolean }> = [
  { r: 92, deg: -90, hollow: true },
  { r: 92, deg: 90, hollow: true },
  { r: 74, deg: 0 },
  { r: 74, deg: 180 },
  { r: 74, deg: -90 },
  { r: 58, deg: -90 },
  { r: 58, deg: 90 },
  { r: 106, deg: -152 },
  { r: 106, deg: 28 },
];

function polar(r: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 100 + r * Math.cos(rad), y: 100 + r * Math.sin(rad) };
}

interface CarrierLockProps {
  open: boolean;
  onOpen: () => void;
  /** Mono line under the emblem. */
  hint: string;
  openHint: string;
}

export function CarrierLock({
  open,
  onOpen,
  hint,
  openHint,
}: CarrierLockProps) {
  const [progress, setProgress] = useState(0);
  const [holding, setHolding] = useState(false);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const openRef = useRef(open);

  useEffect(() => {
    openRef.current = open;
  }, [open]);

  const stopLoop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  useEffect(() => stopLoop, [stopLoop]);

  const beginHold = useCallback(() => {
    if (openRef.current) return;
    setHolding(true);
    startRef.current = performance.now();

    const step = (now: number) => {
      const p = Math.min(1, (now - startRef.current) / HOLD_MS);
      setProgress(p);
      if (p >= 1) {
        stopLoop();
        setHolding(false);
        onOpen();
        return;
      }
      rafRef.current = requestAnimationFrame(step);
    };

    stopLoop();
    rafRef.current = requestAnimationFrame(step);
  }, [onOpen, stopLoop]);

  const releaseHold = useCallback(() => {
    if (openRef.current) return;
    stopLoop();
    setHolding(false);

    // The signal decays rather than snapping — it was never seated.
    const from = performance.now();
    const base = progress;
    const decay = (now: number) => {
      const p = Math.max(0, base - (now - from) / 420);
      setProgress(p);
      if (p > 0) rafRef.current = requestAnimationFrame(decay);
      else rafRef.current = null;
    };
    if (base > 0) rafRef.current = requestAnimationFrame(decay);
  }, [progress, stopLoop]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (open) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setProgress(1);
      onOpen();
    }
  };

  const shown = open ? 1 : progress;
  const state = open ? "is-open" : holding ? "is-holding" : "";

  return (
    <button
      type="button"
      className={`tx-lock ${state}`}
      aria-disabled={open || undefined}
      aria-label={
        open ? "Register open" : "Hold to seat the carrier and open the register"
      }
      onPointerDown={beginHold}
      onPointerUp={releaseHold}
      onPointerLeave={releaseHold}
      onPointerCancel={releaseHold}
      onKeyDown={onKeyDown}
    >
      <svg className="tx-lock__orbits" viewBox="0 0 200 200" aria-hidden="true">
        {/* Drawn rings — the instrument, not an ornament */}
        <circle className="tx-lock__ring tx-lock__ring--faint" cx="100" cy="100" r="106" />
        <circle className="tx-lock__ring" cx="100" cy="100" r="92" />
        <g className="tx-lock__spin">
          <circle
            className="tx-lock__ring tx-lock__ring--dashed"
            cx="100"
            cy="100"
            r="74"
          />
        </g>
        <g className="tx-lock__spin tx-lock__spin--counter">
          <circle className="tx-lock__ring" cx="100" cy="100" r="58" />
        </g>
        <circle className="tx-lock__ring tx-lock__ring--faint" cx="100" cy="100" r="40" />

        {/* Axis cross — registration, not decoration */}
        <line className="tx-lock__axis" x1="100" y1="-6" x2="100" y2="206" />
        <line className="tx-lock__axis" x1="-6" y1="100" x2="206" y2="100" />

        {NODES.map((n, i) => {
          const { x, y } = polar(n.r, n.deg);
          return (
            <circle
              key={i}
              className={`tx-lock__node ${n.hollow ? "tx-lock__node--hollow" : ""}`}
              cx={x}
              cy={y}
              r={n.hollow ? 4 : 2.4}
            />
          );
        })}

        {/* The seat */}
        <circle
          className="tx-lock__arc"
          cx="100"
          cy="100"
          r={R_OUTER}
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - shown)}
          // Bright while seating, then it settles back into the instrument.
          style={{ opacity: open ? 0.42 : shown === 0 ? 0 : 1 }}
        />
      </svg>

      <span className="tx-lock__emblem">
        <HeroSigil />
      </span>

      <span className="tx-lock__hint">{open ? openHint : hint}</span>
    </button>
  );
}
