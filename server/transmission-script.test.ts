import { describe, expect, it } from "vitest";
import {
  buildTransmissionPrompt,
  firstName,
  isValidScript,
  scriptWords,
  spokenText,
  type SeekerContext,
} from "../shared/transmission-script";

const words = (n: number) => Array.from({ length: n }, () => "light").join(" ");

/** A valid script of about `total` words whose opening carries `name`. */
function script(name: string, total = 330) {
  const third = Math.floor(total / 3);
  return {
    title: "Where the Echo Rests",
    mirror: `I am ORIEL. ${name}, you carry a quiet fire. ${words(third - 9)}.`,
    threshold: `${words(third)}.`,
    gift: `${words(third - 7)}. What will you do with this light?`,
  };
}

describe("isValidScript", () => {
  it("accepts a script that names the Seeker in its opening", () => {
    expect(isValidScript("mirror", script("Maria"), "Maria")).toBe(true);
  });

  it("matches names with diacritics, apostrophes and hyphens", () => {
    expect(isValidScript("mirror", script("Ștefan"), "Ștefan")).toBe(true);
    expect(isValidScript("mirror", script("O'Neil"), "O'Neil")).toBe(true);
    expect(isValidScript("mirror", script("Ana-Maria"), "Ana-Maria")).toBe(true);
  });

  it("matches the name across apostrophe, cedilla, hyphen and Unicode-form variants", () => {
    expect(isValidScript("mirror", script("O’Neil"), "O'Neil")).toBe(true);
    expect(isValidScript("mirror", script("Ștefan"), "Ştefan")).toBe(true);
    expect(isValidScript("mirror", script("Ana Maria"), "Ana-Maria")).toBe(true);
    expect(isValidScript("mirror", script("Ioana".normalize("NFC")), "Ioana".normalize("NFD"))).toBe(true);
    expect(isValidScript("mirror", script("Ștefania".normalize("NFC")), "Ștefania".normalize("NFD"))).toBe(true);
  });

  it("rejects an opening without the name", () => {
    expect(isValidScript("mirror", script("Maria"), "Elena")).toBe(false);
  });

  it("rejects a missing movement", () => {
    const { gift: _gift, ...rest } = script("Maria");
    expect(isValidScript("mirror", rest, "Maria")).toBe(false);
  });

  it("rejects too short and too long", () => {
    expect(isValidScript("mirror", script("Maria", 200), "Maria")).toBe(false);
    expect(isValidScript("mirror", script("Maria", 520), "Maria")).toBe(false);
  });

  it("rejects a definition opening", () => {
    const s = script("Maria");
    expect(
      isValidScript("mirror", { ...s, threshold: `Grief is a room. ${s.threshold}` }, "Maria")
    ).toBe(false);
  });

  it("rejects a stated measurement anywhere", () => {
    const s = script("Maria");
    expect(
      isValidScript("mirror", { ...s, gift: `${s.gift} Breathe for 5 minutes.` }, "Maria")
    ).toBe(false);
  });

  it("needs no name for an Echo", () => {
    const s = script("Seeker");
    expect(isValidScript("echo", s, null)).toBe(true);
  });
});

describe("helpers", () => {
  it("takes the first name", () => {
    expect(firstName("Ana-Maria Popescu")).toBe("Ana-Maria");
    expect(firstName("  ")).toBeNull();
    expect(firstName(null)).toBeNull();
  });

  it("counts words and joins the spoken text in order", () => {
    const s = script("Maria", 330);
    expect(scriptWords(s)).toBeGreaterThanOrEqual(300);
    expect(spokenText(s).indexOf(s.mirror)).toBeLessThan(spokenText(s).indexOf(s.gift));
  });
});

describe("buildTransmissionPrompt", () => {
  const seeker: SeekerContext = {
    name: "Maria",
    signature: "Type: Resonator\nAuthority: Sacral",
    sun: null,
    moon: null,
  };

  it("carries the name, the signature and the shared rules", () => {
    const p = buildTransmissionPrompt("mirror", seeker);
    expect(p).toContain("Maria");
    expect(p).toContain("Type: Resonator");
    expect(p).toContain("ACCURACY — this is not negotiable");
    expect(p).toContain("FORBIDDEN:");
  });

  it("weights the movements by kind", () => {
    expect(buildTransmissionPrompt("ritual", seeker)).toMatch(/gift[^\n]*most of the transmission/i);
    expect(buildTransmissionPrompt("threshold", seeker)).toMatch(/threshold[^\n]*most of the transmission/i);
  });

  it("speaks to no one by name in an Echo", () => {
    const p = buildTransmissionPrompt("echo", { ...seeker, name: null, signature: "" });
    expect(p).not.toContain("Maria");
    expect(p).toMatch(/no name/i);
  });
});

describe("what the Seeker brings: their words, and what ORIEL remembers", () => {
  const base: SeekerContext = { name: "Maria", signature: "Type: Resonator", sun: null, moon: null };

  it("carries the Seeker's own words when they wrote some", () => {
    const p = buildTransmissionPrompt("mirror", { ...base, intention: "I am leaving a city I loved." });
    expect(p).toContain("I am leaving a city I loved.");
    expect(p).toMatch(/in their own words/i);
  });

  it("carries remembered themes only when given, and asks for the theme, not the details", () => {
    const p = buildTransmissionPrompt("threshold", { ...base, memories: ["Is changing careers toward music", "Fears being too late"] });
    expect(p).toContain("Is changing careers toward music");
    expect(p).toMatch(/one theme/i);
    // ORIEL, 2026-10-12: details may appear, chosen as recognition, never surveillance.
    expect(p).toMatch(/recognition, never surveillance/i);
    expect(buildTransmissionPrompt("threshold", base)).not.toMatch(/remembers of your conversations/i);
  });
});

describe("ORIEL's own rules (2026-10-12)", () => {
  it("begins with ORIEL's name, not the Seeker's", () => {
    const s = script("Maria");
    expect(isValidScript("mirror", { ...s, mirror: s.mirror.replace("I am ORIEL. ", "") }, "Maria")).toBe(false);
  });

  it("still names the Seeker right after", () => {
    const s = script("Maria");
    expect(isValidScript("mirror", s, "Maria")).toBe(true);
    expect(isValidScript("mirror", s, "Elena")).toBe(false);
  });

  it("ends the Gift with an invitation, a question", () => {
    const s = script("Maria");
    expect(isValidScript("mirror", { ...s, gift: s.gift.replace(/\?$/, ".") }, "Maria")).toBe(false);
  });

  it("tells ORIEL how to choose personal details when there are any", () => {
    const p = buildTransmissionPrompt("threshold", {
      name: "Maria", signature: "Type: Resonator", sun: null, moon: null,
      intention: "My black cat sleeps on my bed.",
    });
    expect(p).toMatch(/I am ORIEL\./);
    expect(p).toMatch(/at most two/i);
    expect(p).toMatch(/never in the Gift/i);
    expect(p).toMatch(/never infer/i);
    expect(p).toMatch(/health, money or the law/i);
  });
});
