import { useMemo, useState } from "react";
import { VTRS_CENTERS, VTRS_LINKS, CENTER_COLORS, type VtrsLink } from "./vtrs-data";

// The 32 Resonance Links — the symmetric network (4 × 8 = 32).
// 8 center nodes in a circle; 32 curved connections. A link is Active only when
// both endpoint codons are defined in a chart — here all are shown as latent
// architecture; hover/click reveals each link's identity.

const CX = 260;
const CY = 260;
const NODE_R = 190;

const CIRCUIT_TYPES = [
  "Inspirational",
  "Somatic",
  "Expressive",
  "Identity",
  "Emotional",
  "Survival",
  "Storage",
] as const;

const CIRCUIT_COLORS: Record<string, string> = {
  Inspirational: "#6fb7c7",
  Somatic: "#cf9b44",
  Expressive: "#6db293",
  Identity: "#a35d8d",
  Emotional: "#b8434a",
  Survival: "#7a8c3d",
  Storage: "#8e44ad",
};

function nodePos(index: number) {
  const deg = (index * 360) / 8 - 90;
  const rad = (deg * Math.PI) / 180;
  return { x: CX + NODE_R * Math.cos(rad), y: CY + NODE_R * Math.sin(rad) };
}

export function LinksModule() {
  const [selected, setSelected] = useState<VtrsLink | null>(null);
  const [filter, setFilter] = useState<string | null>(null);

  const centerIndex = useMemo(() => {
    const map: Record<string, number> = {};
    VTRS_CENTERS.forEach((c, i) => (map[c.id] = i));
    return map;
  }, []);

  // Group links by center-pair so parallel links get distinct curve offsets.
  const linkPaths = useMemo(() => {
    const pairCount: Record<string, number> = {};
    return VTRS_LINKS.map(link => {
      const ia = centerIndex[link.centerA];
      const ib = centerIndex[link.centerB];
      const a = nodePos(ia);
      const b = nodePos(ib);
      const pairKey = [link.centerA, link.centerB].sort().join("-");
      const nth = pairCount[pairKey] ?? 0;
      pairCount[pairKey] = nth + 1;

      // Curve control point: midpoint pushed toward the circle center,
      // offset per parallel link so they fan out.
      const mx = (a.x + b.x) / 2;
      const my = (a.y + b.y) / 2;
      const towardCenter = 0.35 + nth * 0.14;
      const cx = mx + (CX - mx) * towardCenter;
      const cy = my + (CY - my) * towardCenter;

      return { link, d: `M ${a.x} ${a.y} Q ${cx} ${cy} ${b.x} ${b.y}` };
    });
  }, [centerIndex]);

  return (
    <div className="vtrs-module">
      <header className="vtrs-module__head">
        <span className="vtrs-module__eyebrow">MODULE 05 · SYMMETRIC NETWORK</span>
        <h2 className="vtrs-module__title">The 32 Resonance Links</h2>
        <p className="vtrs-module__lede">
          Exactly 32 links (4 × 8) wire the eight centers together. A link is Active only when
          both endpoint codons are defined in the chart — otherwise it stays latent.
        </p>
      </header>

      {/* Circuit filter chips */}
      <div className="links-filters">
        {CIRCUIT_TYPES.map(ct => (
          <button
            key={ct}
            type="button"
            className={`links-filter-chip ${filter === ct ? "is-active" : ""}`}
            style={filter === ct ? { borderColor: CIRCUIT_COLORS[ct], color: CIRCUIT_COLORS[ct] } : undefined}
            onClick={() => setFilter(filter === ct ? null : ct)}
          >
            {ct.toUpperCase()}
          </button>
        ))}
        <span className="links-counter">32 LINKS · 4 × 8 SYMMETRY</span>
      </div>

      <div className="links-stage">
        <svg viewBox="0 0 520 520" className="links-svg">
          {/* Link curves */}
          {linkPaths.map(({ link, d }) => {
            const dimmed = filter !== null && link.circuit !== filter;
            const isSel = selected?.id === link.id;
            return (
              <path
                key={link.id}
                d={d}
                fill="none"
                stroke={isSel ? "#6fb7c7" : CIRCUIT_COLORS[link.circuit]}
                strokeWidth={isSel ? 2.5 : 1.2}
                opacity={dimmed ? 0.08 : isSel ? 1 : 0.45}
                style={{ cursor: "pointer", transition: "opacity 0.25s ease, stroke-width 0.2s ease" }}
                onClick={() => setSelected(isSel ? null : link)}
              />
            );
          })}

          {/* Center nodes */}
          {VTRS_CENTERS.map((center, i) => {
            const p = nodePos(i);
            const color = CENTER_COLORS[center.id];
            const labelR = NODE_R + 34;
            const deg = (i * 360) / 8 - 90;
            const rad = (deg * Math.PI) / 180;
            const lx = CX + labelR * Math.cos(rad);
            const ly = CY + labelR * Math.sin(rad);
            return (
              <g key={center.id}>
                <circle cx={p.x} cy={p.y} r="22" fill="rgba(8,7,11,0.92)" stroke={color} strokeWidth="1.5" />
                <text x={p.x} y={p.y + 4} textAnchor="middle" className="links-node-roman" fill={color}>
                  {center.roman}
                </text>
                <text x={lx} y={ly + 3} textAnchor="middle" className="links-node-label">
                  {center.id.toUpperCase()}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Detail panel for selected link */}
        <div className="links-detail">
          {selected ? (
            <>
              <span className="links-detail__id" style={{ color: CIRCUIT_COLORS[selected.circuit] }}>
                {selected.id} · {selected.circuit.toUpperCase()} CIRCUIT
              </span>
              <h3 className="links-detail__name">{selected.name}</h3>
              <div className="links-detail__codons">
                RC{String(selected.codonA).padStart(2, "0")} ({selected.centerA}) ↔ RC
                {String(selected.codonB).padStart(2, "0")} ({selected.centerB})
              </div>
              <p className="links-detail__profile">{selected.profile}</p>
            </>
          ) : (
            <p className="links-detail__hint">
              SELECT A LINK — click any line to read its identity, endpoint codons, and circuit
              profile. Filter by circuit type above.
            </p>
          )}
        </div>
      </div>

      <div className="vtrs-captions">
        <p>
          <b>Active vs. Latent</b> — a link illuminates only when both endpoint codons are present
          in the unified chart, regardless of which layer (Personality or Design) supplies them.
        </p>
        <p>
          <b>Perfect symmetry</b> — the legacy asymmetric 36-channel graph is obsolete; the VTRS
          network is exactly 4 links per center on average, 32 in total.
        </p>
      </div>
    </div>
  );
}
