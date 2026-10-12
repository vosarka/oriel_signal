/**
 * Joining MP3 chunks so the whole thing plays.
 *
 * A TTS provider returns each chunk as a complete file: an ID3 tag, then a
 * Xing/Info frame that states that chunk's length, then the audio. Glued
 * together byte for byte, a browser reads the first chunk's Xing frame and
 * stops when it says the file ends: the listener hears only the first part.
 * Keep the audio frames, drop every tag and every Xing/Info/VBRI frame.
 */

const L3_BITRATES = {
  mpeg1: [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320],
  mpeg2: [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160],
};
const SAMPLE_RATES: Record<number, number[]> = {
  3: [44100, 48000, 32000], // MPEG-1
  2: [22050, 24000, 16000], // MPEG-2
  0: [11025, 12000, 8000], // MPEG-2.5
};

/** Length of the Layer III frame starting at `at`, or 0 if none starts there. */
function frameLength(buf: Buffer, at: number): number {
  if (at + 4 > buf.length || buf[at] !== 0xff || (buf[at + 1] & 0xe0) !== 0xe0) return 0;
  const version = (buf[at + 1] >> 3) & 3;
  const layer = (buf[at + 1] >> 1) & 3;
  const rates = SAMPLE_RATES[version];
  if (!rates || layer !== 1) return 0;
  const bitrate = (version === 3 ? L3_BITRATES.mpeg1 : L3_BITRATES.mpeg2)[(buf[at + 2] >> 4) & 0xf];
  const sampleRate = rates[(buf[at + 2] >> 2) & 3];
  if (!bitrate || !sampleRate) return 0;
  const padding = (buf[at + 2] >> 1) & 1;
  return Math.floor(((version === 3 ? 144 : 72) * bitrate * 1000) / sampleRate) + padding;
}

function withoutTags(chunk: Buffer): Buffer {
  let start = 0;
  if (chunk.subarray(0, 3).toString("latin1") === "ID3" && chunk.length >= 10) {
    const size = (chunk[6] << 21) | (chunk[7] << 14) | (chunk[8] << 7) | chunk[9];
    start = 10 + size + (chunk[5] & 0x10 ? 10 : 0);
  }
  let end = chunk.length;
  if (end - start >= 128 && chunk.subarray(end - 128, end - 125).toString("latin1") === "TAG") end -= 128;
  return chunk.subarray(start, end);
}

/** Drop a leading Xing/Info/VBRI frame: it describes one chunk, not the whole. */
function withoutLengthFrame(audio: Buffer): Buffer {
  const length = frameLength(audio, 0);
  if (!length) return audio;
  const head = audio.subarray(0, Math.min(length, 64)).toString("latin1");
  return /Xing|Info|VBRI/.test(head) ? audio.subarray(length) : audio;
}

export function joinMp3(chunks: Buffer[]): Buffer {
  return Buffer.concat(chunks.map(c => withoutLengthFrame(withoutTags(c))));
}
