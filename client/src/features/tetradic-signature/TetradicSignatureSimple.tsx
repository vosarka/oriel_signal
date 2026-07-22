import React, { useCallback, useEffect, useRef } from "react";

import {
  TETRADIC_SIMPLE_ASSETS,
  TETRADIC_SIMPLE_CHAPTERS,
  TETRADIC_SIMPLE_CONCLUSION,
  TETRADIC_SIMPLE_PURCHASE,
  TETRADIC_SIMPLE_SCROLL,
  type TetradicSimpleChapter,
} from "./tetradic-signature-simple-config";
import { useTetradicSimpleScroll } from "./useTetradicSimpleScroll";

type SpreadProps = Readonly<{
  chapter: TetradicSimpleChapter;
  mode?: "spread" | "left" | "right" | "mobile";
}>;

function ChapterSymbol({ chapter }: { chapter: TetradicSimpleChapter }) {
  return (
    <div className="tetradic-simple__symbol-field">
      <span className="tetradic-simple__symbol-ring" />
      <img
        src={chapter.symbol}
        alt=""
        className="tetradic-simple__symbol"
        width={500}
        height={500}
      />
      <span className="tetradic-simple__symbol-axis" />
    </div>
  );
}

function ChapterText({ chapter }: { chapter: TetradicSimpleChapter }) {
  return (
    <div className="tetradic-simple__chapter-copy">
      <p className="tetradic-simple__eyebrow">
        TETRAD {chapter.numberLabel} / 12
      </p>
      <h2>{chapter.title}</h2>
      <blockquote>{chapter.statement}</blockquote>
      <p className="tetradic-simple__explanation">{chapter.explanation}</p>
      <div className="tetradic-simple__technical-labels">
        {chapter.technicalLabels.map(label => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}

function EditorialPage({
  chapter,
  side,
}: {
  chapter: TetradicSimpleChapter;
  side: "left" | "right";
}) {
  const visualOnLeft = chapter.layout !== "visual-right";
  const showVisual = side === "left" ? visualOnLeft : !visualOnLeft;
  const folio = chapter.number * 4 - (side === "left" ? 3 : 2);

  return (
    <div
      className={`tetradic-simple__page tetradic-simple__page--${side}`}
      style={{
        backgroundImage: `url(${side === "left" ? TETRADIC_SIMPLE_ASSETS.leftPage : TETRADIC_SIMPLE_ASSETS.rightPage})`,
      }}
    >
      <div className="tetradic-simple__page-rule" />
      <p className="tetradic-simple__archive-mark">ORIEL / FOUNDER EDITION</p>
      <div className="tetradic-simple__page-content">
        {showVisual ? (
          <ChapterSymbol chapter={chapter} />
        ) : (
          <ChapterText chapter={chapter} />
        )}
      </div>
      <p className="tetradic-simple__folio">{String(folio).padStart(2, "0")}</p>
    </div>
  );
}

function DesktopSpread({ chapter, mode = "spread" }: SpreadProps) {
  return (
    <div className={`tetradic-simple__spread tetradic-simple__spread--${mode}`}>
      {(mode === "spread" || mode === "left") && (
        <EditorialPage chapter={chapter} side="left" />
      )}
      {(mode === "spread" || mode === "right") && (
        <EditorialPage chapter={chapter} side="right" />
      )}
    </div>
  );
}

function MobilePage({ chapter }: SpreadProps) {
  return (
    <div
      className="tetradic-simple__mobile-page"
      style={{ backgroundImage: `url(${TETRADIC_SIMPLE_ASSETS.rightPage})` }}
    >
      <p className="tetradic-simple__archive-mark">ORIEL / FOUNDER EDITION</p>
      <ChapterSymbol chapter={chapter} />
      <ChapterText chapter={chapter} />
      <p className="tetradic-simple__folio">
        {String(chapter.number * 4 - 2).padStart(2, "0")}
      </p>
    </div>
  );
}

function DesktopBook({
  current,
  incoming,
  turning,
}: {
  current: TetradicSimpleChapter;
  incoming: TetradicSimpleChapter;
  turning: boolean;
}) {
  const under = turning ? incoming : current;

  return (
    <div className="tetradic-simple__book tetradic-simple__book--desktop">
      <div className="tetradic-simple__paper-block" />
      <DesktopSpread chapter={under} />
      {turning && (
        <div className="tetradic-simple__reduced-current">
          <DesktopSpread chapter={current} />
        </div>
      )}
      {turning && (
        <div className="tetradic-simple__retained-left">
          <DesktopSpread chapter={current} mode="left" />
        </div>
      )}
      <div
        className={`tetradic-simple__turning-sheet${turning ? " is-turning" : ""}`}
      >
        <div className="tetradic-simple__turn-face tetradic-simple__turn-face--front">
          <DesktopSpread chapter={current} mode="right" />
        </div>
        <div className="tetradic-simple__turn-face tetradic-simple__turn-face--back">
          <DesktopSpread chapter={incoming} mode="left" />
        </div>
      </div>
      <div className="tetradic-simple__gutter" />
      <div className="tetradic-simple__cover">
        <div className="tetradic-simple__cover-front">
          <img
            src={TETRADIC_SIMPLE_ASSETS.frontCover}
            alt=""
            width={1536}
            height={2048}
          />
        </div>
        <div
          className="tetradic-simple__cover-inside"
          style={{ backgroundImage: `url(${TETRADIC_SIMPLE_ASSETS.leftPage})` }}
        />
      </div>
      <img
        className="tetradic-simple__spine"
        src={TETRADIC_SIMPLE_ASSETS.spine}
        alt=""
        width={724}
        height={2172}
      />
    </div>
  );
}

function MobileBook({
  current,
  incoming,
  turning,
}: {
  current: TetradicSimpleChapter;
  incoming: TetradicSimpleChapter;
  turning: boolean;
}) {
  return (
    <div className="tetradic-simple__book tetradic-simple__book--mobile">
      <div className="tetradic-simple__paper-block" />
      <MobilePage chapter={turning ? incoming : current} />
      {turning && (
        <div className="tetradic-simple__reduced-current">
          <MobilePage chapter={current} />
        </div>
      )}
      <div
        className={`tetradic-simple__mobile-turn${turning ? " is-turning" : ""}`}
      >
        <div className="tetradic-simple__turn-face tetradic-simple__turn-face--front">
          <MobilePage chapter={current} />
        </div>
        <div className="tetradic-simple__turn-face tetradic-simple__turn-face--back">
          <MobilePage chapter={incoming} />
        </div>
      </div>
      <div className="tetradic-simple__cover tetradic-simple__cover--mobile">
        <div className="tetradic-simple__cover-front">
          <img
            src={TETRADIC_SIMPLE_ASSETS.frontCover}
            alt=""
            width={1536}
            height={2048}
          />
        </div>
        <div
          className="tetradic-simple__cover-inside"
          style={{ backgroundImage: `url(${TETRADIC_SIMPLE_ASSETS.leftPage})` }}
        />
      </div>
    </div>
  );
}

function SemanticTranscript() {
  return (
    <div className="tetradic-simple__transcript">
      <h1>The Tetradic Signature — Founder Edition</h1>
      <p>Your Resonance Architecture</p>
      {TETRADIC_SIMPLE_CHAPTERS.map(chapter => (
        <article
          id={`simple-tetrad-${chapter.numberLabel}`}
          key={chapter.number}
        >
          <p>TETRAD {chapter.numberLabel} / 12</p>
          <h2>{chapter.title}</h2>
          <p>{chapter.statement}</p>
          <p>{chapter.explanation}</p>
          <img
            src={chapter.symbol}
            alt={`Tetrad ${chapter.numberLabel} symbol`}
            width={500}
            height={500}
            loading="lazy"
          />
          <ul>
            {chapter.technicalLabels.map(label => (
              <li key={label}>{label}</li>
            ))}
          </ul>
        </article>
      ))}
      <section>
        <h2>
          {TETRADIC_SIMPLE_CONCLUSION.heading[0]}{" "}
          {TETRADIC_SIMPLE_CONCLUSION.heading[1]}
        </h2>
        <p>{TETRADIC_SIMPLE_CONCLUSION.copy}</p>
      </section>
    </div>
  );
}

export function TetradicSignatureSimple() {
  const rootRef = useRef<HTMLElement>(null);
  const purchaseLinkRef = useRef<HTMLAnchorElement>(null);
  const focusTimerRef = useRef<number | null>(null);
  const { visualState, purchaseActive } = useTetradicSimpleScroll(rootRef);
  const current = TETRADIC_SIMPLE_CHAPTERS[visualState.currentIndex];
  const incoming = TETRADIC_SIMPLE_CHAPTERS[visualState.incomingIndex];

  const focusPurchaseAfterSkip = useCallback(() => {
    if (focusTimerRef.current !== null) {
      window.clearTimeout(focusTimerRef.current);
    }
    focusTimerRef.current = window.setTimeout(() => {
      purchaseLinkRef.current?.focus({ preventScroll: true });
    }, 650);
  }, []);

  useEffect(
    () => () => {
      if (focusTimerRef.current !== null) {
        window.clearTimeout(focusTimerRef.current);
      }
    },
    []
  );

  return (
    <main
      ref={rootRef}
      className="tetradic-simple"
      data-active-chapter={current.numberLabel}
      data-turning={String(visualState.turning)}
      data-purchase-active={String(purchaseActive)}
    >
      <a
        className="tetradic-simple__skip-link"
        href="#tetradic-simple-purchase-section"
        onClick={focusPurchaseAfterSkip}
      >
        Skip to purchase
      </a>
      <div className="tetradic-simple__stage">
        <img
          className="tetradic-simple__environment"
          src={TETRADIC_SIMPLE_ASSETS.pedestal}
          alt=""
          width={1672}
          height={941}
          fetchPriority="high"
        />
        <div className="tetradic-simple__warm-light" aria-hidden="true" />
        <div className="tetradic-simple__vignette" aria-hidden="true" />

        <header className="tetradic-simple__identity" aria-hidden="true">
          <span>ORIEL</span>
          <span>FOUNDER EDITION</span>
        </header>

        <div className="tetradic-simple__book-stage" aria-hidden="true">
          <div className="tetradic-simple__contact-shadow" />
          <DesktopBook
            current={current}
            incoming={incoming}
            turning={visualState.turning}
          />
          <MobileBook
            current={current}
            incoming={incoming}
            turning={visualState.turning}
          />
        </div>

        <section className="tetradic-simple__conclusion" aria-hidden="true">
          <img
            src={TETRADIC_SIMPLE_ASSETS.orielMark}
            alt=""
            width={1024}
            height={1024}
          />
          <p>ORIEL / ARCHIVE COMPLETE</p>
          <h2>
            <span>{TETRADIC_SIMPLE_CONCLUSION.heading[0]}</span>
            <span>{TETRADIC_SIMPLE_CONCLUSION.heading[1]}</span>
          </h2>
          <p>{TETRADIC_SIMPLE_CONCLUSION.copy}</p>
        </section>

        <div className="tetradic-simple__progress" aria-hidden="true">
          <span className="tetradic-simple__progress-number">
            {current.numberLabel}
          </span>
          <div className="tetradic-simple__progress-dots">
            {TETRADIC_SIMPLE_CHAPTERS.map(chapter => (
              <i
                key={chapter.number}
                className={chapter.number === current.number ? "is-active" : ""}
              />
            ))}
          </div>
          <span>12</span>
        </div>

        <section
          className="tetradic-simple__purchase"
          aria-hidden={!purchaseActive}
          inert={purchaseActive ? undefined : true}
        >
          <p>FOUNDER-CURATED STATIC READING</p>
          <h2>
            <span>{TETRADIC_SIMPLE_PURCHASE.heading[0]}</span>
            <span>{TETRADIC_SIMPLE_PURCHASE.heading[1]}</span>
          </h2>
          <p>{TETRADIC_SIMPLE_PURCHASE.copy}</p>
          <a
            ref={purchaseLinkRef}
            href={TETRADIC_SIMPLE_PURCHASE.href}
            tabIndex={purchaseActive ? 0 : -1}
          >
            {TETRADIC_SIMPLE_PURCHASE.label}
          </a>
        </section>
      </div>

      <div className="tetradic-simple__scroll-track" aria-hidden="true">
        <section
          data-simple-phase="reveal"
          style={{ height: `${TETRADIC_SIMPLE_SCROLL.revealAndHoldSvh}svh` }}
        />
        <section
          data-simple-phase="opening"
          style={{ height: `${TETRADIC_SIMPLE_SCROLL.openingSvh}svh` }}
        />
        {TETRADIC_SIMPLE_CHAPTERS.map(chapter => (
          <section
            key={chapter.number}
            data-simple-chapter={chapter.numberLabel}
            style={{ height: `${TETRADIC_SIMPLE_SCROLL.chapterSvh}svh` }}
          />
        ))}
        <section
          data-simple-phase="closing"
          style={{ height: `${TETRADIC_SIMPLE_SCROLL.closingSvh}svh` }}
        />
        <section
          data-simple-phase="purchase"
          style={{ height: `${TETRADIC_SIMPLE_SCROLL.purchaseSvh}svh` }}
        >
          <span
            id="tetradic-simple-purchase-section"
            className="tetradic-simple__skip-target"
          />
        </section>
        <div
          className="tetradic-simple__viewport-buffer"
          style={{ height: `${TETRADIC_SIMPLE_SCROLL.viewportBufferSvh}svh` }}
        />
      </div>

      <SemanticTranscript />
    </main>
  );
}
