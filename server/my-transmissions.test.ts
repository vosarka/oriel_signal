import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ listGeneratedTransmissionEvents: vi.fn() }));
vi.mock("./db", () => db);

import { listMyTransmissions } from "./my-transmissions";

describe("a Seeker's own transmissions", () => {
  it("lists only this Seeker's, newest first, without the discarded, payload parsed", async () => {
    db.listGeneratedTransmissionEvents.mockResolvedValue([
      { id: 3, userId: 7, status: "revealed", payload: '{"title":"Third"}', sourceContext: null, createdAt: new Date("2026-10-15") },
      { id: 2, userId: 7, status: "discarded", payload: '{"title":"Gone"}', sourceContext: null, createdAt: new Date("2026-10-14") },
      { id: 1, userId: 7, status: "generated", payload: "not json", sourceContext: null, createdAt: new Date("2026-10-13") },
    ]);
    const list = await listMyTransmissions(7);
    expect(db.listGeneratedTransmissionEvents).toHaveBeenCalledWith(expect.objectContaining({ userId: 7 }));
    expect(list.map(e => e.id)).toEqual([3, 1]);
    expect(list[0].payload).toEqual({ title: "Third" });
    expect(list[1].payload).toEqual({});
    expect(list.every(e => !("sourceContext" in e))).toBe(true);
  });

  it("never lists anyone else's, even if the store returned them", async () => {
    db.listGeneratedTransmissionEvents.mockResolvedValue([
      { id: 9, userId: 99, status: "revealed", payload: "{}", createdAt: new Date() },
    ]);
    expect(await listMyTransmissions(7)).toEqual([]);
  });
});
