import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
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

function GsapCanvasTicker({ reducedMotion }: { reducedMotion: boolean }) {
  const advance = useThree(state => state.advance);

  useEffect(() => {
    if (reducedMotion) return;

    const render = (time: number) => advance(time * 1000, true);
    gsap.ticker.add(render);
    return () => gsap.ticker.remove(render);
  }, [advance, reducedMotion]);

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

    camera.position.set(cameraX, cameraY, cameraZ);
    const foldTarget = transitionTwo.foldDive;
    target.set(
      0,
      THREE.MathUtils.lerp(0.13, 0.34, foldTarget),
      THREE.MathUtils.lerp(-0.04, 0, foldTarget)
    );
    up.set(0, 1, 0);
    camera.up.copy(up);
    camera.lookAt(target);

    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    const t2Fov = THREE.MathUtils.lerp(fov, compact ? 38 : 31, transitionOne);
    const foldFov = THREE.MathUtils.lerp(
      t2Fov,
      compact ? 38.5 : 33,
      foldTarget
    );
    if (Math.abs(perspectiveCamera.fov - foldFov) > 0.001) {
      perspectiveCamera.fov = foldFov;
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
      (0.96 + state.reveal * 0.04);
    const coverAngle = state.coverOpen * Math.PI * BOOK.coverOpenAngle;
    const openFootprint = Math.max(0, -Math.cos(coverAngle));

    if (bookRef.current) {
      bookRef.current.scale.setScalar(scale);
      bookRef.current.position.x = openFootprint * (BOOK_WIDTH / 2) * scale;
      bookRef.current.position.y = 0;
      bookRef.current.rotation.y =
        THREE.MathUtils.lerp(
          BOOK.rotationY.closed,
          BOOK.rotationY.open,
          state.orientation
        ) +
        state.tetradTwo.orbit * 0.035;
    }

    if (coverHingeRef.current) {
      coverHingeRef.current.position.y =
        0.285 + state.opening.release * (1 - state.coverOpen) * 0.018;
      coverHingeRef.current.rotation.z = coverAngle;
    }
  });

  return (
    <group ref={bookRef}>
      <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOOK_WIDTH + 0.08, 0.07, BOOK_DEPTH + 0.08]} />
        <meshStandardMaterial
          color="#17120e"
          roughness={0.72}
          metalness={0.08}
        />
      </mesh>

      <mesh position={[0.035, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[BOOK_WIDTH - 0.08, 0.2, BOOK_DEPTH - 0.08]} />
        <meshStandardMaterial color="#ad9768" roughness={0.92} />
      </mesh>

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
        <mesh position={[BOOK_WIDTH / 2, 0.035, 0]} castShadow>
          <boxGeometry args={[BOOK_WIDTH, 0.07, BOOK_DEPTH]} />
          <meshStandardMaterial
            color="#18120d"
            roughness={0.64}
            metalness={0.08}
          />
        </mesh>
        <mesh
          position={[BOOK_WIDTH / 2, 0.071, 0]}
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
      </group>

      <mesh position={[-BOOK_WIDTH / 2 - 0.03, 0.17, 0]} castShadow>
        <boxGeometry args={[0.1, 0.31, BOOK_DEPTH + 0.05]} />
        <meshStandardMaterial color="#251910" roughness={0.7} />
      </mesh>

      <TetradicSpread sceneStateRef={sceneStateRef} />
      <BookChapterGeometry sceneStateRef={sceneStateRef} />
    </group>
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

      <mesh
        position={[0, -0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[7, 4.5]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>

      <PrototypeBook compact={compact} sceneStateRef={sceneStateRef} />
      <CelestialChapterField sceneStateRef={sceneStateRef} />
      <ScrollCamera compact={compact} sceneStateRef={sceneStateRef} />
    </>
  );
}

export function TetradicBookScene({
  compact,
  reducedMotion,
  sceneStateRef,
}: SceneProps) {
  const cameraConfig = compact ? BOOK.camera.compact : BOOK.camera.desktop;

  return (
    <div className="tetradic-signature__canvas" aria-hidden="true">
      <Canvas
        shadows="basic"
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "always" : "never"}
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
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Suspense fallback={null}>
          <GsapCanvasTicker reducedMotion={reducedMotion} />
          <BookStage compact={compact} sceneStateRef={sceneStateRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
