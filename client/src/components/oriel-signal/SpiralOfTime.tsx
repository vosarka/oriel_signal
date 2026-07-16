import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import * as THREE from "three";
import {
  buildParticleAppearance,
  buildForms,
  buildGenesisHelix,
  FORM_PARTICLE_COUNT,
  dwellForm,
  phaseCameraArc,
} from "@/lib/cosmichronica-forms";

// PROTOTYPE FLAG — when true, the Spiral is a point cloud that MORPHS through the
// eight Register forms (form #0 = the DNA helix, morphing away and back). When
// false, the original GLB instanced helix + descent camera render instead.
const MORPH_SPIRAL = true;

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

// Soft radial sprite so each morph particle glows as a mote (additive), not a
// hard square. Built once in memory — no external asset.
function makeGlowTexture(): THREE.Texture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, "rgba(255,255,255,1)");
  g.addColorStop(0.25, "rgba(255,255,255,0.85)");
  g.addColorStop(0.55, "rgba(255,255,255,0.25)");
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

interface SpiralState {
  progress: number;
  activeRegister: number;
  topDown: boolean;
  /** When set, the camera zooms INTO this register's segment on the helix
   *  (like clicking a DNA base pair). null = free descent. */
  focusRegister: number | null;
  /** Dwelled form index (0..7) written by the morph each frame so the camera can
   *  read the EXACT same value — keeps the fly-through and the dots in lockstep. */
  formValue?: number;
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

// ════════════════════════════════════════════════════════════════════════════
// MorphSpiral — the flagged prototype: one glowing point cloud that lerps through
// the eight Register forms. Form #0 is the DNA helix; scrolling morphs it away
// through the phase shapes and back. Colors cross-fade through REGISTER_COLORS.
// ════════════════════════════════════════════════════════════════════════════
function MorphSpiral({ stateRef, reducedMotion }: SpiralProps) {
  const pointsRef = useRef<THREE.Points>(null!);
  const eased = useRef(0);

  const forms = useMemo(() => buildForms(FORM_PARTICLE_COUNT), []);
  const helix = useMemo(() => buildGenesisHelix(FORM_PARTICLE_COUNT), []);
  const initial = useMemo(() => helix.slice(), [helix]); // open on the spiral
  const appearance = useMemo(
    () => buildParticleAppearance(FORM_PARTICLE_COUNT),
    []
  );
  const colors = useMemo(
    () => REGISTER_COLORS.map(c => new THREE.Color(c)),
    []
  );
  const glow = useMemo(() => makeGlowTexture(), []);
  const tmp = useMemo(() => new THREE.Color(), []);
  const particleMaterial = useMemo(() => {
    const material = new THREE.PointsMaterial({
      map: glow,
      color: colors[0],
      size: 0.05,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    });

    material.onBeforeCompile = shader => {
      shader.vertexShader = shader.vertexShader
        .replace("uniform float size;", "attribute float particleSize;")
        .replace("gl_PointSize = size;", "gl_PointSize = particleSize;");
    };
    material.customProgramCacheKey = () => "cosmichronica-particle-size-v1";
    return material;
  }, [colors, glow]);

  useEffect(
    () => () => {
      particleMaterial.dispose();
      glow.dispose();
    },
    [glow, particleMaterial]
  );

  useFrame((state, delta) => {
    if (!pointsRef.current) return;
    const live = stateRef.current;
    const last = REGISTER_COUNT - 1;
    const raw = Math.max(0, Math.min(live.progress * REGISTER_COUNT, last));
    const target = dwellForm(raw, last); // rest on each form, then transition
    // Internal easing → the "liquid" follow behind the scrubbed scroll.
    const k = reducedMotion ? 1 : Math.min(1, delta * 3.2);
    eased.current += (target - eased.current) * k;

    const p = eased.current;
    live.formValue = p; // publish for the camera — perfect fly-through sync
    const a = Math.floor(p);
    const b = Math.min(a + 1, last);
    const t = p - a;

    // Genesis: at the very top the cloud is the SPIRAL (helix); it collapses into
    // the first point over the first sliver of scroll (driven by raw progress, so
    // it happens DURING Phase I's rest — not during the fly-through). g: 1 = helix.
    const gr = 1 - Math.min(1, Math.max(0, (live.progress - 0.01) / 0.04));
    const g = gr * gr * (3 - 2 * gr);

    const attr = pointsRef.current.geometry.attributes
      .position as THREE.BufferAttribute;
    const arr = attr.array as Float32Array;
    const fa = forms[a];
    const fb = forms[b];
    for (let i = 0; i < arr.length; i++) {
      let v = fa[i] + (fb[i] - fa[i]) * t;
      if (g > 0.001) v += (helix[i] - v) * g;
      arr[i] = v;
    }
    attr.needsUpdate = true;

    tmp.copy(colors[a]).lerp(colors[b], t);
    particleMaterial.color.copy(tmp);

    // Fade the dots down while the camera is INSIDE the point (mid fly-through),
    // so streaming past them reads as a whoosh rather than a white-out.
    if (!reducedMotion && a === 0) {
      const inside = Math.max(0, 1 - Math.abs(p - 0.5) / 0.4);
      particleMaterial.opacity = 0.9 - inside * 0.55;
    } else {
      particleMaterial.opacity = 0.9;
    }

    // No group rotation through the reveal chain (0 Point → 1 Line → 2 Triangle):
    // those depend on exact orientation. A gentle spin eases in for later phases.
    if (!reducedMotion) {
      const spin = Math.max(0, Math.min(1, p - 2.2));
      pointsRef.current.rotation.y =
        Math.max(0, p - 2.2) * 0.35 +
        Math.sin(state.clock.elapsedTime * 0.05) * 0.05 * spin;
      pointsRef.current.rotation.x =
        Math.sin(state.clock.elapsedTime * 0.1) * 0.05 * spin;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[initial, 3]} />
        <bufferAttribute
          attach="attributes-particleSize"
          args={[appearance.sizes, 1]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[appearance.colors, 4]}
        />
      </bufferGeometry>
      <primitive object={particleMaterial} attach="material" />
    </points>
  );
}

// Per-form camera pose for phases 1..7 — azimuth (orbit), elevation (tilt),
// radius (zoom). Phase 0→1 is NOT here; it is the bespoke fly-through below.
//   1 Line     — side (+X): where the fly-through ends, the line seen from the side.
//   2 Triangle — overhead (+Y): the line (X-Z plane, edge-on) unfolds into a face.
// The rest are framed for character (mandala tilt-down, bridge low, vortex funnel…).
const CAM_POSES: { az: number; el: number; r: number }[] = [
  { az: 0.0, el: 0.05, r: 7.0 }, // 0 Point   — unused (fly-through special-cased)
  { az: 1.5708, el: 0.05, r: 6.2 }, // 1 Line  — side (+X)
  { az: 0.1, el: 1.4, r: 7.0 }, // 2 Triangle  — overhead
  { az: 0.0, el: 0.25, r: 7.4 }, // 3 Mandala  — tilt down over the rings
  { az: 0.0, el: -0.14, r: 6.7 }, // 4 Bridge  — low, looking up at the arch
  { az: 0.5, el: 0.32, r: 7.6 }, // 5 Vortex   — look down into the funnel
  { az: 0.25, el: 0.12, r: 8.4 }, // 6 Scatter — pull back, see the dispersal
  { az: 0.0, el: 0.05, r: 5.6 }, // 7 Omega    — push in on the double point
];

// The Point→Line fly-through, keyframed by the segment fraction f (0→1): frame the
// point, dive in through the dots, stream out the far side, then arc around and
// turn back — revealing that the tunnel of dots was a line all along.
const FLY: { f: number; p: [number, number, number]; l: [number, number, number] }[] = [
  { f: 0.0, p: [0, 0.25, 7.0], l: [0, 0, 0] }, // frame the point / collapsing spiral
  { f: 0.26, p: [0, 0.06, 1.3], l: [0, 0, -3] }, // zoom in, entering the dots
  { f: 0.5, p: [0, 0, -1.6], l: [0, 0, -6] }, // inside, streaming through
  { f: 0.64, p: [0, 0, -4.4], l: [0, 0, -7.5] }, // out the far side
  { f: 0.82, p: [4.6, 0.28, -3.0], l: [0, 0, -1.2] }, // arc out, begin turning back
  { f: 1.0, p: [6.19, 0.31, 0.02], l: [0, 0, 0] }, // side view — the LINE revealed
];

function sampleFly(f: number, outP: THREE.Vector3, outL: THREE.Vector3) {
  let i = 0;
  while (i < FLY.length - 2 && f > FLY[i + 1].f) i++;
  const A = FLY[i];
  const B = FLY[i + 1];
  const raw = (f - A.f) / (B.f - A.f || 1);
  const u = Math.max(0, Math.min(1, raw));
  const s = u * u * (3 - 2 * u); // smoothstep between keyframes
  outP.set(
    A.p[0] + (B.p[0] - A.p[0]) * s,
    A.p[1] + (B.p[1] - A.p[1]) * s,
    A.p[2] + (B.p[2] - A.p[2]) * s
  );
  outL.set(
    A.l[0] + (B.l[0] - A.l[0]) * s,
    A.l[1] + (B.l[1] - A.l[1]) * s,
    A.l[2] + (B.l[2] - A.l[2]) * s
  );
}

/** Cinematic camera for MORPH mode. Phase 0→1 flies THROUGH the point (keyframed);
 *  every other phase orbits to a hand-tuned pose. Both feed one smoothed
 *  position/look-target so the hand-off is seamless. */
function MorphCamera({ stateRef }: { stateRef: React.MutableRefObject<SpiralState> }) {
  const { camera } = useThree();
  const pos = useRef(new THREE.Vector3(0, 0.25, 7));
  const look = useRef(new THREE.Vector3(0, 0, 0));
  const tP = useMemo(() => new THREE.Vector3(), []);
  const tL = useMemo(() => new THREE.Vector3(), []);

  useFrame((state, delta) => {
    const live = stateRef.current;
    const last = REGISTER_COUNT - 1;
    const d =
      live.formValue ??
      dwellForm(
        Math.max(0, Math.min(live.progress * REGISTER_COUNT, last)),
        last
      );
    const a = Math.floor(d);
    const b = Math.min(a + 1, last);
    const f = d - a;

    if (a === 0) {
      // Point → Line: the fly-through.
      sampleFly(f, tP, tL);
    } else {
      // Orbit to the phase's pose.
      const pa = CAM_POSES[a];
      const pb = CAM_POSES[b];
      const arc = phaseCameraArc(a, f);
      const nearest = Math.min(f, 1 - f);
      const arrival = 1 - Math.min(1, nearest / 0.5);
      const focus = live.focusRegister !== null || live.topDown ? 1 : 0;
      const sway = Math.sin(state.clock.elapsedTime * 0.16) * 0.04;
      const az = pa.az + (pb.az - pa.az) * f + arc.azimuth + sway;
      const el = pa.el + (pb.el - pa.el) * f + arc.elevation;
      const r =
        pa.r + (pb.r - pa.r) * f + arc.radius - arrival * 0.6 - focus * 1.2;
      const ce = Math.cos(el);
      tP.set(Math.sin(az) * ce * r, Math.sin(el) * r, Math.cos(az) * ce * r);
      tL.set(0, 0, 0);
    }

    const k = Math.min(1, delta * 3.0);
    pos.current.lerp(tP, k);
    look.current.lerp(tL, k);
    camera.position.copy(pos.current);
    camera.lookAt(look.current);
  });

  return null;
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
      {MORPH_SPIRAL ? (
        <>
          <MorphSpiral {...props} />
          <MorphCamera stateRef={props.stateRef} />
        </>
      ) : (
        <>
          <HelixModel {...props} />
          <TravelerDot stateRef={props.stateRef} />
          <SpiralCamera stateRef={props.stateRef} />
        </>
      )}
    </Canvas>
  );
}
