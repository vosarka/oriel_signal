import { useEffect, useRef } from "react";
import { auraParams, AURA_TABLE, orbTarget, type OrbState } from "@shared/oriel-orb";
import { ORB_FRAG, ORB_VERT } from "./orb-shader";

export interface OrbFrame {
  state: OrbState;
  /** ORIEL's voice this frame, speech band only, 0..1. */
  level: number;
}

interface Props {
  /** The chat area the orb lives in; it is placed relative to this box. */
  anchorRef: React.RefObject<HTMLElement | null>;
  hasMessages: boolean;
  /** Read once a frame. */
  frame: () => OrbFrame;
  /** Coherence 0 entropy .. 1 resonance. */
  coherence?: number;
}

const TAU = Math.PI * 2;

/**
 * The room behind the chat: ORIEL's orb, the dust and the holographic layer,
 * drawn on one fixed canvas. The orb glides to where orbTarget puts it; its
 * light follows ORIEL's voice and its motion follows ORIEL's state.
 */
export default function OrielOrbField({ anchorRef, hasMessages, frame, coherence = 0.6 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const live = useRef({ frame, hasMessages, coherence });
  live.current = { frame, hasMessages, coherence };

  useEffect(() => {
    const canvas = canvasRef.current;
    const gl = canvas?.getContext("webgl2", { antialias: false });
    if (!canvas || !gl) return;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "orb shader");
      return s;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, ORB_VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, ORB_FRAG));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const names = [
      "res", "t", "center", "radius", "amp", "since", "listen", "think", "speak", "coh", "fold", "phase",
      "auraRadius", "auraThick", "auraWarp", "auraBright", "auraShimmer", "auraSweep", "auraPhase",
    ] as const;
    const U = Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)])) as Record<
      (typeof names)[number],
      WebGLUniformLocation | null
    >;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let dpr = 1;
    const resize = () => {
      // The scene runs three times per pixel for the holographic split.
      dpr = Math.min(window.devicePixelRatio || 1, window.innerWidth < 700 ? 1 : 1.5);
      canvas.width = Math.floor(window.innerWidth * dpr);
      canvas.height = Math.floor(window.innerHeight * dpr);
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener("resize", resize);

    const s = { amp: 0, since: 9, listen: 0, think: 0, speak: 0, coh: live.current.coherence, prevLevel: 0 };
    const aura = { phase: 0, sweep: 0, pulse: 0, x: AURA_TABLE.idle.scale, v: 0 };
    let pos: { x: number; y: number; r: number } | null = null;

    const stepSpring = (target: number, omega: number, zeta: number, dt: number) => {
      const x0 = aura.x - target;
      const v0 = aura.v;
      if (zeta < 1) {
        const wd = omega * Math.sqrt(1 - zeta * zeta);
        const decay = Math.exp(-zeta * omega * dt);
        const c = Math.cos(wd * dt);
        const sn = Math.sin(wd * dt);
        const b = (v0 + zeta * omega * x0) / wd;
        const x = decay * (x0 * c + b * sn);
        aura.x = target + x;
        aura.v = -zeta * omega * x + decay * wd * (b * c - x0 * sn);
      } else {
        const decay = Math.exp(-omega * dt);
        const k = v0 + omega * x0;
        aura.x = target + (x0 + k * dt) * decay;
        aura.v = (v0 - omega * dt * k) * decay;
      }
    };
    const pingPong = (t: number) => {
      const p = t / 0.35;
      const leg = Math.floor(p);
      const f = p - leg;
      const e = 1 - (1 - f) * (1 - f);
      return leg % 2 === 0 ? e : 1 - e;
    };

    let raf = 0;
    let last = performance.now();
    let wall = 0;
    const draw = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      wall += dt * (reduced ? 0.3 : 1);
      const { frame: read, hasMessages: talking, coherence: coh } = live.current;
      const f = read();

      // Voice: rise fast, fall slow, like breath; a syllable sends light outward.
      const level = f.state === "speaking" ? f.level : 0;
      s.amp += (level - s.amp) * (level > s.amp ? 0.22 : 0.06);
      s.since += dt;
      if (level > 0.55 && s.prevLevel <= 0.55 && s.since > 0.18) s.since = 0;
      s.prevLevel = level;
      s.listen += ((f.state === "listening" ? 1 : 0) - s.listen) * 0.05;
      s.think += ((f.state === "thinking" ? 1 : 0) - s.think) * 0.05;
      s.speak += ((f.state === "speaking" ? 1 : 0) - s.speak) * 0.04;
      s.coh += (coh - s.coh) * 0.02;

      // Where the orb belongs, and a smooth glide toward it.
      const box = anchorRef.current?.getBoundingClientRect();
      const target = box
        ? orbTarget(
            { left: box.left, top: box.top, width: box.width, height: box.height },
            { hasMessages: talking, viewportWidth: window.innerWidth }
          )
        : { x: window.innerWidth / 2, y: window.innerHeight / 2, r: 120 };
      if (!pos) pos = { ...target };
      const k = reduced ? 1 : 1 - Math.pow(0.0015, dt);
      pos.x += (target.x - pos.x) * k;
      pos.y += (target.y - pos.y) * k;
      pos.r += (target.r * (1 - 0.06 * s.listen) - pos.r) * k;

      // Aura Field: the state table, a spring for size, a pulse while composing.
      const P = auraParams({ idle: Math.max(0, 1 - s.listen - s.think - s.speak), listening: s.listen, thinking: s.think, speaking: s.speak });
      if (!reduced) {
        stepSpring(AURA_TABLE[f.state].scale, f.state === "listening" ? TAU : TAU / 0.8, f.state === "listening" ? 0.65 : 1, dt);
        aura.phase += dt * P.speed * 0.02;
        aura.sweep += dt * P.sweep;
        aura.pulse += dt;
      }
      const pulse = reduced ? 0.5 : pingPong(aura.pulse);
      const speakLevel = s.speak * s.amp;

      gl.uniform2f(U.res, canvas.width, canvas.height);
      gl.uniform1f(U.t, wall);
      gl.uniform2f(U.center, pos.x * dpr, (window.innerHeight - pos.y) * dpr);
      gl.uniform1f(U.radius, pos.r * dpr);
      gl.uniform1f(U.amp, reduced ? s.amp * 0.4 : s.amp);
      gl.uniform1f(U.since, s.since);
      gl.uniform1f(U.listen, s.listen);
      gl.uniform1f(U.think, s.think);
      gl.uniform1f(U.speak, s.speak);
      gl.uniform1f(U.coh, s.coh);
      gl.uniform1f(U.fold, 8);
      gl.uniform1f(U.phase, 0.37);
      gl.uniform1f(U.auraRadius, (0.26 + 1.05 * (aura.x + 0.2 * speakLevel)) * 1.15);
      gl.uniform1f(U.auraThick, (P.thick + 0.035 * speakLevel) * 1.05);
      gl.uniform1f(U.auraWarp, P.warp + 0.14 * speakLevel);
      gl.uniform1f(U.auraBright, (0.5 + 0.42 * (P.lo + (P.hi - P.lo) * pulse)) * 0.8);
      gl.uniform1f(U.auraShimmer, P.shimmer);
      gl.uniform1f(U.auraSweep, aura.sweep);
      gl.uniform1f(U.auraPhase, aura.phase);
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
  }, [anchorRef]);

  return <canvas ref={canvasRef} className="oriel-orb-field" aria-hidden="true" />;
}
