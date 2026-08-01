import { trpc } from "@/lib/trpc";
import {
  BAND_RADII,
  BOTH_LAYER_RADIUS,
  CENTER_HUE,
  CODON_CENTER,
  CODON_IDS,
  CONSCIOUS_INNER_RADIUS,
  CONSCIOUS_OUTER_RADIUS,
  DESIGN_INNER_RADIUS,
  DESIGN_OUTER_RADIUS,
  FACETS,
  FACET_SPAN,
  GROUND_HUE,
  LAYERS,
  NEUTRAL_HUE,
  OUTER_RADIUS,
  SEG,
  boundaryOpacity,
  buildBothLayers,
  buildLitSet,
  cellAngle,
  cellOpacity,
  markerOpacity,
  myWheelQueryKey,
  polar,
  resolveWheelKey,
  resolveWheelMotion,
  wedge,
  type Activation,
  type CenterName,
  type Facet,
  type Layer,
  type WheelView,
} from "@shared/codon-wheel";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import * as React from "react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export {
  CENTER_HUE,
  CODON_CENTER,
  type Activation,
  type CenterName,
  type Facet,
  type Layer,
  type WheelView,
} from "@shared/codon-wheel";

// Backwards-compatible names used by the surrounding VTRS modules.
export const CENTER_COLORS: Readonly<Record<string, string>> = CENTER_HUE;
export const CODON_CENTER_MAP: Readonly<Record<number, CenterName>> =
  CODON_CENTER;

// Retained for the separate ProfileCodonMandala. The two-layer Receiver wheel
// below deliberately uses numeric codon order to match the print geometry.
export const VRC_MANDALA: readonly number[] = [
  51, 42, 3, 27, 24, 2, 23, 8, 20, 16, 35, 45, 12, 15, 52, 39, 53, 62, 56,
  31, 33, 7, 4, 29, 59, 40, 64, 47, 6, 46, 18, 48, 57, 32, 50, 28, 44, 1,
  43, 14, 34, 9, 5, 26, 11, 10, 58, 38, 54, 61, 60, 41, 19, 13, 49, 30, 55,
  37, 63, 22, 36, 25, 17, 21,
];

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

export const ROLES = [
  {
    name: "Originator",
    roman: "I",
    range: "RC01–04",
    desc: "initiates structure from raw potential",
  },
  {
    name: "Resonator",
    roman: "II",
    range: "RC05–08",
    desc: "harmonizes rhythm, direction & contribution",
  },
  {
    name: "Articulator",
    roman: "III",
    range: "RC09–12",
    desc: "focuses, expresses & gives form to thought",
  },
  {
    name: "Cultivator",
    roman: "IV",
    range: "RC13–16",
    desc: "develops memory, skill, resources & refinement",
  },
  {
    name: "Clarifier",
    roman: "V",
    range: "RC17–20",
    desc: "evaluates, corrects, senses & brings presence",
  },
  {
    name: "Sovereign",
    roman: "VI",
    range: "RC21–24",
    desc: "commands, integrates, renews & stabilizes authority",
  },
  {
    name: "Guardian",
    roman: "VII",
    range: "RC25–28",
    desc: "protects spirit, care, purpose & moral direction",
  },
  {
    name: "Devotee",
    roman: "VIII",
    range: "RC29–32",
    desc: "commits energy, desire, leadership & continuity",
  },
  {
    name: "Transformer",
    roman: "IX",
    range: "RC33–36",
    desc: "metabolizes retreat, power, change & crisis",
  },
  {
    name: "Catalyst",
    roman: "X",
    range: "RC37–40",
    desc: "activates community, struggle, provocation & will",
  },
  {
    name: "Oracle",
    roman: "XI",
    range: "RC41–44",
    desc: "receives imagination, completion, insight & pattern",
  },
  {
    name: "Steward",
    roman: "XII",
    range: "RC45–48",
    desc: "manages resources, embodiment, realization & depth",
  },
  {
    name: "Reformer",
    roman: "XIII",
    range: "RC49–52",
    desc: "renews principles, values, shock & stillness",
  },
  {
    name: "Ascendant",
    roman: "XIV",
    range: "RC53–56",
    desc: "expands beginnings, ambition, abundance & story",
  },
  {
    name: "Navigator",
    roman: "XV",
    range: "RC57–60",
    desc: "guides intuition, joy, union & limitation",
  },
  {
    name: "Illuminator",
    roman: "XVI",
    range: "RC61–64",
    desc: "reveals mystery, detail, doubt & archetypal memory",
  },
] as const;

export const ROLE_VECTORS = Array.from(
  { length: 16 },
  (_, index) => `/vectors/ROLE${String(index + 1).padStart(2, "0")}.svg`
);

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
  activeRoleIdx?: number | null;
  activeCenter?: string | null;
  onDeselect?: () => void;
}

export type WheelLoadState =
  | "anonymous"
  | "loading"
  | "none"
  | "ready"
  | "error";
export type BaseView = "field" | "mine";

export function resolveWheelView(
  loadState: WheelLoadState,
  baseView: BaseView,
  focusedCodonId: number | null
): WheelView {
  if (focusedCodonId !== null) {
    return { kind: "focus", codonId: focusedCodonId };
  }
  return loadState === "ready" ? { kind: baseView } : { kind: "field" };
}

const CX = 380;
const CY = 380;
const CENTER_BAND_OUTER = 244;
const CENTER_BAND_INNER = 206;
const QUADRANTS = [
  { name: "INITIATION", startCodon: 1 },
  { name: "CIVILIZATION", startCodon: 17 },
  { name: "DUALITY", startCodon: 33 },
  { name: "MUTATION", startCodon: 49 },
] as const;

function labelArcPath(
  cx: number,
  cy: number,
  r: number,
  midAngle: number,
  halfSpan: number
) {
  const flip = midAngle > 90 && midAngle < 270;
  const start = flip ? midAngle + halfSpan : midAngle - halfSpan;
  const end = flip ? midAngle - halfSpan : midAngle + halfSpan;
  const p0 = polar(cx, cy, r, start);
  const p1 = polar(cx, cy, r, end);
  return `M ${p0.x} ${p0.y} A ${r} ${r} 0 0 ${flip ? 0 : 1} ${p1.x} ${p1.y}`;
}

function facetsForCodon(
  activations: readonly Activation[],
  codonId: number,
  layer: Layer
) {
  return FACETS.filter(facet =>
    activations.some(
      activation =>
        activation.codonId === codonId &&
        activation.layer === layer &&
        activation.facet === facet
    )
  );
}

export function WheelSignatureControl({
  state,
  baseView,
  onToggle,
  onRetry,
}: {
  state: WheelLoadState;
  baseView: BaseView;
  onToggle: () => void;
  onRetry?: () => void;
}) {
  const ready = state === "ready";
  const tooltip =
    state === "anonymous"
      ? "Sign in and calculate your Receiver record to reveal your signature."
      : state === "none"
        ? "Calculate your Receiver record to reveal your signature."
        : state === "loading"
          ? "Your stored Receiver record is being read."
          : state === "error"
            ? "Your stored record could not be read yet."
            : undefined;

  return (
    <div className="cz-wheel-controls">
      <div
        className="cz-wheel-mode-switch"
        role="group"
        aria-label="Codon wheel view"
      >
        <button
          type="button"
          className={`cz-wheel-mode-option cz-wheel-mode-option--field ${
            baseView === "field" ? "is-active" : ""
          }`}
          aria-pressed={baseView === "field"}
          onClick={() => {
            if (baseView !== "field") onToggle();
          }}
        >
          <span className="cz-wheel-mode-node" aria-hidden="true" />
          Full Field
        </button>
        <button
          type="button"
          className={`cz-wheel-mode-option cz-wheel-mode-option--mine ${
            baseView === "mine" ? "is-active" : ""
          }`}
          aria-pressed={baseView === "mine"}
          disabled={!ready}
          title={tooltip}
          onClick={() => {
            if (ready && baseView !== "mine") onToggle();
          }}
        >
          <span className="cz-wheel-mode-node" aria-hidden="true" />
          My Signature
        </button>
      </div>
      {state === "loading" && (
        <span className="cz-wheel-status">Receiving your stored signature…</span>
      )}
      {state === "anonymous" && (
        <span className="cz-wheel-status">
          Sign in and calculate to reveal your two-layer signature.
        </span>
      )}
      {state === "none" && (
        <span className="cz-wheel-status">
          Calculate your Receiver record to reveal your two layers.
        </span>
      )}
      {state === "error" && (
        <span className="cz-wheel-status">
          Your signature could not be read.{" "}
          <button
            type="button"
            className="cz-wheel-retry"
            onClick={onRetry}
          >
            Retry
          </button>
        </span>
      )}
    </div>
  );
}

export interface CodonWheelPlateProps {
  codons: Codon[];
  selectedId: number;
  activations: readonly Activation[];
  view: WheelView;
  onFocus?: (codonId: number) => void;
  onLeaveFocus?: () => void;
  showSignatureContext?: boolean;
  activeRoleIdx?: number | null;
  activeCenter?: string | null;
  onDeselect?: () => void;
}

export function CodonWheelPlate({
  codons,
  selectedId,
  activations,
  view,
  onFocus,
  onLeaveFocus,
  showSignatureContext,
  activeRoleIdx,
  activeCenter,
  onDeselect,
}: CodonWheelPlateProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const effectiveView: WheelView =
    hoveredId === null ? view : { kind: "focus", codonId: hoveredId };
  const signatureContextVisible =
    showSignatureContext ?? view.kind !== "field";
  const fieldSelectionId =
    !signatureContextVisible && view.kind === "focus" ? view.codonId : null;
  const previousView = useRef<WheelView>(effectiveView);
  const wheelMotion = resolveWheelMotion(
    previousView.current,
    effectiveView,
    reducedMotion
  );

  useEffect(() => {
    previousView.current = effectiveView;
  }, [effectiveView]);

  const codonById = useMemo(
    () => new Map(codons.map(codon => [codon.id, codon])),
    [codons]
  );
  const selectedCodon = codonById.get(selectedId) ?? codons[0];
  const selectedRoleIdx = Math.floor((selectedId - 1) / 4);
  const visibleActivations = useMemo(() => {
    if (effectiveView.kind === "field" || !signatureContextVisible) return [];
    return activations;
  }, [activations, effectiveView, signatureContextVisible]);
  const visibleLitSet = useMemo(
    () => buildLitSet(visibleActivations),
    [visibleActivations]
  );
  const visibleBothLayers = useMemo(
    () => buildBothLayers(visibleActivations),
    [visibleActivations]
  );
  const occupiedCodons = useMemo(
    () =>
      new Set(visibleActivations.map(activation => activation.codonId)),
    [visibleActivations]
  );
  const ariaLabel = `Codon wheel. 64 codons in two layers. ${occupiedCodons.size} codons activated. ${visibleBothLayers.size} present in both layers.`;
  const transition = `opacity ${wheelMotion.durationMs}ms ${wheelMotion.easing}`;
  const cellTransition = `fill-opacity ${wheelMotion.durationMs}ms ${wheelMotion.easing}`;
  const markerTransition = `${transition}, r ${wheelMotion.durationMs}ms ${wheelMotion.easing}`;

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const currentCodonId =
      effectiveView.kind === "focus" ? effectiveView.codonId : selectedId;
    const action = resolveWheelKey(event.key, currentCodonId);
    if (!action) return;
    event.preventDefault();
    if (action.kind === "leave-focus") {
      onLeaveFocus?.();
      return;
    }
    onFocus?.(action.codonId);
  };

  return (
    <div className="cz-wheel-aspect">
      <svg
        viewBox="0 0 760 760"
        className="cz-wheel-svg"
        role="img"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onClick={event => {
          if (event.target === event.currentTarget) {
            onLeaveFocus?.();
            onDeselect?.();
          }
        }}
      >
        <defs>
          <radialGradient id="wheel-central-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(205,161,74,0.15)" />
            <stop offset="62%" stopColor="rgba(20,17,12,0.03)" />
            <stop offset="100%" stopColor="rgba(8,7,11,0)" />
          </radialGradient>
          {QUADRANTS.map(quadrant => {
            const midAngle = (quadrant.startCodon - 1) * SEG + 45;
            return (
              <path
                key={quadrant.name}
                id={`quadrant-arc-${quadrant.startCodon}`}
                d={labelArcPath(CX, CY, 366, midAngle, 24)}
                fill="none"
              />
            );
          })}
        </defs>

        <circle
          cx={CX}
          cy={CY}
          r={CENTER_BAND_INNER - 2}
          fill="url(#wheel-central-glow)"
          pointerEvents="none"
          aria-hidden="true"
        />

        {/* Neutral cells: two bands × 64 codons × four facets. */}
        <g aria-hidden="true">
          {LAYERS.flatMap(layer =>
            CODON_IDS.flatMap(codonId =>
              FACETS.map(facet => {
                const start = cellAngle(codonId, facet);
                const radii = BAND_RADII[layer];
                const key =
                  `${codonId}-${facet}-${layer}` as const;
                const isVisibleActivation = visibleLitSet.has(key);
                const isFieldSelection = fieldSelectionId === codonId;
                return (
                  <path
                    key={`neutral-${codonId}-${facet}-${layer}`}
                    data-cell-kind="neutral"
                    data-codon-id={codonId}
                    data-facet={facet}
                    data-layer={layer}
                    data-inner-radius={radii.inner}
                    data-outer-radius={radii.outer}
                    d={wedge(
                      CX,
                      CY,
                      radii.inner,
                      radii.outer,
                      start,
                      start + FACET_SPAN
                    )}
                    fill={NEUTRAL_HUE}
                    fillOpacity={
                      isVisibleActivation || isFieldSelection
                        ? 0
                        : cellOpacity(false, effectiveView, codonId)
                    }
                    stroke="none"
                    style={{ transition: cellTransition }}
                  />
                );
              })
            )
          )}
        </g>

        {/* Facet hairlines stay inside their own band. */}
        <g
          fill="none"
          stroke={GROUND_HUE}
          strokeWidth="0.55"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        >
          {LAYERS.flatMap(layer =>
            CODON_IDS.flatMap(codonId =>
              FACETS.slice(1).map(facet => {
                const angle = cellAngle(codonId, facet);
                const radii = BAND_RADII[layer];
                const p0 = polar(CX, CY, radii.inner, angle);
                const p1 = polar(CX, CY, radii.outer, angle);
                return (
                  <line
                    key={`facet-line-${codonId}-${facet}-${layer}`}
                    x1={p0.x}
                    y1={p0.y}
                    x2={p1.x}
                    y2={p1.y}
                  />
                );
              })
            )
          )}
        </g>

        {/* Codon boundaries cross both bands and their intervening gap. */}
        <g
          fill="none"
          stroke={NEUTRAL_HUE}
          strokeWidth="0.7"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        >
          {CODON_IDS.map(codonId => {
            const angle = (codonId - 1) * SEG;
            const p0 = polar(CX, CY, DESIGN_INNER_RADIUS, angle);
            const p1 = polar(CX, CY, CONSCIOUS_OUTER_RADIUS, angle);
            return (
              <line
                key={`boundary-${codonId}`}
                data-boundary-codon={codonId}
                x1={p0.x}
                y1={p0.y}
                x2={p1.x}
                y2={p1.y}
                opacity={boundaryOpacity(effectiveView, codonId)}
                style={{ transition }}
              />
            );
          })}
        </g>

        {/* Exact band edges. */}
        <g
          fill="none"
          stroke={NEUTRAL_HUE}
          strokeWidth="0.7"
          opacity="0.4"
          vectorEffect="non-scaling-stroke"
          aria-hidden="true"
        >
          {[
            CONSCIOUS_OUTER_RADIUS,
            CONSCIOUS_INNER_RADIUS,
            DESIGN_OUTER_RADIUS,
            DESIGN_INNER_RADIUS,
          ].map(radius => (
            <circle key={radius} cx={CX} cy={CY} r={radius} />
          ))}
        </g>

        {/* Deduplicated activated cell overlays. */}
        <g aria-hidden="true">
          {[...visibleLitSet].map(key => {
            const [codonText, facetText, layerText] = key.split("-");
            const codonId = Number(codonText);
            const facet = facetText as Facet;
            const layer = layerText as Layer;
            const radii = BAND_RADII[layer];
            const start = cellAngle(codonId, facet);
            const delay =
              wheelMotion.staggerMs === 0
                ? 0
                : (codonId - 1) * wheelMotion.staggerMs;
            return (
              <path
                key={`lit-${key}`}
                data-cell-kind="lit"
                data-cell-key={key}
                data-codon-id={codonId}
                data-facet={facet}
                data-layer={layer}
                data-inner-radius={radii.inner}
                data-outer-radius={radii.outer}
                d={wedge(
                  CX,
                  CY,
                  radii.inner,
                  radii.outer,
                  start,
                  start + FACET_SPAN
                )}
                fill={CENTER_HUE[CODON_CENTER[codonId]]}
                fillOpacity={cellOpacity(true, effectiveView, codonId)}
                stroke="none"
                style={{
                  transition: cellTransition,
                  transitionDelay: `${delay}ms`,
                }}
              />
            );
          })}
        </g>

        {/* Full Field exploration colors one complete codon without borrowing or
            mutating any facet from the Receiver's stored signature. */}
        {fieldSelectionId !== null && (
          <g aria-hidden="true">
            {LAYERS.flatMap(layer =>
              FACETS.map(facet => {
                const radii = BAND_RADII[layer];
                const start = cellAngle(fieldSelectionId, facet);
                return (
                  <path
                    key={`field-selection-${fieldSelectionId}-${facet}-${layer}`}
                    data-cell-kind="field-selection"
                    data-codon-id={fieldSelectionId}
                    data-facet={facet}
                    data-layer={layer}
                    d={wedge(
                      CX,
                      CY,
                      radii.inner,
                      radii.outer,
                      start,
                      start + FACET_SPAN
                    )}
                    fill={CENTER_HUE[CODON_CENTER[fieldSelectionId]]}
                    fillOpacity={1}
                    stroke={GROUND_HUE}
                    strokeWidth="0.35"
                    vectorEffect="non-scaling-stroke"
                    style={{ transition: cellTransition }}
                  />
                );
              })
            )}
          </g>
        )}

        {/* One marker for each codon occupied in both layers. */}
        <g aria-hidden="true">
          {[...visibleBothLayers].map(codonId => {
            const midAngle = (codonId - 0.5) * SEG;
            const point = polar(CX, CY, BOTH_LAYER_RADIUS, midAngle);
            const focused =
              effectiveView.kind === "focus" &&
              effectiveView.codonId === codonId;
            return (
              <circle
                key={`both-${codonId}`}
                data-both-layer-codon={codonId}
                cx={point.x}
                cy={point.y}
                r={focused ? 4.2 : 2.6}
                fill={CENTER_HUE[CODON_CENTER[codonId]]}
                opacity={markerOpacity(effectiveView, codonId)}
                style={{ transition: markerTransition }}
              />
            );
          })}
        </g>

        {/* Neutral codon and centre glyphs preserve the existing visual language. */}
        <g aria-hidden="true" pointerEvents="none">
          {CODON_IDS.map(codonId => {
            const codon = codonById.get(codonId);
            if (!codon) return null;
            const midAngle = (codonId - 0.5) * SEG;
            const glyphPoint = polar(
              CX,
              CY,
              (CONSCIOUS_INNER_RADIUS + CONSCIOUS_OUTER_RADIUS) / 2,
              midAngle
            );
            const rolePoint = polar(CX, CY, DESIGN_INNER_RADIUS - 11, midAngle);
            const roleIndex = Math.floor((codonId - 1) / 4);
            const roleActive =
              activeRoleIdx === null ||
              activeRoleIdx === undefined ||
              activeRoleIdx === roleIndex;
            const centerActive =
              !activeCenter || activeCenter === CODON_CENTER[codonId];
            return (
              <g
                key={`glyph-${codonId}`}
                opacity={roleActive && centerActive ? 0.72 : 0.22}
              >
                <image
                  href={`/symbols/${codon.code}.png`}
                  x={glyphPoint.x - 7}
                  y={glyphPoint.y - 7}
                  width="14"
                  height="14"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ filter: "brightness(0)" }}
                />
                <image
                  href={ROLE_VECTORS[roleIndex]}
                  x={rolePoint.x - 4.5}
                  y={rolePoint.y - 4.5}
                  width="9"
                  height="9"
                  preserveAspectRatio="xMidYMid meet"
                  style={{ filter: "brightness(0)" }}
                />
              </g>
            );
          })}
        </g>

        <g aria-hidden="true" pointerEvents="none">
          {CODON_IDS.map(codonId => {
            const start = (codonId - 1) * SEG;
            const path = wedge(
              CX,
              CY,
              CENTER_BAND_INNER,
              CENTER_BAND_OUTER,
              start,
              start + SEG
            );
            const point = polar(
              CX,
              CY,
              (CENTER_BAND_INNER + CENTER_BAND_OUTER) / 2,
              start + SEG / 2
            );
            return (
              <g key={`center-glyph-${codonId}`}>
                <path
                  d={path}
                  fill={NEUTRAL_HUE}
                  fillOpacity="0.035"
                  stroke={GROUND_HUE}
                  strokeWidth="0.4"
                />
                <image
                  href={`/9-centers/${CENTER_SYMBOL[CODON_CENTER[codonId]]}.png`}
                  x={point.x - 6}
                  y={point.y - 6}
                  width="12"
                  height="12"
                  preserveAspectRatio="xMidYMid meet"
                  opacity="0.42"
                  style={{ filter: "brightness(0) invert(0.72)" }}
                />
              </g>
            );
          })}
        </g>

        <g pointerEvents="none" aria-hidden="true">
          {QUADRANTS.map(quadrant => (
            <text
              key={quadrant.name}
              fontFamily="var(--font-ritual)"
              fontSize="10.5"
              letterSpacing="0.28em"
              textAnchor="middle"
              fill="rgba(232,196,119,0.6)"
            >
              <textPath
                href={`#quadrant-arc-${quadrant.startCodon}`}
                startOffset="50%"
              >
                {quadrant.name}
              </textPath>
            </text>
          ))}
        </g>

        {/* Focus overlay is the final painted layer. */}
        {effectiveView.kind === "focus" && (
          <g
            data-focus-codon={effectiveView.codonId}
            fill="none"
            stroke="#fff8ec"
            strokeWidth="1.15"
            opacity="0.72"
            vectorEffect="non-scaling-stroke"
            pointerEvents="none"
            aria-hidden="true"
          >
            {LAYERS.map(layer => {
              const start = (effectiveView.codonId - 1) * SEG;
              const radii = BAND_RADII[layer];
              return (
                <path
                  key={`focus-${layer}`}
                  d={wedge(
                    CX,
                    CY,
                    radii.inner,
                    radii.outer,
                    start,
                    start + SEG
                  )}
                  style={{ transition }}
                />
              );
            })}
          </g>
        )}

        {/* One mouse hit target per codon; no additional tab stops. */}
        <g fill="transparent" stroke="none" aria-hidden="true">
          {CODON_IDS.map(codonId => {
            const start = (codonId - 1) * SEG;
            return (
              <path
                key={`hit-${codonId}`}
                data-hit-codon={codonId}
                d={wedge(
                  CX,
                  CY,
                  DESIGN_INNER_RADIUS,
                  OUTER_RADIUS,
                  start,
                  start + SEG
                )}
                pointerEvents="all"
                style={{ cursor: "pointer" }}
                onMouseEnter={() => setHoveredId(codonId)}
                onMouseLeave={() => setHoveredId(null)}
                onClick={event => {
                  event.stopPropagation();
                  onFocus?.(codonId);
                }}
              >
                <title>
                  {codonById.get(codonId)
                    ? `${codonById.get(codonId)!.code} · ${codonById.get(codonId)!.name}`
                    : `Codon ${codonId}`}
                </title>
              </path>
            );
          })}
        </g>
      </svg>

      <div className="cz-wheel-hub" aria-hidden="true">
        {selectedCodon && (
          <AnimatePresence mode="popLayout">
            <motion.div
              key={selectedCodon.id}
              initial={{ scale: 0.92, opacity: 0, filter: "blur(6px)" }}
              animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
              exit={{ scale: 1.04, opacity: 0, filter: "blur(4px)" }}
              transition={{ duration: reducedMotion ? 0.12 : 0.35 }}
              className="cz-wheel-hub-content"
            >
              <div className="cz-wheel-hub-symbol">
                <img
                  src={`/symbols/${selectedCodon.code}.png`}
                  alt=""
                />
              </div>
              <span className="cz-wheel-hub-code">{selectedCodon.code}</span>
              <span className="cz-wheel-hub-name">{selectedCodon.name}</span>
              <span className="cz-wheel-hub-role">
                {ROLES[selectedRoleIdx]?.name}
              </span>
            </motion.div>
          </AnimatePresence>
        )}
      </div>

      <table className="cz-wheel-sr-table">
        <caption>Codon-by-codon activation detail</caption>
        <thead>
          <tr>
            <th scope="col">Codon</th>
            <th scope="col">Centre</th>
            <th scope="col">Conscious facets</th>
            <th scope="col">Design facets</th>
            <th scope="col">Both layers</th>
          </tr>
        </thead>
        <tbody>
          {CODON_IDS.map(codonId => {
            const conscious = facetsForCodon(
              visibleActivations,
              codonId,
              "conscious"
            );
            const design = facetsForCodon(
              visibleActivations,
              codonId,
              "design"
            );
            return (
              <tr key={`detail-${codonId}`}>
                <th scope="row">{codonId}</th>
                <td>{CODON_CENTER[codonId]}</td>
                <td>{conscious.length ? conscious.join(", ") : "None"}</td>
                <td>{design.length ? design.join(", ") : "None"}</td>
                <td>{visibleBothLayers.has(codonId) ? "Yes" : "No"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function CodonWheel({
  codons,
  selectedId,
  onSelect,
  activeRoleIdx,
  activeCenter,
  onDeselect,
}: CodonWheelProps) {
  const trpcUtils = trpc.useUtils();
  const authQuery = trpc.auth.me.useQuery(undefined, {
    retry: 1,
    retryDelay: 500,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
  const receiverId = authQuery.data?.id ?? null;
  const isAuthenticated = receiverId !== null;
  const authLoading = authQuery.isLoading;
  const wheelQuery = useQuery({
    queryKey: myWheelQueryKey(receiverId),
    queryFn: () => trpcUtils.client.profile.getMyWheel.query(),
    enabled: isAuthenticated,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });
  const [baseView, setBaseView] = useState<BaseView>("field");
  const [focusedCodonId, setFocusedCodonId] = useState<number | null>(null);
  const loadedCalculation = useRef<string | null>(null);
  const previousSelectedId = useRef(selectedId);

  const loadState: WheelLoadState = authLoading
    ? "loading"
    : !isAuthenticated
      ? "anonymous"
      : wheelQuery.isError
        ? "error"
        : wheelQuery.data?.state === "ready"
          ? "ready"
          : wheelQuery.data?.state === "none"
            ? "none"
            : "loading";
  const activations =
    loadState === "ready" && wheelQuery.data?.state === "ready"
      ? wheelQuery.data.activations
      : [];
  const calculationKey =
    loadState === "ready" && wheelQuery.data?.state === "ready"
      ? `${receiverId}:${String(wheelQuery.data.calculatedAt)}`
      : null;

  useEffect(() => {
    if (!calculationKey || loadedCalculation.current === calculationKey) return;
    loadedCalculation.current = calculationKey;
    setBaseView("mine");
    setFocusedCodonId(null);
  }, [calculationKey]);

  useEffect(() => {
    if (loadState !== "ready") setBaseView("field");
  }, [loadState]);

  useEffect(() => {
    if (previousSelectedId.current === selectedId) return;
    previousSelectedId.current = selectedId;
    setFocusedCodonId(selectedId);
  }, [selectedId]);

  const view = resolveWheelView(loadState, baseView, focusedCodonId);

  const focusCodon = (codonId: number) => {
    setFocusedCodonId(codonId);
    onSelect(codonId);
  };

  return (
    <div className="cz-wheel-container">
      <WheelSignatureControl
        state={loadState}
        baseView={baseView}
        onToggle={() => {
          setBaseView(current => (current === "field" ? "mine" : "field"));
          setFocusedCodonId(null);
        }}
        onRetry={() => {
          void wheelQuery.refetch();
        }}
      />
      <CodonWheelPlate
        codons={codons}
        selectedId={selectedId}
        activations={activations}
        view={view}
        onFocus={focusCodon}
        onLeaveFocus={() => setFocusedCodonId(null)}
        showSignatureContext={loadState === "ready" && baseView === "mine"}
        activeRoleIdx={activeRoleIdx}
        activeCenter={activeCenter}
        onDeselect={onDeselect}
      />

      <style>{`
        .cz-wheel-container {
          position: relative;
          width: 100%;
          max-width: 680px;
          margin: 0 auto;
        }
        .cz-wheel-controls {
          min-height: 52px;
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
          gap: 10px 14px;
          margin-bottom: 12px;
          text-align: center;
        }
        .cz-wheel-mode-switch {
          display: grid;
          grid-template-columns: repeat(2, minmax(118px, 1fr));
          width: min(100%, 300px);
          padding: 2px;
          border: 1px solid rgba(205, 161, 74, 0.3);
          background:
            linear-gradient(90deg, rgba(205, 161, 74, 0.045), rgba(111, 183, 199, 0.035)),
            rgba(8, 7, 11, 0.72);
          box-shadow: 0 0 24px rgba(205, 161, 74, 0.055);
        }
        .cz-wheel-mode-option {
          min-height: 34px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: var(--font-ritual, "JetBrains Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.17em;
          text-transform: uppercase;
          padding: 8px 12px;
          border: 0;
          background: transparent;
          color: rgba(184, 175, 155, 0.52);
          cursor: pointer;
          transition: color 180ms ease, background 180ms ease, box-shadow 180ms ease;
        }
        .cz-wheel-mode-option + .cz-wheel-mode-option {
          border-left: 1px solid rgba(205, 161, 74, 0.18);
        }
        .cz-wheel-mode-option--field.is-active {
          color: var(--gold2, #e8c477);
          background: rgba(205, 161, 74, 0.11);
          box-shadow: inset 0 -1px rgba(232, 196, 119, 0.62);
        }
        .cz-wheel-mode-option--mine.is-active {
          color: var(--cyan, #6fb7c7);
          background: rgba(111, 183, 199, 0.1);
          box-shadow: inset 0 -1px rgba(111, 183, 199, 0.68);
        }
        .cz-wheel-mode-node {
          width: 5px;
          height: 5px;
          border: 1px solid currentColor;
          transform: rotate(45deg);
          opacity: 0.7;
          transition: background 180ms ease, box-shadow 180ms ease, opacity 180ms ease;
        }
        .cz-wheel-mode-option.is-active .cz-wheel-mode-node {
          background: currentColor;
          box-shadow: 0 0 8px currentColor;
          opacity: 1;
        }
        .cz-wheel-mode-option:hover:not(:disabled) {
          color: var(--ink, #e8e4dc);
        }
        .cz-wheel-mode-option:focus-visible {
          outline: 1px solid currentColor;
          outline-offset: -2px;
        }
        .cz-wheel-mode-option:disabled {
          opacity: 0.3;
          cursor: default;
          box-shadow: none;
        }
        .cz-wheel-status {
          max-width: 330px;
          color: rgba(184, 175, 155, 0.68);
          font-family: var(--font-voice, "Cormorant Garamond", serif);
          font-size: 12px;
          font-style: italic;
          line-height: 1.3;
        }
        .cz-wheel-retry {
          padding: 0;
          border: 0;
          border-bottom: 1px solid rgba(111, 183, 199, 0.4);
          background: transparent;
          color: var(--cyan, #6fb7c7);
          font: inherit;
          cursor: pointer;
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
          outline: none;
        }
        .cz-wheel-svg:focus-visible {
          filter: drop-shadow(0 0 6px rgba(111, 183, 199, 0.22));
        }
        .cz-wheel-hub {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 176px;
          height: 176px;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .cz-wheel-hub-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
        }
        .cz-wheel-hub-symbol {
          width: 78px;
          height: 78px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          border: 1px solid rgba(205, 161, 74, 0.42);
          border-radius: 50%;
          background: rgba(8, 7, 11, 0.78);
          box-shadow: 0 0 20px rgba(205, 161, 74, 0.11);
        }
        .cz-wheel-hub-symbol img {
          width: 58%;
          height: 58%;
          object-fit: contain;
          filter: brightness(0) invert(1);
          opacity: 0.8;
        }
        .cz-wheel-hub-code {
          margin-top: 8px;
          color: var(--gold, #cda14a);
          font-family: var(--font-ritual, "JetBrains Mono", monospace);
          font-size: 9px;
          letter-spacing: 0.2em;
        }
        .cz-wheel-hub-name {
          margin-top: 2px;
          color: var(--ink, #e8e4dc);
          font-family: var(--font-display, "Cinzel", serif);
          font-size: 19px;
          letter-spacing: 0.05em;
          line-height: 1;
        }
        .cz-wheel-hub-role {
          margin-top: 2px;
          color: var(--mut, #9a968e);
          font-family: var(--font-voice, "Cormorant Garamond", serif);
          font-size: 11px;
          font-style: italic;
        }
        .cz-wheel-sr-table {
          position: absolute;
          width: 1px;
          height: 1px;
          padding: 0;
          margin: -1px;
          overflow: hidden;
          clip: rect(0, 0, 0, 0);
          white-space: nowrap;
          border: 0;
        }
        @media (prefers-reduced-motion: reduce) {
          .cz-wheel-mode-option,
          .cz-wheel-mode-node {
            transition-duration: 120ms;
          }
        }
      `}</style>
    </div>
  );
}
