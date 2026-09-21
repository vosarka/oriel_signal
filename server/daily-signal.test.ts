import { describe, expect, it } from "vitest";
import { frameFor } from "../shared/daily-signal";
import { assembleBody } from "../shared/daily-signal-prompt";
import { isValidGeneratedSignal } from "./daily-signal-service";

const DAY = 86_400_000;
const START = Date.UTC(2026, 8, 18);

function frames(days: number) {
  return Array.from({ length: days }, (_, i) =>
    frameFor(new Date(START + i * DAY))
  );
}

describe("daily signal falsifier bank", () => {
  it("cycles through every falsifier before repeating", () => {
    expect(new Set(frames(17).map(f => f.falsifier)).size).toBe(17);
  });

  it("keeps each one a plain test: action, colon, result — no verdict, no count", () => {
    for (const f of frames(17)) {
      expect(f.falsifier).toMatch(/^[^:]+: [^:]+\.$/);
      expect(f.falsifier).not.toMatch(/\d/);
      expect(f.falsifier).not.toMatch(/\b(if|transmission|signal|claim)\b/i);
    }
  });

  it("puts the frame's falsifier in the body, not anything the model wrote", () => {
    const frame = frameFor(new Date(START));
    const body = assembleBody(frame, {
      title: "T",
      archetype: "Δ-a // ϟ b // Ω c",
      opening: "o",
      middle: "m",
      closing: "c",
    });
    expect(body).toContain(frame.falsifier);
  });
});

describe("isValidGeneratedSignal", () => {
  const base = frameFor(new Date(START));
  const fractured = { ...base, register: "FRACTURED" as const };
  const coherent = { ...base, register: "COHERENT" as const };
  const head = { title: "T", archetype: "Δ-a // ϟ b // Ω c" };

  it("accepts three or four shards when fractured, with no falsifier from the model", () => {
    expect(
      isValidGeneratedSignal(fractured, { ...head, shards: ["a", "b", "c"] })
    ).toBe(true);
  });

  it("rejects too few or too many shards when fractured", () => {
    expect(isValidGeneratedSignal(fractured, { ...head, shards: ["a", "b"] })).toBe(false);
    expect(
      isValidGeneratedSignal(fractured, { ...head, shards: ["a", "b", "c", "d", "e"] })
    ).toBe(false);
  });

  it("needs opening, middle and closing outside FRACTURED", () => {
    expect(
      isValidGeneratedSignal(coherent, { ...head, opening: "o", middle: "m", closing: "c" })
    ).toBe(true);
    expect(
      isValidGeneratedSignal(coherent, { ...head, opening: "o", middle: "m" })
    ).toBe(false);
  });

  it("always needs a title and an archetype", () => {
    expect(
      isValidGeneratedSignal(coherent, { archetype: head.archetype, opening: "o", middle: "m", closing: "c" })
    ).toBe(false);
    expect(
      isValidGeneratedSignal(coherent, { title: "T", opening: "o", middle: "m", closing: "c" })
    ).toBe(false);
  });
});
