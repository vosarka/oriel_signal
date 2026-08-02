import React, { useRef, type CSSProperties } from "react";

import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_FINAL_OFFER,
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_SPREAD_CONTENT,
} from "./tetradic-signature-config";
import {
  TetradicEditorialVisual,
  type TetradicEditorialNumber,
} from "./TetradicEditorialVisuals";
import {
  TETRADIC_CHAPTER_PHASES,
  TETRADIC_SCROLL_RANGES,
  TETRADIC_TOTAL_VH,
  getTetradicChapterDataAttributes,
  getTetradicScrollDataAttributes,
} from "./tetradic-signature-scroll-config";
import {
  useTetradicEditorialScroll,
  type TetradicInteriorState,
} from "./useTetradicEditorialScroll";
import { useTetradicViewport } from "./useTetradicViewport";

const EDITORIAL_CHAPTERS = TETRADIC_CHOREOGRAPHY.map((chapter, index) => ({
  ...chapter,
  explanation: TETRADIC_SPREAD_CONTENT[index].semanticDescription,
  technicalLabels: TETRADIC_SPREAD_CONTENT[index].technicalLabels,
}));

type EditorialChapter = (typeof EDITORIAL_CHAPTERS)[number];

function formatTetrad(number: number) {
  return String(number).padStart(2, "0");
}

function ProductIdentity() {
  const { naming } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-editorial__identity" aria-hidden="true">
      <p>
        <span>{naming.brand}</span>
        <span>{naming.edition}</span>
      </p>
      <div>
        <span>{naming.productLines[0]}</span>
        <span>{naming.productLines[1]}</span>
      </div>
      <small>{naming.subtitle}</small>
    </div>
  );
}

function PhysicalBook() {
  const { assets, naming } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-editorial__physical-book">
      <div className="tetradic-editorial__contact-shadow" />
      <div className="tetradic-editorial__book-volume">
        <div className="tetradic-editorial__paper-block" />
        <div className="tetradic-editorial__book-leaf tetradic-editorial__book-leaf--right">
          <span className="tetradic-editorial__endpaper-rule" />
          <img
            src={TETRADIC_CHOREOGRAPHY[0].symbol}
            alt=""
            width="500"
            height="500"
          />
          <small>{naming.readingType}</small>
        </div>
        <div className="tetradic-editorial__spine">
          <img
            src="/assets/tetradic-signature/book-spine.png"
            alt=""
            width="724"
            height="2172"
          />
        </div>
        <div className="tetradic-editorial__front-cover">
          <div className="tetradic-editorial__front-cover-face">
            <img
              src={assets.cover}
              alt="The Tetradic Signature Founder Edition cover"
              width="1536"
              height="2048"
              fetchPriority="high"
            />
          </div>
          <div className="tetradic-editorial__front-cover-inside">
            <img src={assets.logo} alt="" width="1024" height="1024" />
            <small>{naming.system}</small>
          </div>
        </div>
      </div>
    </div>
  );
}

function ArtifactStage({
  purchaseActive,
  onReplay,
}: {
  purchaseActive: boolean;
  onReplay: () => void;
}) {
  const { assets } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div
      className="tetradic-editorial__artifact-section"
      data-capture="physical-book"
      data-purchase-active={String(purchaseActive)}
    >
      <div className="tetradic-editorial__artifact-stage" aria-hidden="true">
        <img
          className="tetradic-editorial__environment"
          src={assets.environment}
          alt=""
          width="1672"
          height="941"
          fetchPriority="high"
        />
        <div className="tetradic-editorial__environment-vignette" />
        <PhysicalBook />
        <ProductIdentity />
        <p className="tetradic-editorial__scroll-cue">SCROLL TO OPEN</p>
      </div>
      <PurchaseState active={purchaseActive} onReplay={onReplay} />
    </div>
  );
}

function CopyPage({
  chapter,
  decorative = false,
}: {
  chapter: EditorialChapter;
  decorative?: boolean;
}) {
  const pageNumber = chapter.number * 4 - 2;

  return (
    <section className="tetradic-editorial__page tetradic-editorial__page--copy">
      <header className="tetradic-editorial__page-running-head">
        <span>TETRADIC RESONANCE ARCHITECTURE</span>
        <span>FOUNDER EDITION</span>
      </header>
      <div className="tetradic-editorial__copy-block">
        <p className="tetradic-editorial__eyebrow">
          TETRAD {formatTetrad(chapter.number)} / 12
        </p>
        {decorative ? (
          <div className="tetradic-editorial__turn-title">{chapter.title}</div>
        ) : (
          <h2 id={`${chapter.id}-title`}>{chapter.title}</h2>
        )}
        <blockquote>{chapter.statement}</blockquote>
        <p className="tetradic-editorial__explanation">{chapter.explanation}</p>
      </div>
      <footer className="tetradic-editorial__folio">
        <span>{formatTetrad(pageNumber)}</span>
        <span>ORIEL / SAMPLE ARCHIVE</span>
      </footer>
    </section>
  );
}

function VisualPage({ chapter }: { chapter: EditorialChapter }) {
  const pageNumber = chapter.number * 4 - 1;

  return (
    <section className="tetradic-editorial__page tetradic-editorial__page--visual">
      <header className="tetradic-editorial__page-running-head">
        <span>{chapter.act}</span>
        <span>ILLUSTRATIVE SAMPLE</span>
      </header>
      <TetradicEditorialVisual
        number={chapter.number as TetradicEditorialNumber}
        symbol={chapter.symbol}
      />
      <div className="tetradic-editorial__technical-labels">
        {chapter.technicalLabels.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>
      <footer className="tetradic-editorial__folio tetradic-editorial__folio--right">
        <span>PUBLIC SAMPLE / REDACTED</span>
        <span>{formatTetrad(pageNumber)}</span>
      </footer>
    </section>
  );
}

function CompactPage({ chapter }: { chapter: EditorialChapter }) {
  return (
    <div className="tetradic-editorial__compact-page">
      <CopyPage chapter={chapter} decorative />
      <VisualPage chapter={chapter} />
    </div>
  );
}

function EditorialSpread({
  chapter,
  active,
}: {
  chapter: EditorialChapter;
  active: boolean;
}) {
  return (
    <article
      id={chapter.id}
      className="tetradic-editorial__spread"
      data-active={active ? "true" : "false"}
      data-chapter={chapter.number}
      data-capture={`tetrad-${formatTetrad(chapter.number)}`}
      aria-labelledby={`${chapter.id}-title`}
    >
      <div className="tetradic-editorial__spread-pages">
        <CopyPage chapter={chapter} />
        <VisualPage chapter={chapter} />
        <div className="tetradic-editorial__gutter" aria-hidden="true" />
      </div>
    </article>
  );
}

function TurningSheet({
  previous,
  incoming,
  visible,
}: {
  previous: EditorialChapter;
  incoming: EditorialChapter;
  visible: boolean;
}) {
  return (
    <div
      className="tetradic-editorial__turn-sheet"
      data-visible={visible ? "true" : "false"}
      data-capture="page-turn-01-02"
      aria-hidden="true"
    >
      <div className="tetradic-editorial__turn-face tetradic-editorial__turn-face--front tetradic-editorial__turn-face--desktop">
        <VisualPage chapter={previous} />
      </div>
      <div className="tetradic-editorial__turn-face tetradic-editorial__turn-face--back tetradic-editorial__turn-face--desktop">
        <CopyPage chapter={incoming} decorative />
      </div>
      <div className="tetradic-editorial__turn-face tetradic-editorial__turn-face--front tetradic-editorial__turn-face--mobile">
        <CompactPage chapter={previous} />
      </div>
      <div className="tetradic-editorial__turn-face tetradic-editorial__turn-face--back tetradic-editorial__turn-face--mobile">
        <CompactPage chapter={incoming} />
      </div>
      <span className="tetradic-editorial__turn-highlight" />
      <span className="tetradic-editorial__turn-shadow" />
    </div>
  );
}

function InteriorArchive({
  state,
  reducedMotion,
}: {
  state: TetradicInteriorState;
  reducedMotion: boolean;
}) {
  const previousIndex = Math.max(0, state.incomingIndex - 1);
  const previous = EDITORIAL_CHAPTERS[previousIndex];
  const incoming = EDITORIAL_CHAPTERS[state.incomingIndex];

  return (
    <section
      id="tetradic-interior-reader"
      className="tetradic-editorial__interior"
      data-active-chapter={state.baseIndex + 1}
      data-turning={state.turning ? "true" : "false"}
      data-capture="open-book"
      aria-label="Twelve curated Tetradic Signature spreads"
      tabIndex={-1}
    >
      <div className="tetradic-editorial__interior-stage" aria-hidden="true">
        <div
          className="tetradic-editorial__interior-field"
          aria-hidden="true"
        />
        <div className="tetradic-editorial__book-spread">
          {EDITORIAL_CHAPTERS.map((chapter, index) => (
            <EditorialSpread
              key={chapter.id}
              chapter={chapter}
              active={index === state.baseIndex}
            />
          ))}
          {!reducedMotion && (
            <TurningSheet
              previous={previous}
              incoming={incoming}
              visible={state.turning}
            />
          )}
        </div>
      </div>
      {!reducedMotion && (
        <div
          className="tetradic-editorial__chapter-progress"
          aria-live="polite"
        >
          <span>{formatTetrad(state.baseIndex + 1)}</span>
          <i aria-hidden="true" />
          <span>12</span>
        </div>
      )}
      {!reducedMotion && (
        <span
          className="tetradic-editorial__capture-marker"
          data-capture="page-turn-01-02-marker"
          aria-hidden="true"
        />
      )}
      <div className="sr-only" data-editorial-transcript>
        <p>The Tetradic Signature Founder Edition sample archive.</p>
        {EDITORIAL_CHAPTERS.map(chapter => (
          <section
            key={`transcript-${chapter.id}`}
            aria-labelledby={`${chapter.id}-transcript-title`}
          >
            <p>
              Tetrad {formatTetrad(chapter.number)} of 12. {chapter.act}.
            </p>
            <h2 id={`${chapter.id}-transcript-title`}>{chapter.title}</h2>
            <blockquote>{chapter.statement}</blockquote>
            <p>{chapter.explanation}</p>
            <p>{chapter.technicalLabels.join(". ")}</p>
          </section>
        ))}
      </div>
    </section>
  );
}

function Synthesis() {
  return (
    <section
      className="tetradic-editorial__synthesis"
      aria-labelledby="tetradic-synthesis-title"
    >
      <div className="tetradic-editorial__synthesis-rule" aria-hidden="true">
        {EDITORIAL_CHAPTERS.map(chapter => (
          <img
            key={chapter.id}
            src={chapter.symbol}
            alt=""
            width="500"
            height="500"
            loading="lazy"
          />
        ))}
      </div>
      <p>THE TETRADIC SIGNATURE / FOUNDER EDITION</p>
      <h2 id="tetradic-synthesis-title">
        <span>TWELVE FIELDS.</span>
        <span>ONE ARCHITECTURE.</span>
      </h2>
      <blockquote>
        Your signature exists in the relationship between timing, activation,
        structure, tension, embodiment, and integration.
      </blockquote>
    </section>
  );
}

function PurchaseState({
  active,
  onReplay,
}: {
  active: boolean;
  onReplay: () => void;
}) {
  return (
    <section
      className="tetradic-editorial__purchase"
      data-capture="purchase-cta"
      aria-labelledby="tetradic-purchase-title"
      aria-hidden={!active}
      inert={!active}
    >
      <p>{TETRADIC_FINAL_OFFER.eyebrow}</p>
      <h2 id="tetradic-purchase-title">
        <span>RECEIVE YOUR</span>
        <span>TETRADIC SIGNATURE</span>
      </h2>
      <blockquote>
        A founder-curated reading of the resonance architecture encoded at your
        exact moment of arrival.
      </blockquote>
      <div className="tetradic-editorial__purchase-actions">
        <a href="/tetradic-signature">BUY THE FOUNDER EDITION</a>
        <button
          type="button"
          onClick={onReplay}
          aria-controls="tetradic-interior-reader"
        >
          EXPLORE THE SAMPLE AGAIN
        </button>
      </div>
      <small>{TETRADIC_FINAL_OFFER.trust}</small>
    </section>
  );
}

type ScrollDistanceStyle = CSSProperties & { "--scroll-vh": number };

function ScrollPhase({
  phase,
}: {
  phase: (typeof TETRADIC_SCROLL_RANGES)[number];
}) {
  return (
    <div
      className="tetradic-editorial__scroll-phase"
      {...getTetradicScrollDataAttributes(phase)}
      style={{ "--scroll-vh": phase.vh } as ScrollDistanceStyle}
      aria-hidden="true"
    />
  );
}

function EditorialScrollTrack() {
  const beforeTetrads = TETRADIC_SCROLL_RANGES.slice(0, 4);
  const tetrads = TETRADIC_SCROLL_RANGES.find(phase => phase.id === "tetrads");
  const afterTetrads = TETRADIC_SCROLL_RANGES.slice(5);

  return (
    <div className="tetradic-editorial__scroll-track">
      {beforeTetrads.map(phase => (
        <ScrollPhase key={phase.id} phase={phase} />
      ))}
      {tetrads && (
        <div
          className="tetradic-editorial__tetrad-track"
          {...getTetradicScrollDataAttributes(tetrads)}
        >
          {TETRADIC_CHAPTER_PHASES.map((chapter, index) => (
            <div
              key={chapter.id}
              className="tetradic-editorial__tetrad-scroll-phase"
              {...getTetradicChapterDataAttributes(chapter)}
              style={{ "--scroll-vh": chapter.vh } as ScrollDistanceStyle}
              aria-hidden={index === 0 ? undefined : "true"}
            >
              {index === 0 && (
                <span
                  id="tetradic-interior-start"
                  className="tetradic-editorial__interior-start"
                  tabIndex={-1}
                  aria-label="Begin the twelve Tetradic Signature spreads"
                />
              )}
            </div>
          ))}
        </div>
      )}
      {afterTetrads.map(phase => (
        <ScrollPhase key={phase.id} phase={phase} />
      ))}
      <div
        className="tetradic-editorial__scroll-end-buffer"
        aria-hidden="true"
      />
    </div>
  );
}

export function TetradicSignatureEditorial() {
  const rootRef = useRef<HTMLElement>(null);
  const { reducedMotion } = useTetradicViewport();
  const { interiorState, purchaseActive, replayFromFirstSpread } =
    useTetradicEditorialScroll(rootRef, reducedMotion);

  return (
    <>
      <a
        className="tetradic-editorial__skip-link"
        href="#tetradic-interior-start"
      >
        SKIP TO THE SIGNATURE
      </a>
      <main
        ref={rootRef}
        id="tetradic-main"
        className="tetradic-editorial"
        data-reduced-motion={reducedMotion ? "true" : "false"}
        data-total-scroll-vh={TETRADIC_TOTAL_VH}
        data-active-phase="reveal"
        data-active-chapter="1"
        data-turning="false"
        data-purchase-active="false"
      >
        <h1 className="sr-only">The Tetradic Signature Founder Edition</h1>
        <div className="tetradic-editorial__persistent-stage">
          <ArtifactStage
            purchaseActive={purchaseActive}
            onReplay={replayFromFirstSpread}
          />
          <InteriorArchive
            state={interiorState}
            reducedMotion={reducedMotion}
          />
          <Synthesis />
        </div>
        <EditorialScrollTrack />
      </main>
    </>
  );
}
