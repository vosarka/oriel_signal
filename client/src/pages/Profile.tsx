import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation, Link } from "wouter";
import { Copy, CheckCircle, Zap } from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";
import Layout from "@/components/Layout";
import { PageHeaderBand } from "@/components/oriel-signal/PageHeaderBand";
import { normalizeCenters } from "@/lib/bodygraph-data";
import MemoryConsentTray from "@/components/memory/MemoryConsentTray";

// The Resonance Body figure is lazy-loaded (its baked mesh data is ~50KB).
const ResonanceBody = lazy(
  () => import("@/components/oriel-signal/ResonanceBody")
);
import "@/components/oriel-signal/oriel-signal.css";

// ─── Design Tokens ───────────────────────────────────────────────────────────

const C = {
  void: "#0a0a0e",
  deep: "#0f0f15",
  surface: "#14141c",
  border: "rgba(189,163,107,0.12)",
  borderH: "rgba(189,163,107,0.25)",
  gold: "#bda36b",
  goldDim: "rgba(189,163,107,0.5)",
  goldGlow: "rgba(189,163,107,0.08)",
  amber: "#f6b05e",
  amberDim: "rgba(246,176,94,0.4)",
  txt: "#e8e4dc",
  txtS: "#9a968e",
  txtD: "#6a665e",
  red: "#c94444",
  green: "#44a866",
};

// ─── Profile Sigil Tokens ───────────────────────────────────────────────────

const PROFILE_SIGIL = {
  symbol: "◇",
  color: C.gold,
  glow: C.goldGlow,
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

type PrimeStackEntry = {
  codonName?: string;
  codon?: string | number;
  center?: string;
  position?: string;
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

function coherenceState(score: unknown) {
  const value =
    typeof score === "number" && Number.isFinite(score) ? score : null;
  if (value === null) {
    return {
      label: "UNRESOLVED",
      tone: C.txtD,
      copy: "Run Signal Check to resolve the current field state.",
    };
  }
  if (value >= 80) {
    return {
      label: "ALIGNED",
      tone: C.green,
      copy: "The field is holding a coherent signal window.",
    };
  }
  if (value >= 40) {
    return {
      label: "DRIFTED",
      tone: C.amber,
      copy: "The field is readable, but asking for recalibration.",
    };
  }
  return {
    label: "FRAGMENTED",
    tone: C.red,
    copy: "The field is noisy. Ground first, interpret second.",
  };
}

// ─── Fractal Role → Spiritual Name + Sigil Geometry ─────────────────────────

type FractalIdentity = {
  spiritualName: string;
  subtitle: string;
  sigilType: "circle" | "diamond" | "hexagon" | "octagon";
  accentColor: string;
};

function getFractalIdentity(fractalRole: string | null): FractalIdentity {
  switch (fractalRole?.toLowerCase()) {
    case "resonator":
      return {
        spiritualName: "Wavekeeper",
        subtitle: "You generate the pulse that sustains the field",
        sigilType: "circle",
        accentColor: "#e07a5f",
      };
    case "catalyst":
      return {
        spiritualName: "Ignitor",
        subtitle: "You accelerate what others cannot yet see",
        sigilType: "diamond",
        accentColor: "#f2cc8f",
      };
    case "harmonizer":
      return {
        spiritualName: "Weaver",
        subtitle: "You bind the frequencies into coherence",
        sigilType: "hexagon",
        accentColor: "#81b29a",
      };
    case "reflector":
      return {
        spiritualName: "Mirror",
        subtitle: "You reveal what the collective cannot perceive",
        sigilType: "octagon",
        accentColor: "#b8c0ff",
      };
    default:
      return {
        spiritualName: "Seeker",
        subtitle: "Your signal awaits its first reading",
        sigilType: "circle",
        accentColor: C.txtS,
      };
  }
}

// ─── Sigil SVG Component ────────────────────────────────────────────────────

function ProfileSigil({
  sigilType,
  sigilSymbol,
  sigilColor,
  accentColor,
  sigilGlow,
  size = 200,
}: {
  sigilType: "circle" | "diamond" | "hexagon" | "octagon";
  sigilSymbol: string;
  sigilColor: string;
  accentColor: string;
  sigilGlow: string;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.42;

  // Outer geometric frame based on fractal role
  const outerFrame = (() => {
    switch (sigilType) {
      case "circle": {
        // Triple concentric circles with rotation marks
        const r1 = r,
          r2 = r * 0.82,
          r3 = r * 0.64;
        const ticks = Array.from({ length: 12 }, (_, i) => {
          const a = (i * 30 * Math.PI) / 180;
          const x1 = cx + Math.cos(a) * r2;
          const y1 = cy + Math.sin(a) * r2;
          const x2 = cx + Math.cos(a) * r1;
          const y2 = cy + Math.sin(a) * r1;
          return `M${x1},${y1}L${x2},${y2}`;
        }).join(" ");
        return (
          <>
            <circle
              cx={cx}
              cy={cy}
              r={r1}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.3}
            />
            <circle
              cx={cx}
              cy={cy}
              r={r2}
              fill="none"
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.2}
              strokeDasharray="2 4"
            />
            <circle
              cx={cx}
              cy={cy}
              r={r3}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.4}
            />
            <path
              d={ticks}
              stroke={accentColor}
              strokeWidth={0.8}
              opacity={0.35}
            />
          </>
        );
      }
      case "diamond": {
        // Nested rotated squares
        const pts = (rr: number, rot: number) => {
          return Array.from({ length: 4 }, (_, i) => {
            const a = ((i * 90 + rot) * Math.PI) / 180;
            return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
          }).join(" ");
        };
        return (
          <>
            <polygon
              points={pts(r, 45)}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.35}
            />
            <polygon
              points={pts(r * 0.78, 45)}
              fill="none"
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.2}
              strokeDasharray="3 3"
            />
            <polygon
              points={pts(r * 0.62, 0)}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.4}
            />
            <polygon
              points={pts(r * 0.62, 45)}
              fill="none"
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.15}
            />
          </>
        );
      }
      case "hexagon": {
        const pts = (rr: number, rot: number) => {
          return Array.from({ length: 6 }, (_, i) => {
            const a = ((i * 60 + rot) * Math.PI) / 180;
            return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
          }).join(" ");
        };
        // Connecting lines between inner and outer vertices
        const connectors = Array.from({ length: 6 }, (_, i) => {
          const a1 = ((i * 60 - 30) * Math.PI) / 180;
          const a2 = ((i * 60 - 30) * Math.PI) / 180;
          const x1 = cx + Math.cos(a1) * r * 0.6;
          const y1 = cy + Math.sin(a1) * r * 0.6;
          const x2 = cx + Math.cos(a2) * r;
          const y2 = cy + Math.sin(a2) * r;
          return `M${x1},${y1}L${x2},${y2}`;
        }).join(" ");
        return (
          <>
            <polygon
              points={pts(r, -30)}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.35}
            />
            <polygon
              points={pts(r * 0.78, -30)}
              fill="none"
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.2}
              strokeDasharray="2 4"
            />
            <polygon
              points={pts(r * 0.6, 0)}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.4}
            />
            <path
              d={connectors}
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.2}
            />
          </>
        );
      }
      case "octagon": {
        const pts = (rr: number, rot: number) => {
          return Array.from({ length: 8 }, (_, i) => {
            const a = ((i * 45 + rot) * Math.PI) / 180;
            return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
          }).join(" ");
        };
        // Cross-hair lines
        const crosshairs = [0, 45, 90, 135]
          .map(deg => {
            const a = (deg * Math.PI) / 180;
            const x1 = cx + Math.cos(a) * r * 0.55;
            const y1 = cy + Math.sin(a) * r * 0.55;
            const x2 = cx + Math.cos(a) * r * 0.85;
            const y2 = cy + Math.sin(a) * r * 0.85;
            const x3 = cx - Math.cos(a) * r * 0.55;
            const y3 = cy - Math.sin(a) * r * 0.55;
            const x4 = cx - Math.cos(a) * r * 0.85;
            const y4 = cy - Math.sin(a) * r * 0.85;
            return `M${x1},${y1}L${x2},${y2} M${x3},${y3}L${x4},${y4}`;
          })
          .join(" ");
        return (
          <>
            <polygon
              points={pts(r, 22.5)}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.35}
            />
            <polygon
              points={pts(r * 0.82, 22.5)}
              fill="none"
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.2}
              strokeDasharray="2 3"
            />
            <polygon
              points={pts(r * 0.6, 0)}
              fill="none"
              stroke={accentColor}
              strokeWidth={1}
              opacity={0.4}
            />
            <path
              d={crosshairs}
              stroke={accentColor}
              strokeWidth={0.5}
              opacity={0.25}
            />
          </>
        );
      }
    }
  })();

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <defs>
        <radialGradient id="sigil-glow">
          <stop offset="0%" stopColor={sigilGlow} />
          <stop offset="70%" stopColor="transparent" />
        </radialGradient>
        <filter id="sigil-bloom">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" />
        </filter>
      </defs>

      {/* Background glow */}
      <circle cx={cx} cy={cy} r={r * 1.1} fill="url(#sigil-glow)" />

      {/* Geometric frame */}
      {outerFrame}

      {/* Inner ring — receiver accent */}
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.38}
        fill="none"
        stroke={sigilColor}
        strokeWidth={1.5}
        opacity={0.5}
      />
      <circle
        cx={cx}
        cy={cy}
        r={r * 0.36}
        fill="none"
        stroke={sigilColor}
        strokeWidth={0.5}
        opacity={0.2}
        filter="url(#sigil-bloom)"
      />

      {/* Central receiver symbol */}
      <text
        x={cx}
        y={cy}
        textAnchor="middle"
        dominantBaseline="central"
        fill={sigilColor}
        fontSize={size * 0.16}
        fontFamily="serif"
        style={{ filter: `drop-shadow(0 0 8px ${sigilGlow})` }}
      >
        {sigilSymbol}
      </text>

      {/* Corner dots — 4 cardinal points */}
      {[0, 90, 180, 270].map(deg => {
        const a = (deg * Math.PI) / 180;
        return (
          <circle
            key={deg}
            cx={cx + Math.cos(a) * r * 0.48}
            cy={cy + Math.sin(a) * r * 0.48}
            r={2}
            fill={accentColor}
            opacity={0.5}
          />
        );
      })}
    </svg>
  );
}

// ─── Reusable Components ────────────────────────────────────────────────────

function Field({
  label,
  value,
  accent = false,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        paddingLeft: 16,
        borderLeft: `2px solid ${accent ? C.amber : C.border}`,
        marginBottom: 20,
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 9,
          color: C.txtD,
          letterSpacing: "0.15em",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 13,
          color: accent ? C.amber : C.txt,
          wordBreak: "break-all" as const,
        }}
      >
        {value}
      </div>
    </div>
  );
}

function Section({
  title,
  children,
  accentBorder,
}: {
  title: string;
  children: React.ReactNode;
  accentBorder?: boolean;
}) {
  return (
    <div
      style={{
        background: C.deep,
        marginBottom: 2,
        borderLeft: accentBorder ? `2px solid ${C.gold}` : "none",
      }}
    >
      <div
        style={{ padding: "16px 24px", borderBottom: `1px solid ${C.border}` }}
      >
        <span
          style={{
            fontFamily: "var(--font-ritual)",
            fontSize: 9,
            color: C.amber,
            letterSpacing: "0.2em",
          }}
        >
          {title}
        </span>
      </div>
      <div style={{ padding: "24px" }}>{children}</div>
    </div>
  );
}

function ChamberPanel({
  eyebrow,
  title,
  children,
  accent = false,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        background:
          "linear-gradient(180deg, rgba(20,20,28,0.92), rgba(10,10,14,0.96))",
        border: `1px solid ${accent ? C.goldDim : C.border}`,
        boxShadow: accent ? `0 0 60px ${C.goldGlow}` : undefined,
        padding: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 9,
          color: accent ? C.amber : C.txtD,
          letterSpacing: "0.22em",
          marginBottom: 10,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "clamp(22px, 3vw, 34px)",
          fontWeight: 300,
          color: C.txt,
          lineHeight: 1.05,
          marginBottom: 18,
        }}
      >
        {title}
      </div>
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
  value: React.ReactNode;
  note?: string;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        minHeight: 92,
        padding: "14px 16px",
        border: `1px solid ${accent ? C.goldDim : C.border}`,
        background: accent ? C.goldGlow : "rgba(255,255,255,0.015)",
      }}
    >
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 8,
          color: C.txtD,
          letterSpacing: "0.18em",
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 14,
          color: accent ? C.amber : C.txt,
          lineHeight: 1.35,
        }}
      >
        {value}
      </div>
      {note && (
        <div
          style={{
            fontFamily: "var(--font-ritual)",
            fontSize: 8,
            color: C.txtD,
            lineHeight: 1.55,
            marginTop: 8,
          }}
        >
          {note}
        </div>
      )}
    </div>
  );
}

function IdentityChamber({
  userName,
  conduitId,
  copied,
  onCopy,
  identity,
  fractalRole,
  vrcType,
  vrcAuthority,
  primeCodon,
  lumens,
  readingCount,
  currentResonance,
}: {
  userName: string;
  conduitId: string;
  copied: boolean;
  onCopy: () => void;
  identity: FractalIdentity;
  fractalRole: string | null;
  vrcType: string | null;
  vrcAuthority: string | null;
  primeCodon: PrimeStackEntry | undefined;
  lumens: number;
  readingCount: number;
  currentResonance: any;
}) {
  const state = coherenceState(currentResonance?.carrierlock?.coherenceScore);
  const primeCodonLabel = primeCodon
    ? `${formatCodon(primeCodon.codon)} · ${primeCodon.codonName || "Unnamed Codon"}`
    : "Awaiting Static Signature";

  return (
    <div
      style={{
        position: "relative",
        overflow: "hidden",
        border: `1px solid ${C.goldDim}`,
        background:
          "radial-gradient(circle at 24% 12%, rgba(246,176,94,0.16), transparent 32%), radial-gradient(circle at 82% 58%, rgba(189,163,107,0.11), transparent 28%), linear-gradient(135deg, rgba(20,20,28,0.98), rgba(8,8,12,0.98))",
        marginBottom: 18,
        padding: "clamp(24px, 4vw, 42px)",
        boxShadow: `0 0 80px ${C.goldGlow}`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 18,
          border: `1px solid ${C.border}`,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "relative",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 28,
          alignItems: "center",
        }}
      >
        <div style={{ display: "grid", justifyItems: "center", gap: 16 }}>
          <ProfileSigil
            sigilType={identity.sigilType}
            sigilSymbol={PROFILE_SIGIL.symbol}
            sigilColor={PROFILE_SIGIL.color}
            accentColor={identity.accentColor}
            sigilGlow={PROFILE_SIGIL.glow}
            size={220}
          />
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              color: C.txtD,
              letterSpacing: "0.18em",
              textAlign: "center",
            }}
          >
            RECEIVER FIELD SEAL
          </div>
        </div>

        <div>
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 9,
              color: C.amber,
              letterSpacing: "0.24em",
              marginBottom: 14,
            }}
          >
            RECEIVER IDENTITY CHAMBER
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(38px, 6vw, 72px)",
              color: C.txt,
              fontWeight: 300,
              lineHeight: 0.95,
              margin: "0 0 10px",
            }}
          >
            {identity.spiritualName}
          </h1>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 18,
              color: C.txtS,
              fontStyle: "italic",
              lineHeight: 1.55,
              maxWidth: 640,
              marginBottom: 18,
            }}
          >
            {identity.subtitle}
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <MetricTile
              label="RECEIVER"
              value={userName || "Receiver"}
              accent
            />
            <MetricTile
              label="ROLE"
              value={fractalRole || vrcType || "Awaiting reading"}
            />
            <MetricTile
              label="AUTHORITY"
              value={vrcAuthority || "Unresolved"}
            />
            <MetricTile label="PRIME CODON" value={primeCodonLabel} accent />
            <MetricTile
              label="LUMENS"
              value={lumens.toLocaleString()}
              note="Symbolic, non-gating signal trace. No tiers or unlocks."
            />
            <MetricTile
              label="TODAY'S ALIGNMENT"
              value={state.label}
              note={state.copy}
              accent={state.label === "ALIGNED"}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
              alignItems: "center",
            }}
          >
            <div
              style={{
                flex: "1 1 280px",
                padding: "10px 12px",
                border: `1px solid ${C.border}`,
                color: C.gold,
                fontFamily: "var(--font-ritual)",
                fontSize: 10,
                letterSpacing: "0.08em",
                wordBreak: "break-all",
              }}
            >
              {conduitId}
            </div>
            <button
              type="button"
              onClick={onCopy}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                padding: "10px 14px",
                border: `1px solid ${copied ? C.green : C.borderH}`,
                background: "transparent",
                color: copied ? C.green : C.txtS,
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.14em",
                cursor: "pointer",
              }}
            >
              {copied ? <CheckCircle size={13} /> : <Copy size={13} />}
              {copied ? "COPIED" : "COPY NODE ID"}
            </button>
            <div
              style={{
                color: C.txtD,
                fontFamily: "var(--font-ritual)",
                fontSize: 9,
                letterSpacing: "0.12em",
              }}
            >
              {readingCount} ARCHIVED READING{readingCount === 1 ? "" : "S"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DailyAlignmentPanel({
  currentResonance,
  loading,
}: {
  currentResonance: any;
  loading: boolean;
}) {
  const state = coherenceState(currentResonance?.carrierlock?.coherenceScore);
  const activePattern = currentResonance?.activePattern;
  const activeLabel = activePattern
    ? `${activePattern.codon256Id || "RC—"} · SLI ${activePattern.sli ?? "—"}`
    : "Awaiting Signal Check";

  return (
    <ChamberPanel eyebrow="CURRENT RESONANCE" title="Today's Alignment" accent>
      {loading ? (
        <Spinner size={18} label="Resolving current resonance" />
      ) : (
        <>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
              gap: 10,
              marginBottom: 16,
            }}
          >
            <MetricTile
              label="COHERENCE STATE"
              value={<span style={{ color: state.tone }}>{state.label}</span>}
              note={
                typeof currentResonance?.carrierlock?.coherenceScore ===
                "number"
                  ? `${currentResonance.carrierlock.coherenceScore}/100`
                  : "No current score stored"
              }
              accent
            />
            <MetricTile label="ACTIVE PATTERN" value={activeLabel} />
            <MetricTile
              label="STATIC POSITION"
              value={
                currentResonance?.primeStackPosition?.label ||
                "Prime Stack position unresolved"
              }
            />
          </div>
          <div
            style={{
              padding: "16px",
              border: `1px solid ${C.border}`,
              background: "rgba(255,255,255,0.015)",
              fontFamily: "var(--font-ritual)",
              fontSize: 11,
              color: C.txtS,
              lineHeight: 1.8,
            }}
          >
            {currentResonance?.nextAction || state.copy}
          </div>
          <div style={{ marginTop: 14 }}>
            <Link href="/signal/check">
              <span
                style={{
                  display: "inline-block",
                  padding: "9px 15px",
                  border: `1px solid ${C.amberDim}`,
                  color: C.amber,
                  fontFamily: "var(--font-ritual)",
                  fontSize: 9,
                  letterSpacing: "0.14em",
                  cursor: "pointer",
                }}
              >
                RUN SIGNAL CHECK
              </span>
            </Link>
          </div>
        </>
      )}
    </ChamberPanel>
  );
}

function CodonMandala({ primeStack }: { primeStack: PrimeStackEntry[] }) {
  const activeByCodon = useMemo(() => {
    const map = new Map<number, PrimeStackEntry[]>();
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

// ─── Main Profile Component ─────────────────────────────────────────────────

export default function Profile() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [recomputeStatus, setRecomputeStatus] = useState<string | null>(null);
  const utils = trpc.useUtils();
  const refreshMemoryConsent = () => {
    void utils.oriel.memory.listPendingCandidates.invalidate();
    void utils.oriel.memory.listAccepted.invalidate();
  };

  // Fetch fractal role from latest static signature
  const sigilQuery = trpc.codex.getProfileSigil.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const staticProfileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const currentResonanceQuery = trpc.profile.getCurrentResonance.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // The 9 centers for the Resonance Body, read from the real signature.
  const bodyCenters = useMemo(
    () => normalizeCenters(staticProfileQuery.data?.ninecenters),
    [staticProfileQuery.data]
  );

  const pendingMemoryQuery = trpc.oriel.memory.listPendingCandidates.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );
  const acceptedMemoryQuery = trpc.oriel.memory.listAccepted.useQuery(
    { limit: 10 },
    { enabled: isAuthenticated }
  );
  const acceptMemoryMutation = trpc.oriel.memory.acceptCandidate.useMutation({
    onSuccess: refreshMemoryConsent,
  });
  const rejectMemoryMutation = trpc.oriel.memory.rejectCandidate.useMutation({
    onSuccess: refreshMemoryConsent,
  });
  const recomputeStaticProfileMutation =
    trpc.profile.recomputeStaticProfile.useMutation({
      onSuccess: () => {
        setRecomputeStatus(
          "Static Signature recalculated from exact ephemeris."
        );
        staticProfileQuery.refetch();
        sigilQuery.refetch();
      },
      onError: error => {
        setRecomputeStatus(
          error.message || "Static Signature recalculation failed."
        );
      },
    });

  useEffect(() => {
    if (!loading && !isAuthenticated) setLocation("/");
  }, [isAuthenticated, loading, setLocation]);

  if (loading) {
    return (
      <Layout>
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <Spinner size={24} label="Initializing conduit" />
          <div
            style={{
              fontFamily: "var(--font-ritual)",
              fontSize: 10,
              color: C.txtD,
              letterSpacing: "0.2em",
            }}
          >
            INITIALIZING CONDUIT...
          </div>
        </div>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) return null;

  const conduitId =
    (user as any).conduitId ||
    `ORIEL-${user.id}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

  // Fractal identity
  const fractalRole = sigilQuery.data?.fractalRole || null;
  const vrcType = sigilQuery.data?.vrcType || null;
  const vrcAuthority = sigilQuery.data?.vrcAuthority || null;
  const lumens = sigilQuery.data?.lumens ?? 0;
  const readingCount = sigilQuery.data?.readingCount ?? 0;
  const identity = getFractalIdentity(fractalRole || vrcType);
  const blueprintPrimeStack = Array.isArray(staticProfileQuery.data?.primeStack)
    ? (staticProfileQuery.data.primeStack as PrimeStackEntry[])
    : [];
  const blueprintPrime = blueprintPrimeStack[0];
  const currentAlignmentState = coherenceState(
    currentResonanceQuery.data?.carrierlock?.coherenceScore
  );
  const currentCoherenceScore =
    typeof currentResonanceQuery.data?.carrierlock?.coherenceScore === "number"
      ? currentResonanceQuery.data.carrierlock.coherenceScore
      : null;

  const handleCopy = () => {
    try {
      navigator.clipboard.writeText(conduitId).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const FEATURES = [
    {
      name: "SIGNAL CHECK",
      desc: "Run the current coherence calibration before entering the Static Signature flow.",
    },
    {
      name: "STATIC SIGNATURE",
      desc: "Receiver architecture, Codons, Centers, and authority records",
    },
    {
      name: "FOUNDER BLUEPRINT",
      desc: "The founder-curated paid blueprint prepared from the Static Signature.",
    },
    {
      name: "ORIEL HISTORY",
      desc: "Accepted memory traces and context preserved for this receiver node.",
    },
  ];

  return (
    <Layout>
      <div
        className="receiver-node-shell receiver-node-shell--living"
        style={{ minHeight: "100vh", padding: "0 24px 120px" }}
      >
        <div
          className="receiver-node-container"
          style={{ maxWidth: 1280, margin: "0 auto" }}
        >
          {/* Shared header band replaces the ad-hoc kicker (spec §13).
              width="100%" so it fills the chamber container and aligns with
              the panels below. */}
          <PageHeaderBand
            title="PROFILE"
            descriptor="RECEIVER NODE"
            symbol="node"
            width="100%"
          />

          <IdentityChamber
            userName={user.name || "Receiver"}
            conduitId={conduitId}
            copied={copied}
            onCopy={handleCopy}
            identity={identity}
            fractalRole={fractalRole}
            vrcType={vrcType}
            vrcAuthority={vrcAuthority}
            primeCodon={blueprintPrime}
            lumens={lumens}
            readingCount={readingCount}
            currentResonance={currentResonanceQuery.data}
          />

          {/* ─── THE RESONANCE BODY (centerpiece) ─────────────────────
              The user's body rendered as a living point-mesh with the 9
              Centers of Photonic Resonance. Click a center for its reading.
              Driven by the real signature (ninecenters); 2D canvas, no WebGL. */}
          <div style={{ marginBottom: 18 }}>
            <ChamberPanel eyebrow="SIGNAL BODY" title="Resonance Body" accent>
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  height: 620,
                  border: `1px solid ${C.gold}15`,
                  background: "#08080c",
                  overflow: "hidden",
                }}
              >
                <Suspense fallback={null}>
                  <ResonanceBody centers={bodyCenters} />
                </Suspense>
              </div>
            </ChamberPanel>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))",
              gap: 18,
              marginBottom: 18,
            }}
          >
            <DailyAlignmentPanel
              currentResonance={currentResonanceQuery.data}
              loading={currentResonanceQuery.isLoading}
            />
            <CodonMandala primeStack={blueprintPrimeStack} />
          </div>

          {/* ─── SECTIONS ─────────────────────────────────────────── */}
          <div
            style={{
              background: C.border,
              display: "flex",
              flexDirection: "column",
              gap: 1,
            }}
          >
            <Section title="RECEIVER LEDGER">
              <Field label="USERNAME" value={user.name || "UNKNOWN"} accent />
              <Field
                label="EMAIL ADDRESS"
                value={user.email || "UNREGISTERED"}
              />
              <div
                style={{
                  paddingLeft: 16,
                  borderLeft: `2px solid ${C.gold}40`,
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 9,
                    color: C.txtD,
                    letterSpacing: "0.15em",
                    marginBottom: 6,
                  }}
                >
                  CONDUIT ID
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 12,
                      color: C.gold,
                      wordBreak: "break-all" as const,
                      flex: 1,
                    }}
                  >
                    {conduitId}
                  </span>
                  <button
                    onClick={handleCopy}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      color: copied ? C.green : C.txtD,
                      flexShrink: 0,
                    }}
                  >
                    {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                  </button>
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-ritual)",
                    fontSize: 9,
                    color: C.txtD,
                    marginTop: 4,
                  }}
                >
                  Your unique identifier in the Resonance Circle
                </div>
              </div>
              <Field label="SYSTEM ID" value={`#${user.id}`} />
            </Section>

            <Section title="SIGNAL LEDGER" accentBorder>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <MetricTile
                  label="LUMENS"
                  value={lumens.toLocaleString()}
                  note="Symbolic participation trace only. No tiers, no locks, no feature gates."
                  accent
                />
                <MetricTile
                  label="READINGS ARCHIVED"
                  value={readingCount.toLocaleString()}
                  note="Stored dynamic/static reading activity that contributes to the symbolic trace."
                />
                <MetricTile
                  label="STATIC SIGNATURE"
                  value={staticProfileQuery.data ? "ANCHORED" : "AWAITING"}
                  note="The immutable receiver blueprint used by the Profile chamber."
                />
                <MetricTile
                  label="CURRENT COHERENCE"
                  value={
                    currentCoherenceScore === null
                      ? currentAlignmentState.label
                      : `${currentCoherenceScore}/100 · ${currentAlignmentState.label}`
                  }
                  note="Pulled from Current Resonance / Carrierlock when available."
                  accent={currentAlignmentState.label === "ALIGNED"}
                />
              </div>
              <div
                style={{
                  padding: "14px 16px",
                  border: `1px solid ${C.border}`,
                  background: "rgba(255,255,255,0.015)",
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  color: C.txtS,
                  lineHeight: 1.8,
                }}
              >
                Lumens are restored here as a future-ready signal ledger, not as
                an economy, tier, or access mechanism. If a Lumens economy is
                designed later, this block can become its transparent archive
                surface without changing Profile access.
              </div>
            </Section>

            <div id="blueprint">
              <Section title="STATIC SIGNATURE ARCHIVE" accentBorder>
                {staticProfileQuery.isLoading ? (
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 10,
                      color: C.txtD,
                      letterSpacing: "0.12em",
                    }}
                  >
                    LOADING STATIC SIGNATURE…
                  </div>
                ) : staticProfileQuery.data ? (
                  <>
                    <Field
                      label="NATAL ORIGIN"
                      value={`${staticProfileQuery.data.birthDate} · ${staticProfileQuery.data.birthTime} · ${staticProfileQuery.data.birthCity}, ${staticProfileQuery.data.birthCountry}`}
                      accent
                    />
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr",
                        gap: 16,
                        marginBottom: 20,
                      }}
                    >
                      <Field
                        label="VRC TYPE"
                        value={staticProfileQuery.data.vrcType || "UNKNOWN"}
                        accent
                      />
                      <Field
                        label="VRC AUTHORITY"
                        value={
                          staticProfileQuery.data.vrcAuthority ||
                          staticProfileQuery.data.authorityNode ||
                          "UNKNOWN"
                        }
                      />
                    </div>
                    <Field
                      label="FRACTAL ROLE"
                      value={staticProfileQuery.data.fractalRole || "UNKNOWN"}
                    />
                    <Field
                      label="PRIME CODON"
                      value={
                        blueprintPrime
                          ? `${blueprintPrime.codonName || "UNKNOWN"} · Codon ${blueprintPrime.codon ?? "?"} · ${blueprintPrime.center || "Unknown center"}`
                          : "UNAVAILABLE"
                      }
                    />
                    <div style={{ marginTop: 20 }}>
                      <div
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 9,
                          color: C.txtD,
                          letterSpacing: "0.15em",
                          marginBottom: 10,
                        }}
                      >
                        STATIC TRANSMISSION
                      </div>
                      <div
                        style={{
                          padding: "16px",
                          background: C.surface,
                          border: `1px solid ${C.border}`,
                          fontFamily: "var(--font-ritual)",
                          fontSize: 10,
                          color: C.txtS,
                          lineHeight: 1.9,
                          whiteSpace: "pre-wrap" as const,
                        }}
                      >
                        {staticProfileQuery.data.diagnosticTransmission ||
                          "No stored transmission available."}
                      </div>
                    </div>
                    <div style={{ marginTop: 18 }}>
                      <div
                        style={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 10,
                          alignItems: "center",
                        }}
                      >
                        <Link href="/signature">
                          <span
                            style={{
                              display: "inline-block",
                              padding: "10px 16px",
                              border: `1px solid ${C.goldDim}`,
                              color: C.gold,
                              fontFamily: "var(--font-ritual)",
                              fontSize: 10,
                              letterSpacing: "0.14em",
                              cursor: "pointer",
                            }}
                          >
                            OPEN FULL STATIC SIGNATURE
                          </span>
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setRecomputeStatus(null);
                            recomputeStaticProfileMutation.mutate();
                          }}
                          disabled={recomputeStaticProfileMutation.isPending}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 8,
                            padding: "10px 16px",
                            border: `1px solid ${C.amberDim}`,
                            background: "transparent",
                            color: C.amber,
                            fontFamily: "var(--font-ritual)",
                            fontSize: 10,
                            letterSpacing: "0.14em",
                            cursor: recomputeStaticProfileMutation.isPending
                              ? "wait"
                              : "pointer",
                            opacity: recomputeStaticProfileMutation.isPending
                              ? 0.65
                              : 1,
                          }}
                        >
                          {recomputeStaticProfileMutation.isPending ? (
                            <Spinner size={13} label="Recalculating" />
                          ) : (
                            <Zap size={13} />
                          )}
                          {recomputeStaticProfileMutation.isPending
                            ? "RECALCULATING"
                            : "REGENERATE EXACT PROFILE"}
                        </button>
                      </div>
                      {recomputeStatus && (
                        <div
                          style={{
                            marginTop: 10,
                            fontFamily: "var(--font-ritual)",
                            fontSize: 9,
                            color: recomputeStaticProfileMutation.isError
                              ? C.red
                              : C.amber,
                            letterSpacing: "0.08em",
                          }}
                        >
                          {recomputeStatus}
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div
                    style={{
                      fontFamily: "var(--font-ritual)",
                      fontSize: 10,
                      color: C.txtD,
                      lineHeight: 1.8,
                    }}
                  >
                    No Static Signature has been stored yet. Complete the
                    onboarding flow to anchor the canonical static profile.
                  </div>
                )}
              </Section>
            </div>

            <Section title="ORIEL MEMORY">
              <MemoryConsentTray
                pendingCandidates={pendingMemoryQuery.data ?? []}
                acceptedMemories={acceptedMemoryQuery.data ?? []}
                onAccept={id => acceptMemoryMutation.mutate({ id })}
                onReject={id => rejectMemoryMutation.mutate({ id })}
                isLoading={
                  pendingMemoryQuery.isLoading ||
                  acceptedMemoryQuery.isLoading ||
                  acceptMemoryMutation.isPending ||
                  rejectMemoryMutation.isPending
                }
                className="border-[#bda36b]/20 bg-[#0a0a0e]/60"
              />
            </Section>

            <Section title="NODE OPERATIONS">
              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {FEATURES.map(f => (
                  <div
                    key={f.name}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        marginTop: 2,
                        width: 12,
                        height: 12,
                        flexShrink: 0,
                        border: `1px solid ${C.amber}`,
                        background: C.amber,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 10,
                          color: C.amber,
                          letterSpacing: "0.08em",
                          marginBottom: 2,
                        }}
                      >
                        {f.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "var(--font-ritual)",
                          fontSize: 9,
                          color: C.txtD,
                        }}
                      >
                        {f.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* Support CTA */}
            <Section title="SIGNAL SUPPORT">
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontFamily: "var(--font-display)",
                    fontSize: 14,
                    color: C.txtS,
                    lineHeight: 1.9,
                    margin: 0,
                  }}
                >
                  The Conduit Hub is sustained by the collective resonance of
                  its nodes. Your support directly powers the ORIEL transmission
                  and the ongoing translation of the Vossari signal.
                </p>
              </div>

              <form
                action="https://www.paypal.com/donate"
                method="post"
                target="_top"
                style={{ display: "inline-block" }}
              >
                <input
                  type="hidden"
                  name="hosted_button_id"
                  value="QLVQDRKWM4A7N"
                />
                <button
                  type="submit"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 28px",
                    background: "transparent",
                    border: `1px solid ${C.gold}60`,
                    color: C.gold,
                    fontFamily: "var(--font-ritual)",
                    fontSize: 10,
                    letterSpacing: "0.15em",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                >
                  <Zap size={14} />
                  SUPPORT THE SIGNAL
                </button>
              </form>
            </Section>
          </div>

          {/* Quick Links */}
          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <Link href="/signal/check">
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  border: `1px solid ${C.amberDim}`,
                  color: C.amber,
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                RUN SIGNAL CHECK
              </span>
            </Link>
            <Link href="/signature">
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  border: `1px solid ${C.goldDim}`,
                  color: C.gold,
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                VIEW STATIC SIGNATURE
              </span>
            </Link>
            <Link href="/founder-signature-blueprint">
              <span
                style={{
                  display: "inline-block",
                  padding: "8px 20px",
                  border: `1px solid ${C.border}`,
                  color: C.txtS,
                  fontFamily: "var(--font-ritual)",
                  fontSize: 10,
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                }}
              >
                GET FOUNDER BLUEPRINT
              </span>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}
