import { useRoute, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  ArrowLeft,
  ArrowRight,
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
import Grainient from "@/components/Grainient";


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
  weight: number;
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
        weight: typeof row.weight === "number" ? row.weight : (typeof row.weightedFrequency === "number" ? row.weightedFrequency / 50 : 1),
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

  // SLI / Loudness based on planetary weights in user's prime stack for this codon
  const codonLoudness = blueprintMatches.length > 0
    ? Math.max(...blueprintMatches.map(m => (m as any).weight || 1))
    : 1;  // default for non-user or not in stack
  const sliFactor = Math.max(0.3, Math.min(2.0, codonLoudness / 0.9)); // normalize around typical weights 0.3-1.8+

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
      <SignalPageShell chamber="threshold" className="fi-home">
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
      <SignalPageShell chamber="threshold" className="fi-home">
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

  // Generate unique Grainient colors + params per codon using number + binary
  // Much more diversified palettes per codon (different hue families, not just pink shifts)
  const getGrainientPropsForCodon = (num: number, bin: string) => {
    const bitCount = [...bin].filter(b => b === '1').length;
    const seed = num * 19 + bitCount * 11;

    // Pick a broad "family" so we get real diversity across codons
    const family = num % 7; // 7 distinct vibe families

    const hslToHex = (h: number, s: number, l: number): string => {
      h /= 360; s /= 100; l /= 100;
      let r: number, g: number, b: number;
      if (s === 0) {
        r = g = b = l;
      } else {
        const hue2rgb = (p: number, q: number, t: number) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1/6) return p + (q - p) * 6 * t;
          if (t < 1/2) return q;
          if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
          return p;
        };
        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
      }
      const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, '0');
      return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    };

    let h1, h2, h3, s1, s2, s3, l1, l2, l3;

    switch (family) {
      case 0: // Deep oceanic / teal-cyan
        h1 = 195 + (seed % 25); h2 = 210 + (seed % 20); h3 = 175 + (seed % 30);
        s1 = 82; s2 = 88; s3 = 70; l1 = 58; l2 = 52; l3 = 65;
        break;
      case 1: // Fiery / amber-orange
        h1 = 18 + (seed % 22); h2 = 35 + (seed % 18); h3 = 5 + (seed % 15);
        s1 = 90; s2 = 85; s3 = 78; l1 = 55; l2 = 60; l3 = 50;
        break;
      case 2: // Royal purple / indigo
        h1 = 265 + (seed % 25); h2 = 280 + (seed % 22); h3 = 245 + (seed % 28);
        s1 = 78; s2 = 85; s3 = 72; l1 = 56; l2 = 50; l3 = 62;
        break;
      case 3: // Forest / emerald green
        h1 = 145 + (seed % 20); h2 = 160 + (seed % 18); h3 = 130 + (seed % 25);
        s1 = 75; s2 = 82; s3 = 68; l1 = 52; l2 = 58; l3 = 48;
        break;
      case 4: // Magenta / rose + teal accents (controlled pink)
        h1 = 320 + (seed % 18); h2 = 335 + (seed % 15); h3 = 195 + (seed % 20);
        s1 = 82; s2 = 78; s3 = 80; l1 = 58; l2 = 54; l3 = 60;
        break;
      case 5: // Warm sunset / coral + gold
        h1 = 12 + (seed % 15); h2 = 28 + (seed % 20); h3 = 42 + (seed % 12);
        s1 = 88; s2 = 80; s3 = 75; l1 = 57; l2 = 62; l3 = 55;
        break;
      default: // Cool lavender + steel blue
        h1 = 235 + (seed % 22); h2 = 255 + (seed % 18); h3 = 215 + (seed % 25);
        s1 = 72; s2 = 78; s3 = 68; l1 = 60; l2 = 55; l3 = 65;
    }

    // Extra randomization from binary so even same family feels different
    const binShift = bitCount * 3;
    h1 = (h1 + binShift) % 360;
    h2 = (h2 + binShift) % 360;
    h3 = (h3 + binShift) % 360;

    return {
      color1: hslToHex(h1, s1, l1),
      color2: hslToHex(h2, s2, l2),
      color3: hslToHex(h3, s3, l3),
      timeSpeed: 0.36 + (bitCount % 5) * 0.05,
      warpStrength: 1.35 + (num % 6) * 0.13,
      warpFrequency: 4.6 + (bitCount % 4) * 0.35,
      warpSpeed: 3.1 + (seed % 5) * 0.32,
      warpAmplitude: 46 + (num % 7) * 2.5,
      blendAngle: 85 + (num % 70),
      blendSoftness: 0.38 + (bitCount % 6) * 0.05,
      rotationAmount: 480 + ((bitCount * 9) % 90),
      noiseScale: 1.45 + (num % 5) * 0.15,
      grainAmount: 0.065 + (seed % 7) * 0.012,
      grainScale: 1.35 + (bitCount % 4) * 0.18,
      grainAnimated: true,
      contrast: 1.5,
      gamma: 0.76,
      saturation: 1.08,
      centerX: ((num % 11) - 5) * 0.007,
      centerY: ((bitCount % 7) - 3) * 0.007,
      zoom: 1.06 + (num % 4) * 0.03,
    };
  };

  const grainProps = getGrainientPropsForCodon(codonNumber, codon.binary || "000000");

  // Next codon (wraps from 64 back to 01)
  const nextCodonNumber = codonNumber === 64 ? 1 : codonNumber + 1;
  const nextCodonId = `RC${String(nextCodonNumber).padStart(2, '0')}`;

  return (
    <SignalPageShell chamber="threshold" className="fi-home">
      <div className="arkana-layer__inner">
        {/* Header matching Profile */}
        <header className="arkana-layer__head profile-layer__head">
          <div>
            <Link href="/codex" className="arkana-layer__back mb-2 inline-flex items-center gap-2 text-xs">
              <ArrowLeft size={12} /> RETURN TO FIELD INDEX
            </Link>
          </div>

          <div className="flex items-baseline justify-between gap-4">
            <DecodedTitle
              text={`${codon.id} · ${codon.name}`}
              className="arkana-layer__title"
            />
            <Link 
              href={`/codex/${nextCodonId}`}
              className="arkana-layer__back inline-flex items-center gap-1 text-xs hover:text-[#d8b56d] transition-colors whitespace-nowrap"
            >
              NEXT <ArrowRight size={12} />
            </Link>
          </div>

          {/* Thin SLI Gradient line placed right under the codon name (title) */}
          {/* Made full width starting from the left to cover under the entire title including the codon number (RCxx) */}
          <div
            style={{
              width: '100%',
              height: `${Math.max(3, Math.min(14, Math.round(4 * sliFactor)))}px`,
              margin: '0.6rem 0 1rem 0',
              position: 'relative',
              overflow: 'hidden',
              borderRadius: '1px',
              boxShadow: sliFactor > 1.2 ? '0 0 6px rgba(216,181,109,0.25)' : 'none',
            }}
          >
            <Grainient 
              {...grainProps} 
              contrast={grainProps.contrast * (0.85 + sliFactor * 0.2)}
              grainAmount={grainProps.grainAmount * sliFactor}
              warpStrength={grainProps.warpStrength * (0.8 + sliFactor * 0.25)}
            />
          </div>

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

        {/* The codon glyph / symbol - centered below the thin SLI gradient line */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0 1rem' }}>
          <div style={{ position: 'relative', width: 240, height: 240 }}>
            <CodonGlyph
              codonNumber={codonNumber}
              className="w-full h-full text-[#e8d9a0] drop-shadow-[0_0_6px_rgba(0,0,0,0.5)]"
            />
            <img
              src={iconSrc}
              alt={`${codon.id} icon`}
              className="absolute w-[70px] h-[70px] object-contain"
              style={{ 
                left: '50%', 
                top: '50%', 
                transform: 'translate(-50%, -50%)',
                filter: 'drop-shadow(0 1px 4px rgba(0,0,0,0.6))'
              }}
            />
          </div>
        </div>

        {/* Label under the glyph */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <span className="text-[10px] font-mono tracking-[0.25em] text-[#d8b56d]/70">
            HEX NODES • {codon.binary}
          </span>
        </div>

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
