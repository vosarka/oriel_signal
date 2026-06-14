// THE TRAJECTORY — coherence over time (spec §5). A refined gold line/area
// over the void, not a generic chart widget. Driven by the user's real
// Carrierlock history (coherenceScore by createdAt). The latest point is
// accented by its coherence band — the one place the signal palette (cyan =
// Resonance) is spent, because that IS meaning.

export type TrajectoryPoint = {
  coherenceScore: number;
  createdAt: string | number | Date;
};

const GOLD = "#d8b56d";
const DIM = "#6a665e";

export function coherenceBand(score: number): { label: string; color: string } {
  if (score >= 80) return { label: "RESONANCE", color: "#00f0ff" };
  if (score >= 40) return { label: "FLUX", color: GOLD };
  return { label: "ENTROPY", color: "#ff6b6b" };
}

export default function CoherenceTrajectory({
  points,
}: {
  points: TrajectoryPoint[];
}) {
  const data = [...points].reverse(); // history arrives newest-first

  // One reading is a single point, not a graph: say so rather than draw a
  // broken line (spec §5 graceful states).
  if (data.length < 2) {
    return (
      <div
        style={{
          fontFamily: "var(--font-ritual)",
          fontSize: 10,
          letterSpacing: "0.14em",
          color: DIM,
          lineHeight: 1.9,
          padding: "18px 0",
          textAlign: "center",
        }}
      >
        YOUR TRAJECTORY BEGINS WITH YOUR NEXT CONTACT.
      </div>
    );
  }

  const W = 560;
  const H = 130;
  const padX = 10;
  const padTop = 12;
  const padBottom = 10;
  const plotW = W - padX * 2;
  const plotH = H - padTop - padBottom;

  const x = (i: number) => padX + (i / (data.length - 1)) * plotW;
  const y = (s: number) =>
    padTop + (1 - Math.max(0, Math.min(100, s)) / 100) * plotH;

  const linePath = data
    .map(
      (d, i) =>
        `${i === 0 ? "M" : "L"} ${x(i).toFixed(1)} ${y(d.coherenceScore).toFixed(1)}`
    )
    .join(" ");
  const areaPath =
    `${linePath} L ${x(data.length - 1).toFixed(1)} ${(padTop + plotH).toFixed(1)} ` +
    `L ${x(0).toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`;

  const lastIndex = data.length - 1;
  const latest = data[lastIndex].coherenceScore;
  const latestBand = coherenceBand(latest);

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      width="100%"
      preserveAspectRatio="none"
      style={{ display: "block", height: 130 }}
      aria-label="Coherence over time"
    >
      <defs>
        <linearGradient id="coh-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={GOLD} stopOpacity={0.22} />
          <stop offset="100%" stopColor={GOLD} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* band thresholds at 40 (Flux) and 80 (Resonance) */}
      {[40, 80].map(v => (
        <line
          key={v}
          x1={padX}
          x2={W - padX}
          y1={y(v)}
          y2={y(v)}
          stroke={DIM}
          strokeOpacity={0.18}
          strokeDasharray="2 4"
        />
      ))}

      <path d={areaPath} fill="url(#coh-fill)" />
      <path
        d={linePath}
        fill="none"
        stroke={GOLD}
        strokeWidth={1.5}
        strokeOpacity={0.85}
        vectorEffect="non-scaling-stroke"
      />

      {data.map((d, i) => (
        <circle
          key={i}
          cx={x(i)}
          cy={y(d.coherenceScore)}
          r={i === lastIndex ? 3.4 : 1.8}
          fill={i === lastIndex ? latestBand.color : GOLD}
          opacity={i === lastIndex ? 1 : 0.5}
        />
      ))}
    </svg>
  );
}
