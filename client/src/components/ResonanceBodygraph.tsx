import React from "react";
import {
  CENTER_COLORS,
  VTRS_CENTERS,
  VTRS_LINKS,
} from "@/components/oriel-signal/vtrs/vtrs-data";
import { VTRS_BODY_ORDER, VTRS_SVG_LAYOUT } from "@/lib/vtrs-body-layout";

export interface CenterEntry {
  id: string;
  centerName: string;
  codon256Id: string;
  frequency: number;
  defined: boolean;
}

export interface ChannelEntry {
  gateA: number;
  gateB: number;
  active: boolean;
  centerA: string;
  centerB: string;
}

interface ResonanceBodygraphProps {
  centers: CenterEntry[];
  channels?: ChannelEntry[];
  className?: string;
}

function pairKey(centerA: string, centerB: string) {
  return [centerA, centerB].sort().join("|");
}

const UNIQUE_PAIRS = (() => {
  const seen = new Set<string>();
  const pairs: Array<{ centerA: string; centerB: string; selfLoop: boolean }> =
    [];
  for (const link of VTRS_LINKS) {
    const key =
      link.centerA === link.centerB
        ? `self:${link.centerA}`
        : pairKey(link.centerA, link.centerB);
    if (seen.has(key)) continue;
    seen.add(key);
    pairs.push({
      centerA: link.centerA,
      centerB: link.centerB,
      selfLoop: link.centerA === link.centerB,
    });
  }
  return pairs;
})();

export default function ResonanceBodygraph({
  centers,
  channels = [],
  className = "",
}: ResonanceBodygraphProps) {
  const centerMap = React.useMemo(
    () => new Map(centers.map(center => [center.id, center])),
    [centers]
  );

  const activePairs = React.useMemo(() => {
    const map = new Set<string>();
    for (const channel of channels) {
      if (!channel.active) continue;
      map.add(pairKey(channel.centerA, channel.centerB));
    }
    return map;
  }, [channels]);

  const glowFilterId = "bodygraph-gold-glow";

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ width: "100%", height: "auto" }}
      role="img"
      aria-label="Eight VTRS centers resonance map"
    >
      <defs>
        <radialGradient id="bodygraph-gold-grad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF1C2" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#bda36b" />
        </radialGradient>
        <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feComponentTransfer in="blur" result="glow">
            <feFuncA type="linear" slope="0.5" />
          </feComponentTransfer>
          <feMerge>
            <feMergeNode in="glow" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="channel-glow" x="-10%" y="-10%" width="120%" height="120%">
          <feGaussianBlur stdDeviation="0.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <line
        x1={VTRS_SVG_LAYOUT.Origin.x}
        y1={VTRS_SVG_LAYOUT.Origin.y}
        x2={VTRS_SVG_LAYOUT.Saturation.x}
        y2={VTRS_SVG_LAYOUT.Saturation.y}
        stroke="rgba(212, 175, 55, 0.12)"
        strokeWidth="0.5"
        strokeDasharray="1.2 1.8"
      />

      <path
        d="M 50 3
           C 43.5 3, 41.5 8, 41.5 12
           C 41.5 16, 44 19, 44 23
           C 44 25.5, 38 28.5, 32 31.5
           C 26 34.5, 23.5 38.5, 23.5 44.5
           C 23.5 50.5, 27.5 54.5, 29.5 56.5
           C 25.5 59.5, 15.5 72.5, 15.5 80.5
           C 15.5 88.5, 24.5 92.5, 50 92.5
           C 75.5 92.5, 84.5 88.5, 84.5 80.5
           C 84.5 72.5, 74.5 59.5, 70.5 56.5
           C 72.5 54.5, 76.5 50.5, 76.5 44.5
           C 76.5 38.5, 74 34.5, 68 31.5
           C 62 28.5, 56 25.5, 56 23
           C 56 19, 58.5 16, 58.5 12
           C 58.5 8, 56.5 3, 50 3 Z"
        fill="rgba(20, 20, 28, 0.2)"
        stroke="rgba(212, 175, 55, 0.08)"
        strokeWidth="0.8"
        strokeLinecap="round"
      />

      {UNIQUE_PAIRS.map((pair, idx) => {
        const fromPos = VTRS_SVG_LAYOUT[pair.centerA];
        const toPos = VTRS_SVG_LAYOUT[pair.centerB];
        if (!fromPos || !toPos) return null;

        if (pair.selfLoop) {
          const active = activePairs.has(pairKey(pair.centerA, pair.centerB));
          return (
            <path
              key={`loop-${idx}`}
              d={`M ${fromPos.x - 2} ${fromPos.y - 3} A 3 3 0 1 1 ${fromPos.x + 2} ${fromPos.y - 3}`}
              fill="none"
              stroke={active ? "#D4AF37" : "rgba(212, 175, 55, 0.14)"}
              strokeWidth={active ? 0.9 : 0.6}
            />
          );
        }

        const active = activePairs.has(pairKey(pair.centerA, pair.centerB));
        return (
          <g key={`chan-${idx}`}>
            <line
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="rgba(212, 175, 55, 0.12)"
              strokeWidth="1.4"
            />
            {active ? (
              <line
                x1={fromPos.x}
                y1={fromPos.y}
                x2={toPos.x}
                y2={toPos.y}
                stroke="#D4AF37"
                strokeWidth="0.85"
                filter="url(#channel-glow)"
                opacity="0.85"
              />
            ) : null}
          </g>
        );
      })}

      {VTRS_BODY_ORDER.map(centerId => {
        const layout = VTRS_SVG_LAYOUT[centerId];
        if (!layout) return null;
        const centerData = centerMap.get(centerId);
        const defined = Boolean(centerData?.defined);
        const color = CENTER_COLORS[centerId] ?? "#bda36b";
        const roman =
          VTRS_CENTERS.find(center => center.id === centerId)?.roman ?? "";
        return (
          <g key={centerId}>
            <circle
              cx={layout.x}
              cy={layout.y}
              r={defined ? 3.1 : 2.4}
              fill={defined ? color : "rgba(20, 20, 28, 0.45)"}
              stroke={defined ? "#FFF1C2" : `${color}aa`}
              strokeWidth={defined ? 1.2 : 0.8}
              filter={defined ? `url(#${glowFilterId})` : undefined}
            />
            {defined ? (
              <circle
                cx={layout.x}
                cy={layout.y}
                r={1}
                fill="rgba(255, 248, 230, 0.92)"
              />
            ) : null}
            <text
              x={layout.x}
              y={layout.y - 4.2}
              textAnchor="middle"
              fill={defined ? color : "rgba(154,150,142,0.65)"}
              fontSize="2.6"
              fontFamily="'IBM Plex Mono', ui-monospace, monospace"
            >
              {roman}
            </text>
          </g>
        );
      })}
    </svg>
  );
}