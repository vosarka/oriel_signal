import React, { useId, type ReactNode } from "react";

import {
  CODON_CENTER_MAP,
  ROLES,
  VRC_MANDALA,
} from "@/components/oriel-signal/CodonWheel";
import {
  VTRS_CENTERS,
  VTRS_LINKS,
  type VtrsLink,
} from "@/components/oriel-signal/vtrs/vtrs-data";
import { VTRS_BODY_ORDER, VTRS_SVG_LAYOUT } from "@/lib/vtrs-body-layout";

import { SampleArchiveSeal } from "./SampleArchiveSeal";
import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SIGNATURE_CONFIG,
} from "./tetradic-signature-config";

export type TetradicEditorialNumber =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12;

type TetradicEditorialVisualProps = Readonly<{
  number: TetradicEditorialNumber;
  symbol?: string;
  className?: string;
}>;

type VisualFrameProps = Readonly<{
  number: TetradicEditorialNumber;
  description: string;
  className?: string;
  children: ReactNode;
}>;

export const TETRADIC_EDITORIAL_VISUAL_LABELS: Readonly<
  Record<TetradicEditorialNumber, string>
> = {
  1: "A redacted Receiver Record connected to an illustrative archive seal.",
  2: "The canonical 64-position field, eight centers, and 32 Resonance Links shown as one system.",
  3: "The Conscious arrival and Design timing method shown as two redacted temporal streams.",
  4: "The canonical 64-position Codon Mandala with receiver activations withheld.",
  5: "The canonical eight-center structure with definition states withheld.",
  6: "The canonical 32-link Resonance network with active links and bottleneck withheld.",
  7: "The Conscious planetary group taxonomy with positions withheld.",
  8: "The Design planetary group taxonomy with positions and timestamp withheld.",
  9: "Two unassigned 16-role registers resolving toward a redacted synthesis field.",
  10: "The same eight-center topology shown under interference and coherence.",
  11: "Three observation protocols connected by a 48-hour calibration path.",
  12: "Seven-day and thirty-day observation rings surrounding the illustrative archive seal.",
};

const PLANET_GROUPS = [
  ["SUN", "EARTH"],
  ["MOON", "NORTH NODE", "SOUTH NODE"],
  ["MERCURY", "VENUS", "MARS"],
  ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"],
] as const;

const QUADRANTS = [
  "INITIATION",
  "CIVILIZATION",
  "DUALITY",
  "MUTATION",
] as const;

function VisualFrame({
  number,
  description,
  className,
  children,
}: VisualFrameProps) {
  const captionId = `tetradic-editorial-visual-${number}-${useId().replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const classes = [
    "tetradic-editorial-visual",
    `tetradic-editorial-visual--${String(number).padStart(2, "0")}`,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <figure className={classes} aria-labelledby={captionId}>
      {children}
      <figcaption id={captionId} className="tetradic-editorial-visual__caption">
        {description}
      </figcaption>
    </figure>
  );
}

function ChapterSymbol({
  number,
  symbol,
}: {
  number: TetradicEditorialNumber;
  symbol: string;
}) {
  return (
    <img
      className="tetradic-editorial-visual__symbol"
      src={symbol}
      alt={`Tetrad ${String(number).padStart(2, "0")} symbol`}
      width={500}
      height={500}
      loading="lazy"
      decoding="async"
    />
  );
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
}

function annularSector(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startDegrees: number,
  endDegrees: number
) {
  const outerStart = polarPoint(cx, cy, outerRadius, startDegrees);
  const outerEnd = polarPoint(cx, cy, outerRadius, endDegrees);
  const innerEnd = polarPoint(cx, cy, innerRadius, endDegrees);
  const innerStart = polarPoint(cx, cy, innerRadius, startDegrees);

  return [
    `M${outerStart.x} ${outerStart.y}`,
    `A${outerRadius} ${outerRadius} 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L${innerEnd.x} ${innerEnd.y}`,
    `A${innerRadius} ${innerRadius} 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function mappedCenter(centerId: string) {
  const point = VTRS_SVG_LAYOUT[centerId];
  return {
    x: 320 + (point.x - 50) * 3.1,
    y: 42 + (point.y - 3) * 3.65,
  };
}

function canonicalLinkPath(link: VtrsLink, index: number) {
  const from = mappedCenter(link.centerA);
  const to = mappedCenter(link.centerB);

  if (link.centerA === link.centerB) {
    const radius = 16 + (index % 4) * 4;
    return `M${from.x - 3} ${from.y}C${from.x - radius} ${from.y - radius} ${from.x + radius} ${from.y - radius} ${from.x + 3} ${from.y}`;
  }

  const offset = ((index % 7) - 3) * 3;
  const midpointX = (from.x + to.x) / 2 + offset;
  const midpointY = (from.y + to.y) / 2 - offset;
  return `M${from.x} ${from.y}Q${midpointX} ${midpointY} ${to.x} ${to.y}`;
}

function ReceiverRecordVisual({ symbol }: { symbol: string }) {
  const { sample } = TETRADIC_SIGNATURE_CONFIG;
  const recordItems = [
    ["RECEIVER", sample.receiver],
    ["RECORD STATUS", sample.recordStatus],
    ["BIRTH RECORD", sample.birthRecord],
    ["COORDINATES", sample.coordinates],
    ["ARCHIVE ID", sample.archiveId],
  ] as const;

  return (
    <VisualFrame
      number={1}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[1]}
      className="tetradic-editorial-visual--receiver"
    >
      <div className="tetradic-editorial-visual__record">
        <div className="tetradic-editorial-visual__record-field">
          <p className="tetradic-editorial-visual__field-label">
            RECEIVER RECORD INITIALIZATION
          </p>
          <dl className="tetradic-editorial-visual__record-list">
            {recordItems.map(([label, value]) => (
              <div key={label} data-record-field={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
          <p className="tetradic-editorial-visual__disclosure">
            ILLUSTRATIVE RECORD · NO PRIVATE OR EPHEMERIS DATA
          </p>
        </div>

        <svg
          className="tetradic-editorial-visual__annotation"
          viewBox="0 0 160 24"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M2 12H62C82 12 78 4 99 4h59" />
          <circle cx="2" cy="12" r="1.8" />
          <circle cx="158" cy="4" r="1.8" />
        </svg>

        <div className="tetradic-editorial-visual__seal">
          <SampleArchiveSeal archiveId={sample.archiveId} symbol={symbol} />
        </div>
      </div>
    </VisualFrame>
  );
}

function WholeArchitectureVisual({ symbol }: { symbol: string }) {
  return (
    <VisualFrame
      number={2}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[2]}
      className="tetradic-editorial-visual--architecture"
    >
      <div className="tetradic-editorial-visual__architecture-field">
        <svg
          viewBox="0 0 640 420"
          role="img"
          aria-label="Canonical whole-system structure: 64 positions, eight centers, and 32 Resonance Links. Receiver states are redacted."
        >
          <g className="tetradic-editorial-visual__mandala-field">
            <circle cx="320" cy="210" r="190" />
            <circle cx="320" cy="210" r="164" />
            {VRC_MANDALA.map((codon, index) => {
              const angle = (index / VRC_MANDALA.length) * 360;
              const inner = polarPoint(320, 210, 166, angle);
              const outer = polarPoint(
                320,
                210,
                index % 16 === 0 ? 196 : 187,
                angle
              );
              return (
                <line
                  key={codon}
                  x1={inner.x}
                  y1={inner.y}
                  x2={outer.x}
                  y2={outer.y}
                  data-codon={codon}
                >
                  <title>{`Codon ${codon}`}</title>
                </line>
              );
            })}
          </g>

          <g className="tetradic-editorial-visual__link-field">
            {VTRS_LINKS.map((link, index) => (
              <path key={link.id} d={canonicalLinkPath(link, index)}>
                <title>{`${link.id}: ${link.name}`}</title>
              </path>
            ))}
          </g>

          <g className="tetradic-editorial-visual__center-field">
            {VTRS_BODY_ORDER.map(centerId => {
              const point = mappedCenter(centerId);
              const center = VTRS_CENTERS.find(item => item.id === centerId);
              return (
                <g key={centerId}>
                  <circle cx={point.x} cy={point.y} r="12" />
                  <circle cx={point.x} cy={point.y} r="4" />
                  <title>{center?.name ?? centerId}</title>
                </g>
              );
            })}
          </g>
        </svg>
        <ChapterSymbol number={2} symbol={symbol} />
      </div>
      <div className="tetradic-editorial-visual__register">
        <span>64 / CODON POSITIONS</span>
        <span>08 / TETRADIC CENTERS</span>
        <span>32 / RESONANCE LINKS</span>
        <small>RECEIVER STATES REDACTED · STRUCTURE ONLY</small>
      </div>
    </VisualFrame>
  );
}

function TwoTimingsVisual({ symbol }: { symbol: string }) {
  return (
    <VisualFrame
      number={3}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[3]}
      className="tetradic-editorial-visual--timings"
    >
      <div className="tetradic-editorial-visual__timing-field">
        <svg
          viewBox="0 0 720 340"
          role="img"
          aria-label="Two redacted timing streams joined by the 88-degree solar descent method."
        >
          <g className="tetradic-editorial-visual__timing-axis">
            <path d="M58 104H662" />
            <path d="M58 238H662" />
            {[58, 360, 662].map(x => (
              <path key={x} d={`M${x} 72v198`} />
            ))}
          </g>
          <g className="tetradic-editorial-visual__timing-stream is-conscious">
            <circle cx="58" cy="104" r="12" />
            <circle cx="662" cy="104" r="12" />
            <path d="M70 104H650" />
            <text x="58" y="78">
              CONSCIOUS ARRIVAL
            </text>
            <text x="662" y="78" textAnchor="end">
              TIMESTAMP REDACTED
            </text>
          </g>
          <g className="tetradic-editorial-visual__timing-stream is-design">
            <circle cx="58" cy="238" r="12" />
            <circle cx="662" cy="238" r="12" />
            <path d="M70 238H650" />
            <text x="58" y="284">
              DESIGN TIMING
            </text>
            <text x="662" y="284" textAnchor="end">
              TIMESTAMP REDACTED
            </text>
          </g>
          <g className="tetradic-editorial-visual__solar-method">
            <path d="M360 104C440 128 440 212 360 238" />
            <circle cx="360" cy="104" r="18" />
            <circle cx="360" cy="238" r="18" />
            <text x="462" y="164">
              88° SOLAR DESCENT
            </text>
            <text x="462" y="184">
              METHOD · RESULT REDACTED
            </text>
          </g>
        </svg>
        <ChapterSymbol number={3} symbol={symbol} />
      </div>
      <div className="tetradic-editorial-visual__register">
        <span>CONSCIOUS LAYER / REDACTED</span>
        <span>DESIGN LAYER / REDACTED</span>
        <small>NO VERIFIED EPHEMERIS VALUES IN THIS PUBLIC SAMPLE</small>
      </div>
    </VisualFrame>
  );
}

function MandalaVisual({ symbol }: { symbol: string }) {
  return (
    <VisualFrame
      number={4}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[4]}
      className="tetradic-editorial-visual--mandala"
    >
      <div className="tetradic-editorial-visual__mandala">
        <svg
          viewBox="0 0 520 520"
          role="img"
          aria-label="Canonical 64-position Codon Mandala. No receiver activations are assigned."
        >
          <circle className="mandala-boundary" cx="260" cy="260" r="238" />
          <circle className="mandala-boundary" cx="260" cy="260" r="160" />
          {VRC_MANDALA.map((codon, index) => {
            const start = index * (360 / 64) + 0.5;
            const end = (index + 1) * (360 / 64) - 0.5;
            const center = CODON_CENTER_MAP[codon];
            return (
              <path
                key={codon}
                d={annularSector(260, 260, 172, 226, start, end)}
                className="mandala-position"
                data-codon={codon}
                data-center={center}
              >
                <title>{`Codon ${codon} · ${center} Center`}</title>
              </path>
            );
          })}
          {QUADRANTS.map((quadrant, index) => {
            const point = polarPoint(260, 260, 144, index * 90 + 45);
            return (
              <text
                key={quadrant}
                x={point.x}
                y={point.y}
                textAnchor="middle"
                className="mandala-quadrant"
              >
                {quadrant}
              </text>
            );
          })}
          <text x="260" y="252" textAnchor="middle" className="mandala-count">
            64
          </text>
          <text x="260" y="278" textAnchor="middle" className="mandala-label">
            CANONICAL POSITIONS
          </text>
        </svg>
        <ChapterSymbol number={4} symbol={symbol} />
      </div>
      <div className="tetradic-editorial-visual__register">
        <span>CANONICAL ORDER / 64 POSITIONS</span>
        <span>CONSCIOUS / DESIGN ACTIVATIONS REDACTED</span>
        <small>NO CONVERGENCE STATE ASSIGNED TO THIS SAMPLE</small>
      </div>
    </VisualFrame>
  );
}

function EightCentersVisual({ symbol }: { symbol: string }) {
  return (
    <VisualFrame
      number={5}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[5]}
      className="tetradic-editorial-visual--centers"
    >
      <div className="tetradic-editorial-visual__center-architecture">
        <svg
          viewBox="0 0 260 420"
          role="img"
          aria-label="Eight Tetradic Centers arranged from crown to root. Defined and open states are redacted."
        >
          <path
            className="center-body-axis"
            d="M130 22C102 22 92 48 100 74c4 14 18 23 18 36-45 15-72 50-72 93 0 37 20 62 35 79-18 30-31 65-34 112M130 22c28 0 38 26 30 52-4 14-18 23-18 36 45 15 72 50 72 93 0 37-20 62-35 79 18 30 31 65 34 112M130 90v304"
          />
          {VTRS_BODY_ORDER.map(centerId => {
            const source = VTRS_SVG_LAYOUT[centerId];
            const x = 130 + (source.x - 50) * 2.25;
            const y = 34 + (source.y - 3) * 4.05;
            const center = VTRS_CENTERS.find(item => item.id === centerId)!;
            return (
              <g key={centerId} className="center-node is-redacted">
                <circle cx={x} cy={y} r="15" />
                <circle cx={x} cy={y} r="4" />
                <text x={x + 25} y={y + 4}>
                  {center.roman}
                </text>
                <title>{`${center.name} · state redacted`}</title>
              </g>
            );
          })}
        </svg>
        <ChapterSymbol number={5} symbol={symbol} />
      </div>
      <ol className="tetradic-editorial-visual__center-register">
        {VTRS_BODY_ORDER.map(centerId => {
          const center = VTRS_CENTERS.find(item => item.id === centerId)!;
          return (
            <li key={centerId}>
              <b>{center.roman}</b>
              <span>{center.name}</span>
              <em>STATE REDACTED</em>
            </li>
          );
        })}
      </ol>
    </VisualFrame>
  );
}

function CircuitryVisual({ symbol }: { symbol: string }) {
  const circuitNames = Array.from(
    new Set(VTRS_LINKS.map(link => link.circuit))
  );

  return (
    <VisualFrame
      number={6}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[6]}
      className="tetradic-editorial-visual--circuitry"
    >
      <div className="tetradic-editorial-visual__circuitry-field">
        <svg
          viewBox="0 0 640 420"
          role="img"
          aria-label="Canonical network of 32 Resonance Links. No receiver links or bottleneck are assigned."
        >
          <g className="circuit-links">
            {VTRS_LINKS.map((link, index) => (
              <path
                key={link.id}
                d={canonicalLinkPath(link, index)}
                data-circuit={link.circuit}
              >
                <title>{`${link.id} · ${link.name} · ${link.circuit}`}</title>
              </path>
            ))}
          </g>
          <g className="circuit-centers">
            {VTRS_BODY_ORDER.map(centerId => {
              const point = mappedCenter(centerId);
              return (
                <g key={centerId}>
                  <circle cx={point.x} cy={point.y} r="14" />
                  <circle cx={point.x} cy={point.y} r="4" />
                  <title>{centerId}</title>
                </g>
              );
            })}
          </g>
        </svg>
        <ChapterSymbol number={6} symbol={symbol} />
      </div>
      <div className="tetradic-editorial-visual__circuit-register">
        <p>32 CANONICAL RESONANCE LINKS</p>
        <ul>
          {circuitNames.map(name => (
            <li key={name}>{name}</li>
          ))}
        </ul>
        <small>ACTIVE LINKS AND RECEIVER BOTTLENECK REDACTED</small>
      </div>
    </VisualFrame>
  );
}

function PlanetaryAtlasVisual({
  number,
  symbol,
  design = false,
}: {
  number: 7 | 8;
  symbol: string;
  design?: boolean;
}) {
  const layer = design ? "DESIGN" : "CONSCIOUS";

  return (
    <VisualFrame
      number={number}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[number]}
      className={`tetradic-editorial-visual--atlas is-${design ? "design" : "conscious"}`}
    >
      <div className="tetradic-editorial-visual__atlas-field">
        <svg
          viewBox="0 0 680 360"
          role="img"
          aria-label={`${layer} planetary group taxonomy. All positions are redacted.`}
        >
          <path className="atlas-axis" d="M70 180H610" />
          {PLANET_GROUPS.map((group, groupIndex) => {
            const x = design ? 550 - groupIndex * 140 : 130 + groupIndex * 140;
            const y = groupIndex % 2 === 0 ? 116 : 244;
            const radius = 32 + group.length * 2;
            return (
              <g key={group.join("-")} className="atlas-group">
                <line x1={x} y1={y} x2="340" y2="180" />
                <circle cx={x} cy={y} r={radius} />
                <circle cx={x} cy={y} r="5" />
                {group.map((planet, planetIndex) => {
                  const point = polarPoint(
                    x,
                    y,
                    radius - 10,
                    (planetIndex / group.length) * 360
                  );
                  return (
                    <circle key={planet} cx={point.x} cy={point.y} r="3">
                      <title>{planet}</title>
                    </circle>
                  );
                })}
              </g>
            );
          })}
          <circle className="atlas-center" cx="340" cy="180" r="22" />
          <text x="340" y="185" textAnchor="middle">
            {layer}
          </text>
        </svg>
        <ChapterSymbol number={number} symbol={symbol} />
      </div>
      <ol className="tetradic-editorial-visual__planet-register">
        {PLANET_GROUPS.map((group, index) => (
          <li key={group.join("-")}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>{group.join(" / ")}</span>
          </li>
        ))}
      </ol>
      <p className="tetradic-editorial-visual__disclosure">
        {design
          ? "DESIGN TIMESTAMP AND POSITIONS REDACTED · GROUP TAXONOMY ONLY"
          : "CONSCIOUS POSITIONS REDACTED · GROUP TAXONOMY ONLY"}
      </p>
    </VisualFrame>
  );
}

function RoleRing({
  cx,
  label,
}: {
  cx: number;
  label: "PRIMARY" | "SECONDARY";
}) {
  return (
    <g className={`role-ring is-${label.toLowerCase()}`}>
      <circle cx={cx} cy="190" r="112" />
      <circle cx={cx} cy="190" r="72" />
      {ROLES.map((role, index) => {
        const inner = polarPoint(cx, 190, 78, (index / ROLES.length) * 360);
        const outer = polarPoint(cx, 190, 108, (index / ROLES.length) * 360);
        return (
          <g key={role.name}>
            <line x1={inner.x} y1={inner.y} x2={outer.x} y2={outer.y} />
            <circle cx={outer.x} cy={outer.y} r="3">
              <title>{`${role.roman} · ${role.name}`}</title>
            </circle>
          </g>
        );
      })}
      <text x={cx} y="186" textAnchor="middle">
        {label}
      </text>
      <text x={cx} y="208" textAnchor="middle">
        ROLE / REDACTED
      </text>
    </g>
  );
}

function IdentitySynthesisVisual({ symbol }: { symbol: string }) {
  return (
    <VisualFrame
      number={9}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[9]}
      className="tetradic-editorial-visual--identity"
    >
      <div className="tetradic-editorial-visual__identity-field">
        <svg
          viewBox="0 0 720 380"
          role="img"
          aria-label="Primary and secondary 16-role registers. No role is assigned in the public sample."
        >
          <RoleRing cx={228} label="PRIMARY" />
          <RoleRing cx={492} label="SECONDARY" />
          <g className="role-convergence">
            <path d="M340 190h40" />
            <circle cx="360" cy="190" r="34" />
            <text x="360" y="187" textAnchor="middle">
              SYNTHESIS
            </text>
            <text x="360" y="207" textAnchor="middle">
              REDACTED
            </text>
          </g>
        </svg>
        <ChapterSymbol number={9} symbol={symbol} />
      </div>
      <div className="tetradic-editorial-visual__register">
        <span>PRIMARY RESONANCE ROLE / REDACTED</span>
        <span>SECONDARY PATTERN / REDACTED</span>
        <small>16-ROLE REGISTRY SHOWN · NO PERSONAL ROLE CALCULATED</small>
      </div>
    </VisualFrame>
  );
}

function TopologyState({
  xOffset,
  state,
}: {
  xOffset: number;
  state: "interference" | "coherence";
}) {
  return (
    <g
      className={`topology-state is-${state}`}
      transform={`translate(${xOffset} 0) scale(.72)`}
    >
      {VTRS_LINKS.map((link, index) => (
        <path key={link.id} d={canonicalLinkPath(link, index)} pathLength="1">
          <title>{link.name}</title>
        </path>
      ))}
      {VTRS_BODY_ORDER.map(centerId => {
        const point = mappedCenter(centerId);
        return (
          <g key={centerId}>
            <circle cx={point.x} cy={point.y} r="13" />
            <circle cx={point.x} cy={point.y} r="4" />
          </g>
        );
      })}
    </g>
  );
}

function ShadowGiftVisual({ symbol }: { symbol: string }) {
  return (
    <VisualFrame
      number={10}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[10]}
      className="tetradic-editorial-visual--shadow-gift"
    >
      <div className="tetradic-editorial-visual__shadow-gift-field">
        <svg
          viewBox="0 0 760 420"
          role="img"
          aria-label="The same canonical center and link topology shown as interference and coherence. These are structural examples, not personal findings."
        >
          <TopologyState xOffset={0} state="interference" />
          <TopologyState xOffset={300} state="coherence" />
          <path className="topology-transition" d="M344 210h72" />
          <text x="178" y="390" textAnchor="middle">
            INTERFERENCE / EXAMPLE STATE
          </text>
          <text x="582" y="390" textAnchor="middle">
            COHERENCE / EXAMPLE STATE
          </text>
        </svg>
        <ChapterSymbol number={10} symbol={symbol} />
      </div>
      <p className="tetradic-editorial-visual__disclosure">
        ONE TOPOLOGY · TWO OPERATING CONDITIONS · NO PERSONAL FINDING
      </p>
    </VisualFrame>
  );
}

function SomaticPracticeVisual({ symbol }: { symbol: string }) {
  const protocols = [
    ["01", "OBSERVE", "Locate pressure before response."],
    ["02", "CALIBRATE", "Test one correction for forty-eight hours."],
    ["03", "VERIFY", "Keep only what changes observation."],
  ] as const;

  return (
    <VisualFrame
      number={11}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[11]}
      className="tetradic-editorial-visual--practice"
    >
      <div className="tetradic-editorial-visual__protocols">
        {protocols.map(([number, title, copy]) => (
          <div key={number}>
            <b>{number}</b>
            <h3>{title}</h3>
            <p>{copy}</p>
          </div>
        ))}
      </div>
      <div className="tetradic-editorial-visual__calibration-field">
        <svg
          viewBox="0 0 720 160"
          role="img"
          aria-label="A 48-hour observation path with baseline, 24-hour check, and 48-hour review."
        >
          <path d="M58 80C190 28 250 132 360 80s180-52 302 0" />
          {[
            [58, "0H / BASELINE"],
            [360, "24H / CHECK"],
            [662, "48H / REVIEW"],
          ].map(([x, label]) => (
            <g key={label}>
              <line x1={x} y1="34" x2={x} y2="126" />
              <circle cx={x} cy="80" r="10" />
              <circle cx={x} cy="80" r="3" />
              <text x={x} y="148" textAnchor="middle">
                {label}
              </text>
            </g>
          ))}
        </svg>
        <ChapterSymbol number={11} symbol={symbol} />
      </div>
      <p className="tetradic-editorial-visual__disclosure">
        PROTOCOL STRUCTURE ONLY · PERSONAL CORRECTIONS REDACTED
      </p>
    </VisualFrame>
  );
}

function OrbitTicks({ count, radius }: { count: number; radius: number }) {
  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const angle = (index / count) * 360;
        const inner = polarPoint(
          250,
          250,
          radius - (count === 7 ? 14 : 7),
          angle
        );
        const outer = polarPoint(250, 250, radius, angle);
        return (
          <line
            key={index}
            x1={inner.x}
            y1={inner.y}
            x2={outer.x}
            y2={outer.y}
          />
        );
      })}
    </g>
  );
}

function IntegrationSealVisual({ symbol }: { symbol: string }) {
  const { sample } = TETRADIC_SIGNATURE_CONFIG;
  const archiveSymbol = TETRADIC_CHOREOGRAPHY[0].symbol;

  return (
    <VisualFrame
      number={12}
      description={TETRADIC_EDITORIAL_VISUAL_LABELS[12]}
      className="tetradic-editorial-visual--integration"
    >
      <div className="tetradic-editorial-visual__integration-field">
        <svg
          viewBox="0 0 500 500"
          role="img"
          aria-label="Seven-day observation ring and thirty-day integration ring surrounding the sample archive seal."
        >
          <circle cx="250" cy="250" r="224" />
          <circle cx="250" cy="250" r="168" />
          <g className="integration-ticks is-thirty">
            <OrbitTicks count={30} radius={224} />
          </g>
          <g className="integration-ticks is-seven">
            <OrbitTicks count={7} radius={168} />
          </g>
          <path d="M250 16v36M250 448v36M16 250h36M448 250h36" />
          <text x="250" y="20" textAnchor="middle">
            30-DAY INTEGRATION ORBIT
          </text>
          <text x="250" y="492" textAnchor="middle">
            07-DAY OBSERVATION FIELD
          </text>
        </svg>
        <div className="tetradic-editorial-visual__seal">
          <SampleArchiveSeal
            archiveId={sample.archiveId}
            symbol={archiveSymbol}
          />
        </div>
        <ChapterSymbol number={12} symbol={symbol} />
      </div>
      <div className="tetradic-editorial-visual__register">
        <span>FOUNDER SYNTHESIS / REDACTED SAMPLE</span>
        <span>ARCHIVE ID / {sample.archiveId}</span>
        <small>SAMPLE ARCHIVE MARK · NOT A PERSONAL VERIFICATION SEAL</small>
      </div>
    </VisualFrame>
  );
}

export function TetradicEditorialVisual({
  number,
  symbol = TETRADIC_CHOREOGRAPHY[number - 1].symbol,
  className,
}: TetradicEditorialVisualProps) {
  const visual = (() => {
    switch (number) {
      case 1:
        return <ReceiverRecordVisual symbol={symbol} />;
      case 2:
        return <WholeArchitectureVisual symbol={symbol} />;
      case 3:
        return <TwoTimingsVisual symbol={symbol} />;
      case 4:
        return <MandalaVisual symbol={symbol} />;
      case 5:
        return <EightCentersVisual symbol={symbol} />;
      case 6:
        return <CircuitryVisual symbol={symbol} />;
      case 7:
        return <PlanetaryAtlasVisual number={7} symbol={symbol} />;
      case 8:
        return <PlanetaryAtlasVisual number={8} symbol={symbol} design />;
      case 9:
        return <IdentitySynthesisVisual symbol={symbol} />;
      case 10:
        return <ShadowGiftVisual symbol={symbol} />;
      case 11:
        return <SomaticPracticeVisual symbol={symbol} />;
      case 12:
        return <IntegrationSealVisual symbol={symbol} />;
    }
  })();

  if (!className) return visual;

  return <div className={className}>{visual}</div>;
}
