import { useEffect } from "react";

// ═══════════════════════════════════════════════════════════════════════════
// FOUNDER'S CURATED BLUEPRINT — Scene 1: The Artifact
// A sacred archive. One artifact waiting under a single shaft of light.
// No particles. No page flips. No scroll choreography yet. Only presence.
// Motion grammar: cinematic-scroll skill · transform/opacity only · 60fps
// ═══════════════════════════════════════════════════════════════════════════

export default function FounderCuratedBlueprint() {
  useEffect(() => {
    document.title = "The Founder's Curated Blueprint · ORIEL";
  }, []);

  return (
    <div className="fcb-scene1">
      <style>{`
        .fcb-scene1 {
          /* ── tokens ─────────────────────────────────────────── */
          --void: #050505;
          --void-warm: #0a0806;
          --light-core: rgba(226, 202, 150, 0.16);
          --light-mid: rgba(205, 161, 74, 0.07);
          --light-faint: rgba(205, 161, 74, 0.025);
          --stone-hi: #1c1915;
          --stone-mid: #121009;
          --stone-dark: #0a0908;
          --ink-mut: #6b6152;
          --ease-drift: cubic-bezier(0.37, 0, 0.63, 1);

          position: relative;
          height: 100vh;
          min-height: 640px;
          background: var(--void);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── volumetric shaft from above ─────────────────────── */
        .fcb-scene1__shaft {
          position: absolute;
          top: -12%;
          left: 50%;
          transform: translateX(-50%);
          width: min(560px, 72vw);
          height: 118%;
          background:
            radial-gradient(48% 42% at 50% 34%, var(--light-core) 0%, transparent 70%),
            linear-gradient(180deg,
              var(--light-mid) 0%,
              var(--light-faint) 42%,
              transparent 78%);
          clip-path: polygon(38% 0%, 62% 0%, 88% 100%, 12% 100%);
          animation: fcbBreath 9s var(--ease-drift) infinite;
          pointer-events: none;
        }

        /* faint ambient pool where the light lands */
        .fcb-scene1__pool {
          position: absolute;
          bottom: 6%;
          left: 50%;
          transform: translateX(-50%);
          width: min(680px, 86vw);
          height: 130px;
          background: radial-gradient(50% 100% at 50% 100%, var(--light-mid) 0%, transparent 72%);
          filter: blur(6px);
          animation: fcbBreath 9s var(--ease-drift) infinite;
          pointer-events: none;
        }

        @keyframes fcbBreath {
          0%, 100% { opacity: 0.85; }
          50% { opacity: 1; }
        }

        /* ── the altar group (pedestal + book float together) ── */
        .fcb-scene1__altar {
          position: relative;
          z-index: 2;
          display: flex;
          flex-direction: column;
          align-items: center;
          animation: fcbFloat 12s var(--ease-drift) infinite;
          will-change: transform;
        }

        @keyframes fcbFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-9px); }
        }

        /* ── the closed book ─────────────────────────────────── */
        .fcb-scene1__book {
          position: relative;
          width: min(200px, 44vw);
          aspect-ratio: 3 / 4;
          margin-bottom: -6px;
        }

        .fcb-scene1__book img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          border-radius: 3px 8px 8px 3px;
          box-shadow:
            0 1px 0 rgba(232, 196, 119, 0.14) inset,
            -6px 0 14px rgba(0, 0, 0, 0.55) inset,
            0 26px 60px rgba(0, 0, 0, 0.8),
            0 8px 22px rgba(0, 0, 0, 0.65);
        }

        /* book spine edge — gives the closed block its thickness */
        .fcb-scene1__book::before {
          content: "";
          position: absolute;
          left: -7px;
          top: 2px;
          bottom: 2px;
          width: 7px;
          border-radius: 3px 0 0 3px;
          background: linear-gradient(90deg, #060504 0%, #14100a 85%);
          box-shadow: -2px 0 8px rgba(0, 0, 0, 0.6);
        }

        /* soft breathing halo on the cover itself */
        .fcb-scene1__book::after {
          content: "";
          position: absolute;
          inset: -14%;
          background: radial-gradient(50% 50% at 50% 42%, rgba(226, 202, 150, 0.1) 0%, transparent 70%);
          animation: fcbBreath 9s var(--ease-drift) infinite;
          pointer-events: none;
        }

        /* ── stone pedestal ──────────────────────────────────── */
        .fcb-scene1__pedestal {
          position: relative;
          width: min(280px, 58vw);
          display: flex;
          flex-direction: column;
          align-items: center;
          filter: drop-shadow(0 30px 40px rgba(0, 0, 0, 0.75));
        }

        .fcb-scene1__slab {
          width: 100%;
          height: 22px;
          background: linear-gradient(180deg, var(--stone-hi) 0%, var(--stone-mid) 60%, var(--stone-dark) 100%);
          border-radius: 2px;
          box-shadow: 0 1px 0 rgba(226, 202, 150, 0.09) inset;
        }

        .fcb-scene1__column {
          width: 74%;
          height: 120px;
          background:
            linear-gradient(90deg,
              var(--stone-dark) 0%,
              var(--stone-mid) 18%,
              var(--stone-hi) 50%,
              var(--stone-mid) 82%,
              var(--stone-dark) 100%);
          box-shadow: 0 -6px 14px rgba(0, 0, 0, 0.4) inset;
        }

        .fcb-scene1__base {
          width: 112%;
          height: 18px;
          background: linear-gradient(180deg, var(--stone-mid) 0%, var(--stone-dark) 100%);
          border-radius: 2px;
          box-shadow: 0 1px 0 rgba(226, 202, 150, 0.05) inset;
        }

        /* ── the single UI element ───────────────────────────── */
        .fcb-scene1__hint {
          position: absolute;
          bottom: 34px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 3;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.34em;
          color: var(--ink-mut);
          text-transform: uppercase;
          white-space: nowrap;
          animation: fcbHint 5s var(--ease-drift) infinite;
        }

        @keyframes fcbHint {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 0.9; }
        }

        /* ── reduced motion: stillness is also sacred ────────── */
        @media (prefers-reduced-motion: reduce) {
          .fcb-scene1__altar,
          .fcb-scene1__shaft,
          .fcb-scene1__pool,
          .fcb-scene1__book::after,
          .fcb-scene1__hint {
            animation: none;
          }
        }
      `}</style>

      <div className="fcb-scene1__shaft" aria-hidden="true" />
      <div className="fcb-scene1__pool" aria-hidden="true" />

      <div className="fcb-scene1__altar">
        <div className="fcb-scene1__book">
          <img
            src="/product-previews/oriel-blueprint-cover-updated.webp"
            alt="The Founder's Curated Blueprint — closed"
            loading="eager"
          />
        </div>
        <div className="fcb-scene1__pedestal" aria-hidden="true">
          <div className="fcb-scene1__slab" />
          <div className="fcb-scene1__column" />
          <div className="fcb-scene1__base" />
        </div>
      </div>

      <p className="fcb-scene1__hint">Scroll to open the Codex</p>
    </div>
  );
}
