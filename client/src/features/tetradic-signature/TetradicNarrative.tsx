import React from "react";

import {
  TETRADIC_CHOREOGRAPHY,
  TETRADIC_SIGNATURE_CONFIG,
} from "./tetradic-signature-config";

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
  chapterIndex: 0 | 1 | 2;
  staticState?: boolean;
}) {
  const chapter = TETRADIC_CHOREOGRAPHY[chapterIndex];
  const modifier = ["one", "two", "three"][chapterIndex];

  return (
    <section
      className={`tetradic-signature__chapter-copy tetradic-signature__chapter-copy--${modifier}${
        staticState ? " is-static" : ""
      }`}
    >
      <p className="tetradic-signature__chapter-number">
        TETRAD {String(chapter.number).padStart(2, "0")} / 12
      </p>
      <h2>{chapter.title}</h2>
      <p className="tetradic-signature__main-statement">{chapter.statement}</p>
      {chapterIndex === 0 && (
        <div className="sr-only">
          <p>Illustrative public sample record. No verified ephemeris values.</p>
          <dl>
            <dt>Receiver</dt>
            <dd>{TETRADIC_SIGNATURE_CONFIG.sample.receiver}</dd>
            <dt>Record status</dt>
            <dd>{TETRADIC_SIGNATURE_CONFIG.sample.recordStatus}</dd>
            <dt>Birth record</dt>
            <dd>{TETRADIC_SIGNATURE_CONFIG.sample.birthRecord}</dd>
            <dt>Coordinates</dt>
            <dd>{TETRADIC_SIGNATURE_CONFIG.sample.coordinates}</dd>
            <dt>Archive ID</dt>
            <dd>{TETRADIC_SIGNATURE_CONFIG.sample.archiveId}</dd>
            <dt>Archive seal</dt>
            <dd>Sample state with a 64-segment corona and four cardinal points</dd>
          </dl>
        </div>
      )}
    </section>
  );
}

export function TetradicNarrative({
  reducedMotion,
}: {
  reducedMotion: boolean;
}) {
  if (reducedMotion) {
    return (
      <div className="tetradic-signature__reduced-narrative">
        <h1 className="sr-only">{TETRADIC_SIGNATURE_CONFIG.naming.product}</h1>
        <div className="tetradic-signature__reduced-summary">
          <ChapterNarrative chapterIndex={0} staticState />
          <ChapterNarrative chapterIndex={1} staticState />
          <ChapterNarrative chapterIndex={2} staticState />
        </div>
      </div>
    );
  }

  return (
    <div className="tetradic-signature__narratives">
      <section className="tetradic-signature__narrative tetradic-signature__narrative--cover">
        <CoverHierarchy />
      </section>
      <ChapterNarrative chapterIndex={0} />
      <ChapterNarrative chapterIndex={1} />
      <ChapterNarrative chapterIndex={2} />
    </div>
  );
}
