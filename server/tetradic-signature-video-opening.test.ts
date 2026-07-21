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

import { TetradicSignatureVideoExperience } from "../client/src/features/tetradic-signature/TetradicSignatureVideoExperience";
import {
  createTetradicVideoSeekController,
  type ScrubbableVideo,
} from "../client/src/features/tetradic-signature/tetradic-video-seek-controller";
import {
  getTetradicVideoScrollState,
  TETRADIC_SCROLL_FILMS,
  TETRADIC_VIDEO_FPS,
  TETRADIC_VIDEO_SCROLL,
} from "../client/src/features/tetradic-signature/tetradic-video-scroll-config";

const ROOT = process.cwd();
const COMPONENT =
  "client/src/features/tetradic-signature/TetradicSignatureVideoExperience.tsx";
const HOOK = "client/src/features/tetradic-signature/useTetradicVideoScrub.ts";
const SEEK_CONTROLLER =
  "client/src/features/tetradic-signature/tetradic-video-seek-controller.ts";
const PAGE = "client/src/pages/TetradicSignatureSimpleExperience.tsx";
const CSS =
  "client/src/features/tetradic-signature/tetradic-signature-video.css";

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
    createElement(TetradicSignatureVideoExperience, {
      reducedMotion,
      compact,
    })
  );
}

class FakeScrubbableVideo extends EventTarget {
  duration = 10;
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

describe("Tetradic Signature scroll-scrubbed film opening", () => {
  it("uses three scrub-optimized films in the approved order", () => {
    expect(TETRADIC_SCROLL_FILMS.map(film => film.source)).toEqual([
      "/assets/tetradic-signature/scroll/01first_intro_scrub.mp4",
      "/assets/tetradic-signature/scroll/02middle_intro_scrub.mp4",
      "/assets/tetradic-signature/scroll/03last_intro_scrub.mp4",
    ]);

    TETRADIC_SCROLL_FILMS.forEach(film => {
      [film.source, film.mobileSource].forEach(source => {
        const assetPath = "client/public" + source;
        expect(existsSync(resolve(ROOT, assetPath))).toBe(true);
        expect(
          readFilePrefix(assetPath).indexOf(Buffer.from("moov"))
        ).toBeLessThan(1024);
      });
      expect(film.fallbackSource).toBe(film.mobileSource);
    });
  });

  it("renders one eager and two deferred native video layers", () => {
    const markup = renderExperience();
    const videos = markup.match(/<video\b[^>]*>/g) ?? [];

    expect(videos).toHaveLength(3);
    videos.forEach((video, index) => {
      expect(video).toContain(
        index === 0 ? 'preload="auto"' : 'preload="metadata"'
      );
      expect(video).toContain('muted=""');
      expect(video).toContain('playsInline=""');
      expect(video).not.toContain("autoPlay");
      expect(video).not.toContain("controls=");
    });
    expect(markup).not.toContain("Enter the Archive");
    expect(markup).not.toContain("Open the Archive");
    expect(markup).not.toContain("tetradic-archive-interior");

    const compactMarkup = renderExperience(false, true);
    TETRADIC_SCROLL_FILMS.forEach(film => {
      expect(compactMarkup).toContain(film.mobileSource);
    });
  });

  it("coalesces rapid targets behind one presented-frame seek", () => {
    const video = new FakeScrubbableVideo();
    let presentedFrames = 0;
    const controller = createTetradicVideoSeekController(
      video as unknown as ScrubbableVideo,
      {
        frameStep: 1 / 24,
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

  it("allocates the approved 1100svh natural scroll architecture", () => {
    expect(TETRADIC_VIDEO_SCROLL.totalSvh).toBe(1100);
    expect(TETRADIC_VIDEO_SCROLL.scrollableSvh).toBe(1000);
    expect(TETRADIC_VIDEO_SCROLL.ranges).toEqual({
      film01: [0, 0.27],
      transition01To02: [0.27, 0.33],
      film02: [0.33, 0.55],
      transition02To03: [0.55, 0.61],
      film03: [0.61, 0.88],
      finalHold: [0.88, 1],
    });

    const css = readSource(CSS);
    expect(css).toContain("position: sticky");
    expect(css).toContain("height: 100svh");
    expect(css).toContain("overflow-y: auto");
    expect(css).toContain("touch-action: pan-y");
  });

  it("maps all films, crossfades, and the final hold deterministically", () => {
    const start = getTetradicVideoScrollState(0);
    const firstMiddle = getTetradicVideoScrollState(0.135);
    const firstCrossfade = getTetradicVideoScrollState(0.3);
    const secondMiddle = getTetradicVideoScrollState(0.44);
    const secondCrossfade = getTetradicVideoScrollState(0.58);
    const thirdMiddle = getTetradicVideoScrollState(0.745);
    const finish = getTetradicVideoScrollState(1);

    expect(start.phase).toBe("film-01");
    expect(start.times[0]).toBe(0);
    expect(firstMiddle.localProgress).toBeCloseTo(0.5, 5);
    expect(firstCrossfade.opacities[0]).toBeCloseTo(0.5, 5);
    expect(firstCrossfade.opacities[1]).toBeCloseTo(0.5, 5);
    expect(firstCrossfade.opacities[2]).toBe(0);
    expect(secondMiddle.phase).toBe("film-02");
    expect(secondMiddle.localProgress).toBeCloseTo(0.5, 5);
    expect(secondCrossfade.opacities[0]).toBe(0);
    expect(secondCrossfade.opacities[1]).toBeCloseTo(0.5, 5);
    expect(secondCrossfade.opacities[2]).toBeCloseTo(0.5, 5);
    expect(thirdMiddle.phase).toBe("film-03");
    expect(thirdMiddle.localProgress).toBeCloseTo(0.5, 5);
    expect(finish.phase).toBe("final-hold");
    expect(finish.activeFilm).toBe(2);
    expect(finish.opacities).toEqual([0, 0, 1]);
    expect(finish.times[2]).toBeCloseTo(10 - 1 / TETRADIC_VIDEO_FPS, 5);
  });

  it("uses exactly one Lenis bridge and one ScrollTrigger controller", () => {
    const hook = readSource(HOOK);
    const seekController = readSource(SEEK_CONTROLLER);
    const page = readSource(PAGE);
    const sources = [readSource(COMPONENT), hook, page, readSource(CSS)].join(
      "\n"
    );

    expect(hook.match(/ScrollTrigger\.create\(/g)).toHaveLength(1);
    expect(hook).not.toContain("video.currentTime = target");
    expect(seekController).toContain("video.currentTime = requestedTime");
    expect(seekController).toContain("if (disposed || inFlight");
    expect(seekController).toContain("requestVideoFrameCallback");
    expect(hook).toContain("requestAnimationFrame");
    expect(hook).toContain("TETRADIC_VIDEO_SCROLL_RESTORE_KEY");
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
    expect(markup).toContain("Artifact Reveal");
    expect(markup).toContain("Archive Activation");
    expect(markup).toContain("Book Opening");
    expect(readSource(PAGE)).toContain("if (reducedMotion)");
  });
});
