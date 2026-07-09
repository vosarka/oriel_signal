import { describe, expect, it } from "vitest";
import { VRC_CHANNELS } from "./vrc-mandala";
import { getVrcCenters, getVrcChannels } from "./vrc-engine-constants";

describe("vrc-engine-constants.json (VTRS v2)", () => {
  it("exposes 8 Tetradic centers and 32 resonance links", () => {
    expect(getVrcCenters()).toHaveLength(8);
    expect(getVrcChannels()).toHaveLength(32);
  });

  it("channel pairs align with vrc-mandala VRC_CHANNELS", () => {
    const jsonPairs = getVrcChannels()
      .map(ch => `${ch.gate_a}-${ch.gate_b}`)
      .sort();
    const mandalaPairs = VRC_CHANNELS.map(([a, b]) => `${a}-${b}`).sort();
    expect(jsonPairs).toEqual(mandalaPairs);
  });
});