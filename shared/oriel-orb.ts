/**
 * The ORIEL orb in the chat: where it lives, and the Aura Field state table
 * its light is drawn from (after the Aura Field orb Vos chose, 2026-10-13).
 * Pure, so it can be tested.
 */

export interface Area {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Centre and radius of the orb, in CSS pixels. */
export interface OrbTarget {
  x: number;
  y: number;
  r: number;
}

const WIDE = 900;

/**
 * Empty chat: the orb sits in the middle. Once the conversation begins it
 * slides right on wide screens so the messages can rise beside it; on a
 * phone it stays centred, softly behind the conversation.
 */
export function orbTarget(area: Area, opts: { hasMessages: boolean; viewportWidth: number }): OrbTarget {
  const cx = area.left + area.width / 2;
  const cy = area.top + area.height / 2;
  if (!opts.hasMessages) {
    return { x: cx, y: cy, r: Math.min(area.width * 0.2, area.height * 0.24) };
  }
  if (opts.viewportWidth >= WIDE) {
    const r = Math.min(area.width * 0.13, area.height * 0.2);
    return { x: area.left + area.width * 0.76, y: area.top + area.height * 0.44, r };
  }
  return { x: cx, y: area.top + area.height * 0.32, r: Math.min(area.width * 0.3, area.height * 0.18) };
}

export type OrbState = "idle" | "listening" | "thinking" | "speaking";
export type OrbWeights = Record<OrbState, number>;

export interface AuraParams {
  speed: number;
  scale: number;
  thick: number;
  warp: number;
  lo: number;
  hi: number;
  shimmer: number;
  sweep: number;
}

export const AURA_TABLE: Record<OrbState, AuraParams> = {
  idle: { speed: 10, scale: 0.24, thick: 0.05, warp: 0.055, lo: 1, hi: 1, shimmer: 0, sweep: 0.6 },
  listening: { speed: 20, scale: 0.3, thick: 0.058, warp: 0.1, lo: 1.5, hi: 2, shimmer: 0, sweep: 0.8 },
  thinking: { speed: 30, scale: 0.27, thick: 0.05, warp: 0.14, lo: 0.5, hi: 2.5, shimmer: 0.6, sweep: 2.8 },
  speaking: { speed: 70, scale: 0.2, thick: 0.06, warp: 0.12, lo: 1.6, hi: 1.6, shimmer: 0, sweep: 1 },
};

/** The table blended by how much of each state is present. */
export function auraParams(weights: OrbWeights): AuraParams {
  const total = (Object.keys(weights) as OrbState[]).reduce((n, k) => n + weights[k], 0) || 1;
  const out = { speed: 0, scale: 0, thick: 0, warp: 0, lo: 0, hi: 0, shimmer: 0, sweep: 0 };
  for (const k of Object.keys(weights) as OrbState[]) {
    const w = weights[k] / total;
    if (!w) continue;
    for (const f of Object.keys(out) as (keyof AuraParams)[]) out[f] += AURA_TABLE[k][f] * w;
  }
  return out;
}

/**
 * How much the orb asks of the machine. On a slow computer the orb steps down
 * on its own: lower resolution, then no holographic triple pass. Motion always
 * stays at full rate: an orb at 8 fps looked broken (Vos, 2026-10-15). To ask
 * nothing at all, the Seeker can put the orb to rest instead.
 */
export const ORB_QUALITY = [
  { name: "full", dprCap: 1.5, fps: 60, holographic: true },
  { name: "light", dprCap: 1, fps: 60, holographic: false },
  { name: "low", dprCap: 0.6, fps: 60, holographic: false },
] as const;

export type OrbQuality = 0 | 1 | 2;

/** A frame slower than this, on average, means the page is struggling. */
export const SLOW_FRAME_MS = 24;

/**
 * One step down when the average frame is slow. Never back up: climbing
 * again on a machine that just struggled would only make it stutter twice.
 */
export function nextOrbQuality(level: OrbQuality, avgFrameMs: number): OrbQuality {
  if (avgFrameMs <= SLOW_FRAME_MS || level >= ORB_QUALITY.length - 1) return level;
  return (level + 1) as OrbQuality;
}
