import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ResonanceBody from "@/components/oriel-signal/ResonanceBody";
import { CodonWheel, type Codon } from "@/components/oriel-signal/CodonWheel";
import "./bio-architecture-journey.css";

gsap.registerPlugin(ScrollTrigger);

const CHAPTERS = [
  [
    "00",
    "THRESHOLD",
    "THE LIVING INSTRUMENT",
    "You are not a machine. You are a waveform.",
    "Bio-Architecture separates structural pattern from transient state. One is the instrument; the other is the signal moving through it.",
  ],
  [
    "01",
    "DOUBLE SIGNAL",
    "TWO TIMINGS · ONE FIELD",
    "A conscious sky. A somatic design.",
    "T_birth maps the conscious layer. T_design maps the somatic layer. Their overlap forms the double signal without collapsing one into the other.",
  ],
  [
    "02",
    "88° DESCENT",
    "EXACT RETROGRADE SEARCH",
    "The second timing is found, not estimated.",
    "The engine searches backward until the Sun reaches exactly 88.0000° before its birth longitude. That locked instant becomes T_design.",
  ],
  [
    "03",
    "256 FACETS",
    "GRANULAR TRANSLATION",
    "Every codon opens into four ways of expression.",
    "Sixty-four codons resolve through Somatic, Relational, Cognitive, and Transpersonal facets — 256 precise positions inside the same architecture.",
  ],
  [
    "04",
    "8 CENTERS",
    "THE RESONANCE BODY",
    "The pattern enters the body through eight centers.",
    "Origin through Omega: eight functions translate activation into pressure, cognition, expression, vitality, identity, emotion, instinct, and integration.",
  ],
  [
    "05",
    "32 LINKS",
    "SYSTEM CIRCUITRY",
    "A center does not speak alone.",
    "Thirty-two Resonance Links turn isolated codons into circuitry. A link becomes active when both endpoints complete the connection.",
  ],
  [
    "06",
    "FIELD INDEX",
    "THE ARCHITECTURE RESOLVES",
    "The map becomes an instrument.",
    "Turn the wheel. Isolate a center. Read a role. Inspect the machinery beneath the signal — then compare the universal structure with your own Profile.",
  ],
] as const;

const BREAKS = [0, 0.13, 0.285, 0.445, 0.605, 0.765, 0.9];

type Props = {
  codons: Codon[] | null;
  selectedId: number;
  onSelectCodon: (id: number) => void;
};

function WaveField() {
  return (
    <svg
      className="ba-wavefield"
      viewBox="0 0 1600 900"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="ba-gold-wave">
          <stop stopColor="#d7a754" stopOpacity="0" />
          <stop offset=".2" stopColor="#e7c47a" stopOpacity=".75" />
          <stop offset=".82" stopColor="#d7a754" stopOpacity=".7" />
          <stop offset="1" stopColor="#d7a754" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="ba-cyan-wave">
          <stop stopColor="#67c6d6" stopOpacity="0" />
          <stop offset=".2" stopColor="#81d7e2" stopOpacity=".7" />
          <stop offset=".82" stopColor="#67c6d6" stopOpacity=".7" />
          <stop offset="1" stopColor="#67c6d6" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path
        className="ba-wave ba-wave--gold"
        pathLength={1}
        d="M-40 470 C55 470 72 392 144 392 S237 548 310 548 S403 348 476 348 S570 514 643 514 S736 416 808 416 S902 522 975 522 S1069 364 1142 364 S1236 502 1309 502 S1403 418 1476 418 S1554 470 1640 470"
        stroke="url(#ba-gold-wave)"
      />
      <path
        className="ba-wave ba-wave--cyan"
        pathLength={1}
        d="M-40 470 C37 470 66 528 132 528 S224 374 294 374 S388 536 459 536 S553 398 624 398 S718 500 789 500 S883 390 954 390 S1048 544 1119 544 S1213 368 1284 368 S1378 510 1449 510 S1555 470 1640 470"
        stroke="url(#ba-cyan-wave)"
      />
      <line className="ba-wave-axis" x1="90" y1="470" x2="1510" y2="470" />
    </svg>
  );
}

function DualSignal() {
  const core = (
    tone: "gold" | "cyan",
    glyph: string,
    name: string,
    layer: string
  ) => (
    <div className={`ba-core ba-core--${tone}`}>
      <span className="ba-core__orbit" />
      <span className="ba-core__orbit ba-core__orbit--b" />
      <span className="ba-core__shape">{glyph}</span>
      <span className="ba-core__label">{name}</span>
      <span className="ba-core__sub">{layer}</span>
    </div>
  );
  return (
    <div className="ba-dual" aria-hidden="true">
      {core("gold", "◇", "T_BIRTH", "CONSCIOUS LAYER")}
      <span className="ba-dual__bridge" />
      {core("cyan", "◈", "T_DESIGN", "SOMATIC LAYER")}
    </div>
  );
}

function DescentOrbit() {
  return (
    <svg className="ba-orbit" viewBox="0 0 640 640" aria-hidden="true">
      <circle className="ba-orbit__guide" cx="320" cy="320" r="224" />
      <circle
        className="ba-orbit__guide ba-orbit__guide--inner"
        cx="320"
        cy="320"
        r="154"
      />
      {Array.from({ length: 24 }, (_, i) => {
        const a = (i / 24) * Math.PI * 2 - Math.PI / 2;
        return (
          <line
            key={i}
            className="ba-orbit__tick"
            x1={320 + Math.cos(a) * 215}
            y1={320 + Math.sin(a) * 215}
            x2={320 + Math.cos(a) * 224}
            y2={320 + Math.sin(a) * 224}
          />
        );
      })}
      <path
        className="ba-orbit__arc"
        pathLength={1}
        d="M320 96 A224 224 0 0 0 96.14 327.82"
      />
      <g className="ba-orbit__birth">
        <circle cx="320" cy="96" r="8" />
        <text x="338" y="91">
          T_BIRTH
        </text>
      </g>
      <g className="ba-orbit__design">
        <circle cx="320" cy="96" r="8" />
        <text x="338" y="91">
          T_DESIGN · −88.0000°
        </text>
      </g>
      <text className="ba-orbit__center" x="320" y="312">
        88.0000°
      </text>
      <text className="ba-orbit__center ba-orbit__center--sub" x="320" y="336">
        EXACT SOLAR REGRESSION
      </text>
    </svg>
  );
}

function FacetPlate() {
  const facets = [
    ["A", "SOMATIC", "BODY / PRESSURE"],
    ["B", "RELATIONAL", "BOND / DYNAMICS"],
    ["C", "COGNITIVE", "LOGIC / LANGUAGE"],
    ["D", "TRANSPERSONAL", "FIELD / MEANING"],
  ];
  return (
    <div className="ba-facet-plate" aria-hidden="true">
      <header>
        <span>64 CODONS</span>
        <span>×</span>
        <span>4 FACETS</span>
        <b>256 POSITIONS</b>
      </header>
      <div className="ba-facet-stack">
        {facets.map(([key, label, note], i) => (
          <div
            className="ba-facet"
            key={key}
            style={{ "--i": i } as CSSProperties}
          >
            <span>{key}</span>
            <strong>{label}</strong>
            <small>{note}</small>
          </div>
        ))}
      </div>
      <footer>
        <span>5.625° / CODON</span>
        <span>1.40625° / FACET</span>
      </footer>
    </div>
  );
}

function Links() {
  const paths = [
    "M260 76 C126 130 118 230 260 270 S402 404 260 468 S132 566 260 650",
    "M260 76 C394 130 402 230 260 270 S118 404 260 468 S388 566 260 650",
    "M260 76 C260 154 142 178 176 306 S342 420 260 650",
    "M260 76 C260 154 378 178 344 306 S178 420 260 650",
    "M260 162 C126 250 136 458 260 558",
    "M260 162 C394 250 384 458 260 558",
  ];
  return (
    <svg className="ba-links" viewBox="0 0 520 720" aria-hidden="true">
      <g>
        {paths.map((d, i) => (
          <path key={i} pathLength={1} d={d} />
        ))}
      </g>
      {[76, 162, 270, 370, 468, 558, 650].map((y, i) => (
        <g className="ba-link-node" key={y}>
          <circle cx="260" cy={y} r="7" />
          <text x="279" y={y + 4}>
            {String(i + 1).padStart(2, "0")}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function BioArchitectureJourney({
  codons,
  selectedId,
  onSelectCodon,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const progressRef = useRef<HTMLSpanElement>(null);
  const lastRef = useRef(0);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const ctx = gsap.context(() => {
      gsap.set(".ba-copy", { autoAlpha: 0, y: 28 });
      gsap.set(".ba-copy--0", { autoAlpha: 1, y: 0 });
      gsap.set(
        [
          ".ba-dual",
          ".ba-orbit",
          ".ba-facet-plate",
          ".ba-body-stage",
          ".ba-journey-wheel",
          ".ba-terminal-cta",
        ],
        { autoAlpha: 0 }
      );
      gsap.set(".ba-dual", { scale: 0.78 });
      gsap.set(".ba-orbit", { scale: 0.78, rotation: -12 });
      gsap.set(".ba-facet-plate", { scale: 0.84 });
      gsap.set(".ba-body-stage", { scale: 0.82, y: 44 });
      gsap.set(".ba-links path", { strokeDasharray: 1, strokeDashoffset: 1 });
      gsap.set(".ba-journey-wheel", { scale: 0.72, rotation: -8 });
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: root,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.7,
          invalidateOnRefresh: true,
          onUpdate: self => {
            if (progressRef.current)
              progressRef.current.style.transform = `scaleX(${self.progress})`;
            let n = 0;
            BREAKS.forEach((b, i) => {
              if (self.progress >= b) n = i;
            });
            if (n !== lastRef.current) {
              lastRef.current = n;
              setActive(n);
            }
          },
        },
      });
      tl.fromTo(
        ".ba-wave",
        { strokeDasharray: 1, strokeDashoffset: 1 },
        { strokeDashoffset: 0, duration: 10, stagger: 0.8 },
        0
      )
        .fromTo(
          ".ba-hero-lockup",
          { autoAlpha: 0, y: 24 },
          { autoAlpha: 1, y: 0, duration: 7 },
          0
        )
        .to(".ba-hero-lockup", { autoAlpha: 0, y: -26, duration: 5 }, 10)
        .to(".ba-copy--0", { autoAlpha: 0, y: -24, duration: 4 }, 10)
        .to(".ba-wave--gold", { y: -92, scaleY: 0.58, duration: 7 }, 11)
        .to(".ba-wave--cyan", { y: 92, scaleY: 0.58, duration: 7 }, 11)
        .to(".ba-dual", { autoAlpha: 1, scale: 1, duration: 7 }, 13)
        .to(".ba-copy--1", { autoAlpha: 1, y: 0, duration: 5 }, 14)
        .to(".ba-copy--1", { autoAlpha: 0, y: -24, duration: 4 }, 25)
        .to(".ba-dual", { autoAlpha: 0, scale: 0.25, duration: 7 }, 25)
        .to(
          ".ba-orbit",
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 7 },
          29
        )
        .to(
          ".ba-orbit__arc",
          { strokeDashoffset: 0, duration: 10, ease: "none" },
          31
        )
        .to(
          ".ba-orbit__design",
          {
            rotation: -88,
            transformOrigin: "320px 320px",
            duration: 10,
            ease: "none",
          },
          31
        )
        .to(".ba-copy--2", { autoAlpha: 1, y: 0, duration: 5 }, 31)
        .to(".ba-copy--2", { autoAlpha: 0, y: -24, duration: 4 }, 43)
        .to(".ba-orbit", { scale: 1.6, autoAlpha: 0, duration: 8 }, 43)
        .to(".ba-facet-plate", { autoAlpha: 1, scale: 1, duration: 8 }, 46)
        .fromTo(
          ".ba-facet",
          { autoAlpha: 0, x: 80 },
          { autoAlpha: 1, x: 0, duration: 7, stagger: 1.2 },
          47
        )
        .to(".ba-copy--3", { autoAlpha: 1, y: 0, duration: 5 }, 48)
        .to(".ba-copy--3", { autoAlpha: 0, y: -24, duration: 4 }, 60)
        .to(".ba-facet-plate", { autoAlpha: 0, scale: 1.22, duration: 7 }, 60)
        .to(".ba-body-stage", { autoAlpha: 1, scale: 1, y: 0, duration: 9 }, 61)
        .to(".ba-copy--4", { autoAlpha: 1, y: 0, duration: 5 }, 64)
        .to(".ba-copy--4", { autoAlpha: 0, y: -24, duration: 4 }, 74)
        .to(".ba-copy--5", { autoAlpha: 1, y: 0, duration: 5 }, 76)
        .to(".ba-links", { autoAlpha: 1, duration: 4 }, 75)
        .to(
          ".ba-links path",
          { strokeDashoffset: 0, duration: 11, stagger: 0.5, ease: "none" },
          76
        )
        .to(".ba-copy--5", { autoAlpha: 0, y: -24, duration: 4 }, 87)
        .to(".ba-body-stage", { autoAlpha: 0, scale: 0.66, duration: 8 }, 87)
        .to(
          ".ba-journey-wheel",
          { autoAlpha: 1, scale: 1, rotation: 0, duration: 10 },
          88
        )
        .to(".ba-copy--6", { autoAlpha: 1, y: 0, duration: 5 }, 92)
        .to(".ba-terminal-cta", { autoAlpha: 1, y: 0, duration: 5 }, 94);
    }, root);
    const timers = [180, 700, 1400].map(ms =>
      window.setTimeout(() => ScrollTrigger.refresh(), ms)
    );
    return () => {
      timers.forEach(clearTimeout);
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (!codons?.length) return;
    const f = requestAnimationFrame(() => ScrollTrigger.refresh());
    return () => cancelAnimationFrame(f);
  }, [codons?.length]);
  const go = useCallback((i: number) => {
    const r = rootRef.current;
    if (!r) return;
    const top = scrollY + r.getBoundingClientRect().top;
    scrollTo({
      top: top + (r.offsetHeight - innerHeight) * (BREAKS[i] ?? 0),
      behavior: "smooth",
    });
  }, []);

  return (
    <section
      ref={rootRef}
      className="ba-journey"
      aria-label="Bio-Architecture system reveal"
    >
      <div className="ba-journey__viewport">
        <div className="ba-grid" />
        <span ref={progressRef} className="ba-progress" />
        <div className="ba-hero-lockup">
          <span>ORIEL · TETRADIC RESONANCE ARCHITECTURE</span>
          <h1>BIO-ARCHITECTURE</h1>
          <p>SCROLL TO ENTER THE LIVING INSTRUMENT</p>
        </div>
        <nav className="ba-rail" aria-label="Bio-Architecture chapters">
          {CHAPTERS.map((c, i) => (
            <button
              key={c[1]}
              className={active === i ? "is-active" : ""}
              aria-current={active === i ? "step" : undefined}
              onClick={() => go(i)}
            >
              <i />
              <span>{c[0]}</span>
              <b>{c[1]}</b>
            </button>
          ))}
        </nav>
        <div className="ba-stage" aria-hidden="true">
          <WaveField />
          <DualSignal />
          <DescentOrbit />
          <FacetPlate />
          <div className="ba-body-stage">
            <span className="ba-body-halo" />
            <ResonanceBody
              nodeStyle="icon"
              showHud={false}
              embedded
              className="ba-body"
            />
            <Links />
          </div>
          <div className="ba-journey-wheel">
            {codons?.length ? (
              <CodonWheel
                codons={codons}
                selectedId={selectedId}
                onSelect={onSelectCodon}
              />
            ) : (
              <div className="ba-wheel-fallback">
                <span />
                <span />
                <span />
                <b>64</b>
              </div>
            )}
          </div>
        </div>
        <div className="ba-copy-deck" aria-live="polite">
          {CHAPTERS.map((c, i) => (
            <article
              key={c[1]}
              className={`ba-copy ba-copy--${i}`}
              aria-hidden={active !== i}
            >
              <div>
                <span>{c[0]}</span>
                {c[2]}
              </div>
              <h2>{c[3]}</h2>
              <p>{c[4]}</p>
            </article>
          ))}
        </div>
        <a className="ba-terminal-cta" href="#bio-terminal">
          ENTER THE INTERACTIVE TERMINAL <i>↓</i>
        </a>
        <footer className="ba-status">
          <span>SYSTEM · VTRS 2.0</span>
          <span>{CHAPTERS[active]?.[1]}</span>
          <span>{String(active + 1).padStart(2, "0")} / 07</span>
        </footer>
      </div>
      <div className="ba-reduced">
        <p>TETRADIC RESONANCE ARCHITECTURE</p>
        <h1>BIO-ARCHITECTURE</h1>
        {CHAPTERS.map(c => (
          <article key={c[1]}>
            <span>
              {c[0]} · {c[1]}
            </span>
            <h2>{c[3]}</h2>
            <p>{c[4]}</p>
          </article>
        ))}
        <a href="#bio-terminal">ENTER THE INTERACTIVE TERMINAL</a>
      </div>
    </section>
  );
}
