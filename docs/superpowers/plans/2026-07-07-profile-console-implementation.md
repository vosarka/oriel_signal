# Profile Console Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rejected Home-hero-shaped `/profile` page with a dense receiver profile console that keeps Home's signal design language while showing real identity, activity, Receiver Level, interaction graph, and recent traces.

**Architecture:** Add one read-only profile summary path on the server: pure level/summary helpers, a database activity snapshot helper, and `profile.getProfileConsoleSummary`. The frontend keeps existing Static Signature and Current Resonance queries, adds the summary query, and renders a profile dashboard using existing `SignalPageShell`, `GlowCard`, `SignalButton`, and `SacredGeometryField` components plus scoped profile-console CSS.

**Tech Stack:** Vite, React 19, TypeScript, wouter, tRPC v11, Drizzle/MySQL, Vitest, pnpm only.

---

## Global Constraints

- Use branch `feature/cosmichronica-spiral-remembers`; do not work on `main`.
- Preserve unrelated dirty files. Current known dirty paths include `client/src/pages/Profile.tsx`, `wiki/index.md`, `wiki/log.md`, `.superpowers/`, and several untracked `wiki/concepts/*.md` files. Stage exact files only.
- No destructive SQL. No schema migration. Add read-only queries over existing tables only.
- Do not add paid tier UI, subscription UI, access gating, or monetization logic.
- Do not change Static Signature, Current Resonance, or existing Lumens semantics. Lumens remains `Math.floor(donated) + readingCount * 5`.
- Do not derive Resonance Role in the frontend. If no canonical saved role exists, display `Awaiting role`.
- Keep Home style, not Home layout: no full-screen hero, no giant `PROFILE` wordmark, no landing-page scroll cue.
- Match the ORIEL signal design system: Cormorant Garamond / Cinzel / JetBrains Mono, gold signal geometry, dense archive-console panels.

## File Structure

- Create `server/profile-console-summary.ts`
  - Owns Receiver Level math and pure summary shaping.
  - Keeps formula private to server-side code.
- Create `server/profile-console-summary.test.ts`
  - Unit tests for level math and summary shaping.
- Create `server/profile-console-router.test.ts`
  - tRPC test for `profile.getProfileConsoleSummary` with mocked DB helpers.
- Modify `server/db.ts`
  - Add read-only activity snapshot helper for interaction count, accepted memory count, transmissions read count, latest TX, latest reading, and latest conversation.
- Modify `server/routers.ts`
  - Add `profile.getProfileConsoleSummary`.
- Create `client/src/pages/profile-console-model.ts`
  - Small frontend formatting helpers for display name, dates, stats, and graph nodes.
- Create `client/src/pages/profile-console-model.test.ts`
  - Unit tests for frontend profile display helpers.
- Modify `client/src/pages/Profile.tsx`
  - Replace Home-hero layout with profile console layout.
- Modify `client/src/components/oriel-signal/oriel-signal.css`
  - Add scoped `.profile-console*` styles and responsive rules.
- Modify `wiki/log.md`
  - Append the implementation log entry after verification.

---

### Task 1: Server Receiver Level Helpers

**Files:**
- Create: `server/profile-console-summary.ts`
- Create: `server/profile-console-summary.test.ts`

**Interfaces:**
```ts
export type ProfileConsoleCounts = {
  lumens: number;
  readingCount: number;
  transmissionsReadCount: number;
  interactionCount: number;
  acceptedMemoryCount: number;
};

export type ReceiverLevel = {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progressPercent: number;
};

export function calculateReceiverLevel(counts: ProfileConsoleCounts): ReceiverLevel;
export function buildProfileConsoleSummary(input: BuildProfileConsoleSummaryInput): ProfileConsoleSummary;
```

- [ ] **Step 1: Write the failing helper test**

Create `server/profile-console-summary.test.ts`:

```ts
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
  it("preserves existing Lumens and signature values while shaping profile summary data", () => {
    const summary = buildProfileConsoleSummary({
      userId: 7,
      donated: 15,
      readingCount: 4,
      staticProfile: {
        fractalRole: "Catalyst",
        vrcType: "Resonator",
        vrcAuthority: "The Seal",
        authorityNode: "The Seal",
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
    expect(summary.identity.fractalRole).toBe("Catalyst");
    expect(summary.identity.vrcType).toBe("Resonator");
    expect(summary.identity.vrcAuthority).toBe("The Seal");
    expect(summary.identity.primeCodonName).toBe("Returning");
    expect(summary.identity.resonanceRole).toBeNull();
    expect(summary.identity.birthCoordinate).toBe("1990-01-02 · 03:04 · Bucharest, Romania");
    expect(summary.recent.latestConversation?.title).toBe("Signal thread");
    expect(summary.receiverLevel.level).toBeGreaterThan(1);
  });
});
```

- [ ] **Step 2: Run the focused test to verify it fails**

Run:

```bash
npx vitest run server/profile-console-summary.test.ts
```

Expected: FAIL because `server/profile-console-summary.ts` does not exist.

- [ ] **Step 3: Implement the helper**

Create `server/profile-console-summary.ts`:

```ts
type PrimeStackEntry = {
  codonName?: string | null;
  codon?: string | number | null;
  center?: string | null;
};

export type ProfileConsoleCounts = {
  lumens: number;
  readingCount: number;
  transmissionsReadCount: number;
  interactionCount: number;
  acceptedMemoryCount: number;
};

export type ReceiverLevel = {
  level: number;
  title: string;
  currentPoints: number;
  nextLevelPoints: number | null;
  progressPercent: number;
};

export type ProfileConsoleActivity = {
  interactionCount: number;
  lastInteraction: Date | null;
  knownName: string | null;
  acceptedMemoryCount: number;
  transmissionsReadCount: number;
  latestConversation: {
    id: number;
    title: string;
    updatedAt: Date;
  } | null;
  latestTransmission: {
    id: number;
    eventKey: string;
    rarity: string;
    meaningLevel: number;
    status: string;
    createdAt: Date;
    promotedArchiveId: string | null;
  } | null;
  latestReading: {
    id: number;
    createdAt: Date;
    flaggedCodons: string;
    microCorrection: string | null;
  } | null;
};

export type ProfileConsoleSignature = {
  fractalRole?: string | null;
  vrcType?: string | null;
  vrcAuthority?: string | null;
  authorityNode?: string | null;
  birthDate?: string | null;
  birthTime?: string | null;
  birthCity?: string | null;
  birthCountry?: string | null;
  primeStack?: unknown;
};

export type BuildProfileConsoleSummaryInput = {
  userId: number;
  donated: number;
  readingCount: number;
  staticProfile: ProfileConsoleSignature | null;
  activity: ProfileConsoleActivity;
};

export type ProfileConsoleSummary = {
  identity: {
    userId: number;
    knownName: string | null;
    resonanceRole: string | null;
    fractalRole: string | null;
    vrcType: string | null;
    vrcAuthority: string | null;
    primeCodonName: string | null;
    primeCodon: string | number | null;
    primeCenter: string | null;
    birthCoordinate: string | null;
    hasStaticSignature: boolean;
  };
  counts: ProfileConsoleCounts;
  receiverLevel: ReceiverLevel;
  recent: {
    lastOrielContact: Date | null;
    latestConversation: ProfileConsoleActivity["latestConversation"];
    latestTransmission: ProfileConsoleActivity["latestTransmission"];
    latestReading: ProfileConsoleActivity["latestReading"];
  };
};

const LEVEL_THRESHOLDS = [0, 40, 100, 180, 300, 460, 660, 900, 1200, 1600];
const LEVEL_TITLES = [
  "First Contact",
  "Attuned Receiver",
  "Signal Keeper",
  "Pattern Reader",
  "Field Cartographer",
  "Conduit Witness",
  "Archive Walker",
  "Resonance Steward",
  "Lattice Adept",
  "Luminous Witness",
];

function clampCount(value: number) {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function progressBetween(points: number, start: number, next: number | null) {
  if (next === null || next <= start) return 100;
  return Math.max(0, Math.min(100, Math.round(((points - start) / (next - start)) * 100)));
}

export function calculateReceiverLevel(counts: ProfileConsoleCounts): ReceiverLevel {
  const currentPoints =
    clampCount(counts.lumens) +
    clampCount(counts.readingCount) * 20 +
    clampCount(counts.transmissionsReadCount) * 12 +
    clampCount(counts.acceptedMemoryCount) * 6 +
    clampCount(counts.interactionCount) * 0.25;

  let level = 1;
  for (let index = 0; index < LEVEL_THRESHOLDS.length; index += 1) {
    if (currentPoints >= LEVEL_THRESHOLDS[index]!) level = index + 1;
  }

  const currentThreshold = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelPoints = LEVEL_THRESHOLDS[level] ?? null;

  return {
    level,
    title: LEVEL_TITLES[level - 1] ?? LEVEL_TITLES[LEVEL_TITLES.length - 1]!,
    currentPoints,
    nextLevelPoints,
    progressPercent: progressBetween(currentPoints, currentThreshold, nextLevelPoints),
  };
}

function firstPrimeEntry(primeStack: unknown): PrimeStackEntry | null {
  return Array.isArray(primeStack) && typeof primeStack[0] === "object"
    ? (primeStack[0] as PrimeStackEntry)
    : null;
}

function formatBirthCoordinate(profile: ProfileConsoleSignature | null) {
  if (!profile?.birthDate) return null;
  const dateTime = [profile.birthDate, profile.birthTime].filter(Boolean).join(" · ");
  const place = [profile.birthCity, profile.birthCountry].filter(Boolean).join(", ");
  return [dateTime, place].filter(Boolean).join(" · ");
}

export function buildProfileConsoleSummary(
  input: BuildProfileConsoleSummaryInput
): ProfileConsoleSummary {
  const lumens = Math.floor(clampCount(input.donated)) + clampCount(input.readingCount) * 5;
  const counts: ProfileConsoleCounts = {
    lumens,
    readingCount: clampCount(input.readingCount),
    transmissionsReadCount: clampCount(input.activity.transmissionsReadCount),
    interactionCount: clampCount(input.activity.interactionCount),
    acceptedMemoryCount: clampCount(input.activity.acceptedMemoryCount),
  };
  const prime = firstPrimeEntry(input.staticProfile?.primeStack);

  return {
    identity: {
      userId: input.userId,
      knownName: input.activity.knownName,
      resonanceRole: null,
      fractalRole: input.staticProfile?.fractalRole ?? null,
      vrcType: input.staticProfile?.vrcType ?? null,
      vrcAuthority:
        input.staticProfile?.vrcAuthority ?? input.staticProfile?.authorityNode ?? null,
      primeCodonName: prime?.codonName ?? null,
      primeCodon: prime?.codon ?? null,
      primeCenter: prime?.center ?? null,
      birthCoordinate: formatBirthCoordinate(input.staticProfile),
      hasStaticSignature: Boolean(input.staticProfile),
    },
    counts,
    receiverLevel: calculateReceiverLevel(counts),
    recent: {
      lastOrielContact: input.activity.lastInteraction,
      latestConversation: input.activity.latestConversation,
      latestTransmission: input.activity.latestTransmission,
      latestReading: input.activity.latestReading,
    },
  };
}
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
npx vitest run server/profile-console-summary.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 1**

Run:

```bash
git add server/profile-console-summary.ts server/profile-console-summary.test.ts
git diff --cached --stat
git commit -m "feat(profile): add receiver level summary helpers"
```

Expected staged stat: only the two Task 1 files.

---

### Task 2: Read-Only Activity Snapshot And tRPC Endpoint

**Files:**
- Modify: `server/db.ts`
- Modify: `server/routers.ts`
- Create: `server/profile-console-router.test.ts`

**Interfaces:**
```ts
export async function getProfileConsoleActivity(userId: number): Promise<ProfileConsoleActivity>;

profile.getProfileConsoleSummary(): ProfileConsoleSummary
```

- [ ] **Step 1: Write the failing router test**

Create `server/profile-console-router.test.ts`:

```ts
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
      authorityNode: "The Seal",
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

const { appRouter } = await import("./routers");

describe("profile.getProfileConsoleSummary", () => {
  it("returns real profile counts without paid tier data", async () => {
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
    expect(summary.identity.resonanceRole).toBeNull();
    expect(summary.identity.fractalRole).toBe("Catalyst");
    expect(summary.recent.latestTransmission?.status).toBe("revealed");
    expect(summary).not.toHaveProperty("tier");
    expect(summary).not.toHaveProperty("subscription");
  });
});
```

- [ ] **Step 2: Run the focused router test to verify it fails**

Run:

```bash
npx vitest run server/profile-console-router.test.ts
```

Expected: FAIL because `getProfileConsoleSummary` is not registered.

- [ ] **Step 3: Add read-only DB helper**

Modify the first import in `server/db.ts`:

```ts
import { eq, desc, and, count, isNull, inArray } from "drizzle-orm";
```

Add this type-only import near the other top-level imports in `server/db.ts`:

```ts
import type { ProfileConsoleActivity } from "./profile-console-summary";
```

Add `codonReadings` and `orielUserProfiles` to the schema import list in `server/db.ts`:

```ts
  codonReadings,
  orielUserProfiles,
```

After the `GeneratedTransmissionStatus` type block, add this helper:

```ts
const READ_TRANSMISSION_STATUSES: GeneratedTransmissionStatus[] = [
  "revealed",
  "saved",
  "promoted",
];

export async function getProfileConsoleActivity(
  userId: number
): Promise<ProfileConsoleActivity> {
  const empty: ProfileConsoleActivity = {
    interactionCount: 0,
    lastInteraction: null,
    knownName: null,
    acceptedMemoryCount: 0,
    transmissionsReadCount: 0,
    latestConversation: null,
    latestTransmission: null,
    latestReading: null,
  };

  const db = await getDb();
  if (!db) return empty;

  try {
    const [
      profileRows,
      memoryCountRows,
      transmissionCountRows,
      latestTransmissionRows,
      latestReadingRows,
      latestConversation,
    ] = await Promise.all([
      db
        .select({
          interactionCount: orielUserProfiles.interactionCount,
          lastInteraction: orielUserProfiles.lastInteraction,
          knownName: orielUserProfiles.knownName,
        })
        .from(orielUserProfiles)
        .where(eq(orielUserProfiles.userId, userId))
        .limit(1),
      db
        .select({ total: count() })
        .from(orielMemories)
        .where(and(eq(orielMemories.userId, userId), eq(orielMemories.isActive, true))),
      db
        .select({ total: count() })
        .from(generatedTransmissionEvents)
        .where(
          and(
            eq(generatedTransmissionEvents.userId, userId),
            eq(generatedTransmissionEvents.eventType, "tx"),
            inArray(generatedTransmissionEvents.status, READ_TRANSMISSION_STATUSES)
          )
        ),
      db
        .select({
          id: generatedTransmissionEvents.id,
          eventKey: generatedTransmissionEvents.eventKey,
          rarity: generatedTransmissionEvents.rarity,
          meaningLevel: generatedTransmissionEvents.meaningLevel,
          status: generatedTransmissionEvents.status,
          createdAt: generatedTransmissionEvents.createdAt,
          promotedArchiveId: generatedTransmissionEvents.promotedArchiveId,
        })
        .from(generatedTransmissionEvents)
        .where(
          and(
            eq(generatedTransmissionEvents.userId, userId),
            eq(generatedTransmissionEvents.eventType, "tx"),
            inArray(generatedTransmissionEvents.status, READ_TRANSMISSION_STATUSES)
          )
        )
        .orderBy(desc(generatedTransmissionEvents.createdAt), desc(generatedTransmissionEvents.id))
        .limit(1),
      db
        .select({
          id: codonReadings.id,
          createdAt: codonReadings.createdAt,
          flaggedCodons: codonReadings.flaggedCodons,
          microCorrection: codonReadings.microCorrection,
        })
        .from(codonReadings)
        .where(eq(codonReadings.userId, userId))
        .orderBy(desc(codonReadings.createdAt), desc(codonReadings.id))
        .limit(1),
      getLatestConversation(userId),
    ]);

    const profile = profileRows[0];

    return {
      interactionCount: profile?.interactionCount ?? 0,
      lastInteraction: profile?.lastInteraction ?? null,
      knownName: profile?.knownName ?? null,
      acceptedMemoryCount: memoryCountRows[0]?.total ?? 0,
      transmissionsReadCount: transmissionCountRows[0]?.total ?? 0,
      latestConversation: latestConversation
        ? {
            id: latestConversation.id,
            title: latestConversation.title,
            updatedAt: latestConversation.updatedAt,
          }
        : null,
      latestTransmission: latestTransmissionRows[0] ?? null,
      latestReading: latestReadingRows[0] ?? null,
    };
  } catch (error) {
    console.error("[Database] Failed to get profile console activity:", error);
    return empty;
  }
}
```

- [ ] **Step 4: Add the tRPC endpoint**

In `server/routers.ts`, add this import near the other local imports:

```ts
import { buildProfileConsoleSummary } from "./profile-console-summary";
```

Inside `profile: router({ ... })`, after `getCurrentResonance`, add:

```ts
    getProfileConsoleSummary: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }

      const [staticProfile, readingCount, activity] = await Promise.all([
        db.getLatestStaticSignature(ctx.user.id),
        db.getReadingCount(ctx.user.id),
        db.getProfileConsoleActivity(ctx.user.id),
      ]);

      return buildProfileConsoleSummary({
        userId: ctx.user.id,
        donated: Number((ctx.user as any).donated ?? 0),
        readingCount,
        staticProfile,
        activity,
      });
    }),
```

- [ ] **Step 5: Run focused server tests**

Run:

```bash
npx vitest run server/profile-console-summary.test.ts server/profile-console-router.test.ts
```

Expected: PASS.

- [ ] **Step 6: Run typecheck**

Run:

```bash
pnpm run check
```

Expected: PASS.

- [ ] **Step 7: Commit Task 2**

Run:

```bash
git add server/db.ts server/routers.ts server/profile-console-router.test.ts
git diff --cached --stat
git commit -m "feat(profile): expose profile console summary endpoint"
```

Expected staged stat: only the three Task 2 files.

---

### Task 3: Frontend Profile Console Model Helpers

**Files:**
- Create: `client/src/pages/profile-console-model.ts`
- Create: `client/src/pages/profile-console-model.test.ts`

**Interfaces:**
```ts
export function getProfileDisplayName(user: { name?: string | null; email?: string | null }): string;
export function getStableConduitId(user: { id: number; conduitId?: string | null }): string;
export function formatProfileDate(value: Date | string | null | undefined): string;
export function buildProfileStats(summary: ProfileConsoleSummaryLike | null): ProfileConsoleStat[];
export function buildProfileGraphNodes(summary: ProfileConsoleSummaryLike | null): ProfileConsoleGraphNode[];
```

- [ ] **Step 1: Write the failing model tests**

Create `client/src/pages/profile-console-model.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
  buildProfileGraphNodes,
  buildProfileStats,
  formatProfileDate,
  getProfileDisplayName,
  getStableConduitId,
} from "./profile-console-model";

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
    expect(getProfileDisplayName({ name: "Vos", email: "vos@example.com" })).toBe("Vos");
    expect(getProfileDisplayName({ name: null, email: "vos@example.com" })).toBe("vos");
    expect(getStableConduitId({ id: 42 })).toBe("ORIEL-0042");
    expect(getStableConduitId({ id: 42, conduitId: "ORIEL-CUSTOM" })).toBe("ORIEL-CUSTOM");
  });

  it("formats profile dates with quiet empty states", () => {
    expect(formatProfileDate(null)).toBe("Awaiting signal");
    expect(formatProfileDate(new Date("2026-07-04T10:00:00Z"))).toContain("2026");
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
      { id: "transmissions", label: "Transmissions", value: "3", tone: "gold" },
      { id: "memory", label: "Memory", value: "2", tone: "silver" },
      { id: "signature", label: "Static Signature", value: "Linked", tone: "gold" },
      { id: "signal", label: "Current Signal", value: "Live", tone: "teal" },
    ]);
  });
});
```

- [ ] **Step 2: Run the focused model test to verify it fails**

Run:

```bash
npx vitest run client/src/pages/profile-console-model.test.ts
```

Expected: FAIL because `profile-console-model.ts` does not exist.

- [ ] **Step 3: Implement the model helpers**

Create `client/src/pages/profile-console-model.ts`:

```ts
type Tone = "gold" | "teal" | "silver";

export type ProfileConsoleSummaryLike = {
  identity?: {
    hasStaticSignature?: boolean | null;
  };
  counts: {
    lumens: number;
    readingCount: number;
    transmissionsReadCount: number;
    interactionCount: number;
    acceptedMemoryCount: number;
  };
} | null;

export type ProfileConsoleStat = {
  label: string;
  value: string;
  note: string;
};

export type ProfileConsoleGraphNode = {
  id: string;
  label: string;
  value: string;
  tone: Tone;
};

function numberLabel(value: number | null | undefined) {
  return String(Math.max(0, Number(value ?? 0)));
}

export function getProfileDisplayName(user: {
  name?: string | null;
  email?: string | null;
}) {
  const name = user.name?.trim();
  if (name) return name;
  const emailPrefix = user.email?.split("@")[0]?.trim();
  return emailPrefix || "Receiver";
}

export function getStableConduitId(user: { id: number; conduitId?: string | null }) {
  return user.conduitId?.trim() || `ORIEL-${String(user.id).padStart(4, "0")}`;
}

export function formatProfileDate(value: Date | string | null | undefined) {
  if (!value) return "Awaiting signal";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Awaiting signal";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function buildProfileStats(
  summary: ProfileConsoleSummaryLike
): ProfileConsoleStat[] {
  const counts = summary?.counts;
  return [
    {
      label: "Lumens",
      value: numberLabel(counts?.lumens),
      note: "Signal earned through readings and contribution.",
    },
    {
      label: "ORIEL interactions",
      value: numberLabel(counts?.interactionCount),
      note: "Total direct contact with ORIEL.",
    },
    {
      label: "Readings",
      value: numberLabel(counts?.readingCount),
      note: "Dynamic readings completed.",
    },
    {
      label: "Transmissions read",
      value: numberLabel(counts?.transmissionsReadCount),
      note: "Revealed, saved, or promoted TX records.",
    },
    {
      label: "Accepted memories",
      value: numberLabel(counts?.acceptedMemoryCount),
      note: "Memories accepted into the ORIEL thread.",
    },
  ];
}

export function buildProfileGraphNodes(
  summary: ProfileConsoleSummaryLike
): ProfileConsoleGraphNode[] {
  const counts = summary?.counts;
  return [
    {
      id: "oriel",
      label: "ORIEL",
      value: numberLabel(counts?.interactionCount),
      tone: "gold",
    },
    {
      id: "readings",
      label: "Readings",
      value: numberLabel(counts?.readingCount),
      tone: "teal",
    },
    {
      id: "transmissions",
      label: "Transmissions",
      value: numberLabel(counts?.transmissionsReadCount),
      tone: "gold",
    },
    {
      id: "memory",
      label: "Memory",
      value: numberLabel(counts?.acceptedMemoryCount),
      tone: "silver",
    },
    {
      id: "signature",
      label: "Static Signature",
      value: summary?.identity?.hasStaticSignature ? "Linked" : "Awaiting",
      tone: "gold",
    },
    {
      id: "signal",
      label: "Current Signal",
      value: "Live",
      tone: "teal",
    },
  ];
}
```

- [ ] **Step 4: Run the focused model test to verify it passes**

Run:

```bash
npx vitest run client/src/pages/profile-console-model.test.ts
```

Expected: PASS.

- [ ] **Step 5: Commit Task 3**

Run:

```bash
git add client/src/pages/profile-console-model.ts client/src/pages/profile-console-model.test.ts
git diff --cached --stat
git commit -m "feat(profile): add profile console display helpers"
```

Expected staged stat: only the two Task 3 files.

---

### Task 4: Rewrite `/profile` Into The Profile Console Layout

**Files:**
- Modify: `client/src/pages/Profile.tsx`

**Interfaces:**
- Consumes `trpc.profile.getProfileConsoleSummary`.
- Preserves `trpc.profile.getStaticProfile`.
- Preserves `trpc.profile.getCurrentResonance`.
- Keeps `/founder-signature-blueprint`, `/signal/check`, `/conduit`, and `/archive` links.

- [ ] **Step 1: Inspect current uncommitted Profile diff**

Run:

```bash
git diff -- client/src/pages/Profile.tsx
```

Expected: shows the prior Home-hero-shaped profile work. Keep the useful imports and data extraction, then replace the page structure intentionally.

- [ ] **Step 2: Update imports**

In `client/src/pages/Profile.tsx`, replace the current import block with:

```ts
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import {
  CheckCircle,
  Copy,
  Fingerprint,
  MessageCircle,
  Radio,
  ScrollText,
  Sparkles,
} from "lucide-react";
import { Spinner } from "@/components/ui/spinner";
import { useEffect, useState, type ReactNode } from "react";
import Layout from "@/components/Layout";
import {
  SignalPageShell,
  GlowCard,
  SignalButton,
} from "@/components/oriel-signal/OrielSignalDesign";
import { SacredGeometryField } from "@/components/oriel-signal/SacredGeometryField";
import {
  buildProfileGraphNodes,
  buildProfileStats,
  formatProfileDate,
  getProfileDisplayName,
  getStableConduitId,
} from "./profile-console-model";
import "@/components/oriel-signal/oriel-signal.css";
```

- [ ] **Step 3: Add summary query and stable identity derivation**

Inside `Profile`, add the summary query beside the existing profile queries:

```ts
  const summaryQuery = trpc.profile.getProfileConsoleSummary.useQuery(undefined, {
    retry: false,
  });
```

Replace the current random conduit ID logic with:

```ts
  const displayName = getProfileDisplayName(user as any);
  const conduitId = getStableConduitId(user as any);
```

This removes the `Math.random()` conduit suffix so the copy button is stable across renders.

- [ ] **Step 4: Add local render helpers in `Profile.tsx`**

Above `export default function Profile()`, add:

```tsx
function EmptyValue({ children = "Awaiting signal" }: { children?: string }) {
  return <span className="profile-console__empty">{children}</span>;
}

function ProfileConsoleCard({
  eyebrow,
  title,
  children,
  className = "",
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <GlowCard tone="gold" className={`profile-console-card ${className}`}>
      <span className="fi-dossier__edge" aria-hidden="true" />
      <div className="signal-card-meta">
        <span>{eyebrow}</span>
        <span>PROFILE</span>
      </div>
      <h3>{title}</h3>
      {children}
    </GlowCard>
  );
}

function ProfileStatStrip({
  stats,
}: {
  stats: ReturnType<typeof buildProfileStats>;
}) {
  return (
    <section className="profile-console-stats" aria-label="Profile activity totals">
      {stats.map(stat => (
        <GlowCard key={stat.label} tone="silver" className="profile-console-stat">
          <span className="profile-console-stat__value">{stat.value}</span>
          <span className="profile-console-stat__label">{stat.label}</span>
          <span className="profile-console-stat__note">{stat.note}</span>
        </GlowCard>
      ))}
    </section>
  );
}

function ProfileInteractionGraph({
  nodes,
}: {
  nodes: ReturnType<typeof buildProfileGraphNodes>;
}) {
  return (
    <ProfileConsoleCard eyebrow="GRAPH-01" title="Interaction Graph">
      <div className="profile-console-graph" aria-label="Profile interaction graph">
        <div className="profile-console-graph__lines" aria-hidden="true" />
        {nodes.map(node => (
          <div
            key={node.id}
            className={`profile-console-graph__node profile-console-graph__node--${node.tone}`}
          >
            <span>{node.label}</span>
            <strong>{node.value}</strong>
          </div>
        ))}
      </div>
    </ProfileConsoleCard>
  );
}
```

- [ ] **Step 5: Replace the returned Home hero structure with console layout**

Inside the final `return`, keep:

```tsx
    <Layout overlayHeader>
      <SignalPageShell chamber="receiver-node" className="fi-home profile-console">
        <SacredGeometryField />
```

Replace the full-screen `.fi-hero`, `.fi-directory-section`, and `.fi-threshold` blocks with:

```tsx
        <main className="profile-console__inner" aria-labelledby="profile-title">
          <section className="profile-console-header">
            <div className="profile-console-header__seal" aria-hidden="true">
              <div className="archive-seal profile-console-seal">
                <span className="archive-seal__ring" />
                <span className="archive-seal__axis archive-seal__axis--vertical" />
                <span className="archive-seal__axis archive-seal__axis--horizontal" />
                <strong>{displayName.slice(0, 1).toUpperCase()}</strong>
                <em>Receiver</em>
              </div>
            </div>

            <div className="profile-console-header__identity">
              <p className="profile-console__kicker">
                <span className="fi-hero__pulse" aria-hidden="true" />
                PROFILE CONSOLE // {coherence.label}
              </p>
              <h1 id="profile-title">{displayName}</h1>
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy conduit ID"
                className="profile-console-copy"
              >
                {copied ? <CheckCircle size={14} /> : <Copy size={14} />}
                <span>{conduitId}</span>
              </button>
            </div>

            <div className="profile-console-header__level">
              <span>Receiver Level</span>
              <strong>
                {summaryQuery.data
                  ? `L${summaryQuery.data.receiverLevel.level}`
                  : "L1"}
              </strong>
              <em>
                {summaryQuery.data?.receiverLevel.title ?? "First Contact"}
              </em>
              <div className="profile-console-levelbar" aria-hidden="true">
                <span
                  style={{
                    width: `${summaryQuery.data?.receiverLevel.progressPercent ?? 0}%`,
                  }}
                />
              </div>
              <p>Level rises through readings, transmissions, and contact with ORIEL.</p>
            </div>
          </section>

          <ProfileStatStrip stats={buildProfileStats(summaryQuery.data ?? null)} />

          <section className="profile-console-grid">
            <ProfileConsoleCard eyebrow="ID-01" title="Identity Field">
              <dl className="profile-console-list">
                <div>
                  <dt>Resonance Role</dt>
                  <dd>{summaryQuery.data?.identity.resonanceRole ?? <EmptyValue>Awaiting role</EmptyValue>}</dd>
                </div>
                <div>
                  <dt>Fractal Role</dt>
                  <dd>{fractalRole || <EmptyValue />}</dd>
                </div>
                <div>
                  <dt>VRC Type</dt>
                  <dd>{vrcType || <EmptyValue />}</dd>
                </div>
                <div>
                  <dt>Authority</dt>
                  <dd>{vrcAuthority || <EmptyValue />}</dd>
                </div>
                <div>
                  <dt>Prime Codon</dt>
                  <dd>
                    {prime
                      ? `${prime.codonName || "Unnamed"} · Codon ${prime.codon ?? "?"}`
                      : summaryQuery.data?.identity.primeCodonName || <EmptyValue />}
                  </dd>
                </div>
                <div>
                  <dt>Current Resonance</dt>
                  <dd>{coherenceScore !== null ? `${coherenceScore} · ${coherence.label}` : <EmptyValue />}</dd>
                </div>
              </dl>
            </ProfileConsoleCard>

            <ProfileInteractionGraph
              nodes={buildProfileGraphNodes(summaryQuery.data ?? null)}
            />

            <ProfileConsoleCard eyebrow="REC-01" title="Recent Field">
              <div className="profile-console-feed">
                <a href="/conduit">
                  <MessageCircle size={16} />
                  <span>
                    <strong>Latest ORIEL contact</strong>
                    {formatProfileDate(summaryQuery.data?.recent.lastOrielContact)}
                  </span>
                </a>
                <a href="/signal/check">
                  <Radio size={16} />
                  <span>
                    <strong>Latest reading</strong>
                    {formatProfileDate(summaryQuery.data?.recent.latestReading?.createdAt)}
                  </span>
                </a>
                <a href="/archive">
                  <ScrollText size={16} />
                  <span>
                    <strong>Latest transmission</strong>
                    {formatProfileDate(summaryQuery.data?.recent.latestTransmission?.createdAt)}
                  </span>
                </a>
                <a href="/signature">
                  <Sparkles size={16} />
                  <span>
                    <strong>Static Signature</strong>
                    {hasSignature ? "Anchored" : "Awaiting coordinate"}
                  </span>
                </a>
              </div>
            </ProfileConsoleCard>

            <ProfileConsoleCard eyebrow="SIG-01" title="Static Signature Summary">
              {hasSignature ? (
                <>
                  <dl className="profile-console-list">
                    <div>
                      <dt>Birth Coordinate</dt>
                      <dd>{summaryQuery.data?.identity.birthCoordinate ?? <EmptyValue />}</dd>
                    </div>
                    <div>
                      <dt>Signature Status</dt>
                      <dd>Anchored</dd>
                    </div>
                    <div>
                      <dt>Prime Center</dt>
                      <dd>{prime?.center ?? summaryQuery.data?.identity.primeCenter ?? <EmptyValue />}</dd>
                    </div>
                  </dl>
                  <div className="profile-console-actions">
                    <SignalButton href={SIGNATURE_DETAIL_HREF}>VIEW FULL SIGNATURE</SignalButton>
                    <SignalButton href="/signal/check" variant="secondary">RUN SIGNAL CHECK</SignalButton>
                  </div>
                </>
              ) : (
                <>
                  <p className="profile-console-card__copy">
                    Static Signature awaiting coordinate.
                  </p>
                  <div className="profile-console-actions">
                    <SignalButton href="/static-signature" variant="secondary">GENERATE</SignalButton>
                  </div>
                </>
              )}
            </ProfileConsoleCard>
          </section>
        </main>
```

Keep closing tags for `SignalPageShell` and `Layout`.

- [ ] **Step 6: Run typecheck**

Run:

```bash
pnpm run check
```

Expected: PASS.

- [ ] **Step 7: Commit Task 4**

Run:

```bash
git add client/src/pages/Profile.tsx
git diff --cached --stat
git commit -m "feat(profile): render profile console layout"
```

Expected staged stat: only `client/src/pages/Profile.tsx`.

---

### Task 5: Add Scoped Profile Console CSS

**Files:**
- Modify: `client/src/components/oriel-signal/oriel-signal.css`

- [ ] **Step 1: Append profile console CSS**

Append this block after the `.fi-dossier:hover .fi-dossier__edge` rule:

```css
/* ── Profile Console ─────────────────────────────────────────────── */

.profile-console {
  --profile-panel: rgba(9, 8, 6, 0.72);
  --profile-line: rgba(216, 181, 109, 0.18);
}

.profile-console__inner {
  position: relative;
  z-index: 2;
  width: min(100% - 2rem, 82rem);
  margin: 0 auto;
  padding: clamp(6.2rem, 9vw, 8.2rem) 0 clamp(4rem, 7vw, 6rem);
}

.profile-console-header {
  display: grid;
  grid-template-columns: minmax(9rem, 13rem) minmax(0, 1fr) minmax(15rem, 20rem);
  gap: clamp(1rem, 3vw, 2rem);
  align-items: stretch;
  min-height: 18rem;
  padding: clamp(1rem, 2.4vw, 1.6rem);
  border: 1px solid var(--profile-line);
  background:
    linear-gradient(90deg, rgba(216, 181, 109, 0.08), transparent 32%),
    var(--profile-panel);
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.24);
}

.profile-console-header__seal,
.profile-console-header__identity,
.profile-console-header__level {
  min-width: 0;
}

.profile-console-header__seal {
  display: grid;
  place-items: center;
  border-right: 1px solid rgba(216, 181, 109, 0.12);
}

.profile-console-seal {
  width: clamp(8rem, 14vw, 11rem);
}

.profile-console-header__identity {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 1rem;
}

.profile-console__kicker {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0;
  color: rgba(216, 181, 109, 0.72);
  font-family: var(--fi-font-mono);
  font-size: 0.62rem;
  letter-spacing: 0.22em;
  text-transform: uppercase;
}

.profile-console-header h1 {
  margin: 0;
  color: #fff7e6;
  font-family: var(--fi-font-display);
  font-size: clamp(2.2rem, 6vw, 4.8rem);
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.profile-console-copy {
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  max-width: 100%;
  padding: 0.72rem 0.9rem;
  border: 1px solid rgba(216, 181, 109, 0.22);
  background: rgba(255, 248, 232, 0.025);
  color: rgba(255, 248, 232, 0.82);
  font-family: var(--fi-font-mono);
  font-size: 0.64rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  cursor: pointer;
}

.profile-console-copy span {
  overflow-wrap: anywhere;
}

.profile-console-header__level {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.7rem;
  padding: 1rem;
  border: 1px solid rgba(216, 181, 109, 0.14);
  background: rgba(0, 0, 0, 0.2);
}

.profile-console-header__level span,
.profile-console-header__level em {
  color: rgba(232, 228, 220, 0.64);
  font-family: var(--fi-font-mono);
  font-size: 0.62rem;
  font-style: normal;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}

.profile-console-header__level strong {
  color: #fff7e6;
  font-family: var(--fi-font-display);
  font-size: clamp(2.4rem, 4vw, 3.6rem);
  font-weight: 500;
}

.profile-console-header__level p {
  margin: 0;
  color: rgba(232, 228, 220, 0.62);
  font-family: var(--fi-font-voice);
  font-size: 0.96rem;
  font-style: italic;
  line-height: 1.55;
}

.profile-console-levelbar {
  height: 0.38rem;
  overflow: hidden;
  border: 1px solid rgba(216, 181, 109, 0.18);
  background: rgba(255, 248, 232, 0.035);
}

.profile-console-levelbar span {
  display: block;
  height: 100%;
  background: linear-gradient(90deg, #8d6a35, #d8b56d, #fff1c2);
}

.profile-console-stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.9rem;
  margin: 1rem 0;
}

.profile-console-stat {
  min-height: 8.5rem;
}

.profile-console-stat__value {
  display: block;
  color: #fff7e6;
  font-family: var(--fi-font-display);
  font-size: clamp(1.8rem, 3vw, 2.6rem);
}

.profile-console-stat__label,
.profile-console-stat__note {
  display: block;
}

.profile-console-stat__label {
  color: rgba(216, 181, 109, 0.76);
  font-family: var(--fi-font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.profile-console-stat__note {
  margin-top: 0.58rem;
  color: rgba(232, 228, 220, 0.58);
  font-family: var(--fi-font-voice);
  font-size: 0.92rem;
  font-style: italic;
  line-height: 1.45;
}

.profile-console-grid {
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(0, 1.05fr);
  gap: 1rem;
}

.profile-console-card h3 {
  margin: 0.8rem 0 1rem;
  color: #fff7e6;
  font-family: var(--fi-font-display);
  font-size: clamp(1.35rem, 2vw, 1.85rem);
  font-weight: 500;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.profile-console-card__copy,
.profile-console__empty {
  color: rgba(232, 228, 220, 0.58);
  font-family: var(--fi-font-voice);
  font-style: italic;
}

.profile-console-list {
  display: grid;
  gap: 0.8rem;
  margin: 0;
}

.profile-console-list div {
  display: grid;
  grid-template-columns: minmax(8rem, 0.42fr) minmax(0, 1fr);
  gap: 1rem;
  padding-bottom: 0.72rem;
  border-bottom: 1px solid rgba(216, 181, 109, 0.1);
}

.profile-console-list dt {
  color: rgba(216, 181, 109, 0.66);
  font-family: var(--fi-font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.16em;
  text-transform: uppercase;
}

.profile-console-list dd {
  margin: 0;
  color: rgba(255, 248, 232, 0.86);
  font-family: var(--fi-font-voice);
  font-size: 1.02rem;
}

.profile-console-graph {
  position: relative;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.78rem;
  min-height: 17rem;
}

.profile-console-graph__lines {
  position: absolute;
  inset: 12% 8%;
  border: 1px solid rgba(216, 181, 109, 0.12);
  background:
    linear-gradient(90deg, transparent 49.6%, rgba(216, 181, 109, 0.16) 50%, transparent 50.4%),
    linear-gradient(0deg, transparent 49.6%, rgba(216, 181, 109, 0.14) 50%, transparent 50.4%);
  pointer-events: none;
}

.profile-console-graph__node {
  position: relative;
  z-index: 1;
  display: flex;
  min-height: 5rem;
  flex-direction: column;
  justify-content: center;
  gap: 0.4rem;
  border: 1px solid rgba(216, 181, 109, 0.18);
  background: rgba(0, 0, 0, 0.28);
  padding: 0.82rem;
}

.profile-console-graph__node--teal {
  border-color: rgba(183, 139, 82, 0.28);
}

.profile-console-graph__node--silver {
  border-color: rgba(217, 208, 189, 0.22);
}

.profile-console-graph__node span {
  color: rgba(232, 228, 220, 0.66);
  font-family: var(--fi-font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.13em;
  text-transform: uppercase;
}

.profile-console-graph__node strong {
  color: #fff7e6;
  font-family: var(--fi-font-display);
  font-size: 1.35rem;
  font-weight: 500;
}

.profile-console-feed {
  display: grid;
  gap: 0.75rem;
}

.profile-console-feed a {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.85rem;
  border: 1px solid rgba(216, 181, 109, 0.12);
  background: rgba(255, 248, 232, 0.025);
  color: rgba(255, 248, 232, 0.78);
  text-decoration: none;
}

.profile-console-feed a strong,
.profile-console-feed a span {
  display: block;
}

.profile-console-feed a strong {
  color: rgba(216, 181, 109, 0.76);
  font-family: var(--fi-font-mono);
  font-size: 0.58rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.profile-console-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.8rem;
  margin-top: 1.2rem;
}

@media (max-width: 980px) {
  .profile-console-header,
  .profile-console-grid {
    grid-template-columns: 1fr;
  }

  .profile-console-header__seal {
    border-right: 0;
    border-bottom: 1px solid rgba(216, 181, 109, 0.12);
    padding-bottom: 1rem;
  }

  .profile-console-stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .profile-console__inner {
    width: min(100% - 1rem, 82rem);
    padding-top: 5.8rem;
  }

  .profile-console-stats,
  .profile-console-graph {
    grid-template-columns: 1fr;
  }

  .profile-console-list div {
    grid-template-columns: 1fr;
    gap: 0.32rem;
  }

  .profile-console-copy {
    width: 100%;
    justify-content: center;
  }
}
```

- [ ] **Step 2: Verify profile CSS does not affect Home hero layout**

Run:

```bash
rg -n "profile-console|fi-hero \\{|fi-directory" client/src/components/oriel-signal/oriel-signal.css
```

Expected: profile rules are scoped to `.profile-console*`; existing `.fi-hero` and `.fi-directory` rules remain present.

- [ ] **Step 3: Run typecheck and focused tests**

Run:

```bash
pnpm run check
npx vitest run server/profile-console-summary.test.ts server/profile-console-router.test.ts client/src/pages/profile-console-model.test.ts
```

Expected: PASS.

- [ ] **Step 4: Commit Task 5**

Run:

```bash
git add client/src/components/oriel-signal/oriel-signal.css
git diff --cached --stat
git commit -m "style(profile): add profile console signal styles"
```

Expected staged stat: only `client/src/components/oriel-signal/oriel-signal.css`.

---

### Task 6: Full Verification, Browser Pass, Wiki Log

**Files:**
- Modify: `wiki/log.md`

- [ ] **Step 1: Run full verification**

Run:

```bash
pnpm run check
npx vitest run
pnpm run build
```

Expected:
- TypeScript exits 0.
- Vitest exits 0.
- Build exits 0. Existing Vite chunk-size warning can remain.

- [ ] **Step 2: Start local server for manual verification**

Run:

```bash
RUN_MIGRATIONS=false pnpm run dev
```

Expected:
- Server starts without running migrations.
- Use the printed local URL. Prior runs often used `http://localhost:3001` when `3000` was busy.

- [ ] **Step 3: Browser verification**

Open `/profile` and verify:

- The top section reads as a profile console, not a Home landing hero.
- Name, avatar/seal, conduit ID, Receiver Level, and Lumens are visible in the first viewport.
- Counters show real values or `0`; no sample values appear.
- Interaction graph nodes show ORIEL, Readings, Transmissions, Memory, Static Signature, and Current Signal.
- Recent Field shows empty states where data is missing.
- Paid tiers, subscription prompts, and locked content do not appear.
- Mobile width has no overlapping text or overflowing buttons.

- [ ] **Step 4: HTTP smoke**

Run with the active local port:

```bash
curl -I -s http://localhost:3001/profile
```

Expected: `HTTP/1.1 200 OK` or the equivalent 200 response for the active port.

- [ ] **Step 5: Append wiki log entry**

Append this entry to `wiki/log.md`:

```md
## [2026-07-07] implementation | Profile Console
- Updated `/profile` from a Home-shaped hero into a receiver profile console using the Home signal design language.
- Added read-only profile summary data for Lumens, ORIEL interactions, readings, transmissions read, accepted memories, recent activity, and Receiver Level.
- Kept paid tiers and content gating out of scope for deploy readiness.
- Verification: `pnpm run check`, `npx vitest run`, `pnpm run build`, and `/profile` HTTP smoke.
```

- [ ] **Step 6: Run wiki lint or record missing lint script**

Run:

```bash
python3 scripts/wiki-lint.py
```

Expected:
- If `scripts/wiki-lint.py` exists, it exits 0.
- If the script is still absent in this checkout, record the missing-script failure in the final response and do not create a new lint script as part of this profile task.

- [ ] **Step 7: Commit Task 6**

Run:

```bash
git add wiki/log.md
git diff --cached --stat
git commit -m "docs(wiki): log profile console implementation"
```

Expected staged stat: only `wiki/log.md`.

---

## Self-Review Notes

- Spec coverage: identity header is Task 4; activity strip is Tasks 2-4; interaction graph is Tasks 3-4; recent field is Tasks 2-4; static signature summary is Task 4; Receiver Level is Task 1; paid tiers are excluded by global constraints and router test assertions.
- Calculation accuracy: Lumens formula is copied from `codex.getProfileSigil`; transmission reads count only user TX events with `revealed`, `saved`, or `promoted`; ORIEL interaction count comes from `orielUserProfiles.interactionCount`; accepted memories count active `orielMemories`.
- Data privacy: profile summary returns metadata, counts, and dates only. It does not expose transmission payloads, memory content, or chat message bodies.
- Type consistency: `ProfileConsoleActivity` is exported once from `server/profile-console-summary.ts` and consumed by `server/db.ts`; frontend helper tests use a narrow summary-like type and do not import server code.
- Worktree safety: each task stages exact files and prints cached diff stats before commit.
