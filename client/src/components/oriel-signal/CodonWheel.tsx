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
  FIELD_CELL_OPACITY,
  GROUND_HUE,
  LAYERS,
  NEUTRAL_HUE,
  SEG,
  boundaryOpacity,
  buildBothLayers,
  buildLitSet,
  cellAngle,
  cellOpacity,
  codonMidAngle,
  codonStartAngle,
  markerOpacity,
  myWheelQueryKey,
  polar,
  resolveWheelKey,
  resolveWheelMotion,
  summarizeCodonActivations,
  wedge,
  type Activation,
  type CenterName,
  type CodonSignatureSummary,
  type Facet,
  type Layer,
  type WheelGeometry,
  type WheelView,
} from "@shared/codon-wheel";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { gsap } from "gsap";
import * as React from "react";
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";

export {
  CENTER_HUE,
  CODON_CENTER,
  VRC_MANDALA,
  type Activation,
  type CenterName,
  type CodonSignatureSummary,
  type Facet,
  type Layer,
  type WheelGeometry,
  type WheelView,
} from "@shared/codon-wheel";

// Backwards-compatible names used by the surrounding VTRS modules.
export const CENTER_COLORS: Readonly<Record<string, string>> = CENTER_HUE;
export const CODON_CENTER_MAP: Readonly<Record<number, CenterName>> =
  CODON_CENTER;

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
  selectedFacet?: Facet;
  selectedLayer?: Layer;
  viewPreference?: BaseView | null;
  geometryPreference?: WheelGeometry;
  onCellSelect?: (selection: WheelCellSelection) => void;
  onViewPreferenceChange?: (view: BaseView) => void;
  onGeometryPreferenceChange?: (geometry: WheelGeometry) => void;
  onSignatureContextChange?: (context: WheelSignatureContext) => void;
  activeRoleIdx?: number | null;
  activeCenter?: CenterName | null;
  onCenterSelect?: (center: CenterName | null) => void;
  onDeselect?: () => void;
}

export type WheelLoadState =
  | "anonymous"
  | "loading"
  | "none"
  | "ready"
  | "error";
export type BaseView = "field" | "mine";
const EMPTY_ACTIVATIONS: readonly Activation[] = [];

export function resolveBaseView(
  loadState: WheelLoadState,
  viewPreference: BaseView | null | undefined,
  automaticView: BaseView
): BaseView {
  if (loadState !== "ready") return "field";
  return viewPreference ?? automaticView;
}

export interface WheelCellSelection {
  codonId: number;
  facet: Facet;
  layer: Layer;
}

export interface WheelSignatureContext {
  mode: BaseView;
  state: WheelLoadState;
  summary: CodonSignatureSummary | null;
}

export function resolveWheelSignatureContext(
  loadState: WheelLoadState,
  baseView: BaseView,
  activations: readonly Activation[],
  selectedId: number
): WheelSignatureContext {
  const signatureMode = loadState === "ready" && baseView === "mine";
  return {
    mode: signatureMode ? "mine" : "field",
    state: loadState,
    summary: signatureMode
      ? summarizeCodonActivations(activations, selectedId)
      : null,
  };
}

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

export interface WheelExplorationSelection {
  focusedCodonId: number | null;
  activeCenter: CenterName | null;
}

export type WheelExplorationAction =
  | { kind: "codon"; codonId: number }
  | { kind: "center"; center: CenterName };

export function resolveWheelExplorationSelection(
  selection: WheelExplorationSelection,
  action: WheelExplorationAction
): WheelExplorationSelection {
  if (action.kind === "codon") {
    return { focusedCodonId: action.codonId, activeCenter: null };
  }
  return {
    focusedCodonId: null,
    activeCenter:
      selection.activeCenter === action.center ? null : action.center,
  };
}

const CX = 380;
const CY = 380;
const CENTER_BAND_OUTER = 244;
const CENTER_BAND_INNER = 206;
const QUADRANTS = [
  { name: "INITIATION", numericAnchor: 1, astronomicalAnchor: 51 },
  { name: "CIVILIZATION", numericAnchor: 17, astronomicalAnchor: 53 },
  { name: "DUALITY", numericAnchor: 33, astronomicalAnchor: 57 },
  { name: "MUTATION", numericAnchor: 49, astronomicalAnchor: 54 },
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

function shortestAngularDelta(fromAngle: number, toAngle: number) {
  const raw = toAngle - fromAngle;
  const delta = ((raw + 540) % 360) - 180;
  return delta === -180 && raw > 0 ? 180 : delta;
}

export function WheelSignatureControl({
  state,
  baseView,
  geometry = "numeric",
  onToggle,
  onGeometryToggle = () => undefined,
  onRetry,
}: {
  state: WheelLoadState;
  baseView: BaseView;
  geometry?: WheelGeometry;
  onToggle: (nextView: BaseView) => void;
  onGeometryToggle?: (geometry: WheelGeometry) => void;
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
            if (baseView !== "field") onToggle("field");
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
            if (ready && baseView !== "mine") onToggle("mine");
          }}
        >
          <span className="cz-wheel-mode-node" aria-hidden="true" />
          My Signature
        </button>
      </div>
      {/* TEMPORARILY REMOVED: Canonical / Astronomical geometry toggle is buggy.
          Restore this block when the astronomical geometry is fixed. See branch
          feature/codon-wheel-astronomical.
      <button
        type="button"
        className={`cz-wheel-mode-option cz-wheel-geometry-toggle ${
          geometry === "astronomical" ? "is-active" : ""
        }`}
        aria-pressed={geometry === "astronomical"}
        aria-label="Use canonical astronomical Mandala geometry"
        onClick={() =>
          onGeometryToggle(
            geometry === "astronomical" ? "numeric" : "astronomical"
          )
        }
      >
        <span className="cz-wheel-mode-node" aria-hidden="true" />
        Canonical / Astronomical
      </button>
      */}
      {state === "loading" && (
        <span className="cz-wheel-status">
          Receiving your stored signature…
        </span>
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
          <button type="button" className="cz-wheel-retry" onClick={onRetry}>
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
  selectedFacet?: Facet;
  selectedLayer?: Layer;
  geometry?: WheelGeometry;
  activations: readonly Activation[];
  view: WheelView;
  onFocus?: (codonId: number) => void;
  onCellSelect?: (selection: WheelCellSelection) => void;
  onLeaveFocus?: () => void;
  showSignatureContext?: boolean;
  activeRoleIdx?: number | null;
  activeCenter?: CenterName | null;
  onCenterSelect?: (center: CenterName | null) => void;
  onDeselect?: () => void;
}

export function CodonWheelPlate({
  codons,
  selectedId,
  selectedFacet = "A",
  selectedLayer = "conscious",
  geometry = "numeric",
  activations,
  view,
  onFocus,
  onCellSelect,
  onLeaveFocus,
  showSignatureContext,
  activeRoleIdx,
  activeCenter,
  onCenterSelect,
  onDeselect,
}: CodonWheelPlateProps) {
  const reducedMotion = Boolean(useReducedMotion());
  const svgRef = useRef<SVGSVGElement | null>(null);
  const geometryTimeline = useRef<gsap.core.Timeline | null>(null);
  const renderedGeometry = useRef<WheelGeometry>(geometry);
  const [hoveredId, setHoveredId] = useState<number | null>(null);
  const [geometryAnimating, setGeometryAnimating] = useState(false);
  const effectiveView: WheelView =
    hoveredId === null ? view : { kind: "focus", codonId: hoveredId };
  const signatureContextVisible = showSignatureContext ?? view.kind !== "field";
  const fullFieldVisible = !signatureContextVisible;
  const fieldCenterSelection =
    fullFieldVisible && view.kind !== "focus" ? (activeCenter ?? null) : null;
  const fieldSelectionId =
    fullFieldVisible && fieldCenterSelection === null && view.kind === "focus"
      ? view.codonId
      : null;
  const previousView = useRef<WheelView>(effectiveView);
  const wheelMotion = resolveWheelMotion(
    previousView.current,
    effectiveView,
    reducedMotion
  );

  useEffect(() => {
    previousView.current = effectiveView;
  }, [effectiveView]);

  useEffect(
    () => () => {
      geometryTimeline.current?.kill();
    },
    []
  );

  useLayoutEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const previousGeometry = renderedGeometry.current;
    const orbitGroups = Array.from(
      svg.querySelectorAll<SVGGElement>("[data-codon-orbit]")
    );
    const uprightGlyphs = Array.from(
      svg.querySelectorAll<SVGImageElement>("[data-wheel-upright]")
    );
    if (reducedMotion) {
      geometryTimeline.current?.kill();
      delete svg.dataset.geometryAnimating;
      setGeometryAnimating(false);
      gsap.set(orbitGroups, {
        clearProps: "transform",
      });
      for (const glyph of uprightGlyphs) {
        const codonId = Number(glyph.dataset.uprightCodon);
        const baseRotation = shortestAngularDelta(
          codonStartAngle(codonId, "numeric"),
          codonStartAngle(codonId, geometry)
        );
        gsap.set(glyph, { rotation: -baseRotation });
      }
      svg.style.removeProperty("--wheel-secondary-opacity");
      svg.style.removeProperty("--wheel-central-opacity");
      renderedGeometry.current = geometry;
      geometryTimeline.current = null;
      return;
    }

    if (previousGeometry === geometry) return;

    const primaryOrbitByCodon = new Map<number, SVGGElement>();

    for (const group of orbitGroups) {
      const codonId = Number(group.dataset.codonOrbit);
      if (!primaryOrbitByCodon.has(codonId)) {
        primaryOrbitByCodon.set(codonId, group);
      }
    }

    const inverseRotationByCodon = new Map<number, number>();
    for (const codonId of CODON_IDS) {
      const primaryOrbit = primaryOrbitByCodon.get(codonId);
      const currentRotation = primaryOrbit
        ? Number(gsap.getProperty(primaryOrbit, "rotation")) || 0
        : 0;
      const currentVisualAngle =
        codonStartAngle(codonId, previousGeometry) + currentRotation;
      inverseRotationByCodon.set(
        codonId,
        shortestAngularDelta(
          codonStartAngle(codonId, geometry),
          currentVisualAngle
        )
      );
    }

    geometryTimeline.current?.kill();
    renderedGeometry.current = geometry;
    svg.dataset.geometryAnimating = "true";
    setGeometryAnimating(true);
    if (!svg.style.getPropertyValue("--wheel-secondary-opacity")) {
      svg.style.setProperty("--wheel-secondary-opacity", "1");
    }
    if (!svg.style.getPropertyValue("--wheel-central-opacity")) {
      svg.style.setProperty("--wheel-central-opacity", "1");
    }

    for (const group of orbitGroups) {
      const codonId = Number(group.dataset.codonOrbit);
      gsap.set(group, {
        rotation: inverseRotationByCodon.get(codonId) ?? 0,
        svgOrigin: `${CX} ${CY}`,
      });
    }
    for (const glyph of uprightGlyphs) {
      const codonId = Number(glyph.dataset.uprightCodon);
      const baseRotation = shortestAngularDelta(
        codonStartAngle(codonId, "numeric"),
        codonStartAngle(codonId, geometry)
      );
      gsap.set(glyph, {
        rotation: -(baseRotation + (inverseRotationByCodon.get(codonId) ?? 0)),
      });
    }
    const timeline = gsap.timeline({
      onComplete: () => {
        if (geometryTimeline.current !== timeline) return;
        delete svg.dataset.geometryAnimating;
        setGeometryAnimating(false);
        gsap.set(orbitGroups, {
          clearProps: "transform",
        });
        svg.style.removeProperty("--wheel-secondary-opacity");
        svg.style.removeProperty("--wheel-central-opacity");
        geometryTimeline.current = null;
      },
    });
    geometryTimeline.current = timeline;

    timeline
      .to(
        svg,
        {
          "--wheel-secondary-opacity": 0.2,
          duration: 0.18,
          ease: "power1.out",
        },
        0
      )
      .to(
        svg,
        {
          "--wheel-central-opacity": 0.32,
          duration: 0.22,
          ease: "power1.out",
        },
        0
      )
      .to(
        orbitGroups,
        {
          rotation: 0,
          svgOrigin: `${CX} ${CY}`,
          duration: 1,
          ease: "power3.inOut",
          overwrite: "auto",
        },
        0.1
      )
      .to(
        uprightGlyphs,
        {
          rotation: (_index, glyph: SVGImageElement) => {
            const codonId = Number(glyph.dataset.uprightCodon);
            return -shortestAngularDelta(
              codonStartAngle(codonId, "numeric"),
              codonStartAngle(codonId, geometry)
            );
          },
          duration: 1,
          ease: "power3.inOut",
          overwrite: "auto",
        },
        0.1
      )
      .to(
        svg,
        {
          "--wheel-central-opacity": 1,
          duration: 0.28,
          ease: "power1.out",
        },
        0.88
      )
      .to(
        svg,
        {
          "--wheel-secondary-opacity": 1,
          duration: 0.22,
          ease: "power1.out",
        },
        0.98
      );
  }, [geometry, reducedMotion]);

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
    () => new Set(visibleActivations.map(activation => activation.codonId)),
    [visibleActivations]
  );
  const selectedCode = `RC${String(selectedId).padStart(2, "0")}`;
  const ariaLabel = `Codon wheel. 64 codons in two layers. ${occupiedCodons.size} codons activated. ${visibleBothLayers.size} present in both layers. Selected ${selectedCode}, facet ${selectedFacet}, ${selectedLayer} layer.`;
  const transition = `opacity ${wheelMotion.durationMs}ms ${wheelMotion.easing}`;
  const cellTransition = `fill-opacity ${wheelMotion.durationMs}ms ${wheelMotion.easing}`;
  const markerTransition = `${transition}, r ${wheelMotion.durationMs}ms ${wheelMotion.easing}`;
  const selectionRadii = BAND_RADII[selectedLayer];
  const selectionStart = cellAngle(selectedId, selectedFacet, "numeric");
  const selectionHue = selectedLayer === "conscious" ? "#e8c477" : "#6fb7c7";

  const handleKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const currentCodonId =
      effectiveView.kind === "focus" ? effectiveView.codonId : selectedId;
    const action = resolveWheelKey(event.key, currentCodonId, geometry);
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
        ref={svgRef}
        viewBox="0 0 760 760"
        className="cz-wheel-svg"
        data-wheel-geometry={geometry}
        role="group"
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
            const anchorCodon =
              geometry === "astronomical"
                ? quadrant.astronomicalAnchor
                : quadrant.numericAnchor;
            const midAngle = codonStartAngle(anchorCodon, geometry) + 45;
            return (
              <path
                key={quadrant.name}
                id={`quadrant-arc-${quadrant.name.toLowerCase()}`}
                data-quadrant-name={quadrant.name}
                data-quadrant-anchor-codon={anchorCodon}
                data-quadrant-geometry={geometry}
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

        {/* One composite transform per codon keeps all visible facets, marks,
            activations, and selection overlays on the same circular route. */}
        <g aria-hidden="true">
          {CODON_IDS.map(codonId => {
            const codon = codonById.get(codonId);
            const codonStart = codonStartAngle(codonId, "numeric");
            const midAngle = codonMidAngle(codonId, "numeric");
            const baseRotation = shortestAngularDelta(
              codonStart,
              codonStartAngle(codonId, geometry)
            );
            const center = CODON_CENTER[codonId];
            const isFieldSelection = fieldSelectionId === codonId;
            const isCenterSelection = fieldCenterSelection === center;
            const centerDimmed =
              fieldCenterSelection !== null && !isCenterSelection;
            const focused =
              effectiveView.kind === "focus" &&
              effectiveView.codonId === codonId;
            const roleIndex = Math.floor((codonId - 1) / 4);
            const roleActive =
              activeRoleIdx === null ||
              activeRoleIdx === undefined ||
              activeRoleIdx === roleIndex;
            const centerActive = !activeCenter || activeCenter === center;
            const glyphPoint = polar(
              CX,
              CY,
              (CONSCIOUS_INNER_RADIUS + CONSCIOUS_OUTER_RADIUS) / 2,
              midAngle
            );
            const rolePoint = polar(CX, CY, DESIGN_INNER_RADIUS - 11, midAngle);
            const bothPoint = polar(CX, CY, BOTH_LAYER_RADIUS, midAngle);
            const centerPoint = polar(
              CX,
              CY,
              (CENTER_BAND_INNER + CENTER_BAND_OUTER) / 2,
              midAngle
            );
            const boundaryInner = polar(
              CX,
              CY,
              DESIGN_INNER_RADIUS,
              codonStart
            );
            const boundaryOuter = polar(
              CX,
              CY,
              CONSCIOUS_OUTER_RADIUS,
              codonStart
            );

            return (
              <g
                key={`codon-base-${codonId}`}
                data-codon-base={codonId}
                data-codon-base-rotation={baseRotation}
                transform={`rotate(${baseRotation} ${CX} ${CY})`}
              >
                <g data-codon-orbit={codonId}>
                  {LAYERS.flatMap(layer =>
                    FACETS.map(facet => {
                      const start = cellAngle(codonId, facet, "numeric");
                      const radii = BAND_RADII[layer];
                      const key = `${codonId}-${facet}-${layer}` as const;
                      const isVisibleActivation = visibleLitSet.has(key);
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
                          fill={
                            fullFieldVisible ? CENTER_HUE[center] : NEUTRAL_HUE
                          }
                          fillOpacity={
                            isVisibleActivation || isFieldSelection
                              ? 0
                              : fullFieldVisible
                                ? isCenterSelection
                                  ? 1
                                  : FIELD_CELL_OPACITY
                                : cellOpacity(false, effectiveView, codonId)
                          }
                          stroke="none"
                          style={{ transition: cellTransition }}
                        />
                      );
                    })
                  )}

                  <g
                    fill="none"
                    stroke={GROUND_HUE}
                    strokeWidth="0.55"
                    vectorEffect="non-scaling-stroke"
                  >
                    {LAYERS.flatMap(layer =>
                      FACETS.slice(1).map(facet => {
                        const angle = cellAngle(codonId, facet, "numeric");
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
                    )}
                  </g>

                  <line
                    data-boundary-codon={codonId}
                    x1={boundaryInner.x}
                    y1={boundaryInner.y}
                    x2={boundaryOuter.x}
                    y2={boundaryOuter.y}
                    fill="none"
                    stroke={NEUTRAL_HUE}
                    strokeWidth="0.7"
                    vectorEffect="non-scaling-stroke"
                    opacity={boundaryOpacity(effectiveView, codonId)}
                    style={{ transition }}
                  />

                  {LAYERS.flatMap(layer =>
                    FACETS.map(facet => {
                      const key = `${codonId}-${facet}-${layer}` as const;
                      if (!visibleLitSet.has(key)) return null;
                      const radii = BAND_RADII[layer];
                      const start = cellAngle(codonId, facet, "numeric");
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
                          fill={CENTER_HUE[center]}
                          fillOpacity={cellOpacity(
                            true,
                            effectiveView,
                            codonId
                          )}
                          stroke="none"
                          style={{
                            transition: cellTransition,
                            transitionDelay: `${delay}ms`,
                          }}
                        />
                      );
                    })
                  )}

                  {isFieldSelection &&
                    LAYERS.flatMap(layer =>
                      FACETS.map(facet => {
                        const radii = BAND_RADII[layer];
                        const start = cellAngle(codonId, facet, "numeric");
                        return (
                          <path
                            key={`field-selection-${codonId}-${facet}-${layer}`}
                            data-cell-kind="field-selection"
                            data-codon-id={codonId}
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
                            fill={CENTER_HUE[center]}
                            fillOpacity={1}
                            stroke={GROUND_HUE}
                            strokeWidth="0.35"
                            vectorEffect="non-scaling-stroke"
                            style={{ transition: cellTransition }}
                          />
                        );
                      })
                    )}

                  {visibleBothLayers.has(codonId) && (
                    <circle
                      data-both-layer-codon={codonId}
                      cx={bothPoint.x}
                      cy={bothPoint.y}
                      r={focused ? 4.2 : 2.6}
                      fill={CENTER_HUE[center]}
                      opacity={markerOpacity(effectiveView, codonId)}
                      style={{ transition: markerTransition }}
                    />
                  )}

                  {codon && (
                    <g data-wheel-secondary="glyphs" pointerEvents="none">
                      <g opacity={roleActive && centerActive ? 0.72 : 0.22}>
                        <image
                          data-wheel-upright="codon"
                          data-upright-codon={codonId}
                          href={`/symbols/${codon.code}.png`}
                          x={glyphPoint.x - 7}
                          y={glyphPoint.y - 7}
                          width="14"
                          height="14"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            filter: "brightness(0)",
                            transform: `rotate(${-baseRotation}deg)`,
                            transformBox: "fill-box",
                            transformOrigin: "center",
                          }}
                        />
                        <image
                          data-wheel-upright="role"
                          data-upright-codon={codonId}
                          href={ROLE_VECTORS[roleIndex]}
                          x={rolePoint.x - 4.5}
                          y={rolePoint.y - 4.5}
                          width="9"
                          height="9"
                          preserveAspectRatio="xMidYMid meet"
                          style={{
                            filter: "brightness(0)",
                            transform: `rotate(${-baseRotation}deg)`,
                            transformBox: "fill-box",
                            transformOrigin: "center",
                          }}
                        />
                      </g>
                    </g>
                  )}

                  <g
                    data-wheel-central-highlight="center-band"
                    pointerEvents="none"
                  >
                    <path
                      d={wedge(
                        CX,
                        CY,
                        CENTER_BAND_INNER,
                        CENTER_BAND_OUTER,
                        codonStart,
                        codonStart + SEG
                      )}
                      fill={
                        isCenterSelection ? CENTER_HUE[center] : NEUTRAL_HUE
                      }
                      fillOpacity={isCenterSelection ? 0.34 : 0.035}
                      stroke={GROUND_HUE}
                      strokeWidth="0.4"
                    />
                    <image
                      data-wheel-upright="center"
                      data-upright-codon={codonId}
                      href={`/9-centers/${CENTER_SYMBOL[center]}.png`}
                      x={centerPoint.x - 6}
                      y={centerPoint.y - 6}
                      width="12"
                      height="12"
                      preserveAspectRatio="xMidYMid meet"
                      opacity={
                        isCenterSelection ? 0.96 : centerDimmed ? 0.18 : 0.42
                      }
                      style={{
                        filter: "brightness(0) invert(0.72)",
                        transform: `rotate(${-baseRotation}deg)`,
                        transformBox: "fill-box",
                        transformOrigin: "center",
                      }}
                    />
                  </g>

                  {focused && (
                    <g
                      data-focus-codon={codonId}
                      fill="none"
                      stroke="#fff8ec"
                      strokeWidth="1.15"
                      opacity="0.72"
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    >
                      {LAYERS.map(layer => {
                        const radii = BAND_RADII[layer];
                        return (
                          <path
                            key={`focus-${layer}`}
                            d={wedge(
                              CX,
                              CY,
                              radii.inner,
                              radii.outer,
                              codonStart,
                              codonStart + SEG
                            )}
                            style={{ transition }}
                          />
                        );
                      })}
                    </g>
                  )}

                  {fieldCenterSelection === null && selectedId === codonId && (
                    <path
                      data-cell-kind="selection"
                      data-codon-id={selectedId}
                      data-facet={selectedFacet}
                      data-layer={selectedLayer}
                      d={wedge(
                        CX,
                        CY,
                        selectionRadii.inner,
                        selectionRadii.outer,
                        selectionStart,
                        selectionStart + FACET_SPAN
                      )}
                      fill={selectionHue}
                      fillOpacity="0.3"
                      stroke={selectionHue}
                      strokeWidth="2.35"
                      vectorEffect="non-scaling-stroke"
                      pointerEvents="none"
                    />
                  )}

                  <g
                    className="cz-cell-hit-layer"
                    fill="transparent"
                    stroke="none"
                    onMouseLeave={() => setHoveredId(null)}
                  >
                    {LAYERS.flatMap(layer =>
                      FACETS.map(facet => {
                        const start = cellAngle(codonId, facet, "numeric");
                        const radii = BAND_RADII[layer];
                        const hitInnerRadius =
                          layer === "conscious"
                            ? BOTH_LAYER_RADIUS
                            : radii.inner;
                        const hitOuterRadius =
                          layer === "design" ? BOTH_LAYER_RADIUS : radii.outer;
                        return (
                          <path
                            key={`hit-${codonId}-${facet}-${layer}`}
                            data-cell-kind="hit"
                            data-hit-codon={codonId}
                            data-hit-facet={facet}
                            data-hit-layer={layer}
                            data-hit-inner-radius={hitInnerRadius}
                            data-hit-outer-radius={hitOuterRadius}
                            d={wedge(
                              CX,
                              CY,
                              hitInnerRadius,
                              hitOuterRadius,
                              start,
                              start + FACET_SPAN
                            )}
                            pointerEvents="all"
                            style={{ cursor: "pointer" }}
                            onMouseEnter={() => setHoveredId(codonId)}
                            onClick={event => {
                              event.stopPropagation();
                              onCellSelect?.({ codonId, facet, layer });
                            }}
                          >
                            <title>
                              {codon
                                ? `${codon.code} · ${codon.name} · Facet ${facet} · ${layer === "conscious" ? "Conscious" : "Design"}`
                                : `Codon ${codonId} · Facet ${facet} · ${layer}`}
                            </title>
                          </path>
                        );
                      })
                    )}
                  </g>
                </g>
              </g>
            );
          })}
        </g>

        {/* Exact band edges remain fixed while codons travel beneath them. */}
        <g
          fill="none"
          stroke={NEUTRAL_HUE}
          strokeWidth="0.7"
          opacity="0.4"
          vectorEffect="non-scaling-stroke"
          pointerEvents="none"
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

        {/* Eight logical controls span the 64 repeated center-symbol wedges. */}
        {onCenterSelect && (
          <g
            className="cz-center-hit-layer"
            aria-hidden={!fullFieldVisible}
            style={{
              pointerEvents: fullFieldVisible ? "auto" : "none",
              visibility: fullFieldVisible ? "visible" : "hidden",
            }}
          >
            {CENTERS.map(center => {
              const isSelected = fieldCenterSelection === center.name;
              return (
                <g
                  key={`center-control-${center.name}`}
                  className="cz-center-hit-control"
                  data-center-control={center.name}
                  role={fullFieldVisible ? "button" : undefined}
                  tabIndex={fullFieldVisible ? 0 : -1}
                  aria-pressed={fullFieldVisible ? isSelected : undefined}
                  aria-disabled={
                    fullFieldVisible && geometryAnimating ? true : undefined
                  }
                  aria-label={`${center.name} center — highlight its eight codons`}
                  onClick={event => {
                    if (
                      !fullFieldVisible ||
                      svgRef.current?.dataset.geometryAnimating === "true"
                    )
                      return;
                    event.stopPropagation();
                    onCenterSelect(isSelected ? null : center.name);
                  }}
                  onKeyDown={event => {
                    if (!fullFieldVisible) return;
                    const isActivationKey =
                      !event.repeat &&
                      (event.key === "Enter" || event.key === " ");
                    if (svgRef.current?.dataset.geometryAnimating === "true") {
                      if (isActivationKey) {
                        event.preventDefault();
                        event.stopPropagation();
                      }
                      return;
                    }
                    event.stopPropagation();
                    if (isActivationKey) {
                      event.preventDefault();
                      onCenterSelect(isSelected ? null : center.name);
                    }
                  }}
                >
                  {CODON_IDS.filter(
                    codonId => CODON_CENTER[codonId] === center.name
                  ).map(codonId => {
                    const start = codonStartAngle(codonId, geometry);
                    return (
                      <g key={`center-hit-${center.name}-${codonId}`}>
                        <path
                          data-center-kind="hit"
                          data-center-name={center.name}
                          data-center-codon={codonId}
                          data-hit-inner-radius={CENTER_BAND_INNER}
                          data-hit-outer-radius={CENTER_BAND_OUTER}
                          d={wedge(
                            CX,
                            CY,
                            CENTER_BAND_INNER,
                            CENTER_BAND_OUTER,
                            start,
                            start + SEG
                          )}
                          fill="transparent"
                          stroke="none"
                          pointerEvents="all"
                          style={{ cursor: "pointer" }}
                        >
                          <title>{`${center.name} center · highlight eight codons`}</title>
                        </path>
                      </g>
                    );
                  })}
                </g>
              );
            })}
          </g>
        )}

        <g
          data-wheel-secondary="quadrant-labels"
          pointerEvents="none"
          aria-hidden="true"
        >
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
                href={`#quadrant-arc-${quadrant.name.toLowerCase()}`}
                startOffset="50%"
              >
                {quadrant.name}
              </textPath>
            </text>
          ))}
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
                <img src={`/symbols/${selectedCodon.code}.png`} alt="" />
              </div>
              <div className="cz-wheel-hub-copy">
                <span className="cz-wheel-hub-code">{selectedCodon.code}</span>
                <span className="cz-wheel-hub-name">{selectedCodon.name}</span>
                <span className="cz-wheel-hub-role">
                  {ROLES[selectedRoleIdx]?.name}
                </span>
              </div>
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
  selectedFacet = "A",
  selectedLayer = "conscious",
  viewPreference,
  geometryPreference,
  onCellSelect,
  onViewPreferenceChange,
  onGeometryPreferenceChange,
  onSignatureContextChange,
  activeRoleIdx,
  activeCenter,
  onCenterSelect,
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
  const [automaticBaseView, setAutomaticBaseView] = useState<BaseView>("field");
  const [automaticGeometry, setAutomaticGeometry] =
    useState<WheelGeometry>("astronomical");
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
  const baseView = resolveBaseView(
    loadState,
    viewPreference,
    automaticBaseView
  );
  const geometry = geometryPreference ?? automaticGeometry;
  const activations: readonly Activation[] =
    loadState === "ready" && wheelQuery.data?.state === "ready"
      ? wheelQuery.data.activations
      : EMPTY_ACTIVATIONS;
  const calculationKey =
    loadState === "ready" && wheelQuery.data?.state === "ready"
      ? `${receiverId}:${String(wheelQuery.data.calculatedAt)}`
      : null;

  useEffect(() => {
    if (!calculationKey || loadedCalculation.current === calculationKey) return;
    loadedCalculation.current = calculationKey;
    setAutomaticBaseView("mine");
    setFocusedCodonId(null);
  }, [calculationKey]);

  useEffect(() => {
    if (loadState !== "ready") setAutomaticBaseView("field");
  }, [loadState]);

  useEffect(() => {
    if (previousSelectedId.current === selectedId) return;
    previousSelectedId.current = selectedId;
    setFocusedCodonId(selectedId);
  }, [selectedId]);

  useEffect(() => {
    if (activeCenter && baseView === "field") setFocusedCodonId(null);
  }, [activeCenter, baseView]);

  const view = resolveWheelView(loadState, baseView, focusedCodonId);
  const signatureContext = useMemo(
    () =>
      resolveWheelSignatureContext(
        loadState,
        baseView,
        activations,
        selectedId
      ),
    [activations, baseView, loadState, selectedId]
  );
  const signatureMode = signatureContext.mode === "mine";

  useLayoutEffect(() => {
    onSignatureContextChange?.(signatureContext);
  }, [onSignatureContextChange, signatureContext]);

  const selectExplorationCodon = (codonId: number) => {
    if (baseView !== "field") {
      setFocusedCodonId(codonId);
      return;
    }
    const nextSelection = resolveWheelExplorationSelection(
      { focusedCodonId, activeCenter: activeCenter ?? null },
      { kind: "codon", codonId }
    );
    setFocusedCodonId(nextSelection.focusedCodonId);
    if (nextSelection.activeCenter !== (activeCenter ?? null)) {
      onCenterSelect?.(nextSelection.activeCenter);
    }
  };

  const focusCodon = (codonId: number) => {
    selectExplorationCodon(codonId);
    onSelect(codonId);
    onCellSelect?.({
      codonId,
      facet: selectedFacet,
      layer: selectedLayer,
    });
  };

  const selectCell = (selection: WheelCellSelection) => {
    selectExplorationCodon(selection.codonId);
    onSelect(selection.codonId);
    onCellSelect?.(selection);
  };

  const selectCenter = (center: CenterName) => {
    const nextSelection = resolveWheelExplorationSelection(
      { focusedCodonId, activeCenter: activeCenter ?? null },
      { kind: "center", center }
    );
    setFocusedCodonId(nextSelection.focusedCodonId);
    onCenterSelect?.(nextSelection.activeCenter);
  };

  return (
    <div className="cz-wheel-container">
      <WheelSignatureControl
        state={loadState}
        baseView={baseView}
        geometry={geometry}
        onToggle={nextBaseView => {
          onSignatureContextChange?.(
            resolveWheelSignatureContext(
              loadState,
              nextBaseView,
              activations,
              selectedId
            )
          );
          setAutomaticBaseView(nextBaseView);
          onViewPreferenceChange?.(nextBaseView);
          setFocusedCodonId(null);
        }}
        onGeometryToggle={nextGeometry => {
          setAutomaticGeometry(nextGeometry);
          onGeometryPreferenceChange?.(nextGeometry);
        }}
        onRetry={() => {
          void wheelQuery.refetch();
        }}
      />
      <CodonWheelPlate
        codons={codons}
        selectedId={selectedId}
        selectedFacet={selectedFacet}
        selectedLayer={selectedLayer}
        geometry={geometry}
        activations={activations}
        view={view}
        onFocus={focusCodon}
        onCellSelect={selectCell}
        onLeaveFocus={() => setFocusedCodonId(null)}
        showSignatureContext={loadState === "ready" && baseView === "mine"}
        activeRoleIdx={activeRoleIdx}
        activeCenter={activeCenter}
        onCenterSelect={center => {
          if (center === null) {
            setFocusedCodonId(null);
            onCenterSelect?.(null);
            return;
          }
          selectCenter(center);
        }}
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
        .cz-wheel-geometry-toggle {
          min-width: min(100%, 204px);
          min-height: 40px;
          border: 1px solid rgba(151, 96, 122, 0.42);
          background:
            linear-gradient(135deg, rgba(151, 96, 122, 0.075), rgba(122, 90, 146, 0.045)),
            rgba(8, 7, 11, 0.72);
          white-space: nowrap;
          box-shadow: 0 0 24px rgba(122, 90, 146, 0.055);
        }
        .cz-wheel-geometry-toggle.is-active {
          color: #d7c7e8;
          background:
            linear-gradient(135deg, rgba(151, 96, 122, 0.18), rgba(122, 90, 146, 0.14)),
            rgba(8, 7, 11, 0.78);
          box-shadow:
            inset 0 -1px rgba(215, 199, 232, 0.7),
            0 0 18px rgba(122, 90, 146, 0.16);
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
        .cz-wheel-svg [data-wheel-secondary] {
          opacity: var(--wheel-secondary-opacity, 1);
        }
        .cz-wheel-svg [data-wheel-central-highlight] {
          opacity: var(--wheel-central-opacity, 1);
        }
        .cz-wheel-svg[data-geometry-animating="true"] .cz-cell-hit-layer *,
        .cz-wheel-svg[data-geometry-animating="true"] .cz-center-hit-layer * {
          pointer-events: none !important;
        }
        .cz-center-hit-control {
          outline: none;
        }
        .cz-center-hit-control:focus-visible path {
          stroke: #fff8ec;
          stroke-width: 1.15;
          vector-effect: non-scaling-stroke;
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
          position: absolute;
          inset: 0;
          display: grid;
          place-items: center;
        }
        .cz-wheel-hub-symbol {
          box-sizing: border-box;
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
        .cz-wheel-hub-copy {
          position: absolute;
          top: calc(50% + 47px);
          left: 50%;
          width: max-content;
          max-width: 220px;
          display: flex;
          flex-direction: column;
          align-items: center;
          transform: translateX(-50%);
          text-align: center;
        }
        .cz-wheel-hub-code {
          margin-top: 0;
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
