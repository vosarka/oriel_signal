import { describe, expect, it } from "vitest";
import { joinMp3 } from "./mp3-join";

/** MPEG-1 Layer III, 128 kbps, 44.1 kHz, no padding: 417 bytes a frame. */
const FRAME = 417;
const header = [0xff, 0xfb, 0x90, 0x00];

function frame(fill: number, tag?: string) {
  const f = Buffer.alloc(FRAME, fill);
  Buffer.from(header).copy(f, 0);
  if (tag) Buffer.from(tag).copy(f, 36); // after the side information
  return f;
}

/** ID3v2 tag with a 20-byte body (syncsafe size). */
const id3 = Buffer.concat([Buffer.from("ID3"), Buffer.from([4, 0, 0, 0, 0, 0, 20]), Buffer.alloc(20, 7)]);

/** How a TTS provider returns one chunk: ID3, a Xing frame claiming the length, audio. */
const chunk = (a: number, b: number) => Buffer.concat([id3, frame(0, "Xing"), frame(a), frame(b)]);

describe("joinMp3", () => {
  it("keeps only the audio frames, in order, so the whole voice plays", () => {
    const joined = joinMp3([chunk(1, 2), chunk(3, 4)]);
    expect(joined.length).toBe(4 * FRAME);
    expect([0, 1, 2, 3].map(i => joined[i * FRAME + 10])).toEqual([1, 2, 3, 4]);
    expect(joined.includes(Buffer.from("Xing"))).toBe(false);
    expect(joined.includes(Buffer.from("ID3"))).toBe(false);
  });

  it("drops an Info frame too, and a trailing ID3v1 tag", () => {
    const tagged = Buffer.concat([frame(0, "Info"), frame(5), Buffer.concat([Buffer.from("TAG"), Buffer.alloc(125)])]);
    const joined = joinMp3([tagged]);
    expect(joined.length).toBe(FRAME);
    expect(joined[10]).toBe(5);
  });

  it("leaves audio with no headers untouched", () => {
    const plain = Buffer.concat([frame(8), frame(9)]);
    expect(joinMp3([plain]).equals(plain)).toBe(true);
  });
});
