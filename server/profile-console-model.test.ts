import { describe, expect, it } from "vitest";
import {
  buildProfileGraphNodes,
  buildProfileStats,
  formatProfileDate,
  getProfileDisplayName,
  getStableConduitId,
} from "../client/src/pages/profile-console-model";

const summary = {
  identity: {
    hasStaticSignature: true,
  },
  counts: {
    lumens: 35,
    readingCount: 4,
    transmissionsReadCount: 3,
    interactionCount: 8,
    acceptedMemoryCount: 2,
  },
};

describe("profile-console-model", () => {
  it("formats the user identity without random conduit IDs", () => {
    expect(getProfileDisplayName({ name: "Vos", email: "vos@example.com" })).toBe(
      "Vos"
    );
    expect(getProfileDisplayName({ name: null, email: "vos@example.com" })).toBe(
      "vos"
    );
    expect(getStableConduitId({ id: 42 })).toBe("ORIEL-0042");
    expect(getStableConduitId({ id: 42, conduitId: "ORIEL-CUSTOM" })).toBe(
      "ORIEL-CUSTOM"
    );
  });

  it("formats profile dates with quiet empty states", () => {
    expect(formatProfileDate(null)).toBe("Awaiting signal");
    expect(formatProfileDate(new Date("2026-07-04T10:00:00Z"))).toContain(
      "2026"
    );
  });

  it("builds stat cards from real summary counts", () => {
    const stats = buildProfileStats(summary);
    expect(stats.map(stat => stat.value)).toEqual(["35", "8", "4", "3", "2"]);
    expect(stats.map(stat => stat.label)).toEqual([
      "Lumens",
      "ORIEL interactions",
      "Readings",
      "Transmissions read",
      "Accepted memories",
    ]);
  });

  it("builds graph nodes without fake counts", () => {
    const nodes = buildProfileGraphNodes(summary);
    expect(nodes).toEqual([
      { id: "oriel", label: "ORIEL", value: "8", tone: "gold" },
      { id: "readings", label: "Readings", value: "4", tone: "teal" },
      {
        id: "transmissions",
        label: "Transmissions",
        value: "3",
        tone: "gold",
      },
      { id: "memory", label: "Memory", value: "2", tone: "silver" },
      {
        id: "signature",
        label: "Static Signature",
        value: "Linked",
        tone: "gold",
      },
      { id: "signal", label: "Current Signal", value: "Live", tone: "teal" },
    ]);
  });
});
