import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// VTRS v2.0 cold->warm design palette
const CENTER_COLORS: Record<string, string> = {
  Origin: "#527c8d",     // icy blue
  Mental: "#6db293",     // teal/green
  Collapse: "#68798e",   // slate
  Saturation: "#cf9b44", // gold/amber
  Bridge: "#a35d8d",     // magenta/rose
  Becoming: "#b8434a",   // crimson
  Return: "#7a8c3d",     // olive
  Omega: "#8e44ad",      // purple
};

const CODON_CENTER_MAP: Record<number, string> = {
  1: "Origin", 2: "Origin", 3: "Origin", 5: "Origin", 9: "Origin", 19: "Origin", 38: "Origin", 51: "Origin",
  4: "Mental", 11: "Mental", 17: "Mental", 23: "Mental", 24: "Mental", 43: "Mental", 61: "Mental", 63: "Mental",
  8: "Collapse", 12: "Collapse", 16: "Collapse", 20: "Collapse", 31: "Collapse", 33: "Collapse", 35: "Collapse", 56: "Collapse",
  14: "Saturation", 27: "Saturation", 29: "Saturation", 34: "Saturation", 42: "Saturation", 52: "Saturation", 53: "Saturation", 60: "Saturation",
  7: "Bridge", 10: "Bridge", 13: "Bridge", 15: "Bridge", 25: "Bridge", 46: "Bridge", 57: "Bridge", 59: "Bridge",
  6: "Becoming", 22: "Becoming", 30: "Becoming", 36: "Becoming", 37: "Becoming", 39: "Becoming", 41: "Becoming", 55: "Becoming",
  18: "Return", 28: "Return", 32: "Return", 44: "Return", 48: "Return", 49: "Return", 50: "Return", 58: "Return",
  21: "Omega", 26: "Omega", 40: "Omega", 45: "Omega", 47: "Omega", 54: "Omega", 62: "Omega", 64: "Omega",
};

// 16 Roles (TETRADS of 4 codons each)
export const ROLES = [
  { name: "Originator", roman: "I", range: "RC01–04", desc: "initiates structure from raw potential" },
  { name: "Resonator", roman: "II", range: "RC05–08", desc: "harmonizes rhythm, direction & contribution" },
  { name: "Articulator", roman: "III", range: "RC09–12", desc: "focuses, expresses & gives form to thought" },
  { name: "Cultivator", roman: "IV", range: "RC13–16", desc: "develops memory, skill, resources & refinement" },
  { name: "Clarifier", roman: "V", range: "RC17–20", desc: "evaluates, corrects, senses & brings presence" },
  { name: "Sovereign", roman: "VI", range: "RC21–24", desc: "commands, integrates, renews & stabilizes authority" },
  { name: "Guardian", roman: "VII", range: "RC25–28", desc: "protects spirit, care, purpose & moral direction" },
  { name: "Devotee", roman: "VIII", range: "RC29–32", desc: "commits energy, desire, leadership & continuity" },
  { name: "Transformer", roman: "IX", range: "RC33–36", desc: "metabolizes retreat, power, change & crisis" },
  { name: "Catalyst", roman: "X", range: "RC37–40", desc: "activates community, struggle, provocation & will" },
  { name: "Oracle", roman: "XI", range: "RC41–44", desc: "receives imagination, completion, insight & pattern" },
  { name: "Steward", roman: "XII", range: "RC45–48", desc: "manages resources, embodiment, realization & depth" },
  { name: "Reformer", roman: "XIII", range: "RC49–52", desc: "renews principles, values, shock & stillness" },
  { name: "Ascendant", roman: "XIV", range: "RC53–56", desc: "expands beginnings, ambition, abundance & story" },
  { name: "Navigator", roman: "XV", range: "RC57–60", desc: "guides intuition, joy, union & limitation" },
  { name: "Illuminator", roman: "XVI", range: "RC61–64", desc: "reveals mystery, detail, doubt & archetypal memory" },
] as const;

export interface Codon {
  id: number;
  code: string;
  name: string;
  traditional_name: string;
  binary: string;
  chemical_marker: string;
  archetype_role: string;
  somatic_marker: string;
}

export interface CodonWheelProps {
  codons: Codon[];
  selectedId: number;
  onSelect: (id: number) => void;
  activations?: Set<number>;
  activeRoleIdx?: number | null;
}

const CX = 380;
const CY = 380;
const RING = 290;

function pol(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Generate SVG path for a sector wedge
function getSectorPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number) {
  const start = pol(cx, cy, r, startDeg);
  const end = pol(cx, cy, r, endDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return `M ${cx} ${cy} L ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y} Z`;
}

export function CodonWheel({
  codons,
  selectedId,
  onSelect,
  activations,
  activeRoleIdx,
}: CodonWheelProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const selectedCodon = useMemo(() => {
    return codons.find((c) => c.id === selectedId) || codons[0];
  }, [codons, selectedId]);

  const selectedRoleIdx = useMemo(() => {
    return Math.floor((selectedId - 1) / 4);
  }, [selectedId]);

  // Generate 16 role labels around the wheel
  const roleLabels = useMemo(() => {
    return ROLES.map((role, idx) => {
      const midAngle = idx * 22.5 + 11.25; // mid-angle of the 22.5° sector (360 / 16)
      // Place the label slightly further out (r=322) or inside (r=200)
      const pos = pol(CX, CY, 200, midAngle);
      const isSelected = selectedRoleIdx === idx;
      const isFiltered = activeRoleIdx !== null && activeRoleIdx !== undefined && activeRoleIdx === idx;
      return {
        ...role,
        idx,
        x: pos.x,
        y: pos.y,
        isSelected,
        isFiltered,
      };
    });
  }, [selectedRoleIdx, activeRoleIdx]);

  // Generate 16 divider lines radiating from center
  const dividers = useMemo(() => {
    return Array.from({ length: 16 }).map((_, idx) => {
      const angle = idx * 22.5;
      const inner = pol(CX, CY, 150, angle);
      const outer = pol(CX, CY, 350, angle);
      return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    });
  }, []);

  // Compute active wedge sector path
  const sectorPath = useMemo(() => {
    const roleIdx = activeRoleIdx !== null && activeRoleIdx !== undefined ? activeRoleIdx : selectedRoleIdx;
    const startDeg = roleIdx * 22.5;
    const endDeg = (roleIdx + 1) * 22.5;
    return getSectorPath(CX, CY, 350, startDeg, endDeg);
  }, [selectedRoleIdx, activeRoleIdx]);

  return (
    <div className="cz-wheel-container">
      <div className="cz-wheel-aspect">
        {/* Structural SVG Grid */}
        <svg viewBox="0 0 760 760" className="cz-wheel-svg">
          <defs>
            <radialGradient id="wheel-central-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="rgba(205,161,74,0.18)" />
              <stop offset="60%" stopColor="rgba(20,17,12,0.03)" />
              <stop offset="100%" stopColor="rgba(8,7,11,0)" />
            </radialGradient>
          </defs>

          {/* Central ambient glow */}
          <circle cx={CX} cy={CY} r="350" fill="url(#wheel-central-glow)" />

          {/* Guide Rings */}
          <g fill="none" stroke="var(--line)" strokeWidth="0.8">
            <circle cx={CX} cy={CY} r="350" />
            <circle cx={CX} cy={CY} r="244" />
            <circle cx={CX} cy={CY} r="150" stroke="rgba(205,161,74,0.28)" />
          </g>

          {/* Decorative spinning dotted outer ring */}
          <g className="cz-wheel-spin-slow" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <circle
              cx={CX}
              cy={CY}
              r="332"
              fill="none"
              stroke="rgba(205,161,74,0.18)"
              strokeWidth="0.8"
              strokeDasharray="1.5 12"
            />
          </g>

          {/* Role Sector Selection Wedge */}
          <path d={sectorPath} fill="rgba(205,161,74,0.04)" stroke="rgba(205,161,74,0.18)" strokeWidth="1" />

          {/* Role Divider lines */}
          {dividers.map((div, i) => (
            <line
              key={i}
              x1={div.x1}
              y1={div.y1}
              x2={div.x2}
              y2={div.y2}
              stroke="var(--line)"
              strokeWidth="0.8"
            />
          ))}
        </svg>

        {/* 16 Role Text Labels inside the SVG coordinates */}
        {roleLabels.map((r) => {
          const isDimmed = activeRoleIdx !== null && activeRoleIdx !== undefined && activeRoleIdx !== r.idx;
          return (
            <div
              key={r.idx}
              onClick={() => onSelect(r.idx * 4 + 1)}
              style={{
                position: "absolute",
                left: `${(r.x / 760) * 100}%`,
                top: `${(r.y / 760) * 100}%`,
                transform: "translate(-50%, -50%)",
                textAlign: "center",
                cursor: "pointer",
                width: 90,
                zIndex: 10,
                opacity: isDimmed ? 0.35 : 1,
                transition: "opacity 0.3s ease",
              }}
            >
              <span
                style={{
                  display: "block",
                  fontFamily: "var(--font-ritual)",
                  fontSize: "8.5px",
                  letterSpacing: "0.1em",
                  color: r.isSelected || r.isFiltered ? "var(--gold2)" : "var(--mut)",
                  textShadow: r.isSelected || r.isFiltered ? "0 0 10px rgba(232,196,119,0.3)" : "none",
                }}
              >
                {r.roman}
              </span>
              <span
                style={{
                  display: "block",
                  fontSize: "12.5px",
                  fontFamily: "var(--font-display)",
                  letterSpacing: "0.02em",
                  color: r.isSelected || r.isFiltered ? "#fff7e6" : "rgba(232, 228, 220, 0.62)",
                  lineHeight: 1.05,
                  marginTop: "2px",
                }}
              >
                {r.name.toUpperCase()}
              </span>
            </div>
          );
        })}

        {/* 64 Codon Nodes (drawn as absolute divs layered over the SVG) */}
        {codons.map((c) => {
          const isSel = c.id === selectedId;
          const roleIdx = Math.floor((c.id - 1) / 4);
          const inRole = roleIdx === selectedRoleIdx || (activeRoleIdx !== null && activeRoleIdx !== undefined && roleIdx === activeRoleIdx);
          
          const centerName = CODON_CENTER_MAP[c.id] || "Origin";
          const centerColor = CENTER_COLORS[centerName] || "#bda36b";

          // Activations glow (for personal profile integration)
          const isActivated = activations?.has(c.id);

          // Dim others when hovering or filtering
          const isHovered = hoveredId === c.id;
          const hasFilter = activeRoleIdx !== null && activeRoleIdx !== undefined;
          const dim = (hoveredId !== null || hasFilter) && !isSel && !inRole && !isHovered;

          // Compute absolute position
          const deg = (c.id - 0.5) * 5.625;
          const pos = pol(CX, CY, RING, deg);

          const size = isSel ? 56 : isHovered ? 48 : 40;

          return (
            <motion.div
              key={c.id}
              onClick={() => onSelect(c.id)}
              onMouseEnter={() => setHoveredId(c.id)}
              onMouseLeave={() => setHoveredId(null)}
              title={`${c.code} · ${c.name}`}
              className={`cz-wheel-node ${isSel ? "is-selected" : ""} ${isActivated ? "is-activated" : ""}`}
              style={{
                position: "absolute",
                left: `${(pos.x / 760) * 100}%`,
                top: `${(pos.y / 760) * 100}%`,
                width: size,
                height: size,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                overflow: "hidden",
                cursor: "pointer",
                border: isSel ? `2px solid ${centerColor}` : `1px solid ${dim ? "rgba(205,161,74,0.1)" : "rgba(205,161,74,0.22)"}`,
                boxShadow: isSel
                  ? `0 0 16px ${centerColor}`
                  : isHovered
                  ? `0 0 10px rgba(205, 161, 74, 0.3)`
                  : isActivated
                  ? "0 0 12px rgba(246,176,94,0.5)"
                  : "none",
                opacity: dim ? 0.28 : 1,
                zIndex: isSel ? 8 : inRole ? 5 : 3,
                background: "rgba(8, 7, 11, 0.9)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "opacity 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
              }}
              layoutId={undefined}
            >
              <img
                src={`/symbols/${c.code}.png`}
                alt={c.code}
                style={{
                  width: "116%",
                  height: "116%",
                  objectFit: "cover",
                  transform: "translate(0%, 0%)",
                }}
              />
            </motion.div>
          );
        })}

        {/* Center Hub */}
        <div className="cz-wheel-hub">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedCodon.id}
              initial={{ scale: 0.9, opacity: 0, filter: "blur(8px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.05, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                pointerEvents: "none",
              }}
            >
              <div
                style={{
                  width: 90,
                  height: 90,
                  borderRadius: "50%",
                  overflow: "hidden",
                  border: `1.5px solid ${CENTER_COLORS[CODON_CENTER_MAP[selectedCodon.id] || "Origin"]}`,
                  boxShadow: `0 0 24px ${CENTER_COLORS[CODON_CENTER_MAP[selectedCodon.id] || "Origin"]}4d`,
                  background: "rgba(8, 7, 11, 0.75)",
                }}
              >
                <img
                  src={`/symbols/${selectedCodon.code}.png`}
                  alt={selectedCodon.code}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.22em",
                  color: "var(--gold)",
                  marginTop: 10,
                }}
              >
                {selectedCodon.code}
              </span>
              <span
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 22,
                  letterSpacing: "0.06em",
                  color: "var(--ink)",
                  lineHeight: 1.05,
                  marginTop: 2,
                }}
              >
                {selectedCodon.name}
              </span>
              <span
                style={{
                  fontStyle: "italic",
                  fontSize: 12,
                  color: "var(--mut)",
                  fontFamily: "var(--font-voice, serif)",
                  marginTop: 1,
                }}
              >
                {ROLES[selectedRoleIdx]?.name}
              </span>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <style>{`
        .cz-wheel-container {
          position: relative;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }
        .cz-wheel-aspect {
          position: relative;
          width: 100%;
          aspect-ratio: 1;
        }
        .cz-wheel-svg {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: visible;
        }
        .cz-wheel-spin-slow {
          animation: cwSpin 120s linear infinite;
        }
        @keyframes cwSpin {
          to { transform: rotate(360deg); }
        }
        .cz-wheel-hub {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 190px;
          height: 190px;
          display: flex;
          align-items: center;
          justify-content: center;
          pointer-events: none;
          z-index: 10;
        }
        @media (prefers-reduced-motion: reduce) {
          .cz-wheel-spin-slow {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
