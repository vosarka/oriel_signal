type CoronaSegment = Readonly<{
  index: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  cardinal: boolean;
}>;

export function createCoronaSegments(count = 64): CoronaSegment[] {
  return Array.from({ length: count }, (_, index) => {
    const angle = -Math.PI / 2 + (index / count) * Math.PI * 2;
    const cardinal = index % (count / 4) === 0;
    const innerRadius = cardinal ? 146 : 151;
    const outerRadius = cardinal ? 177 : 168;

    return {
      index,
      x1: 200 + Math.cos(angle) * innerRadius,
      y1: 200 + Math.sin(angle) * innerRadius,
      x2: 200 + Math.cos(angle) * outerRadius,
      y2: 200 + Math.sin(angle) * outerRadius,
      cardinal,
    };
  });
}

const CORONA_SEGMENTS = createCoronaSegments();

export function SampleArchiveSeal({
  archiveId,
  symbol,
}: {
  archiveId: string;
  symbol: string;
}) {
  return (
    <svg
      className="tetradic-seal"
      viewBox="0 0 400 400"
      role="img"
      aria-label={`Illustrative ORIEL archive seal ${archiveId}`}
    >
      <defs>
        <filter
          id="tetradic-seal-ink"
          x="-5%"
          y="-5%"
          width="110%"
          height="110%"
        >
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.012"
            numOctaves="1"
            seed="19"
            result="grain"
          />
          <feDisplacementMap in="SourceGraphic" in2="grain" scale="0.45" />
        </filter>
        <radialGradient id="tetradic-seal-field" cx="50%" cy="45%" r="60%">
          <stop offset="0" stopColor="#29251f" />
          <stop offset="0.7" stopColor="#100f0d" />
          <stop offset="1" stopColor="#080807" />
        </radialGradient>
      </defs>

      <circle cx="200" cy="200" r="188" fill="url(#tetradic-seal-field)" />
      <g
        className="tetradic-seal__linework"
        fill="none"
        filter="url(#tetradic-seal-ink)"
      >
        <circle cx="200" cy="200" r="180" />
        <circle cx="200" cy="200" r="141" strokeDasharray="2 7" />
        <circle cx="200" cy="200" r="118" />
        <circle cx="200" cy="200" r="86" strokeDasharray="1 5" />
        <path d="M82 200h236M200 82v236" opacity="0.22" />
        <path d="M116 116l168 168M284 116 116 284" opacity="0.12" />
        {CORONA_SEGMENTS.map(segment => (
          <line
            key={segment.index}
            x1={segment.x1}
            y1={segment.y1}
            x2={segment.x2}
            y2={segment.y2}
            className={segment.cardinal ? "is-cardinal" : undefined}
          />
        ))}
      </g>

      {[0, 90, 180, 270].map(angle => (
        <g key={angle} transform={`rotate(${angle} 200 200)`}>
          <path
            className="tetradic-seal__calibration"
            d="M200 10l7 9-7 9-7-9z"
          />
        </g>
      ))}

      <image
        href={symbol}
        x="136"
        y="130"
        width="128"
        height="128"
        preserveAspectRatio="xMidYMid meet"
        className="tetradic-seal__symbol"
      />
      <text
        x="200"
        y="116"
        textAnchor="middle"
        className="tetradic-seal__oriel"
      >
        ORIEL / Ψ
      </text>
      <text
        x="200"
        y="276"
        textAnchor="middle"
        className="tetradic-seal__sample"
      >
        SAMPLE
      </text>
      <text x="200" y="302" textAnchor="middle" className="tetradic-seal__id">
        {archiveId}
      </text>
      <text
        x="200"
        y="332"
        textAnchor="middle"
        className="tetradic-seal__state"
      >
        ILLUSTRATIVE · NOT VERIFIED
      </text>
    </svg>
  );
}
