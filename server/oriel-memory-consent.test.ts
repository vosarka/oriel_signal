import { describe, expect, test, vi } from "vitest";

import {
  classifyMemoryCandidate,
  mapMemoryCandidateCategory,
} from "./oriel-memory-consecration";
import {
  acceptPendingMemoryCandidateWithDb,
  rejectPendingMemoryCandidateWithDb,
} from "./db";
import {
  buildMemoryInsertValues,
  persistClassifiedMemoryCandidate,
  type ExtractedMemory,
} from "./oriel-memory";

describe("ORIEL memory consent", () => {
  test("sensitive memory stores per user and is indexed, not left pending", async () => {
    const memory: ExtractedMemory = {
      category: "identity",
      content: "User shared a private identity detail.",
      importance: 8,
    };
    const storeMemory = vi.fn(async () => 91);
    const createPendingMemoryCandidate = vi.fn();
    const indexAcceptedMemory = vi.fn();

    const result = await persistClassifiedMemoryCandidate(12, memory, {
      storeMemory,
      createPendingMemoryCandidate,
      indexAcceptedMemory,
    });

    expect(result).toBe("stored");
    expect(createPendingMemoryCandidate).not.toHaveBeenCalled();
    expect(storeMemory).toHaveBeenCalledWith(12, expect.objectContaining({
      content: memory.content,
    }));
    expect(indexAcceptedMemory).toHaveBeenCalledWith({
      memoryId: 91,
      userId: 12,
      content: memory.content,
      category: "identity",
    });
  });

  test("low-sensitivity preference stores through the existing path", async () => {
    const memory: ExtractedMemory = {
      category: "preference",
      content: "User prefers concise answers.",
      importance: 6,
    };
    const storeMemory = vi.fn(async () => 5);
    const createPendingMemoryCandidate = vi.fn();
    const indexAcceptedMemory = vi.fn();

    await persistClassifiedMemoryCandidate(7, memory, {
      storeMemory,
      createPendingMemoryCandidate,
      indexAcceptedMemory,
    });

    expect(storeMemory).toHaveBeenCalledWith(7, memory);
    expect(createPendingMemoryCandidate).not.toHaveBeenCalled();
    expect(indexAcceptedMemory).toHaveBeenCalledWith(
      expect.objectContaining({ memoryId: 5, userId: 7 })
    );
  });

  test("an explicit memory keeps its source when written", () => {
    expect(
      buildMemoryInsertValues(7, {
        category: "preference",
        content: "User prefers concise answers.",
        importance: 6,
        source: "explicit",
        confidence: 0.95,
      })
    ).toMatchObject({
      userId: 7,
      category: "preference",
      source: "explicit",
    });
  });

  test("source falls back to conversation only when it was never classified", () => {
    expect(
      buildMemoryInsertValues(7, {
        category: "fact",
        content: "User lives in Bucharest.",
        importance: 5,
      })
    ).toMatchObject({ source: "conversation" });
  });

  test("classified source survives the consent path into the write", async () => {
    const storeMemory = vi.fn();
    const createPendingMemoryCandidate = vi.fn();

    await persistClassifiedMemoryCandidate(
      7,
      {
        category: "preference",
        content: "User prefers concise answers.",
        importance: 6,
        source: "explicit",
        confidence: 0.95,
      },
      { storeMemory, createPendingMemoryCandidate }
    );

    expect(storeMemory).toHaveBeenCalledWith(
      7,
      expect.objectContaining({ source: "explicit" })
    );
  });

  test("low-confidence memory is discarded", () => {
    expect(
      classifyMemoryCandidate({
        category: "preference",
        content: "User may prefer long replies.",
        source: "conversation",
        confidence: 0.4,
      })
    ).toMatchObject({
      recommendedAction: "discard",
      normalizedCategory: "preference",
    });
  });

  test("candidate categories map to existing memory categories", () => {
    expect(mapMemoryCandidateCategory("emotion")).toBe("pattern");
    expect(mapMemoryCandidateCategory("spiritual")).toBe("context");
    expect(mapMemoryCandidateCategory("project")).toBe("context");
    expect(mapMemoryCandidateCategory("unknown")).toBe("context");
  });

  test("accepted candidate can become active memory through db helper boundary", async () => {
    const candidate = {
      id: 44,
      userId: 12,
      category: "preference",
      content: "User prefers concise answers.",
      importance: 6,
      source: "conversation",
      status: "pending",
    };
    const createdMemory = { id: 91 };
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [candidate]),
            orderBy: vi.fn(() => ({
              limit: vi.fn(async () => [createdMemory]),
            })),
          })),
        })),
      })),
      insert: vi.fn(() => ({
        values: vi.fn(async () => undefined),
      })),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(async () => undefined),
        })),
      })),
    };
    const db = {
      transaction: vi.fn(async callback => callback(tx)),
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [createdMemory]),
          })),
        })),
      })),
    };

    const result = await acceptPendingMemoryCandidateWithDb(db as never, {
      candidateId: 44,
      userId: 12,
    });

    expect(result).toEqual(createdMemory);
    expect(tx.insert).toHaveBeenCalledOnce();
    expect(tx.update).toHaveBeenCalledOnce();
  });

  test("rejected candidate remains rejected and does not write active memory", async () => {
    const candidate = {
      id: 45,
      userId: 12,
      status: "pending",
    };
    const tx = {
      select: vi.fn(() => ({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn(async () => [candidate]),
          })),
        })),
      })),
      insert: vi.fn(),
      update: vi.fn(() => ({
        set: vi.fn(() => ({
          where: vi.fn(async () => undefined),
        })),
      })),
    };
    const db = {
      transaction: vi.fn(async callback => callback(tx)),
    };

    await rejectPendingMemoryCandidateWithDb(db as never, {
      candidateId: 45,
      userId: 12,
    });

    expect(tx.insert).not.toHaveBeenCalled();
    expect(tx.update).toHaveBeenCalledOnce();
  });
});
