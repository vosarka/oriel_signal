import { useEffect, useMemo, useRef, useState, Suspense, lazy } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Activity, Cpu, Disc, Zap } from "lucide-react";

/**
 * CosmichronicaChapter1 — Immersive Chapter Space
 * ════════════════════════════════════════════════════════════════════════════
 *
 * An award-winning, interactive, full-screen exploration of:
 *   Chapter 1: The Breath Before Being (Register I)
 *
 * Implements the 4 beautiful visual perspectives from your reference images:
 *   1. THE VISCOSITY OF EMPTY SPACE (3D Higgs Potential Bowl + rolling marble)
 *   2. THE ENGINE OF EXPANSION (Infinite 3D neon perspective grid)
 *   3. THE PREGNANT ZERO (SVG sacred geometry mandala responding to mouse)
 *   4. THE GENERATIVE NEGATIVE (Starburst contraction / Tzimtzum black hole)
 */

interface Chapter1Props {
  onClose: () => void;
}

type TabType = "viscosity" | "engine" | "pregnant-zero" | "negative";

export default function CosmichronicaChapter1({ onClose }: Chapter1Props) {
  const [activeTab, setActiveTab] = useState<TabType>("viscosity");

  return (
    <motion.div
      className="cz-chapter-view"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      {/* HUD Header */}
      <header className="cz-chapter-view__header">
        <div className="cz-chapter-view__meta">
          <span>PART I: THE PRIMORDIAL VOID</span>
          <span>·</span>
          <span>REGISTER I</span>
          <span>·</span>
          <span>CHAPTER 1</span>
        </div>
        <div className="cz-chapter-view__title-row">
          <h1 className="cz-chapter-view__title">The Breath Before Being</h1>
          <button
            type="button"
            className="cz-chapter-view__close"
            onClick={onClose}
            aria-label="Return to timeline"
          >
            <X size={18} />
            <span>EXIT CHAMBER</span>
          </button>
        </div>
      </header>

      {/* Main Interactive Stage */}
      <main className="cz-chapter-view__stage">
        <AnimatePresence mode="wait">
          {activeTab === "viscosity" && (
            <motion.div
              key="viscosity"
              className="cz-pane"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.5 }}
            >
              <ViscosityPerspective />
            </motion.div>
          )}

          {activeTab === "engine" && (
            <motion.div
              key="engine"
              className="cz-pane"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.5 }}
            >
              <EnginePerspective />
            </motion.div>
          )}

          {activeTab === "pregnant-zero" && (
            <motion.div
              key="pregnant-zero"
              className="cz-pane"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <PregnantZeroPerspective />
            </motion.div>
          )}

          {activeTab === "negative" && (
            <motion.div
              key="negative"
              className="cz-pane"
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.04 }}
              transition={{ duration: 0.5 }}
            >
              <GenerativeNegativePerspective />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Tabs / Perspectives Navigation */}
      <nav className="cz-chapter-view__tabs">
        <button
          type="button"
          className={`cz-tab ${activeTab === "viscosity" ? "is-active" : ""}`}
          onClick={() => setActiveTab("viscosity")}
        >
          <Activity size={14} />
          <span>I. VISCOSITY</span>
        </button>
        <button
          type="button"
          className={`cz-tab ${activeTab === "engine" ? "is-active" : ""}`}
          onClick={() => setActiveTab("engine")}
        >
          <Cpu size={14} />
          <span>II. ENGINE OF EXPANSION</span>
        </button>
        <button
          type="button"
          className={`cz-tab ${activeTab === "pregnant-zero" ? "is-active" : ""}`}
          onClick={() => setActiveTab("pregnant-zero")}
        >
          <Disc size={14} />
          <span>III. THE PREGNANT ZERO</span>
        </button>
        <button
          type="button"
          className={`cz-tab ${activeTab === "negative" ? "is-active" : ""}`}
          onClick={() => setActiveTab("negative")}
        >
          <Zap size={14} />
          <span>IIII. GENERATIVE NEGATIVE</span>
        </button>
      </nav>

      {/* Global CSS for Chapter Space */}
      <style>{`
        .cz-chapter-view {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: #050508;
          color: #e8e4dc;
          display: flex;
          flex-direction: column;
          padding: 2.5rem 3.5rem;
          overflow: hidden;
        }

        .cz-chapter-view__header {
          position: relative;
          z-index: 10;
          flex: none;
          margin-bottom: 2rem;
        }

        .cz-chapter-view__meta {
          font-family: var(--font-ritual);
          font-size: 9px;
          letter-spacing: 0.28em;
          color: #bda36b;
          display: flex;
          gap: 0.8rem;
          margin-bottom: 0.55rem;
        }

        .cz-chapter-view__title-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          border-bottom: 1px solid rgba(189, 163, 107, 0.16);
          padding-bottom: 0.8rem;
        }

        .cz-chapter-view__title {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: 2.4rem;
          letter-spacing: 0.04em;
          color: #f8f1e3;
          margin: 0;
          text-shadow: 0 0 34px rgba(246, 176, 94, 0.12);
        }

        .cz-chapter-view__close {
          background: none;
          border: 1px solid rgba(216, 181, 109, 0.35);
          border-radius: 2px;
          padding: 0.5rem 0.9rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-ritual);
          font-size: 9px;
          letter-spacing: 0.18em;
          color: #bda36b;
          cursor: pointer;
          transition: background 0.3s, color 0.3s, box-shadow 0.3s;
        }

        .cz-chapter-view__close:hover {
          background: rgba(246, 176, 94, 0.08);
          color: #f6b05e;
          box-shadow: 0 0 20px rgba(246, 176, 94, 0.18);
        }

        .cz-chapter-view__stage {
          flex: 1;
          position: relative;
          min-height: 0;
          margin-bottom: 2rem;
        }

        .cz-pane {
          position: absolute;
          inset: 0;
          display: grid;
          grid-template-columns: minmax(0, 1.15fr) 26rem;
          gap: 3.5rem;
          align-items: center;
        }

        .cz-pane__visual {
          height: 100%;
          position: relative;
          background: rgba(8, 8, 12, 0.4);
          border: 1px solid rgba(189, 163, 107, 0.08);
          border-radius: 3px;
          overflow: hidden;
        }

        .cz-pane__sidebar {
          display: flex;
          flex-direction: column;
          justify-content: center;
          height: 100%;
        }

        .cz-pane__kicker {
          font-family: var(--font-ritual);
          font-size: 10px;
          letter-spacing: 0.22em;
          color: #bda36b;
          margin-bottom: 1.2rem;
          text-transform: uppercase;
        }

        .cz-pane__title {
          font-family: var(--font-display);
          font-weight: 300;
          font-size: 2rem;
          line-height: 1.15;
          letter-spacing: 0.03em;
          color: #f4ecdc;
          margin: 0 0 1.5rem;
        }

        .cz-pane__card {
          background: rgba(12, 11, 9, 0.6);
          border: 1px solid rgba(216, 181, 109, 0.15);
          border-radius: 2px;
          padding: 1.5rem 1.6rem;
          margin-bottom: 1.5rem;
        }

        .cz-pane__card h4 {
          font-family: var(--font-ritual);
          font-size: 9.5px;
          letter-spacing: 0.16em;
          color: #f6b05e;
          text-transform: uppercase;
          margin: 0 0 0.6rem;
        }

        .cz-pane__card p {
          font-family: var(--font-body, system-ui, sans-serif);
          font-size: 13px;
          line-height: 1.6;
          color: rgba(224, 219, 207, 0.76);
          margin: 0;
        }

        .cz-chapter-view__tabs {
          flex: none;
          display: flex;
          gap: 0.5rem;
          background: rgba(5, 5, 8, 0.5);
          border: 1px solid rgba(189, 163, 107, 0.14);
          border-radius: 2px;
          padding: 4px;
          width: max-content;
          margin: 0 auto;
        }

        .cz-tab {
          background: none;
          border: none;
          padding: 0.55rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.6rem;
          font-family: var(--font-ritual);
          font-size: 8px;
          letter-spacing: 0.22em;
          color: rgba(232, 228, 220, 0.45);
          cursor: pointer;
          border-radius: 1px;
          transition: color 0.3s, background 0.3s;
        }

        .cz-tab:hover {
          color: #efe7d6;
        }

        .cz-tab.is-active {
          color: #f6b05e;
          background: rgba(246, 176, 94, 0.08);
        }

        @media (max-width: 1080px) {
          .cz-chapter-view {
            padding: 1.5rem;
            overflow-y: auto;
          }
          .cz-pane {
            grid-template-columns: 1fr;
            grid-template-rows: min(45vh, 320px) auto;
            position: relative;
            gap: 2rem;
            height: auto;
          }
          .cz-pane__visual { height: 100%; }
          .cz-pane__sidebar { height: auto; }
          .cz-chapter-view__tabs {
            flex-wrap: wrap;
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// I. VISCOSITY OF EMPTY SPACE (3D Higgs Bowl + rolling ball)
// ═══════════════════════════════════════════════════════════════════════════════

function ViscosityPerspective() {
  return (
    <>
      <div className="cz-pane__visual">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 4.5, 6.5], fov: 42 }}>
          <Suspense fallback={null}>
            <ambientLight intensity={0.5} />
            <pointLight position={[5, 5, 5]} intensity={1.5} color="#bda36b" />
            <pointLight position={[-5, 3, -5]} intensity={1.0} color="#b78b52" />
            
            <HiggsFieldBowl />
            
            <OrbitControls enableZoom={false} maxPolarAngle={Math.PI / 2.1} />
          </Suspense>
        </Canvas>
        
        {/* Wire HUD Overlay */}
        <div className="cz-hud-overlay">
          <div className="cz-hud-tag">// SCAN REGIME: METASTABILITY DETECTED</div>
          <div className="cz-hud-readout">VACUUM STATE: FALSE</div>
        </div>
      </div>

      <div className="cz-pane__sidebar">
        <span className="cz-pane__kicker">Vossari Physics Core</span>
        <h3 className="cz-pane__title">The Viscosity of Empty Space</h3>

        <div className="cz-pane__card">
          <h4>The Higgs Field</h4>
          <p>
            A non-zero field permeating space, providing the "drag" (inertia)
            that gives particles mass. Without this "empty" field, atoms could
            not form. Empty space is viscous.
          </p>
        </div>

        <div className="cz-pane__card" style={{ borderStyle: "dashed" }}>
          <h4>Metastability & False Vacuum</h4>
          <p>
            We may live in a "False Vacuum" — a local energy minimum. A "True
            Vacuum" bubble could theoretically form via quantum tunneling,
            expanding at light speed and rewriting the laws of physics. Our
            existence relies on the precarious stability of the Void.
          </p>
        </div>
      </div>
    </>
  );
}

function HiggsFieldBowl() {
  const meshRef = useRef<THREE.Mesh>(null!);
  const ballRef = useRef<THREE.Mesh>(null!);

  // Generate a Sombrero / Mexican-Hat potential geometry
  // z = (r^4 - r^2) - representing the Higgs potential field equation
  const geometry = useMemo(() => {
    const size = 32;
    const geo = new THREE.PlaneGeometry(5, 5, size, size);
    const pos = geo.attributes.position;
    
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const r = Math.sqrt(x*x + y*y);
      // Mexican hat potential formula
      const z = -0.32 * (Math.pow(r, 4) - 2.8 * Math.pow(r, 2));
      pos.setZ(i, z);
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    
    // Slow elegant rotation of the field
    if (meshRef.current) {
      meshRef.current.rotation.z = t * 0.055;
    }

    // Ball rolling around the circular potential valley (local minimum)
    if (ballRef.current) {
      const radius = 1.15; // valley radius
      const speed = 1.4;
      const angle = t * speed;
      
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius;
      // Height corresponding to valley
      const z = -0.32 * (Math.pow(radius, 4) - 2.8 * Math.pow(radius, 2)) + 0.15; // slightly above plane

      ballRef.current.position.set(x, y, z);
    }
  });

  return (
    <group rotation={[-Math.PI / 2.3, 0, 0]} position={[0, -0.6, 0]}>
      {/* Higgs bowl mesh */}
      <mesh ref={meshRef} geometry={geometry}>
        <meshBasicMaterial
          color="#9d7650"
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
      
      {/* Valley orbital highlight */}
      <mesh rotation={[0, 0, 0]} position={[0, 0, 0.48]}>
        <torusGeometry args={[1.15, 0.006, 8, 80]} />
        <meshBasicMaterial color="#f6b05e" transparent opacity={0.3} />
      </mesh>

      {/* Rolling marble (the particle acquiring mass) */}
      <mesh ref={ballRef}>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshBasicMaterial
          color="#f6b05e"
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// II. THE ENGINE OF EXPANSION (3D Neon Perspective Grid)
// ═══════════════════════════════════════════════════════════════════════════════

function EnginePerspective() {
  return (
    <>
      <div className="cz-pane__visual">
        <Canvas dpr={[1, 1.5]} camera={{ position: [0, 1.2, 5.0], fov: 45 }}>
          <Suspense fallback={null}>
            <PerspectiveNeonGrid />
          </Suspense>
        </Canvas>
        
        {/* HUD Readout */}
        <div className="cz-hud-overlay">
          <div className="cz-hud-tag">// COHERENT METRIC EXPANSION</div>
          <div className="cz-hud-readout">H₀ ATTRACTOR: 432.000</div>
        </div>
      </div>

      <div className="cz-pane__sidebar">
        <span className="cz-pane__kicker">Vacuum Metrics</span>
        <h3 className="cz-pane__title">The Engine of Expansion</h3>

        <div className="cz-pane__card">
          <h4>Dark Energy</h4>
          <p>
            The intrinsic energy density of the vacuum itself. As the universe
            expands, it creates more vacuum, driving faster expansion. The Void
            is the dominant engine of cosmic evolution.
          </p>
        </div>

        <div className="cz-pane__card" style={{ borderStyle: "dashed" }}>
          <h4>The Cosmological Constant Problem</h4>
          <p>
            Quantum theory predicts a vacuum energy 10^120 times larger than
            observed. This massive discrepancy implies our understanding of the
            Void is still profoundly incomplete.
          </p>
        </div>
      </div>
    </>
  );
}

function PerspectiveNeonGrid() {
  const grid = useRef<THREE.GridHelper>(null!);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    if (grid.current) {
      // Create the scrolling "runway" perspective effect
      grid.current.position.z = (t * 1.2) % 2;
    }
  });

  return (
    <group>
      {/* Infinite grid fading into the horizon */}
      <gridHelper
        ref={grid}
        args={[100, 50, "#bda36b", "rgba(189, 163, 107, 0.08)"]}
        position={[0, -0.65, 0]}
      />
      <gridHelper
        args={[100, 50, "#5fd0d8", "rgba(95, 208, 216, 0.05)"]}
        position={[0, 3.25, 0]}
        rotation={[Math.PI, 0, 0]}
      />

      {/* Sideline neon rails */}
      <mesh position={[-2.5, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 100, 4]} />
        <meshBasicMaterial color="#bda36b" transparent opacity={0.3} />
      </mesh>
      <mesh position={[2.5, -0.65, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 100, 4]} />
        <meshBasicMaterial color="#5fd0d8" transparent opacity={0.3} />
      </mesh>

      {/* Horizon glow */}
      <mesh position={[0, 1.3, -4.5]}>
        <planeGeometry args={[14, 5]} />
        <meshBasicMaterial
          color="#050508"
          transparent
          opacity={0.88}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// III. THE PREGNANT ZERO (SVG Sacred Mandala responding to mouse)
// ═══════════════════════════════════════════════════════════════════════════════

function PregnantZeroPerspective() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setMouse({ x, y });
  };

  return (
    <>
      <div
        className="cz-pane__visual"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setMouse({ x: 0, y: 0 })}
      >
        <div className="cz-mandala-wrap">
          <svg
            viewBox="-150 -150 300 300"
            className="cz-mandala"
            style={{
              ["--mx" as string]: mouse.x,
              ["--my" as string]: mouse.y,
            } as React.CSSProperties}
          >
            {/* Sacred flower geometry rings */}
            <circle r={132} className="cz-mandala__outer" />
            <circle r={118} className="cz-mandala__outer" />
            
            {/* Spinning gears / sacred nodes */}
            <g className="cz-layer cz-layer--slow">
              {Array.from({ length: 12 }).map((_, i) => {
                const angle = (i * 30 * Math.PI) / 180;
                const r = 90;
                return (
                  <circle
                    key={i}
                    cx={Math.cos(angle) * r}
                    cy={Math.sin(angle) * r}
                    r={24}
                    className="cz-mandala__leaf"
                  />
                );
              })}
            </g>

            {/* Inner responsive spiral */}
            <g className="cz-layer cz-layer--interactive">
              {Array.from({ length: 6 }).map((_, i) => {
                const angle = (i * 60 * Math.PI) / 180;
                const r = 44;
                return (
                  <path
                    key={i}
                    d={`M 0 0 Q ${Math.cos(angle + 0.3) * r * 1.5} ${Math.sin(angle + 0.3) * r * 1.5} ${Math.cos(angle) * r} ${Math.sin(angle) * r}`}
                    className="cz-mandala__spiral"
                  />
                );
              })}
            </g>

            {/* Zero core */}
            <circle r={36} className="cz-mandala__core" />
            <circle r={35.2} className="cz-mandala__core-inner" />
            <text className="cz-mandala__core-symbol" y={3}>Ψ</text>
          </svg>
        </div>

        <div className="cz-hud-overlay">
          <div className="cz-hud-tag">// RESONANCE DECODER ACTIVE</div>
          <div className="cz-hud-readout">VOID RESONANCE: 0.000</div>
        </div>
      </div>

      <div className="cz-pane__sidebar">
        <span className="cz-pane__kicker">Eastern Non-Duality</span>
        <h3 className="cz-pane__title">The Pregnant Zero</h3>

        <div className="cz-pane__card">
          <h4>Sunyata (Buddhism)</h4>
          <p>
            Often mistranslated as "emptiness," it means lack of intrinsic,
            independent nature. "Form is emptiness; emptiness is form." The
            void is the medium of relation.
          </p>
        </div>

        <div className="cz-pane__card" style={{ borderStyle: "dashed" }}>
          <h4>The Tao</h4>
          <p>
            "The hub of the wheel is empty, yet it makes the wagon move. The
            vessel is useful because of the emptiness inside." — Tao Te Ching.
            The pregnant zero is the origin of utility.
          </p>
        </div>
      </div>

      <style>{`
        .cz-mandala-wrap {
          display: grid;
          place-items: center;
          width: 100%;
          height: 100%;
          position: relative;
        }

        .cz-mandala {
          width: min(85%, 380px);
          height: min(85%, 380px);
          overflow: visible;
        }

        .cz-mandala__outer {
          fill: none;
          stroke: rgba(189, 163, 107, 0.22);
          stroke-width: 0.35;
        }

        .cz-mandala__leaf {
          fill: none;
          stroke: rgba(95, 208, 216, 0.1);
          stroke-width: 0.3;
          transition: stroke-color 0.3s;
        }

        .cz-layer {
          transform-origin: 0 0;
        }

        .cz-layer--slow {
          animation: cz-mandala-spin 120s linear infinite;
        }

        .cz-layer--interactive {
          transform: rotate(calc(var(--mx) * 36deg)) translate(calc(var(--mx) * 8px), calc(var(--my) * 8px));
          transition: transform 0.2s ease-out;
        }

        .cz-mandala__spiral {
          fill: none;
          stroke: rgba(246, 176, 94, 0.35);
          stroke-width: 0.45;
        }

        .cz-mandala__core {
          fill: #050508;
          stroke: rgba(189, 163, 107, 0.45);
          stroke-width: 0.6;
        }

        .cz-mandala__core-inner {
          fill: none;
          stroke: rgba(246, 176, 94, 0.6);
          stroke-width: 0.3;
          stroke-dasharray: 2 1;
        }

        .cz-mandala__core-symbol {
          font-family: var(--font-display);
          font-size: 11px;
          fill: #f6b05e;
          text-anchor: middle;
          dominant-baseline: middle;
        }

        @keyframes cz-mandala-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// IIII. THE GENERATIVE NEGATIVE (Starburst contraction / Tzimtzum)
// ═══════════════════════════════════════════════════════════════════════════════

function GenerativeNegativePerspective() {
  return (
    <>
      <div className="cz-pane__visual">
        <TzimtzumStarburst />
        
        {/* HUD Readout */}
        <div className="cz-hud-overlay">
          <div className="cz-hud-tag">// APOPHATIC EVENT BOUNDARY</div>
          <div className="cz-hud-readout">TZIMTZUM FIELD: MAXIMUM</div>
        </div>
      </div>

      <div className="cz-pane__sidebar">
        <span className="cz-pane__kicker">Western Mysticism</span>
        <h3 className="cz-pane__title">The Generative Negative</h3>

        <div className="cz-pane__card">
          <h4>Ain Soph & Tzimtzum (Kabbalah)</h4>
          <p>
            Creation required a divine contraction (Tzimtzum) to create an "empty
            space" for finite worlds to exist. The Infinite contracted to
            create room for the finite.
          </p>
        </div>

        <div className="cz-pane__card" style={{ borderStyle: "dashed" }}>
          <h4>Apophatic Theology</h4>
          <p>
            The "Via Negativa." Approaching the Divine through negation. God is
            beyond "being" and "non-being," residing in the "Darkness of
            Unknowing."
          </p>
        </div>
      </div>
    </>
  );
}

function TzimtzumStarburst() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId = 0;
    const w = (canvas.width = 540);
    const h = (canvas.height = 360);
    const cx = w / 2;
    const cy = h / 2;

    const lineCount = 180;
    const lines = Array.from({ length: lineCount }, (_, i) => {
      const angle = (i * Math.PI * 2) / lineCount;
      const speed = 0.5 + Math.random() * 1.5;
      const maxLen = 80 + Math.random() * 140;
      return { angle, speed, maxLen, progress: Math.random() * maxLen };
    });

    const draw = (t: number) => {
      ctx.fillStyle = "rgba(5, 5, 8, 0.22)"; // slow tail blur
      ctx.fillRect(0, 0, w, h);

      // Central dark contraction core (Tzimtzum Void)
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fillStyle = "#050508";
      ctx.fill();
      ctx.strokeStyle = "rgba(189, 163, 107, 0.18)";
      ctx.lineWidth = 0.6;
      ctx.stroke();

      // Contracting starburst lines
      lines.forEach((l) => {
        l.progress += l.speed;
        if (l.progress > l.maxLen) l.progress = 32; // reset near void core

        const startDist = l.progress;
        const endDist = l.progress + 6;

        const x1 = cx + Math.cos(l.angle) * startDist;
        const y1 = cy + Math.sin(l.angle) * startDist;
        const x2 = cx + Math.cos(l.angle) * endDist;
        const y2 = cy + Math.sin(l.angle) * endDist;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = l.angle % 2 === 0 ? "rgba(95, 208, 216, 0.28)" : "rgba(189, 163, 107, 0.22)";
        ctx.lineWidth = 0.35;
        ctx.stroke();
      });

      // Subtle gold outer compass guidelines
      ctx.beginPath();
      ctx.arc(cx, cy, 140, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(189, 163, 107, 0.05)";
      ctx.lineWidth = 0.35;
      ctx.stroke();

      animId = requestAnimationFrame(draw);
    };

    draw(0);
    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          width: "min(90%, 540px)",
          height: "min(90%, 360px)",
          borderRadius: "2px",
        }}
      />
    </div>
  );
}

// ── Shared HUD overlay style for pane visuals ───────────────────────────────

const hudStyles = `
  .cz-hud-overlay {
    position: absolute;
    bottom: 0.9rem;
    left: 1.1rem;
    pointer-events: none;
    font-family: var(--font-ritual);
  }
  .cz-hud-tag {
    font-size: 7px;
    letter-spacing: 0.2em;
    color: rgba(216, 181, 109, 0.55);
    margin-bottom: 0.2rem;
    text-transform: uppercase;
  }
  .cz-hud-readout {
    font-size: 9px;
    letter-spacing: 0.12em;
    color: #f6b05e;
    text-transform: uppercase;
  }
`;

if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = hudStyles;
  document.head.appendChild(style);
}
