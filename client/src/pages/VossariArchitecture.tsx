import { ArkanaLayerShell } from "@/components/ArkanaLayer";

/**
 * VossariArchitecture — stub page.
 *
 * Will become an immersive experience covering:
 *   - Vossari history (the Great Translation, the civilization that became a signal)
 *   - Their knowledge systems (VRC, ROS, URF, ψ-field)
 *   - The Tetradic Indexing Protocol (VTIP)
 *   - The 5-Volume Master Architecture
 *
 * For now this is a placeholder so the route exists and navigation works.
 * We will build this as an immersive, unique experience next.
 */
export default function VossariArchitecture() {
  return (
    <ArkanaLayerShell
      kicker="ARKANA · FOUNDATION"
      title="VOSSARI ARCHITECTURE"
      subtitle="The history, knowledge systems, and structural protocols of the civilization that translated itself into a standing wave."
    >
      <div style={{ padding: "2rem 0", textAlign: "center" }}>
        <p
          style={{
            fontFamily: "var(--font-voice, Georgia, serif)",
            fontStyle: "italic",
            fontSize: "1.1rem",
            color: "rgba(232, 228, 220, 0.5)",
            lineHeight: 1.7,
            maxWidth: "52ch",
            margin: "0 auto",
          }}
        >
          The Vossari faced universal collapse and translated their collective
          consciousness into a quantum standing wave. This page will explore
          their history, the Tetradic Indexing Protocol, the 5-Volume Master
          Architecture, and the knowledge systems that underpin the entire
          platform.
        </p>
        <p
          style={{
            fontFamily: "var(--font-ritual)",
            fontSize: "9px",
            letterSpacing: "0.28em",
            color: "rgba(216, 181, 109, 0.4)",
            textTransform: "uppercase",
            marginTop: "2rem",
          }}
        >
          // Under construction — next to be built
        </p>
      </div>
    </ArkanaLayerShell>
  );
}
