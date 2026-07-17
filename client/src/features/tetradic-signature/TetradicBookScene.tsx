import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";
import { gsap } from "gsap";
import * as THREE from "three";

import type { TetradicSceneState } from "./chapter-config";
import {
  BookChapterGeometry,
  CelestialChapterField,
} from "./TetradicChapterScenes";
import { TetradicSpread } from "./TetradicSpread";
import { TETRADIC_SIGNATURE_CONFIG } from "./tetradic-signature-config";

type SceneProps = Readonly<{
  compact: boolean;
  reducedMotion: boolean;
  sceneStateRef: React.MutableRefObject<TetradicSceneState>;
}>;

const BOOK = TETRADIC_SIGNATURE_CONFIG.animation.book;
const BOOK_WIDTH = BOOK.width;
const BOOK_DEPTH = BOOK.depth;

function laterCameraOffset(number: number, progress: number, compact: boolean) {
  const amplitude = compact ? 0.48 : 1;

  switch (number) {
    case 4:
      return { x: 0, y: 0.08 * progress, z: 0.5 * (1 - progress) };
    case 5:
      return {
        x: 0.08 * amplitude,
        y: 0.36 - progress * 0.68,
        z: 0.2 - progress * 0.25,
      };
    case 6:
      return {
        x: Math.sin(progress * Math.PI) * 0.58 * amplitude,
        y: Math.sin(progress * Math.PI * 2) * 0.12,
        z: -Math.sin(progress * Math.PI) * 0.16,
      };
    case 7:
      return { x: (-0.42 + progress * 0.84) * amplitude, y: 0, z: 0 };
    case 8:
      return { x: (0.42 - progress * 0.84) * amplitude, y: 0, z: 0 };
    case 9:
      return {
        x: 0,
        y: Math.sin(progress * Math.PI) * 0.1,
        z: -Math.sin(progress * Math.PI) * 0.08,
      };
    case 10:
      return { x: 0, y: 0, z: -Math.sin(progress * Math.PI) * 0.18 };
    case 11:
      return { x: 0, y: 0.18 - progress * 0.36, z: 0.15 * (1 - progress) };
    case 12:
      return {
        x: 0,
        y: Math.sin(progress * Math.PI) * 0.28,
        z: -Math.sin(progress * Math.PI) * 0.18,
      };
    default:
      return { x: 0, y: 0, z: 0 };
  }
}

function GsapCanvasTicker({
  reducedMotion,
  sceneStateRef,
}: Pick<SceneProps, "reducedMotion" | "sceneStateRef">) {
  const advance = useThree(state => state.advance);
  const lastProgressRef = useRef(-1);

  useEffect(() => {
    if (reducedMotion) return;

    const render = (time: number) => {
      const progress = sceneStateRef.current.progress;
      if (Math.abs(progress - lastProgressRef.current) < 0.000001) return;
      lastProgressRef.current = progress;
      advance(time * 1000, true);
    };
    gsap.ticker.add(render);
    return () => gsap.ticker.remove(render);
  }, [advance, reducedMotion, sceneStateRef]);

  return null;
}

function ScrollCamera({
  compact,
  sceneStateRef,
}: Omit<SceneProps, "reducedMotion">) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), []);
  const cameraConfig = compact ? BOOK.camera.compact : BOOK.camera.desktop;
  const foldCurve = useMemo(
    () =>
      compact
        ? new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 6.2, 7.55),
            new THREE.Vector3(0.08, 4.6, 4.4),
            new THREE.Vector3(0.12, 3.2, -2.4),
            new THREE.Vector3(0, 5.75, -7.7)
          )
        : new THREE.CubicBezierCurve3(
            new THREE.Vector3(0, 5.72, 6.25),
            new THREE.Vector3(0.24, 3.3, 3.35),
            new THREE.Vector3(0.42, 2.15, -1.8),
            new THREE.Vector3(0, 4.95, -6.8)
          ),
    [compact]
  );
  const foldPosition = useMemo(() => new THREE.Vector3(), []);
  const laterPoses = compact
    ? BOOK.camera.laterCompact
    : BOOK.camera.laterDesktop;
  const closurePose = compact
    ? BOOK.camera.closureCompact
    : BOOK.camera.closureDesktop;

  useFrame(() => {
    const state = sceneStateRef.current;
    const inspection = state.opening.readingAngle;
    const transitionOne = state.transitionOneToTwo.camera;
    const tetradTwo = state.tetradTwo;
    const transitionTwo = state.transitionTwoToThree;
    const approachedY = THREE.MathUtils.lerp(
      cameraConfig.startY,
      cameraConfig.approachY,
      state.approach
    );
    const approachedZ = THREE.MathUtils.lerp(
      cameraConfig.startZ,
      cameraConfig.approachZ,
      state.approach
    );
    const approachedFov = THREE.MathUtils.lerp(
      cameraConfig.startFov,
      cameraConfig.approachFov,
      state.approach
    );
    const fov = THREE.MathUtils.lerp(
      approachedFov,
      cameraConfig.inspectionFov,
      inspection
    );

    const t1Y = THREE.MathUtils.lerp(
      approachedY,
      cameraConfig.inspectionY,
      inspection
    );
    const t1Z = THREE.MathUtils.lerp(
      approachedZ,
      cameraConfig.inspectionZ,
      inspection
    );
    const overheadY = compact ? 6.45 : 6.1;
    const overheadZ = compact ? 7.8 : 5.9;
    const t2BaseX =
      Math.sin(tetradTwo.orbit * Math.PI) * (compact ? 0.12 : 0.62);
    const t2X = THREE.MathUtils.lerp(0, t2BaseX, tetradTwo.settle);
    const t2Y = THREE.MathUtils.lerp(
      overheadY,
      compact ? 6.2 : 5.72,
      tetradTwo.orbit
    );
    const t2Z = THREE.MathUtils.lerp(
      overheadZ,
      compact ? 7.55 : 6.25,
      tetradTwo.orbit
    );
    const chapterX = THREE.MathUtils.lerp(0, t2X, tetradTwo.settle);
    const chapterY = THREE.MathUtils.lerp(t1Y, t2Y, transitionOne);
    const chapterZ = THREE.MathUtils.lerp(t1Z, t2Z, transitionOne);

    let cameraX = chapterX;
    let cameraY = chapterY;
    let cameraZ = chapterZ;
    if (transitionTwo.foldDive > 0) {
      foldCurve.getPoint(transitionTwo.foldDive, foldPosition);
      cameraX = foldPosition.x;
      cameraY = foldPosition.y;
      cameraZ = foldPosition.z;
    }

    const foldTarget = transitionTwo.foldDive;
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const t2Fov = THREE.MathUtils.lerp(fov, compact ? 38 : 31, transitionOne);
    const foldFov = THREE.MathUtils.lerp(
      t2Fov,
      compact ? 38.5 : 33,
      foldTarget
    );
    let cameraFov = foldFov;
    const firstLaterTransition = state.laterTransitions[0];
    const laterStarted =
      firstLaterTransition.progress > 0 || state.laterChapters[0].progress > 0;

    if (laterStarted) {
      const activeTransition = state.laterTransitions.find(
        item => item.progress > 0 && item.progress < 1
      );
      if (activeTransition?.from === 3) {
        const nextPose = laterPoses[0];
        const nextOffset = laterCameraOffset(4, 0, compact);
        const transitionProgress = activeTransition.visualTransform;
        const sideArc = Math.sin(transitionProgress * Math.PI);
        cameraX =
          THREE.MathUtils.lerp(
            foldPosition.x,
            nextPose.x + nextOffset.x,
            transitionProgress
          ) +
          sideArc * (compact ? 0.38 : 1.1);
        cameraY =
          THREE.MathUtils.lerp(
            foldPosition.y,
            nextPose.y + nextOffset.y,
            transitionProgress
          ) +
          sideArc * 0.45;
        cameraZ = THREE.MathUtils.lerp(
          foldPosition.z,
          nextPose.z + nextOffset.z,
          transitionProgress
        );
        cameraFov = THREE.MathUtils.lerp(
          foldFov,
          nextPose.fov,
          transitionProgress
        );
      } else if (activeTransition && activeTransition.from >= 4) {
        const fromPose = laterPoses[activeTransition.from - 4];
        const toPose = laterPoses[activeTransition.to - 4];
        const fromOffset = laterCameraOffset(activeTransition.from, 1, compact);
        const toOffset = laterCameraOffset(activeTransition.to, 0, compact);
        const transitionProgress = activeTransition.visualTransform;
        cameraX = THREE.MathUtils.lerp(
          fromPose.x + fromOffset.x,
          toPose.x + toOffset.x,
          transitionProgress
        );
        if (activeTransition.from === 7 || activeTransition.from === 8) {
          cameraX +=
            Math.sin(transitionProgress * Math.PI) *
            (compact ? 0.55 : 1.35) *
            (activeTransition.from === 7 ? 1 : -1);
        }
        cameraY = THREE.MathUtils.lerp(
          fromPose.y + fromOffset.y,
          toPose.y + toOffset.y,
          transitionProgress
        );
        cameraZ = THREE.MathUtils.lerp(
          fromPose.z + fromOffset.z,
          toPose.z + toOffset.z,
          transitionProgress
        );
        cameraFov = THREE.MathUtils.lerp(
          fromPose.fov,
          toPose.fov,
          transitionProgress
        );
      } else {
        const poseIndex = Math.min(
          laterPoses.length - 1,
          Math.max(0, state.activeTetrad - 4)
        );
        const pose = laterPoses[poseIndex];
        const chapterState = state.laterChapters[poseIndex];
        const offset = laterCameraOffset(
          state.activeTetrad,
          chapterState.motion.cameraTravel,
          compact
        );
        cameraX = pose.x + offset.x;
        cameraY = pose.y + offset.y;
        cameraZ = pose.z + offset.z;
        cameraFov = pose.fov;
      }
    }

    if (state.closure.cameraPullback > 0) {
      cameraX = THREE.MathUtils.lerp(
        laterPoses[8].x,
        closurePose.x,
        state.closure.cameraPullback
      );
      cameraY = THREE.MathUtils.lerp(
        laterPoses[8].y,
        closurePose.y,
        state.closure.cameraPullback
      );
      cameraZ = THREE.MathUtils.lerp(
        laterPoses[8].z,
        closurePose.z,
        state.closure.cameraPullback
      );
      cameraFov = THREE.MathUtils.lerp(
        laterPoses[8].fov,
        closurePose.fov,
        state.closure.cameraPullback
      );
    }

    camera.position.set(cameraX, cameraY, cameraZ);
    target.set(
      0,
      THREE.MathUtils.lerp(
        THREE.MathUtils.lerp(0.13, 0.34, foldTarget),
        0.1,
        state.closure.cameraPullback
      ),
      THREE.MathUtils.lerp(-0.04, 0, foldTarget)
    );
    up.set(0, 1, 0);
    camera.up.copy(up);
    camera.lookAt(target);

    if (Math.abs(perspectiveCamera.fov - cameraFov) > 0.001) {
      perspectiveCamera.fov = cameraFov;
      perspectiveCamera.updateProjectionMatrix();
    }
  });

  return null;
}

function PrototypeBook({
  compact,
  sceneStateRef,
}: Omit<SceneProps, "reducedMotion">) {
  const bookRef = useRef<THREE.Group>(null);
  const coverHingeRef = useRef<THREE.Group>(null);
  const coverTexture = useTexture(TETRADIC_SIGNATURE_CONFIG.assets.cover);

  useEffect(() => {
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    coverTexture.anisotropy = 8;
    coverTexture.needsUpdate = true;
  }, [coverTexture]);

  useFrame(() => {
    const state = sceneStateRef.current;
    const closedScale = compact
      ? BOOK.scale.compactClosed
      : BOOK.scale.desktopClosed;
    const openScale = compact ? BOOK.scale.compactOpen : BOOK.scale.desktopOpen;
    const scale =
      THREE.MathUtils.lerp(
        closedScale,
        openScale,
        state.opening.interiorReveal
      ) *
      (0.96 + state.reveal * 0.04) *
      THREE.MathUtils.lerp(
        1,
        (closedScale * 1.06) / openScale,
        state.closure.settle
      );
    const coverAngle = state.coverOpen * Math.PI * BOOK.coverOpenAngle;
    const openFootprint = Math.max(0, -Math.cos(coverAngle));
    const reflectionYaw =
      Math.PI *
      state.laterTransitions[4].visualTransform *
      (1 - state.laterTransitions[5].visualTransform);

    if (bookRef.current) {
      bookRef.current.scale.setScalar(scale);
      bookRef.current.position.x =
        openFootprint * (BOOK_WIDTH / 2) * scale * Math.cos(reflectionYaw);
      bookRef.current.position.y = 0;
      bookRef.current.rotation.y =
        THREE.MathUtils.lerp(
          BOOK.rotationY.closed,
          BOOK.rotationY.open,
          state.orientation
        ) +
        state.tetradTwo.orbit * 0.035 +
        reflectionYaw;
    }

    if (coverHingeRef.current) {
      coverHingeRef.current.position.y =
        0.285 + state.opening.release * (1 - state.coverOpen) * 0.018;
      coverHingeRef.current.rotation.z = coverAngle;
    }
  });

  return (
    <group ref={bookRef}>
      <RoundedBox
        args={[BOOK_WIDTH + 0.08, 0.075, BOOK_DEPTH + 0.08]}
        radius={0.025}
        smoothness={4}
        position={[0, 0.0375, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color="#17120e"
          roughness={0.64}
          metalness={0.08}
        />
      </RoundedBox>

      <mesh position={[0.035, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOOK_WIDTH - 0.08, 0.2, BOOK_DEPTH - 0.08]} />
        <meshStandardMaterial color="#b7a273" roughness={0.9} />
      </mesh>

      {Array.from({ length: 5 }, (_, index) => (
        <mesh
          key={index}
          position={[0.035, 0.072 + index * 0.038, BOOK_DEPTH / 2 - 0.038]}
          castShadow={index === 4}
        >
          <boxGeometry args={[BOOK_WIDTH - 0.13, 0.009, 0.018]} />
          <meshStandardMaterial
            color={index % 2 === 0 ? "#c9b98b" : "#9f8a60"}
            roughness={0.98}
          />
        </mesh>
      ))}

      <mesh
        position={[0.035, 0.255, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[BOOK_WIDTH - 0.12, BOOK_DEPTH - 0.12]} />
        <meshStandardMaterial
          color="#cbb987"
          roughness={0.96}
          side={THREE.DoubleSide}
        />
      </mesh>

      <group ref={coverHingeRef} position={[-BOOK_WIDTH / 2, 0.285, 0]}>
        <RoundedBox
          args={[BOOK_WIDTH, 0.075, BOOK_DEPTH]}
          radius={0.025}
          smoothness={4}
          position={[BOOK_WIDTH / 2, 0.0375, 0]}
          castShadow
        >
          <meshStandardMaterial
            color="#18120d"
            roughness={0.58}
            metalness={0.08}
          />
        </RoundedBox>
        <mesh
          position={[BOOK_WIDTH / 2, 0.078, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[BOOK_WIDTH - 0.035, BOOK_DEPTH - 0.035]} />
          <meshStandardMaterial map={coverTexture} roughness={0.7} />
        </mesh>
        <mesh
          position={[BOOK_WIDTH / 2, -0.002, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[BOOK_WIDTH - 0.09, BOOK_DEPTH - 0.09]} />
          <meshStandardMaterial
            color="#c8b582"
            roughness={0.96}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh position={[BOOK_WIDTH / 2, -0.034, 0]} castShadow receiveShadow>
          <boxGeometry args={[BOOK_WIDTH - 0.11, 0.045, BOOK_DEPTH - 0.11]} />
          <meshStandardMaterial color="#c8b887" roughness={0.96} />
        </mesh>
      </group>

      <mesh
        position={[-BOOK_WIDTH / 2 - 0.025, 0.165, 0]}
        rotation={[Math.PI / 2, 0, 0]}
        castShadow
      >
        <cylinderGeometry args={[0.075, 0.075, BOOK_DEPTH + 0.045, 20]} />
        <meshStandardMaterial
          color="#24180f"
          roughness={0.62}
          metalness={0.04}
        />
      </mesh>

      <TetradicSpread sceneStateRef={sceneStateRef} />
      <BookChapterGeometry sceneStateRef={sceneStateRef} />
    </group>
  );
}

function BookContactShadow({
  sceneStateRef,
}: Pick<SceneProps, "sceneStateRef">) {
  const materialRef = useRef<THREE.ShadowMaterial>(null);
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const state = sceneStateRef.current;
    if (materialRef.current) {
      materialRef.current.opacity = THREE.MathUtils.lerp(
        0.24,
        0.43,
        state.closure.settle
      );
    }
    if (meshRef.current) {
      const closureScale = THREE.MathUtils.lerp(1, 0.82, state.closure.settle);
      meshRef.current.scale.set(closureScale, closureScale, 1);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={[0, -0.012, 0]}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[7, 4.5]} />
      <shadowMaterial ref={materialRef} transparent opacity={0.32} />
    </mesh>
  );
}

function BookStage({
  compact,
  sceneStateRef,
}: Omit<SceneProps, "reducedMotion">) {
  return (
    <>
      <ambientLight intensity={0.58} color="#d9c9ad" />
      <directionalLight
        castShadow
        position={[-4.5, 7, 5.5]}
        intensity={2.2}
        color="#f3d39a"
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={1}
        shadow-camera-far={18}
        shadow-camera-left={-5}
        shadow-camera-right={5}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight position={[4, 3, -3]} intensity={0.9} color="#78818a" />

      <BookContactShadow sceneStateRef={sceneStateRef} />

      <PrototypeBook compact={compact} sceneStateRef={sceneStateRef} />
      <CelestialChapterField sceneStateRef={sceneStateRef} />
      <ScrollCamera compact={compact} sceneStateRef={sceneStateRef} />
    </>
  );
}

function StaticBookFallback() {
  return (
    <div
      className="tetradic-signature__webgl-fallback"
      role="img"
      aria-label="The Tetradic Signature book resting on its pedestal"
    >
      <div>
        <img
          src={TETRADIC_SIGNATURE_CONFIG.assets.cover}
          alt="The Tetradic Signature Founder Edition cover"
          width={1536}
          height={2048}
        />
      </div>
    </div>
  );
}

export function TetradicBookScene({
  compact,
  reducedMotion,
  sceneStateRef,
}: SceneProps) {
  const cameraConfig = compact ? BOOK.camera.compact : BOOK.camera.desktop;
  const [webglLost, setWebglLost] = useState(false);

  if (webglLost) {
    return (
      <div className="tetradic-signature__canvas">
        <StaticBookFallback />
      </div>
    );
  }

  return (
    <div className="tetradic-signature__canvas" aria-hidden="true">
      <Canvas
        shadows="basic"
        dpr={compact ? [1, 1.25] : [1, 1.5]}
        frameloop={reducedMotion ? "demand" : "never"}
        fallback={<StaticBookFallback />}
        camera={{
          position: [0, cameraConfig.startY, cameraConfig.startZ],
          fov: cameraConfig.startFov,
          near: 0.1,
          far: 40,
        }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => {
          gl.setClearColor(0x000000, 0);
          gl.domElement.addEventListener(
            "webglcontextlost",
            event => {
              event.preventDefault();
              setWebglLost(true);
            },
            { once: true }
          );
        }}
      >
        <Suspense fallback={null}>
          <GsapCanvasTicker
            reducedMotion={reducedMotion}
            sceneStateRef={sceneStateRef}
          />
          <BookStage compact={compact} sceneStateRef={sceneStateRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
