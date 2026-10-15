import { describe, expect, it } from "vitest";
import { auraParams, nextOrbQuality, ORB_QUALITY, orbTarget, type OrbWeights } from "../shared/oriel-orb";

const area = { left: 288, top: 64, width: 1152, height: 760 };

describe("where the orb lives in the chat", () => {
  it("sits in the middle of the chat while it is empty", () => {
    const t = orbTarget(area, { hasMessages: false, viewportWidth: 1440 });
    expect(t.x).toBeCloseTo(area.left + area.width / 2);
    expect(t.y).toBeCloseTo(area.top + area.height / 2);
  });

  it("slides right and grows smaller once the conversation begins, on wide screens", () => {
    const empty = orbTarget(area, { hasMessages: false, viewportWidth: 1440 });
    const talking = orbTarget(area, { hasMessages: true, viewportWidth: 1440 });
    expect(talking.x).toBeGreaterThan(empty.x + area.width * 0.15);
    expect(talking.r).toBeLessThan(empty.r);
    expect(talking.x + talking.r).toBeLessThan(area.left + area.width);
  });

  it("stays centred on a phone, behind the conversation", () => {
    const phone = { left: 0, top: 56, width: 390, height: 700 };
    const t = orbTarget(phone, { hasMessages: true, viewportWidth: 390 });
    expect(t.x).toBeCloseTo(195);
    expect(t.r).toBeLessThan(phone.width / 2);
  });
});

describe("the Aura Field's state table", () => {
  const only = (k: keyof OrbWeights): OrbWeights => ({ idle: 0, listening: 0, thinking: 0, speaking: 0, [k]: 1 });

  it("gives each pure state its own parameters", () => {
    expect(auraParams(only("speaking")).speed).toBe(70);
    expect(auraParams(only("thinking")).shimmer).toBeCloseTo(0.6);
    expect(auraParams(only("idle")).speed).toBe(10);
  });

  it("blends states by weight while one gives way to another", () => {
    const half = auraParams({ idle: 0.5, listening: 0, thinking: 0, speaking: 0.5 });
    expect(half.speed).toBeCloseTo(40);
  });
});


describe("the orb on a slow computer", () => {
  it("steps down one level when frames grow slow, and never climbs back", () => {
    expect(nextOrbQuality(0, 16)).toBe(0);
    expect(nextOrbQuality(0, 30)).toBe(1);
    expect(nextOrbQuality(1, 30)).toBe(2);
    expect(nextOrbQuality(2, 80)).toBe(2);
    expect(nextOrbQuality(2, 10)).toBe(2);
  });

  it("asks less of the machine at every step down, but never moves in jerks", () => {
    for (let q = 1; q < ORB_QUALITY.length; q++) {
      expect(ORB_QUALITY[q].dprCap).toBeLessThanOrEqual(ORB_QUALITY[q - 1].dprCap);
    }
    // 8 fps made the orb itself look broken; motion always stays fluid.
    for (const level of ORB_QUALITY) expect(level.fps).toBe(60);
    expect(ORB_QUALITY[0].holographic).toBe(true);
    expect(ORB_QUALITY[ORB_QUALITY.length - 1].holographic).toBe(false);
  });
});
