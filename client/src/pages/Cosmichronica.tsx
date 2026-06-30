import { useEffect, useRef, useState, useMemo, Suspense, lazy } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import Layout from "@/components/Layout";
import {
  SignalPageShell,
  DecodedTitle,
  SignalButton,
} from "@/components/oriel-signal/OrielSignalDesign";
import CosmicAtmosphere from "@/components/oriel-signal/CosmicAtmosphere";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { useCosmichronicaProgress } from "@/hooks/useCosmichronicaProgress";
import {
  MEMORY_NODES,
  PREFACE_LINES,
  CATEGORY_ACCENT,
  type MemoryNode,
} from "./cosmichronica-data";
import "./cosmichronica.css";

// Lazy-load the 3D Spiral of Time (the optimized helix spine).
const SpiralOfTime = lazy(
  () => import("@/components/oriel-signal/SpiralOfTime")
);

// Lazy-load the immersive Chapter 1 view
const CosmichronicaChapter1 = lazy(
  () => import("./CosmichronicaChapter1")
);

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

// Set this to your Spline scene URL when ready. Until then, the CSS energy
// core renders as the atmosphere. Nothing else needs to change.
const SPLINE_SCENE: string | undefined = undefined;

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

export default function Cosmichronica() {
  const streamRef = useRef<HTMLDivElement | null>(null);
  const progress = useCosmichronicaProgress();
  const reducedMotion = prefersReducedMotion() || false;

  // ── 3D Spiral state — a mutable ref fed by GSAP each frame (no re-render).
  // topDown + focusRegister are kept here too; the spiral's render loop polls all.
  const spiralStateRef = useRef({
    progress: 0,
    activeRegister: 0,
    topDown: false,
    focusRegister: null as number | null,
  });

  // ── Cinematic story state — the centered register text. Updated ONLY when the
  // active register or its visibility changes (never per-frame → no scroll jank).
  const [activeRegister, setActiveRegister] = useState(0);
  const [storyVisible, setStoryVisible] = useState(false);
  // The helix fades IN as the descent begins, so it never collides with the
  // hero/preface text at the very top (progress ≈ 0).
  const [spiralVisible, setSpiralVisible] = useState(false);
  const lastRegRef = useRef(0);
  const lastVisRef = useRef(false);
  const lastSpiralVisRef = useRef(false);

  // ── Chapter Transition and Immersive View States ──────────────────────────
  // activeMemory = the register index whose Memory panel is open (any register).
  // activeChapterView = the deep immersive Chapter 1 (Register I only, for now).
  const [activeMemory, setActiveMemory] = useState<number | null>(null);
  const [activeChapterView, setActiveChapterView] = useState<string | null>(null);

  // The spiral swings to top-down / focuses whenever a memory or chapter is open.
  const spiralTopDown = activeChapterView !== null;
  spiralStateRef.current.topDown = spiralTopDown;

  // Open the Memory of the register currently centered on the helix. Works for
  // EVERY register: zoom into its segment, then forge the memory panel from it.
  const handleOpenMemory = () => {
    const reg = lastRegRef.current;
    spiralStateRef.current.focusRegister = reg; // dive the camera into the segment
    setStoryVisible(false);
    // Let the dive settle, then assemble the panel out of the spiral.
    window.setTimeout(() => setActiveMemory(reg), 900);
  };

  const handleMemoryClose = () => {
    setActiveMemory(null);
    setActiveChapterView(null);
    spiralStateRef.current.focusRegister = null; // release → free descent resumes
    // The story re-appears on the next scroll tick; nudge it back for click-close.
    setStoryVisible(true);
  };

  // From inside a Memory panel, enter the deep immersive chapter (Register I).
  const handleEnterChapter = (index: string) => {
    if (index !== "1") return; // only Chapter 1 is built today
    setActiveChapterView(index);
  };

  // ── The descent: scroll-scrubbed axis growth + comet position ─────────────
  useEffect(() => {
    // Force the page to the top BEFORE wiring scroll animations, so the user
    // starts at the threshold and the descent plays forward (not pre-finished).
    window.scrollTo(0, 0);

    const stream = streamRef.current;
    if (!stream) return;

    if (prefersReducedMotion()) {
      stream.style.setProperty("--cz-progress", "1");
      return;
    }

    const proxy = { p: 0 };
    const apply = () => {
      stream.style.setProperty("--cz-progress", proxy.p.toFixed(4));
      // Feed the 3D spiral via a mutable ref — NO React re-render on scroll.
      // The spiral's own render loop reads these values each frame.
      spiralStateRef.current.progress = proxy.p;
      const reg = Math.min(7, Math.max(0, Math.floor(proxy.p * 8)));
      spiralStateRef.current.activeRegister = reg;

      // Drive the centered story text — React state, but only flipped on change
      // (≤ 8 register changes + 2 visibility flips over the whole descent).
      if (reg !== lastRegRef.current) {
        lastRegRef.current = reg;
        setActiveRegister(reg);
      }
      const vis = proxy.p > 0.045 && proxy.p < 0.965;
      if (vis !== lastVisRef.current) {
        lastVisRef.current = vis;
        setStoryVisible(vis);
      }

      // The helix emerges once the descent truly begins, leaving the hero clean.
      const sVis = proxy.p > 0.015;
      if (sVis !== lastSpiralVisRef.current) {
        lastSpiralVisRef.current = sVis;
        setSpiralVisible(sVis);
      }
    };
    apply();

    const tween = gsap.to(proxy, {
      p: 1,
      ease: "none",
      onUpdate: apply,
      scrollTrigger: {
        trigger: stream,
        start: "top 80%",
        end: "bottom bottom",
        scrub: 0.5,
        invalidateOnRefresh: true,
      },
    });

    // Starfield Parallax — background stars drift slower for spatial depth
    const starfield = document.querySelector(".signal-starfield");
    let starTween: gsap.core.Tween | null = null;
    if (starfield) {
      starTween = gsap.fromTo(
        starfield,
        { yPercent: 0 },
        {
          yPercent: -20, // drift up slower than scroll rate
          ease: "none",
          scrollTrigger: {
            trigger: document.documentElement,
            start: "top top",
            end: "bottom bottom",
            scrub: 0.3,
          },
        }
      );
    }

    // The page height keeps changing after mount: lazy 3D glyphs mount, fonts
    // swap, the atmosphere loads. Each change invalidates ScrollTrigger's cached
    // start/end positions — which is what makes the animations "fire wrong".
    // Refresh on a schedule and on the relevant browser events to keep triggers
    // pinned to the correct scroll points.
    const refresh = () => ScrollTrigger.refresh();
    const refreshTimers = [
      window.setTimeout(refresh, 200),
      window.setTimeout(refresh, 600),
      window.setTimeout(refresh, 1200),
    ];
    window.addEventListener("load", refresh);
    document.fonts?.ready.then(refresh).catch(() => {});

    return () => {
      refreshTimers.forEach((t) => window.clearTimeout(t));
      window.removeEventListener("load", refresh);
      tween.scrollTrigger?.kill();
      tween.kill();
      if (starTween) {
        starTween.scrollTrigger?.kill();
        starTween.kill();
      }
    };
  }, []);

  return (
    <Layout overlayHeader hideFooter={activeChapterView !== null}>
      <SignalPageShell chamber="codex" className="cosmichronica">
        {/* Ambient depth — Spline when provided, CSS energy core otherwise */}
        <CosmicAtmosphere scene={SPLINE_SCENE} />

        {/* The Spiral of Time — fixed 3D helix behind the descent. Rotates with
            scroll, base-pairs ignite per register, swings top-down on chapter.
            Fades in once the descent begins so it never collides with the hero. */}
        <div
          className={`cz-spiral-layer ${spiralVisible ? "is-visible" : ""}`}
          aria-hidden="true"
        >
          <Suspense fallback={null}>
            <SpiralOfTime stateRef={spiralStateRef} reducedMotion={reducedMotion} />
          </Suspense>
        </div>

        {/* ── Threshold ──────────────────────────────────────────────────── */}
        <ThresholdHero />

        {/* ── The Descent: a tall, empty scroll-driver. It produces the scroll
            distance that scrubs --cz-progress and the 3D helix. All register
            content is presented by the fixed cinematic overlay below. ──────── */}
        <div className="cz-stream" ref={streamRef} aria-hidden="true" />

        {/* ── Cinematic Story — fixed centered register text (cryptowl-style).
            Crossfades as the descent passes each register zone on the helix. ── */}
        <RegisterStory
          node={MEMORY_NODES[activeRegister]}
          visible={storyVisible}
          hasAccess={MEMORY_NODES[activeRegister] ? progress.hasAccess(MEMORY_NODES[activeRegister].tier) : true}
          onOpen={handleOpenMemory}
        />

        {/* Accessible, non-visual list of all registers for SEO + reduced-motion.
            Hidden visually; the cinematic overlay is the visual presentation. */}
        <div className="cz-registers-sr">
          {MEMORY_NODES.map((node) => (
            <article key={node.id} className="cz-registers-sr__item">
              <h2>{node.title}</h2>
              <p>{node.era}</p>
              <p>{node.question}</p>
              <p>{node.preview}</p>
            </article>
          ))}
        </div>

        {/* ── Origin Seal (exit) ────────────────────────────────────────── */}
        <OriginSeal />

        {/* ── Memory Panel — forged from the spiral when OPEN MEMORY is clicked.
            Particles in the register's colors assemble into a framed dossier. ── */}
        <AnimatePresence>
          {activeMemory !== null && activeChapterView === null && (
            <MemoryPanel
              node={MEMORY_NODES[activeMemory]}
              hasAccess={progress.hasAccess(MEMORY_NODES[activeMemory].tier)}
              onEnterChapter={handleEnterChapter}
              onClose={handleMemoryClose}
            />
          )}
        </AnimatePresence>

        {/* ── Chapter Immersive Views (full screen spaces) ────────────────── */}
        <AnimatePresence>
          {activeChapterView === "1" && (
            <Suspense fallback={null}>
              <CosmichronicaChapter1 onClose={handleMemoryClose} />
            </Suspense>
          )}
        </AnimatePresence>
      </SignalPageShell>
    </Layout>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Register Story — the fixed, centered cinematic text (cryptowl-style)
// ═══════════════════════════════════════════════════════════════════════════════

function RegisterStory({
  node,
  visible,
  hasAccess,
  onOpen,
}: {
  node: MemoryNode | undefined;
  visible: boolean;
  hasAccess: boolean;
  onOpen: (index: string, title: string) => void;
}) {
  if (!node) return null;

  const accent = CATEGORY_ACCENT[node.category];
  // Every register can open its Memory; the entry chapter is its first chapter.
  const entryChapter = node.chapters[0];

  return (
    <div
      className={`cz-story ${visible ? "is-visible" : ""}`}
      style={{ ["--story-accent" as string]: accent }}
    >
      {/* Keyed by register id: React unmounts the previous register instantly
          (no exit pile-up during fast scrubs) and the new one fades in via CSS.
          Split layout: huge title left, helix breathes through the center gap,
          dossier text right — inspired by Synapser / SON motion design. */}
      <div key={node.id} className="cz-story__grid">
        {/* The frame draws itself in — a dossier cadre materializing around the
            register text (top/bottom rules sweep out, 4 corner brackets snap in). */}
        <div className="cz-story__frame" aria-hidden="true">
          <span className="cz-story__rule cz-story__rule--top" />
          <span className="cz-story__rule cz-story__rule--bottom" />
          <span className="cz-story__corner cz-story__corner--tl" />
          <span className="cz-story__corner cz-story__corner--tr" />
          <span className="cz-story__corner cz-story__corner--bl" />
          <span className="cz-story__corner cz-story__corner--br" />
        </div>

        {/* top eyebrow spanning the full width */}
        <span className="cz-story__era">{node.era}</span>

        {/* LEFT — the monumental title */}
        <div className="cz-story__left">
          <h2 className="cz-story__title">{node.title}</h2>
          <span className="cz-story__state">
            {node.syntax} · {node.state}
          </span>
        </div>

        {/* RIGHT — the dossier: question + gloss + entry */}
        <div className="cz-story__right">
          <p className="cz-story__question">{node.question}</p>
          <p className="cz-story__preview">{node.preview}</p>

          {hasAccess ? (
            <button
              type="button"
              className="cz-story__open"
              onClick={() => onOpen(entryChapter.index, entryChapter.title)}
            >
              <span className="cz-story__open-line" />
              Open Memory
              <span className="cz-story__open-icon">→</span>
            </button>
          ) : (
            <span className="cz-story__locked">
              Deeper memory requires {node.tier} access
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Threshold Hero — title + decoding preface
// ═══════════════════════════════════════════════════════════════════════════════

function ThresholdHero() {
  const { ref, inView } = useScrollReveal<HTMLDivElement>({ threshold: 0.3 });
  const [revealed, setRevealed] = useState<number>(0);

  // Stagger the preface lines in once the hero is seen.
  useEffect(() => {
    if (!inView) return;
    if (prefersReducedMotion()) {
      setRevealed(PREFACE_LINES.length + 1);
      return;
    }
    let n = 0;
    const timer = window.setInterval(() => {
      n += 1;
      setRevealed(n);
      if (n >= PREFACE_LINES.length + 1) window.clearInterval(timer);
    }, 700);
    return () => window.clearInterval(timer);
  }, [inView]);

  return (
    <section className="cz-threshold" ref={ref} aria-labelledby="cz-title">
      <div className="cz-threshold__kicker">// recovered sacred text · the spiral</div>
      <DecodedTitle
        text="COSMICHRONICA"
        as="h1"
        className="cz-threshold__title"
        interval={70}
      />
      <div className="cz-preface">
        {PREFACE_LINES.map((line, i) => (
          <p
            key={i}
            className={`cz-preface__line ${i < revealed ? "is-in" : ""}`}
          >
            {line}
          </p>
        ))}
        <p className={`cz-preface__line ${revealed > PREFACE_LINES.length ? "is-in" : ""}`}>
          Enter as Static. Leave as Signal.
        </p>
      </div>
      <div className="cz-scrollcue" aria-hidden="true">
        <span>Descend</span>
        <span className="cz-scrollcue__line" />
      </div>
    </section>
  );
}


// ═══════════════════════════════════════════════════════════════════════════════
// Origin Seal — the exit
// ═══════════════════════════════════════════════════════════════════════════════

function OriginSeal() {
  const { ref, inView } = useScrollReveal<HTMLDivElement>({ threshold: 0.4 });
  return (
    <section
      className="cz-seal"
      ref={ref}
      style={{
        opacity: inView ? 1 : 0,
        transform: inView ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 1.2s ease, transform 1.2s cubic-bezier(0.16,1,0.3,1)",
      }}
    >
      <div className="cz-seal__mark" aria-hidden="true">
        Ω
      </div>
      <p className="cz-seal__text">
        The end becomes origin. The archive becomes womb. The universe remembers
        itself completely and begins another octave.
      </p>
      <div className="cz-seal__actions">
        <SignalButton href="/codex" variant="secondary">
          Open Codons
        </SignalButton>
        <SignalButton href="/archive" variant="secondary">
          Open Transmissions
        </SignalButton>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Memory Panel — forged out of the spiral when OPEN MEMORY is clicked
// ═══════════════════════════════════════════════════════════════════════════════

function MemoryPanel({
  node,
  hasAccess,
  onEnterChapter,
  onClose,
}: {
  node: MemoryNode;
  hasAccess: boolean;
  onEnterChapter: (index: string) => void;
  onClose: () => void;
}) {
  const accent = CATEGORY_ACCENT[node.category];

  // Particles that fly inward and "condense" into the panel — as if the panel
  // is assembled from the same lit base-pairs as the spiral. Seeded once.
  const motes = useMemo(
    () =>
      Array.from({ length: 26 }).map((_, i) => ({
        id: i,
        // start scattered around the viewport center, converge to (0,0)
        x: (Math.random() - 0.5) * 90,
        y: (Math.random() - 0.5) * 70,
        delay: Math.random() * 0.25,
        size: 2 + Math.random() * 3,
      })),
    []
  );

  // Esc closes the panel.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const canEnterChapter = node.chapters[0]?.index === "1";

  return (
    <motion.div
      className="cz-memory"
      style={{ ["--mem-accent" as string]: accent }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* scrim — click to close */}
      <div className="cz-memory__scrim" onClick={onClose} />

      {/* condensing motes (the spiral's matter forming the panel) */}
      <div className="cz-memory__motes" aria-hidden="true">
        {motes.map((m) => (
          <motion.span
            key={m.id}
            className="cz-memory__mote"
            initial={{ x: `${m.x}vw`, y: `${m.y}vh`, opacity: 0, scale: 0.4 }}
            animate={{ x: "0vw", y: "0vh", opacity: [0, 1, 0], scale: 1 }}
            transition={{ duration: 0.8, delay: m.delay, ease: [0.16, 1, 0.3, 1] }}
            style={{ width: m.size, height: m.size }}
          />
        ))}
      </div>

      {/* the framed dossier — draws its border, then content fades up */}
      <motion.div
        className="cz-memory__panel"
        initial={{ clipPath: "inset(0 50% 0 50%)", opacity: 0 }}
        animate={{ clipPath: "inset(0 0% 0 0%)", opacity: 1 }}
        exit={{ clipPath: "inset(0 50% 0 50%)", opacity: 0 }}
        transition={{ duration: 0.55, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      >
        <span className="cz-memory__corner cz-memory__corner--tl" />
        <span className="cz-memory__corner cz-memory__corner--tr" />
        <span className="cz-memory__corner cz-memory__corner--bl" />
        <span className="cz-memory__corner cz-memory__corner--br" />

        <button
          type="button"
          className="cz-memory__close"
          onClick={onClose}
          aria-label="Close memory"
        >
          ✕ Close
        </button>

        <motion.div
          className="cz-memory__content"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.7 }}
        >
          <span className="cz-memory__era">{node.era}</span>
          <h2 className="cz-memory__title">{node.title}</h2>
          <span className="cz-memory__state">
            {node.syntax} · {node.state}
          </span>

          <p className="cz-memory__question">{node.question}</p>

          {hasAccess ? (
            <>
              <p className="cz-memory__body">{node.body}</p>
              {node.formula && (
                <code className="cz-memory__formula">{node.formula}</code>
              )}

              <ul className="cz-memory__chapters">
                {node.chapters.map((ch) => {
                  const live = ch.index === "1";
                  return (
                    <li
                      key={ch.index}
                      className={`cz-memory__chapter ${live ? "is-live" : ""}`}
                      onClick={live ? () => onEnterChapter(ch.index) : undefined}
                    >
                      <span className="cz-memory__chapter-num">{ch.index}</span>
                      <span className="cz-memory__chapter-text">
                        <span className="cz-memory__chapter-title">{ch.title}</span>
                        <span className="cz-memory__chapter-gloss">{ch.gloss}</span>
                      </span>
                      {live && <span className="cz-memory__chapter-go">Enter →</span>}
                    </li>
                  );
                })}
              </ul>

              {canEnterChapter && (
                <button
                  type="button"
                  className="cz-memory__enter"
                  onClick={() => onEnterChapter("1")}
                >
                  <span className="cz-memory__enter-line" />
                  Enter the Chamber
                  <span className="cz-memory__enter-icon">→</span>
                </button>
              )}
            </>
          ) : (
            <>
              <p className="cz-memory__body">{node.preview}</p>
              <div className="cz-memory__locked">
                This register's full memory requires {node.tier} access —
                the deeper the descent, the deeper the signal.
              </div>
            </>
          )}
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
