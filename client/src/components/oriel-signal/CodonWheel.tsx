import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

// Muted jewel-tone palette, 8 Tetradic centers
export const CENTER_COLORS: Record<string, string> = {
  Origin: "#3f8a80",     // dusty teal
  Mental: "#7c8f52",     // sage olive
  Collapse: "#5f7a94",   // slate blue
  Saturation: "#c9a24a", // gold
  Bridge: "#a56b8a",     // dusty rose/mauve
  Becoming: "#bd7a4e",   // terracotta
  Return: "#3d6e63",     // deep teal-green
  Omega: "#8a6bab",      // violet
};

export const CODON_CENTER_MAP: Record<number, string> = {
  1: "Origin", 2: "Origin", 3: "Origin", 5: "Origin", 9: "Origin", 19: "Origin", 38: "Origin", 51: "Origin",
  4: "Mental", 11: "Mental", 17: "Mental", 23: "Mental", 24: "Mental", 43: "Mental", 61: "Mental", 63: "Mental",
  8: "Collapse", 12: "Collapse", 16: "Collapse", 20: "Collapse", 31: "Collapse", 33: "Collapse", 35: "Collapse", 56: "Collapse",
  14: "Saturation", 27: "Saturation", 29: "Saturation", 34: "Saturation", 42: "Saturation", 52: "Saturation", 53: "Saturation", 60: "Saturation",
  7: "Bridge", 10: "Bridge", 13: "Bridge", 15: "Bridge", 25: "Bridge", 46: "Bridge", 57: "Bridge", 59: "Bridge",
  6: "Becoming", 22: "Becoming", 30: "Becoming", 36: "Becoming", 37: "Becoming", 39: "Becoming", 41: "Becoming", 55: "Becoming",
  18: "Return", 28: "Return", 32: "Return", 44: "Return", 48: "Return", 49: "Return", 50: "Return", 58: "Return",
  21: "Omega", 26: "Omega", 40: "Omega", 45: "Omega", 47: "Omega", 54: "Omega", 62: "Omega", 64: "Omega",
};

// The 64 Codon numbers in canonical Mandala wheel order (4 quadrants of 16).
// Mirrors server/vrc-mandala.ts's VRC_MANDALA — that file is the source of
// truth; this client copy exists only because the client bundle can't import
// server/ code directly.
export const VRC_MANDALA: readonly number[] = [
  51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39,
  53, 62, 56, 31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48,
  57, 32, 50, 28, 44, 1, 43, 14, 34, 9, 5, 26, 11, 10, 58, 38,
  54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22, 36, 25, 17, 21,
];

// Reverse lookup: codon number → its slot index (0–63) in Mandala wheel order.
const CODON_SLOT: Record<number, number> = {};
VRC_MANDALA.forEach((codon, slot) => {
  CODON_SLOT[codon] = slot;
});

// 4 quadrants of 16 slots (90° each), in wheel order starting at slot 0.
const QUADRANTS = [
  { name: "INITIATION", startSlot: 0 },
  { name: "CIVILIZATION", startSlot: 16 },
  { name: "DUALITY", startSlot: 32 },
  { name: "MUTATION", startSlot: 48 },
] as const;

// 8 Tetradic Centers, each governing 8 codons
export const CENTERS = [
  { name: "Origin", desc: "the initiating pressure beneath all form" },
  { name: "Mental", desc: "recursive pattern-recognition and logic" },
  { name: "Collapse", desc: "expressive release; verbal dissipation" },
  { name: "Saturation", desc: "somatic vitality and energy generation" },
  { name: "Bridge", desc: "identity, alchemy, and self-consciousness" },
  { name: "Becoming", desc: "emotional resonance and future orientation" },
  { name: "Return", desc: "instinctive correction and survival" },
  { name: "Omega", desc: "unified will and integrative synthesis" },
] as const;

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

// One glyph per role, in role order (role 1 → ROLE01.svg, etc.)
export const ROLE_VECTORS = Array.from(
  { length: 16 },
  (_, i) => `/vectors/ROLE${String(i + 1).padStart(2, "0")}.svg`
);

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
  activeCenter?: string | null;
  // Fired when the user clicks the empty area outside the wheel — clears
  // active center/role filters.
  onDeselect?: () => void;
}

const CX = 380;
const CY = 380;
// The colored codon arc (outer band).
const WEDGE_OUTER = 344;
const WEDGE_INNER = 252;
// A separate band *below* the colored arcs. Every segment shows the sigil of
// the Center that codon belongs to here — its own dedicated space, not painted
// on top of the codon color.
const CENTER_BAND_OUTER = 248;
const CENTER_BAND_INNER = 206;

// Each Tetradic Center's sigil (art in /public/9-centers), keyed by Center name
// so the wheel's center band and the left sidebar both draw the same symbol.
export const CENTER_SYMBOL: Record<string, string> = {
  Origin: "1AXIS",
  Mental: "2CORE",
  Collapse: "3PULSE",
  Saturation: "4NEXUX",
  Bridge: "5PRISM",
  Becoming: "6LOOM",
  Return: "7HORIZON",
  Omega: "8HELIX",
};

function pol(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

// Generate SVG path for a single codon's annular (donut) wedge — the colored
// ring segment a codon glyph sits inside of.
function getAnnularSectorPath(
  cx: number,
  cy: number,
  rOuter: number,
  rInner: number,
  startDeg: number,
  endDeg: number
) {
  const outerStart = pol(cx, cy, rOuter, startDeg);
  const outerEnd = pol(cx, cy, rOuter, endDeg);
  const innerEnd = pol(cx, cy, rInner, endDeg);
  const innerStart = pol(cx, cy, rInner, startDeg);
  const largeArc = endDeg - startDeg <= 180 ? 0 : 1;
  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerEnd.x} ${innerEnd.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

// Arc path for a curved role label. Traversal direction is reversed on the
// bottom half of the wheel so the text still reads left-to-right upright
// instead of appearing mirrored/upside-down.
function labelArcPath(cx: number, cy: number, r: number, midAngle: number, halfSpan: number) {
  const flip = midAngle > 90 && midAngle < 270;
  const a0 = flip ? midAngle + halfSpan : midAngle - halfSpan;
  const a1 = flip ? midAngle - halfSpan : midAngle + halfSpan;
  const p0 = pol(cx, cy, r, a0);
  const p1 = pol(cx, cy, r, a1);
  const sweep = flip ? 0 : 1;
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${sweep} ${p1.x} ${p1.y}`;
}

export function CodonWheel({
  codons,
  selectedId,
  onSelect,
  activations,
  activeRoleIdx,
  activeCenter,
  onDeselect,
}: CodonWheelProps) {
  const [hoveredId, setHoveredId] = useState<number | null>(null);

  const selectedCodon = useMemo(() => {
    return codons.find((c) => c.id === selectedId) || codons[0];
  }, [codons, selectedId]);

  const selectedRoleIdx = useMemo(() => {
    return Math.floor((selectedId - 1) / 4);
  }, [selectedId]);

  // 4 quadrant labels around the outer ring (Initiation/Civilization/Duality/Mutation)
  const quadrantLabels = useMemo(() => {
    return QUADRANTS.map((q, idx) => {
      const midAngle = q.startSlot * 5.625 + 45; // center of the 90° quadrant
      // Quadrant names ride the outer edge of the wheel now.
      const textArcPath = labelArcPath(CX, CY, 366, midAngle, 24);
      return { ...q, idx, textArcPath };
    });
  }, []);

  // 4 heavier quadrant-boundary divider lines, every 16 slots (90° apart)
  const quadrantDividers = useMemo(() => {
    return QUADRANTS.map((q) => {
      const angle = q.startSlot * 5.625;
      const inner = pol(CX, CY, 130, angle);
      const outer = pol(CX, CY, 350, angle);
      return { x1: inner.x, y1: inner.y, x2: outer.x, y2: outer.y };
    });
  }, []);

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
            {quadrantLabels.map((q) => (
              <path key={q.idx} id={`quadrant-arc-${q.idx}`} d={q.textArcPath} fill="none" />
            ))}
            {/* Per-center tint: flood the center color through a sigil's alpha */}
            {CENTERS.map((center) => (
              <filter
                key={center.name}
                id={`center-tint-${center.name}`}
                x="-15%"
                y="-15%"
                width="130%"
                height="130%"
              >
                <feFlood floodColor={CENTER_COLORS[center.name]} result="tint" />
                <feComposite in="tint" in2="SourceAlpha" operator="in" />
              </filter>
            ))}
          </defs>

          {/* Click-catcher — a click on the empty area outside the wheel (this
              transparent backdrop, behind every wedge) clears the filters. */}
          <rect
            x="0"
            y="0"
            width="760"
            height="760"
            fill="transparent"
            style={{ pointerEvents: "all", cursor: onDeselect ? "default" : "auto" }}
            onClick={() => onDeselect?.()}
          />

          {/* Central ambient glow */}
          <circle
            cx={CX}
            cy={CY}
            r="350"
            fill="url(#wheel-central-glow)"
            style={{ pointerEvents: "none" }}
          />

          {/* Guide Rings — 350 outer, 250 divides codon arcs from the center
              band, 204 closes the center band, 130 inner. */}
          <g fill="none" stroke="var(--line)" strokeWidth="0.8">
            <circle cx={CX} cy={CY} r="350" />
            <circle cx={CX} cy={CY} r="250" stroke="rgba(205,161,74,0.22)" />
            <circle cx={CX} cy={CY} r="204" stroke="rgba(205,161,74,0.22)" />
            <circle cx={CX} cy={CY} r="130" stroke="rgba(205,161,74,0.28)" />
          </g>

          {/* Decorative spinning dotted outer ring */}
          <g className="cz-wheel-spin-slow" style={{ transformOrigin: `${CX}px ${CY}px` }}>
            <circle
              cx={CX}
              cy={CY}
              r="356"
              fill="none"
              stroke="rgba(205,161,74,0.18)"
              strokeWidth="0.8"
              strokeDasharray="1.5 12"
            />
          </g>

          {/* Quadrant boundary dividers — heavier stroke, every 90° */}
          {quadrantDividers.map((div, i) => (
            <line
              key={i}
              x1={div.x1}
              y1={div.y1}
              x2={div.x2}
              y2={div.y2}
              stroke="rgba(205,161,74,0.4)"
              strokeWidth="1.4"
            />
          ))}

          {/* 64 Codon Wedges — colored annular ring segments, one per codon */}
          <g>
            {codons.map((c) => {
              const isSel = c.id === selectedId;
              const roleIdx = Math.floor((c.id - 1) / 4);
              const inRole =
                roleIdx === selectedRoleIdx ||
                (activeRoleIdx !== null && activeRoleIdx !== undefined && roleIdx === activeRoleIdx);

              const centerName = CODON_CENTER_MAP[c.id] || "Origin";
              const centerColor = CENTER_COLORS[centerName] || "#bda36b";

              const isActivated = activations?.has(c.id);
              const isHovered = hoveredId === c.id;
              const inCenter = !!activeCenter && centerName === activeCenter;
              const hasFilter =
                (activeRoleIdx !== null && activeRoleIdx !== undefined) || !!activeCenter;
              const dim = (hoveredId !== null || hasFilter) && !isSel && !inRole && !isHovered && !inCenter;

              const slot = CODON_SLOT[c.id] ?? c.id - 1;
              const startDeg = slot * 5.625;
              const endDeg = (slot + 1) * 5.625;
              const wedgePath = getAnnularSectorPath(CX, CY, WEDGE_OUTER, WEDGE_INNER, startDeg, endDeg);

              const midDeg = (slot + 0.5) * 5.625;
              const glyphR = WEDGE_INNER + (WEDGE_OUTER - WEDGE_INNER) * 0.68;
              const glyphPos = pol(CX, CY, glyphR, midDeg);
              const glyphSize = 20;

              // Small per-wedge role indicator — roles are tetrads of 4
              // consecutive codon IDs, so under the Mandala wheel order a
              // role's 4 codons land on scattered, non-adjacent wedges. A
              // single curved ring label can't track that anymore, so each
              // wedge instead carries its own tiny role glyph.
              const roleGlyphR = WEDGE_INNER + (WEDGE_OUTER - WEDGE_INNER) * 0.2;
              const roleGlyphPos = pol(CX, CY, roleGlyphR, midDeg);
              const roleGlyphSize = 12;

              // This segment's Center sigil, in the separate band below the arc.
              const centerBandPath = getAnnularSectorPath(
                CX,
                CY,
                CENTER_BAND_OUTER,
                CENTER_BAND_INNER,
                startDeg,
                endDeg
              );
              const centerSymR = (CENTER_BAND_OUTER + CENTER_BAND_INNER) / 2;
              const centerSymPos = pol(CX, CY, centerSymR, midDeg);
              const centerSymSize = 17;
              const centerSymFile = CENTER_SYMBOL[centerName] || "1AXIS";

              return (
                <g
                  key={c.id}
                  onClick={() => onSelect(c.id)}
                  onMouseEnter={() => setHoveredId(c.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  style={{ cursor: "pointer" }}
                >
                  <title>{`${c.code} · ${c.name}`}</title>
                  <path
                    d={wedgePath}
                    fill={centerColor}
                    fillOpacity={dim ? 0.2 : isSel || isHovered ? 1 : 0.78}
                    stroke={isSel ? "#fff8ec" : "rgba(5,5,5,0.55)"}
                    strokeWidth={isSel ? 1.6 : 0.6}
                    style={{ transition: "fill-opacity 0.25s ease, stroke 0.25s ease" }}
                  />
                  {isActivated && (
                    <path
                      d={wedgePath}
                      fill="none"
                      stroke="rgba(246,176,94,0.9)"
                      strokeWidth={1.4}
                    />
                  )}
                  <image
                    href={`/symbols/${c.code}.png`}
                    x={glyphPos.x - glyphSize / 2}
                    y={glyphPos.y - glyphSize / 2}
                    width={glyphSize}
                    height={glyphSize}
                    preserveAspectRatio="xMidYMid slice"
                    style={{
                      filter: "brightness(0)",
                      opacity: dim ? 0.25 : 0.7,
                      pointerEvents: "none",
                    }}
                  />
                  <image
                    href={ROLE_VECTORS[roleIdx]}
                    x={roleGlyphPos.x - roleGlyphSize / 2}
                    y={roleGlyphPos.y - roleGlyphSize / 2}
                    width={roleGlyphSize}
                    height={roleGlyphSize}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      filter: "brightness(0)",
                      opacity: dim ? 0.2 : 0.55,
                      pointerEvents: "none",
                    }}
                  />

                  {/* Center band — this segment's Center, in its own space */}
                  <path
                    d={centerBandPath}
                    fill={centerColor}
                    fillOpacity={dim ? 0.04 : inCenter ? 0.22 : 0.09}
                    stroke="rgba(5,5,5,0.4)"
                    strokeWidth={0.4}
                    style={{ transition: "fill-opacity 0.25s ease" }}
                  />
                  <image
                    href={`/9-centers/${centerSymFile}.png`}
                    x={centerSymPos.x - centerSymSize / 2}
                    y={centerSymPos.y - centerSymSize / 2}
                    width={centerSymSize}
                    height={centerSymSize}
                    preserveAspectRatio="xMidYMid meet"
                    style={{
                      filter: `url(#center-tint-${centerName})`,
                      opacity: dim ? 0.3 : inCenter ? 1 : 0.9,
                      pointerEvents: "none",
                    }}
                  />
                </g>
              );
            })}
          </g>

          {/* 4 Quadrant labels, curved along the outer ring */}
          <g style={{ pointerEvents: "none" }}>
            {quadrantLabels.map((q) => (
              <text
                key={q.idx}
                fontFamily="var(--font-ritual)"
                fontSize="10.5"
                letterSpacing="0.28em"
                textAnchor="middle"
                fill="rgba(232, 196, 119, 0.6)"
              >
                <textPath href={`#quadrant-arc-${q.idx}`} startOffset="50%">
                  {q.name}
                </textPath>
              </text>
            ))}
          </g>
        </svg>

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
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src={`/symbols/${selectedCodon.code}.png`}
                  alt={selectedCodon.code}
                  style={{
                    width: "60%",
                    height: "60%",
                    objectFit: "contain",
                    filter: "brightness(0) invert(1)",
                    opacity: 0.82,
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
