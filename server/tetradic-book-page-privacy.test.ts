import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * The public book page shows the book, never a real Receiver's record: no
 * name, no figures from the Founder Edition, no page that carries them.
 */
const root = resolve(__dirname, "..");
const page = readFileSync(resolve(root, "client/src/features/tetradic-signature/TetradicBookPage.tsx"), "utf8");

describe("the book page keeps the Founder Edition's Receiver private", () => {
  it("names no Receiver and quotes none of her figures", () => {
    expect(page).not.toMatch(/gail|gibson/i);
    expect(page).not.toMatch(/\bHer\b/);
    expect(page).not.toMatch(/357\.068289|85\.068289|90 days, 13 hours/);
  });

  it("shows no page from her record", () => {
    expect(page).not.toMatch(/tetradic-signature\/explained/);
    for (const file of ["cover", "p30-the-record", "ch2-2-descent", "ch2-7-centres", "p63-archive-seal"]) {
      expect(existsSync(resolve(root, `client/public/assets/tetradic-signature/explained/${file}.webp`))).toBe(false);
    }
  });
});
