/**
 * SIGNAL ROW — one day of the open register, in the ledger's own shape.
 * A daily signal has no detail page: choosing a row seats it in the
 * carrier above, sealed, the same way today's signal arrives.
 */

// Channel states, drawn from the locked palette only (same as LedgerRow).
const CHANNEL: Record<string, string> = {
  OPEN: "#d8b56d",
  STABLE: "#d8b56d",
  RESONANT: "#5ba4a4",
  COHERENT: "#e4c88c",
  "HIGH COHERENCE": "#e4c88c",
  PROPHETIC: "#e4c88c",
  "MAXIMUM COHERENCE": "#fff7e6",
  "CRITICAL / STABLE": "#bda36b",
};

export function SignalRow({
  signal,
  active,
  onSelect,
}: {
  signal: any;
  active: boolean;
  onSelect: () => void;
}) {
  const pct = Math.max(0, Math.min(100, parseFloat(signal.clarity) || 0));
  const tone = CHANNEL[signal.channelStatus] || "#d8b56d";

  return (
    <button
      type="button"
      className={`tx-row tx-row--signal ${active ? "is-active" : ""}`}
      onClick={onSelect}
      aria-pressed={active}
      aria-label={`${signal.title} — ${signal.signalDate}`}
    >
      <span className="tx-row__sigil" aria-hidden="true">
        ⦿
      </span>

      <span className="tx-row__id">{signal.txGenId}</span>

      <span className="tx-row__title">{signal.title}</span>

      <span className="tx-row__field">
        {signal.signalDate} · {signal.clarityRegister}
      </span>

      <span className="tx-row__clarity">
        <span className="tx-row__meter">
          <span style={{ width: `${pct}%` }} />
        </span>
        <span className="tx-row__pct">{signal.clarity}%</span>
      </span>

      <span
        className="tx-row__status"
        style={{ color: tone, borderColor: `${tone}33` }}
      >
        {signal.channelStatus}
      </span>

      <span className="tx-row__enter" aria-hidden="true">
        ↑
      </span>
    </button>
  );
}
