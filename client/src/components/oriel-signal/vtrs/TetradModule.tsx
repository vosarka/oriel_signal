import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// VTIP — Vossari Tetradic Indexing Protocol.
// A register is a 4-bit "nibble": I (Point) → II (Line) → III (Triangle) → IIII (Square).
// Saturation triggers a Register Break (') and the count spills into a new register.
// The system only accumulates; it never subtracts.

const BIT_NAMES = ["The Point — Initiation", "The Line — Corroboration", "The Triangle — Complexification", "The Square — Saturation"];

/** Convert an accumulated count into VTIP syntax, e.g. 5 → "IIII'I". */
function vtipSyntax(count: number): string {
  if (count <= 0) return "∅";
  const registers = Math.floor(count / 4);
  const remainder = count % 4;
  const parts: string[] = [];
  for (let i = 0; i < registers; i++) parts.push("IIII");
  if (remainder > 0) parts.push("I".repeat(remainder));
  return parts.join("'");
}

export function TetradModule() {
  const [count, setCount] = useState(0);

  const registers = useMemo(() => {
    // Render up to 3 registers (12 pulses max keeps the demo focused).
    const regs: { bits: boolean[]; saturated: boolean }[] = [];
    const total = Math.min(count, 12);
    const fullRegs = Math.floor(total / 4);
    const rem = total % 4;
    for (let r = 0; r < Math.max(1, fullRegs + (rem > 0 ? 1 : 0)); r++) {
      const filled = r < fullRegs ? 4 : r === fullRegs ? rem : 0;
      regs.push({
        bits: Array.from({ length: 4 }, (_, i) => i < filled),
        saturated: filled === 4,
      });
    }
    return regs;
  }, [count]);

  const capped = count >= 12;

  return (
    <div className="vtrs-module">
      <header className="vtrs-module__head">
        <span className="vtrs-module__eyebrow">MODULE 01 · VOSSARI TETRADIC INDEXING PROTOCOL</span>
        <h2 className="vtrs-module__title">The Tetrad</h2>
        <p className="vtrs-module__lede">
          The basic unit of Vossari accumulation is a 4-bit register — the nibble. Each pulse
          activates the next bit. The system only accumulates; it never subtracts.
        </p>
      </header>

      {/* Registers */}
      <div className="vtip-registers">
        <AnimatePresence>
          {registers.map((reg, rIdx) => (
            <motion.div
              key={rIdx}
              className="vtip-register"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <span className="vtip-register__label">REGISTER {rIdx + 1}</span>
              <div className="vtip-register__bits">
                {reg.bits.map((on, bIdx) => (
                  <motion.div
                    key={bIdx}
                    className={`vtip-bit ${on ? "is-on" : ""}`}
                    animate={
                      on
                        ? { backgroundColor: "rgba(111,183,199,0.22)", borderColor: "#6fb7c7" }
                        : { backgroundColor: "rgba(8,7,11,0.6)", borderColor: "rgba(205,161,74,0.16)" }
                    }
                    transition={{ duration: 0.25 }}
                  >
                    <span className="vtip-bit__glyph">{on ? "I".repeat(bIdx + 1) : ""}</span>
                  </motion.div>
                ))}
              </div>
              {reg.saturated && rIdx < registers.length - 1 && (
                <motion.span
                  className="vtip-break"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  title="Register Break — the saturated register spills into a new one"
                >
                  ′
                </motion.span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="vtip-controls">
        <button
          type="button"
          className="vtrs-btn vtrs-btn--cyan"
          onClick={() => setCount(c => Math.min(c + 1, 12))}
          disabled={capped}
        >
          +1 PULSE
        </button>
        <button type="button" className="vtrs-btn" onClick={() => setCount(0)}>
          RESET
        </button>
        {capped && <span className="vtip-cap-note">DEMO CAP · 3 REGISTERS</span>}
      </div>

      {/* Readout */}
      <div className="vtip-readout">
        <div className="vtip-readout__row">
          <span>VTIP_STATE</span>
          <b>
            {count} mod 4 = {count % 4}
          </b>
        </div>
        <div className="vtip-readout__row">
          <span>SYNTAX</span>
          <b className="vtip-readout__syntax">{vtipSyntax(count)}</b>
        </div>
        <div className="vtip-readout__row">
          <span>ACTIVE BIT</span>
          <b>{count === 0 ? "—" : BIT_NAMES[(count - 1) % 4]}</b>
        </div>
      </div>

      {/* Captions */}
      <div className="vtrs-captions">
        <p>
          <b>I · II · III · IIII</b> — Point, Line, Triangle, Square. Phase IIII is the saturated
          state, never the subtractive "IV".
        </p>
        <p>
          <b>Register Break (′)</b> — at full saturation the signal spills over and begins building
          a higher register on the established foundation: 5 = IIII′I.
        </p>
        <p>
          <b>Accumulation only</b> — overflow logic (`value mod 4`) prevents energy pooling
          asymmetrically, guaranteeing clean phase transitions.
        </p>
      </div>
    </div>
  );
}
