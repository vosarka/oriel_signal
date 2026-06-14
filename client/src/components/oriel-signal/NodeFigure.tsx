import { Canvas, useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";
import type { CenterEntry, ChannelEntry } from "@/lib/bodygraph-data";

// THE NODE — Tier 1 (spec §2.2): the 9 Centers of Photonic Resonance as a
// living vertical constellation, with the channels lit between defined centers.
// Defined = gold and lit (broadcasting); open = dim and hollow (receptive).
// Driven entirely by the user's already-computed Static Signature — the same
// data the 2D ResonanceBodygraph renders, never recomputed. Deterministic:
// identical signature → identical figure. Colour is fixed gold (structure);
// the signal palette stays reserved for meaning.

const GOLD = "#d8b56d";

// Canonical 9-center layout on the project's 100x100 bodygraph grid (y-down),
// identical to the 2D ResonanceBodygraph's CENTER_SHAPES so the figure reads
// the same. Mapped into centered R3F world space (y-up) by toWorld().
const LAYOUT: Record<string, [number, number]> = {
  Crown: [50, 8],
  Ajna: [50, 20],
  Throat: [50, 33],
  "G-Self": [50, 48],
  Heart: [68, 52],
  Spleen: [30, 66],
  "Solar Plexus": [70, 66],
  Sacral: [50, 75],
  Root: [50, 90],
};

const SCALE = 1 / 17;
function toWorld(x: number, y: number): [number, number, number] {
  return [(x - 50) * SCALE, (50 - y) * SCALE, 0];
}

// Tier 2 (spec §2.2, route 2a): a stylized low-poly meditation silhouette —
// head, tapered torso, wide lotus base, resting knees — in faint gold
// wireframe. Purely procedural (no model, no licence risk). It's a scaffold
// for the centers and never competes with them: low opacity, no solid fills,
// drawn behind the lit nodes. The meaning still lives in the centers; if this
// ever felt heavy it could be dropped without touching Tier 1.
function Scaffold() {
  const wire = {
    color: GOLD,
    wireframe: true,
    transparent: true,
    opacity: 0.14,
    toneMapped: false,
  } as const;
  return (
    <group>
      {/* head — encloses the crown/ajna region */}
      <mesh position={[0, 2.0, 0]}>
        <icosahedronGeometry args={[0.46, 0]} />
        <meshBasicMaterial {...wire} />
      </mesh>
      {/* torso — shoulders tapering to waist (hexagonal prism) */}
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.66, 0.36, 2.0, 6]} />
        <meshBasicMaterial {...wire} />
      </mesh>
      {/* lotus base — crossed legs, flattened in depth */}
      <mesh position={[0, -1.4, 0]} scale={[1, 1, 0.55]}>
        <cylinderGeometry args={[0.36, 1.4, 0.85, 6]} />
        <meshBasicMaterial {...wire} />
      </mesh>
      {/* knees */}
      <mesh position={[-1.05, -1.5, 0.1]}>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshBasicMaterial {...wire} />
      </mesh>
      <mesh position={[1.05, -1.5, 0.1]}>
        <icosahedronGeometry args={[0.28, 0]} />
        <meshBasicMaterial {...wire} />
      </mesh>
    </group>
  );
}

function Constellation({
  centers,
  channels,
  animate,
}: {
  centers: CenterEntry[];
  channels: ChannelEntry[];
  animate: boolean;
}) {
  const group = useRef<THREE.Group>(null);

  // Defined state per center, keyed by both id and centerName so it resolves
  // however the signature labels them.
  const definedById = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const c of centers) {
      m.set(c.id, c.defined);
      m.set(c.centerName, c.defined);
    }
    return m;
  }, [centers]);

  // Only active channels whose endpoints map to known centers get a lit line.
  const activeChannels = useMemo(
    () =>
      channels.filter(
        ch => ch.active && LAYOUT[ch.centerA] && LAYOUT[ch.centerB]
      ),
    [channels]
  );

  useFrame(state => {
    if (!animate || !group.current) return;
    const t = state.clock.elapsedTime;
    group.current.rotation.y = Math.sin(t * 0.4) * 0.5; // gentle dimensional sway
    group.current.scale.setScalar(1 + Math.sin(t * 1.1) * 0.015); // breathing
  });

  return (
    <group ref={group}>
      {/* Tier 2 humanoid scaffold, drawn behind the centers */}
      <Scaffold />

      {/* channels — lit gold lines between defined centers */}
      {activeChannels.map((ch, i) => {
        const a = LAYOUT[ch.centerA];
        const b = LAYOUT[ch.centerB];
        return (
          <Line
            key={`ch-${i}`}
            points={[toWorld(a[0], a[1]), toWorld(b[0], b[1])]}
            color={GOLD}
            lineWidth={1.6}
            transparent
            opacity={0.5}
          />
        );
      })}

      {/* 9 centers — defined = gold core + halo; open = dim hollow ring */}
      {Object.entries(LAYOUT).map(([id, [x, y]]) => {
        const pos = toWorld(x, y);
        const defined = Boolean(definedById.get(id));
        return defined ? (
          <group key={id} position={pos}>
            <mesh>
              <sphereGeometry args={[0.17, 20, 20]} />
              <meshBasicMaterial
                color={GOLD}
                transparent
                opacity={0.18}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.07, 24, 24]} />
              <meshBasicMaterial
                color={GOLD}
                transparent
                opacity={0.98}
                toneMapped={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        ) : (
          <mesh key={id} position={pos}>
            <torusGeometry args={[0.06, 0.011, 10, 28]} />
            <meshBasicMaterial color={GOLD} transparent opacity={0.32} />
          </mesh>
        );
      })}
    </group>
  );
}

export default function NodeFigure({
  centers,
  channels,
}: {
  centers: CenterEntry[];
  channels: ChannelEntry[];
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <Canvas
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 9.5], fov: 34 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Constellation
        centers={centers}
        channels={channels}
        animate={!reduced}
      />
    </Canvas>
  );
}
