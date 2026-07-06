import { useMemo, useRef } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

/**
 * RegisterGlyph3D — wireframe 3D glyphs for the Cosmichronica registers
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Native React Three Fiber alternative to Spline. Each of the eight Registers
 * gets its own thin-wireframe object that tumbles slowly behind its memory
 * node, matching the project's reference aesthetic (gold wireframe + faint
 * cyan thread, transparent background).
 *
 * Built entirely in code → version-controlled, no external hosting, reuses the
 * three.js already in the bundle. One <Canvas> per glyph; mounted lazily and
 * only while in view (the caller gates this).
 *
 *   monolith     I    · Origin        — the seed/obelisk in a sphere (the Point)
 *   nested-torus II   · Recursion     — tori within tori (self-similarity)
 *   torus-knot   III  · Complexity    — knot at the edge of order
 *   icosahedron  IIII · Harmonics     — the standing-wave lattice (saturation)
 *   vesica       IIII'I  · Bridge     — two interpenetrating spheres (transducer)
 *   network      IIII'II · Becoming   — a node-lattice (the noosphere)
 *   dissolve     IIII'III · Return    — a fragmenting shell (translation)
 *   double-sphere IIII'IIII · Omega   — sphere + inner seed (double saturation)
 */

export type GlyphVariant =
  | "monolith"
  | "nested-torus"
  | "torus-knot"
  | "icosahedron"
  | "vesica"
  | "network"
  | "dissolve"
  | "double-sphere";

interface RegisterGlyph3DProps {
  variant?: GlyphVariant;
  accent?: string;
  thread?: string;
  reducedMotion?: boolean;
  /** When true, the render loop idles (off-screen). Canvas stays mounted. */
  paused?: boolean;
}

// ── Shared helpers ────────────────────────────────────────────────────────────

/** A thin wireframe from any geometry. */
function Wire({
  geometry,
  color,
  opacity,
}: {
  geometry: THREE.BufferGeometry;
  color: string;
  opacity: number;
}) {
  const wire = useMemo(
    () => new THREE.WireframeGeometry(geometry),
    [geometry]
  );
  return (
    <lineSegments geometry={wire}>
      <lineBasicMaterial
        color={color}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </lineSegments>
  );
}

/** Two faint counter-rotating halo rings shared by every glyph. */
function HaloRings({
  accent,
  thread,
  refs,
}: {
  accent: string;
  thread: string;
  refs: [React.RefObject<THREE.Mesh>, React.RefObject<THREE.Mesh>];
}) {
  return (
    <>
      <mesh ref={refs[0]} rotation={[1.4, 0, 0]}>
        <torusGeometry args={[2.0, 0.004, 8, 120]} />
        <meshBasicMaterial color={accent} transparent opacity={0.2} depthWrite={false} />
      </mesh>
      <mesh ref={refs[1]} rotation={[1.0, 0.5, 0]}>
        <torusGeometry args={[2.35, 0.004, 8, 120]} />
        <meshBasicMaterial color={thread} transparent opacity={0.12} depthWrite={false} />
      </mesh>
    </>
  );
}

// ── The body (geometry chosen by variant) ─────────────────────────────────────

function GlyphBody({
  variant,
  accent,
  thread,
  reducedMotion,
}: {
  variant: GlyphVariant;
  accent: string;
  thread: string;
  reducedMotion: boolean;
}) {
  const group = useRef<THREE.Group>(null!);
  const inner = useRef<THREE.Group>(null!);
  const ringA = useRef<THREE.Mesh>(null!);
  const ringB = useRef<THREE.Mesh>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;

    if (reducedMotion) {
      if (group.current) {
        group.current.rotation.set(0.5, 0.8, 0);
        group.current.scale.setScalar(1);
      }
      return;
    }

    if (group.current) {
      group.current.rotation.y = t * 0.12;
      group.current.rotation.x = Math.sin(t * 0.18) * 0.3 + 0.32;
      group.current.scale.setScalar(1 + Math.sin(t * 0.4) * 0.02);
    }
    // Inner element gets its own counter-motion for depth.
    if (inner.current) {
      inner.current.rotation.y = -t * 0.22;
      inner.current.rotation.z = t * 0.1;
    }
    if (ringA.current) ringA.current.rotation.z = t * 0.22;
    if (ringB.current) ringB.current.rotation.z = -t * 0.16;
  });

  // Build the variant geometry once.
  const geo = useMemo(() => buildGeometry(variant), [variant]);

  return (
    <group ref={group}>
      {/* Primary wireframe */}
      <Wire geometry={geo.primary} color={accent} opacity={0.5} />

      {/* Inner / secondary element (per variant) */}
      {geo.inner && (
        <group ref={inner}>
          <Wire geometry={geo.inner} color={accent} opacity={0.2} />
        </group>
      )}

      {/* Luminous core */}
      <mesh>
        <sphereGeometry args={[geo.coreRadius, 16, 16]} />
        <meshBasicMaterial color={thread} transparent opacity={0.9} />
      </mesh>

      <HaloRings accent={accent} thread={thread} refs={[ringA, ringB]} />
    </group>
  );
}

// ── Geometry factory ──────────────────────────────────────────────────────────

function buildGeometry(variant: GlyphVariant): {
  primary: THREE.BufferGeometry;
  inner?: THREE.BufferGeometry;
  coreRadius: number;
} {
  switch (variant) {
    case "monolith": {
      // The Point — a tall seed/obelisk inside a sphere (Origin / the Void).
      const primary = new THREE.CylinderGeometry(0.001, 0.42, 2.6, 4, 6);
      const inner = new THREE.SphereGeometry(1.15, 10, 8);
      return { primary, inner, coreRadius: 0.09 };
    }
    case "nested-torus": {
      // Recursion — a torus, with a smaller torus nested inside.
      const primary = new THREE.TorusGeometry(1.3, 0.34, 12, 60);
      const inner = new THREE.TorusGeometry(0.7, 0.18, 10, 40);
      return { primary, inner, coreRadius: 0.07 };
    }
    case "torus-knot": {
      // Complexification — a (2,3) torus-knot at the edge of order.
      const primary = new THREE.TorusKnotGeometry(1.25, 0.42, 140, 18, 2, 3);
      const inner = new THREE.TorusKnotGeometry(1.25, 0.42, 80, 8, 2, 3);
      return { primary, inner, coreRadius: 0.07 };
    }
    case "icosahedron": {
      // Harmonics — a saturated geodesic lattice (standing waves).
      const primary = new THREE.IcosahedronGeometry(1.4, 1);
      const inner = new THREE.IcosahedronGeometry(0.8, 1);
      return { primary, inner, coreRadius: 0.08 };
    }
    case "vesica": {
      // The Bridge — two interpenetrating spheres (the transducer).
      const a = new THREE.SphereGeometry(1.1, 14, 10);
      a.translate(-0.45, 0, 0);
      const b = new THREE.SphereGeometry(1.1, 14, 10);
      b.translate(0.45, 0, 0);
      // Merge by stuffing both into one buffer via groups isn't needed —
      // render one as primary, one as inner counter-rotating.
      return { primary: a, inner: b, coreRadius: 0.08 };
    }
    case "network": {
      // Becoming — a faceted node-lattice (the noosphere).
      const primary = new THREE.DodecahedronGeometry(1.45, 0);
      const inner = new THREE.IcosahedronGeometry(0.95, 0);
      return { primary, inner, coreRadius: 0.07 };
    }
    case "dissolve": {
      // Void Return — an octahedral shell breaking outward (translation).
      const primary = new THREE.OctahedronGeometry(1.5, 2);
      const inner = new THREE.OctahedronGeometry(0.6, 0);
      return { primary, inner, coreRadius: 0.06 };
    }
    case "double-sphere":
    default: {
      // Omega — a sphere enclosing an inner seed-sphere (double saturation).
      const primary = new THREE.SphereGeometry(1.5, 24, 16);
      const inner = new THREE.SphereGeometry(0.55, 16, 12);
      return { primary, inner, coreRadius: 0.12 };
    }
  }
}

// ── Canvas wrapper ────────────────────────────────────────────────────────────

export default function RegisterGlyph3D({
  variant = "torus-knot",
  accent = "#bda36b",
  thread = "#5fd0d8",
  reducedMotion = false,
  paused = false,
}: RegisterGlyph3DProps) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 0, 9.6], fov: 42 }}
      style={{ background: "transparent", width: "100%", height: "100%" }}
      gl={{ alpha: true, antialias: true, preserveDrawingBuffer: false }}
      frameloop={reducedMotion || paused ? "demand" : "always"}
    >
      <GlyphBody
        variant={variant}
        accent={accent}
        thread={thread}
        reducedMotion={reducedMotion}
      />
    </Canvas>
  );
}
