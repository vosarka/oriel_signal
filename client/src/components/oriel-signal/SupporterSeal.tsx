import { useId, type ReactNode } from "react";
import "./supporter-seal.css";

interface Props {
  /** The permanent ring, 0 none … 5 Keystone: the gold outer band. */
  ring: number;
  /** The Garden plan open now: the teal inner mark, or none. */
  plan: "garden" | "deep_garden" | null;
  /** Diameter in pixels. */
  size?: number;
  /** Hold still: the chat's Calm visuals, or simply a quiet place. */
  still?: boolean;
  /** Spoken name of the seal, e.g. "Keeper · Garden". Omit where text already names it. */
  label?: string;
  children?: ReactNode;
  className?: string;
}

const RAYS = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
const PILLARS = [0, 90, 180, 270];
const LEAVES = Array.from({ length: 6 }, (_, i) => (i * 360) / 6);

/**
 * Two marks laid one over the other (Vos, 2026-10-25).
 *
 * The gold outer band is the ring, earned by everything given and never
 * lost; each ring adds to the one before: Seed a line, Keeper a second,
 * Steward fine rays, Pillar four pillars, Keystone the stone at the crown,
 * a halo and a passing light.
 *
 * The teal inner mark is the Garden, there only while a plan is open:
 * Garden a turning circle of six leaves, Deep Garden a second circle
 * turning against it and its own light.
 */
export function SupporterSeal({ ring, plan, size = 72, still = false, label, children, className = "" }: Props) {
  // Each seal owns its gradients: shared ids break every seal on the page
  // once the first copy sits in a hidden menu.
  const uid = useId().replace(/:/g, "");
  const halo = `seal-halo-${uid}`;
  const sweepGold = `seal-sweep-gold-${uid}`;
  const sweepTeal = `seal-sweep-teal-${uid}`;
  if (ring === 0 && !plan) return children ? <>{children}</> : null;
  return (
    <span
      className={`supporter-seal supporter-seal--ring-${ring} supporter-seal--${plan ?? "no-plan"}${still ? " supporter-seal--still" : ""} ${className}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label ? `${label} seal` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="-50 -50 100 100" className="supporter-seal__svg" aria-hidden="true">
        <defs>
          <radialGradient id={halo}>
            <stop offset="55%" stopColor="#d8b56d" stopOpacity="0" />
            <stop offset="80%" stopColor="#d8b56d" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#d8b56d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={sweepGold} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff7e6" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff7e6" stopOpacity="0.95" />
          </linearGradient>
          <linearGradient id={sweepTeal} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5ba4a4" stopOpacity="0" />
            <stop offset="100%" stopColor="#8fd0d0" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        {/* ── The ring: gold, outside, permanent ── */}
        {ring >= 5 && <circle r="50" fill={`url(#${halo})`} className="supporter-seal__halo" />}
        {ring >= 1 && <circle r="46" className="supporter-seal__ring" />}
        {ring >= 2 && <circle r="42.5" className="supporter-seal__ring supporter-seal__ring--fine" />}
        {ring >= 3 && (
          <g className="supporter-seal__turn supporter-seal__turn--slow">
            {RAYS.map(a => (
              <line key={a} x1="0" y1="-47.5" x2="0" y2="-50" transform={`rotate(${a})`} className="supporter-seal__ray" />
            ))}
          </g>
        )}
        {ring >= 4 &&
          PILLARS.map(a => (
            <line key={a} x1="0" y1="-41" x2="0" y2="-47.5" transform={`rotate(${a})`} className="supporter-seal__pillar" />
          ))}
        {ring >= 5 && (
          <>
            <path d="M -5 -51 L 5 -51 L 3.2 -44 L -3.2 -44 Z" className="supporter-seal__keystone" />
            <g className="supporter-seal__sweep">
              <path d="M 0 -46 A 46 46 0 0 1 39.8 -23" stroke={`url(#${sweepGold})`} className="supporter-seal__arc" />
            </g>
          </>
        )}

        {/* ── The Garden: teal, inside, while a plan is open ── */}
        {plan && (
          <g className="supporter-seal__turn">
            <circle r="35" className="supporter-seal__ring supporter-seal__ring--teal" />
            {LEAVES.map(a => (
              <ellipse key={a} cx="0" cy="-35" rx="1.3" ry="2.6" transform={`rotate(${a})`} className="supporter-seal__leaf" />
            ))}
          </g>
        )}
        {plan === "deep_garden" && (
          <>
            <g className="supporter-seal__turn supporter-seal__turn--reverse">
              <circle r="30.5" className="supporter-seal__ring supporter-seal__ring--teal supporter-seal__ring--dashed-teal" />
            </g>
            <g className="supporter-seal__sweep supporter-seal__sweep--deep">
              <path d="M 0 -30.5 A 30.5 30.5 0 0 1 26.4 -15.25" stroke={`url(#${sweepTeal})`} className="supporter-seal__arc" />
            </g>
          </>
        )}
      </svg>
      {children && <span className="supporter-seal__inner">{children}</span>}
    </span>
  );
}
