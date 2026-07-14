function CoverHierarchy({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`tetradic-signature__cover-lockup${compact ? " is-compact" : ""}`}
    >
      <div className="tetradic-signature__brand">
        <img src="/oriel-signal-mark.png" alt="" />
        <span>ORIEL</span>
      </div>
      <h1>
        <span>THE TETRADIC</span>
        <span>SIGNATURE</span>
      </h1>
      <p className="tetradic-signature__edition">FOUNDER EDITION</p>
      <p className="tetradic-signature__subtitle">
        YOUR RESONANCE ARCHITECTURE
      </p>
      <p className="tetradic-signature__reading-type">
        A FOUNDER-CURATED STATIC READING
        <span>BUILT THROUGH THE TETRADIC RESONANCE ARCHITECTURE</span>
      </p>
    </div>
  );
}

function PlaceholderCta() {
  return (
    <div className="tetradic-signature__cta-block">
      <p className="tetradic-signature__eyebrow">FOUNDER EDITION · PROTOTYPE</p>
      <h2>Your architecture awaits its reading.</h2>
      <p>
        The final acquisition path will be connected only after the experience
        architecture is approved.
      </p>
      <button type="button" disabled aria-disabled="true">
        CTA PLACEHOLDER
      </button>
    </div>
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
        <CoverHierarchy compact />
        <p className="tetradic-signature__reduced-note">
          Motion is reduced. The prototype is shown in its open-book state with
          the final placeholder Tetrad state held static.
        </p>
        <PlaceholderCta />
      </div>
    );
  }

  return (
    <div className="tetradic-signature__narratives">
      <section className="tetradic-signature__narrative tetradic-signature__narrative--cover">
        <CoverHierarchy />
      </section>

      <section className="tetradic-signature__narrative tetradic-signature__narrative--approach">
        <p className="tetradic-signature__eyebrow">RESONANCE OBJECT · 001</p>
        <h2>A closed architecture, held in potential.</h2>
        <p>
          The camera and object remain bound to your movement through the field.
        </p>
      </section>

      <section className="tetradic-signature__narrative tetradic-signature__narrative--opening">
        <p className="tetradic-signature__eyebrow">THE THRESHOLD</p>
        <h2>The architecture opens.</h2>
        <p>
          Scroll controls the cover directly. Reverse the movement to close it.
        </p>
      </section>

      <section className="tetradic-signature__narrative tetradic-signature__narrative--tetrad-one">
        <p className="tetradic-signature__eyebrow">
          TETRAD I · PLACEHOLDER STATE
        </p>
        <h2>Four positions establish the field.</h2>
        <p>Final symbols and reading content are intentionally deferred.</p>
      </section>

      <section className="tetradic-signature__narrative tetradic-signature__narrative--tetrad-two">
        <p className="tetradic-signature__eyebrow">
          TETRAD TRANSITION · PLACEHOLDER STATE
        </p>
        <h2>The same structure enters a second relation.</h2>
        <p>This reversible transition proves scene-state continuity.</p>
      </section>

      <section className="tetradic-signature__narrative tetradic-signature__narrative--cta">
        <PlaceholderCta />
      </section>
    </div>
  );
}
