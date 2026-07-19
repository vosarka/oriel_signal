import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TetradicSignatureEditorial } from "../client/src/features/tetradic-signature/TetradicSignatureEditorial";

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
  "client/src/pages/TetradicSignatureEditorialExperience.tsx",
] as const;

function readSource(path: (typeof SOURCE_PATHS)[number]) {
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
      /<a\b[^>]*href="\/founder-signature-blueprint"[^>]*>[\s\S]*?BUY THE FOUNDER EDITION[\s\S]*?<\/a>/
    )?.[0];
    expect(purchaseLink).toBeTruthy();

    const replayButton = markup.match(
      /<button\b[^>]*>[\s\S]*?EXPLORE THE SAMPLE AGAIN[\s\S]*?<\/button>/
    )?.[0];
    expect(replayButton).toBeTruthy();
    expect(replayButton).toContain('aria-controls="tetradic-interior-start"');
    expect(markup).toContain('href="#tetradic-interior-start"');
    expect(markup).toMatch(
      /<section\b[^>]*class="tetradic-editorial__purchase"[^>]*aria-hidden="true"[^>]*inert=""/
    );
    expect(source).toContain("scrollIntoView");
    expect(source).toContain("target.focus({ preventScroll: true })");
    expect(source).toContain("tetradic-interior-start");
  });

  it("keeps the production mount editorial and free of the retired cinematic stack", () => {
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
      ["GSAP", /from\s+["']gsap(?:\/[^"']*)?["']/],
      ["ScrollTrigger", /\bScrollTrigger\b/],
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
    expect(renderEditorial()).not.toContain("<canvas");
  });
});
