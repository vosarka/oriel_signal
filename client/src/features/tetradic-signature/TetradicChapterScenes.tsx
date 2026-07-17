import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

import type { TetradicSceneState } from "./chapter-config";

type ChapterSceneProps = Readonly<{
  sceneStateRef: React.MutableRefObject<TetradicSceneState>;
}>;

const GOLD = new THREE.Color("#c8a45b");
const IVORY = new THREE.Color("#d9caa0");
const OBSIDIAN = new THREE.Color("#080807");
const CYAN = new THREE.Color("#6aaeb5");

function ChapterTurnPage({ sceneStateRef }: ChapterSceneProps) {
  const hingeRef = useRef<THREE.Group>(null);

  useFrame(() => {
    const state = sceneStateRef.current;
    const anticipation = state.tetradOne.pageLift;
    const transition = state.transitionOneToTwo;
    const startAngle = anticipation * THREE.MathUtils.degToRad(6);

    if (!hingeRef.current) return;
    hingeRef.current.visible =
      anticipation > 0.001 ||
      (transition.progress > 0 && transition.pageSettle < 0.999);
    hingeRef.current.rotation.z = THREE.MathUtils.lerp(
      startAngle,
      Math.PI,
      transition.pageTurn
    );
  });

  return (
    <group ref={hingeRef} position={[0, 0.34, 0]} visible={false}>
      <mesh position={[1.18, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[2.36, 3.12, 24, 2]} />
        <meshStandardMaterial
          color="#d8c99f"
          roughness={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function ArchitectureBlueprint({ sceneStateRef }: ChapterSceneProps) {
  const rootRef = useRef<THREE.Group>(null);
  const ringRefs = useRef<Array<THREE.Mesh | null>>([]);
  const ringMaterialRefs = useRef<Array<THREE.MeshBasicMaterial | null>>([]);
  const detailRef = useRef<THREE.Group>(null);
  const fieldMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const circuitryMaterialRef = useRef<THREE.LineBasicMaterial>(null);
  const centerMaterialRef = useRef<THREE.MeshStandardMaterial>(null);
  const activationMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const circuitryGeometry = useMemo(() => {
    const points: THREE.Vector3[] = [];
    const centers = [
      new THREE.Vector3(0, 0.02, -0.82),
      new THREE.Vector3(-0.23, 0.02, -0.55),
      new THREE.Vector3(0.2, 0.02, -0.28),
      new THREE.Vector3(-0.14, 0.02, 0),
      new THREE.Vector3(0.2, 0.02, 0.28),
      new THREE.Vector3(-0.2, 0.02, 0.53),
      new THREE.Vector3(0.13, 0.02, 0.78),
      new THREE.Vector3(0, 0.02, 1.02),
    ];

    centers.slice(1).forEach((center, index) => {
      points.push(centers[index], center);
    });
    points.push(centers[1], centers[4], centers[3], centers[6]);

    return new THREE.BufferGeometry().setFromPoints(points);
  }, []);

  useFrame(() => {
    const state = sceneStateRef.current;
    const transition = state.transitionOneToTwo;
    const tetrad = state.tetradTwo;
    const exit = state.transitionTwoToThree.pageTurn;
    const visible =
      Math.max(transition.blueprintReveal, tetrad.settle) * (1 - exit);
    const lift = transition.sealExpansion;
    const detailReveal = THREE.MathUtils.smoothstep(lift, 0.16, 0.82);

    if (rootRef.current) {
      rootRef.current.visible = visible > 0.001;
      rootRef.current.position.set(
        THREE.MathUtils.lerp(0.66, 0, lift),
        0.34 + lift * 0.48 + tetrad.blueprint * 0.3,
        THREE.MathUtils.lerp(-0.42, 0, lift)
      );
      rootRef.current.rotation.y = tetrad.orbit * 0.16;
      rootRef.current.rotation.z = -tetrad.orbit * 0.045;
      rootRef.current.scale.setScalar(0.24 + lift * 0.76);
    }

    ringRefs.current.forEach((ring, index) => {
      if (ring) ring.position.y = index * 0.105 * lift;
    });
    ringMaterialRefs.current.forEach((material, index) => {
      if (material) {
        material.opacity = visible * (index === 3 ? 0.76 : 0.58);
      }
    });
    if (detailRef.current) {
      detailRef.current.visible = visible * detailReveal > 0.02;
      detailRef.current.scale.setScalar(0.72 + detailReveal * 0.28);
    }
    if (fieldMaterialRef.current) {
      fieldMaterialRef.current.opacity = visible * detailReveal * 0.34;
    }
    if (circuitryMaterialRef.current) {
      circuitryMaterialRef.current.opacity = visible * tetrad.blueprint * 0.8;
    }
    if (centerMaterialRef.current) {
      centerMaterialRef.current.opacity = visible * 0.88;
    }
    if (activationMaterialRef.current) {
      activationMaterialRef.current.opacity =
        visible * (0.35 + tetrad.blueprint * 0.65);
    }
  });

  return (
    <group ref={rootRef} visible={false}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.22, 96]} />
        <meshBasicMaterial
          ref={fieldMaterialRef}
          color={OBSIDIAN}
          transparent
          opacity={0}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {[0.6, 0.83, 1.06, 1.25].map((radius, index) => (
        <mesh
          key={radius}
          ref={node => {
            ringRefs.current[index] = node;
          }}
          position={[0, index * 0.105, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[radius, index === 3 ? 0.012 : 0.007, 8, 96]} />
          <meshBasicMaterial
            ref={node => {
              ringMaterialRefs.current[index] = node;
            }}
            color={index === 1 ? CYAN : GOLD}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </mesh>
      ))}

      <group ref={detailRef} visible={false}>
        {Array.from({ length: 64 }, (_, index) => {
          const angle = (index / 64) * Math.PI * 2;
          const active = index % 11 === 0 || index % 13 === 0;
          return (
            <mesh
              key={index}
              position={[Math.cos(angle) * 1.25, 0.34, Math.sin(angle) * 1.25]}
              rotation={[0, -angle, 0]}
            >
              <boxGeometry args={[active ? 0.014 : 0.008, 0.12, 0.012]} />
              <meshBasicMaterial
                color={active ? IVORY : GOLD}
                transparent
                opacity={active ? 0.92 : 0.42}
              />
            </mesh>
          );
        })}

        <lineSegments geometry={circuitryGeometry} position={[0, 0.44, 0]}>
          <lineBasicMaterial
            ref={circuitryMaterialRef}
            color={GOLD}
            transparent
            opacity={0}
            depthWrite={false}
          />
        </lineSegments>

        {[-0.82, -0.55, -0.28, 0, 0.28, 0.53, 0.78, 1.02].map((z, index) => (
          <mesh
            key={z}
            position={[index % 2 === 0 ? 0.12 : -0.16, 0.46 + index * 0.045, z]}
          >
            <cylinderGeometry args={[0.095, 0.095, 0.04, 6]} />
            <meshStandardMaterial
              ref={index === 0 ? centerMaterialRef : undefined}
              color={index % 3 === 0 ? "#a45e48" : "#b99853"}
              emissive={index % 3 === 0 ? "#4d2218" : "#4c391c"}
              transparent
              opacity={0.88}
              roughness={0.52}
              metalness={0.22}
            />
          </mesh>
        ))}

        {[
          [-0.72, 0.74],
          [0.76, 0.56],
          [-0.86, -0.38],
          [0.76, -0.68],
        ].map(([x, z], index) => (
          <mesh key={`${x}-${z}`} position={[x, 0.72 + index * 0.04, z]}>
            <sphereGeometry args={[0.055, 16, 16]} />
            <meshBasicMaterial
              ref={index === 0 ? activationMaterialRef : undefined}
              color={index % 2 === 0 ? GOLD : CYAN}
              transparent
              opacity={0.7}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function FoldTransitionPage({ sceneStateRef }: ChapterSceneProps) {
  const hingeRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.MeshBasicMaterial>(null);
  const color = useMemo(() => new THREE.Color(), []);

  useFrame(() => {
    const transition = sceneStateRef.current.transitionTwoToThree;
    const { pageAnticipation, pageTurn, celestialReveal } = transition;
    const startAngle = pageAnticipation * THREE.MathUtils.degToRad(6);

    if (hingeRef.current) {
      hingeRef.current.visible =
        transition.progress > 0 && transition.pageSettle < 0.999;
      hingeRef.current.rotation.z = THREE.MathUtils.lerp(
        startAngle,
        Math.PI,
        pageTurn
      );
      hingeRef.current.position.y = 0.34;
      hingeRef.current.position.z = 0;
      hingeRef.current.scale.setScalar(1);
    }
    if (materialRef.current) {
      materialRef.current.opacity = Math.min(1, transition.progress * 12);
      materialRef.current.color.copy(
        color.copy(IVORY).lerp(OBSIDIAN, celestialReveal)
      );
    }
  });

  return (
    <group ref={hingeRef} position={[0, 0.37, 0]} visible={false}>
      <mesh position={[1.18, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} castShadow>
        <planeGeometry args={[2.36, 3.12, 28, 2]} />
        <meshBasicMaterial
          ref={materialRef}
          color={IVORY}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

function PersistentTurnPage({ sceneStateRef }: ChapterSceneProps) {
  const hingeRef = useRef<THREE.Group>(null);
  const paperRef = useRef<THREE.MeshStandardMaterial>(null);
  const geometry = useMemo(() => {
    const page = new THREE.PlaneGeometry(2.36, 3.12, 32, 4);
    (page.attributes.position as THREE.BufferAttribute).setUsage(
      THREE.DynamicDrawUsage
    );
    return page;
  }, []);
  const basePositions = useMemo(
    () => Float32Array.from(geometry.attributes.position.array),
    [geometry]
  );

  useFrame(() => {
    const transition = sceneStateRef.current.laterTransitions.find(
      item => item.progress > 0 && item.progress < 1
    );
    const visible = Boolean(transition);

    if (hingeRef.current) {
      hingeRef.current.visible = visible;
      if (transition) {
        hingeRef.current.rotation.z = THREE.MathUtils.lerp(
          THREE.MathUtils.degToRad(transition.anticipation * 5),
          Math.PI,
          transition.pageTurn
        );
        hingeRef.current.position.y = 0.342 + transition.pageLift * 0.012;
      }
    }
    if (!transition) return;

    const position = geometry.attributes.position as THREE.BufferAttribute;
    const curve = Math.sin(transition.pageTurn * Math.PI) * 0.075;
    for (let index = 0; index < position.count; index += 1) {
      const offset = index * 3;
      const x = basePositions[offset];
      const normalized = (x + 1.18) / 2.36;
      position.setZ(index, Math.sin(normalized * Math.PI) * curve);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();

    if (paperRef.current) {
      paperRef.current.color.set(
        transition.from === 7 || transition.from === 8 ? "#c9c3ab" : "#d8c99f"
      );
    }
  });

  return (
    <group ref={hingeRef} position={[0, 0.342, 0]} visible={false}>
      <mesh
        geometry={geometry}
        position={[1.18, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          ref={paperRef}
          color="#d8c99f"
          roughness={0.94}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh position={[1.18, -0.002, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.2, 2.96]} />
        <meshBasicMaterial
          color="#9f7f43"
          transparent
          opacity={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function CelestialField({ sceneStateRef }: ChapterSceneProps) {
  const groupRef = useRef<THREE.Group>(null);
  const starMaterialRef = useRef<THREE.PointsMaterial>(null);
  const goldSunRef = useRef<THREE.Mesh>(null);
  const cyanSunRef = useRef<THREE.Mesh>(null);
  const goldSunMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const cyanSunMaterialRef = useRef<THREE.MeshBasicMaterial>(null);
  const starGeometry = useMemo(() => {
    const positions = new Float32Array(180 * 3);
    let seed = 41;
    const random = () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };

    for (let index = 0; index < 180; index += 1) {
      positions[index * 3] = (random() - 0.5) * 14;
      positions[index * 3 + 1] = (random() - 0.5) * 8;
      positions[index * 3 + 2] = -2 - random() * 7;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, []);

  useFrame(() => {
    const state = sceneStateRef.current;
    const reveal =
      Math.max(
        state.transitionTwoToThree.celestialReveal,
        state.tetradThree.celestialReveal
      ) *
      (1 - state.laterTransitions[0].visualTransform);
    const journey = state.tetradThree.horizontalJourney;

    if (groupRef.current) {
      groupRef.current.visible = reveal > 0.001;
      groupRef.current.rotation.z = state.transitionTwoToThree.foldDive * 0.08;
    }
    if (starMaterialRef.current) {
      starMaterialRef.current.opacity = reveal * 0.72;
    }
    if (goldSunRef.current) {
      goldSunRef.current.position.x = THREE.MathUtils.lerp(-0.8, -3.1, journey);
      goldSunRef.current.scale.setScalar(0.68 + reveal * 0.32);
    }
    if (goldSunMaterialRef.current) {
      goldSunMaterialRef.current.opacity = reveal;
    }
    if (cyanSunRef.current) {
      cyanSunRef.current.position.x = THREE.MathUtils.lerp(0.8, 3.1, journey);
      cyanSunRef.current.scale.setScalar(0.68 + reveal * 0.32);
    }
    if (cyanSunMaterialRef.current) {
      cyanSunMaterialRef.current.opacity = reveal;
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <points geometry={starGeometry}>
        <pointsMaterial
          ref={starMaterialRef}
          color="#d8c79d"
          transparent
          opacity={0}
          size={0.026}
          sizeAttenuation
          depthWrite={false}
        />
      </points>
      <mesh ref={goldSunRef} position={[-0.8, 0.7, -1.2]}>
        <sphereGeometry args={[0.12, 32, 32]} />
        <meshBasicMaterial
          ref={goldSunMaterialRef}
          color={GOLD}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
      <mesh ref={cyanSunRef} position={[0.8, -0.45, -1.2]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshBasicMaterial
          ref={cyanSunMaterialRef}
          color={CYAN}
          transparent
          opacity={0}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

export function BookChapterGeometry({ sceneStateRef }: ChapterSceneProps) {
  return (
    <>
      <ArchitectureBlueprint sceneStateRef={sceneStateRef} />
      <ChapterTurnPage sceneStateRef={sceneStateRef} />
      <FoldTransitionPage sceneStateRef={sceneStateRef} />
      <PersistentTurnPage sceneStateRef={sceneStateRef} />
    </>
  );
}

export function CelestialChapterField({ sceneStateRef }: ChapterSceneProps) {
  return <CelestialField sceneStateRef={sceneStateRef} />;
}
