import type { CSSProperties, ReactNode } from "react";

import {
  CODON_CENTER_MAP,
  VRC_MANDALA,
} from "@/components/oriel-signal/CodonWheel";
import {
  CENTER_COLORS,
  VTRS_CENTERS,
  VTRS_LINKS,
} from "@/components/oriel-signal/vtrs/vtrs-data";
import { VTRS_BODY_ORDER, VTRS_SVG_LAYOUT } from "@/lib/vtrs-body-layout";

import { SampleArchiveSeal } from "./SampleArchiveSeal";
import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SIGNATURE_CONFIG,
} from "./tetradic-signature-config";

type LaterTetradNumber = 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;

type SpreadShellProps = Readonly<{
  number: LaterTetradNumber;
  technical: readonly [string, string];
  children: ReactNode;
  symbolPlacement?: "left" | "center" | "right";
}>;

function SpreadShell({
  number,
  technical,
  children,
  symbolPlacement = "center",
}: SpreadShellProps) {
  const chapter = TETRADIC_CHOREOGRAPHY[number - 1];
  const numberLabel = String(number).padStart(2, "0");
  const leftFolio = String(number * 2).padStart(2, "0");
  const rightFolio = String(number * 2 + 1).padStart(2, "0");

  return (
    <section
      className={`tetradic-spread__chapter tetradic-later-spread tetradic-spread__chapter--${numberLabel}`}
      data-tetrad={number}
      aria-label={`Tetrad ${numberLabel}: ${chapter.title}`}
    >
      <div className="tetradic-later-spread__paper tetradic-later-spread__paper--left">
        <header>
          <span>{TETRADIC_SIGNATURE_CONFIG.naming.system}</span>
          <span>ILLUSTRATIVE SAMPLE</span>
        </header>
        <footer>
          <span>{technical[0]}</span>
          <b>{leftFolio}</b>
        </footer>
      </div>

      <div className="tetradic-later-spread__paper tetradic-later-spread__paper--right">
        <header>
          <span>TETRAD {numberLabel} / 12</span>
          <span>FOUNDER EDITION</span>
        </header>
        <footer>
          <b>{rightFolio}</b>
          <span>{technical[1]}</span>
        </footer>
      </div>

      <div className="tetradic-later-spread__content">{children}</div>
      <div className="tetradic-later-spread__gutter" aria-hidden="true" />
      <img
        className={`tetradic-later-spread__symbol is-${symbolPlacement}`}
        src={chapter.symbol}
        alt=""
        width={500}
        height={500}
        loading="lazy"
      />
    </section>
  );
}

function ChapterHeading({ number }: { number: LaterTetradNumber }) {
  const chapter = TETRADIC_CHOREOGRAPHY[number - 1];

  return (
    <div className="tetradic-later-spread__heading">
      <p>TETRAD {String(number).padStart(2, "0")} / 12</p>
      <h3>{chapter.title}</h3>
      <blockquote>{chapter.statement}</blockquote>
    </div>
  );
}

function polarPoint(cx: number, cy: number, radius: number, degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return {
    x: cx + Math.cos(radians) * radius,
    y: cy + Math.sin(radians) * radius,
  };
}

function annularSegment(index: number) {
  const start = index * 5.625 + 0.5;
  const end = (index + 1) * 5.625 - 0.5;
  const outerStart = polarPoint(250, 250, 208, start);
  const outerEnd = polarPoint(250, 250, 208, end);
  const innerEnd = polarPoint(250, 250, 164, end);
  const innerStart = polarPoint(250, 250, 164, start);

  return [
    `M${outerStart.x} ${outerStart.y}`,
    `A208 208 0 0 1 ${outerEnd.x} ${outerEnd.y}`,
    `L${innerEnd.x} ${innerEnd.y}`,
    `A164 164 0 0 0 ${innerStart.x} ${innerStart.y}`,
    "Z",
  ].join(" ");
}

function TetradFourVisual({ showHeading = false }: { showHeading?: boolean }) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--mandala">
      {showHeading && <ChapterHeading number={4} />}
      <div className="tetradic-later-spread__diagram-field mandala-field">
        <svg viewBox="0 0 500 500" aria-hidden="true">
          <circle className="guide" cx="250" cy="250" r="226" />
          <circle className="guide is-dashed" cx="250" cy="250" r="150" />
          <circle className="guide" cx="250" cy="250" r="112" />
          <g className="mandala-segments">
            {VRC_MANDALA.map((codon, index) => {
              return (
                <path
                  key={codon}
                  d={annularSegment(index)}
                  className={`is-field is-field-${(index % 4) + 1}`}
                  data-center={CODON_CENTER_MAP[codon]}
                />
              );
            })}
          </g>
          {Array.from({ length: 8 }, (_, index) => {
            const point = polarPoint(250, 250, 132, index * 45);
            return (
              <circle
                key={index}
                className="center-marker"
                cx={point.x}
                cy={point.y}
                r="4"
              />
            );
          })}
        </svg>
      </div>
      <div className="tetradic-later-spread__legend">
        <span className="is-conscious">CONSCIOUS LAYER LOGIC</span>
        <span className="is-design">DESIGN LAYER LOGIC</span>
        <span className="is-shared">CONVERGENCE LOGIC</span>
        <small>RECEIVER ACTIVATIONS REDACTED · FIELD STRUCTURE ONLY</small>
      </div>
    </div>
  );
}

function TetradFour() {
  return (
    <SpreadShell
      number={4}
      technical={["CODON FIELD: 64", "STATES: CONSCIOUS / DESIGN / SHARED"]}
      symbolPlacement="center"
    >
      <TetradFourVisual showHeading />
    </SpreadShell>
  );
}

function TetradFiveVisual({ showHeading = false }: { showHeading?: boolean }) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--centers">
      {showHeading && <ChapterHeading number={5} />}
      <div className="tetradic-later-spread__diagram-field centers-field">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <path
            className="body-contour"
            d="M50 3c-7 0-9 6-9 11 0 6 4 9 4 13-12 4-22 12-22 24 0 8 5 13 8 16-7 8-13 17-13 27M50 3c7 0 9 6 9 11 0 6-4 9-4 13 12 4 22 12 22 24 0 8-5 13-8 16 7 8 13 17 13 27M50 20v71"
          />
          <line className="center-scan" x1="18" y1="7" x2="82" y2="7" />
          {VTRS_BODY_ORDER.map((centerId, index) => {
            const point = VTRS_SVG_LAYOUT[centerId];
            return (
              <g
                key={centerId}
                className="center-node is-redacted"
                style={
                  {
                    "--node-color": CENTER_COLORS[centerId],
                    "--node-index": index,
                  } as CSSProperties
                }
              >
                <circle cx={point.x} cy={point.y} r="4" />
                <circle
                  className="center-core"
                  cx={point.x}
                  cy={point.y}
                  r="1"
                />
              </g>
            );
          })}
        </svg>
      </div>
      <ol className="center-register">
        {VTRS_CENTERS.map(center => (
          <li key={center.id}>
            <b>{center.roman}</b>
            <span>{center.id}</span>
            <em>REDACTED</em>
          </li>
        ))}
      </ol>
      <p className="tetradic-later-spread__sample-note">
        DEFINED / OPEN STATES WITHHELD · STRUCTURE ONLY
      </p>
    </div>
  );
}

function TetradFive() {
  return (
    <SpreadShell
      number={5}
      technical={["CENTERS: 08", "DEFINED / OPEN STATES: REDACTED"]}
      symbolPlacement="right"
    >
      <TetradFiveVisual showHeading />
    </SpreadShell>
  );
}

function circuitPoint(centerId: string) {
  const point = VTRS_SVG_LAYOUT[centerId];
  return {
    x: 50 + (point.x - 50) * 3.8,
    y: 7 + (point.y - 3) * 1.55,
  };
}

function circuitPath(index: number) {
  const link = VTRS_LINKS[index];
  const from = circuitPoint(link.centerA);
  const to = circuitPoint(link.centerB);

  if (link.centerA === link.centerB) {
    const offset = 8 + (index % 3) * 2;
    return `M${from.x - 1.5} ${from.y}C${from.x - offset} ${from.y - offset} ${from.x + offset} ${from.y - offset} ${from.x + 1.5} ${from.y}`;
  }

  const bend = (index % 5) - 2;
  const midpointX = (from.x + to.x) / 2 + bend * 1.4;
  const midpointY = (from.y + to.y) / 2 - bend * 1.1;
  return `M${from.x} ${from.y}Q${midpointX} ${midpointY} ${to.x} ${to.y}`;
}

function circuitRoute(centerIds: readonly string[]) {
  return centerIds
    .map((centerId, index) => {
      const point = circuitPoint(centerId);
      return `${index === 0 ? "M" : "L"}${point.x} ${point.y}`;
    })
    .join(" ");
}

function TetradSixVisual({ showHeading = false }: { showHeading?: boolean }) {
  const gapIndex = Math.floor(VTRS_BODY_ORDER.length / 2);
  const beforeGap = VTRS_BODY_ORDER.slice(0, gapIndex);
  const afterGap = VTRS_BODY_ORDER.slice(gapIndex);
  const gapStart = circuitPoint(beforeGap.at(-1)!);
  const gapEnd = circuitPoint(afterGap[0]);

  return (
    <div className="tetradic-later-layout tetradic-later-layout--circuitry">
      {showHeading && <ChapterHeading number={6} />}
      <div className="tetradic-later-spread__diagram-field circuitry-field">
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <marker
              id="tetrad-six-arrow"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="3.5"
              markerHeight="3.5"
              orient="auto-start-reverse"
            >
              <path d="M0 0 10 5 0 10z" />
            </marker>
          </defs>
          <g className="circuit-network">
            {VTRS_LINKS.map((link, index) => {
              return (
                <path
                  key={link.id}
                  d={circuitPath(index)}
                  pathLength="1"
                  className="is-inactive"
                />
              );
            })}
          </g>
          <g className="circuit-demonstration">
            <path
              d={circuitRoute(beforeGap)}
              pathLength="1"
              markerEnd="url(#tetrad-six-arrow)"
            />
            <path
              d={circuitRoute(afterGap)}
              pathLength="1"
              markerEnd="url(#tetrad-six-arrow)"
            />
            <line
              className="circuit-gap"
              x1={gapStart.x}
              y1={gapStart.y}
              x2={gapEnd.x}
              y2={gapEnd.y}
            />
          </g>
          <circle className="circuit-pulse" cx="0" cy="0" r="1.7" />
          {VTRS_BODY_ORDER.map(centerId => {
            const point = circuitPoint(centerId);
            return (
              <g key={centerId} className="circuit-center">
                <circle cx={point.x} cy={point.y} r="3.4" />
                <circle cx={point.x} cy={point.y} r="0.8" />
              </g>
            );
          })}
        </svg>
      </div>
      <div className="circuit-audit">
        <span>FLOW LOGIC / STRUCTURAL DEMONSTRATION</span>
        <span>BOTTLENECK LOGIC / RECEIVER LOCATION REDACTED</span>
        <small>NO ACTIVE LINKS ASSIGNED · NOT CALCULATED</small>
      </div>
    </div>
  );
}

function TetradSix() {
  return (
    <SpreadShell
      number={6}
      technical={["RESONANCE LINKS: 32", "FLOW LOGIC: DEMONSTRATED"]}
      symbolPlacement="left"
    >
      <TetradSixVisual showHeading />
    </SpreadShell>
  );
}

const PLANET_GROUPS = [
  ["SUN", "EARTH"],
  ["MOON", "NORTH NODE", "SOUTH NODE"],
  ["MERCURY", "VENUS", "MARS"],
  ["JUPITER", "SATURN", "URANUS", "NEPTUNE", "PLUTO"],
] as const;

function PlanetaryAtlas({ design = false }: { design?: boolean }) {
  const groupAnchors = [
    [128, 104],
    [252, 218],
    [382, 108],
    [500, 218],
  ] as const;

  return (
    <div
      className={`planetary-atlas${design ? " is-design" : " is-conscious"}`}
    >
      <svg viewBox="0 0 620 330" aria-hidden="true">
        <path className="atlas-axis" d="M46 165H574" />
        {[64, 112, 160, 208].map((radius, index) => (
          <ellipse
            key={radius}
            className="atlas-orbit"
            cx="310"
            cy="165"
            rx={radius}
            ry={radius * 0.52}
            style={{ "--orbit-index": index } as CSSProperties}
          />
        ))}
        {PLANET_GROUPS.map((group, groupIndex) => {
          const [x, y] = groupAnchors[groupIndex];
          return (
            <g
              key={group.join("-")}
              className="atlas-group"
              style={{ "--planet-index": groupIndex } as CSSProperties}
            >
              <circle className="atlas-group-core" cx={x} cy={y} r="7" />
              <line x1={x} y1={y} x2="310" y2="165" />
              {group.map((planet, planetIndex) => {
                const angle = (planetIndex / group.length) * Math.PI * 2;
                const radius = 15 + groupIndex * 2;
                return (
                  <circle
                    key={planet}
                    className="atlas-group-member"
                    cx={x + Math.cos(angle) * radius}
                    cy={y + Math.sin(angle) * radius}
                    r="2.8"
                  >
                    <title>{planet}</title>
                  </circle>
                );
              })}
            </g>
          );
        })}
        <circle className="atlas-core" cx="310" cy="165" r="18" />
      </svg>
      <div className="planetary-register">
        {PLANET_GROUPS.map((group, index) => (
          <div key={group.join("-")}>
            <b>{String(index + 1).padStart(2, "0")}</b>
            <span>{group.join(" / ")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TetradSevenVisual({ showHeading = false }: { showHeading?: boolean }) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--conscious">
      {showHeading && <ChapterHeading number={7} />}
      <div className="tetradic-later-spread__diagram-field atlas-field">
        <PlanetaryAtlas />
      </div>
      <p className="tetradic-later-spread__sample-note">
        PLANETARY POSITIONS REDACTED · GROUP TAXONOMY ONLY
      </p>
    </div>
  );
}

function TetradSeven() {
  return (
    <SpreadShell
      number={7}
      technical={["LAYER: CONSCIOUS", "ACTIVATIONS: REDACTED SAMPLE"]}
      symbolPlacement="right"
    >
      <TetradSevenVisual showHeading />
    </SpreadShell>
  );
}

function TetradEightVisual({ showHeading = false }: { showHeading?: boolean }) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--design">
      {showHeading && <ChapterHeading number={8} />}
      <div className="tetradic-later-spread__diagram-field atlas-field">
        <PlanetaryAtlas design />
      </div>
      <p className="tetradic-later-spread__sample-note">
        DESIGN TIMESTAMP AND POSITIONS REDACTED · NOT CALCULATED
      </p>
    </div>
  );
}

function TetradEight() {
  return (
    <SpreadShell
      number={8}
      technical={["LAYER: DESIGN", "SOMATIC FIELD: ILLUSTRATIVE"]}
      symbolPlacement="left"
    >
      <TetradEightVisual showHeading />
    </SpreadShell>
  );
}

function TetradNineVisual({ showHeading = false }: { showHeading?: boolean }) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--identity">
      {showHeading && <ChapterHeading number={9} />}
      <div className="tetradic-later-spread__diagram-field identity-field">
        <svg viewBox="0 0 620 360" aria-hidden="true">
          <g className="identity-structure is-primary">
            <path d="M86 180 178 74l92 106-92 106z" />
            <circle cx="178" cy="180" r="58" />
            <path d="M178 98v164M96 180h164" />
          </g>
          <g className="identity-structure is-secondary">
            <path d="M534 180 442 74l-92 106 92 106z" />
            <circle cx="442" cy="180" r="58" />
            <path d="M442 98v164M360 180h164" />
          </g>
          <g className="identity-synthesis">
            <circle cx="310" cy="180" r="86" />
            <circle cx="310" cy="180" r="62" />
            <path d="M310 92 382 222 238 222z" />
            <path d="M310 268 238 138 382 138z" />
          </g>
        </svg>
        <ol className="identity-states">
          <li>FRACTAL ROLE</li>
          <li>PRIMARY RESONANCE ROLE</li>
          <li>SECONDARY PATTERN</li>
          <li>ROLE INTERFERENCE FIELD</li>
        </ol>
      </div>
      <div className="identity-register">
        <span>PRIMARY ROLE / REDACTED</span>
        <span>SECONDARY PATTERN / REDACTED</span>
        <b>ILLUSTRATIVE SYNTHESIS · NOT RESOLVED FROM PERSONAL DATA</b>
      </div>
    </div>
  );
}

function TetradNine() {
  return (
    <SpreadShell
      number={9}
      technical={["IDENTITY LAYERS: 02", "SYNTHESIS LOGIC: DEMONSTRATED"]}
      symbolPlacement="center"
    >
      <TetradNineVisual showHeading />
    </SpreadShell>
  );
}

const FRACTURE_PATHS = [
  "M118 82 238 150 188 286",
  "M238 150 310 66 372 154",
  "M372 154 500 94 454 286",
  "M188 286 310 242 454 286",
  "M238 150 310 242 372 154",
] as const;

function TetradTenVisual({ showHeading = false }: { showHeading?: boolean }) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--shadow-gift">
      {showHeading && <ChapterHeading number={10} />}
      <div className="tetradic-later-spread__diagram-field shadow-gift-field">
        <svg viewBox="0 0 620 360" aria-hidden="true">
          <g className="coherence-frame">
            <circle cx="310" cy="180" r="142" />
            <circle cx="310" cy="180" r="105" />
            <path d="M310 38v284M168 180h284" />
          </g>
          <g className="fracture-network">
            {FRACTURE_PATHS.map((path, index) => (
              <path
                key={path}
                d={path}
                style={{ "--fracture-index": index } as CSSProperties}
              />
            ))}
          </g>
          <g className="gift-network">
            <path d="M118 82 238 150 310 66 372 154 500 94" />
            <path d="M118 82 188 286 310 242 454 286 500 94" />
            <path d="M238 150 310 242 372 154" />
            <circle cx="310" cy="180" r="42" />
          </g>
        </svg>
      </div>
      <div className="shadow-gift-register">
        <span>SHADOW / STRUCTURE UNDER PRESSURE</span>
        <span>GIFT / THE SAME STRUCTURE IN COHERENCE</span>
        <small>ILLUSTRATIVE TRANSFORMATION · NO PERSONAL FINDING</small>
      </div>
    </div>
  );
}

function TetradTen() {
  return (
    <SpreadShell
      number={10}
      technical={["INTERFERENCE: UNASSIGNED", "COHERENCE PATH: DEMONSTRATED"]}
      symbolPlacement="right"
    >
      <TetradTenVisual showHeading />
    </SpreadShell>
  );
}

function TetradElevenVisual({
  showHeading = false,
}: {
  showHeading?: boolean;
}) {
  return (
    <div className="tetradic-later-layout tetradic-later-layout--practice">
      {showHeading && <ChapterHeading number={11} />}
      <div className="practice-protocols">
        {[
          ["01", "OBSERVE", "Locate pressure before response."],
          ["02", "CALIBRATE", "Test one correction for forty-eight hours."],
          ["03", "VERIFY", "Keep only what changes observation."],
        ].map(([number, title, copy]) => (
          <article key={number}>
            <b>{number}</b>
            <h4>{title}</h4>
            <p>{copy}</p>
          </article>
        ))}
      </div>
      <ol className="practice-states">
        <li>HIGH-LEVERAGE CORRECTIONS</li>
        <li>48-HOUR CALIBRATION</li>
        <li>AUTHORITY IN DECISIONS</li>
        <li>ENVIRONMENTAL STRATEGY</li>
      </ol>
      <div className="tetradic-later-spread__diagram-field calibration-field">
        <svg viewBox="0 0 700 150" aria-hidden="true">
          <path
            className="calibration-base"
            d="M46 76C174 18 238 134 350 76S540 18 654 76"
          />
          <path
            className="calibration-progress"
            pathLength="1"
            d="M46 76C174 18 238 134 350 76S540 18 654 76"
          />
          {[46, 350, 654].map((x, index) => (
            <g key={x} className="calibration-checkpoint">
              <circle cx={x} cy="76" r="10" />
              <circle cx={x} cy="76" r="3" />
              <line x1={x} y1="28" x2={x} y2="124" />
              <title>{["0 HOURS", "24 HOURS", "48 HOURS"][index]}</title>
            </g>
          ))}
          <g className="practice-breath-rings">
            <circle cx="350" cy="76" r="17" />
            <circle cx="350" cy="76" r="25" />
          </g>
        </svg>
        <div className="calibration-labels">
          <span>0H / BASELINE</span>
          <span>24H / CHECK</span>
          <span>48H / REVIEW</span>
        </div>
      </div>
      <p className="tetradic-later-spread__sample-note">
        PROTOCOL STRUCTURE ONLY · PERSONAL CORRECTIONS REDACTED
      </p>
    </div>
  );
}

function TetradEleven() {
  return (
    <SpreadShell
      number={11}
      technical={["PRACTICE LAYER: ACTIVE", "CALIBRATION WINDOW: 48H"]}
      symbolPlacement="left"
    >
      <TetradElevenVisual showHeading />
    </SpreadShell>
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
          radius - (count === 7 ? 11 : 6),
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

function TetradTwelveVisual({
  showHeading = false,
}: {
  showHeading?: boolean;
}) {
  const { sample } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-later-layout tetradic-later-layout--integration">
      {showHeading && <ChapterHeading number={12} />}
      <div className="tetradic-later-spread__diagram-field integration-field">
        <svg viewBox="0 0 500 500" aria-hidden="true">
          <circle
            className="integration-orbit is-outer"
            cx="250"
            cy="250"
            r="218"
          />
          <circle
            className="integration-orbit is-inner"
            cx="250"
            cy="250"
            r="166"
          />
          <g className="integration-ticks is-thirty">
            <OrbitTicks count={30} radius={218} />
          </g>
          <g className="integration-ticks is-seven">
            <OrbitTicks count={7} radius={166} />
          </g>
          <path
            className="integration-cardinals"
            d="M250 19v32M250 449v32M19 250h32M449 250h32"
          />
        </svg>
        <div className="integration-seal">
          <SampleArchiveSeal
            archiveId={sample.archiveId}
            symbol={TETRADIC_CHOREOGRAPHY[11].symbol}
          />
        </div>
      </div>
      <div className="integration-register">
        <span>07-DAY OBSERVATION FIELD</span>
        <span>30-DAY INTEGRATION ORBIT</span>
        <b>FOUNDER SYNTHESIS / REDACTED SAMPLE</b>
        <small>SAMPLE ARCHIVE MARK · NOT A PERSONAL VERIFICATION SEAL</small>
      </div>
    </div>
  );
}

function TetradTwelve() {
  return (
    <SpreadShell
      number={12}
      technical={["OBSERVATION: 07D / 30D", "ARCHIVE STATUS: SAMPLE"]}
      symbolPlacement="center"
    >
      <TetradTwelveVisual showHeading />
    </SpreadShell>
  );
}

export function TetradicCinematicVisual({
  number,
}: {
  number: LaterTetradNumber;
}) {
  switch (number) {
    case 4:
      return <TetradFourVisual />;
    case 5:
      return <TetradFiveVisual />;
    case 6:
      return <TetradSixVisual />;
    case 7:
      return <TetradSevenVisual />;
    case 8:
      return <TetradEightVisual />;
    case 9:
      return <TetradNineVisual />;
    case 10:
      return <TetradTenVisual />;
    case 11:
      return <TetradElevenVisual />;
    case 12:
      return <TetradTwelveVisual />;
  }
}

export function TetradicLaterSpreads() {
  return (
    <>
      <TetradFour />
      <TetradFive />
      <TetradSix />
      <TetradSeven />
      <TetradEight />
      <TetradNine />
      <TetradTen />
      <TetradEleven />
      <TetradTwelve />
    </>
  );
}
