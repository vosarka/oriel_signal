import React from "react";

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

// Center layout coordinates and matching shapes on a 100x100 grid
const CENTER_SHAPES: Record<
  string,
  {
    x: number;
    y: number;
    render: (defined: boolean, glowId: string) => React.ReactNode;
  }
> = {
  Crown: {
    x: 50,
    y: 8,
    render: (defined, glowId) => (
      <polygon
        points="50,5 45.5,11.5 54.5,11.5"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  Ajna: {
    x: 50,
    y: 20,
    render: (defined, glowId) => (
      <polygon
        points="50,23.5 45.5,17 54.5,17"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  Throat: {
    x: 50,
    y: 33,
    render: (defined, glowId) => (
      <rect
        x="47.25"
        y="30.25"
        width="5.5"
        height="5.5"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  "G-Self": {
    x: 50,
    y: 48,
    render: (defined, glowId) => (
      <polygon
        points="50,44.25 53.75,48 50,51.75 46.25,48"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  Heart: {
    x: 68,
    y: 52,
    render: (defined, glowId) => (
      <polygon
        points="65.25,52 70.75,49.25 70.75,54.75"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  Spleen: {
    x: 30,
    y: 66,
    render: (defined, glowId) => (
      <polygon
        points="33.125,66 26.875,62 26.875,70"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  "Solar Plexus": {
    x: 70,
    y: 66,
    render: (defined, glowId) => (
      <polygon
        points="66.875,66 73.125,62 73.125,70"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  Sacral: {
    x: 50,
    y: 75,
    render: (defined, glowId) => (
      <rect
        x="47"
        y="72"
        width="6"
        height="6"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
  Root: {
    x: 50,
    y: 90,
    render: (defined, glowId) => (
      <rect
        x="46.75"
        y="86.75"
        width="6.5"
        height="6.5"
        fill={defined ? "url(#bodygraph-gold-grad)" : "rgba(20, 20, 28, 0.4)"}
        stroke={defined ? "#FFF1C2" : "rgba(212, 175, 55, 0.22)"}
        strokeWidth={defined ? "1.2" : "0.7"}
        filter={defined ? `url(#${glowId})` : undefined}
        style={{ transition: "all 0.5s ease" }}
      />
    ),
  },
};

const CENTER_CONNECTIONS: Array<[string, string]> = [
  ["Crown", "Ajna"],
  ["Ajna", "Throat"],
  ["Throat", "G-Self"],
  ["Throat", "Solar Plexus"],
  ["Throat", "Heart"],
  ["Throat", "Spleen"],
  ["G-Self", "Sacral"],
  ["G-Self", "Spleen"],
  ["Heart", "Spleen"],
  ["Heart", "Solar Plexus"],
  ["Spleen", "Sacral"],
  ["Sacral", "Root"],
  ["Solar Plexus", "Root"],
  ["G-Self", "Heart"],
];

export default function ResonanceBodygraph({
  centers,
  channels = [],
  className = "",
}: ResonanceBodygraphProps) {
  const centerMap = React.useMemo(
    () => new Map(centers.map(c => [c.id, c])),
    [centers]
  );

  // Determine which paths/channels are active based on the channels array
  const activeChannelsMap = React.useMemo(() => {
    const map = new Map<string, boolean>();
    for (const channel of channels) {
      if (channel.active) {
        const key1 = `${channel.centerA}-${channel.centerB}`;
        const key2 = `${channel.centerB}-${channel.centerA}`;
        map.set(key1, true);
        map.set(key2, true);
      }
    }
    return map;
  }, [channels]);

  const glowFilterId = "bodygraph-gold-glow";

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      style={{ width: "100%", height: "auto" }}
    >
      <defs>
        {/* Radial Gold Gradient for defined centers */}
        <radialGradient id="bodygraph-gold-grad" cx="35%" cy="35%" r="65%">
          <stop offset="0%" stopColor="#FFF1C2" />
          <stop offset="60%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#bda36b" />
        </radialGradient>

        {/* Drop shadow / glow filter for defined shapes */}
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

      {/* 1. Meditating Human Silhouette Outline */}
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

      {/* 2. Conduit Channel Links (Double-lined connections) */}
      {CENTER_CONNECTIONS.map(([fromId, toId], idx) => {
        const fromPos = CENTER_SHAPES[fromId];
        const toPos = CENTER_SHAPES[toId];
        if (!fromPos || !toPos) return null;

        const isChannelActive = activeChannelsMap.has(`${fromId}-${toId}`);

        return (
          <g key={`chan-${idx}`}>
            {/* Base double line casing */}
            <line
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="rgba(212, 175, 55, 0.12)"
              strokeWidth="1.6"
            />
            <line
              x1={fromPos.x}
              y1={fromPos.y}
              x2={toPos.x}
              y2={toPos.y}
              stroke="#0a0a0e"
              strokeWidth="0.8"
            />

            {/* Active glowing connection overlay */}
            {isChannelActive && (
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
            )}
          </g>
        );
      })}

      {/* 3. Center Nodes (shapes rendering above channels) */}
      {Object.entries(CENTER_SHAPES).map(([id, layout]) => {
        const centerData = centerMap.get(id);
        const defined = Boolean(centerData?.defined);
        return (
          <g key={`shape-${id}`}>{layout.render(defined, glowFilterId)}</g>
        );
      })}
    </svg>
  );
}
