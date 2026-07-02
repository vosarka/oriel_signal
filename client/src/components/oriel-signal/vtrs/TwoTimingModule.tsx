import { useState } from "react";
import { motion } from "framer-motion";

// The Two-Timing Algorithm: the Quantum Identity overlays two charts.
// Personality layer = planetary positions at T_birth.
// Design layer = positions at T_design, found by regressing the Sun exactly 88.0000°.
// Validation vector (spec Part XI.3): Sun 280.44° → RC38; 192.44° → RC57.

const CX = 210;
const CY = 210;
const R = 170;

function pol(deg: number, r: number = R) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

// Arc path from startDeg sweeping BACKWARDS (counter-clockwise) by sweepDeg.
function arcPath(startDeg: number, sweepDeg: number, r: number = R) {
  const endDeg = startDeg - sweepDeg;
  const s = pol(startDeg, r);
  const e = pol(endDeg, r);
  const largeArc = sweepDeg > 180 ? 1 : 0;
  // sweep-flag 0 = counter-clockwise in SVG's y-down coordinate system
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${largeArc} 0 ${e.x} ${e.y}`;
}

const SUN_BIRTH = 280.44;
const OFFSET = 88.0;
const SUN_DESIGN = (SUN_BIRTH - OFFSET + 360) % 360; // 192.44

export function TwoTimingModule() {
  const [run, setRun] = useState(0); // increments to replay the sweep

  const birthPos = pol(SUN_BIRTH);
  const designPos = pol(SUN_DESIGN);

  return (
    <div className="vtrs-module">
      <header className="vtrs-module__head">
        <span className="vtrs-module__eyebrow">MODULE 02 · THE DOUBLE SIGNAL</span>
        <h2 className="vtrs-module__title">The Two-Timing Algorithm</h2>
        <p className="vtrs-module__lede">
          One identity, two timestamps. The conscious Personality layer is read at birth; the
          unconscious Design layer is read at the exact moment the Sun sat 88.0000° earlier on the
          ecliptic.
        </p>
      </header>

      <div className="twotiming-stage">
        <svg viewBox="0 0 420 420" className="twotiming-svg">
          {/* Ecliptic ring + ticks */}
          <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(205,161,74,0.2)" strokeWidth="1" />
          <circle cx={CX} cy={CY} r={R - 22} fill="none" stroke="rgba(111,183,199,0.14)" strokeWidth="0.8" strokeDasharray="2 6" />
          {Array.from({ length: 12 }).map((_, i) => {
            const a = pol(i * 30, R + 6);
            const b = pol(i * 30, R - 6);
            return <line key={i} x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="rgba(205,161,74,0.35)" strokeWidth="1" />;
          })}
          {/* 0° Aries marker */}
          <text x={pol(0, R + 20).x} y={pol(0, R + 20).y} textAnchor="middle" className="twotiming-tick-label">
            0° ARIES
          </text>

          {/* The −88° sweep arc (replayable) */}
          <motion.path
            key={run}
            d={arcPath(SUN_BIRTH, OFFSET)}
            fill="none"
            stroke="#6fb7c7"
            strokeWidth="2.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2.2, ease: "easeInOut" }}
          />

          {/* Sun at T_birth (gold) */}
          <circle cx={birthPos.x} cy={birthPos.y} r="8" fill="#cda14a" stroke="#e8c477" strokeWidth="2" />
          <text x={birthPos.x + 14} y={birthPos.y + 4} className="twotiming-label twotiming-label--gold">
            T_birth · 280.44°
          </text>

          {/* Sun at T_design (cyan) — appears after the sweep */}
          <motion.g key={`d-${run}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0, duration: 0.5 }}>
            <circle cx={designPos.x} cy={designPos.y} r="8" fill="none" stroke="#6fb7c7" strokeWidth="2.5" />
            <circle cx={designPos.x} cy={designPos.y} r="3.5" fill="#6fb7c7" />
            <text x={designPos.x - 14} y={designPos.y + 4} textAnchor="end" className="twotiming-label twotiming-label--cyan">
              T_design · 192.44°
            </text>
          </motion.g>

          {/* Center legend */}
          <text x={CX} y={CY - 12} textAnchor="middle" className="twotiming-center-line twotiming-label--gold">
            PERSONALITY LAYER (T_birth)
          </text>
          <text x={CX} y={CY + 6} textAnchor="middle" className="twotiming-center-sub">
            overlaid with
          </text>
          <text x={CX} y={CY + 24} textAnchor="middle" className="twotiming-center-line twotiming-label--cyan">
            DESIGN LAYER (T_design)
          </text>
        </svg>

        <button type="button" className="vtrs-btn vtrs-btn--cyan" onClick={() => setRun(r => r + 1)}>
          REPLAY SWEEP
        </button>
      </div>

      {/* Readout */}
      <div className="vtip-readout">
        <div className="vtip-readout__row">
          <span>TARGET</span>
          <b>L_target = (280.44° − 88.0000°) mod 360° = 192.44°</b>
        </div>
        <div className="vtip-readout__row">
          <span>VALIDATION</span>
          <b>280.44° → RC38 · STRUGGLE</b>
        </div>
        <div className="vtip-readout__row">
          <span>&nbsp;</span>
          <b>192.44° → RC57 · INTUITION</b>
        </div>
      </div>

      <div className="vtrs-captions">
        <p>
          <b>Retrograde search</b> — the engine walks backwards 88–89 days to find the exact second
          the Sun crossed the target longitude. That timestamp is T_design.
        </p>
        <p>
          <b>Hardware vs. software</b> — Design layer maps the somatic vehicle (unconscious);
          Personality layer maps the cognitive lens (conscious). The overlay is the Quantum
          Identity.
        </p>
      </div>
    </div>
  );
}
