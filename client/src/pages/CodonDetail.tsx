import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft,
  Moon,
  Diamond,
  Infinity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Zap,
  Link2,
} from "lucide-react";
import { useState, useEffect } from "react";
import Layout from "@/components/Layout";
import CodonGlyph from "@/components/CodonGlyph";
import { Spinner } from "@/components/ui/spinner";

// Facet letter → display name
const FACET_LABELS: Record<string, string> = {
  A: "Somatic",
  B: "Relational",
  C: "Cognitive",
  D: "Transpersonal",
};

// Facet letter → colour tokens (HUD palette)
const FACET_COLORS: Record<
  string,
  { border: string; text: string; bg: string; pill: string }
> = {
  A: {
    border: "border-[#f6b05e]/40",
    text: "text-[#f6b05e]",
    bg: "bg-[#f6b05e]/5",
    pill: "bg-[#f6b05e]/15 text-[#f6b05e]",
  },
  B: {
    border: "border-[#bda36b]/40",
    text: "text-[#bda36b]",
    bg: "bg-[#bda36b]/5",
    pill: "bg-[#bda36b]/15 text-[#bda36b]",
  },
  C: {
    border: "border-[#f6b05e]/30",
    text: "text-[#7ec0c0]",
    bg: "bg-[#f6b05e]/4",
    pill: "bg-[#f6b05e]/10 text-[#7ec0c0]",
  },
  D: {
    border: "border-[#bda36b]/30",
    text: "text-[#d4c090]",
    bg: "bg-[#bda36b]/4",
    pill: "bg-[#bda36b]/10 text-[#d4c090]",
  },
};

const FACET_ORDER = ["A", "B", "C", "D"] as const;

type BlueprintPrimePosition = {
  position: number;
  name: string;
  source: string;
  codon: number | null;
  codonName: string;
  facet: string;
  facetFull: string;
  center: string;
  planetaryBody: string;
};

function normalizeCodonNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const cleaned = value.replace(/^RC/i, "").replace(/-[A-Da-d]$/, "");
    const parsed = parseInt(cleaned, 10);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeBlueprintPrimeStack(
  value: unknown
): BlueprintPrimePosition[] {
  if (!Array.isArray(value)) return [];

  return value
    .map(entry => {
      if (!entry || typeof entry !== "object") return null;
      const row = entry as Record<string, unknown>;
      return {
        position: typeof row.position === "number" ? row.position : 0,
        name: typeof row.name === "string" ? row.name : "Position",
        source: typeof row.source === "string" ? row.source : "unknown",
        codon: normalizeCodonNumber(row.codon),
        codonName:
          typeof row.codonName === "string" ? row.codonName : "Unknown Codon",
        facet: typeof row.facet === "string" ? row.facet : "",
        facetFull: typeof row.facetFull === "string" ? row.facetFull : "",
        center: typeof row.center === "string" ? row.center : "Unknown Center",
        planetaryBody:
          typeof row.planetaryBody === "string" ? row.planetaryBody : "Unknown",
      };
    })
    .filter((entry): entry is BlueprintPrimePosition =>
      Boolean(entry && entry.codon)
    );
}

function polarPoint(cx: number, cy: number, radius: number, angleDeg: number) {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(angleRad),
    y: cy + radius * Math.sin(angleRad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  radius: number,
  startAngle: number,
  endAngle: number
) {
  const adjustedEnd = endAngle <= startAngle ? endAngle + 360 : endAngle;
  const start = polarPoint(cx, cy, radius, adjustedEnd);
  const end = polarPoint(cx, cy, radius, startAngle);
  const largeArcFlag = adjustedEnd - startAngle > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`;
}

function MandalaLocator({
  slotIndex,
  startDegree,
  endDegree,
  activeFacet,
  facetArc,
}: {
  slotIndex: number;
  startDegree: number;
  endDegree: number;
  activeFacet: string;
  facetArc: number;
}) {
  const facetIndex = Math.max(
    0,
    FACET_ORDER.indexOf((activeFacet as (typeof FACET_ORDER)[number]) || "A")
  );
  const facetStart = startDegree + facetIndex * facetArc;
  const facetEnd = facetStart + facetArc;
  const wheelOffset = startDegree - slotIndex * 5.625;

  return (
    <svg viewBox="0 0 180 180" className="w-full max-w-[220px] h-auto">
      <circle
        cx="90"
        cy="90"
        r="70"
        fill="none"
        stroke="rgba(255,255,255,0.05)"
        strokeWidth="1"
      />
      <circle
        cx="90"
        cy="90"
        r="54"
        fill="none"
        stroke="rgba(255,255,255,0.03)"
        strokeWidth="1"
      />

      {Array.from({ length: 64 }, (_, index) => {
        const angle = wheelOffset + index * 5.625;
        const outer = polarPoint(90, 90, 76, angle);
        const inner = polarPoint(90, 90, index === slotIndex ? 60 : 66, angle);
        return (
          <line
            key={index}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
            stroke={
              index === slotIndex
                ? "rgba(0,240,255,0.95)"
                : "rgba(255,255,255,0.12)"
            }
            strokeWidth={index === slotIndex ? 2 : 1}
          />
        );
      })}

      <path
        d={describeArc(90, 90, 70, startDegree, endDegree)}
        fill="none"
        stroke="rgba(0,240,255,0.95)"
        strokeWidth="5"
        strokeLinecap="round"
      />

      {FACET_ORDER.map((facet, index) => {
        const segmentStart = startDegree + index * facetArc;
        const segmentEnd = segmentStart + facetArc;
        const isActive = facet === activeFacet;
        return (
          <path
            key={facet}
            d={describeArc(90, 90, 54, segmentStart, segmentEnd)}
            fill="none"
            stroke={
              isActive ? "rgba(189,163,107,0.95)" : "rgba(255,255,255,0.16)"
            }
            strokeWidth={isActive ? 6 : 3}
            strokeLinecap="round"
          />
        );
      })}

      <circle
        cx="90"
        cy="90"
        r="36"
        fill="rgba(10,10,14,0.98)"
        stroke="rgba(189,163,107,0.18)"
      />
      <text
        x="90"
        y="80"
        textAnchor="middle"
        className="fill-zinc-500 font-mono text-[8px] tracking-[0.35em]"
      >
        SLOT
      </text>
      <text
        x="90"
        y="98"
        textAnchor="middle"
        className="fill-white font-mono text-[18px]"
      >
        {slotIndex + 1}
      </text>
      <text
        x="90"
        y="113"
        textAnchor="middle"
        className="fill-[#bda36b] font-mono text-[9px] tracking-[0.3em]"
      >
        FACET {activeFacet}
      </text>

      <title>{`Mandala slot ${slotIndex + 1}, active facet ${activeFacet}, ${facetStart.toFixed(2)}°-${facetEnd.toFixed(2)}°`}</title>
    </svg>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function CodonDetail() {
  const { user } = useAuth();
  const [, params] = useRoute("/codex/:id");
  const codonId = params?.id || "";

  // Pre-select facet from URL suffix like "38-A"
  const urlFacet = codonId.match(/-([A-Da-d])$/)?.[1]?.toUpperCase() ?? null;
  const [activeTab, setActiveTab] = useState<string>(urlFacet ?? "A");

  // Track expanded collapsible facets
  const [expandedFacets, setExpandedFacets] = useState<Record<string, boolean>>(
    {
      A: urlFacet ? urlFacet === "A" : true,
      B: urlFacet ? urlFacet === "B" : false,
      C: urlFacet ? urlFacet === "C" : false,
      D: urlFacet ? urlFacet === "D" : false,
    }
  );

  // Toggle facet card
  const toggleFacet = (letter: string) => {
    setExpandedFacets(prev => ({
      ...prev,
      [letter]: !prev[letter],
    }));
    setActiveTab(letter);
  };

  // Sync tab and expanded facets if URL-derived facet changes
  useEffect(() => {
    if (urlFacet) {
      setActiveTab(urlFacet);
      setExpandedFacets({
        A: urlFacet === "A",
        B: urlFacet === "B",
        C: urlFacet === "C",
        D: urlFacet === "D",
      });
    }
  }, [codonId, urlFacet]);

  const { data: codon, isLoading } = trpc.codex.getCodonDetails.useQuery(
    { id: codonId },
    { enabled: !!codonId }
  );

  const { data: allCodons } = trpc.codex.getRootCodons.useQuery();
  const staticProfileQuery = trpc.profile.getStaticProfile.useQuery(undefined, {
    enabled: !!user,
  });

  const blueprintPrimeStack = normalizeBlueprintPrimeStack(
    staticProfileQuery.data?.primeStack
  );
  const codonNumber = codon
    ? (codon.numericId ?? parseInt(codon.id.replace("RC", "")))
    : 0;
  const blueprintMatches = codon
    ? blueprintPrimeStack.filter(entry => entry.codon === codonNumber)
    : [];
  const blueprintCenterState = (() => {
    const ninecenters = staticProfileQuery.data?.ninecenters;
    if (!codon?.center || !ninecenters || typeof ninecenters !== "object")
      return null;
    const row = (
      ninecenters as Record<string, { defined?: boolean } | undefined>
    )[codon.center];
    if (!row) return null;
    return row.defined ? "Defined" : "Open";
  })();

  // Related codons: adjacent + harmonic partners
  const getRelatedCodons = () => {
    if (!allCodons || !codon) return [];
    const num = codon.numericId ?? parseInt(codon.id.replace("RC", ""));
    return allCodons
      .filter(c => {
        const n = c.numericId ?? parseInt(c.id.replace("RC", ""));
        return (
          n !== num &&
          (Math.abs(n - num) <= 3 || n === 65 - num || [1, 27, 64].includes(n))
        );
      })
      .slice(0, 6);
  };

  // ── Loading / Error states ────────────────────────────────────────────────
  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <Spinner size={32} label="Loading Codon" />
        </div>
      </Layout>
    );
  }

  if (!codon) {
    return (
      <Layout>
        <div className="min-h-screen bg-black text-zinc-100 flex items-center justify-center">
          <div className="text-center">
            <p className="text-zinc-400 mb-4">Codon not found</p>
            <Link href="/codex">
              <Button
                variant="outline"
                className="border-primary/30 text-primary hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Codex
              </Button>
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const relatedCodons = getRelatedCodons();
  const harmonic = 65 - codonNumber;
  const harmonicCodon = allCodons?.find(
    c => (c.numericId ?? parseInt(c.id.replace("RC", ""))) === harmonic
  );

  // Active facet data
  const activeFacet = (codon.facets as any)?.[activeTab];
  const facetColor = FACET_COLORS[activeTab] ?? FACET_COLORS.A;
  const heroDescription =
    activeFacet?.description ?? codon.facets?.A?.description ?? codon.essence;
  const activeFacetIndex = Math.max(
    0,
    FACET_ORDER.indexOf((activeTab as (typeof FACET_ORDER)[number]) || "A")
  );
  const facetStartDegree =
    typeof codon.startDegree === "number"
      ? codon.startDegree +
        activeFacetIndex *
          (typeof codon.facetArc === "number" ? codon.facetArc : 1.40625)
      : null;
  const facetEndDegree =
    facetStartDegree !== null
      ? facetStartDegree +
        (typeof codon.facetArc === "number" ? codon.facetArc : 1.40625)
      : null;

  const element = (codon.chemical_marker ?? "AETHER").toUpperCase();

  return (
    <Layout>
      <main
        className="min-h-screen"
        style={{ background: "#0a0a0e", color: "#e8e4dc" }}
      >
        <div className="relative z-10 max-w-[1200px] mx-auto px-6 py-8 flex flex-col gap-10">
          {/* Top back button + breadcrumbs row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D4AF37]/15 pb-4">
            <Link href="/codex">
              <span className="inline-flex items-center gap-2 text-xs font-mono text-zinc-400 hover:text-[#D4AF37] transition-colors cursor-pointer tracking-wider uppercase">
                <ArrowLeft size={12} className="text-[#D4AF37]" />
                Return to Codex
              </span>
            </Link>

            <div className="flex items-center gap-2 text-xs">
              <Link
                href="/codex"
                className="text-zinc-500 hover:text-white transition-colors font-mono"
              >
                CODEX
              </Link>
              <span className="text-zinc-600">/</span>
              <span className="text-zinc-500 font-mono">
                {codon.archetype_role?.split(",")[0]?.toUpperCase() ||
                  "RESONANCE"}
              </span>
              <span className="text-zinc-600">/</span>
              <span className="text-[#D4AF37] font-mono tracking-wider font-semibold">
                {codon.id} {codon.name}
              </span>
            </div>
          </div>

          {/* Main Double Panel Blueprint Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Panel - w-28 h-28 Glyph + Guides + Mandala Locator */}
            <div className="lg:col-span-4 flex flex-col gap-6 items-center lg:sticky lg:top-8">
              {/* Glyph Box inside spinning guides */}
              <div className="relative size-64 md:size-80 flex items-center justify-center border border-[#D4AF37]/15 rounded-xl bg-zinc-900/30 p-6">
                <div className="absolute inset-0 border border-dashed border-[#D4AF37]/10 rounded-full animate-spin-slow-60" />
                <div className="absolute inset-4 border border-[#D4AF37]/5 rounded-full animate-spin-slower" />
                <div className="absolute inset-12 border border-[#D4AF37]/10 rounded-full" />
                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center gap-3 p-8">
                  <CodonGlyph
                    codonNumber={codonNumber}
                    className="text-[#D4AF37] drop-shadow-[0_0_18px_rgba(212,175,55,0.4)] w-28 h-28"
                  />
                  <div className="text-sm font-mono font-bold text-[#D4AF37]/80 tracking-widest mt-2">
                    RC{String(codonNumber).padStart(2, "0")}
                  </div>
                </div>
              </div>

              {/* Mandala Locator */}
              {codon.startDegree !== undefined &&
                codon.endDegree !== undefined &&
                codon.mandalaSlot !== undefined && (
                  <div className="w-full max-w-[280px] rounded-xl border border-[#D4AF37]/15 bg-zinc-900/40 backdrop-blur-sm p-4">
                    <div className="text-[10px] font-mono uppercase tracking-[0.24em] text-zinc-500 text-center mb-3">
                      Mandala Locator
                    </div>
                    <div className="flex justify-center">
                      <MandalaLocator
                        slotIndex={codon.mandalaSlot}
                        startDegree={codon.startDegree}
                        endDegree={codon.endDegree}
                        activeFacet={activeTab}
                        facetArc={
                          typeof codon.facetArc === "number"
                            ? codon.facetArc
                            : 1.40625
                        }
                      />
                    </div>
                  </div>
                )}

              {/* Harmonic Partner & Relevance */}
              <div className="w-full flex flex-col gap-4">
                {/* Harmonic Partner */}
                <div className="bg-zinc-900/40 backdrop-blur-sm border border-[#D4AF37]/15 rounded-xl p-5 border-l-4 border-l-[#D4AF37]">
                  <h3 className="text-white font-mono text-[10px] uppercase tracking-widest mb-3 opacity-80">
                    Harmonic Partner
                  </h3>
                  <div className="flex items-center gap-3">
                    <div className="size-10 bg-zinc-800/60 rounded flex items-center justify-center border border-zinc-700">
                      <span className="font-mono font-bold text-zinc-400 text-sm">
                        {harmonic}
                      </span>
                    </div>
                    <div>
                      <p className="text-white font-mono text-xs font-semibold">
                        {harmonicCodon?.name ||
                          `RC${String(harmonic).padStart(2, "0")}`}
                      </p>
                      <p className="text-[9px] text-zinc-500 uppercase tracking-wider">
                        {harmonicCodon?.title || "Complementary Codon"}
                      </p>
                    </div>
                    <Link
                      href={`/codex/${harmonic}`}
                      className="ml-auto text-zinc-400 hover:text-white transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>

                {/* Relevance */}
                <div className="bg-zinc-900/40 backdrop-blur-sm border border-[#D4AF37]/15 rounded-xl p-5">
                  <h3 className="text-white font-mono text-[10px] uppercase tracking-widest mb-3 opacity-80">
                    Signature Relevance
                  </h3>
                  {!user ? (
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      Sign in to see this Codon's presence in your Prime Stack.
                    </p>
                  ) : staticProfileQuery.isLoading ? (
                    <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                      <Spinner size={12} label="Checking..." />
                      Checking...
                    </div>
                  ) : blueprintMatches.length > 0 ? (
                    <div className="flex flex-col gap-3">
                      <div className="inline-flex items-center justify-center gap-1.5 px-2.5 py-0.5 rounded-full border border-emerald-500/20 bg-emerald-500/5 text-emerald-400 text-[9px] font-mono uppercase tracking-wider">
                        Active in Signature
                      </div>
                      <div className="flex flex-col gap-2">
                        {blueprintMatches.map((entry, idx) => (
                          <div
                            key={idx}
                            className="rounded border border-[#D4AF37]/10 bg-black/10 p-2.5 text-[11px]"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-white font-mono uppercase font-semibold">
                                Position {entry.position}
                              </span>
                              <span className="text-[#D4AF37] font-mono text-[9px] uppercase">
                                {entry.facetFull || entry.facet}
                              </span>
                            </div>
                            <p className="text-zinc-400 mt-1">
                              {entry.name} · {entry.planetaryBody}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-zinc-500">
                      Not active in your current Prime Stack.
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right Panel - Specifications & Facets */}
            <div className="lg:col-span-8 flex flex-col gap-6">
              {/* Specification Header block */}
              <div className="border border-[#D4AF37]/15 rounded-xl bg-zinc-900/20 p-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#D4AF37]/10 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-[#D4AF37] tracking-[0.2em] uppercase block mb-1">
                      SPECIFICATION MANUAL
                    </span>
                    <h2 className="text-3xl font-mono tracking-wider text-white font-bold uppercase">
                      {codon.id} · {codon.name}
                    </h2>
                    {codon.traditional_name && (
                      <p className="text-zinc-400 font-serif italic text-sm mt-0.5">
                        Traditional I Ching: {codon.traditional_name}
                      </p>
                    )}
                  </div>
                  {/* Meta badges */}
                  <div className="flex flex-wrap gap-2 items-center">
                    {codon.center && (
                      <span className="bg-zinc-800/80 border border-[#D4AF37]/30 rounded px-2 py-0.5 text-[10px] font-mono text-[#D4AF37]">
                        {codon.center.toUpperCase()}
                      </span>
                    )}
                    {codon.binary && (
                      <span className="bg-zinc-800/80 border border-zinc-700 rounded px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                        {codon.binary}
                      </span>
                    )}
                    {codon.chemical_marker && (
                      <span className="bg-zinc-800/80 border border-zinc-700 rounded px-2 py-0.5 text-[10px] font-mono text-zinc-300">
                        {codon.chemical_marker}
                      </span>
                    )}
                  </div>
                </div>

                {/* Essence description */}
                <div className="text-sm text-zinc-300 leading-relaxed font-serif">
                  {codon.essence}
                </div>

                {/* Key attributes row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-xs">
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      ARCHETYPE ROLE
                    </span>
                    <span className="text-zinc-200 font-mono font-medium">
                      {codon.archetype_role || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      SOMATIC MARKER
                    </span>
                    <span className="text-zinc-200 font-mono font-medium">
                      {codon.somatic_marker || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      WINDOW RANGE
                    </span>
                    <span className="text-zinc-200 font-mono font-medium">
                      {codon.startDegree?.toFixed(1)}° -{" "}
                      {codon.endDegree?.toFixed(1)}°
                    </span>
                  </div>
                  <div>
                    <span className="text-[9px] font-mono text-zinc-500 uppercase block">
                      MANDALA SLOT
                    </span>
                    <span className="text-zinc-200 font-mono font-medium">
                      {codon.mandalaSlot !== undefined
                        ? codon.mandalaSlot + 1
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── RESONANCE SPECTRUM (Shadow, Gift, Siddhi) ── */}
              <div className="border border-[#D4AF37]/15 rounded-xl bg-zinc-900/20 p-6 flex flex-col gap-4">
                <h3 className="text-white font-mono text-xs uppercase tracking-widest border-b border-[#D4AF37]/10 pb-2">
                  Resonance Spectrum
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Shadow */}
                  <div className="bg-zinc-950/40 border border-red-500/10 rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider">
                      <span>Shadow</span>
                      <Moon size={12} />
                    </div>
                    <span className="text-white font-serif text-sm font-semibold">
                      {codon.frequency?.shadow || codon.shadow}
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {codon.frequency?.shadow_desc ||
                        "Distorted operational frequency."}
                    </p>
                  </div>
                  {/* Gift */}
                  <div className="bg-zinc-950/40 border border-[#D4AF37]/25 rounded-lg p-4 flex flex-col gap-2 shadow-[0_0_15px_rgba(212,175,55,0.05)]">
                    <div className="flex justify-between items-center text-[10px] font-mono text-[#D4AF37] font-bold uppercase tracking-wider">
                      <span>Gift</span>
                      <Diamond size={12} />
                    </div>
                    <span className="text-white font-serif text-sm font-semibold">
                      {codon.frequency?.gift || codon.gift}
                    </span>
                    <p className="text-[11px] text-zinc-300 leading-relaxed">
                      {codon.frequency?.gift_desc ||
                        "Functional operational frequency."}
                    </p>
                  </div>
                  {/* Siddhi */}
                  <div className="bg-zinc-950/40 border border-emerald-500/10 rounded-lg p-4 flex flex-col gap-2">
                    <div className="flex justify-between items-center text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider">
                      <span>Siddhi</span>
                      <Infinity size={12} />
                    </div>
                    <span className="text-white font-serif text-sm font-semibold">
                      {codon.frequency?.siddhi || codon.crown}
                    </span>
                    <p className="text-[11px] text-zinc-400 leading-relaxed">
                      {codon.frequency?.siddhi_desc ||
                        "Transcendent operational frequency."}
                    </p>
                  </div>
                </div>
              </div>

              {/* ── COLLAPSIBLE FACET CARDS ── */}
              <div className="flex flex-col gap-3">
                <h3 className="text-white font-mono text-xs uppercase tracking-widest mb-1 pl-1">
                  Resonance Facets
                </h3>
                {(["A", "B", "C", "D"] as const).map(letter => {
                  const facetData = (codon.facets as any)?.[letter];
                  if (!facetData) return null;
                  const label = FACET_LABELS[letter];
                  const fc = FACET_COLORS[letter] ?? FACET_COLORS.A;
                  const isExpanded = expandedFacets[letter];

                  // Localized window calculation for this facet
                  const localIndex = FACET_ORDER.indexOf(letter);
                  const localStart =
                    typeof codon.startDegree === "number"
                      ? codon.startDegree +
                        localIndex *
                          (typeof codon.facetArc === "number"
                            ? codon.facetArc
                            : 1.40625)
                      : null;
                  const localEnd =
                    localStart !== null
                      ? localStart +
                        (typeof codon.facetArc === "number"
                          ? codon.facetArc
                          : 1.40625)
                      : null;

                  return (
                    <div
                      key={letter}
                      className={`border rounded-xl transition-all duration-300 ${
                        isExpanded
                          ? `${fc.border} ${fc.bg}`
                          : "border-zinc-800 bg-zinc-900/10 hover:border-zinc-700"
                      }`}
                    >
                      {/* Card Header (clickable toggle) */}
                      <button
                        onClick={() => toggleFacet(letter)}
                        className="w-full flex items-center justify-between p-4 font-mono text-xs tracking-wider uppercase text-left transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-2.5">
                          <span
                            className={`size-2 rounded-full ${isExpanded ? "bg-current animate-pulse" : "bg-zinc-700"} ${fc.text}`}
                          />
                          <span
                            className={`font-bold ${isExpanded ? fc.text : "text-zinc-300"}`}
                          >
                            {label} · Facet {letter}
                          </span>
                          {facetData.title && (
                            <span className="text-[10px] text-zinc-500 normal-case hidden sm:inline">
                              — {facetData.title}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          {localStart !== null && localEnd !== null && (
                            <span className="text-[10px] text-zinc-500 lowercase">
                              {localStart.toFixed(1)}°-{localEnd.toFixed(1)}°
                            </span>
                          )}
                          <ChevronRight
                            size={14}
                            className={`text-zinc-500 transition-transform duration-300 ${isExpanded ? "rotate-90 text-white" : ""}`}
                          />
                        </div>
                      </button>

                      {/* Card Expandable Body */}
                      {isExpanded && (
                        <div className="px-6 pb-6 pt-2 border-t border-zinc-800/40 flex flex-col gap-5">
                          {facetData.title && (
                            <div className="text-xs font-mono uppercase tracking-wider text-zinc-400">
                              Archetype: {facetData.title}
                            </div>
                          )}
                          <p className="text-zinc-300 text-sm leading-relaxed font-serif">
                            {facetData.description}
                          </p>

                          {/* Resonance Keys */}
                          {facetData.resonance_keys?.length > 0 && (
                            <div>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">
                                Resonance Keys
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {facetData.resonance_keys.map((key: string) => (
                                  <span
                                    key={key}
                                    className={`px-2.5 py-0.5 rounded text-[10px] font-mono border ${fc.pill}`}
                                  >
                                    {key}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Shadow Warning & Micro-Correction Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Shadow Warning */}
                            {facetData.shadow_manifestation && (
                              <div className="rounded-lg p-4 border border-red-500/15 bg-red-950/5 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-red-400 text-[10px] font-mono uppercase tracking-wider font-bold">
                                  <AlertTriangle size={12} />
                                  <span>Shadow Manifestation</span>
                                </div>
                                <p className="text-zinc-300 text-xs leading-relaxed">
                                  {facetData.shadow_manifestation}
                                </p>
                              </div>
                            )}

                            {/* Micro-Correction */}
                            {facetData.micro_correction && (
                              <div className="rounded-lg p-4 border border-[#D4AF37]/20 bg-[#D4AF37]/5 flex flex-col justify-between gap-3">
                                <div className="flex flex-col gap-2">
                                  <div className="flex items-center gap-2 text-[#D4AF37] text-[10px] font-mono uppercase tracking-wider font-bold">
                                    <CheckCircle2 size={12} />
                                    <span>Micro-Correction</span>
                                  </div>
                                  <p className="text-zinc-300 text-xs leading-relaxed">
                                    {facetData.micro_correction}
                                  </p>
                                </div>
                                <Link href="/signature">
                                  <button className="w-full mt-1 border border-[#D4AF37]/30 hover:border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 py-1.5 rounded text-[10px] font-mono uppercase tracking-wider transition-all cursor-pointer">
                                    Run Carrierlock Diagnostic
                                  </button>
                                </Link>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Related Archetypes */}
          <section className="border-t border-[#D4AF37]/15 pt-8 pb-16">
            <h3 className="text-white font-mono text-xs uppercase tracking-[0.2em] mb-6 pl-1 opacity-80">
              Related Resonance Links (Harmonic & Proximity partners)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {relatedCodons.map(related => {
                const n =
                  related.numericId ?? parseInt(related.id.replace("RC", ""));
                return (
                  <Link
                    key={related.id}
                    href={`/codex/${n}`}
                    className="group bg-zinc-950/40 backdrop-blur-sm border border-[#D4AF37]/15 p-4 rounded-xl hover:border-[#D4AF37]/45 transition-all cursor-pointer flex flex-col justify-between min-h-[110px]"
                  >
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-[10px] font-mono text-zinc-500 group-hover:text-[#D4AF37] transition-colors">
                          {related.id}
                        </span>
                        <span className="size-1.5 rounded-full bg-zinc-800 group-hover:bg-[#D4AF37] transition-colors" />
                      </div>
                      <p className="text-white font-mono text-xs font-semibold group-hover:text-white">
                        {related.name}
                      </p>
                      {related.title && (
                        <p className="text-zinc-500 text-[9px] italic mt-1 leading-normal line-clamp-2">
                          {related.title}
                        </p>
                      )}
                    </div>
                    <span className="text-[9px] font-mono text-zinc-600 group-hover:text-zinc-400 mt-2 block transition-colors text-right text-[8px]">
                      view specifications →
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <footer
          className="py-12"
          style={{
            borderTop: "1px solid rgba(189,163,107,0.12)",
            background: "rgba(15,15,21,0.6)",
          }}
        >
          <div className="max-w-[1200px] mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
            <div
              className="flex items-center gap-3"
              style={{ opacity: 0.5, color: "#bda36b" }}
            >
              <Zap className="w-5 h-5" />
              <span className="font-mono text-sm tracking-wider">
                VOSS ARIEL FIELD ARCHIVE
              </span>
            </div>
            <div className="flex gap-8 text-sm" style={{ color: "#6a665e" }}>
              <Link
                href="/protocol"
                className="hover:opacity-80 transition-opacity"
                style={{ color: "#f6b05e" }}
              >
                Protocol
              </Link>
              <Link
                href="/signature"
                className="hover:opacity-80 transition-opacity"
                style={{ color: "#f6b05e" }}
              >
                Diagnostics
              </Link>
              <Link
                href="/founder-signature-blueprint"
                className="hover:opacity-80 transition-opacity"
                style={{ color: "#f6b05e" }}
              >
                Oriel Signature Blueprint
              </Link>
            </div>
            <div className="text-xs font-mono" style={{ color: "#6a665e" }}>
              VRC v1.0 — Engine Constants Loaded
            </div>
          </div>
        </footer>
      </main>
    </Layout>
  );
}
