import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FINAL_FRAME_HOLD_MS,
  TETRADIC_OPENING_VIDEOS,
  TetradicSignatureVideoExperience,
  VIDEO_CROSSFADE_MS,
} from "../client/src/features/tetradic-signature/TetradicSignatureVideoExperience";

const ROOT = process.cwd();
const COMPONENT =
  "client/src/features/tetradic-signature/TetradicSignatureVideoExperience.tsx";
const PAGE = "client/src/pages/TetradicSignatureSimpleExperience.tsx";
const CSS =
  "client/src/features/tetradic-signature/tetradic-signature-video.css";

function readSource(path: string) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function renderExperience() {
  return renderToStaticMarkup(createElement(TetradicSignatureVideoExperience));
}

describe("Tetradic Signature native video opening", () => {
  it("uses the three supplied films in their exact order", () => {
    expect(TETRADIC_OPENING_VIDEOS).toEqual([
      "/assets/tetradic-signature/01first_intro_vid.mp4",
      "/assets/tetradic-signature/02middle_intro_vid.mp4",
      "/assets/tetradic-signature/03last_intro_vid.mp4",
    ]);

    TETRADIC_OPENING_VIDEOS.forEach(source => {
      expect(existsSync(resolve(ROOT, "client/public" + source))).toBe(true);
    });

    const markup = renderExperience();
    const sources = [...markup.matchAll(/<video\b[^>]*src="([^"]+)"/g)].map(
      match => match[1]
    );
    expect(sources).toEqual(TETRADIC_OPENING_VIDEOS);
  });

  it("renders native non-interactive HTML5 video with eager preload", () => {
    const markup = renderExperience();
    const videos = markup.match(/<video\b[^>]*>/g) ?? [];

    expect(videos).toHaveLength(3);
    videos.forEach(video => {
      expect(video).toContain('preload="auto"');
      expect(video).toContain('muted=""');
      expect(video).toContain('playsInline=""');
      expect(video).not.toContain("controls=");
    });
    expect(videos[0]).toContain('autoPlay=""');
    expect(videos[1]).not.toContain('autoPlay=""');
    expect(videos[2]).not.toContain('autoPlay=""');
  });

  it("keeps the requested decisions and timing contract", () => {
    const markup = renderExperience();
    const source = readSource(COMPONENT);

    expect(markup).toContain("Enter the Archive");
    expect(markup).toContain("Open the Archive");
    expect(VIDEO_CROSSFADE_MS).toBe(650);
    expect(FINAL_FRAME_HOLD_MS).toBe(500);
    expect(source).toContain("onEnded");
    expect(source).toContain("requestVideoFrameCallback");
    expect(source).not.toContain(".currentTime");
    expect(source).not.toContain(".load()");
    expect(source.match(/\.play\(\)/g)).toHaveLength(1);
  });

  it("crossfades into the semantic redacted Tetrad 01 spread", () => {
    const markup = renderExperience();

    expect(markup).toContain('id="tetradic-archive-interior"');
    expect(markup).toContain("TETRAD 01 / 12");
    expect(markup).toContain("THE THRESHOLD");
    expect(markup).toContain(
      "Every architecture begins with a point of entry."
    );
    expect(markup).toContain("RECEIVER 001");
    expect(markup).toContain("INITIALIZED");
    expect(markup.match(/REDACTED/g)?.length).toBeGreaterThanOrEqual(2);
    expect(markup).toContain("ORL-TDS-001");
    expect(markup).toContain("/assets/tetradic-signature/foaie1.png");
    expect(markup).toContain("/assets/tetradic-signature/foaie2.png");
    expect(markup).not.toContain("CALIBRATION 00.00");
    expect(markup).not.toContain("<canvas");
  });

  it("keeps the mounted opening free of scroll and rendering engines", () => {
    const sources = [COMPONENT, PAGE, CSS]
      .map(path => readSource(path))
      .join("\n");

    [
      "ScrollTrigger",
      "gsap",
      "ReactLenis",
      "useLenis",
      "@react-three/fiber",
      "@react-three/drei",
      "three",
      "<canvas",
      "WebGL",
    ].forEach(forbidden => {
      expect(sources).not.toContain(forbidden);
    });

    expect(sources).not.toContain('addEventListener("wheel"');
    expect(sources).not.toContain('addEventListener("touchmove"');
    expect(sources).not.toContain("preventDefault()");
    expect(readSource(PAGE)).toContain("TetradicSignatureVideoExperience");
  });

  it("restores the last stable decision if a later film fails", () => {
    const source = readSource(COMPONENT);

    expect(source).toMatch(/setVisibleVideo\(0\);\s*setPhase\("enter-ready"\)/);
    expect(source).toMatch(/setVisibleVideo\(1\);\s*setPhase\("open-ready"\)/);
  });

  it("locks only the opening and restores natural document scrolling", () => {
    const source = readSource(COMPONENT);
    const css = readSource(CSS);

    expect(source).toContain("scrollLock(true)");
    expect(source).toContain("scrollLock(false)");
    expect(css).toMatch(
      /html\.tetradic-video-scroll-lock,[\s\S]*overflow:\s*hidden\s*!important/
    );
    expect(css).toMatch(
      /body:has\(\.tetradic-video-experience\)[\s\S]*overflow-y:\s*visible/
    );
    expect(css).toContain("touch-action: pan-y");
  });
});
