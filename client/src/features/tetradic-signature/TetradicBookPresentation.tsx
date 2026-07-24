import React, { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import {
  TETRADIC_BOOK_FRONT_MATTER,
  TETRADIC_BOOK_META,
  TETRADIC_BOOK_TETRADS,
  TETRADIC_PAGE_GRAMMAR,
} from "./tetradic-book-flatplan";
import "./tetradic-book.css";

gsap.registerPlugin(ScrollTrigger);

type TetradicBookPresentationProps = Readonly<{
  reducedMotion?: boolean;
}>;

function BookSigil() {
  return (
    <svg
      className="tetradic-book__sigil"
      viewBox="0 0 120 120"
      role="img"
      aria-label="Tetradic seal"
    >
      <circle cx="60" cy="60" r="54" fill="none" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="34" fill="none" strokeWidth="0.5" />
      <path d="M60 6v108M6 60h108" strokeWidth="0.5" />
      <path d="M60 26 76 60 60 94 44 60Z" fill="none" strokeWidth="0.75" />
      <circle cx="60" cy="60" r="3" />
    </svg>
  );
}

export function TetradicBookPresentation({
  reducedMotion = false,
}: TetradicBookPresentationProps) {
  const rootRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || reducedMotion) return;

    const ctx = gsap.context(() => {
      const reveals = gsap.utils.toArray<HTMLElement>("[data-book-reveal]", root);
      reveals.forEach(node => {
        gsap.fromTo(
          node,
          { opacity: 0, y: 36 },
          {
            opacity: 1,
            y: 0,
            duration: 1.05,
            ease: "power3.out",
            scrollTrigger: {
              trigger: node,
              start: "top 88%",
              toggleActions: "play none none none",
            },
          }
        );
      });

      const plates = gsap.utils.toArray<HTMLElement>(
        "[data-book-plate]",
        root
      );
      plates.forEach(node => {
        gsap.fromTo(
          node,
          { scale: 1.04 },
          {
            scale: 1,
            ease: "none",
            scrollTrigger: {
              trigger: node,
              start: "top bottom",
              end: "bottom top",
              scrub: true,
            },
          }
        );
      });
    }, root);

    return () => ctx.revert();
  }, [reducedMotion]);

  return (
    <section
      ref={rootRef}
      className="tetradic-book"
      data-reduced-motion={String(reducedMotion)}
      aria-label="The Tetradic Signature — book structure"
    >
      {/* Front matter */}
      <header className="tetradic-book__front" data-book-reveal>
        <p className="tetradic-book__eyebrow">
          {TETRADIC_BOOK_FRONT_MATTER.opening.eyebrow}
        </p>
        <BookSigil />
        <h2 className="tetradic-book__title">
          {TETRADIC_BOOK_META.title}
          <span>{TETRADIC_BOOK_META.subtitle}</span>
        </h2>
        <p className="tetradic-book__edition">{TETRADIC_BOOK_META.edition}</p>
        <p className="tetradic-book__verse">
          {TETRADIC_BOOK_FRONT_MATTER.opening.verse[0]}
          <br />
          <em>{TETRADIC_BOOK_FRONT_MATTER.opening.verse[1]}</em>
        </p>
        <p className="tetradic-book__lead">
          {TETRADIC_BOOK_FRONT_MATTER.opening.body}
        </p>
        <p className="tetradic-book__meta-line">
          {TETRADIC_BOOK_META.corePages} authored pages ·{" "}
          {TETRADIC_BOOK_META.tetradCount} Tetrads · four-page grammar
        </p>
      </header>

      {/* Grammar */}
      <section
        className="tetradic-book__grammar"
        aria-label="Four-page grammar"
      >
        <div className="tetradic-book__grammar-inner" data-book-reveal>
          <p className="tetradic-book__eyebrow">Invariant grammar</p>
          <h3 className="tetradic-book__section-title">
            Every Tetrad is four pages.
          </h3>
          <p className="tetradic-book__section-copy">
            {TETRADIC_BOOK_FRONT_MATTER.grammarNote}
          </p>
          <ol className="tetradic-book__grammar-grid">
            {TETRADIC_PAGE_GRAMMAR.map(item => (
              <li
                key={item.role}
                className={`tetradic-book__grammar-card tetradic-book__grammar-card--${item.ground === "Obsidian" ? "obsidian" : "ivory"}`}
              >
                <span className="tetradic-book__role">{item.role}</span>
                <strong>{item.name}</strong>
                <p>{item.purpose}</p>
                <span className="tetradic-book__copy-band">{item.copy}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Chapters */}
      <div className="tetradic-book__chapters">
        {TETRADIC_BOOK_TETRADS.map(tetrad => (
          <article
            key={tetrad.number}
            className="tetradic-book__tetrad"
            id={`tetrad-${tetrad.numberLabel}`}
            aria-labelledby={`tetrad-title-${tetrad.numberLabel}`}
          >
            <div
              className="tetradic-book__tetrad-hero"
              data-book-plate
              data-book-reveal
            >
              <div className="tetradic-book__tetrad-hero-inner">
                <p className="tetradic-book__tetrad-index">
                  Tetrad {tetrad.numberLabel}
                </p>
                <h3
                  className="tetradic-book__tetrad-title"
                  id={`tetrad-title-${tetrad.numberLabel}`}
                >
                  {tetrad.title}
                </h3>
                <span className="tetradic-book__rule" />
                <p className="tetradic-book__tetrad-purpose">{tetrad.purpose}</p>
              </div>
            </div>

            <div className="tetradic-book__spread" data-book-reveal>
              {tetrad.pages.map(page => (
                <div
                  key={page.contentPage}
                  className={`tetradic-book__page tetradic-book__page--${page.role === "A" || page.role === "D" ? "obsidian" : "ivory"}`}
                  data-role={page.role}
                >
                  <div className="tetradic-book__page-top">
                    <span className="tetradic-book__page-role">{page.role}</span>
                    <span className="tetradic-book__page-num">
                      {String(page.contentPage).padStart(2, "0")}
                    </span>
                  </div>
                  <h4 className="tetradic-book__page-title">{page.title}</h4>
                  <p className="tetradic-book__page-function">{page.function}</p>
                  <p className="tetradic-book__page-foot">
                    {
                      TETRADIC_PAGE_GRAMMAR.find(g => g.role === page.role)
                        ?.name
                    }
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>

      {/* Closing + purchase */}
      <footer className="tetradic-book__close" data-book-reveal>
        <BookSigil />
        <h3 className="tetradic-book__close-title">
          {TETRADIC_BOOK_FRONT_MATTER.closing.heading}
        </h3>
        <p className="tetradic-book__close-body">
          {TETRADIC_BOOK_FRONT_MATTER.closing.body}
        </p>
        <a
          className="tetradic-book__cta"
          href={TETRADIC_BOOK_META.purchaseHref}
          target="_blank"
          rel="noopener noreferrer"
        >
          <span>{TETRADIC_BOOK_META.purchaseLabel}</span>
        </a>
        <p className="tetradic-book__close-note">
          {TETRADIC_BOOK_META.price} · {TETRADIC_BOOK_META.priceNote} ·{" "}
          {TETRADIC_BOOK_META.delivery}
        </p>
      </footer>
    </section>
  );
}
