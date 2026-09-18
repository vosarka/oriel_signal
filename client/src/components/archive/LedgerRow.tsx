import { Link } from "wouter";

/**
 * LEDGER ROW — the archive reads as a record, not a feed.
 * One line per recovered transmission: sigil, ID, title, field,
 * clarity, channel state. Dense by intent.
 */

// Channel states, drawn from the locked palette only.
const CHANNEL: Record<string, string> = {
  OPEN: "#d8b56d",
  STABLE: "#d8b56d",
  RESONANT: "#5ba4a4",
  COHERENT: "#e4c88c",
  PROPHETIC: "#e4c88c",
  LIVE: "#e4c88c",
  "HIGH COHERENCE": "#e4c88c",
  "MAXIMUM COHERENCE": "#fff7e6",
  "CRITICAL/STABLE": "#bda36b",
};

function clarityPct(clarity: string): number {
  const n = parseFloat(String(clarity ?? "").replace("%", ""));
  return Number.isFinite(n) ? Math.max(0, Math.min(100, n)) : 0;
}

export function LedgerRow({ tx }: { tx: any }) {
  const pct = clarityPct(tx.signalClarity);
  const tone = CHANNEL[tx.channelStatus] || "#d8b56d";

  return (
    <Link
      href={`/transmission/${tx.id}`}
      className="tx-row"
      aria-label={`${tx.title} — ${tx.field}`}
    >
      <span className="tx-row__sigil" aria-hidden="true">
        {tx.microSigil || "◈"}
      </span>

      <span className="tx-row__id">
        TX-{String(tx.txNumber).padStart(3, "0")}
      </span>

      <span className="tx-row__title">{tx.title}</span>

      <span className="tx-row__field">{tx.field}</span>

      <span className="tx-row__clarity">
        <span className="tx-row__meter">
          <span style={{ width: `${pct}%` }} />
        </span>
        <span className="tx-row__pct">{tx.signalClarity}</span>
      </span>

      <span
        className="tx-row__status"
        style={{ color: tone, borderColor: `${tone}33` }}
      >
        {tx.channelStatus}
      </span>

      <span className="tx-row__enter" aria-hidden="true">
        →
      </span>
    </Link>
  );
}
