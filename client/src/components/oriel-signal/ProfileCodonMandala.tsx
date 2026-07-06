import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  CENTER_COLORS,
  CENTER_SYMBOL,
  CENTERS,
  CODON_CENTER_MAP,
  ROLES,
  ROLE_VECTORS,
  VRC_MANDALA,
} from "./CodonWheel";
import { VTRS_CENTERS, VTRS_LINKS } from "./vtrs/vtrs-data";

const C = {
  void: "#08070b",
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

const QUADRANTS = [
  "INITIATION",
  "CIVILIZATION",
  "DUALITY",
  "MUTATION",
] as const;
const FACETS = ["A", "B", "C", "D"] as const;
const FACET_OPACITY = [0.24, 0.38, 0.54, 0.74] as const;

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
  return number ? `RC${String(number).padStart(2, "0")}` : "RC--";
}

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function sector(
  cx: number,
  cy: number,
  inner: number,
  outer: number,
  startDeg: number,
  endDeg: number
) {
  const a = polar(cx, cy, outer, startDeg);
  const b = polar(cx, cy, outer, endDeg);
  const c = polar(cx, cy, inner, endDeg);
  const d = polar(cx, cy, inner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${a.x} ${a.y}`,
    `A ${outer} ${outer} 0 ${large} 1 ${b.x} ${b.y}`,
    `L ${c.x} ${c.y}`,
    `A ${inner} ${inner} 0 ${large} 0 ${d.x} ${d.y}`,
    "Z",
  ].join(" ");
}

function stripThe(value: string) {
  return value.replace(/^The\s+/i, "");
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
          "linear-gradient(135deg, rgba(15,15,21,0.96), rgba(8,8,12,0.78))",
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
          fontSize: "clamp(26px, 4vw, 46px)",
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
  vrcType,
  vrcAuthority,
  fractalRole,
}: {
  primeStack: ProfileCodonMandalaPrimeStackEntry[];
  vrcType?: string | null;
  vrcAuthority?: string | null;
  fractalRole?: string | null;
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

  const activeCodons = useMemo(
    () => new Set(activeByCodon.keys()),
    [activeByCodon]
  );

  const activeLinks = useMemo(
    () =>
      VTRS_LINKS.filter(
        link => activeCodons.has(link.codonA) && activeCodons.has(link.codonB)
      ),
    [activeCodons]
  );

  const definedCenters = useMemo(() => {
    const names = new Set<string>();
    for (const link of activeLinks) {
      names.add(link.centerA);
      names.add(link.centerB);
    }
    return names;
  }, [activeLinks]);

  const centerCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const codon of activeCodons) {
      const center = CODON_CENTER_MAP[codon];
      if (!center) continue;
      counts.set(center, (counts.get(center) ?? 0) + 1);
    }
    return counts;
  }, [activeCodons]);

  const firstActive = useMemo(() => {
    for (const codon of VRC_MANDALA) {
      if (activeByCodon.has(codon)) return codon;
    }
    return null;
  }, [activeByCodon]);

  const [selectedCodon, setSelectedCodon] = useState<number | null>(
    firstActive
  );
  const [selectedCenterOverride, setSelectedCenterOverride] = useState<
    string | null
  >(null);

  useEffect(() => {
    setSelectedCodon(current => current ?? firstActive);
  }, [firstActive]);

  const selectedCenterName =
    selectedCenterOverride ??
    (selectedCodon ? CODON_CENTER_MAP[selectedCodon] : null) ??
    "Return";
  const selectedCenter =
    VTRS_CENTERS.find(center => center.id === selectedCenterName) ??
    VTRS_CENTERS[0];
  const selectedCenterColor = CENTER_COLORS[selectedCenter.id] ?? C.gold;
  const selectedEntries = selectedCodon
    ? (activeByCodon.get(selectedCodon) ?? [])
    : [];
  const selectedRoleIdx = selectedCodon
    ? Math.max(0, Math.min(15, Math.floor((selectedCodon - 1) / 4)))
    : 0;
  const selectedRole = ROLES[selectedRoleIdx];
  const selectedCenterState = definedCenters.has(selectedCenter.id)
    ? "DEFINED"
    : centerCounts.has(selectedCenter.id)
      ? "TOUCHED"
      : "OPEN";
  const selectedCenterLinks = VTRS_LINKS.filter(
    link =>
      link.centerA === selectedCenter.id || link.centerB === selectedCenter.id
  );
  const trajectoryLinks =
    activeLinks.length > 0 ? activeLinks : selectedCenterLinks.slice(0, 4);

  return (
    <ChamberPanel eyebrow="PROFILE NODE" title="The Receiver Node" accent>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 360px), 1fr))",
          gap: 24,
          alignItems: "stretch",
        }}
      >
        <div
          style={{
            position: "relative",
            minHeight: "min(680px, 92vw)",
            aspectRatio: "1 / 1",
            border: `1px solid ${C.border}`,
            background:
              "radial-gradient(circle at center, rgba(189,163,107,0.12), transparent 42%), #08070b",
            overflow: "hidden",
          }}
        >
          <svg
            viewBox="0 0 760 760"
            style={{ width: "100%", height: "100%", display: "block" }}
            aria-label="VTRS v2 receiver node"
          >
            <defs>
              <radialGradient id="profile-node-core">
                <stop offset="0%" stopColor="rgba(232,196,119,0.2)" />
                <stop offset="65%" stopColor="rgba(189,163,107,0.04)" />
                <stop offset="100%" stopColor="rgba(8,7,11,0)" />
              </radialGradient>
              <filter id="profile-node-glow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <circle cx="380" cy="380" r="350" fill="url(#profile-node-core)" />
            {[346, 302, 246, 172, 94].map((radius, index) => (
              <circle
                key={radius}
                cx="380"
                cy="380"
                r={radius}
                fill="none"
                stroke={index === 0 ? C.goldDim : C.border}
                strokeWidth={index === 0 ? 0.9 : 0.5}
                strokeDasharray={index % 2 === 0 ? "4 12" : undefined}
              />
            ))}

            {QUADRANTS.map((label, index) => {
              const pos = polar(380, 380, 323, index * 90 + 45);
              return (
                <text
                  key={label}
                  x={pos.x}
                  y={pos.y}
                  textAnchor="middle"
                  style={{
                    fill: C.txtD,
                    fontFamily: "var(--font-ritual)",
                    fontSize: 9,
                    letterSpacing: 1.4,
                  }}
                >
                  {label}
                </text>
              );
            })}

            {VRC_MANDALA.map((codon, slot) => {
              const center = CODON_CENTER_MAP[codon];
              const color = CENTER_COLORS[center] ?? C.gold;
              const active = activeByCodon.has(codon);
              const selected = selectedCodon === codon;
              const dim = selectedCenterOverride
                ? center !== selectedCenterOverride
                : false;
              const a0 = slot * 5.625 + 0.22;
              const a1 = (slot + 1) * 5.625 - 0.22;

              return (
                <g
                  key={codon}
                  onClick={() => {
                    setSelectedCodon(codon);
                    setSelectedCenterOverride(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  {FACETS.map((facet, index) => (
                    <path
                      key={facet}
                      d={sector(
                        380,
                        380,
                        250 + index * 20,
                        268 + index * 20,
                        a0,
                        a1
                      )}
                      fill={color}
                      opacity={
                        dim
                          ? 0.08
                          : selected
                            ? 0.92
                            : active
                              ? FACET_OPACITY[index] + 0.14
                              : FACET_OPACITY[index]
                      }
                      stroke={selected && index === 3 ? C.txt : "transparent"}
                      strokeWidth={selected && index === 3 ? 1 : 0}
                    />
                  ))}
                </g>
              );
            })}

            {VRC_MANDALA.map((codon, slot) => {
              const center = CODON_CENTER_MAP[codon];
              const color = CENTER_COLORS[center] ?? C.gold;
              const active = activeByCodon.has(codon);
              const selected = selectedCodon === codon;
              const mid = slot * 5.625 + 2.8125;
              const pos = polar(380, 380, 342, mid);
              return (
                <text
                  key={`label-${codon}`}
                  x={pos.x}
                  y={pos.y + 2}
                  textAnchor="middle"
                  onClick={() => {
                    setSelectedCodon(codon);
                    setSelectedCenterOverride(null);
                  }}
                  style={{
                    cursor: "pointer",
                    fill: selected ? C.txt : active ? C.amber : color,
                    opacity: active || selected || slot % 4 === 0 ? 1 : 0.38,
                    fontFamily: "var(--font-ritual)",
                    fontSize: selected ? 8 : active ? 6.5 : 5.5,
                  }}
                >
                  {String(codon).padStart(2, "0")}
                </text>
              );
            })}

            {ROLES.map((role, index) => {
              const a0 = index * 22.5 + 0.8;
              const a1 = (index + 1) * 22.5 - 0.8;
              const on = selectedRoleIdx === index;
              const mid = (a0 + a1) / 2;
              const pos = polar(380, 380, 204, mid);
              return (
                <g
                  key={role.name}
                  onClick={() => {
                    setSelectedCodon(index * 4 + 1);
                    setSelectedCenterOverride(null);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <path
                    d={sector(380, 380, 190, 224, a0, a1)}
                    fill={on ? "rgba(189,163,107,0.18)" : "rgba(189,163,107,0.045)"}
                    stroke={on ? C.amber : C.border}
                    strokeWidth={on ? 1.2 : 0.6}
                  />
                  <image
                    href={ROLE_VECTORS[index]}
                    x={pos.x - (on ? 16 : 12)}
                    y={pos.y - (on ? 16 : 12)}
                    width={on ? 32 : 24}
                    height={on ? 32 : 24}
                    opacity={on ? 1 : 0.54}
                  />
                </g>
              );
            })}

            {CENTERS.map((center, index) => {
              const angle = index * 45 - 90;
              const pos = polar(380, 380, 118, angle);
              const color = CENTER_COLORS[center.name] ?? C.gold;
              const state = definedCenters.has(center.name)
                ? "DEFINED"
                : centerCounts.has(center.name)
                  ? "TOUCHED"
                  : "OPEN";
              const selected = selectedCenter.id === center.name;

              return (
                <g
                  key={center.name}
                  onClick={() => {
                    setSelectedCenterOverride(center.name);
                    const first = VRC_MANDALA.find(
                      codon => CODON_CENTER_MAP[codon] === center.name
                    );
                    if (first) setSelectedCodon(first);
                  }}
                  style={{ cursor: "pointer" }}
                >
                  <circle
                    cx={pos.x}
                    cy={pos.y}
                    r={selected ? 30 : 24}
                    fill={selected ? `${color}26` : "rgba(8,7,11,0.86)"}
                    stroke={selected ? color : `${color}99`}
                    strokeWidth={selected ? 1.5 : 0.8}
                    filter={selected ? "url(#profile-node-glow)" : undefined}
                  />
                  <image
                    href={`/9-centers/${CENTER_SYMBOL[center.name]}.png`}
                    x={pos.x - 13}
                    y={pos.y - 13}
                    width={26}
                    height={26}
                    opacity={state === "OPEN" ? 0.45 : 0.95}
                  />
                  <text
                    x={pos.x}
                    y={pos.y + 42}
                    textAnchor="middle"
                    style={{
                      fill: selected ? C.txt : color,
                      fontFamily: "var(--font-ritual)",
                      fontSize: 7,
                      letterSpacing: 1,
                    }}
                  >
                    {center.name.toUpperCase()}
                  </text>
                </g>
              );
            })}

            <line
              x1="380"
              y1="258"
              x2="380"
              y2="502"
              stroke={selectedCenterColor}
              strokeWidth="0.7"
              strokeDasharray="3 9"
              opacity="0.62"
            />
            <circle
              cx="380"
              cy="380"
              r="78"
              fill="rgba(8,7,11,0.82)"
              stroke={selectedCenterColor}
              strokeWidth="1.2"
            />
            <text
              x="380"
              y="354"
              textAnchor="middle"
              style={{
                fill: C.txtD,
                fontFamily: "var(--font-ritual)",
                fontSize: 8,
                letterSpacing: 2.2,
              }}
            >
              THE SEAL
            </text>
            <text
              x="380"
              y="386"
              textAnchor="middle"
              style={{
                fill: C.txt,
                fontFamily: "var(--font-display)",
                fontSize: 24,
                fontWeight: 300,
              }}
            >
              {selectedCenter.roman}
            </text>
            <text
              x="380"
              y="412"
              textAnchor="middle"
              style={{
                fill: selectedCenterColor,
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: 1.4,
              }}
            >
              {stripThe(selectedCenter.name).toUpperCase()}
            </text>
          </svg>

          <div
            style={{
              position: "absolute",
              left: 18,
              right: 18,
              bottom: 16,
              display: "flex",
              gap: 14,
              flexWrap: "wrap",
              justifyContent: "center",
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              letterSpacing: "0.13em",
              color: C.txtD,
            }}
          >
            <span>64 CODONS</span>
            <span>256 FACETS</span>
            <span>16 ROLES</span>
            <span>8 CENTERS</span>
            <span>32 LINKS</span>
            <span>512 STATES</span>
          </div>
        </div>

        <aside
          style={{
            border: `1px solid ${C.border}`,
            background: "rgba(8,7,11,0.74)",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ padding: "22px 24px", borderBottom: `1px solid ${C.border}` }}>
            <div
              style={{
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.18em",
                color: C.txtD,
                marginBottom: 8,
              }}
            >
              THE NODE
            </div>
            <h3
              style={{
                margin: 0,
                color: C.txt,
                fontFamily: "var(--font-display)",
                fontSize: 34,
                fontWeight: 300,
                lineHeight: 1,
              }}
            >
              {stripThe(selectedCenter.name)}
            </h3>
            <p
              style={{
                margin: "12px 0 0",
                color: selectedCenterColor,
                fontFamily: "var(--font-ritual)",
                fontSize: 11,
                letterSpacing: "0.12em",
              }}
            >
              CENTER {selectedCenter.roman} / {selectedCenterState}
            </p>
          </div>

          <div
            style={{
              padding: "16px 24px",
              borderBottom: `1px solid ${C.border}`,
              display: "grid",
              gap: 10,
            }}
          >
            <MetricTile
              label="THE SEAL"
              value={`${vrcType || "TYPE UNRESOLVED"} / ${vrcAuthority || "AUTHORITY UNRESOLVED"}`}
              note={fractalRole ? `Role trace: ${fractalRole}` : "Static role trace resolves from the saved profile."}
              accent
            />
            <MetricTile
              label="SELECTED CODON"
              value={selectedCodon ? formatCodon(selectedCodon) : "None"}
              note={
                selectedEntries.length
                  ? `${selectedEntries.length} activation${selectedEntries.length === 1 ? "" : "s"} on this codon.`
                  : "No stored Prime Stack activation on this codon."
              }
              accent={selectedEntries.length > 0}
            />
            <MetricTile
              label="ROLE RING"
              value={`${selectedRole?.roman ?? "--"} / ${selectedRole?.name ?? "Unresolved"}`}
              note={selectedRole?.desc}
            />
          </div>

          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
            <div
              style={{
                color: C.txtD,
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.18em",
                marginBottom: 10,
              }}
            >
              CENTER SUBSTRATE
            </div>
            <p
              style={{
                color: C.txtS,
                fontFamily: "var(--font-ritual)",
                fontSize: 11,
                lineHeight: 1.65,
                margin: 0,
              }}
            >
              {selectedCenter.substrate}
            </p>
            <p
              style={{
                color: C.txtS,
                fontFamily: "var(--font-display)",
                fontSize: 15,
                lineHeight: 1.55,
                margin: "12px 0 0",
              }}
            >
              {selectedCenter.role}
            </p>
          </div>

          <div style={{ padding: "18px 24px", borderBottom: `1px solid ${C.border}` }}>
            <div
              style={{
                color: C.txtD,
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.18em",
                marginBottom: 12,
              }}
            >
              8 CENTER CANON
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              {VTRS_CENTERS.map(center => {
                const color = CENTER_COLORS[center.id] ?? C.gold;
                const state = definedCenters.has(center.id)
                  ? "DEFINED"
                  : centerCounts.has(center.id)
                    ? "TOUCHED"
                    : "OPEN";
                const selected = selectedCenter.id === center.id;
                return (
                  <button
                    key={center.id}
                    type="button"
                    onClick={() => {
                      setSelectedCenterOverride(center.id);
                      const first = VRC_MANDALA.find(
                        codon => CODON_CENTER_MAP[codon] === center.id
                      );
                      if (first) setSelectedCodon(first);
                    }}
                    style={{
                      display: "grid",
                      gridTemplateColumns: "28px 1fr auto",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 10px",
                      border: `1px solid ${selected ? color : C.border}`,
                      background: selected ? `${color}16` : "rgba(255,255,255,0.012)",
                      color: C.txtS,
                      cursor: "pointer",
                      textAlign: "left",
                    }}
                  >
                    <img
                      src={`/9-centers/${CENTER_SYMBOL[center.id]}.png`}
                      alt=""
                      style={{ width: 22, height: 22, objectFit: "contain", opacity: state === "OPEN" ? 0.48 : 1 }}
                    />
                    <span
                      style={{
                        fontFamily: "var(--font-ritual)",
                        fontSize: 10,
                        letterSpacing: "0.1em",
                        color: selected ? C.txt : color,
                      }}
                    >
                      {center.roman} / {stripThe(center.name).toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-ritual)",
                        fontSize: 8,
                        letterSpacing: "0.1em",
                        color: state === "DEFINED" ? C.amber : C.txtD,
                      }}
                    >
                      {state}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ padding: "18px 24px" }}>
            <div
              style={{
                color: C.txtD,
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.18em",
                marginBottom: 12,
              }}
            >
              THE TRAJECTORY
            </div>
            <div style={{ display: "grid", gap: 10 }}>
              {trajectoryLinks.slice(0, 5).map(link => {
                const active =
                  activeCodons.has(link.codonA) && activeCodons.has(link.codonB);
                return (
                  <div
                    key={link.id}
                    style={{
                      padding: "11px 12px",
                      border: `1px solid ${active ? C.borderH : C.border}`,
                      background: active
                        ? "rgba(246,176,94,0.045)"
                        : "rgba(255,255,255,0.012)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        color: active ? C.amber : C.txtS,
                        fontFamily: "var(--font-ritual)",
                        fontSize: 10,
                        letterSpacing: "0.08em",
                      }}
                    >
                      <span>{link.name}</span>
                      <span>
                        {formatCodon(link.codonA)}-{formatCodon(link.codonB)}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: "6px 0 0",
                        color: C.txtD,
                        fontFamily: "var(--font-ritual)",
                        fontSize: 9,
                        lineHeight: 1.5,
                      }}
                    >
                      {active ? "ACTIVE LINK" : "CANON LINK"} / {link.centerA} to {link.centerB}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </aside>
      </div>
    </ChamberPanel>
  );
}
