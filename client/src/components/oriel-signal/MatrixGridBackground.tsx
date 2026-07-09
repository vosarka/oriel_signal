import "./matrix-grid-background.css";

type MatrixGridBackgroundProps = {
  className?: string;
};

/**
 * Perspective matrix grid (adapted from wheatup/CodePen KKZRjaZ).
 * Oriel palette: gold lattice on void, cyan glow accent.
 */
export default function MatrixGridBackground({
  className = "",
}: MatrixGridBackgroundProps) {
  return (
    <div
      className={`matrix-grid-bg ${className}`.trim()}
      aria-hidden="true"
    >
      <div className="matrix-grid-bg__container">
        <div className="matrix-grid-bg__plane">
          <div className="matrix-grid-bg__layer matrix-grid-bg__layer--grid" />
          <div className="matrix-grid-bg__layer matrix-grid-bg__layer--glow" />
        </div>
        <div className="matrix-grid-bg__plane matrix-grid-bg__plane--top">
          <div className="matrix-grid-bg__layer matrix-grid-bg__layer--grid" />
          <div className="matrix-grid-bg__layer matrix-grid-bg__layer--glow" />
        </div>
      </div>
      <div className="matrix-grid-bg__vignette" />
    </div>
  );
}