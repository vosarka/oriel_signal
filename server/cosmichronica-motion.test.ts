import { describe, expect, it } from "vitest";

import {
  buildParticleAppearance,
  phaseCameraArc,
  phaseState,
} from "../client/src/lib/cosmichronica-forms";

describe("Cosmichronica motion", () => {
  it("keeps the particle field deterministic and visibly varied", () => {
    const first = buildParticleAppearance(4000);
    const second = buildParticleAppearance(4000);
    const alphas = Array.from(first.colors).filter(
      (_, index) => index % 4 === 3
    );

    expect(first.sizes).toEqual(second.sizes);
    expect(first.colors).toEqual(second.colors);
    expect(Math.min(...first.sizes)).toBeLessThan(0.03);
    expect(Math.max(...first.sizes)).toBeGreaterThan(0.13);
    expect(Math.min(...alphas)).toBeLessThan(0.25);
    expect(Math.max(...alphas)).toBeGreaterThan(0.9);
  });

  it("adds an orbit only during the handoff and alternates its direction", () => {
    const start = phaseCameraArc(1, 0);

    expect(start.azimuth).toBeCloseTo(0);
    expect(start.elevation).toBeCloseTo(0);
    expect(start.radius).toBeCloseTo(0);
    expect(phaseCameraArc(1, 1).radius).toBeCloseTo(0);
    expect(phaseCameraArc(1, 0.5).azimuth).toBeLessThan(0);
    expect(phaseCameraArc(2, 0.5).azimuth).toBeGreaterThan(0);
    expect(phaseCameraArc(2, 0.5).radius).toBeGreaterThan(0);
  });

  it("settles Omega before the closing-section cutoff", () => {
    expect(phaseState(0.9)).toMatchObject({ index: 7, settled: true });
    expect(phaseState(0.989)).toMatchObject({ index: 7, settled: true });
  });
});
