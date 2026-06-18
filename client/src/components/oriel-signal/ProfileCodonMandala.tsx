import { useEffect, useMemo, useState, type ReactNode } from "react";

const C = {
  deep: "#0f0f15",
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold: "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  amber: "#f6b05e",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
};

// Canonical Resonance Mandala Sequence: 64 codons, non-sequential order.
// Source of truth: wiki/concepts/concept-mandala-sequence.md and VRC CANON MASTER.
const MANDALA_SEQUENCE = [
  51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56, 31,
  33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1, 43, 14,
  34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55, 37, 63, 22,
  36, 25, 17, 21,
] as const;

const MANDALA_QUADRANTS = [
  "INITIATION",
  "CIVILIZATION",
  "DUALITY",
  "MUTATION",
] as const;

export type ProfileCodonMandalaPrimeStackEntry = {
  codonName?: string;
  codon?: string | number;
  center?: string;
  position?: string | number;
  facet?: string;
  label?: string;
};

function codonNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value !== "string") return null;
  const match = value.match(/\d+/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCodon(value: unknown) {
  const number = codonNumber(value);
  return number ? `RC${String(number).padStart(2, "0")}` : "RC—";
}

function ChamberPanel({
  eyebrow,
  title,
  children,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        border: `1px solid ${accent ? C.borderH : C.border}`,
        background:
          "linear-gradient(135deg, rgba(15,15,21,0.94), rgba(8,8,12,0.72))",
        padding: "22px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 9,
          color: accent ? C.amber : C.txtD,
          letterSpacing: "0.2em",
          marginBottom: 8,
        }}
      >
        {eyebrow}
      </div>
      <h2
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(24px, 4vw, 42px)",
          fontWeight: 300,
          color: C.txt,
          margin: "0 0 18px",
          lineHeight: 1,
        }}
      >
        {title}
      </h2>
      {children}
    </div>
  );
}

function MetricTile({
  label,
  value,
  note,
  accent = false,
}: {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        padding: "13px 14px",
        border: `1px solid ${accent ? C.borderH : C.border}`,
        background: accent
          ? "rgba(246,176,94,0.04)"
          : "rgba(255,255,255,0.015)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 8,
          letterSpacing: "0.16em",
          color: accent ? C.amber : C.txtD,
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 12,
          color: C.txt,
          lineHeight: 1.45,
        }}
      >
        {value}
      </div>
      {note && (
        <div
          style={{
            marginTop: 6,
            fontFamily: "var(--font-ritual)",
            fontSize: 9,
            color: C.txtD,
            lineHeight: 1.5,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

export function ProfileCodonMandala({
  primeStack,
}: {
  primeStack: ProfileCodonMandalaPrimeStackEntry[];
}) {
  const activeByCodon = useMemo(() => {
    const map = new Map<number, ProfileCodonMandalaPrimeStackEntry[]>();
    for (const entry of primeStack) {
      const number = codonNumber(entry.codon);
      if (!number) continue;
      const existing = map.get(number) ?? [];
      existing.push(entry);
      map.set(number, existing);
    }
    return map;
  }, [primeStack]);

  const firstActive = useMemo(() => {
    for (const codon of MANDALA_SEQUENCE) {
      if (activeByCodon.has(codon)) return codon;
    }
    return null;
  }, [activeByCodon]);

  const [selectedCodon, setSelectedCodon] = useState<number | null>(
    firstActive
  );

  useEffect(() => {
    setSelectedCodon(current => current ?? firstActive);
  }, [firstActive]);

  const selectedEntries = selectedCodon
    ? (activeByCodon.get(selectedCodon) ?? [])
    : [];

  return (
    <ChamberPanel eyebrow="CODON MANDALA" title="64-Codon Static Wheel" accent>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 20,
          alignItems: "center",
        }}
      >
        <svg viewBox="0 0 520 520" style={{ width: "100%", display: "block" }}>
          <defs>
            <radialGradient id="profile-mandala-glow">
              <stop offset="0%" stopColor="rgba(246,176,94,0.14)" />
              <stop offset="62%" stopColor="rgba(189,163,107,0.04)" />
              <stop offset="100%" stopColor="rgba(10,10,14,0)" />
            </radialGradient>
            <filter id="profile-mandala-node-glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <circle cx="260" cy="260" r="238" fill="url(#profile-mandala-glow)" />
          {[226, 182, 126, 68].map((radius, index) => (
            <circle
              key={radius}
              cx="260"
              cy="260"
              r={radius}
              fill="none"
              stroke={index === 0 ? C.goldDim : C.border}
              strokeWidth={index === 0 ? "0.8" : "0.5"}
              strokeDasharray={index % 2 === 0 ? "3 7" : undefined}
            />
          ))}
          {MANDALA_QUADRANTS.map((label, index) => {
            const angle = (index * 90 - 45) * (Math.PI / 180);
            return (
              <text
                key={label}
                x={260 + Math.cos(angle) * 112}
                y={260 + Math.sin(angle) * 112}
                textAnchor="middle"
                style={{
                  fontSize: "7px",
                  fill: C.txtD,
                  fontFamily: "var(--font-ritual)",
                  letterSpacing: "1.2px",
                }}
              >
                {label}
              </text>
            );
          })}
          {MANDALA_SEQUENCE.map((codon, index) => {
            const angle = (index / 64) * Math.PI * 2 - Math.PI / 2;
            const active = activeByCodon.has(codon);
            const selected = selectedCodon === codon;
            const radius = 188 + (index % 2 === 0 ? 8 : -8);
            const x = 260 + Math.cos(angle) * radius;
            const y = 260 + Math.sin(angle) * radius;
            const lx = 260 + Math.cos(angle) * 226;
            const ly = 260 + Math.sin(angle) * 226;
            const tx1 = 260 + Math.cos(angle) * 154;
            const ty1 = 260 + Math.sin(angle) * 154;
            const tx2 = 260 + Math.cos(angle) * 222;
            const ty2 = 260 + Math.sin(angle) * 222;
            return (
              <g
                key={codon}
                onClick={() => setSelectedCodon(codon)}
                style={{ cursor: "pointer" }}
              >
                <line
                  x1={tx1}
                  y1={ty1}
                  x2={tx2}
                  y2={ty2}
                  stroke={index % 8 === 0 ? C.goldDim : C.border}
                  strokeWidth={index % 8 === 0 ? "0.85" : "0.35"}
                />
                {active && (
                  <circle
                    cx={x}
                    cy={y}
                    r={selected ? 18 : 13}
                    fill="none"
                    stroke={C.gold}
                    strokeWidth="0.85"
                    opacity="0.38"
                  />
                )}
                <circle
                  cx={x}
                  cy={y}
                  r={selected ? 10 : active ? 7 : 4.2}
                  fill={selected ? C.gold : active ? C.surface : C.deep}
                  stroke={selected ? C.txt : active ? C.gold : C.border}
                  strokeWidth={selected ? "1.2" : active ? "0.9" : "0.45"}
                  filter={
                    active || selected
                      ? "url(#profile-mandala-node-glow)"
                      : undefined
                  }
                />
                {(selected || active || index % 4 === 0) && (
                  <text
                    x={lx}
                    y={ly + 2}
                    textAnchor="middle"
                    style={{
                      fontSize: selected ? "6.5px" : active ? "5.5px" : "4.3px",
                      fill: selected ? C.txt : active ? C.gold : C.txtD,
                      fontFamily: "var(--font-ritual)",
                    }}
                  >
                    {String(codon).padStart(2, "0")}
                  </text>
                )}
              </g>
            );
          })}
          <text
            x="260"
            y="244"
            textAnchor="middle"
            style={{
              fontSize: "8px",
              fill: C.txtD,
              fontFamily: "var(--font-ritual)",
              letterSpacing: "2px",
            }}
          >
            VRC MANDALA
          </text>
          <text
            x="260"
            y="270"
            textAnchor="middle"
            style={{
              fontSize: "22px",
              fill: C.txt,
              fontFamily: "var(--font-display)",
              fontWeight: 300,
            }}
          >
            {selectedCodon ? formatCodon(selectedCodon) : "STATIC"}
          </text>
          <text
            x="260"
            y="292"
            textAnchor="middle"
            style={{
              fontSize: "6px",
              fill: C.txtS,
              fontFamily: "var(--font-ritual)",
              letterSpacing: "1.3px",
            }}
          >
            64 CODONS · 4 FACETS · 9 CENTERS
          </text>
        </svg>

        <div>
          <MetricTile
            label="SELECTED CODON"
            value={selectedCodon ? formatCodon(selectedCodon) : "None"}
            note={
              selectedEntries.length
                ? `${selectedEntries.length} Prime Stack activation${selectedEntries.length === 1 ? "" : "s"}`
                : "No stored Prime Stack activation on this codon."
            }
            accent={selectedEntries.length > 0}
          />
          <div style={{ display: "grid", gap: 10, marginTop: 12 }}>
            {selectedEntries.length ? (
              selectedEntries.map((entry, index) => (
                <div
                  key={`${entry.codon}-${entry.position || index}`}
                  style={{
                    padding: "12px 14px",
                    border: `1px solid ${C.border}`,
                    background: "rgba(255,255,255,0.015)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 10,
                      color: C.amber,
                      letterSpacing: "0.1em",
                      marginBottom: 4,
                    }}
                  >
                    {entry.position || entry.label || `ACTIVATION ${index + 1}`}
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 9,
                      color: C.txtS,
                      lineHeight: 1.7,
                    }}
                  >
                    {entry.codonName || "Unnamed codon"}
                    {entry.center ? ` · ${entry.center}` : ""}
                    {entry.facet ? ` · ${entry.facet}` : ""}
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: C.txtD,
                  lineHeight: 1.8,
                }}
              >
                Select a highlighted point to inspect stored Prime Stack data.
              </div>
            )}
          </div>
        </div>
      </div>
    </ChamberPanel>
  );
}
