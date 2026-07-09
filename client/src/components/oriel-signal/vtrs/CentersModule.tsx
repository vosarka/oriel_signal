import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { VTRS_CENTERS, CENTER_COLORS } from "./vtrs-data";

// The 8 Resonance Centers of Photonic Processing — the symmetric column
// Origin → Omega (spec Part IV). Each center governs exactly 8 codons (8 × 8 = 64).
// Toggle DEFINED/OPEN per center to see how the behavior changes.

export function CentersModule() {
  const [expanded, setExpanded] = useState<string | null>("Origin");
  const [definedMap, setDefinedMap] = useState<Record<string, boolean>>(
    () => Object.fromEntries(VTRS_CENTERS.map(c => [c.id, true]))
  );

  const toggleDefined = (id: string) => {
    setDefinedMap(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="vtrs-module">
      <header className="vtrs-module__head">
        <span className="vtrs-module__eyebrow">MODULE 04 · PHOTONIC PROCESSING</span>
        <h2 className="vtrs-module__title">The 8 Resonance Centers</h2>
        <p className="vtrs-module__lede">
          Eight regulatory processors, each governing exactly 8 of the 64 codons — perfect
          symmetry (8 × 8 = 64). Each center is one saturation phase of the VTIP.
        </p>
      </header>

      <div className="centers-column">
        {VTRS_CENTERS.map((center, idx) => {
          const isDefined = definedMap[center.id];
          const isOpen = expanded === center.id;
          const color = CENTER_COLORS[center.id];

          return (
            <div key={center.id} className="centers-item">
              {/* Spine connector */}
              {idx > 0 && <div className="centers-spine" />}

              <div
                className={`centers-card ${isOpen ? "is-expanded" : ""}`}
                style={{
                  borderColor: isDefined ? color : "rgba(232,228,220,0.2)",
                  boxShadow: isDefined ? `0 0 18px ${color}33` : "none",
                }}
              >
                <button
                  type="button"
                  className="centers-card__head"
                  onClick={() => setExpanded(isOpen ? null : center.id)}
                >
                  <span className="centers-card__roman" style={{ color }}>
                    {center.roman}
                  </span>
                  <span className="centers-card__name">{center.name.toUpperCase()}</span>
                  <span className="centers-card__syntax" style={{ color }}>
                    {center.phaseSyntax}
                  </span>
                </button>

                <div className="centers-card__meta">
                  <span className="centers-card__phase">{center.phase}</span>
                  <span className="centers-card__substrate">{center.substrate}</span>
                </div>

                {/* Codon chips */}
                <div className="centers-card__codons">
                  {center.codons.map(codon => {
                    const code = `RC${String(codon).padStart(2, "0")}`;
                    return (
                      <span
                        key={codon}
                        className="centers-codon-chip"
                        style={{ borderColor: `${color}66`, opacity: isDefined ? 1 : 0.45, display: 'inline-flex', alignItems: 'center', gap: 3 }}
                      >
                        <img 
                          src={`/symbols/${code}.png`} 
                          alt={code} 
                          style={{ width: 10, height: 10, opacity: 0.85 }} 
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                        />
                        {code}
                      </span>
                    );
                  })}
                </div>

                {/* Defined / Open toggle */}
                <div className="centers-card__toggle-row">
                  <button
                    type="button"
                    className={`centers-toggle ${isDefined ? "is-active" : ""}`}
                    style={isDefined ? { borderColor: color, color } : undefined}
                    onClick={() => toggleDefined(center.id)}
                  >
                    DEFINED
                  </button>
                  <button
                    type="button"
                    className={`centers-toggle ${!isDefined ? "is-active is-open-state" : ""}`}
                    onClick={() => toggleDefined(center.id)}
                  >
                    OPEN
                  </button>
                </div>

                <p className="centers-card__state">
                  {isDefined ? center.definedState : center.openState}
                </p>

                {/* Expanded: informational role */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="centers-card__role"
                    >
                      <span className="centers-card__role-label">INFORMATIONAL ROLE</span>
                      <p>{center.role}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="vtrs-captions">
        <p>
          <b>Defined</b> — the center generates its own stable output; at least one Resonance Link
          endpoint pair is fully active.
        </p>
        <p>
          <b>Open</b> — the center is a receptor: it samples and amplifies the environment instead
          of generating its own signal.
        </p>
      </div>
    </div>
  );
}
