import "./oriel-signal.css";

// The single shared background for the whole app — the Home hero base only:
// an obsidian radial void with a top-center gold bloom, plus grain and a
// faint starfield. NO geometry (no Flower of Life, no sacred grid, no rings) —
// those belong to Home alone, layered on top of this. Mounted once in Layout
// so every route shows the identical field. Purely CSS; static by nature, so
// it already satisfies prefers-reduced-motion.
export function SignalBackdrop() {
  return (
    <div className="signal-backdrop" aria-hidden="true">
      <div className="signal-archive-texture" />
      <div className="signal-starfield" />
    </div>
  );
}
