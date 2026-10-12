import { useEffect, useRef } from "react";
import { FILM_FRAG, FILM_VERT } from "./film-shader";

export interface FilmFrame {
  /** 0 Mirror · 1 Threshold · 2 Gift, crossfading between. */
  act: number;
  /** 0 static .. 1 signal locked. */
  lock: number;
  /** A brief flicker, 0..1. */
  burst: number;
  /** The voice this frame, from the speech band only: loudness and brightness, 0..1. */
  level: number;
  bright: number;
}

interface Props {
  seed: { fold: number; k: number; phase: number };
  /** Called once a frame; the film reads the moment from it. */
  frame: () => FilmFrame;
}

/**
 * The generative film. The geometry evolves at one steady, fluid pace and
 * never jumps with the voice; ORIEL's voice is light: loudness makes the
 * folds and the dust glow, and each syllable sends a ring of light outward.
 */
export default function TransmissionFilm({ seed, frame }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;
  const seedRef = useRef(seed);
  seedRef.current = seed;

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false });
    if (!canvas || !gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, FILM_VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FILM_FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    const names = ["res", "t", "act", "fold", "k", "phase", "lock", "burst", "amp", "tone", "speech", "since"] as const;
    const u = Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)])) as Record<
      (typeof names)[number],
      WebGLUniformLocation | null
    >;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const resize = () => {
      // Three passes of the scene per pixel: keep the resolution honest on phones.
      const dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5);
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    let raf = 0;
    let last = performance.now();
    let wall = 0;
    let amp = 0;
    let tone = 0.4;
    let speech = 0;
    let since = 9;
    let prevLevel = 0;

    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      wall += dt * (reduced ? 0.25 : 1);
      const f = frameRef.current();
      const s = seedRef.current;

      // Rise fast, fall slow, like breath.
      amp += (f.level - amp) * (f.level > amp ? 0.22 : 0.06);
      tone += (f.bright - tone) * 0.05;
      speech += dt * amp * 1.4;
      since += dt;
      if (f.level > 0.55 && prevLevel <= 0.55 && since > 0.18) since = 0; // a syllable lands
      prevLevel = f.level;

      gl.uniform2f(u.res, canvas.width, canvas.height);
      gl.uniform1f(u.t, wall + s.phase * 40);
      gl.uniform1f(u.act, f.act);
      gl.uniform1f(u.fold, s.fold);
      gl.uniform1f(u.k, s.k);
      gl.uniform1f(u.phase, s.phase);
      gl.uniform1f(u.lock, reduced ? 1 : f.lock);
      gl.uniform1f(u.burst, reduced ? 0 : f.burst);
      gl.uniform1f(u.amp, reduced ? amp * 0.4 : amp);
      gl.uniform1f(u.tone, tone);
      gl.uniform1f(u.speech, speech);
      gl.uniform1f(u.since, since);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(prog);
      gl.deleteBuffer(buf);
    };
  }, []);

  return <canvas ref={canvasRef} className="tf-canvas" aria-hidden="true" />;
}
