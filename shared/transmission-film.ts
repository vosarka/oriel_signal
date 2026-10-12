/**
 * The film behind a personal transmission: how the text follows the voice,
 * which act is on screen, what part of the sound counts as the voice, and
 * the geometry each transmission is seeded with. Pure, so it can be tested.
 */

export interface FlowSentence {
  /** 0 Mirror · 1 Threshold · 2 Gift */
  movement: 0 | 1 | 2;
  text: string;
  /** Share of the spoken voice where the sentence starts and ends, 0..1. */
  start: number;
  end: number;
}

const SENTENCE = /[^.!?…]+[.!?…]+["”’)\]]*|[^.!?…]*\S[^.!?…]*$/gu;

/** Every sentence of the three movements, timed by its share of the text. */
export function flowSentences(script: { mirror: string; threshold: string; gift: string }): FlowSentence[] {
  const parts = ([script.mirror, script.threshold, script.gift] as const).flatMap((text, m) =>
    (text.match(SENTENCE) ?? [])
      .map(s => s.trim())
      .filter(Boolean)
      .map(s => ({ movement: m as 0 | 1 | 2, text: s }))
  );
  const total = parts.reduce((n, p) => n + p.text.length, 0) || 1;
  let at = 0;
  return parts.map(p => {
    const start = at / total;
    at += p.text.length;
    return { ...p, start, end: at / total };
  });
}

/** The sentence being spoken at a share of the voice, and how many of its words have been said. */
export function flowAt(sentences: FlowSentence[], ratio: number): { index: number; words: number } {
  if (!sentences.length) return { index: -1, words: 0 };
  const r = Math.min(1, Math.max(0, ratio));
  let index = 0;
  for (let i = 0; i < sentences.length; i++) if (sentences[i].start <= r) index = i;
  const s = sentences[index];
  const count = s.text.split(/\s+/u).length;
  const within = s.end > s.start ? (r - s.start) / (s.end - s.start) : 1;
  return { index, words: Math.min(count, Math.max(1, Math.ceil(count * within))) };
}

/** The act on screen (0..2), crossfading into each movement just before it is spoken. */
export function actAt(starts: number[], ratio: number, fade = 0.02): number {
  let act = 0;
  for (const b of starts.slice(1)) act += Math.min(1, Math.max(0, (ratio - (b - fade)) / fade));
  return act;
}

/**
 * Only the speech band moves the film: about 80 Hz to 4 kHz. Rumble below
 * and hiss above do nothing. level is loudness 0..1; bright is where the
 * energy sits inside the band, 0 deep .. 1 bright.
 */
export function voiceBand(bins: ArrayLike<number>, sampleRate: number, fftSize: number) {
  const hz = sampleRate / fftSize;
  const lo = Math.max(1, Math.ceil(80 / hz));
  const hi = Math.min(bins.length - 1, Math.floor(4000 / hz));
  let sum = 0;
  let weighted = 0;
  for (let i = lo; i <= hi; i++) {
    sum += bins[i];
    weighted += i * bins[i];
  }
  if (!sum) return { level: 0, bright: 0 };
  return {
    level: Math.min(1, (sum / ((hi - lo + 1) * 255)) * 3),
    bright: (weighted / sum - lo) / (hi - lo),
  };
}

/** The geometry a transmission is born with, read from its serial. */
export function filmSeed(serial: string) {
  let h = 2166136261;
  for (const c of serial) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return {
    fold: 5 + (h % 5),
    k: 1 + ((h >>> 3) % 64),
    phase: ((h >>> 9) % 1000) / 1000,
  };
}
