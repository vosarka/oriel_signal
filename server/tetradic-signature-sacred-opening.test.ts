import {
  existsSync,
  openSync,
  readSync,
  closeSync,
  readFileSync,
} from "node:fs";
import { resolve } from "node:path";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { TetradicSacredExperience } from "../client/src/features/tetradic-signature/TetradicSacredExperience";
import {
  createTetradicVideoSeekController,
  type ScrubbableVideo,
} from "../client/src/features/tetradic-signature/tetradic-video-seek-controller";
import {
  getTetradicSacredScrollState,
  TETRADIC_SACRED_FILMS,
  TETRADIC_SACRED_FPS,
  TETRADIC_SACRED_SCROLL,
} from "../client/src/features/tetradic-signature/tetradic-sacred-scroll-config";

const ROOT = process.cwd();
const COMPONENT =
  "client/src/features/tetradic-signature/TetradicSacredExperience.tsx";
const HOOK = "client/src/features/tetradic-signature/useTetradicSacredScrub.ts";
const SEEK_CONTROLLER =
  "client/src/features/tetradic-signature/tetradic-video-seek-controller.ts";
const PAGE = "client/src/pages/TetradicSignatureSacredExperience.tsx";
const CSS = "client/src/features/tetradic-signature/tetradic-sacred.css";
const APP = "client/src/App.tsx";

function readSource(path: string) {
  return readFileSync(resolve(ROOT, path), "utf8");
}

function readFilePrefix(path: string, length = 4096) {
  const descriptor = openSync(resolve(ROOT, path), "r");
  const buffer = Buffer.alloc(length);
  const bytesRead = readSync(descriptor, buffer, 0, length, 0);
  closeSync(descriptor);
  return buffer.subarray(0, bytesRead);
}

function renderExperience(reducedMotion = false, compact = false) {
  return renderToStaticMarkup(
    createElement(TetradicSacredExperience, {
      reducedMotion,
      compact,
    })
  );
}

class FakeScrubbableVideo extends EventTarget {
  duration = 8;
  readyState = 4;
  seeking = false;
  assignments: number[] = [];
  private mediaTime = 0;
  private nextFrameCallback = 1;
  private frameCallbacks = new Map<
    number,
    (now: number, metadata: { mediaTime: number }) => void
  >();

  get currentTime() {
    return this.mediaTime;
  }

  set currentTime(time: number) {
    this.mediaTime = time;
    this.seeking = true;
    this.assignments.push(time);
  }

  requestVideoFrameCallback(
    callback: (now: number, metadata: { mediaTime: number }) => void
  ) {
    const handle = this.nextFrameCallback;
    this.nextFrameCallback += 1;
    this.frameCallbacks.set(handle, callback);
    return handle;
  }

  cancelVideoFrameCallback(handle: number) {
    this.frameCallbacks.delete(handle);
  }

  present(time: number) {
    this.mediaTime = time;
    this.seeking = false;
    const callbacks = [...this.frameCallbacks.values()];
    this.frameCallbacks.clear();
    callbacks.forEach(callback =>
      callback(performance.now(), { mediaTime: time })
    );
  }
}

describe("Tetradic Signature sacred scroll opening", () => {
  it("uses two scrub-optimized films in the approved order", () => {
    expect(TETRADIC_SACRED_FILMS.map(film => film.source)).toEqual([
      "/assets/tetradic-signature/scroll/04book_opens_scrub.mp4",
      "/assets/tetradic-signature/scroll/05page_zoom_scrub.mp4",
    ]);
    expect(TETRADIC_SACRED_FILMS.map(film => film.id)).toEqual([
      "book-opens",
      "page-entry",
    ]);

    TETRADIC_SACRED_FILMS.forEach(film => {
      [film.source, film.mobileSource].forEach(source => {
        const assetPath = "client/public" + source;
        expect(existsSync(resolve(ROOT, assetPath))).toBe(true);
        expect(
          readFilePrefix(assetPath).indexOf(Buffer.from("moov"))
        ).toBeLessThan(1024);
      });
      expect(film.fallbackSource).toBe(film.mobileSource);
      expect(film.duration).toBe(8);
    });
  });

  it("renders one eager and one deferred native video layer", () => {
    const markup = renderExperience();
    const videos = markup.match(/<video\b[^>]*>/g) ?? [];

    expect(videos).toHaveLength(2);
    videos.forEach((video, index) => {
      expect(video).toContain(
        index === 0 ? 'preload="auto"' : 'preload="metadata"'
      );
      expect(video).toContain('muted=""');
      expect(video).toContain('playsInline=""');
      expect(video).not.toContain("autoPlay");
      expect(video).not.toContain("controls=");
    });
    expect(markup).toContain("The Book Opens");
    expect(markup).toContain("Entering the Page");
    expect(markup).toContain("Open Your Signature");
    expect(markup).toContain('href="/founder-signature-blueprint"');
    expect(markup).toContain("You were inscribed.");
    expect(markup).not.toContain("tetradic-archive-interior");
    expect(markup).not.toContain("01first_intro_scrub");

    const compactMarkup = renderExperience(false, true);
    TETRADIC_SACRED_FILMS.forEach(film => {
      expect(compactMarkup).toContain(film.mobileSource);
    });
  });

  it("coalesces rapid targets behind one presented-frame seek", () => {
    const video = new FakeScrubbableVideo();
    let presentedFrames = 0;
    const controller = createTetradicVideoSeekController(
      video as unknown as ScrubbableVideo,
      {
        frameStep: 1 / TETRADIC_SACRED_FPS,
        onFramePresented: () => {
          presentedFrames += 1;
        },
      }
    );

    controller.request(1);
    controller.request(2);
    controller.request(3);
    expect(video.assignments).toEqual([1]);

    video.present(1);
    expect(video.assignments).toEqual([1, 3]);
    expect(controller.isPresentedAt(3)).toBe(false);

    video.present(3);
    expect(controller.isPresentedAt(3)).toBe(true);
    expect(presentedFrames).toBe(2);
    controller.dispose();
  });

  it("allocates the approved 1000svh natural scroll architecture", () => {
    expect(TETRADIC_SACRED_SCROLL.totalSvh).toBe(1000);
    expect(TETRADIC_SACRED_SCROLL.scrollableSvh).toBe(900);
    expect(TETRADIC_SACRED_SCROLL.ranges).toEqual({
      film01: [0, 0.38],
      transition01To02: [0.38, 0.45],
      film02: [0.45, 0.8],
      pageHold: [0.8, 1],
    });

    const css = readSource(CSS);
    expect(css).toContain("position: sticky");
    expect(css).toContain("height: 100svh");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("touch-action: pan-y");
  });

  it("maps both films, the crossfade, reveal, and page hold deterministically", () => {
    const start = getTetradicSacredScrollState(0);
    const firstMiddle = getTetradicSacredScrollState(0.19);
    const crossfade = getTetradicSacredScrollState(0.415);
    const secondMiddle = getTetradicSacredScrollState(0.625);
    const earlyHold = getTetradicSacredScrollState(0.82);
    const finish = getTetradicSacredScrollState(1);

    expect(start.phase).toBe("film-01");
    expect(start.times[0]).toBe(0);
    expect(start.opacities).toEqual([1, 0]);
    expect(start.reveal).toBe(0);

    expect(firstMiddle.localProgress).toBeCloseTo(0.5, 5);
    expect(firstMiddle.activeFilm).toBe(0);

    expect(crossfade.phase).toBe("transition-01-02");
    expect(crossfade.opacities[0]).toBeCloseTo(0.5, 1);
    expect(crossfade.opacities[1]).toBeCloseTo(0.5, 1);
    expect(crossfade.times[0]).toBeCloseTo(8 - 1 / TETRADIC_SACRED_FPS, 5);
    expect(crossfade.times[1]).toBe(0);

    expect(secondMiddle.phase).toBe("film-02");
    expect(secondMiddle.localProgress).toBeCloseTo(0.5, 5);
    expect(secondMiddle.opacities).toEqual([0, 1]);

    expect(earlyHold.phase).toBe("page-hold");
    expect(earlyHold.reveal).toBeLessThan(0.2);
    expect(finish.phase).toBe("page-hold");
    expect(finish.activeFilm).toBe(1);
    expect(finish.opacities).toEqual([0, 1]);
    expect(finish.reveal).toBe(1);
    expect(finish.times[1]).toBeCloseTo(8 - 1 / TETRADIC_SACRED_FPS, 5);
  });

  it("uses exactly one Lenis bridge and one ScrollTrigger controller", () => {
    const hook = readSource(HOOK);
    const seekController = readSource(SEEK_CONTROLLER);
    const page = readSource(PAGE);
    const app = readSource(APP);
    const sources = [readSource(COMPONENT), hook, page, readSource(CSS)].join(
      "\n"
    );

    expect(app).toContain("TetradicSignatureSacredExperience");
    expect(app).toContain('path={"/tetradic-signature"}');
    expect(hook.match(/ScrollTrigger\.create\(/g)).toHaveLength(1);
    expect(hook).not.toContain("video.currentTime = target");
    expect(seekController).toContain("video.currentTime = requestedTime");
    expect(seekController).toContain("if (disposed || inFlight");
    expect(seekController).toContain("requestVideoFrameCallback");
    expect(hook).toContain("requestAnimationFrame");
    expect(hook).toContain("TETRADIC_SACRED_SCROLL_RESTORE_KEY");
    expect(hook).toContain("STORAGE_WRITE_INTERVAL_MS = 250");
    expect(hook).toContain('addEventListener("pagehide"');
    expect(hook).toContain("lenis.scrollTo(target, { immediate: true })");
    expect(page.match(/<ReactLenis/g)).toHaveLength(1);
    expect(page.match(/gsap\.ticker\.add/g)).toHaveLength(1);
    expect(page.match(/gsap\.ticker\.remove/g)).toHaveLength(1);
    expect(page).toContain("gsap.ticker.lagSmoothing(500, 33)");
    expect(page).not.toContain("gsap.ticker.lagSmoothing(0)");
    expect(sources).not.toContain('addEventListener("wheel"');
    expect(sources).not.toContain('addEventListener("touchmove"');
    expect(sources).not.toContain("preventDefault()");
    expect(sources).not.toContain("<canvas");
    expect(sources).not.toContain("@react-three/fiber");
    expect(sources).not.toContain("WebGL");
  });

  it("keeps a readable non-scrubbed reduced-motion document", () => {
    const markup = renderExperience(true);

    expect(markup).toContain('data-reduced-motion="true"');
    expect(markup).toContain('data-active-film="all"');
    expect(markup).toContain("The Tetradic");
    expect(markup).toContain("Signature");
    expect(markup).toContain("Open Your Signature");
    expect(markup).toContain("You were inscribed.");
    expect(readSource(PAGE)).toContain("if (reducedMotion)");
  });
});
