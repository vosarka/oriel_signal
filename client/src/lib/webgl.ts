// Detect whether the browser can give us a WebGL context. When it can't
// (hardware acceleration off, GPU blocklisted, headless), R3F scenes can't
// render at all — callers fall back to a 2D representation instead of a blank
// canvas (spec §5 rendering law: degrade gracefully).
export function isWebGLAvailable(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") ||
          canvas.getContext("experimental-webgl"))
    );
  } catch {
    return false;
  }
}
