import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";

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
import { useTetradicViewport } from "./useTetradicViewport";

const CHAPTER_COUNT = 12;
const TURN_PORTION = 0.18;

const EDITORIAL_CHAPTERS = TETRADIC_CHOREOGRAPHY.map((chapter, index) => ({
  ...chapter,
  explanation: TETRADIC_SPREAD_CONTENT[index].semanticDescription,
  technicalLabels: TETRADIC_SPREAD_CONTENT[index].technicalLabels,
}));

type EditorialChapter = (typeof EDITORIAL_CHAPTERS)[number];

type InteriorState = Readonly<{
  baseIndex: number;
  incomingIndex: number;
  turning: boolean;
}>;

function clamp(value: number, minimum = 0, maximum = 1) {
  return Math.min(maximum, Math.max(minimum, value));
}

function range(value: number, start: number, end: number) {
  if (start === end) return value >= end ? 1 : 0;
  return clamp((value - start) / (end - start));
}

function mix(from: number, to: number, progress: number) {
  return from + (to - from) * progress;
}

function sectionProgress(section: HTMLElement) {
  const distance = Math.max(1, section.offsetHeight - window.innerHeight);
  return clamp(-section.getBoundingClientRect().top / distance);
}

function setStyleVariable(
  element: HTMLElement,
  property: string,
  value: string | number
) {
  element.style.setProperty(property, String(value));
}

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

function PhysicalBook({ mode }: { mode: "opening" | "closing" }) {
  const { assets, naming } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-editorial__physical-book" data-book-mode={mode}>
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
              fetchPriority={mode === "opening" ? "high" : undefined}
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
  mode,
  sectionRef,
  purchaseActive = false,
}: {
  mode: "opening" | "closing";
  sectionRef: React.RefObject<HTMLElement | null>;
  purchaseActive?: boolean;
}) {
  const { assets } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <section
      ref={sectionRef}
      className={`tetradic-editorial__artifact-section tetradic-editorial__artifact-section--${mode}`}
      data-capture={mode === "opening" ? "closed-book" : "final-closed-book"}
      data-purchase-active={
        mode === "closing" ? String(purchaseActive) : undefined
      }
      aria-label={
        mode === "opening"
          ? "The closed Founder Edition opens on its pedestal"
          : "The Founder Edition closes and returns to its pedestal"
      }
    >
      <div className="tetradic-editorial__artifact-stage">
        <img
          className="tetradic-editorial__environment"
          src={assets.environment}
          alt=""
          width="1672"
          height="941"
          fetchPriority={mode === "opening" ? "high" : undefined}
        />
        <div className="tetradic-editorial__environment-vignette" />
        <PhysicalBook mode={mode} />
        {mode === "opening" ? (
          <>
            <ProductIdentity />
            <p className="tetradic-editorial__scroll-cue" aria-hidden="true">
              SCROLL TO OPEN
            </p>
          </>
        ) : (
          <PurchaseState active={purchaseActive} />
        )}
      </div>
    </section>
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
  sectionRef,
  state,
  reducedMotion,
}: {
  sectionRef: React.RefObject<HTMLElement | null>;
  state: InteriorState;
  reducedMotion: boolean;
}) {
  const previousIndex = Math.max(0, state.incomingIndex - 1);
  const previous = EDITORIAL_CHAPTERS[previousIndex];
  const incoming = EDITORIAL_CHAPTERS[state.incomingIndex];

  return (
    <section
      id="tetradic-interior-start"
      ref={sectionRef}
      className="tetradic-editorial__interior"
      data-active-chapter={state.baseIndex + 1}
      data-turning={state.turning ? "true" : "false"}
      data-capture="open-book"
      aria-label="Twelve curated Tetradic Signature spreads"
      tabIndex={-1}
    >
      <div className="tetradic-editorial__interior-stage">
        <div
          className="tetradic-editorial__interior-field"
          aria-hidden="true"
        />
        <div className="tetradic-editorial__book-spread">
          {EDITORIAL_CHAPTERS.map((chapter, index) => (
            <EditorialSpread
              key={chapter.id}
              chapter={chapter}
              active={reducedMotion || index === state.baseIndex}
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
      </div>
      {!reducedMotion && (
        <span
          className="tetradic-editorial__capture-marker"
          data-capture="page-turn-01-02-marker"
          aria-hidden="true"
        />
      )}
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

function PurchaseState({ active }: { active: boolean }) {
  const handleReplay = useCallback(() => {
    const target = document.getElementById("tetradic-interior-start");
    if (!target) return;

    const root = document.documentElement;
    const previousBehavior = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    target.scrollIntoView({ block: "start" });
    window.requestAnimationFrame(() => {
      root.style.scrollBehavior = previousBehavior;
      target.focus({ preventScroll: true });
    });
  }, []);

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
        <a href="/founder-signature-blueprint">BUY THE FOUNDER EDITION</a>
        <button
          type="button"
          onClick={handleReplay}
          aria-controls="tetradic-interior-start"
        >
          EXPLORE THE SAMPLE AGAIN
        </button>
      </div>
      <small>{TETRADIC_FINAL_OFFER.trust}</small>
    </section>
  );
}

export function TetradicSignatureEditorial() {
  const openingRef = useRef<HTMLElement>(null);
  const interiorRef = useRef<HTMLElement>(null);
  const closingRef = useRef<HTMLElement>(null);
  const frameRef = useRef<number | null>(null);
  const stateRef = useRef<InteriorState>({
    baseIndex: 0,
    incomingIndex: 0,
    turning: false,
  });
  const [interiorState, setInteriorState] = useState<InteriorState>(
    stateRef.current
  );
  const { reducedMotion } = useTetradicViewport();
  const [purchaseActive, setPurchaseActive] = useState(reducedMotion);

  useEffect(() => {
    if (reducedMotion) {
      openingRef.current?.removeAttribute("style");
      interiorRef.current?.removeAttribute("style");
      closingRef.current?.removeAttribute("style");
      setPurchaseActive(true);
      return;
    }

    setPurchaseActive(false);

    const updateOpening = () => {
      const section = openingRef.current;
      if (!section) return;

      const progress = sectionProgress(section);
      const reveal = range(progress, 0.02, 0.16);
      const approach = range(progress, 0.1, 0.34);
      const opening = range(progress, 0.43, 0.76);
      const readingAngle = range(progress, 0.66, 0.9);
      const exit = range(progress, 0.92, 1);

      setStyleVariable(section, "--artifact-opacity", reveal * (1 - exit));
      setStyleVariable(section, "--environment-opacity", mix(0.2, 1, reveal));
      setStyleVariable(section, "--book-stage-x", "50%");
      setStyleVariable(section, "--book-open", opening);
      setStyleVariable(
        section,
        "--book-shift",
        `${mix(-75, -50, opening).toFixed(3)}%`
      );
      setStyleVariable(
        section,
        "--book-scale",
        mix(0.72, 0.98, Math.max(approach, readingAngle)).toFixed(4)
      );
      setStyleVariable(
        section,
        "--book-tilt",
        `${mix(mix(59, 39, approach), 12, readingAngle).toFixed(3)}deg`
      );
      setStyleVariable(
        section,
        "--book-y",
        `${mix(8, 0, approach).toFixed(3)}vh`
      );
      setStyleVariable(
        section,
        "--cover-angle",
        `${mix(0, -178, opening).toFixed(3)}deg`
      );
      setStyleVariable(
        section,
        "--identity-opacity",
        1 - range(progress, 0.3, 0.48)
      );
      setStyleVariable(
        section,
        "--cue-opacity",
        1 - range(progress, 0.16, 0.28)
      );
    };

    const updateInterior = () => {
      const section = interiorRef.current;
      if (!section) return;

      const progress = sectionProgress(section);
      const rawChapter = Math.min(
        CHAPTER_COUNT - Number.EPSILON,
        progress * CHAPTER_COUNT
      );
      const incomingIndex = Math.min(CHAPTER_COUNT - 1, Math.floor(rawChapter));
      const localProgress = rawChapter - incomingIndex;
      const turning = incomingIndex > 0 && localProgress < TURN_PORTION;
      const turnProgress = turning
        ? clamp(localProgress / TURN_PORTION)
        : incomingIndex === 0
          ? 0
          : 1;
      const baseIndex =
        turning && turnProgress < 0.5 ? incomingIndex - 1 : incomingIndex;
      const turnShadow = turning ? 1 - Math.abs(turnProgress * 2 - 1) : 0;

      setStyleVariable(section, "--turn-progress", turnProgress.toFixed(4));
      setStyleVariable(
        section,
        "--turn-angle",
        `${(-178 * turnProgress).toFixed(3)}deg`
      );
      setStyleVariable(section, "--turn-shadow", turnShadow.toFixed(4));
      section.dataset.activeChapter = String(baseIndex + 1);
      section.dataset.turning = turning ? "true" : "false";

      const nextState = { baseIndex, incomingIndex, turning };
      const previousState = stateRef.current;
      if (
        previousState.baseIndex !== nextState.baseIndex ||
        previousState.incomingIndex !== nextState.incomingIndex ||
        previousState.turning !== nextState.turning
      ) {
        stateRef.current = nextState;
        setInteriorState(nextState);
      }
    };

    const updateClosing = () => {
      const section = closingRef.current;
      if (!section) return;

      const progress = sectionProgress(section);
      const pullback = range(progress, 0.14, 0.82);
      const closing = range(progress, 0.28, 0.7);
      const cta = range(progress, 0.78, 0.94);

      setStyleVariable(section, "--artifact-opacity", 1);
      setStyleVariable(
        section,
        "--environment-opacity",
        mix(0.68, 1, pullback)
      );
      setStyleVariable(
        section,
        "--book-stage-x",
        `${mix(50, 41, cta).toFixed(3)}%`
      );
      setStyleVariable(section, "--book-open", 1 - closing);
      setStyleVariable(
        section,
        "--book-shift",
        `${mix(-50, -75, closing).toFixed(3)}%`
      );
      setStyleVariable(
        section,
        "--book-scale",
        mix(1, 0.62, pullback).toFixed(4)
      );
      setStyleVariable(
        section,
        "--book-tilt",
        `${mix(12, 59, pullback).toFixed(3)}deg`
      );
      setStyleVariable(
        section,
        "--book-y",
        `${mix(0, 8, pullback).toFixed(3)}vh`
      );
      setStyleVariable(
        section,
        "--cover-angle",
        `${mix(-178, 0, closing).toFixed(3)}deg`
      );
      setStyleVariable(section, "--purchase-opacity", cta.toFixed(4));
      const nextPurchaseActive = cta > 0.92;
      section.dataset.purchaseActive = nextPurchaseActive ? "true" : "false";
      setPurchaseActive(current =>
        current === nextPurchaseActive ? current : nextPurchaseActive
      );
    };

    const update = () => {
      frameRef.current = null;
      updateOpening();
      updateInterior();
      updateClosing();
    };

    const requestUpdate = () => {
      if (frameRef.current !== null) return;
      frameRef.current = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", requestUpdate, { passive: true });
    window.addEventListener("resize", requestUpdate);
    const settleTimer = window.setTimeout(requestUpdate, 250);

    return () => {
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", requestUpdate);
      window.clearTimeout(settleTimer);
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, [reducedMotion]);

  return (
    <>
      <a
        className="tetradic-editorial__skip-link"
        href="#tetradic-interior-start"
      >
        SKIP TO THE SIGNATURE
      </a>
      <main
        id="tetradic-main"
        className="tetradic-editorial"
        data-reduced-motion={reducedMotion ? "true" : "false"}
      >
        <h1 className="sr-only">The Tetradic Signature Founder Edition</h1>
        <ArtifactStage mode="opening" sectionRef={openingRef} />
        <InteriorArchive
          sectionRef={interiorRef}
          state={interiorState}
          reducedMotion={reducedMotion}
        />
        <Synthesis />
        <ArtifactStage
          mode="closing"
          sectionRef={closingRef}
          purchaseActive={purchaseActive}
        />
      </main>
    </>
  );
}
