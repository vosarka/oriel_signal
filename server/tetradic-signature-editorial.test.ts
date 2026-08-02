import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TetradicSignatureEditorial } from "../client/src/features/tetradic-signature/TetradicSignatureEditorial";
import {
  TETRADIC_CHAPTER_SCROLL,
  TETRADIC_SCROLL_PHASES,
  TETRADIC_SCROLL_SCRUB,
  TETRADIC_TOTAL_VH,
} from "../client/src/features/tetradic-signature/tetradic-signature-scroll-config";

const CHAPTERS = [
  {
    number: "01",
    title: "THE THRESHOLD",
    statement: "Every architecture begins with a point of entry.",
  },
  {
    number: "02",
    title: "THE WHOLE ARCHITECTURE",
    statement: "Before you meet the parts, see the pattern.",
  },
  {
    number: "03",
    title: "THE TWO TIMINGS",
    statement: "You were calculated twice: once in light, once beneath it.",
  },
  {
    number: "04",
    title: "THE MANDALA",
    statement: "Twenty-six signals enter sixty-four possible languages.",
  },
  {
    number: "05",
    title: "THE EIGHT CENTERS",
    statement: "The wheel becomes a body.",
  },
  {
    number: "06",
    title: "THE CIRCUITRY",
    statement: "A center is potential. A completed link becomes flow.",
  },
  {
    number: "07",
    title: "CONSCIOUS ACTIVATION ATLAS",
    statement: "This is the self you recognize.",
  },
  {
    number: "08",
    title: "DESIGN ACTIVATION ATLAS",
    statement: "This is the intelligence your body carries before thought.",
  },
  {
    number: "09",
    title: "IDENTITY SYNTHESIS",
    statement: "Where both layers converge, a role emerges.",
  },
  {
    number: "10",
    title: "SHADOW AND GIFT",
    statement: "Every coherent gift casts a predictable distortion.",
  },
  {
    number: "11",
    title: "SOMATIC PRACTICE",
    statement: "A map becomes useful only when it enters the body.",
  },
  {
    number: "12",
    title: "INTEGRATION AND SEAL",
    statement: "The reading ends where observation begins.",
  },
] as const;

const SOURCE_PATHS = [
  "client/src/features/tetradic-signature/TetradicSignatureEditorial.tsx",
  "client/src/features/tetradic-signature/TetradicEditorialVisuals.tsx",
  "client/src/features/tetradic-signature/tetradic-signature-scroll-config.ts",
  "client/src/features/tetradic-signature/useTetradicEditorialScroll.ts",
  "client/src/pages/TetradicSignatureEditorialExperience.tsx",
] as const;

const SCROLL_HOOK_PATH =
  "client/src/features/tetradic-signature/useTetradicEditorialScroll.ts";
const EDITORIAL_CSS_PATH =
  "client/src/features/tetradic-signature/tetradic-signature-editorial.css";

function readSource(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

function renderEditorial() {
  return renderToStaticMarkup(createElement(TetradicSignatureEditorial));
}

describe("simplified Tetradic Signature editorial experience", () => {
  it("renders exactly twelve semantic chapters in canonical order", () => {
    const markup = renderEditorial();
    const renderedIds = [
      ...markup.matchAll(/<article\b[^>]*\bid="(tetrad-\d{2})"/g),
    ].map(match => match[1]);

    expect(renderedIds).toEqual(
      CHAPTERS.map(chapter => `tetrad-${chapter.number}`)
    );
    expect(markup).toContain('id="tetradic-interior-start"');

    let previousPosition = -1;
    CHAPTERS.forEach(chapter => {
      const id = `tetrad-${chapter.number}`;
      const position = markup.indexOf(`id="${id}"`);
      const articleEnd = markup.indexOf("</article>", position);
      const chapterMarkup = markup.slice(position, articleEnd);
      const articleTag = markup.match(
        new RegExp(`<article\\b[^>]*\\bid="${id}"[^>]*>`)
      )?.[0];

      expect(position).toBeGreaterThan(previousPosition);
      expect(chapterMarkup).toContain(`TETRAD ${chapter.number} / 12`);
      expect(chapterMarkup).toContain(chapter.title);
      expect(chapterMarkup).toContain(chapter.statement);
      expect(chapterMarkup).toContain(`/assets/tetrads/${chapter.number}.png`);
      expect(articleTag).toBeTruthy();
      expect(articleTag).not.toContain('aria-hidden="true"');

      previousPosition = position;
    });
  });

  it("exposes only the approved redacted public sample record", () => {
    const markup = renderEditorial();

    expect(markup).toContain("RECEIVER 001");
    expect(markup).toContain("ILLUSTRATIVE SAMPLE");
    expect(markup).toContain("RECORD STATUS");
    expect(markup).toContain("INITIALIZED");
    expect(markup).toContain("BIRTH RECORD");
    expect(markup).toContain("COORDINATES");
    expect(markup.match(/REDACTED/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markup).toContain("ARCHIVE ID");
    expect(markup).toContain("ORL-TDS-001");

    expect(markup).not.toContain("DEMO-ARCHIVE-001");
    expect(markup).not.toContain("ARCHIVE SAMPLE 001");
    expect(markup).not.toContain("CALIBRATION 00.00");
    expect(markup).not.toContain("PROTOTYPE 001");
  });

  it("renders the synthesis, purchase destination, and accessible replay control", () => {
    const markup = renderEditorial();
    const source = readSource(
      "client/src/features/tetradic-signature/TetradicSignatureEditorial.tsx"
    );
    const scrollSource = readSource(SCROLL_HOOK_PATH);

    expect(markup).toContain("TWELVE FIELDS.");
    expect(markup).toContain("ONE ARCHITECTURE.");
    expect(markup).toContain(
      "Your signature exists in the relationship between timing, activation, structure, tension, embodiment, and integration."
    );
    expect(markup).toContain("RECEIVE YOUR");
    expect(markup).toContain("TETRADIC SIGNATURE");
    expect(markup).toContain(
      "A founder-curated reading of the resonance architecture encoded at your exact moment of arrival."
    );

    const purchaseLink = markup.match(
      /<a\b[^>]*href="\/tetradic-signature"[^>]*>[\s\S]*?BUY THE FOUNDER EDITION[\s\S]*?<\/a>/
    )?.[0];
    expect(purchaseLink).toBeTruthy();

    const replayButton = markup.match(
      /<button\b[^>]*>[\s\S]*?EXPLORE THE SAMPLE AGAIN[\s\S]*?<\/button>/
    )?.[0];
    expect(replayButton).toBeTruthy();
    expect(replayButton).toContain('aria-controls="tetradic-interior-reader"');
    expect(markup).toContain('href="#tetradic-interior-start"');
    expect(markup).toMatch(
      /<section\b[^>]*class="tetradic-editorial__purchase"[^>]*aria-hidden="true"[^>]*inert=""/
    );
    expect(scrollSource).toContain("window.scrollTo");
    expect(scrollSource).toContain("focus({ preventScroll: true })");
    expect(source).toContain("tetradic-interior-start");
  });

  it("allocates the complete 3,100vh experience across explicit scroll phases", () => {
    const expectedPhases = [
      { id: "reveal", vh: 180 },
      { id: "closed-book", vh: 140 },
      { id: "book-opening", vh: 260 },
      { id: "interior-transition", vh: 140 },
      { id: "tetrads", vh: 1800 },
      { id: "conclusion", vh: 160 },
      { id: "book-closing", vh: 280 },
      { id: "purchase", vh: 140 },
    ];

    expect(
      TETRADIC_SCROLL_PHASES.map(phase => ({ id: phase.id, vh: phase.vh }))
    ).toEqual(expectedPhases);
    expect(
      TETRADIC_SCROLL_PHASES.reduce((total, phase) => total + phase.vh, 0)
    ).toBe(3100);
    expect(TETRADIC_TOTAL_VH).toBe(3100);
    expect(TETRADIC_TOTAL_VH).toBeGreaterThanOrEqual(2400);
    expect(TETRADIC_SCROLL_SCRUB).toBeGreaterThanOrEqual(0.8);
    expect(TETRADIC_SCROLL_SCRUB).toBeLessThanOrEqual(1.2);

    const phaseSections = [
      ...renderEditorial().matchAll(/data-scroll-phase="([a-z-]+)"/g),
    ].map(match => match[1]);
    expect(phaseSections).toEqual(expectedPhases.map(phase => phase.id));
  });

  it("gives every tetrad its own 150vh section with a 90/60 reading rhythm", () => {
    expect(TETRADIC_CHAPTER_SCROLL).toEqual({
      count: 12,
      sectionVh: 150,
      stableVh: 90,
      turnVh: 60,
    });
    expect(
      TETRADIC_CHAPTER_SCROLL.stableVh + TETRADIC_CHAPTER_SCROLL.turnVh
    ).toBe(TETRADIC_CHAPTER_SCROLL.sectionVh);
    expect(
      TETRADIC_CHAPTER_SCROLL.count * TETRADIC_CHAPTER_SCROLL.sectionVh
    ).toBe(1800);

    const markup = renderEditorial();
    const chapterSections = [
      ...markup.matchAll(/data-tetrad-section="(tetrad-\d{2})"/g),
    ].map(match => match[1]);

    expect(chapterSections).toEqual(
      CHAPTERS.map(chapter => `tetrad-${chapter.number}`)
    );
  });

  it("uses independent ScrollTriggers with refresh-safe cleanup", () => {
    const source = readSource(SCROLL_HOOK_PATH);

    expect(source).toMatch(/from\s+["']gsap["']/);
    expect(source).toMatch(/from\s+["']gsap\/ScrollTrigger["']/);
    expect(source).toContain("gsap.registerPlugin(ScrollTrigger)");
    expect(source).toContain("[data-scroll-phase]");
    expect(source).toContain("[data-tetrad-section]");
    expect(source).toContain(
      'desktop: "(min-width: 901px) and (orientation: landscape)"'
    );
    expect(
      source.match(/scrollTrigger:\s*scrollTriggerFor/g)?.length
    ).toBeGreaterThanOrEqual(7);
    expect(source).toContain("scrub: TETRADIC_SCROLL_SCRUB");
    expect(source).toContain("invalidateOnRefresh: true");
    expect(source).toContain("ScrollTrigger.refresh()");
    expect(source).toMatch(/(?:\.kill\(\)|(?:media|contextRoot)\.revert\(\))/);
  });

  it("does not place the sticky stage inside a nested overflow scroller", () => {
    const cssSource = readSource(EDITORIAL_CSS_PATH);
    const deliberateController = cssSource.slice(
      cssSource.indexOf("/* Deliberate-scroll production controller.")
    );

    expect(deliberateController).toMatch(
      /\.tetradic-editorial\s*\{[^}]*overflow:\s*visible;/s
    );
    expect(deliberateController).not.toMatch(
      /overflow-[xy]:\s*(?:clip|hidden)/
    );
    expect(cssSource).toMatch(
      /body:has\(\.tetradic-editorial\)\s*\{[^}]*overflow-x:\s*clip;[^}]*overflow-y:\s*visible;/s
    );
  });

  it("keeps natural browser scrolling and the mounted experience free of Lenis and R3F", () => {
    const sources = SOURCE_PATHS.map(
      path => `${path}\n${readSource(path)}`
    ).join("\n");
    const pageSource = readSource(
      "client/src/pages/TetradicSignatureEditorialExperience.tsx"
    );
    const forbiddenDependencies = [
      ["React Three Fiber", /@react-three\/fiber/],
      ["React Three Drei", /@react-three\/drei/],
      ["Three.js", /from\s+["']three["']/],
      ["WebGL", /\bWebGL(?:Renderer)?\b/],
      ["Lenis", /\bLenis\b/],
      ["canvas scene", /<(?:canvas|Canvas)\b/],
      [
        "legacy Tetradic scene",
        /TetradicSignatureV2|TetradicBookScene|useTetradicV2Progress|useTetradicScrollProgress/,
      ],
    ] as const;

    expect(pageSource).toContain("TetradicSignatureEditorial");
    forbiddenDependencies.forEach(([label, pattern]) => {
      expect(
        sources,
        `${label} must stay outside the editorial mount`
      ).not.toMatch(pattern);
    });
    expect(sources).not.toMatch(/addEventListener\(\s*["']wheel["']/);
    expect(sources).not.toMatch(/onWheel\s*=/);
    expect(sources).not.toMatch(/preventDefault\(\)/);
    expect(renderEditorial()).not.toContain("<canvas");
  });

  it("keeps one controlled CSS 3D page layer for reversible page turns", () => {
    const markup = renderEditorial();
    const cssSource = readSource(EDITORIAL_CSS_PATH);

    expect(
      markup.match(/class="tetradic-editorial__turn-sheet"/g)
    ).toHaveLength(1);
    expect(cssSource).toMatch(/perspective:\s*[^;]+;/);
    expect(cssSource).toContain("transform-style: preserve-3d");
    expect(cssSource).toMatch(/transform-origin:\s*0\s+50%/);
    expect(cssSource).toMatch(/rotateY\(var\(--turn-angle\)\)/);
    expect(cssSource).toContain("backface-visibility: hidden");
    expect(cssSource).toContain("tetradic-editorial__turn-shadow");
    expect(cssSource).toContain("tetradic-editorial__turn-highlight");
  });

  it("preserves all content and real scroll sections for reduced motion", () => {
    const markup = renderEditorial();
    const hookSource = readSource(SCROLL_HOOK_PATH);
    const cssSource = readSource(EDITORIAL_CSS_PATH);

    expect(markup.match(/<article\b[^>]*\bid="tetrad-\d{2}"/g)).toHaveLength(
      12
    );
    expect(markup).toContain('data-scroll-phase="reveal"');
    expect(markup).toContain('data-scroll-phase="purchase"');
    expect(hookSource).toContain("reducedMotion");
    expect(hookSource).not.toMatch(
      /if\s*\(\s*reducedMotion\s*\)\s*\{\s*return\b/
    );
    expect(cssSource).toContain("@media (prefers-reduced-motion: reduce)");

    const reducedMotionCss = cssSource.slice(
      cssSource.indexOf("@media (prefers-reduced-motion: reduce)")
    );
    expect(reducedMotionCss).not.toMatch(
      /\.tetradic-editorial__spread[^{}]*\{[^}]*display:\s*none/
    );
  });

  it("reuses the approved book, pedestal, identity, and tetrad assets", () => {
    const markup = renderEditorial();

    expect(markup).toContain(
      "/assets/tetradic-signature/pedestal-scene-final.png"
    );
    expect(markup).toContain("/assets/founder-scene/front-cover.png");
    expect(markup).toContain("/assets/tetradic-signature/book-spine.png");
    expect(markup).toContain("/oriel-signal-mark.png");
    CHAPTERS.forEach(chapter => {
      expect(markup).toContain(`/assets/tetrads/${chapter.number}.png`);
    });
  });
});
