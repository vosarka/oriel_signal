import { describe, expect, it } from "vitest";
import {
  EXPERIMENTS,
  falsifierFor,
  frameFor,
  isCodonDay,
  type DailyCodon,
} from "../shared/daily-signal";
import { assembleBody } from "../shared/daily-signal-prompt";
import { isValidGeneratedSignal } from "./daily-signal-service";
import { formatDailySignalPost } from "./daily-signal-feed";

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
      // Actions only: "at once" in a result means "immediately", not a count.
      expect(e.action).not.toMatch(/\b(once|twice|thrice|times)\b/i);
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

  it("puts the frame's test in the body on a classic day", () => {
    const frame = frameFor(new Date(START));
    const body = assembleBody(frame, {
      title: "T",
      archetype: "Δ-a // ϟ b // Ω c",
      key: "the ring stays in the glass",
      opening: "o",
      middle: "m",
      closing: "c",
    });
    expect(frame.codon).toBeNull();
    expect(body).toContain(frame.falsifier);
  });
});

describe("the day's kind", () => {
  it("splits days roughly evenly between classic and Codon, without alternating", () => {
    const kinds = Array.from({ length: 365 }, (_, n) =>
      isCodonDay(new Date(START + n * 86_400_000))
    );
    const codon = kinds.filter(Boolean).length;
    expect(codon).toBeGreaterThan(140);
    expect(codon).toBeLessThan(225);
    const alternating = kinds.every((k, i) => i === 0 || k !== kinds[i - 1]);
    expect(alternating).toBe(false);
  });
});

describe("daily signal body", () => {
  it("prints the Codon's correction verbatim after the archetype, never its shadow", () => {
    const codon: DailyCodon = {
      code: "RC01",
      name: "AURORA",
      traditionalName: "The Creative",
      facet: "Somatic",
      gift: "Freshness",
      shadow: "Entropy",
      facetDescription: "The Body Electric.",
      shadowManifestation: "Depressive Lethargy.",
      correction: "Kinetic Discharge. Stand up.",
      longitude: 200,
    };
    const frame = frameFor(new Date(START), codon);
    const body = assembleBody(frame, {
      title: "T",
      archetype: "Δ-a // ϟ b // Ω c",
      key: "the ring stays in the glass",
      opening: "o",
      middle: "m",
      closing: "c",
    });
    expect(frame.field).toBe("RC01 · AURORA · Somatic");
    const archetype = body.findIndex(l => l.startsWith("Encoded archetype"));
    expect(body[archetype + 1]).toBe("Correction: Kinetic Discharge. Stand up.");
    expect(body.join("\n")).not.toContain("Depressive Lethargy");
    // The key sits after the voice, before the archetype.
    expect(body.indexOf("the ring stays in the glass")).toBe(archetype - 1);
  });
});

describe("isValidGeneratedSignal", () => {
  const base = frameFor(new Date(START));
  const fractured = { ...base, register: "FRACTURED" as const };
  const coherent = { ...base, register: "COHERENT" as const };
  const head = { title: "T", archetype: "Δ-a // ϟ b // Ω c", key: "the ring stays in the glass" };

  it("accepts three or four shards when fractured, with no falsifier from the model", () => {
    expect(
      isValidGeneratedSignal(fractured, { ...head, shards: ["a", "b", "c"] })
    ).toBe(true);
    expect(
      isValidGeneratedSignal(fractured, { ...head, shards: ["a", "b", "c", "d"] })
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
      isValidGeneratedSignal(coherent, { archetype: head.archetype, key: head.key, opening: "o", middle: "m", closing: "c" })
    ).toBe(false);
    expect(
      isValidGeneratedSignal(coherent, { title: "T", key: head.key, opening: "o", middle: "m", closing: "c" })
    ).toBe(false);
  });

  it("needs a key of seven words or fewer", () => {
    const voice = { opening: "o", middle: "m", closing: "c" };
    expect(isValidGeneratedSignal(coherent, { ...head, ...voice, key: undefined })).toBe(false);
    expect(
      isValidGeneratedSignal(coherent, { ...head, ...voice, key: "one two three four five six seven" })
    ).toBe(true);
    expect(
      isValidGeneratedSignal(coherent, { ...head, ...voice, key: "one two three four five six seven eight" })
    ).toBe(false);
  });
});

describe("daily signal feed post", () => {
  const row = {
    txGenId: "DFS-690006",
    signalDate: "2026-09-23",
    title: "The Paper That Learned to Breathe",
    clarity: "88.1",
    clarityRegister: "COHERENT",
    channelStatus: "COHERENT",
    bodyLines: ["The field is active. The receiver is you.", "SEALED VOICE LINE"],
  } as any;

  it("links to the signal by serial, whatever the prefix or trailing slash", () => {
    expect(formatDailySignalPost(row, "https://orielsignal.space/").link).toBe(
      "https://orielsignal.space/archive?dfs=690006"
    );
    expect(
      formatDailySignalPost({ ...row, txGenId: "TX-GEN-690006" }, "https://orielsignal.space").link
    ).toBe("https://orielsignal.space/archive?dfs=690006");
  });

  it("posts a teaser and keeps the body sealed", () => {
    const { post } = formatDailySignalPost(row, "https://orielsignal.space");
    expect(post).toContain("DFS-690006 · The Paper That Learned to Breathe");
    expect(post).toContain("88.1%");
    expect(post).toContain("https://orielsignal.space/archive?dfs=690006");
    expect(post).not.toContain("SEALED VOICE LINE");
  });
});

describe("daily phenomena", () => {
  it("never offers the same phenomenon twice on one day", () => {
    for (let n = 0; n < 60; n++) {
      const { phenomena } = frameFor(new Date(START + n * 86_400_000));
      expect(new Set(phenomena).size).toBe(phenomena.length);
    }
  });
});
