import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  ringTotalOf: vi.fn(),
  storedRing: vi.fn(),
  insertRingIfAbsent: vi.fn(),
  raiseRing: vi.fn(),
  insertGift: vi.fn(),
}));
vi.mock("./rings-db", () => store);

import { ringDecision, ringForContext, settleRing } from "./rings-service";

beforeEach(() => {
  vi.clearAllMocks();
  store.insertGift.mockResolvedValue(undefined);
});

describe("ringDecision", () => {
  it("writes a first ring, even an empty one, so the next visit has nothing to settle", () => {
    expect(ringDecision(null, 0)).toEqual({ write: "insert", rank: 0 });
    expect(ringDecision(null, 3)).toEqual({ write: "insert", rank: 3 });
  });

  it("raises a ring the total has outgrown", () => {
    expect(ringDecision(2, 4)).toEqual({ write: "raise", rank: 4 });
  });

  it("never lowers a ring when the total falls", () => {
    expect(ringDecision(4, 2)).toEqual({ write: "none", rank: 4 });
    expect(ringDecision(3, 3)).toEqual({ write: "none", rank: 3 });
  });
});

describe("settleRing", () => {
  it("gives one gift for a rise, however many rings it crosses", async () => {
    store.storedRing.mockResolvedValue(1);
    store.ringTotalOf.mockResolvedValue(300);
    store.raiseRing.mockResolvedValue(true);
    await expect(settleRing(7)).resolves.toEqual({ ringRank: 4, ringTotal: 300 });
    expect(store.insertGift).toHaveBeenCalledTimes(1);
    expect(store.insertGift).toHaveBeenCalledWith(7, 4);
  });

  it("gives no gift when another request raised the ring first", async () => {
    store.storedRing.mockResolvedValue(1);
    store.ringTotalOf.mockResolvedValue(300);
    store.raiseRing.mockResolvedValue(false);
    await settleRing(7);
    expect(store.insertGift).not.toHaveBeenCalled();
  });

  it("records a Seeker with nothing given, without a gift", async () => {
    store.storedRing.mockResolvedValue(null);
    store.ringTotalOf.mockResolvedValue(0);
    store.insertRingIfAbsent.mockResolvedValue(true);
    await settleRing(7);
    expect(store.insertRingIfAbsent).toHaveBeenCalledWith(7, 0);
    expect(store.insertGift).not.toHaveBeenCalled();
  });

  it("gives a launch gift to a donor seen for the first time on a ring", async () => {
    store.storedRing.mockResolvedValue(null);
    store.ringTotalOf.mockResolvedValue(450);
    store.insertRingIfAbsent.mockResolvedValue(true);
    await settleRing(7);
    expect(store.insertGift).toHaveBeenCalledWith(7, 4);
  });

  it("does not retry a failing settle on every request", async () => {
    store.storedRing.mockRejectedValue(new Error("no DDL privilege"));
    store.ringTotalOf.mockResolvedValue(0);
    await expect(ringForContext(41)).resolves.toBeNull();
    await expect(ringForContext(41)).resolves.toBeNull();
    expect(store.storedRing).toHaveBeenCalledTimes(1);
  });

  it("keeps the ring and gives nothing when Vos lowers the total", async () => {
    store.storedRing.mockResolvedValue(4);
    store.ringTotalOf.mockResolvedValue(20);
    await expect(settleRing(7)).resolves.toEqual({ ringRank: 4, ringTotal: 20 });
    expect(store.raiseRing).not.toHaveBeenCalled();
    expect(store.insertGift).not.toHaveBeenCalled();
  });
});
