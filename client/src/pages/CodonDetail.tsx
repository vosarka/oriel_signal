import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft,
  Moon,
  Diamond,
  Infinity,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useState, useEffect } from "react";
import CodonGlyph from "@/components/CodonGlyph";
import { Spinner } from "@/components/ui/spinner";
import {
  SignalPageShell,
  DecodedTitle,
} from "@/components/oriel-signal/OrielSignalDesign";


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

// Soft rainy gradient generator — unique combination per codon
// Uses codon number + binary for deterministic, harmonious cool rainy tones.
function generateSoftRainGradient(codonNumber: number, binary: string, center?: string | null) {
  const bitCount = [...(binary || "")].reduce((sum, bit) => sum + (bit === "1" ? 1 : 0), 0);
  // Rainy palette base: cool blues, teals, slate — desaturated and atmospheric
  const hueBase = 198 + ((codonNumber * 3.7 + bitCount * 1.8) % 52);
  const sat = 11 + (bitCount % 9);
  const light = 7 + (codonNumber % 7);

  const c1 = `hsl(${hueBase.toFixed(1)}, ${sat}%, ${light}%)`;
  const c2 = `hsl(${(hueBase + 7 + (bitCount % 5)).toFixed(1)}, ${sat + 4}%, ${light + 6}%)`;
  const c3 = `hsl(${(hueBase + 16) % 360}, ${sat + 1}%, ${light + 10}%)`;

  // Soft diagonal "rainy sky" direction
  return `linear-gradient(158deg, ${c1} 0%, ${c2} 46%, ${c3} 100%)`;
}

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
      <SignalPageShell chamber="codex" className="arkana-layer profile-layer">
        <div className="arkana-layer__inner flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Spinner size={24} label="Loading codon" />
            <div className="font-mono text-[10px] tracking-[0.2em] text-[var(--oriel-dim)]">RESONANCE KEY • LOADING</div>
          </div>
        </div>
      </SignalPageShell>
    );
  }

  if (!codon) {
    return (
      <SignalPageShell chamber="codex" className="arkana-layer profile-layer">
        <div className="arkana-layer__inner">
          <Link href="/codex" className="arkana-layer__back inline-flex items-center gap-2">
            <ArrowLeft size={12} /> RETURN TO FIELD INDEX
          </Link>
          <div className="mt-12 text-center">
            <p className="text-[var(--oriel-dim)]">Codon signal not found in the lattice.</p>
            <Link href="/codex" className="mt-4 inline-block text-sm underline">Back to Codex</Link>
          </div>
        </div>
      </SignalPageShell>
    );
  }

  const relatedCodons = getRelatedCodons();
  const harmonic = 65 - codonNumber;
  const harmonicCodon = allCodons?.find(
    c => (c.numericId ?? parseInt(c.id.replace("RC", ""))) === harmonic
  );

  const pad = (n: number) => String(n).padStart(2, "0");
  const iconSrc = `/symbols/RC${pad(codonNumber)}.png`;

  return (
    <SignalPageShell chamber="codex" className="arkana-layer profile-layer">
      <div className="arkana-layer__inner">
        {/* Header matching Profile */}
        <header className="arkana-layer__head profile-layer__head">
          <Link href="/codex" className="arkana-layer__back mb-3 inline-flex items-center gap-2">
            <ArrowLeft size={12} /> RETURN TO FIELD INDEX
          </Link>

          <DecodedTitle
            text={`${codon.id} · ${codon.name}`}
            className="arkana-layer__title"
          />
          {codon.essence && (
            <p className="arkana-layer__subtitle max-w-[72ch]">{codon.essence}</p>
          )}

          <div className="profile-layer__meta mt-3">
            {codon.center && <span>CENTER <strong>{codon.center}</strong></span>}
            {codon.archetype_role && <span>ROLE <strong>{codon.archetype_role.split(",")[0]}</strong></span>}
            {codon.binary && <span>BINARY <strong>{codon.binary}</strong></span>}
            {codon.chemical_marker && <span>MARKER <strong>{codon.chemical_marker}</strong></span>}
          </div>
        </header>

        {/* Central Hero Viz — Hexagonal nodes + Codon Icon in the center */}
        {/* Soft rainy gradient background — unique color combination per codon */}
        <section
          className="profile-layer__body-field codon-hero relative overflow-hidden"
          aria-label="Codon resonance glyph with central icon"
          style={{ background: generateSoftRainGradient(codonNumber, codon.binary || "000000", codon.center) }}
        >
          {/* Soft rain texture streaks */}
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              background: `repeating-linear-gradient(
                to bottom,
                transparent 0%,
                transparent 3%,
                rgba(195, 215, 240, 0.045) 3.3%,
                rgba(195, 215, 240, 0.022) 4.1%,
                transparent 4.8%
              )`,
            }}
          />

          {/* Very soft atmospheric light wash from top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 50% 20%, rgba(210,225,245,0.07) 0%, transparent 55%)",
            }}
          />

          <div className="relative z-10 flex h-full w-full items-center justify-center">
            <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
              {/* Hexagonal nodes (kept) */}
              <CodonGlyph
                codonNumber={codonNumber}
                className="w-[240px] h-[240px] text-[#d8b56d] drop-shadow-[0_0_40px_rgba(216,181,109,0.3)]"
              />
              {/* Codon Icon — placed exactly in the center of the hex nodes */}
              <img
                src={iconSrc}
                alt={`${codon.id} icon`}
                className="absolute w-[72px] h-[72px] object-contain"
                style={{ left: "50%", top: "50%", transform: "translate(-50%, -50%)" }}
              />
            </div>
          </div>

          <div className="absolute bottom-4 left-1/2 z-20 -translate-x-1/2 rounded bg-black/30 px-3 py-0.5 text-[10px] font-mono tracking-[0.25em] text-[#d8b56d]/70 backdrop-blur">
            HEX NODES • {codon.binary}
          </div>
        </section>

        {/* Key Identity facts (Profile style rows) */}
        <div className="profile-layer__sections mt-2">
          <dl className="profile-rows">
            {[
              { label: "Center", value: codon.center || "—" },
              { label: "Archetype Role", value: codon.archetype_role || "—" },
              { label: "Traditional Name", value: codon.traditional_name || "—" },
              { label: "Mandala Window", value: codon.startDegree != null && codon.endDegree != null ? `${codon.startDegree.toFixed(1)}° — ${codon.endDegree.toFixed(1)}°` : "—" },
              { label: "Mandala Slot", value: codon.mandalaSlot != null ? (codon.mandalaSlot + 1) : "—" },
              { label: "Chemical Marker", value: codon.chemical_marker || "—" },
              { label: "Harmonic Partner", value: `RC${String(harmonic).padStart(2, "0")}` },
            ].map((row, i) => (
              <div key={i} className="profile-row">
                <dt>{row.label}</dt>
                <dd>
                  {row.label === "Harmonic Partner" ? (
                    <Link href={`/codex/${harmonic}`} className="text-[#d8b56d] hover:underline">{row.value}</Link>
                  ) : row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Resonance Spectrum — elegant like profile stats */}
        <section className="mt-8">
          <div className="mb-2 text-[10px] font-mono tracking-[0.2em] text-[var(--oriel-dim)]">03 · RESONANCE SPECTRUM</div>
          <div className="profile-layer__stats !grid-cols-1 md:!grid-cols-3">
            {[
              { label: "SHADOW", value: codon.frequency?.shadow || codon.shadow, icon: <Moon size={13} /> },
              { label: "GIFT", value: codon.frequency?.gift || codon.gift, icon: <Diamond size={13} /> },
              { label: "SIDDHI", value: codon.frequency?.siddhi || codon.crown, icon: <Infinity size={13} /> },
            ].map((item, idx) => (
              <div key={idx} className="profile-layer__stat">
                <div className="flex items-center justify-center gap-1.5 text-[10px] tracking-widest text-[#d8b56d] mb-1">
                  {item.icon} {item.label}
                </div>
                <span className="profile-layer__stat-value !text-base leading-tight">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-[var(--oriel-ivory)]/80 mt-1">
            <div>{codon.frequency?.shadow_desc || ""}</div>
            <div>{codon.frequency?.gift_desc || ""}</div>
            <div>{codon.frequency?.siddhi_desc || ""}</div>
          </div>
        </section>

        {/* Facets — restyled clean cards */}
        <section className="mt-10">
          <div className="mb-3 text-[10px] font-mono tracking-[0.2em] text-[var(--oriel-dim)]">04 · RESONANCE FACETS (4 WINDOWS)</div>
          <div className="flex flex-col gap-3">
            {(["A", "B", "C", "D"] as const).map(letter => {
              const facetData = (codon.facets as any)?.[letter];
              if (!facetData) return null;
              const label = FACET_LABELS[letter];
              const isExpanded = expandedFacets[letter];
              const fc = FACET_COLORS[letter] ?? FACET_COLORS.A;

              const localIndex = FACET_ORDER.indexOf(letter);
              const localStart = typeof codon.startDegree === "number"
                ? codon.startDegree + localIndex * (typeof codon.facetArc === "number" ? codon.facetArc : 1.40625)
                : null;
              const localEnd = localStart !== null ? localStart + (typeof codon.facetArc === "number" ? codon.facetArc : 1.40625) : null;

              return (
                <div key={letter} className={`rounded border transition ${isExpanded ? fc.border : "border-white/10"}`}>
                  <button
                    onClick={() => toggleFacet(letter)}
                    className="w-full flex justify-between px-4 py-3 text-left text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`font-mono text-xs ${isExpanded ? fc.text : "text-[#d8b56d]/60"}`}>{label} · {letter}</span>
                      {facetData.title && <span className="text-xs text-[var(--oriel-dim)]">— {facetData.title}</span>}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[var(--oriel-dim)]">
                      {localStart && localEnd && <span>{localStart.toFixed(1)}°–{localEnd.toFixed(1)}°</span>}
                      <span>{isExpanded ? "–" : "+"}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="border-t border-white/10 px-4 pb-5 pt-3 text-sm text-[var(--oriel-ivory)]/90">
                      <p className="font-serif leading-relaxed">{facetData.description}</p>

                      {facetData.resonance_keys?.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                          {facetData.resonance_keys.map((k: string) => (
                            <span key={k} className="rounded border border-white/20 px-2 py-px">{k}</span>
                          ))}
                        </div>
                      )}

                      {(facetData.shadow_manifestation || facetData.micro_correction) && (
                        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 text-xs">
                          {facetData.shadow_manifestation && (
                            <div className="rounded border border-red-900/40 bg-red-950/20 p-3">
                              <div className="mb-1 flex items-center gap-1 text-red-400 text-[10px] font-mono">SHADOW</div>
                              {facetData.shadow_manifestation}
                            </div>
                          )}
                          {facetData.micro_correction && (
                            <div className="rounded border border-[#d8b56d]/30 bg-[#d8b56d]/5 p-3">
                              <div className="mb-1 flex items-center gap-1 text-[#d8b56d] text-[10px] font-mono">MICRO-CORRECTION</div>
                              {facetData.micro_correction}
                              <div className="mt-2">
                                <Link href="/signature" className="text-[10px] underline">Open Signal Check</Link>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Related */}
        {relatedCodons.length > 0 && (
          <section className="mt-10 border-t border-white/10 pt-8">
            <div className="mb-3 text-[10px] font-mono tracking-[0.2em] text-[var(--oriel-dim)]">05 · RELATED RESONANCE LINKS</div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
              {relatedCodons.map(r => {
                const n = r.numericId ?? parseInt(r.id.replace("RC", ""));
                return (
                  <Link key={r.id} href={`/codex/${n}`} className="group rounded border border-white/10 p-3 text-xs hover:border-[#d8b56d]/40 transition">
                    <div className="font-mono text-[#d8b56d]">{r.id}</div>
                    <div className="mt-0.5 text-[var(--oriel-ivory)] group-hover:text-white">{r.name}</div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </SignalPageShell>
  );
}
