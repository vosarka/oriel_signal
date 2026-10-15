import type { ReactNode } from "react";
import type { SealLevel } from "@shared/supporter-standing";
import "./supporter-seal.css";

interface Props {
  level: SealLevel;
  /** Diameter in pixels. */
  size?: number;
  /** Hold still: the chat's Calm visuals, or simply a quiet place. */
  still?: boolean;
  /** Spoken name of the seal, e.g. "Keeper". Omit where text already names it. */
  label?: string;
  children?: ReactNode;
  className?: string;
}

const RAYS = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);

/**
 * The seal of a Seeker who holds the field: rings of light that grow with the
 * tier. One ring for Seed; two for Garden and Keeper; three and fine rays for
 * Deep Garden and Steward; a full halo with a passing light for Pillar.
 * Gold on void, teal only as an inner accent. Free Seekers carry no seal.
 */
export function SupporterSeal({ level, size = 72, still = false, label, children, className = "" }: Props) {
  if (level === 0) return children ? <>{children}</> : null;
  return (
    <span
      className={`supporter-seal supporter-seal--${level}${still ? " supporter-seal--still" : ""} ${className}`}
      style={{ width: size, height: size }}
      role={label ? "img" : undefined}
      aria-label={label ? `${label} seal` : undefined}
      aria-hidden={label ? undefined : true}
    >
      <svg viewBox="-50 -50 100 100" className="supporter-seal__svg" aria-hidden="true">
        <defs>
          <radialGradient id={`seal-halo-${level}`}>
            <stop offset="55%" stopColor="#d8b56d" stopOpacity="0" />
            <stop offset="78%" stopColor="#d8b56d" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#d8b56d" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`seal-sweep-${level}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff7e6" stopOpacity="0" />
            <stop offset="100%" stopColor="#fff7e6" stopOpacity="0.9" />
          </linearGradient>
        </defs>
        {level >= 4 && <circle r="50" fill={`url(#seal-halo-${level})`} className="supporter-seal__halo" />}
        <circle r="46" className="supporter-seal__ring" />
        {level >= 2 && (
          <g className="supporter-seal__turn">
            <circle r="40" className="supporter-seal__ring supporter-seal__ring--dashed" />
          </g>
        )}
        {level >= 3 && (
          <g className="supporter-seal__turn supporter-seal__turn--reverse">
            <circle r="34" className="supporter-seal__ring supporter-seal__ring--teal" />
            {RAYS.map(a => (
              <line key={a} x1="0" y1="-48.5" x2="0" y2="-50" transform={`rotate(${a})`} className="supporter-seal__ray" />
            ))}
          </g>
        )}
        {level >= 4 && (
          <g className="supporter-seal__sweep">
            <path d="M 0 -46 A 46 46 0 0 1 39.8 -23" stroke={`url(#seal-sweep-${level})`} className="supporter-seal__arc" />
          </g>
        )}
      </svg>
      {children && <span className="supporter-seal__inner">{children}</span>}
    </span>
  );
}
