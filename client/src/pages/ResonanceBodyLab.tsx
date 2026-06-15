import ResonanceBody from "@/components/oriel-signal/ResonanceBody";

// Standalone review page for the Vossari Resonance Body (Phase 1). Full-bleed,
// no navbar/layout, not linked anywhere — just /resonance-body for review.
export default function ResonanceBodyLab() {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#08080c",
        overflow: "hidden",
      }}
    >
      <ResonanceBody />
    </div>
  );
}
