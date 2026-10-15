import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import type { TetradicFounderEditionProps } from "./TetradicFounderEdition";
import { TetradicFounderIntake } from "./TetradicFounderIntake";
import "./tetradic-book-page.css";

gsap.registerPlugin(ScrollTrigger);

/**
 * The book page, told the way the book is made: obsidian plates and ivory
 * vellum pages, gilt and bronze ink, Garamond only, hairline double frames,
 * exact numbers and a quiet voice. Built from "The Tetradic Signature,
 * Explained" (Vos, 2026-10). The order form at the end is unchanged.
 */

const IMG = "/assets/tetradic-signature/explained";

const BODIES = [
  ["Sun · Earth", "100 each"],
  ["Moon", "70"],
  ["North Node · South Node", "60 each"],
  ["Mercury", "50"],
  ["Venus", "45"],
  ["Mars", "40"],
  ["Jupiter · Saturn", "35 each"],
  ["Uranus · Neptune · Pluto", "30 each"],
  ["One layer", "685"],
  ["Both layers", "1,370"],
] as const;

const CENTRES = [
  ["I", "Origin", "the first impulse; the beginning of form"],
  ["II", "Mental", "thinking in loops; forming patterns"],
  ["III", "Collapse", "expression; turning ideas into speech and action"],
  ["IV", "Saturation", "physical stability, vitality, sustained energy"],
  ["V", "Bridge", "identity; the sense of self and direction"],
  ["VI", "Becoming", "emotional movement; the pull toward what comes next"],
  ["VII", "Return", "instinct, survival, correction and adaptation"],
  ["VIII", "Omega", "will, commitment, integration of experience"],
] as const;

const QUARTERS = [
  ["First", "Initiation", "RC51"],
  ["Second", "Civilisation", "RC53"],
  ["Third", "Duality", "RC57"],
  ["Fourth", "Mutation", "RC54"],
] as const;

/** Pages 1–64 in five blocks, as the flatplan bar shows them. */
const FLATPLAN = [
  { pages: "1–6", block: "Front matter", what: "The Receiver's seal, title, colophon, a two-page opening letter", span: 6, tone: "#d6c7a6" },
  { pages: "7–28", block: "I · The System", what: "How the instrument works. Ten chapters, about no one", span: 22, tone: "#e6dbc4" },
  { pages: "29–52", block: "II · The Record", what: "The same chapters with the Receiver's own figures, plus one more", span: 24, tone: "#b3955f" },
  { pages: "53–62", block: "III · What I Saw", what: "Four chapters in the author's own voice", span: 10, tone: "#262019" },
  { pages: "63–64", block: "Back matter", what: "The archive seal and the technical colophon", span: 2, tone: "#7d6233" },
] as const;

const PART_ONE = [
  "Two Moments", "Eighty-Eight Degrees", "The Field of Sixty-Four", "Four Quarters", "Thirteen Bodies",
  "Two Layers", "Eight Centres", "What Closes a Circuit", "Pillar and Antenna", "What the System Does Not Say",
];
const PART_TWO = [
  "Your Two Moments", "Your Descent", "Your Field", "Your Quarters", "The Twenty-Six", "Your Layers in Mirror",
  "Your Centres", "Your Four Links", "Your Pillars and Antennas", "Your Role Fields", "The Central Contradiction",
];

const LIMITS = [
  ["It does not predict.", "No futures, no choices made for you."],
  ["It does not diagnose.", "Proximity is not cause. It replaces no care."],
  ["It does not rank.", "Defined is not better than open."],
  ["It does not prove itself.", "The positions can be checked. The meanings are a framework."],
  ["It does not use your resistance as evidence.", ""],
  ["It describes the structure, not the weather.", ""],
] as const;

const NUMBERS = [
  ["26", "positions, 13 in each layer"],
  ["19 / 64", "codons occupied; 45 hold nothing"],
  ["460", "of 1,370 units in one centre, Bridge"],
  ["5 · 3", "centres defined · centres open"],
  ["4 / 32", "links complete; 13 held at one end"],
  ["1", "position read the same in both layers: Uranus, 29-B"],
  ["Resonator", "architecture type: Saturation is defined"],
  ["Emotional", "decision compass: Becoming is defined"],
] as const;

const INSIDE = [
  ["p30-the-record", "Page 30", "Her name returns, with weight"],
  ["ch2-2-descent", "Page 34", "Her 88°, shown on the Sun's path"],
  ["ch3-2-watch", "Page 58", "Three experiments that can prove the author wrong"],
  ["p63-archive-seal", "Page 63", "The archive seal certifies the calculation"],
] as const;

/**
 * The page's motion, quiet like the book: the title set letter by letter, each
 * band rising once into place, the real pages drifting a little against the
 * scroll, the wheel of sixty-four turning with it, the flatplan filling block
 * by block, and the numbers counting up to their value. Nothing moves under
 * reduced motion; everything is visible without JavaScript.
 */
function useBookMotion() {
  const ref = useRef<HTMLDivElement | null>(null);
  useLayoutEffect(() => {
    const root = ref.current;
    if (!root || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ctx = gsap.context(() => {
      gsap.from(".tbk-hero__char", {
        opacity: 0,
        yPercent: 40,
        filter: "blur(6px)",
        duration: 1.1,
        ease: "power3.out",
        stagger: 0.035,
        delay: 0.2,
      });
      gsap.from(".tbk-hero .tbk-rule", { scaleX: 0, duration: 1.4, ease: "power2.inOut", delay: 0.9 });

      gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach(el => {
        if (el.closest(".tbk-hero")) return;
        gsap.from(el, {
          opacity: 0,
          y: 48,
          duration: 1.1,
          ease: "power3.out",
          scrollTrigger: { trigger: el, start: "top 84%", once: true },
        });
      });

      gsap.utils.toArray<HTMLElement>(".tbk-split .tbk-page").forEach(img => {
        gsap.fromTo(
          img,
          { yPercent: 6 },
          { yPercent: -6, ease: "none", scrollTrigger: { trigger: img, start: "top bottom", end: "bottom top", scrub: true } }
        );
      });

      gsap.to(".tbk-wheel", {
        rotate: 45,
        ease: "none",
        scrollTrigger: { trigger: ".tbk-wheel", start: "top bottom", end: "bottom top", scrub: true },
      });

      gsap.from(".tbk-flatplan span", {
        scaleX: 0,
        duration: 0.9,
        ease: "power2.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".tbk-flatplan", start: "top 86%", once: true },
      });

      gsap.utils.toArray<HTMLElement>("[data-count]").forEach(el => {
        const target = Number(el.dataset.count);
        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 1.6,
          ease: "power2.out",
          scrollTrigger: { trigger: el, start: "top 88%", once: true },
          onUpdate: () => {
            el.textContent = Math.round(counter.value).toLocaleString("en-US");
          },
        });
      });

      gsap.from(".tbk-inside li", {
        opacity: 0,
        y: 36,
        duration: 1,
        ease: "power3.out",
        stagger: 0.12,
        scrollTrigger: { trigger: ".tbk-inside", start: "top 82%", once: true },
      });
    }, root);
    return () => ctx.revert();
  }, []);
  return ref;
}

function Page({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return <img className={`tbk-page ${className}`} src={`${IMG}/${src}.webp`} alt={alt} loading="lazy" decoding="async" />;
}

export function TetradicBookPage(props: Omit<TetradicFounderEditionProps, "reducedMotion">) {
  const rootRef = useBookMotion();

  return (
    <div className="tbk" ref={rootRef}>
      {/* 01 · The title */}
      <section className="tbk-band tbk-band--obsidian tbk-hero">
        <div className="tbk-frame" data-reveal>
          <img className="tbk-hero__seal" src={`${IMG}/seal.webp`} alt="" />
          <p className="tbk-eyebrow">Founder Edition · One copy</p>
          <h1 className="tbk-hero__title" aria-label="The Tetradic Signature">
            {["The Tetradic", "Signature"].map(line => (
              <span key={line} className="tbk-hero__titleline" aria-hidden="true">
                {line.split(" ").map((word, w) => (
                  // A word never breaks; only the letters inside it are animated.
                  <span key={w} className="tbk-hero__word">
                    {word.split("").map((c, i) => (
                      <span key={i} className="tbk-hero__char">
                        {c}
                      </span>
                    ))}
                  </span>
                ))}
              </span>
            ))}
          </h1>
          <span className="tbk-rule" aria-hidden="true" />
          <p className="tbk-hero__line">A book that is calculated, not written.</p>
          <a className="tbk-button tbk-button--gilt" href="#tetradic-founder-intake">
            Begin your edition
          </a>
        </div>
      </section>

      {/* 02 · What it is */}
      <section className="tbk-band tbk-band--ivory">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">What it is</p>
            <h2 className="tbk-title">A printed book about one person, made from one calculation</h2>
            <dl className="tbk-defs">
              <div>
                <dt>One person</dt>
                <dd>
                  Each edition is made for a single <strong>Receiver</strong>. Their name is on the title page and
                  the archive seal.
                </dd>
              </div>
              <div>
                <dt>One record</dt>
                <dd>Calculated once, from two astronomical moments and a fixed framework. Nothing is chosen.</dd>
              </div>
              <div>
                <dt>One copy</dt>
                <dd>64 printed pages, US Letter, in three parts. Only one copy exists.</dd>
              </div>
            </dl>
          </div>
          <Page src="cover" alt="The cover of a Founder Edition: The Tetradic Signature" className="tbk-page--cover" />
        </div>
      </section>

      {/* 03 · The colophon */}
      <section className="tbk-band tbk-band--obsidian tbk-quote">
        <div data-reveal>
          <p className="tbk-eyebrow">The first line of the colophon</p>
          <p className="tbk-quote__line">
            This is a record,
            <br />
            not a reading.
          </p>
          <span className="tbk-rule" aria-hidden="true" />
          <p className="tbk-body tbk-center">
            Nothing in it was chosen. Nothing in it predicts. Where the record is exact, it says so. Where it is
            interpretation, it names the evidence it rests on.
          </p>
        </div>
      </section>

      {/* 04 · Two layers */}
      <section className="tbk-band tbk-band--ivory">
        <div data-reveal>
          <p className="tbk-eyebrow">The premise</p>
          <h2 className="tbk-title">You were not born once. The sky was read twice.</h2>
          <div className="tbk-pair">
            <article className="tbk-box">
              <p className="tbk-eyebrow">Layer 1 · Conscious</p>
              <h3>The hour of birth</h3>
              <p className="tbk-body">
                The positions in the sky at the moment you were born. In the book: <em>what you can describe</em>.
              </p>
            </article>
            <article className="tbk-box tbk-box--tinted">
              <p className="tbk-eyebrow">Layer 2 · Design</p>
              <h3>About ninety days earlier</h3>
              <p className="tbk-body">
                The instant the Sun stood exactly 88° behind its birth position. No one witnessed it. In the book:{" "}
                <em>what you were built from</em>.
              </p>
            </article>
          </div>
          <p className="tbk-note">The book always reads the two layers side by side.</p>
        </div>
      </section>

      {/* 05 · Eighty-eight degrees */}
      <section className="tbk-band tbk-band--obsidian">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">Eighty-eight degrees</p>
            <h2 className="tbk-title">The second moment is not chosen. It is found.</h2>
            <p className="tbk-body">
              The engine searches backwards from the birth until the Sun stands exactly 88° earlier on its path. In
              the Founder Edition:
            </p>
            <div className="tbk-calc">
              <p className="tbk-mono">85.068289° − 357.068289°</p>
              <p className="tbk-mono tbk-calc__result">= 88.000000°</p>
              <p className="tbk-body">Found 90 days, 13 hours, 44 minutes and 44 seconds before the birth.</p>
            </div>
          </div>
          <Page src="ch2-2-descent" alt="Chapter II.2, Your Descent: the solar arc with both positions" />
        </div>
      </section>

      {/* 06 · The field of sixty-four */}
      <section className="tbk-band tbk-band--ivory">
        <div className="tbk-split tbk-split--wheel" data-reveal>
          <img className="tbk-wheel" src={`${IMG}/codon-wheel.svg`} alt="A ring cut into sixty-four equal codons, in four quarters" />
          <div>
            <p className="tbk-eyebrow">The field of sixty-four</p>
            <h2 className="tbk-title">The circle is cut into 64 named codons</h2>
            <p className="tbk-body">They run in a fixed order, the Mandala sequence, in four quarters of sixteen.</p>
            <table className="tbk-table">
              <thead>
                <tr>
                  <th>Quarter</th>
                  <th>Name</th>
                  <th>Begins with</th>
                </tr>
              </thead>
              <tbody>
                {QUARTERS.map(([q, n, b]) => (
                  <tr key={q}>
                    <td>{q}</td>
                    <td>{n}</td>
                    <td className="tbk-mono">{b}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="tbk-body">
              Each codon has four facets: <strong>A</strong> Somatic, <strong>B</strong> Relational,{" "}
              <strong>C</strong> Cognitive, <strong>D</strong> Transpersonal. So a position reads like{" "}
              <strong>29-B</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* 07 · Thirteen bodies */}
      <section className="tbk-band tbk-band--obsidian">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">Thirteen bodies</p>
            <h2 className="tbk-title">Thirteen bodies, read twice. They do not count equally.</h2>
            <p className="tbk-body">
              Each body is read in both layers: 13 × 2 = <strong>26 positions</strong>. Each has a fixed weight, so
              every record totals exactly <strong>1,370 units</strong>. The record is the pattern of where that
              weight falls.
            </p>
          </div>
          <table className="tbk-table tbk-table--dark">
            <thead>
              <tr>
                <th>Body</th>
                <th className="tbk-num">Weight</th>
              </tr>
            </thead>
            <tbody>
              {BODIES.map(([b, w]) => (
                <tr key={b}>
                  <td>{b}</td>
                  <td className="tbk-num">{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 08 · Eight centres */}
      <section className="tbk-band tbk-band--ivory">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">Eight centres</p>
            <h2 className="tbk-title">Positions are not scattered. They collect.</h2>
            <p className="tbk-body">
              The 64 codons are gathered into eight centres of eight. A centre's weight is simply the sum of the
              units that landed in it.
            </p>
          </div>
          <table className="tbk-table">
            <thead>
              <tr>
                <th>No.</th>
                <th>Centre</th>
                <th>What it organises</th>
              </tr>
            </thead>
            <tbody>
              {CENTRES.map(([n, c, w]) => (
                <tr key={n}>
                  <td>{n}</td>
                  <td>{c}</td>
                  <td>{w}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 09 · Circuits */}
      <section className="tbk-band tbk-band--obsidian">
        <div data-reveal>
          <p className="tbk-eyebrow">Circuits, pillars and antennas</p>
          <h2 className="tbk-title">A position alone does nothing. Two positions can close a circuit.</h2>
          <div className="tbk-trio">
            <article className="tbk-box">
              <p className="tbk-mono tbk-gilt">32 links</p>
              <h3>Both ends, or nothing</h3>
              <p className="tbk-body">
                A link is a fixed pair of codons. It is complete only when both ends are occupied. Half a link
                behaves like no link.
              </p>
            </article>
            <article className="tbk-box">
              <p className="tbk-mono tbk-gilt">Defined</p>
              <h3>The pillar</h3>
              <p className="tbk-body">
                A centre touched by a complete link. It generates its own steady state, whoever else is in the room.
              </p>
            </article>
            <article className="tbk-box tbk-box--open">
              <p className="tbk-mono tbk-gilt">Open</p>
              <h3>The antenna</h3>
              <p className="tbk-body">Every other centre. It receives. Much of what passes through it comes from outside.</p>
            </article>
          </div>
          <p className="tbk-body">
            The pattern decides two more things: the <strong>architecture type</strong> (Mirror, Resonator, Catalyst
            or Harmonizer) and the <strong>decision compass</strong>. Neither condition is better.
          </p>
        </div>
      </section>

      {/* 10 · The book */}
      <section className="tbk-band tbk-band--ivory">
        <div data-reveal>
          <p className="tbk-eyebrow">The book</p>
          <h2 className="tbk-title">Sixty-four pages, four signatures of sixteen</h2>
          <div className="tbk-flatplan" aria-hidden="true">
            {FLATPLAN.map(f => (
              <span key={f.block} style={{ flexGrow: f.span, background: f.tone }} />
            ))}
          </div>
          <table className="tbk-table">
            <thead>
              <tr>
                <th>Pages</th>
                <th>Block</th>
                <th>What is in it</th>
              </tr>
            </thead>
            <tbody>
              {FLATPLAN.map(f => (
                <tr key={f.block}>
                  <td className="tbk-mono">{f.pages}</td>
                  <td>{f.block}</td>
                  <td>{f.what}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 11 · The three parts */}
      <section className="tbk-band tbk-band--ivory tbk-band--seam">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">Part I · Pages 7–28</p>
            <h2 className="tbk-title">The System</h2>
            <p className="tbk-quote__aside">“Nothing in this half is about you.”</p>
            <p className="tbk-body">
              First the reader learns the instrument: how it counts, what it names, where it stops. Written once, it
              serves every edition.
            </p>
            <ol className="tbk-chapters">
              {PART_ONE.map(c => (
                <li key={c}>{c}</li>
              ))}
            </ol>
          </div>
          <Page src="ch1-2-eighty-eight" alt="Chapter I.2, Eighty-Eight Degrees" />
        </div>
      </section>

      <section className="tbk-band tbk-band--obsidian">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">Part II · Pages 29–52</p>
            <h2 className="tbk-title">The Record</h2>
            <p className="tbk-body">
              The same ten chapters again, now with the Receiver's own figures. First the rule, then the record. Every
              chapter ends with an <strong>EVIDENCE</strong> line naming exactly where its numbers come from.
            </p>
            <ol className="tbk-chapters">
              {PART_TWO.map((c, i) => (
                <li key={c} className={i === PART_TWO.length - 1 ? "tbk-gilt" : undefined}>
                  {c}
                </li>
              ))}
            </ol>
          </div>
          <Page src="ch2-7-centres" alt="Chapter II.7, Your Centres: the centre weights of one record" />
        </div>
      </section>

      <section className="tbk-band tbk-band--ivory">
        <div className="tbk-split" data-reveal>
          <div>
            <p className="tbk-eyebrow">Part III · Pages 53–62</p>
            <h2 className="tbk-title">What I Saw</h2>
            <p className="tbk-body">
              The only part where the author speaks rather than reports, signed <em>Vos Arkana</em>. Held lightly,
              offered freely, and open to being wrong.
            </p>
            <div className="tbk-box tbk-box--tinted">
              <p className="tbk-eyebrow">Each experiment has three parts</p>
              <p className="tbk-body">
                <strong>Try</strong> · something to do for a few weeks
                <br />
                <strong>Observe</strong> · what to notice
                <br />
                <strong>Falsify</strong> · the result that would prove the reading wrong
              </p>
            </div>
            <p className="tbk-note">What I Noticed · What I Would Watch · What Would Prove Me Wrong · The Last Thing</p>
          </div>
          <Page src="ch3-2-watch" alt="Chapter III.2, What I Would Watch: three experiments" />
        </div>
      </section>

      {/* 12 · Limits */}
      <section className="tbk-band tbk-band--obsidian">
        <div data-reveal>
          <p className="tbk-eyebrow">What the system does not say</p>
          <h2 className="tbk-title">An instrument becomes credible when it names its limits.</h2>
          <ul className="tbk-limits">
            {LIMITS.map(([head, rest]) => (
              <li key={head}>
                <span className="tbk-gilt">{head}</span> {rest}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 13 · In numbers */}
      <section className="tbk-band tbk-band--ivory">
        <div data-reveal>
          <p className="tbk-eyebrow">The Founder Edition, in numbers</p>
          <h2 className="tbk-title">What one real record holds</h2>
          <dl className="tbk-numbers">
            {NUMBERS.map(([value, label]) => (
              <div key={label}>
                {/^\d+$/.test(value) ? <dt data-count={value}>{value}</dt> : <dt>{value}</dt>}
                <dd>{label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* 14 · Inside the book */}
      <section className="tbk-band tbk-band--obsidian">
        <div data-reveal>
          <p className="tbk-eyebrow">Inside the book</p>
          <ul className="tbk-inside">
            {INSIDE.map(([src, page, line]) => (
              <li key={src}>
                <Page src={src} alt={`${page}: ${line}`} />
                <p className="tbk-eyebrow">{page}</p>
                <p className="tbk-body">{line}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* 15 · The order */}
      <section className="tbk-band tbk-band--ivory">
        <div data-reveal>
          <TetradicFounderIntake {...props} />
        </div>
      </section>

      {/* 16 · In one sentence */}
      <section className="tbk-band tbk-band--obsidian tbk-hero tbk-hero--close">
        <div className="tbk-frame" data-reveal>
          <p className="tbk-eyebrow">In one sentence</p>
          <p className="tbk-quote__line tbk-quote__line--upright">
            Two moments, one fixed framework, sixty-four pages, and a single copy, made for one person.
          </p>
          <span className="tbk-rule" aria-hidden="true" />
          <p className="tbk-hero__line">One copy exists. It was made for its Receiver.</p>
          <img className="tbk-hero__seal tbk-hero__seal--small" src={`${IMG}/seal.webp`} alt="" />
        </div>
      </section>
    </div>
  );
}
