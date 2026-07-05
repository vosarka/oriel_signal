import { CENTERS, CENTER_COLORS, CENTER_SYMBOL } from "./CodonWheel";

export interface CenterGridProps {
  activeCenter: string | null;
  onCenterSelect: (name: string | null) => void;
}

// Compact vertical sidebar — sits to the left of the wheel, one center per row.
// Each row carries the same sigil the wheel draws for that Center.
export function CenterGrid({ activeCenter, onCenterSelect }: CenterGridProps) {
  return (
    <div className="cz-center-sidebar">
      <p className="cz-legend-header">THE 8 CENTERS</p>
      <div className="cz-center-sidebar-list">
        {CENTERS.map((center) => {
          const isActive = activeCenter === center.name;
          const color = CENTER_COLORS[center.name];

          return (
            <div
              key={center.name}
              onClick={() => onCenterSelect(isActive ? null : center.name)}
              className={`cz-center-card ${isActive ? "is-active" : ""}`}
              style={{
                background: isActive ? `${color}18` : "rgba(20, 17, 12, 0.35)",
                borderLeft: `2px solid ${isActive ? color : `${color}55`}`,
              }}
            >
              <span className="cz-center-card-header">
                <span
                  aria-hidden="true"
                  style={{
                    display: "inline-block",
                    width: 16,
                    height: 16,
                    flexShrink: 0,
                    background: color,
                    opacity: isActive ? 1 : 0.85,
                    WebkitMaskImage: `url(/9-centers/${CENTER_SYMBOL[center.name]}.png)`,
                    maskImage: `url(/9-centers/${CENTER_SYMBOL[center.name]}.png)`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                  }}
                />
                <span className="cz-center-card-name">{center.name}</span>
              </span>
              <span className="cz-center-card-sub">{center.desc}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
