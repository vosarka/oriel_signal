import { describe, expect, it, vi } from "vitest";
import type { Context } from "./_core/context";

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getLatestStaticSignature: vi.fn(async () => ({
      fractalRole: "Catalyst",
      vrcType: "Resonator",
      vrcAuthority: "The Seal",
      authorityNode: "The Authority",
      birthDate: "1990-01-02",
      birthTime: "03:04",
      birthCity: "Bucharest",
      birthCountry: "Romania",
      primeStack: [{ codonName: "Returning", codon: 24, center: "Return" }],
    })),
    getReadingCount: vi.fn(async () => 4),
    getProfileConsoleActivity: vi.fn(async () => ({
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
    })),
  };
});

const db = await import("./db");
const { appRouter } = await import("./routers");

describe("profile.getProfileConsoleSummary", () => {
  it("returns profile console counts without paid tier data", async () => {
    const caller = appRouter.createCaller({
      user: {
        id: 7,
        openId: "test-user",
        name: "Test User",
        email: "test@example.com",
        role: "user",
        donated: 15,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      } as any,
    } as Context);

    const summary = await caller.profile.getProfileConsoleSummary();

    expect(summary.counts).toMatchObject({
      lumens: 35,
      readingCount: 4,
      transmissionsReadCount: 3,
      interactionCount: 8,
      acceptedMemoryCount: 2,
    });
    expect(summary.identity.userId).toBe(7);
    expect(summary.identity).toMatchObject({
      resonanceRole: "Sovereign",
      secondaryRole: null,
      fractalRole: "Catalyst",
      vrcType: "Resonator",
      vrcAuthority: "The Seal",
      primeCodonName: "Returning",
    });
    expect(typeof summary.identity.roleConfidence).toBe("number");
    expect(summary.identity.roleConfidence).toBeGreaterThan(0);
    expect(summary.recent.latestTransmission?.status).toBe("revealed");
    expect(db.getLatestStaticSignature).toHaveBeenCalledWith(7);
    expect(db.getReadingCount).toHaveBeenCalledWith(7);
    expect(db.getProfileConsoleActivity).toHaveBeenCalledWith(7);
    expect(summary).not.toHaveProperty("tier");
    expect(summary).not.toHaveProperty("subscription");
  });
});
