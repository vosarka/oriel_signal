import {
  TETRADIC_FINAL_OFFER,
  TETRADIC_SIGNATURE_CONFIG,
  TETRAD_ONE_SPREAD,
} from "./tetradic-signature-config";

function CoverHierarchy() {
  const { naming, assets } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-signature__cover-lockup">
      <div className="tetradic-signature__brand">
        <img src={assets.logo} alt="" />
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

function FinalOffer({ onExploreSample }: { onExploreSample: () => void }) {
  const { ctas } = TETRADIC_SIGNATURE_CONFIG;

  return (
    <div className="tetradic-signature__cta-block">
      <p className="tetradic-signature__eyebrow">
        {TETRADIC_FINAL_OFFER.eyebrow}
      </p>
      <h2>
        {TETRADIC_FINAL_OFFER.headline.map(line => (
          <span key={line}>{line}</span>
        ))}
      </h2>
      <p>{TETRADIC_FINAL_OFFER.description}</p>
      <div className="tetradic-signature__cta-actions">
        <button
          type="button"
          className="is-primary"
          disabled
          aria-disabled="true"
          data-development-note={ctas.generateSignatureStatus}
        >
          {ctas.generateSignatureLabel}
        </button>
        <button
          type="button"
          className="is-secondary"
          onClick={onExploreSample}
        >
          {ctas.exploreSampleLabel}
        </button>
      </div>
      <p className="tetradic-signature__trust">{TETRADIC_FINAL_OFFER.trust}</p>
    </div>
  );
}

function TetradOneNarrative({
  staticState = false,
}: {
  staticState?: boolean;
}) {
  return (
    <section
      className={`tetradic-signature__narrative tetradic-signature__narrative--tetrad-one${
        staticState ? " is-static" : ""
      }`}
    >
      <div className="tetradic-signature__tetrad-heading">
        <p className="tetradic-signature__eyebrow">
          {TETRAD_ONE_SPREAD.eyebrow}
        </p>
        <h2>{TETRAD_ONE_SPREAD.title}</h2>
      </div>
      <div className="tetradic-signature__tetrad-explanation">
        <p className="tetradic-signature__main-statement">
          {TETRAD_ONE_SPREAD.mainStatement}
        </p>
        <p className="tetradic-signature__description">
          {TETRAD_ONE_SPREAD.description}
        </p>
        <div className="tetradic-signature__technical-labels">
          {TETRAD_ONE_SPREAD.technicalLabels.map(label => (
            <span key={label}>{label}</span>
          ))}
        </div>
      </div>
      <div className="tetradic-signature__annotation" aria-hidden="true">
        <span />
        <i />
      </div>
    </section>
  );
}

export function TetradicNarrative({
  reducedMotion,
  onExploreSample,
}: {
  reducedMotion: boolean;
  onExploreSample: () => void;
}) {
  if (reducedMotion) {
    return (
      <div className="tetradic-signature__reduced-narrative">
        <TetradOneNarrative staticState />
        <FinalOffer onExploreSample={onExploreSample} />
      </div>
    );
  }

  return (
    <div className="tetradic-signature__narratives">
      <section className="tetradic-signature__narrative tetradic-signature__narrative--cover">
        <CoverHierarchy />
      </section>

      <section className="tetradic-signature__narrative tetradic-signature__narrative--approach">
        <p className="tetradic-signature__eyebrow">
          {TETRADIC_SIGNATURE_CONFIG.naming.system}
        </p>
        <h2>A personal artifact, held in potential.</h2>
        <p>
          The examination begins only when the receiver brings it into view.
        </p>
      </section>

      <TetradOneNarrative />

      <section className="tetradic-signature__narrative tetradic-signature__narrative--cta">
        <FinalOffer onExploreSample={onExploreSample} />
      </section>
    </div>
  );
}
