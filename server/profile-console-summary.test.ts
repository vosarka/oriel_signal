import { describe, expect, it } from "vitest";
import {
  buildProfileConsoleSummary,
  calculateReceiverLevel,
} from "./profile-console-summary";

describe("calculateReceiverLevel", () => {
  it("counts readings, transmissions, memories, lumens, and light ORIEL contact", () => {
    const level = calculateReceiverLevel({
      lumens: 10,
      readingCount: 2,
      transmissionsReadCount: 3,
      interactionCount: 8,
      acceptedMemoryCount: 1,
    });

    expect(level.currentPoints).toBe(94);
    expect(level.level).toBe(2);
    expect(level.title).toBe("Attuned Receiver");
    expect(level.nextLevelPoints).toBe(100);
    expect(level.progressPercent).toBe(90);
  });

  it("gives every ORIEL interaction a small private contribution", () => {
    const level = calculateReceiverLevel({
      lumens: 0,
      readingCount: 0,
      transmissionsReadCount: 0,
      interactionCount: 1,
      acceptedMemoryCount: 0,
    });

    expect(level.currentPoints).toBe(0.25);
    expect(level.level).toBe(1);
    expect(level.progressPercent).toBe(1);
  });

  it("caps progress at the highest level", () => {
    const level = calculateReceiverLevel({
      lumens: 2000,
      readingCount: 20,
      transmissionsReadCount: 20,
      interactionCount: 200,
      acceptedMemoryCount: 20,
    });

    expect(level.level).toBe(10);
    expect(level.title).toBe("Luminous Witness");
    expect(level.nextLevelPoints).toBeNull();
    expect(level.progressPercent).toBe(100);
  });
});

describe("buildProfileConsoleSummary", () => {
  it("preserves Lumens, identity values, birth coordinate, and recent metadata", () => {
    const summary = buildProfileConsoleSummary({
      userId: 7,
      donated: 15,
      readingCount: 4,
      staticProfile: {
        fractalRole: "Catalyst",
        vrcType: "Resonator",
        vrcAuthority: "The Seal",
        authorityNode: "The Authority",
        birthDate: "1990-01-02",
        birthTime: "03:04",
        birthCity: "Bucharest",
        birthCountry: "Romania",
        primeStack: [{ codonName: "Returning", codon: 24, center: "Return" }],
      },
      activity: {
        interactionCount: 8,
        lastInteraction: new Date("2026-07-01T10:00:00Z"),
        knownName: "Vos",
        acceptedMemoryCount: 2,
        transmissionsReadCount: 3,
        latestConversation: {
          id: 12,
          title: "Signal thread",
          updatedAt: new Date("2026-07-02T10:00:00Z"),
        },
        latestTransmission: {
          id: 22,
          eventKey: "tx-demo",
          rarity: "rare",
          meaningLevel: 4,
          status: "revealed",
          createdAt: new Date("2026-07-03T10:00:00Z"),
          promotedArchiveId: null,
        },
        latestReading: {
          id: 5,
          createdAt: new Date("2026-07-04T10:00:00Z"),
          flaggedCodons: "RC24,RC57",
          microCorrection: "Breathe before reply",
        },
      },
    });

    expect(summary.counts.lumens).toBe(35);
    expect(summary.counts.readingCount).toBe(4);
    expect(summary.counts.transmissionsReadCount).toBe(3);
    expect(summary.identity.userId).toBe(7);
    expect(summary.identity.knownName).toBe("Vos");
    expect(summary.identity.fractalRole).toBe("Catalyst");
    expect(summary.identity.vrcType).toBe("Resonator");
    expect(summary.identity.vrcAuthority).toBe("The Seal");
    expect(summary.identity.primeCodonName).toBe("Returning");
    expect(summary.identity.primeCodon).toBe(24);
    expect(summary.identity.primeCenter).toBe("Return");
    expect(summary.identity.resonanceRole).toBeNull();
    expect(summary.identity.birthCoordinate).toBe(
      "1990-01-02 · 03:04 · Bucharest, Romania"
    );
    expect(summary.recent.lastOrielContact).toEqual(
      new Date("2026-07-01T10:00:00Z")
    );
    expect(summary.recent.latestConversation?.title).toBe("Signal thread");
    expect(summary.recent.latestTransmission?.eventKey).toBe("tx-demo");
    expect(summary.recent.latestReading?.flaggedCodons).toBe("RC24,RC57");
    expect(summary).not.toHaveProperty("subscriptionStatus");
    expect(summary).not.toHaveProperty("paidTier");
  });
});
