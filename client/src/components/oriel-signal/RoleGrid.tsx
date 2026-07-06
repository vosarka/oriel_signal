import { ROLES } from "./CodonWheel";

export interface RoleGridProps {
  activeRoleIdx: number | null;
  onRoleSelect: (idx: number | null) => void;
}

export function RoleGrid({ activeRoleIdx, onRoleSelect }: RoleGridProps) {
  return (
    <div className="cz-role-legend">
      <p className="cz-legend-header">THE 16 RESONANCE ROLES · 4 CODONS EACH</p>
      <div className="cz-legend-grid">
        {ROLES.map((role, idx) => {
          const isActive = activeRoleIdx === idx;
          const startCodonId = idx * 4 + 1;
          const endCodonId = (idx + 1) * 4;
          
          return (
            <div
              key={role.name}
              onClick={() => onRoleSelect(isActive ? null : idx)}
              className={`cz-legend-card ${isActive ? "is-active" : ""}`}
              style={{
                background: isActive ? "rgba(205, 161, 74, 0.08)" : "rgba(20, 17, 12, 0.35)",
                borderLeft: isActive ? "2px solid var(--gold2)" : "2px solid rgba(205, 161, 74, 0.16)",
              }}
            >
              <div className="cz-legend-card-header">
                <span className="cz-legend-card-name">{role.name}</span>
                <span className="cz-legend-card-range">
                  RC{String(startCodonId).padStart(2, "0")}–{String(endCodonId).padStart(2, "0")}
                </span>
              </div>
              <span className="cz-legend-card-sub">
                {role.roman} · {role.desc}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
