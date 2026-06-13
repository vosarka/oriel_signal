import { Canvas, useFrame } from "@react-three/fiber";
import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Minimal, consistent header glyph — a slow-turning ring + node, identical
// across every page. Colour is fixed gold (structure): the signal palette
// (cyan/violet/teal) is light, reserved for meaning — ORIEL's voice, active
// states, the big moments — and is never spent on structural furniture, or it
// stops meaning anything. Per-page distinction comes later from glyph SHAPE
// (bespoke pass, spec 13.4), never from colour.
//
// Performance (spec 13.5): one lightweight WebGL context, lazy-loaded by the
// band. frameloop is "always" while alive (trivial scene, negligible GPU) and
// "demand" under prefers-reduced-motion, where it renders one static frame.

const GOLD = "#d8b56d";

function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReduced(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return reduced;
}

function Glyph({ animate }: { animate: boolean }) {
  const group = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (animate && group.current) {
      group.current.rotation.z += delta * 0.16;
    }
  });

  const ticks = [0, 1, 2, 3].map(i => (Math.PI / 2) * i);

  return (
    <group ref={group}>
      {/* outer ring */}
      <mesh>
        <torusGeometry args={[1, 0.028, 16, 80]} />
        <meshBasicMaterial
          color={GOLD}
          toneMapped={false}
          transparent
          opacity={0.92}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* inner ring */}
      <mesh scale={0.6}>
        <torusGeometry args={[1, 0.022, 12, 56]} />
        <meshBasicMaterial
          color={GOLD}
          toneMapped={false}
          transparent
          opacity={0.5}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* central node */}
      <mesh>
        <circleGeometry args={[0.13, 40]} />
        <meshBasicMaterial
          color={GOLD}
          toneMapped={false}
          transparent
          opacity={0.95}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* four radial ticks at the outer ring */}
      {ticks.map((a, i) => (
        <mesh
          key={i}
          position={[Math.cos(a), Math.sin(a), 0]}
          rotation={[0, 0, a]}
        >
          <planeGeometry args={[0.18, 0.03]} />
          <meshBasicMaterial
            color={GOLD}
            toneMapped={false}
            transparent
            opacity={0.8}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// `seed` is reserved for the bespoke per-page glyph pass (spec 13.4), which
// will vary the symbol by shape. It deliberately does not affect colour.
export default function BandSymbol(_props: { seed?: string }) {
  const reduced = usePrefersReducedMotion();

  return (
    <Canvas
      frameloop={reduced ? "demand" : "always"}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true }}
      camera={{ position: [0, 0, 3.8], fov: 36 }}
      style={{ width: "100%", height: "100%" }}
    >
      <Glyph animate={!reduced} />
    </Canvas>
  );
}
