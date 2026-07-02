import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLES } from "../CodonWheel";

// The 16 Resonance Roles — the identity layer. 64 codons ÷ 16 families of 4.
// Gift/Shadow lines from spec Part V; the calculation pipeline from Part 3.6.

const ROLE_DETAILS: Record<string, { gift: string; shadow: string }> = {
  Originator: {
    gift: "Originality, systemic initiation, creative emergence, first-principles formulation.",
    shadow: "Extreme instability, manic over-initiation of half-formed projects, cognitive paralysis.",
  },
  Resonator: {
    gift: "Perfect timing, somatic attunement, group attunement, balanced contribution.",
    shadow: "Deep impatience, performative behavior, friction generation, structural misalignment.",
  },
  Articulator: {
    gift: "Laser focus, clear articulation, aesthetic refinement, linguistic precision.",
    shadow: "Intellectual vanity, high mental pressure, over-explanation, chronic self-obsession.",
  },
  Cultivator: {
    gift: "Empathetic listening, collective resource building, somatic skill development, human warmth.",
    shadow: "Stagnation, deep systemic dullness, premature compromise, underuse of innate talent.",
  },
  Clarifier: {
    gift: "Logical foresight, precise correction, high somatic sensitivity, immediate presence.",
    shadow: "Projective judgment, dogmatic intolerance, intellectual over-analysis, sensory overload.",
  },
  Sovereign: {
    gift: "Resource authority, gracious coordination, conceptual simplicity, mental renewal.",
    shadow: "Overbearing control, defensive pride, chaotic complexity, addictive mental loops.",
  },
  Guardian: {
    gift: "Universal acceptance, selfless protection, altruistic resource direction, existential totality.",
    shadow: "Extreme restriction, defensive selfishness, manipulation of resources, deep purposelessness.",
  },
  Devotee: {
    gift: "Complete commitment, emotional clarity, democratic leadership, preservation of continuity.",
    shadow: "Half-heartedness, emotional hunger, leadership arrogance, failure obsession.",
  },
  Transformer: {
    gift: "Mindful reflection, true personal power, experiential adventure, emotional transformation.",
    shadow: "Avoidant withdrawal, force, hunger for experiences, emotional turbulence.",
  },
  Catalyst: {
    gift: "Systemic equality, purposeful struggle, catalytic pressure, decisive resolve.",
    shadow: "Severe weakness, self-sabotaging conflict, constant provocation, physical exhaustion.",
  },
  Oracle: {
    gift: "Creative anticipation, cyclic completion, sudden breakthrough, pattern recognition.",
    shadow: "Escapist fantasy, unmet expectation, mental deafness, external interference.",
  },
  Steward: {
    gift: "Collective synergy, physical delight, mental transmutation, resourcefulness.",
    shadow: "Defensive dominance, mental seriousness, deep oppression, structural inadequacy.",
  },
  Reformer: {
    gift: "Ethical principles, balanced values, initiatory focus, somatic restraint.",
    shadow: "Reactionary behavior, systemic corruption, physical agitation, stress amplification.",
  },
  Ascendant: {
    gift: "Structural cycles, healthy ambition, freedom of spirit, rich storytelling.",
    shadow: "Material immaturity, greed, emotional victimization, conceptual distraction.",
  },
  Navigator: {
    gift: "Intuitive clarity, vital aliveness, transparent intimacy, evolutionary realism.",
    shadow: "Internal unease, permanent dissatisfaction, relational dishonesty, limitation fixation.",
  },
  Illuminator: {
    gift: "Inner truth, logical precision, systemic inquiry, archetypal memory.",
    shadow: "Psychological psychosis, intellectual over-complication, chronic doubt, mental confusion.",
  },
};

const PIPELINE_STEPS = [
  { label: "26 ACTIVATIONS", hint: "Collect conscious + design codon allocations from both layers." },
  { label: "PLANETARY WEIGHTS", hint: "Assign each activation its weight (Sun 100, Moon 70, Mercury 50…)." },
  { label: "AGGREGATE BY FAMILY", hint: "Sum the weights inside each of the 16 four-codon role families." },
  { label: "PRIMARY ROLE", hint: "The family with the highest cumulative weight." },
  { label: "SECONDARY PATTERN", hint: "The family with the second-highest weight." },
];

export function RolesModule() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  return (
    <div className="vtrs-module">
      <header className="vtrs-module__head">
        <span className="vtrs-module__eyebrow">MODULE 06 · THE IDENTITY LAYER</span>
        <h2 className="vtrs-module__title">The 16 Resonance Roles</h2>
        <p className="vtrs-module__lede">
          The 64 codons divide into 16 families of exactly 4 (16 × 4 = 64). Each role is a
          specialized resonance pattern — a family of behavior with a gift and a shadow.
        </p>
      </header>

      {/* 16 role cards */}
      <div className="roles-grid">
        {ROLES.map(role => {
          const isOpen = expanded === role.name;
          const details = ROLE_DETAILS[role.name];
          return (
            <div
              key={role.name}
              className={`roles-card ${isOpen ? "is-expanded" : ""}`}
              onClick={() => setExpanded(isOpen ? null : role.name)}
            >
              <div className="roles-card__head">
                <span className="roles-card__name">{role.name}</span>
                <span className="roles-card__range">{role.range}</span>
              </div>
              <span className="roles-card__desc">
                {role.roman} · {role.desc}
              </span>
              <AnimatePresence>
                {isOpen && details && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="roles-card__details"
                  >
                    <p className="roles-card__gift">
                      <b>GIFT</b> {details.gift}
                    </p>
                    <p className="roles-card__shadow">
                      <b>SHADOW</b> {details.shadow}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Calculation pipeline */}
      <div className="roles-pipeline">
        <span className="roles-pipeline__label">ROLE &amp; AUTHORITY CALCULATION PIPELINE</span>
        <div className="roles-pipeline__steps">
          {PIPELINE_STEPS.map((step, i) => (
            <div key={step.label} className="roles-pipeline__unit">
              <button
                type="button"
                className={`roles-pipeline__chip ${hoveredStep === i ? "is-hot" : ""}`}
                onMouseEnter={() => setHoveredStep(i)}
                onMouseLeave={() => setHoveredStep(null)}
                onClick={() => setHoveredStep(hoveredStep === i ? null : i)}
              >
                {step.label}
              </button>
              {i < PIPELINE_STEPS.length - 1 && <span className="roles-pipeline__arrow">→</span>}
            </div>
          ))}
        </div>
        <p className="roles-pipeline__hint">
          {hoveredStep !== null ? PIPELINE_STEPS[hoveredStep].hint : "Hover a step to read what it does."}
        </p>
      </div>

      <div className="vtrs-captions">
        <p>
          <b>Two independent axes</b> — Roles group codons sequentially (RC01–04, RC05–08…) for a
          readable identity label; Centers group them by phase. A Receiver's Role and defined
          Centers may look unrelated — that is by design, not a bug.
        </p>
      </div>
    </div>
  );
}
