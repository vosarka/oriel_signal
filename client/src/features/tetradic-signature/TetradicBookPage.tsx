import { useLayoutEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { TetradicFounderEditionProps } from "./TetradicFounderEdition";
import { TetradicFounderIntake } from "./TetradicFounderIntake";
import "@/features/oriel-orb/oriel-orb.css";
import "./tetradic-book-page.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * The book page, as a transmission: the title on the void, the calculation
 * passing as a film of five plates, the questions only an edition answers,
 * then page 30 with the reader's own name set into it, and the order. The
 * site's gold on void, with the chat's tape grain over it. Only generic plates
 * from Part I: no Receiver's record is ever shown here.
 */

const IMG = "/assets/tetradic-signature/book";

const BODIES = ["sun", "earth", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune", "pluto"];
const FACETS = [
  ["a", "Somatic"],
  ["b", "Relational"],
  ["c", "Cognitive"],
  ["d", "Transpersonal"],
] as const;
const CENTRES = ["Origin", "Mental", "Collapse", "Saturation", "Bridge", "Becoming", "Return", "Omega"];

type Step = { plate: string; title: string; line: string; glyphs?: "bodies" | "facets" | "centres" };
const STEPS: Step[] = [
  {
    plate: "two-moments",
    title: "Two moments",
    line: "The sky at your birth, and the sky at an instant no one witnessed, about three months before it.",
  },
  {
    plate: "eighty-eight",
    title: "Eighty-eight degrees",
    line: "That second instant is not chosen. It is found: the moment the Sun stood exactly 88° behind.",
  },
  {
    plate: "bodies",
    title: "Thirteen bodies, read twice",
    line: "Twenty-six positions, each with a fixed weight. Every record holds exactly 1,370 units.",
    glyphs: "bodies",
  },
  {
    plate: "field",
    title: "Sixty-four codons, four facets",
    line: "Each position lands on one of sixty-four codons, and on one of its four facets.",
    glyphs: "facets",
  },
  {
    plate: "pillar",
    title: "Eight centres",
    line: "The weight collects in eight centres. Where a circuit closes, a pillar. Where it does not, an antenna.",
    glyphs: "centres",
  },
];

/** What only the reader's own edition answers: the Part II and III chapters. */
const SEALED = [
  ["Which of your eight centres carries the most weight?", "II · Your Centres"],
  ["Which circuits close in you, and which stay open at one end?", "II · Your Four Links"],
  ["Where do your two layers disagree with each other?", "II · The Central Contradiction"],
  ["What would prove the whole reading wrong?", "III · What Would Prove Me Wrong"],
] as const;

function Glyphs({ kind }: { kind: NonNullable<Step["glyphs"]> }) {
  if (kind === "bodies") {
    return (
      <ul className="tbk-glyphs tbk-glyphs--bodies" aria-label="The bodies">
        {BODIES.map(b => (
          <li key={b}>
            <img src={`${IMG}/body-${b}.webp`} alt={b} loading="lazy" />
          </li>
        ))}
      </ul>
    );
  }
  if (kind === "facets") {
    return (
      <ul className="tbk-glyphs tbk-glyphs--named" aria-label="The four facets">
        {FACETS.map(([id, name]) => (
          <li key={id}>
            <img src={`${IMG}/facet-${id}.webp`} alt="" loading="lazy" />
            <span>
              {id.toUpperCase()} · {name}
            </span>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <ul className="tbk-glyphs tbk-glyphs--named tbk-glyphs--centres" aria-label="The eight centres">
      {CENTRES.map((name, i) => (
        <li key={name}>
          <img src={`${IMG}/centre-${i + 1}.webp`} alt="" loading="lazy" />
          <span>{name}</span>
        </li>
      ))}
    </ul>
  );
}

const NAME_MAX = 40;

/**
 * Page 30 of an edition, with the slot for the Receiver's name left open: the
 * reader types and the name is set into the page, letter by letter. Purely on
 * this screen; the order still takes the name from the account.
 */
function NamePage() {
  const [name, setName] = useState("");
  const shown = name.trim() || "[your name]";
  // The page's own size for the name, shrinking so a long name stays on one line.
  const size = Math.min(6.2, 62 / Math.max(10, shown.length * 0.95));
  return (
    <div className="tbk-name">
      <figure className="tbk-name__page">
        <img src={`${IMG}/page-30.webp`} alt="Page 30 of an edition: Part II, A Life in Measure, with the Receiver's name" loading="lazy" />
        <span className="tbk-name__ink" style={{ fontSize: `${size}cqw` }} aria-live="polite">
          {shown.split("").map((c, i) => (
            <span key={`${i}-${c}`} className={name.trim() ? "tbk-name__char" : undefined}>
              {c === " " ? " " : c}
            </span>
          ))}
        </span>
      </figure>
      <label className="tbk-name__field">
        <span className="tbk-eyebrow">Write the name it is made for</span>
        <input
          type="text"
          value={name}
          maxLength={NAME_MAX}
          placeholder="Your name"
          autoComplete="name"
          spellCheck={false}
          onChange={e => setName(e.target.value)}
        />
      </label>
    </div>
  );
}

/**
 * The motion: the title set letter by letter, the cover lifting off the void
 * and leaning toward the pointer; on wide screens the five plates pass
 * sideways like a film while the reader scrolls, their symbols arriving one by
 * one; the sealed questions and page 30 come in once. Nothing moves under
 * reduced motion, and everything is visible without JavaScript.
 */
function useBookMotion() {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root) return;
    const mm = gsap.matchMedia(root);

    mm.add("(prefers-reduced-motion: no-preference)", () => {
      gsap.from(".tbk-hero__char", {
        opacity: 0,
        yPercent: 40,
        filter: "blur(6px)",
        duration: 1,
        ease: "power3.out",
        stagger: 0.03,
        delay: 0.15,
      });
      gsap.from(".tbk-hero [data-rise]", { opacity: 0, y: 24, duration: 1, ease: "power3.out", stagger: 0.12, delay: 0.7 });
      gsap.from(".tbk-hero__cover", { opacity: 0, y: 60, duration: 1.6, ease: "power3.out", delay: 0.3 });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el => {
        gsap.from(el, { opacity: 0, y: 40, duration: 1, ease: "power3.out", scrollTrigger: { trigger: el, start: "top 85%", once: true } });
      });
      gsap.from(".tbk-sealed li", {
        opacity: 0,
        x: -30,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.14,
        scrollTrigger: { trigger: ".tbk-sealed", start: "top 80%", once: true },
      });
      gsap.from(".tbk-name__page", {
        opacity: 0,
        y: 60,
        rotateX: 12,
        transformPerspective: 1400,
        duration: 1.4,
        ease: "power3.out",
        scrollTrigger: { trigger: ".tbk-name", start: "top 80%", once: true },
      });
    });

    // Wide screens: the cover leans toward the pointer, and the calculation
    // passes sideways under a pinned frame.
    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const hero = root.querySelector<HTMLElement>(".tbk-hero");
      const cover = root.querySelector<HTMLElement>(".tbk-hero__cover");
      if (hero && cover) {
        gsap.set(cover, { transformPerspective: 1200 });
        const rx = gsap.quickTo(cover, "rotateX", { duration: 0.8, ease: "power3.out" });
        const ry = gsap.quickTo(cover, "rotateY", { duration: 0.8, ease: "power3.out" });
        const lean = (e: PointerEvent) => {
          const r = hero.getBoundingClientRect();
          ry(((e.clientX - r.left) / r.width - 0.5) * 14);
          rx(-((e.clientY - r.top) / r.height - 0.5) * 10);
        };
        hero.addEventListener("pointermove", lean);
        return () => hero.removeEventListener("pointermove", lean);
      }
    });

    mm.add("(min-width: 900px) and (prefers-reduced-motion: no-preference)", () => {
      const how = root.querySelector<HTMLElement>(".tbk-how");
      const track = root.querySelector<HTMLElement>(".tbk-how__track");
      const viewport = root.querySelector<HTMLElement>(".tbk-how__viewport");
      if (!how || !track || !viewport) return;
      // The plates line up as a film only while the film runs; otherwise they stack.
      how.classList.add("tbk-how--film");
      ScrollTrigger.refresh();
      const distance = () => track.scrollWidth - viewport.clientWidth;
      const pass = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: ".tbk-how",
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          // Each plate settles like a frame of film.
          snap: { snapTo: 1 / (STEPS.length - 1), duration: { min: 0.2, max: 0.6 }, ease: "power2.inOut" },
          invalidateOnRefresh: true,
        },
      });
      gsap.to(".tbk-how__progress span", {
        scaleX: 1,
        ease: "none",
        scrollTrigger: { trigger: ".tbk-how", start: "top top", end: () => `+=${distance()}`, scrub: true },
      });
      gsap.utils.toArray<HTMLElement>(".tbk-step").forEach(step => {
        gsap
          .timeline({
            scrollTrigger: { trigger: step, containerAnimation: pass, start: "left 70%", toggleActions: "play none none reverse" },
          })
          .from(step.querySelector(".tbk-step__plate"), { opacity: 0.2, scale: 0.94, duration: 0.8, ease: "power2.out" })
          .from(step.querySelectorAll(".tbk-step__text > *"), { opacity: 0, y: 20, duration: 0.6, stagger: 0.08 }, "<0.1")
          .from(
            step.querySelectorAll(".tbk-glyphs li"),
            { opacity: 0, y: 14, scale: 0.6, duration: 0.5, stagger: 0.05, ease: "back.out(2)" },
            "<0.2"
          );
      });
      return () => how.classList.remove("tbk-how--film");
    });

    // Narrow screens: each plate rises as it arrives.
    mm.add("(max-width: 899px) and (prefers-reduced-motion: no-preference)", () => {
      gsap.utils.toArray<HTMLElement>(".tbk-step").forEach(step => {
        gsap.from(step.querySelectorAll(".tbk-step__plate, .tbk-step__text > *, .tbk-glyphs li"), {
          opacity: 0,
          y: 28,
          duration: 0.8,
          stagger: 0.05,
          ease: "power3.out",
          scrollTrigger: { trigger: step, start: "top 80%", once: true },
        });
      });
    });

    return () => mm.revert();
  }, []);
  return ref;
}

export function TetradicBookPage(props: Omit<TetradicFounderEditionProps, "reducedMotion">) {
  const rootRef = useBookMotion();

  return (
    <div className="tbk" ref={rootRef}>
      {/* The chat's tape over the whole page: scanlines, grain, a slow roll. */}
      <span className="oriel-vhs" aria-hidden="true" />
      <span className="oriel-vhs-roll" aria-hidden="true" />

      {/* The title */}
      <section className="tbk-band tbk-hero">
        <div className="tbk-hero__grid">
          <div>
            <p className="tbk-eyebrow" data-rise>
              Founder Edition · One copy · 64 pages
            </p>
            <h1 className="tbk-hero__title" aria-label="The Tetradic Signature">
              {["The Tetradic", "Signature"].map(line => (
                <span key={line} className="tbk-hero__titleline" aria-hidden="true">
                  {line.split(" ").map((word, w) => (
                    // A word never breaks; only the letters inside it are animated.
                    <span key={w}>
                      {w > 0 && " "}
                      <span className="tbk-hero__word">
                        {word.split("").map((c, i) => (
                          <span key={i} className="tbk-hero__char">
                            {c}
                          </span>
                        ))}
                      </span>
                    </span>
                  ))}
                </span>
              ))}
            </h1>
            <p className="tbk-hero__line" data-rise>
              A book that is calculated, not written.
            </p>
            <p className="tbk-body" data-rise>
              Two moments of sky, twenty-six positions, one fixed framework. Printed once, with one name on the title
              page.
            </p>
            <div className="tbk-hero__actions" data-rise>
              <a className="tbk-button" href="#tetradic-founder-intake">
                Begin your edition
              </a>
              <a className="tbk-link" href="#how-it-is-calculated">
                How it is calculated ↓
              </a>
            </div>
          </div>
          <img
            className="tbk-hero__cover"
            src={`${IMG}/cover.webp`}
            alt="The cover of The Tetradic Signature: a gilt ring of sixty-four codons on black"
          />
        </div>
      </section>

      {/* The calculation, as a film of five plates */}
      <section className="tbk-band tbk-how" id="how-it-is-calculated">
        <header className="tbk-how__head">
          <p className="tbk-eyebrow">How it is calculated</p>
          <h2 className="tbk-title">Nothing is chosen. Everything is counted.</h2>
          <div className="tbk-how__progress" aria-hidden="true">
            <span />
          </div>
        </header>
        <div className="tbk-how__viewport">
          <ol className="tbk-how__track">
            {STEPS.map((s, i) => (
              <li key={s.plate} className="tbk-step">
                <img className="tbk-step__plate" src={`${IMG}/${s.plate}.webp`} alt={`Plate from Part I: ${s.title}`} loading="lazy" />
                <div className="tbk-step__text">
                  <p className="tbk-step__count tbk-mono">
                    {i + 1} / {STEPS.length}
                  </p>
                  <h3>{s.title}</h3>
                  <p className="tbk-body">{s.line}</p>
                  {s.glyphs && <Glyphs kind={s.glyphs} />}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* What only an edition answers */}
      <section className="tbk-band">
        <div className="tbk-split">
          <div data-reveal>
            <p className="tbk-eyebrow">This is a record, not a reading</p>
            <h2 className="tbk-title">The same instrument. A different answer for every person.</h2>
            <p className="tbk-body">
              Part I explains the instrument to everyone. Parts II and III exist only in your copy, and they answer
              questions like these.
            </p>
            <p className="tbk-note">It does not predict, diagnose or rank. It describes the structure, not the weather.</p>
          </div>
          <ul className="tbk-sealed">
            {SEALED.map(([q, chapter]) => (
              <li key={q}>
                <p>{q}</p>
                <span className="tbk-mono">{chapter} · sealed until your edition</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Page 30, with the reader's name */}
      <section className="tbk-band tbk-band--light">
        <header data-reveal>
          <p className="tbk-eyebrow">Page 30 of 64</p>
          <h2 className="tbk-title">Part II opens with one name.</h2>
        </header>
        <NamePage />
        <p className="tbk-note tbk-name__note">Printed once. No other copy carries it.</p>
      </section>

      {/* The order */}
      <section className="tbk-band">
        <div data-reveal>
          <TetradicFounderIntake {...props} />
        </div>
      </section>

      <section className="tbk-band tbk-band--tight tbk-close">
        <img className="tbk-close__seal" src={`${IMG}/seal.webp`} alt="" />
        <p className="tbk-hero__line">One copy exists. It is made for its Receiver.</p>
      </section>
    </div>
  );
}
