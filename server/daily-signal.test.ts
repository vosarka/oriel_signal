import { describe, expect, it } from "vitest";
import { EXPERIMENTS, falsifierFor, frameFor } from "../shared/daily-signal";
import { assembleBody } from "../shared/daily-signal-prompt";
import { isValidGeneratedSignal } from "./daily-signal-service";

const START = Date.UTC(2026, 8, 18);

const pairCount = (m: number) => (m * (m - 1)) / 2;

describe("daily test bank", () => {
  it("gives every experiment at least two distinct outcomes", () => {
    for (const e of EXPERIMENTS) {
      expect(e.outcomes.length).toBeGreaterThanOrEqual(2);
      const results = e.outcomes.map(o => o.result);
      expect(new Set(results).size).toBe(results.length);
    }
  });

  it("keeps every entry free of counts and of any verdict on the transmission", () => {
    for (const e of EXPERIMENTS) {
      const text = [e.action, ...e.outcomes.flatMap(o => [o.result, o.meaning])];
      for (const line of text) {
        expect(line).not.toMatch(/\d/);
        expect(line).not.toMatch(/\b(transmission|signal|claim)\b/i);
      }
      for (const o of e.outcomes) {
        expect(o.result).toMatch(/^[a-z]/);
        expect(o.result).not.toMatch(/[.,]$/);
        expect(o.meaning).toMatch(/^[a-z]/);
        expect(o.meaning).not.toMatch(/\.$/);
      }
    }
  });

  it("renders the action, then two results each with what it means", () => {
    for (let n = 0; n < 40; n++) {
      const text = falsifierFor(n);
      expect(text.match(/ If /g)).toHaveLength(2);
      expect(text.match(/, it means /g)).toHaveLength(2);
      expect(text).toMatch(/\.$/);
    }
  });

  it("does not repeat before every pair of the smallest experiment has been shown", () => {
    const smallest = Math.min(...EXPERIMENTS.map(e => pairCount(e.outcomes.length)));
    const span = EXPERIMENTS.length * smallest;
    const seen = new Set<string>();
    for (let n = 0; n < span; n++) seen.add(falsifierFor(n));
    expect(seen.size).toBe(span);
  });

  it("never gives two days in a row the same action", () => {
    for (let n = 0; n < 60; n++) {
      const action = (t: string) => t.slice(0, t.indexOf(" If "));
      expect(action(falsifierFor(n))).not.toBe(action(falsifierFor(n + 1)));
    }
  });

  it("puts the frame's test in the body, not anything the model wrote", () => {
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
