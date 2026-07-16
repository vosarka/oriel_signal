import { useRef, type MutableRefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import type { TetradicSceneState } from "./chapter-config";
import { SampleArchiveSeal } from "./SampleArchiveSeal";
import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SIGNATURE_CONFIG,
  TETRAD_ONE_SPREAD,
} from "./tetradic-signature-config";

function ReceiverRecordInitialization({
  sample,
}: {
  sample: typeof TETRADIC_SIGNATURE_CONFIG.sample;
}) {
  const nodes = [
    { x: 24, y: 48, label: "RECEIVER", value: sample.receiver },
    {
      x: 224,
      y: 48,
      label: "RECORD STATUS",
      value: sample.recordStatus,
    },
    { x: 24, y: 144, label: "BIRTH RECORD", value: sample.birthRecord },
    {
      x: 224,
      y: 144,
      label: "COORDINATES",
      value: sample.coordinates,
    },
    {
      x: 224,
      y: 240,
      label: "ARCHIVE ID",
      value: sample.archiveId,
    },
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

function TetradOnePages() {
  const { naming, sample } = TETRADIC_SIGNATURE_CONFIG;

  return (
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

        <ReceiverRecordInitialization sample={sample} />

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

        <div
          className="tetradic-spread__seal-field"
          data-annotation-target="sample-seal"
        >
          <div className="tetradic-spread__seal-light" aria-hidden="true" />
          <SampleArchiveSeal
            archiveId={sample.archiveId}
            symbol={TETRAD_ONE_SPREAD.symbol}
          />
        </div>

        <div className="tetradic-spread__threshold-copy">
          <p className="tetradic-spread__kicker">{TETRAD_ONE_SPREAD.eyebrow}</p>
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
  );
}

function WholeArchitectureDiagram() {
  return (
    <svg
      className="tetradic-spread__architecture-diagram"
      viewBox="0 0 760 540"
      aria-hidden="true"
    >
      <g className="architecture-orbits">
        <circle cx="380" cy="270" r="226" />
        <circle cx="380" cy="270" r="194" />
        <circle cx="380" cy="270" r="154" strokeDasharray="3 10" />
        {Array.from({ length: 32 }, (_, index) => {
          const angle = (index / 32) * Math.PI * 2;
          const inner = 205;
          const outer = index % 4 === 0 ? 232 : 222;
          return (
            <line
              key={index}
              x1={380 + Math.cos(angle) * inner}
              y1={270 + Math.sin(angle) * inner}
              x2={380 + Math.cos(angle) * outer}
              y2={270 + Math.sin(angle) * outer}
              className={index % 7 === 0 ? "is-active" : undefined}
            />
          );
        })}
      </g>
      <g className="architecture-circuitry">
        <path d="M380 112 328 170l64 54-74 62 74 54-54 73" />
        <path d="M380 112 432 170l-40 54 68 62-68 54 36 73" />
        <path d="M328 170h104M318 286h142M338 413h90" />
      </g>
      <g className="architecture-centers">
        {[
          [380, 112],
          [328, 170],
          [432, 170],
          [392, 224],
          [318, 286],
          [460, 286],
          [392, 340],
          [338, 413],
        ].map(([x, y], index) => (
          <path
            key={`${x}-${y}`}
            d={`M${x} ${y - 15}l15 15-15 15-15-15z`}
            className={index % 3 === 0 ? "is-defined" : "is-open"}
          />
        ))}
      </g>
      <g className="architecture-labels">
        <text x="36" y="48">
          COMPLETE SYSTEM VIEW
        </text>
        <text x="36" y="505">
          64 CODON FIELD / 08 CENTERS / ACTIVE LINKS
        </text>
        <text x="585" y="48">
          SAMPLE STATE
        </text>
      </g>
    </svg>
  );
}

function TetradTwoPages() {
  const chapter = TETRADIC_CHOREOGRAPHY[1];

  return (
    <div className="tetradic-spread__chapter tetradic-spread__chapter--two">
      <header className="tetradic-spread__blueprint-header">
        <span>TETRAD 02 / 12</span>
        <span>EXPLODED SYSTEM VIEW</span>
      </header>
      <WholeArchitectureDiagram />
      <div className="tetradic-spread__blueprint-index">
        <span>01 / CODEX FIELD</span>
        <span>02 / CENTER ARRAY</span>
        <span>03 / RESONANCE LINKS</span>
        <span>04 / WEIGHTED SIGNALS</span>
      </div>
      <div className="tetradic-spread__blueprint-seal">
        <img
          src={chapter.symbol}
          alt=""
          width={500}
          height={500}
          loading="lazy"
        />
        <span>WHOLE ARCHITECTURE / SAMPLE</span>
      </div>
      <div className="tetradic-spread__gutter" aria-hidden="true" />
      <span className="tetradic-spread__folio-mark is-left">04</span>
      <span className="tetradic-spread__folio-mark is-right">05</span>
    </div>
  );
}

const TIMING_STATES = [
  {
    code: "01 / CONSCIOUS SKY",
    title: "ARRIVAL IN LIGHT",
    detail: "BIRTH SUN / GOLD POSITION",
  },
  {
    code: "02 / SOLAR DESCENT",
    title: "88.0000°",
    detail: "BACKWARD CALIBRATION ARC",
  },
  {
    code: "03 / MIRRORED LAYERS",
    title: "CONSCIOUS / DESIGN",
    detail: "TWO TIMINGS / ONE RECEIVER",
  },
  {
    code: "04 / CALCULATION AUDIT",
    title: "TRACE COMPLETE",
    detail: "ILLUSTRATIVE CHECKPOINT / NO EPHEMERIS VALUES",
  },
] as const;

function TimingOrbit({ index }: { index: number }) {
  return (
    <svg viewBox="0 0 420 330" aria-hidden="true">
      <circle cx="210" cy="165" r="124" />
      <circle cx="210" cy="165" r="88" strokeDasharray="3 9" />
      <path d="M80 165h260M210 35v260" className="axis" />
      <path
        d={
          index === 1
            ? "M330 165A120 120 0 0 1 206 285"
            : "M101 116c56-81 174-81 228 4"
        }
        className="calibration-arc"
      />
      <circle
        cx={index < 2 ? 318 : 132}
        cy={index < 2 ? 128 : 116}
        r="14"
        className="gold-sun"
      />
      <circle
        cx={index < 2 ? 118 : 294}
        cy={index < 2 ? 220 : 214}
        r="11"
        className="cyan-sun"
      />
      {index >= 2 && (
        <path
          d="M132 116 210 165l84 49M118 220l92-55 108-37"
          className="mirror"
        />
      )}
      <text x="26" y="30">
        TEMPORAL FIELD / 02
      </text>
      <text x="270" y="312">
        AUDIT ARC / 88°
      </text>
    </svg>
  );
}

function TetradThreePages() {
  const chapter = TETRADIC_CHOREOGRAPHY[2];

  return (
    <div className="tetradic-spread__chapter tetradic-spread__chapter--three">
      <div className="tetradic-spread__timing-track">
        {TIMING_STATES.map((state, index) => (
          <section key={state.code} className="tetradic-spread__timing-state">
            <div className="tetradic-spread__timing-copy">
              <p>{state.code}</p>
              <h3>{state.title}</h3>
              <span>{state.detail}</span>
            </div>
            <TimingOrbit index={index} />
            {index === 0 && (
              <img
                className="tetradic-spread__timing-seal"
                src={chapter.symbol}
                alt=""
                width={500}
                height={500}
                loading="lazy"
              />
            )}
          </section>
        ))}
      </div>
      <div className="tetradic-spread__gutter" aria-hidden="true" />
      <span className="tetradic-spread__folio-mark is-left">06</span>
      <span className="tetradic-spread__folio-mark is-right">07</span>
    </div>
  );
}

export function TetradicSpread({
  sceneStateRef,
}: {
  sceneStateRef: MutableRefObject<TetradicSceneState>;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { book } = TETRADIC_SIGNATURE_CONFIG.animation;

  useFrame(() => {
    const root = rootRef.current;
    if (!root) return;

    const state = sceneStateRef.current;
    const tetrad = state.tetradOne;
    const transitionOne = state.transitionOneToTwo;
    const tetradTwo = state.tetradTwo;
    const transitionTwo = state.transitionTwoToThree;
    const tetradThree = state.tetradThree;
    const t3Reveal = Math.max(
      transitionTwo.celestialReveal,
      tetradThree.celestialReveal
    );
    const t1Opacity = tetrad.spreadReveal * (1 - transitionOne.spreadSwap);
    const t2Opacity =
      Math.max(transitionOne.spreadSwap, tetradTwo.settle) *
      (1 - t3Reveal);
    const t3Opacity = t3Reveal;
    root.style.setProperty("--spread-reveal", tetrad.spreadReveal.toFixed(4));
    root.style.setProperty("--diagram-reveal", tetrad.diagramReveal.toFixed(4));
    root.style.setProperty("--seal-light", tetrad.sealLight.toFixed(4));
    root.style.setProperty(
      "--seal-light-opacity",
      tetrad.sealLightOpacity.toFixed(4)
    );
    root.style.setProperty("--spread-withdrawal", tetrad.withdrawal.toFixed(4));
    root.style.setProperty("--t1-opacity", t1Opacity.toFixed(4));
    root.style.setProperty("--t2-opacity", t2Opacity.toFixed(4));
    root.style.setProperty("--t2-blueprint", tetradTwo.blueprint.toFixed(4));
    root.style.setProperty("--t3-opacity", t3Opacity.toFixed(4));
    root.style.setProperty(
      "--t3-journey",
      tetradThree.horizontalJourney.toFixed(4)
    );
    root.style.setProperty(
      "--spread-roll",
      `${transitionTwo.celestialReveal * 180}deg`
    );
    root.style.opacity = String(tetrad.spreadReveal);
  });

  return (
    <Html
      transform
      position={[-book.width / 2, 0.326, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      distanceFactor={book.spreadDistanceFactor}
      pointerEvents="none"
      zIndexRange={[3, 2]}
    >
      <div ref={rootRef} className="tetradic-spread" aria-hidden="true">
        <TetradOnePages />
        <TetradTwoPages />
        <TetradThreePages />
      </div>
    </Html>
  );
}
