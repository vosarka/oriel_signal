import React, { type CSSProperties } from "react";

import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_FINAL_OFFER,
  TETRADIC_SIGNATURE_CONFIG,
  TETRADIC_SPREAD_CONTENT,
  TETRADIC_SYNTHESIS,
} from "./tetradic-signature-config";

type NarrativeStyle = CSSProperties &
  Record<
    `--chapter-${"number" | "title" | "statement" | "withdrawal"}`,
    string
  >;

function CoverHierarchy() {
  const { naming, assets } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-signature__cover-lockup">
      <div className="tetradic-signature__brand">
        <img
          src={assets.logo}
          alt=""
          width={1024}
          height={1024}
          fetchPriority="high"
        />
        <span>{naming.brand}</span>
      </div>
      <h1>
        {naming.productLines.map(line => (
          <span key={line}>{line}</span>
        ))}
      </h1>
      <p className="tetradic-signature__edition">{naming.edition}</p>
      <p className="tetradic-signature__subtitle">{naming.subtitle}</p>
      <p className="tetradic-signature__reading-type">
        A {naming.readingType}
        <span>BUILT THROUGH THE {naming.system}</span>
      </p>
    </div>
  );
}

function ChapterNarrative({
  chapterIndex,
  staticState = false,
}: {
  chapterIndex: number;
  staticState?: boolean;
}) {
  const chapter = TETRADIC_CHOREOGRAPHY[chapterIndex];
  const number = String(chapter.number).padStart(2, "0");
  const prefix = `--ts-t${number}`;
  const style = {
    "--chapter-number": `var(${prefix}-title)`,
    "--chapter-title": `var(${prefix}-title)`,
    "--chapter-statement": `var(${prefix}-statement)`,
    "--chapter-withdrawal": `var(${prefix}-withdrawal)`,
  } as NarrativeStyle;

  return (
    <section
      className={`tetradic-signature__chapter-copy tetradic-signature__chapter-copy--${number}${
        staticState ? " is-static" : ""
      }`}
      style={style}
    >
      <p className="tetradic-signature__chapter-number">TETRAD {number} / 12</p>
      <h2>{chapter.title}</h2>
      <p className="tetradic-signature__main-statement">{chapter.statement}</p>
      {chapterIndex === 2 && (
        <p className="sr-only">
          Design time is found by a precise solar-arc retrograde search: the
          geocentric tropical Sun longitude exactly 88.0000 degrees behind the
          birth Sun. This sample does not display verified ephemeris values.
        </p>
      )}
    </section>
  );
}

function SemanticExperience() {
  const { naming, sample } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <article className="sr-only">
      <h1>{naming.product}</h1>
      <p>{naming.edition}</p>
      <p>{naming.subtitle}</p>
      <p>
        A {naming.readingType}. Built through the {naming.system}.
      </p>
      <p>Illustrative public sample record. No verified ephemeris values.</p>
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
        <dt>Archive seal</dt>
        <dd>Sample state with a 64-segment corona and four cardinal points</dd>
      </dl>
      <ol>
        {TETRADIC_CHOREOGRAPHY.map((chapter, index) => (
          <li key={chapter.id}>
            <p>TETRAD {String(chapter.number).padStart(2, "0")} / 12</p>
            <h2>{chapter.title}</h2>
            <p>{chapter.statement}</p>
            <p>{TETRADIC_SPREAD_CONTENT[index].semanticDescription}</p>
            <p>{TETRADIC_SPREAD_CONTENT[index].technicalLabels.join(". ")}</p>
          </li>
        ))}
      </ol>
      <p>
        Design time is found by a precise solar-arc retrograde search: the
        geocentric tropical Sun longitude exactly 88.0000 degrees behind the
        birth Sun. This sample does not display verified ephemeris values.
      </p>
      <section>
        <h2>{TETRADIC_SYNTHESIS.headline.join(" ")}</h2>
        {TETRADIC_SYNTHESIS.copy.map(line => (
          <p key={line}>{line}</p>
        ))}
        <p>{TETRADIC_SYNTHESIS.technicalLabel}</p>
      </section>
    </article>
  );
}

function SynthesisNarrative() {
  return (
    <section className="tetradic-signature__synthesis-copy">
      <h2>
        {TETRADIC_SYNTHESIS.headline.map(line => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <div>
        {TETRADIC_SYNTHESIS.copy.map(line => (
          <p key={line}>{line}</p>
        ))}
      </div>
      <p className="tetradic-signature__eyebrow">
        {TETRADIC_SYNTHESIS.technicalLabel}
      </p>
    </section>
  );
}

function FinalOfferBlock({
  staticState = false,
  onReplaySample,
}: {
  staticState?: boolean;
  onReplaySample?: () => void;
}) {
  const { ctas } = TETRADIC_SIGNATURE_CONFIG;
  const offer = TETRADIC_FINAL_OFFER;

  return (
    <section
      className={`tetradic-signature__cta-block${staticState ? " is-static" : ""}`}
      data-final-cta=""
      aria-hidden={staticState ? undefined : true}
      inert={staticState ? undefined : true}
    >
      <p className="tetradic-signature__eyebrow">{offer.eyebrow}</p>
      <h2>
        {offer.headline.map(line => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <p>{offer.description}</p>
      <ul className="tetradic-signature__product-details">
        {offer.productDetails.map(detail => (
          <li key={detail}>{detail}</li>
        ))}
      </ul>
      <div className="tetradic-signature__cta-actions">
        <a
          href={ctas.generateSignatureRoute}
          className="tetradic-signature__cta-link is-primary"
        >
          {ctas.generateSignatureLabel}
        </a>
        <button
          type="button"
          className="is-secondary"
          onClick={() => {
            if (onReplaySample) {
              onReplaySample();
              return;
            }
            if (typeof window === "undefined") return;
            sessionStorage.removeItem("oriel:tetradic-signature:progress:v2");
            window.scrollTo({ top: 0, behavior: "auto" });
          }}
        >
          {ctas.exploreSampleLabel}
        </button>
      </div>
      <p className="tetradic-signature__trust">{offer.trust}</p>
    </section>
  );
}

export function TetradicNarrative({
  reducedMotion,
  onReplaySample,
}: {
  reducedMotion: boolean;
  onReplaySample?: () => void;
}) {
  if (reducedMotion) {
    return (
      <>
        <SemanticExperience />
        <div className="tetradic-signature__reduced-narrative">
          <div className="tetradic-signature__reduced-summary">
            <div
              className="tetradic-signature__reduced-visual-copy"
              aria-hidden="true"
            >
              {TETRADIC_CHOREOGRAPHY.map((chapter, index) => (
                <ChapterNarrative
                  key={chapter.id}
                  chapterIndex={index}
                  staticState
                />
              ))}
              <div className="tetradic-signature__reduced-synthesis">
                <SynthesisNarrative />
              </div>
            </div>
            <FinalOfferBlock staticState onReplaySample={onReplaySample} />
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SemanticExperience />
      <div className="tetradic-signature__narratives" aria-hidden="true">
        <section className="tetradic-signature__narrative tetradic-signature__narrative--cover">
          <CoverHierarchy />
        </section>
        {TETRADIC_CHOREOGRAPHY.map((chapter, index) => (
          <ChapterNarrative key={chapter.id} chapterIndex={index} />
        ))}
        <SynthesisNarrative />
      </div>
      <section className="tetradic-signature__narrative tetradic-signature__narrative--cta">
        <FinalOfferBlock onReplaySample={onReplaySample} />
      </section>
    </>
  );
}
