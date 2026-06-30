import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";

/**
 * SpiralOfTime — the cosmic helix spine of the Cosmichronica.
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Loads the optimized DNA-helix GLB (Draco + GPU-instanced) and treats it as the
 * "Spiral of Time": it rotates as the user descends, base-pairs ignite at each of
 * the 8 Register zones, and the camera can swing to a perfect top-down view when
 * a chapter opens (helix reads as a circle + vortex).
 *
 * Performance: the model is 2 GPU-instanced batches (~2 draw calls). Per-instance
 * brightness is driven via InstancedMesh.instanceColor (no postFX, no per-object
 * cost). Render loop pauses via frameloop when reduced-motion is requested.
 *
 * Behaviour is driven entirely by props — the parent owns scroll + interaction:
 *   - progress:        0→1 descent (rotates the helix, advances the lit front)
 *   - activeRegister:  0–7, the register currently at screen-center (pulses)
 *   - topDown:         when true, camera eases to straight-overhead
 *   - reducedMotion:   holds a static pose, disables idle spin
 */

const MODEL_URL = "/models/spiral-of-time.glb";
const REGISTER_COUNT = 8;

// Per-register emissive palette (Origin → Omega), cold pre-light → radiant gold.
const REGISTER_COLORS = [
  "#cfe6ff", // I   Origin      — white/blue plasma
  "#9fc2ff", // II  Recursion   — deep blue / cyan
  "#bfefd6", // III Complexif.  — green / organic
  "#bffbf4", // IIII Harmonics  — cyan
  "#ffe0a8", // IIII'I Bridge   — gold / amber
  "#f6b05e", // IIII'II Becoming— amber
  "#e0b8ff", // IIII'III Return — violet
  "#fbf3df", // IIII'IIII Omega — radiant ivory-gold
];

// Dim "dormant" tone for not-yet-reached pairs.
const DORMANT = new THREE.Color("#1a150d");

interface SpiralState {
  progress: number;
  activeRegister: number;
  topDown: boolean;
  /** When set, the camera zooms INTO this register's segment on the helix
   *  (like clicking a DNA base pair). null = free descent. */
  focusRegister: number | null;
}

interface SpiralProps {
  /** Mutable state read each frame — avoids React re-renders on scroll. */
  stateRef: React.MutableRefObject<SpiralState>;
  reducedMotion?: boolean;
}

useGLTF.preload(MODEL_URL, "/draco/");

function HelixModel({ stateRef, reducedMotion }: SpiralProps) {
  const { scene } = useGLTF(MODEL_URL, "/draco/");
  const groupRef = useRef<THREE.Group>(null!);

  // Prepare a working clone: recenter + scale to a known size, collect the
  // instanced meshes, and compute each instance's register band from its Y.
  const { object, meshes } = useMemo(() => {
    const root = scene.clone(true);

    // Compute bounds of the helix and recenter so its axis is at origin.
    const box = new THREE.Box3().setFromObject(root);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    const height = size.y || 1;
    const scale = 5.4 / height; // normalize helix to ~5.4 units tall

    const meshes: {
      mesh: THREE.InstancedMesh;
      registers: number[]; // register band per instance
    }[] = [];

    root.traverse((child) => {
      const inst = child as THREE.InstancedMesh;
      if ((inst as THREE.InstancedMesh).isInstancedMesh) {
        // Give every instanced batch a fresh basic material so per-instance
        // colour reads directly (unlit, deploy-safe, no postFX needed).
        inst.material = new THREE.MeshBasicMaterial({
          color: 0xffffff,
          toneMapped: false,
          transparent: true,
          opacity: 0.96,
        });

        // Map each instance to a register band from its local Y position.
        const m = new THREE.Matrix4();
        const pos = new THREE.Vector3();
        const registers: number[] = [];
        const localMinY = box.min.y;
        for (let i = 0; i < inst.count; i++) {
          inst.getMatrixAt(i, m);
          pos.setFromMatrixPosition(m);
          const tFromTop = 1 - (pos.y - localMinY) / height; // 0 at top (Origin)
          const reg = Math.min(
            REGISTER_COUNT - 1,
            Math.max(0, Math.floor(tFromTop * REGISTER_COUNT))
          );
          registers.push(reg);
        }

        // Ensure an instanceColor buffer exists.
        if (!inst.instanceColor) {
          const colors = new Float32Array(inst.count * 3);
          inst.instanceColor = new THREE.InstancedBufferAttribute(colors, 3);
        }
        meshes.push({ mesh: inst, registers });
      }
    });

    // Recenter + scale via the wrapper transform (applied on the group below).
    root.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );
    root.scale.setScalar(scale);

    return { object: root, meshes };
  }, [scene]);

  // Smoothed values for buttery motion.
  const smooth = useRef({ progress: 0, active: 0, topDown: 0 });
  const tmpColor = useMemo(() => new THREE.Color(), []);

  const colorClock = useRef(0);

  useFrame((state, delta) => {
    const live = stateRef.current;
    const s = smooth.current;
    const k = reducedMotion ? 1 : Math.min(1, delta * 4);
    s.progress += (live.progress - s.progress) * k;
    s.active += (live.activeRegister - s.active) * k;

    if (groupRef.current) {
      const idle = reducedMotion ? 0 : state.clock.elapsedTime * 0.05;
      groupRef.current.rotation.y = idle + s.progress * Math.PI * 3.2;
    }

    // Strong active-segment lighting: the rung that "owns" the current register
    // becomes dramatically brighter (almost white-hot) so it visually feeds the frame.
    colorClock.current += delta;
    if (colorClock.current < 0.066) return;
    colorClock.current = 0;

    const reachedFront = s.progress * REGISTER_COUNT;
    const activeReg = Math.round(s.active);

    for (const { mesh, registers } of meshes) {
      if (!mesh.instanceColor) continue;
      for (let i = 0; i < mesh.count; i++) {
        const reg = registers[i];
        if (reg <= reachedFront) {
          if (activeReg === reg) {
            // Hot bloom for the responsible segment
            tmpColor.set(REGISTER_COLORS[reg]).multiplyScalar(2.9);
            tmpColor.lerp(new THREE.Color("#ffffff"), 0.38);
          } else {
            tmpColor.set(REGISTER_COLORS[reg]).multiplyScalar(0.92);
          }
        } else {
          tmpColor.copy(DORMANT);
        }
        mesh.setColorAt(i, tmpColor);
      }
      mesh.instanceColor.needsUpdate = true;
    }
  });

  return (
    <group ref={groupRef}>
      <primitive object={object} />
    </group>
  );
}

/** Cinematic camera with three modes:
 *  - descent: follows the traveler down the helix, gentle zoom at each register
 *  - focus:   when focusRegister is set, zooms INTO that register's segment
 *             (like clicking a DNA base pair → camera flies to it, holds close)
 *  - topDown: legacy straight-overhead (kept for compatibility) */
function SpiralCamera({ stateRef }: { stateRef: React.MutableRefObject<SpiralState> }) {
  const { camera } = useThree();
  const t = useRef(0);
  const fz = useRef(0); // focus blend 0→1
  const camY = useRef(2.4);
  const lookY = useRef(2.4);
  const descentPos = useMemo(() => new THREE.Vector3(), []);
  const topPos = useMemo(() => new THREE.Vector3(0, 6.8, 0.001), []);
  const focusPos = useMemo(() => new THREE.Vector3(), []);
  const blended = useMemo(() => new THREE.Vector3(), []);
  const HALF = 2.7;

  // Center Y of a register band on the normalized helix.
  const regCenterY = (reg: number) =>
    HALF - (reg + 0.5) * ((HALF * 2) / REGISTER_COUNT);

  useFrame((state, delta) => {
    const live = stateRef.current;
    const k = Math.min(1, delta * 3);
    const focusing = live.focusRegister !== null;

    t.current += ((live.topDown ? 1 : 0) - t.current) * k;
    fz.current += ((focusing ? 1 : 0) - fz.current) * Math.min(1, delta * 2.6);
    const e = t.current; // 0 = descent, 1 = top-down

    // ── Descent target (follows the traveler) ──────────────────────────────
    const targetLookY = HALF - live.progress * (HALF * 2);
    lookY.current += (targetLookY - lookY.current) * Math.min(1, delta * 5);
    const targetCamY = targetLookY + 1.0;
    camY.current += (targetCamY - camY.current) * Math.min(1, delta * 5);

    const beat = live.progress * REGISTER_COUNT;
    const frac = beat - Math.floor(beat);
    const arrival = 1 - Math.min(1, Math.abs(frac - 0.5) / 0.5);
    const radius = 6.9 - arrival * 1.7;
    const orbit = state.clock.elapsedTime * 0.04;
    descentPos.set(Math.sin(orbit) * 0.6 + 2.0, camY.current, radius);

    // Blend descent ↔ top-down for the non-focused base position.
    blended.lerpVectors(descentPos, topPos, e);
    let lookTY = lookY.current * (1 - e);

    // ── Focus target (zoom INTO the chosen register's segment) ─────────────
    if (live.focusRegister !== null || fz.current > 0.001) {
      const reg = live.focusRegister ?? live.activeRegister;
      const ry = regCenterY(reg);
      // Pull in close and slightly to the front-side, looking right at the rung.
      focusPos.set(0.2, ry + 0.25, 3.0);
      blended.lerp(focusPos, fz.current);
      lookTY = lookTY * (1 - fz.current) + ry * fz.current;
    }

    camera.position.copy(blended);
    camera.lookAt(0, lookTY, 0);
  });

  return null;
}

/** The luminous traveler — a bead descending the helix core as you scroll. */
function TravelerDot({ stateRef }: { stateRef: React.MutableRefObject<SpiralState> }) {
  const groupRef = useRef<THREE.Group>(null!);
  const coreRef = useRef<THREE.Mesh>(null!);
  const HALF = 2.7; // helix is normalized to 5.4 tall → top +2.7, bottom -2.7

  useFrame((state) => {
    const live = stateRef.current;
    if (groupRef.current) {
      // Descend the central axis from top (Origin) to bottom (Omega).
      groupRef.current.position.y = HALF - live.progress * (HALF * 2);
    }
    if (coreRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.12;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group ref={groupRef}>
      {/* bright core */}
      <mesh ref={coreRef}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshBasicMaterial color="#fff6e2" toneMapped={false} />
      </mesh>
      {/* soft halo */}
      <mesh>
        <sphereGeometry args={[0.17, 16, 16]} />
        <meshBasicMaterial
          color="#f6b05e"
          toneMapped={false}
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default function SpiralOfTime(props: SpiralProps) {
  return (
    <Canvas
      dpr={[1, props.reducedMotion ? 1 : 1.6]}
      frameloop={props.reducedMotion ? "demand" : "always"}
      camera={{ fov: 38, near: 0.1, far: 100, position: [2.4, 1.6, 6.6] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      style={{ background: "transparent" }}
    >
      <fog attach="fog" args={["#08070c", 7, 16]} />
      <ambientLight intensity={0.4} />
      <HelixModel {...props} />
      <TravelerDot stateRef={props.stateRef} />
      <SpiralCamera stateRef={props.stateRef} />
    </Canvas>
  );
}
