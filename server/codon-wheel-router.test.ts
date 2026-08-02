import { readFile } from "node:fs/promises";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { TrpcContext } from "./_core/context";

const mocks = vi.hoisted(() => ({
  getUserStaticProfileForWheel: vi.fn(),
}));

vi.mock("./db", async importOriginal => {
  const actual = await importOriginal<typeof import("./db")>();
  return {
    ...actual,
    getUserStaticProfileForWheel: mocks.getUserStaticProfileForWheel,
  };
});

const { appRouter } = await import("./routers");

const VALID_ACTIVATIONS = [
  {
    planet: "Sun",
    layer: "conscious",
    codonId: 1,
    facet: "A",
    center: "Origin",
    weight: 100,
    longitude: 0.5,
  },
  {
    planet: "Earth",
    layer: "design",
    codonId: 55,
    facet: "C",
    center: "Becoming",
    weight: 100,
    longitude: 307.25,
  },
] as const;

function makeUser(id: number) {
  return {
    id,
    openId: `receiver-${id}`,
    name: `Receiver ${id}`,
    email: `receiver-${id}@example.com`,
    role: "user",
    donated: 0,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    lastSignedIn: new Date("2026-01-01T00:00:00.000Z"),
  } as NonNullable<TrpcContext["user"]>;
}

function makeContext(userId: number | null) {
  const headers = new Map<string, string>();
  const context = {
    user: userId === null ? null : makeUser(userId),
    req: { headers: {} },
    res: {
      setHeader: vi.fn((name: string, value: string) => {
        headers.set(name, value);
      }),
    },
  } as unknown as TrpcContext;
  return { context, headers };
}

function makeRecord(userId: number) {
  return {
    userId,
    activations: VALID_ACTIVATIONS,
    engineVersion: 2,
    createdAt: new Date("2026-07-29T10:00:00.000Z"),
    updatedAt: new Date("2026-07-30T10:00:00.000Z"),
  };
}

describe("profile codon-wheel routes", () => {
  beforeEach(() => {
    mocks.getUserStaticProfileForWheel.mockReset();
  });

  it("derives the Receiver exclusively from the authenticated session", async () => {
    mocks.getUserStaticProfileForWheel.mockImplementation(
      async (receiverId: number) => makeRecord(receiverId)
    );
    const { context } = makeContext(7);
    const caller = appRouter.createCaller(context);

    const result = await (
      caller.profile.getMyWheel as unknown as (
        input: { userId: number }
      ) => ReturnType<typeof caller.profile.getMyWheel>
    )({ userId: 99 });

    expect(mocks.getUserStaticProfileForWheel).toHaveBeenCalledTimes(1);
    expect(mocks.getUserStaticProfileForWheel).toHaveBeenCalledWith(7);
    expect(result).toMatchObject({
      state: "ready",
      engineVersion: 2,
      activations: VALID_ACTIVATIONS,
    });
    expect(result).not.toHaveProperty("userId");
  });

  it("returns no calculation without throwing and disables storage caching", async () => {
    mocks.getUserStaticProfileForWheel.mockResolvedValue(null);
    const { context, headers } = makeContext(11);

    await expect(
      appRouter.createCaller(context).profile.getMyWheel()
    ).resolves.toEqual({ state: "none" });
    expect(mocks.getUserStaticProfileForWheel).toHaveBeenCalledWith(11);
    expect(headers.get("Cache-Control")).toBe("private, no-store");
    expect(headers.get("Vary")).toBe("Cookie");
  });

  it("fails at the route boundary when stored activation canon conflicts", async () => {
    mocks.getUserStaticProfileForWheel.mockResolvedValue({
      ...makeRecord(7),
      activations: [
        {
          ...VALID_ACTIVATIONS[0],
          center: "Mental",
        },
      ],
    });
    const { context } = makeContext(7);

    await expect(
      appRouter.createCaller(context).profile.getMyWheel()
    ).rejects.toThrow(
      "canon conflict: codon 1 maps to Origin, record says Mental"
    );
  });

  it("preserves storage failures for the client's quiet retry state", async () => {
    mocks.getUserStaticProfileForWheel.mockRejectedValue(
      new Error("Database not available")
    );
    const { context } = makeContext(7);

    await expect(
      appRouter.createCaller(context).profile.getMyWheel()
    ).rejects.toThrow("Database not available");
  });

  it("keys private HTTP revalidation by Receiver and calculatedAt", async () => {
    mocks.getUserStaticProfileForWheel.mockResolvedValue(makeRecord(7));
    const first = makeContext(7);
    const second = makeContext(8);

    await appRouter.createCaller(first.context).profile.getMyWheel();
    mocks.getUserStaticProfileForWheel.mockResolvedValue(makeRecord(8));
    await appRouter.createCaller(second.context).profile.getMyWheel();

    expect(first.headers.get("Cache-Control")).toBe("private, no-cache");
    expect(first.headers.get("Vary")).toBe("Cookie");
    expect(first.headers.get("ETag")).toMatch(/^"wheel-[a-f0-9]{64}"$/);
    expect(first.headers.get("X-Wheel-Cache-Key")).not.toBe(
      second.headers.get("X-Wheel-Cache-Key")
    );
  });

  it("exposes the unauthenticated neutral field without user data", async () => {
    const { context } = makeContext(null);

    await expect(
      appRouter.createCaller(context).profile.getWheelField()
    ).resolves.toEqual({ state: "field" });
    expect(mocks.getUserStaticProfileForWheel).not.toHaveBeenCalled();
  });

  it("requires authentication for the personal route", async () => {
    const { context } = makeContext(null);

    await expect(
      appRouter.createCaller(context).profile.getMyWheel()
    ).rejects.toMatchObject({ code: "UNAUTHORIZED" });
    expect(mocks.getUserStaticProfileForWheel).not.toHaveBeenCalled();
  });

  it("pins the strict database reader to its Receiver id", async () => {
    const source = await readFile("server/db.ts", "utf8");
    const reader = source.match(
      /export async function getUserStaticProfileForWheel[\s\S]*?\n}\n/
    )?.[0];

    expect(reader).toBeDefined();
    expect(reader).toMatch(
      /\.where\(eq\(userStaticProfiles\.userId, userId\)\)/
    );
    expect(reader).toMatch(/\.limit\(1\)/);
  });
});
