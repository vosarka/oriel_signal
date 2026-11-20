import { beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ row: null as null | { subscriptionId: string | null; status: string }, writes: 0 }));
const fakeDb = vi.hoisted(() => ({
  select: () => ({ from: () => ({ where: () => ({ limit: async () => (state.row ? [state.row] : []) }) }) }),
  update: () => ({ set: () => ({ where: async () => void (state.writes += 1) }) }),
}));
vi.mock("./db", () => ({ getDb: vi.fn(async () => fakeDb) }));

import { unmarkPatron } from "./patrons";

beforeEach(() => {
  state.row = null;
  state.writes = 0;
});

describe("unmarkPatron", () => {
  it("leaves a Garden PayPal is still billing", async () => {
    state.row = { subscriptionId: "I-LIVE123456", status: "active" };
    expect(await unmarkPatron(7, async () => "ACTIVE")).toBe("still_billing");
    expect(state.writes).toBe(0);
  });

  it("closes a Garden whose cancellation never reached us", async () => {
    state.row = { subscriptionId: "I-GONE123456", status: "active" };
    expect(await unmarkPatron(7, async () => "CANCELLED")).toBe("removed");
    expect(state.writes).toBe(1);
  });

  it("removes a plain patron without asking PayPal", async () => {
    state.row = { subscriptionId: null, status: "active" };
    const ask = vi.fn();
    expect(await unmarkPatron(7, ask)).toBe("removed");
    expect(ask).not.toHaveBeenCalled();
  });
});
