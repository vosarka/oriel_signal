import { Suspense, useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

import type { TetradicSceneState } from "./chapter-config";

type SceneProps = Readonly<{
  compact: boolean;
  reducedMotion: boolean;
  sceneStateRef: React.MutableRefObject<TetradicSceneState>;
}>;

const BOOK_WIDTH = 2.4;
const BOOK_DEPTH = 3.2;
const FIRST_TETRAD_POSITIONS = [
  [-0.54, -0.62],
  [0.54, -0.62],
  [0.54, 0.62],
  [-0.54, 0.62],
] as const;
const SECOND_TETRAD_POSITIONS = [
  [0, -0.82],
  [0.72, 0],
  [0, 0.82],
  [-0.72, 0],
] as const;

function ScrollCamera({
  compact,
  sceneStateRef,
}: Omit<SceneProps, "reducedMotion">) {
  const { camera } = useThree();
  const target = useMemo(() => new THREE.Vector3(), []);

  useFrame(() => {
    const approach = sceneStateRef.current.approach;
    const startY = compact ? 5.75 : 5.25;
    const startZ = compact ? 8.75 : 8.15;

    camera.position.set(
      0,
      THREE.MathUtils.lerp(startY, startY - 0.3, approach),
      THREE.MathUtils.lerp(startZ, startZ - 0.55, approach)
    );
    target.set(0, 0.13, -0.04);
    camera.lookAt(target);
  });

  useEffect(() => {
    const perspectiveCamera = camera as THREE.PerspectiveCamera;
    perspectiveCamera.fov = compact ? 39 : 35;
    perspectiveCamera.updateProjectionMatrix();
  }, [camera, compact]);

  return null;
}

function PlaceholderTetrad({
  sceneStateRef,
}: Pick<SceneProps, "sceneStateRef">) {
  const groupRef = useRef<THREE.Group>(null);
  const bridgeRef = useRef<THREE.Mesh>(null);
  const nodeRefs = useRef<Array<THREE.Group | null>>([]);
  const connectorRefs = useRef<Array<THREE.Mesh | null>>([]);
  const goldMaterials = useRef<Array<THREE.MeshStandardMaterial | null>>([]);
  const bridgeMaterialRef = useRef<THREE.MeshStandardMaterial>(null);

  useFrame(() => {
    const state = sceneStateRef.current;
    const alpha = state.tetradOne * (1 - state.cta * 0.45);
    const transition = state.transition;
    const group = groupRef.current;

    if (!group) return;
    group.visible = alpha > 0.001;
    group.scale.setScalar(0.86 + state.tetradOne * 0.14);
    group.rotation.y = transition * Math.PI * 0.25;

    goldMaterials.current.forEach(material => {
      if (material) material.opacity = alpha * 0.88;
    });

    nodeRefs.current.forEach((node, index) => {
      if (!node) return;
      const first = FIRST_TETRAD_POSITIONS[index];
      const second = SECOND_TETRAD_POSITIONS[index];
      const x = THREE.MathUtils.lerp(first[0], second[0], transition);
      const z = THREE.MathUtils.lerp(first[1], second[1], transition);
      node.position.set(x, 0, z);

      const connector = connectorRefs.current[index];
      if (!connector) return;
      const length = Math.hypot(x, z);
      connector.position.set(x / 2, 0, z / 2);
      connector.scale.x = length;
      connector.rotation.y = -Math.atan2(z, x);
    });

    if (bridgeRef.current) {
      bridgeRef.current.scale.setScalar(0.55 + transition * 0.45);
    }
    if (bridgeMaterialRef.current) {
      bridgeMaterialRef.current.opacity = alpha * transition * 0.95;
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.315, 0]} visible={false}>
      {FIRST_TETRAD_POSITIONS.map((_, index) => (
        <group
          key={index}
          ref={node => {
            nodeRefs.current[index] = node;
          }}
        >
          <mesh>
            <sphereGeometry args={[0.085, 20, 20]} />
            <meshStandardMaterial
              ref={material => {
                goldMaterials.current[index * 2] = material;
              }}
              color="#d8b56d"
              emissive="#8b6426"
              emissiveIntensity={0.35}
              transparent
              opacity={0}
            />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.012, 10, 40]} />
            <meshStandardMaterial
              ref={material => {
                goldMaterials.current[index * 2 + 1] = material;
              }}
              color="#f2d28d"
              transparent
              opacity={0}
            />
          </mesh>
        </group>
      ))}

      {FIRST_TETRAD_POSITIONS.map((_, index) => (
        <mesh
          key={`connector-${index}`}
          ref={mesh => {
            connectorRefs.current[index] = mesh;
          }}
        >
          <boxGeometry args={[1, 0.012, 0.012]} />
          <meshStandardMaterial
            ref={material => {
              goldMaterials.current[8 + index] = material;
            }}
            color="#9f7b3f"
            transparent
            opacity={0}
          />
        </mesh>
      ))}

      <mesh ref={bridgeRef} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.28, 0.02, 12, 48]} />
        <meshStandardMaterial
          ref={bridgeMaterialRef}
          color="#f4d790"
          emissive="#8b6426"
          emissiveIntensity={0.5}
          transparent
          opacity={0}
        />
      </mesh>
    </group>
  );
}

function PrototypeBook({
  compact,
  sceneStateRef,
}: Omit<SceneProps, "reducedMotion">) {
  const bookRef = useRef<THREE.Group>(null);
  const coverHingeRef = useRef<THREE.Group>(null);
  const coverTexture = useTexture("/assets/founder-scene/front-cover.png");

  useEffect(() => {
    coverTexture.colorSpace = THREE.SRGBColorSpace;
    coverTexture.anisotropy = 8;
    coverTexture.needsUpdate = true;
  }, [coverTexture]);

  useFrame(() => {
    const state = sceneStateRef.current;

    if (bookRef.current) {
      const scale = (compact ? 0.66 : 0.67) * (0.96 + state.reveal * 0.04);
      bookRef.current.scale.setScalar(scale);
      bookRef.current.rotation.y = THREE.MathUtils.lerp(
        -0.16,
        0.015,
        state.orientation
      );
    }

    if (coverHingeRef.current) {
      coverHingeRef.current.rotation.z = state.coverOpen * Math.PI * 0.88;
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
        <meshStandardMaterial color="#ae9869" roughness={0.9} />
      </mesh>

      <mesh
        position={[0.035, 0.255, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[BOOK_WIDTH - 0.12, BOOK_DEPTH - 0.12]} />
        <meshStandardMaterial
          color="#c4ad7b"
          roughness={0.94}
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
      </group>

      <mesh position={[-BOOK_WIDTH / 2 - 0.03, 0.17, 0]} castShadow>
        <boxGeometry args={[0.1, 0.31, BOOK_DEPTH + 0.05]} />
        <meshStandardMaterial color="#251910" roughness={0.7} />
      </mesh>

      <PlaceholderTetrad sceneStateRef={sceneStateRef} />
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
        shadow-camera-left={-4}
        shadow-camera-right={4}
        shadow-camera-top={4}
        shadow-camera-bottom={-4}
      />
      <pointLight position={[4, 3, -3]} intensity={0.9} color="#78818a" />

      <mesh
        position={[0, -0.012, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[3.4, 4.2]} />
        <shadowMaterial transparent opacity={0.32} />
      </mesh>

      <PrototypeBook compact={compact} sceneStateRef={sceneStateRef} />
      <ScrollCamera compact={compact} sceneStateRef={sceneStateRef} />
    </>
  );
}

export function TetradicBookScene({
  compact,
  reducedMotion,
  sceneStateRef,
}: SceneProps) {
  return (
    <div className="tetradic-signature__canvas" aria-hidden="true">
      <Canvas
        shadows="basic"
        dpr={[1, 1.5]}
        frameloop={reducedMotion ? "demand" : "always"}
        camera={{ position: [0, 5.25, 8.15], fov: 35, near: 0.1, far: 40 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: "high-performance",
        }}
        onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
      >
        <Suspense fallback={null}>
          <BookStage compact={compact} sceneStateRef={sceneStateRef} />
        </Suspense>
      </Canvas>
    </div>
  );
}
