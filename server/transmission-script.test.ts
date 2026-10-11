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
    mirror: `${name}, you carry a quiet fire. ${words(third - 6)}.`,
    threshold: `${words(third)}.`,
    gift: `${words(third)}.`,
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
      isValidScript("mirror", { ...s, mirror: `Grief is a room, Maria. ${words(100)}` }, "Maria")
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
