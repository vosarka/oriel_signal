import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  TetradicFounderEdition,
  type TetradicFounderEditionProps,
} from "../client/src/features/tetradic-signature/TetradicFounderEdition";
import { TETRADIC_BOOK_TETRADS } from "../client/src/features/tetradic-signature/tetradic-book-flatplan";

const ROOT = process.cwd();
const COMPONENT =
  "client/src/features/tetradic-signature/TetradicFounderEdition.tsx";
const CSS =
  "client/src/features/tetradic-signature/tetradic-founder-edition.css";
const ORDER_CSS =
  "client/src/features/tetradic-signature/tetradic-founder-order.css";
const runtimeGlobal = globalThis as typeof globalThis & {
  React?: typeof React;
};
const previousGlobalReact = runtimeGlobal.React;

const AUTHENTICATED_USER = {
  name: "Receiver One",
  email: "receiver@example.com",
} as const;

const BASE_PROPS: TetradicFounderEditionProps = {
  isAuthenticated: true,
  user: AUTHENTICATED_USER,
  onRequireLogin: () => undefined,
  onCreateCheckpoint: async () => ({ orderId: 8132 }),
  onContinueToPayPal: () => undefined,
};

beforeAll(() => {
  runtimeGlobal.React = React;
});

afterAll(() => {
  if (previousGlobalReact) {
    runtimeGlobal.React = previousGlobalReact;
    return;
  }
  delete runtimeGlobal.React;
});

function readSource(path: string) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function renderFounderEdition(
  overrides: Partial<TetradicFounderEditionProps> = {}
) {
  return renderToStaticMarkup(
    React.createElement(TetradicFounderEdition, {
      ...BASE_PROPS,
      ...overrides,
    })
  );
}

describe("Tetradic Founder Edition post-video page", () => {
  it("renders one readonly account concept, four birth inputs, two questions, and consent", () => {
    const markup = renderFounderEdition();
    const inputTags = markup.match(/<input\b[^>]*>/g) ?? [];
    const readOnlyInputs = inputTags.filter(tag =>
      /\breadonly(?:=""|(?=[\s>]))/i.test(tag)
    );
    const consentInputs = inputTags.filter(tag =>
      /\btype="checkbox"/i.test(tag)
    );
    const editableBirthInputs = inputTags.filter(
      tag =>
        !/\breadonly(?:=""|(?=[\s>]))/i.test(tag) &&
        !/\btype="checkbox"/i.test(tag)
    );
    const editableTypes = editableBirthInputs
      .map(tag => tag.match(/\btype="([^"]+)"/i)?.[1])
      .sort();
    const textareas = markup.match(/<textarea\b/g) ?? [];

    expect(markup).toContain("<form");
    expect(markup).toContain("Account identity");
    expect(markup).toContain("Read-only");
    expect(readOnlyInputs).toHaveLength(2);
    expect(readOnlyInputs.some(tag => tag.includes('type="text"'))).toBe(true);
    expect(readOnlyInputs.some(tag => tag.includes('type="email"'))).toBe(true);
    expect(markup).toContain(AUTHENTICATED_USER.name);
    expect(markup).toContain(AUTHENTICATED_USER.email);

    expect(editableBirthInputs).toHaveLength(4);
    expect(editableTypes).toEqual(["date", "text", "text", "time"]);
    expect(markup).toContain("Birth date");
    expect(markup).toContain("Birth time");
    expect(markup).toContain("Birth city or place");
    expect(markup).toContain("Birth country");

    expect(textareas).toHaveLength(2);
    expect(markup).toContain("Your first question");
    expect(markup).toContain("Your second question");
    expect(consentInputs).toHaveLength(1);
    expect(markup).toContain(
      "I consent to ORIEL using this birth and intake data"
    );

    expect(markup).not.toContain("Timezone");
    expect(markup).not.toContain("Preferred tone");
  });

  it("renders a login gate without exposing the intake controls when unauthenticated", () => {
    const markup = renderFounderEdition({
      isAuthenticated: false,
      user: null,
    });

    expect(markup).toContain("Sign in before entering personal details.");
    expect(markup).toContain("Sign in to continue");
    expect(markup).toContain(
      "Name and email come directly from your account and remain read-only"
    );
    expect(markup).not.toContain("<form");
    expect(markup).not.toContain("<input");
    expect(markup).not.toContain("<textarea");
  });

  it("renders the complete 12-tetrad, 48-page offer and precision register", () => {
    const markup = renderFounderEdition();
    const cards = markup.match(/\bdata-tfe-tetrad-card="true"/g) ?? [];

    expect(cards).toHaveLength(12);
    expect(TETRADIC_BOOK_TETRADS).toHaveLength(12);
    TETRADIC_BOOK_TETRADS.forEach(tetrad => {
      expect(markup).toContain(tetrad.title);
    });

    expect(markup).toContain("THE TETRADIC SIGNATURE");
    expect(markup).toContain("FOUNDER EDITION");
    expect(markup).toContain("Your Resonance Architecture");
    expect(markup).toContain("12 tetrads · 48 pages");
    expect(markup).toContain("64");
    expect(markup).toContain("5.625°");
    expect(markup).toContain("1.40625°");
    expect(markup).toContain("88.0000°");
    expect(markup).toContain(
      "Orbital precision instrument for the 64-codon field"
    );
    expect(markup).toContain("€81,32");
    expect(markup).toContain("within 5 calendar days");
  });

  it("uses the ORIEL font stack and keeps the em dash in the visible title", () => {
    const component = readSource(COMPONENT);
    const css = readSource(CSS);
    const orderCss = readSource(ORDER_CSS);

    expect(`${css}\n${orderCss}`).not.toMatch(/\bInter\b/);
    expect(css).toMatch(
      /\.tfe \{[\s\S]*?font-family: "Cormorant Garamond", serif;/
    );
    expect(css).toMatch(
      /\.tfe__field input,\s*\.tfe__field textarea \{[\s\S]*?font-family: "JetBrains Mono", monospace;/
    );
    expect(orderCss).toMatch(
      /\.tfe-order \{[\s\S]*?font-family: "Cormorant Garamond", serif;/
    );
    expect(component).toMatch(
      /className="tfe__title-product" aria-hidden="true">\s*THE TETRADIC SIGNATURE —\s*<\/span>/
    );
    expect(component).toContain(
      'aria-label="THE TETRADIC SIGNATURE — FOUNDER EDITION"'
    );
  });

  it("encodes the save checkpoint then PayPal continuation contract", () => {
    const source = readSource(COMPONENT);

    expect(source).toContain("await onCreateCheckpoint(values)");
    expect(source).toContain("setCheckpoint(nextCheckpoint)");
    expect(source).toContain("await onContinueToPayPal(checkpoint.orderId)");
    expect(source).toContain("Checkpoint secured");
    expect(source).toContain("Your details are saved.");
    expect(source).toContain("Buy with PayPal");
    expect(source).toContain("orderId: number;");
  });

  it("contains no file-generation or download offer", () => {
    const markup = renderFounderEdition();
    const implementation = [readSource(COMPONENT), readSource(CSS)].join("\n");

    expect(markup).not.toMatch(/generate pdf/i);
    expect(markup).not.toMatch(/download/i);
    expect(implementation).not.toMatch(/generate pdf/i);
    expect(implementation).not.toMatch(/\bdownload\b/i);
  });

  it("keeps styles namespaced, Visual Law colors locked, and scroll ownership external", () => {
    const component = readSource(COMPONENT);
    const css = readSource(CSS);
    const allowedHexColors = new Set([
      "#030303",
      "#050505",
      "#0a0907",
      "#5ba4a4",
      "#bda36b",
      "#d8b56d",
      "#e4c88c",
      "#fff7e6",
    ]);
    const hexColors = [...css.matchAll(/#[0-9a-f]{6}\b/gi)].map(match =>
      match[0].toLowerCase()
    );
    const selectorOpeners = css
      .split("\n")
      .map(line => line.trim())
      .filter(
        line =>
          line.endsWith("{") &&
          !line.startsWith("@") &&
          line !== "from {" &&
          line !== "to {"
      );

    expect(
      selectorOpeners.filter(selector => !selector.includes(".tfe"))
    ).toEqual([]);
    expect(hexColors.filter(color => !allowedHexColors.has(color))).toEqual([]);
    expect(css).not.toMatch(/^(?:html|body|#root|:root)\b/m);
    expect(css).not.toMatch(/#8a6d3b|#7a5c30|#a0784a/i);
    expect(component).not.toMatch(/ReactLenis|useLenis/);
    expect(component).not.toMatch(
      /addEventListener\(\s*["'](?:wheel|touchmove)["']/
    );
    expect(component.match(/gsap\.timeline\(/g)).toHaveLength(1);
    expect(component.match(/scrollTrigger:/g)).toHaveLength(1);
    expect(component).toContain("gsap.context");
    expect(component).toContain("context.revert()");
    expect(component).not.toMatch(
      /\[data-tfe-(?:tetrad-card|register)\][\s\S]{0,140}opacity:\s*0/
    );
  });

  it("marks and preserves a readable reduced-motion rendering", () => {
    const markup = renderFounderEdition({ reducedMotion: true });
    const component = readSource(COMPONENT);
    const css = readSource(CSS);

    expect(markup).toContain('data-reduced-motion="true"');
    expect(markup).toContain("THE TETRADIC SIGNATURE");
    expect(markup).toContain("Your first question");
    expect(component).toContain("if (!root || reducedMotion) return");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
    expect(css).toContain(
      '.tfe[data-reduced-motion="true"] .tfe__orbital-ring--two'
    );
    expect(css).toContain("animation: none !important");
  });
});
