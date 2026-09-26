import { VTIP_REGISTERS, tetradBits, splitPrime } from "./registers";

/**
 * REGISTER SPECTRUM — the filter is the protocol.
 *
 * Each register shows the Tetrad it holds: four bits, saturation at four.
 * The prime marker (′) is drawn in teal because it is a register break,
 * not a numeral. SYS-DOC-01, sections 2–4.
 */

interface RegisterSpectrumProps {
  counts: Record<string, number>;
  active: string;
  onSelect: (id: string) => void;
}

export function RegisterSpectrum({
  counts,
  active,
  onSelect,
}: RegisterSpectrumProps) {
  return (
    <div className="tx-registers" role="group" aria-label="Phase registers">
      {VTIP_REGISTERS.map(reg => {
        const held = counts[reg.id] || 0;
        const capacity =
          reg.id === "all" ? held : reg.range[1] - reg.range[0] + 1;
        const bits =
          reg.id === "all" ? (held > 0 ? 4 : 0) : tetradBits(held, capacity);
        const saturated = reg.id !== "all" && held >= capacity;
        const empty = held === 0;
        const [stem, prime, overflow] = splitPrime(reg.vtip);

        const cls = [
          "tx-register",
          active === reg.id ? "is-active" : "",
          saturated ? "is-saturated" : "",
          empty ? "is-empty" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return (
          <button
            key={reg.id}
            type="button"
            className={cls}
            aria-pressed={active === reg.id}
            onClick={() => onSelect(reg.id)}
          >
            <div className="tx-register__syntax">
              {stem}
              {prime && <span className="tx-register__prime">{prime}</span>}
              {overflow}
            </div>

            <div className="tx-register__name">{reg.name}</div>
            <div className="tx-register__state">{reg.state}</div>

            <div className="tx-register__bits" aria-hidden="true">
              {[0, 1, 2, 3].map(i => (
                <span
                  key={i}
                  className={`tx-register__bit ${i < bits ? "is-set" : ""}`}
                />
              ))}
            </div>

            <div className="tx-register__load">
              {reg.id === "all"
                ? `${held} held`
                : empty
                  ? "Dormant"
                  : saturated
                    ? `Saturated · ${held}`
                    : `${held} / ${capacity} held`}
            </div>
          </button>
        );
      })}
    </div>
  );
}
