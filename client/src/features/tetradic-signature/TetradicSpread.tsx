import { useRef, type MutableRefObject } from "react";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";

import type { TetradicSceneState } from "./chapter-config";
import { SampleArchiveSeal } from "./SampleArchiveSeal";
import {
  TETRADIC_SIGNATURE_CONFIG,
  TETRAD_ONE_SPREAD,
} from "./tetradic-signature-config";

function ArchiveCoordinateDiagram() {
  return (
    <svg
      className="tetradic-spread__coordinate-diagram"
      viewBox="0 0 420 220"
      aria-hidden="true"
    >
      <defs>
        <filter
          id="tetradic-manuscript-line"
          x="-3%"
          y="-5%"
          width="106%"
          height="110%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.015"
            numOctaves="1"
            seed="7"
            result="paperNoise"
          />
          <feDisplacementMap in="SourceGraphic" in2="paperNoise" scale="0.55" />
        </filter>
      </defs>
      <rect x="1" y="1" width="418" height="218" rx="3" />
      <g filter="url(#tetradic-manuscript-line)">
        <path d="M26 110h368M210 20v180" className="axis" />
        <ellipse cx="210" cy="110" rx="150" ry="76" />
        <ellipse cx="210" cy="110" rx="106" ry="52" strokeDasharray="3 7" />
        <path d="M91 64 210 20l119 44 65 46-65 46-119 44-119-44-65-46z" />
        <path d="M112 110c30-56 166-56 196 0-30 56-166 56-196 0z" />
        <circle cx="210" cy="110" r="18" className="signal" />
        <circle cx="210" cy="110" r="5" className="signal-core" />
        <path d="m210 82 7 12-7 12-7-12z" className="calibration" />
        <path d="m210 114 7 12-7 12-7-12z" className="calibration" />
        <path d="m182 110 12-7 12 7-12 7z" className="calibration" />
        <path d="m214 110 12-7 12 7-12 7z" className="calibration" />
      </g>
      <g className="diagram-labels">
        <text x="22" y="18">
          ENTRY FIELD / REDACTED
        </text>
        <text x="291" y="208">
          CALIBRATION 00.00
        </text>
        <text x="222" y="103">
          RECEIVER
        </text>
        <text x="222" y="117">
          POINT
        </text>
      </g>
    </svg>
  );
}

function RecordRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="tetradic-spread__record-row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

function TetradOnePages() {
  const { naming, sample } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-spread__pages">
      <article className="tetradic-spread__page tetradic-spread__page--left">
        <header className="tetradic-spread__page-header">
          <span>{naming.system}</span>
          <span>TS / 01.001</span>
        </header>

        <div className="tetradic-spread__left-intro">
          <p className="tetradic-spread__kicker">RECEIVER ENTRY / 01</p>
          <h3>Identity Plate</h3>
          <p>
            A reading begins only after the receiver record becomes specific.
          </p>
        </div>

        <dl
          className="tetradic-spread__record"
          data-annotation-target="identity-plate"
        >
          <RecordRow label="RECEIVER" value={sample.receiver} />
          <RecordRow label="RECORD STATUS" value={sample.recordStatus} />
          <RecordRow label="BIRTH RECORD" value={sample.birthRecord} />
          <RecordRow label="COORDINATES" value={sample.coordinates} />
          <RecordRow label="ARCHIVE ID" value={sample.archiveId} />
        </dl>

        <ArchiveCoordinateDiagram />

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
          <span>Ψ / 64</span>
        </header>

        <div className="tetradic-spread__seal-field">
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

        <div className="tetradic-spread__legend">
          <span>READING LEGEND</span>
          <p>IDENTITY · RECORD · LANGUAGE · SEAL</p>
        </div>

        <footer className="tetradic-spread__folio tetradic-spread__folio--right">
          <b>03</b>
          <span>{naming.readingType}</span>
        </footer>
      </article>

      <div className="tetradic-spread__gutter" aria-hidden="true" />
      <div className="tetradic-spread__turning-leaf" aria-hidden="true">
        <span>04</span>
      </div>
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
    root.style.setProperty("--spread-reveal", tetrad.spreadReveal.toFixed(4));
    root.style.setProperty("--diagram-reveal", tetrad.diagramReveal.toFixed(4));
    root.style.setProperty("--seal-light", tetrad.sealLight.toFixed(4));
    root.style.setProperty(
      "--seal-light-opacity",
      tetrad.sealLightOpacity.toFixed(4)
    );
    root.style.setProperty(
      "--spread-page-lift",
      (tetrad.pageLift * (1 - state.cta)).toFixed(4)
    );
    root.style.setProperty("--spread-withdrawal", tetrad.withdrawal.toFixed(4));
    root.style.opacity = String(tetrad.spreadReveal * (1 - state.cta * 0.58));
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
      </div>
    </Html>
  );
}
