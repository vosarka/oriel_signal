import { useRef, type CSSProperties } from "react";

import Layout from "@/components/Layout";
import { SampleArchiveSeal } from "./SampleArchiveSeal";
import {
  TETRADIC_SIGNATURE_CONFIG,
  TETRAD_ONE_SPREAD,
} from "./tetradic-signature-config";
import {
  TETRADIC_V2_CONFIG,
  TETRADIC_V2_TIMELINE,
} from "./tetradic-signature-v2-config";
import { useTetradicV2Progress } from "./useTetradicV2Progress";

function ReceiverRecordDiagram() {
  const sample = TETRADIC_V2_CONFIG.sample;
  const nodes = [
    { x: 24, y: 48, label: "RECEIVER", value: sample.receiver },
    { x: 224, y: 48, label: "RECORD STATUS", value: sample.recordStatus },
    { x: 24, y: 144, label: "BIRTH RECORD", value: sample.birthRecord },
    { x: 224, y: 144, label: "COORDINATES", value: sample.coordinates },
    { x: 224, y: 240, label: "ARCHIVE ID", value: sample.archiveId },
  ] as const;

  return (
    <svg
      className="tetradic-spread__receiver-initialization"
      viewBox="0 0 420 310"
      aria-hidden="true"
    >
      <text x="24" y="28" className="record-diagram-title">
        RECEIVER RECORD INITIALIZATION
      </text>
      <path
        className="record-flow"
        d="M196 77h28M110 106v38M310 106v38M110 202v20h200v18M310 202v38"
      />
      <circle cx="310" cy="222" r="3" className="record-junction" />
      {nodes.map(node => (
        <g key={node.label}>
          <rect
            x={node.x}
            y={node.y}
            width="172"
            height={node.label === "ARCHIVE ID" ? 54 : 58}
            rx="2"
            className={
              node.label === "ARCHIVE ID"
                ? "record-node is-archive"
                : "record-node"
            }
          />
          <text x={node.x + 12} y={node.y + 20} className="record-node-label">
            {node.label}
          </text>
          <text x={node.x + 12} y={node.y + 43} className="record-node-value">
            {node.value}
          </text>
        </g>
      ))}
    </svg>
  );
}

function ThresholdPlate() {
  const { naming, sample } = TETRADIC_SIGNATURE_CONFIG;
  const spreadStyle = {
    "--t1-opacity": 1,
    "--diagram-reveal": "var(--v2-tetrad-one-detail)",
    "--seal-light": "var(--v2-tetrad-one-detail)",
    "--seal-light-opacity": "var(--v2-tetrad-one-detail)",
  } as CSSProperties;

  return (
    <div className="tetradic-v2__spread tetradic-spread" style={spreadStyle}>
      <div className="tetradic-spread__pages tetradic-spread__chapter tetradic-spread__chapter--one">
        <article className="tetradic-spread__page tetradic-spread__page--left">
          <header className="tetradic-spread__page-header">
            <span>{naming.system}</span>
            <span>RECEIVER RECORD</span>
          </header>
          <div className="tetradic-spread__left-intro">
            <p className="tetradic-spread__kicker">RECEIVER ENTRY / 01</p>
            <h3>Identity Plate</h3>
          </div>
          <ReceiverRecordDiagram />
          <p className="tetradic-spread__verification-note">
            ILLUSTRATIVE RECORD · NO EPHEMERIS VALUES
          </p>
          <footer className="tetradic-spread__folio">
            <span>FOUNDER EDITION</span>
            <b>02</b>
          </footer>
        </article>

        <article className="tetradic-spread__page tetradic-spread__page--right">
          <header className="tetradic-spread__page-header">
            <span>ARCHIVE SEAL / SAMPLE STATE</span>
            <span>64-SEGMENT CORONA</span>
          </header>
          <div className="tetradic-spread__seal-field">
            <div className="tetradic-spread__seal-light" aria-hidden="true" />
            <SampleArchiveSeal
              archiveId={sample.archiveId}
              symbol={TETRAD_ONE_SPREAD.symbol}
            />
          </div>
          <div className="tetradic-spread__threshold-copy">
            <p className="tetradic-spread__kicker">
              {TETRAD_ONE_SPREAD.eyebrow}
            </p>
            <h3>{TETRAD_ONE_SPREAD.title}</h3>
            <p>{TETRAD_ONE_SPREAD.mainStatement}</p>
          </div>
          <footer className="tetradic-spread__folio tetradic-spread__folio--right">
            <b>03</b>
            <span>{naming.readingType}</span>
          </footer>
        </article>

        <svg
          className="tetradic-spread__archive-annotation"
          viewBox="0 0 960 640"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M417 401C480 401 508 241 554 241" />
        </svg>
        <div className="tetradic-spread__gutter" aria-hidden="true" />
      </div>
    </div>
  );
}

function ArchitectureField() {
  const centers = [
    [380, 112],
    [328, 170],
    [432, 170],
    [392, 224],
    [318, 286],
    [460, 286],
    [392, 340],
    [338, 413],
  ] as const;

  return (
    <div className="tetradic-v2__architecture-field">
      <svg viewBox="0 0 760 540" aria-hidden="true">
        <g className="v2-architecture__orbits">
          <circle cx="380" cy="270" r="226" />
          <circle cx="380" cy="270" r="194" />
          <circle cx="380" cy="270" r="154" strokeDasharray="3 10" />
          {Array.from({ length: 32 }, (_, index) => {
            const angle = (index / 32) * Math.PI * 2;
            return (
              <line
                key={index}
                x1={380 + Math.cos(angle) * 205}
                y1={270 + Math.sin(angle) * 205}
                x2={380 + Math.cos(angle) * (index % 4 ? 222 : 232)}
                y2={270 + Math.sin(angle) * (index % 4 ? 222 : 232)}
                className={index % 7 === 0 ? "is-active" : undefined}
              />
            );
          })}
        </g>
        <g className="v2-architecture__circuitry">
          <path d="M380 112 328 170l64 54-74 62 74 54-54 73" />
          <path d="M380 112 432 170l-40 54 68 62-68 54 36 73" />
          <path d="M328 170h104M318 286h142M338 413h90" />
        </g>
        <g className="v2-architecture__centers">
          {centers.map(([x, y], index) => (
            <path
              key={`${x}-${y}`}
              d={`M${x} ${y - 15}l15 15-15 15-15-15z`}
              className={index % 3 === 0 ? "is-defined" : "is-open"}
            />
          ))}
        </g>
      </svg>
      <img
        src={TETRADIC_V2_CONFIG.assets.architectureSymbol}
        alt=""
        width="500"
        height="500"
      />
    </div>
  );
}

function TelemetryBands() {
  const labels = [
    ...TETRADIC_V2_CONFIG.telemetry,
    ...TETRADIC_V2_CONFIG.telemetry,
  ];
  return (
    <>
      <div className="tetradic-v2__telemetry tetradic-v2__telemetry--top">
        {labels.map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
      <div className="tetradic-v2__telemetry tetradic-v2__telemetry--bottom">
        {[...labels].reverse().map((label, index) => (
          <span key={`${label}-${index}`}>{label}</span>
        ))}
      </div>
    </>
  );
}

function SemanticArchive() {
  const { naming, sample, chapters } = TETRADIC_V2_CONFIG;
  return (
    <article className="sr-only">
      <h1>{naming.product}</h1>
      <p>{naming.edition}</p>
      <p>{naming.subtitle}</p>
      <p>{naming.readingType}</p>
      <h2>Illustrative public sample record</h2>
      <dl>
        <dt>Receiver</dt>
        <dd>{sample.receiver}</dd>
        <dt>Record status</dt>
        <dd>{sample.recordStatus}</dd>
        <dt>Birth record</dt>
        <dd>{sample.birthRecord}</dd>
        <dt>Coordinates</dt>
        <dd>{sample.coordinates}</dd>
        <dt>Archive ID</dt>
        <dd>{sample.archiveId}</dd>
      </dl>
      <p>No verified ephemeris values are presented in this sample.</p>
      {chapters.map(chapter => (
        <section key={chapter.id}>
          <p>TETRAD {String(chapter.number).padStart(2, "0")} / 12</p>
          <h2>{chapter.title}</h2>
          <p>{chapter.statement}</p>
        </section>
      ))}
    </article>
  );
}

function ReducedExperience({ compact }: { compact: boolean }) {
  const [threshold, architecture] = TETRADIC_V2_CONFIG.chapters;
  return (
    <div className="tetradic-v2__reduced" aria-hidden="true">
      <section className="tetradic-v2__reduced-cover">
        <img
          className="tetradic-v2__reduced-environment"
          src={TETRADIC_V2_CONFIG.assets.environment}
          alt=""
          width="1672"
          height="941"
        />
        <img
          className="tetradic-v2__reduced-book"
          src={TETRADIC_V2_CONFIG.assets.cover}
          alt=""
          width="1536"
          height="2048"
        />
        <div>
          <p>ORIEL / {TETRADIC_V2_CONFIG.naming.edition}</p>
          <h2>{TETRADIC_V2_CONFIG.naming.product}</h2>
        </div>
      </section>
      <section className="tetradic-v2__reduced-chapter">
        <header>
          <p>TETRAD 01 / 12</p>
          <h2>{threshold.title}</h2>
          <p>{threshold.statement}</p>
        </header>
        {compact ? (
          <div className="tetradic-v2__reduced-page-crops">
            <div className="tetradic-v2__reduced-page-crop is-left">
              <ThresholdPlate />
            </div>
            <div className="tetradic-v2__reduced-page-crop is-right">
              <ThresholdPlate />
            </div>
          </div>
        ) : (
          <div className="tetradic-v2__reduced-spread">
            <ThresholdPlate />
          </div>
        )}
      </section>
      <section className="tetradic-v2__reduced-chapter tetradic-v2__reduced-chapter--dark">
        <header>
          <p>TETRAD 02 / 12</p>
          <h2>{architecture.title}</h2>
          <p>{architecture.statement}</p>
        </header>
        <ArchitectureField />
      </section>
    </div>
  );
}

export function TetradicSignatureV2({
  compact,
  reducedMotion,
}: {
  compact: boolean;
  reducedMotion: boolean;
}) {
  const containerRef = useRef<HTMLElement>(null);
  useTetradicV2Progress(containerRef, reducedMotion);
  const scrollHeight =
    (compact
      ? TETRADIC_V2_TIMELINE.compactTravelSvh
      : TETRADIC_V2_TIMELINE.travelSvh) + TETRADIC_V2_TIMELINE.viewportSvh;
  const rootStyle = {
    "--v2-scroll-height": `${scrollHeight}svh`,
  } as CSSProperties;
  const [threshold, architecture] = TETRADIC_V2_CONFIG.chapters;

  return (
    <Layout hideFooter overlayHeader>
      <section
        ref={containerRef}
        className="tetradic-v2"
        style={rootStyle}
        data-scene={reducedMotion ? "reduced-motion" : "artifact-reveal"}
        data-progress="0.0000"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        aria-label="The Tetradic Signature cinematic archive sample"
      >
        {reducedMotion ? (
          <ReducedExperience compact={compact} />
        ) : (
          <div className="tetradic-v2__stage" aria-hidden="true">
            <img
              className="tetradic-v2__environment"
              src={TETRADIC_V2_CONFIG.assets.environment}
              alt=""
              width="1672"
              height="941"
              fetchPriority="high"
            />
            <div className="tetradic-v2__environment-depth" />
            <div className="tetradic-v2__haze tetradic-v2__haze--one" />
            <div className="tetradic-v2__haze tetradic-v2__haze--two" />
            <TelemetryBands />

            <div className="tetradic-v2__artifact">
              <div className="tetradic-v2__artifact-shadow" />
              <div className="tetradic-v2__cover-shell">
                <span className="tetradic-v2__cover-edge" />
                <img
                  src={TETRADIC_V2_CONFIG.assets.cover}
                  alt=""
                  width="1536"
                  height="2048"
                />
                <span className="tetradic-v2__cover-light" />
              </div>
            </div>

            <section className="tetradic-v2__identity-lock">
              <p>ORIEL / {TETRADIC_V2_CONFIG.naming.edition}</p>
              <h1>
                <span>THE TETRADIC</span>
                <span>SIGNATURE</span>
              </h1>
              <p>{TETRADIC_V2_CONFIG.naming.subtitle}</p>
            </section>

            <div className="tetradic-v2__aperture-seal">
              <SampleArchiveSeal
                archiveId={TETRADIC_V2_CONFIG.sample.archiveId}
                symbol={TETRADIC_V2_CONFIG.assets.thresholdSymbol}
              />
            </div>

            <section className="tetradic-v2__tetrad-one">
              <div className="tetradic-v2__plate-shadow" />
              <div className="tetradic-v2__plate-window">
                <ThresholdPlate />
              </div>
            </section>

            <section className="tetradic-v2__tetrad-two">
              <ArchitectureField />
              <div className="tetradic-v2__tetrad-two-grid" />
            </section>

            <div className="tetradic-v2__transition-ring">
              <img
                src={TETRADIC_V2_CONFIG.assets.thresholdSymbol}
                alt=""
                width="500"
                height="500"
              />
            </div>
            <div className="tetradic-v2__shadow-blade" />

            <section className="tetradic-v2__chapter-copy tetradic-v2__chapter-copy--one">
              <p>TETRAD 01 / 12</p>
              <h2>{threshold.title}</h2>
              <blockquote>{threshold.statement}</blockquote>
            </section>
            <div className="tetradic-v2__technical tetradic-v2__technical--one">
              <span>RECEIVER RECORD / INITIALIZED</span>
              <span>ARCHIVE ID / {TETRADIC_V2_CONFIG.sample.archiveId}</span>
            </div>

            <section className="tetradic-v2__chapter-copy tetradic-v2__chapter-copy--two">
              <p>TETRAD 02 / 12</p>
              <h2>{architecture.title}</h2>
              <blockquote>{architecture.statement}</blockquote>
            </section>

            <div className="tetradic-v2__progress">
              <span>01</span>
              <i />
              <span>02</span>
            </div>
            <p className="tetradic-v2__scroll-cue">
              SCROLL / ENTER THE ARCHIVE
            </p>
          </div>
        )}
        {!reducedMotion && (
          <div
            className="sr-only"
            role="progressbar"
            aria-label="Cinematic archive progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={0}
            data-v2-progress=""
          />
        )}
        <SemanticArchive />
      </section>
    </Layout>
  );
}
