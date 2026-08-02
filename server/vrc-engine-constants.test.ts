import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { CODON_CENTER_MAP, VRC_CHANNELS } from "./vrc-mandala";
import { getVrcCenters, getVrcChannels } from "./vrc-engine-constants";

type CanonLink = {
  id: string;
  center_a: string;
  center_b: string;
  codon_a: number;
  codon_b: number;
};

const centerIdByName = {
  Origin: "I",
  Mental: "II",
  Collapse: "III",
  Saturation: "IV",
  Bridge: "V",
  Becoming: "VI",
  Return: "VII",
  Omega: "VIII",
} as const;

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

  it("derives every runtime link endpoint from the Part VI codon roster", () => {
    for (const channel of getVrcChannels()) {
      expect(channel.connects).toEqual([
        CODON_CENTER_MAP[channel.gate_a].toUpperCase(),
        CODON_CENTER_MAP[channel.gate_b].toUpperCase(),
      ]);
    }
  });

  it("keeps the canonical 32-link data aligned with the Part VI codon roster", () => {
    const canonPath = fileURLToPath(
      new URL(
        "../codex/vrc_static_signature/01_DATA/resonance_links.json",
        import.meta.url
      )
    );
    const links = JSON.parse(readFileSync(canonPath, "utf8")) as CanonLink[];

    expect(links).toHaveLength(32);
    for (const link of links) {
      expect(link.center_a, `${link.id} center_a`).toBe(
        centerIdByName[CODON_CENTER_MAP[link.codon_a]]
      );
      expect(link.center_b, `${link.id} center_b`).toBe(
        centerIdByName[CODON_CENTER_MAP[link.codon_b]]
      );
    }
  });
});
