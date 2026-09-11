/**
 * Live dictation through Mistral Voxtral, for the microphone in ordinary chat.
 *
 * The browser's own webkitSpeechRecognition is free but weak, and it mangles
 * the names this project is made of: ORIEL, Vossari, Carrierlock, Codex. This
 * costs $0.006 a minute and hears them.
 *
 * That price is the reason for everything defensive in this file. The browser
 * engine cost nothing, so nobody had to think about a microphone left open on
 * an empty desk. A metered one bills until someone closes the tab.
 */

import { AudioEncoding } from "@mistralai/mistralai/extra/realtime";

export const TRANSCRIBE_MODEL = "voxtral-mini-transcribe-realtime-2602";
export const TRANSCRIBE_SAMPLE_RATE = 16000;
export const TRANSCRIBE_ENCODING = AudioEncoding.PcmS16le;

/**
 * A forgotten microphone bills for as long as the tab stays open, so a session
 * ends on its own. Ten minutes is far past any dictated chat message and short
 * enough that a walk away from the desk costs six cents rather than a day.
 */
export const MAX_SESSION_MS = 10 * 60 * 1000;

/** Silence that ends a session, once the person has started speaking. */
export const MAX_SILENCE_MS = 20 * 1000;

/**
 * Grace for the very first frame. The browser is showing a permission prompt
 * and the person may be reading it, so the silence clock cannot start at the
 * same twenty seconds or a slow decision kills the session before capture
 * begins. It still ends a session nobody ever spoke into.
 */
export const FIRST_AUDIO_GRACE_MS = 45 * 1000;

/**
 * Ceiling on audio waiting for the transcriber.
 *
 * If Voxtral stalls, frames keep arriving at roughly 32 KB a second and
 * nothing drains them. Ten seconds of backlog is far more than the service
 * ever needs to catch up, and it bounds what one connection can hold.
 */
export const MAX_QUEUED_BYTES = 320_000;

/**
 * The largest single frame worth reading.
 *
 * Dictation sends 4096 samples at a time, so real frames are 8 KB. Anything
 * an order of magnitude past that is not a microphone, and both the WebSocket
 * layer and the message handler refuse it before its bytes are touched.
 */
export const MAX_FRAME_BYTES = 64_000;

/**
 * Bridges pushed audio chunks to the async generator the Mistral SDK consumes.
 *
 * The socket hands us bytes whenever they arrive; the SDK pulls bytes when it
 * is ready. One side cannot wait for the other, so chunks queue when the
 * reader is behind and the reader parks when the queue is empty.
 */
export class AudioQueue {
  private readonly chunks: Uint8Array[] = [];
  private waiting: ((value: IteratorResult<Uint8Array>) => void) | null = null;
  private closed = false;
  private bytes = 0;
  private overflowed = false;

  constructor(private readonly maxBytes = MAX_QUEUED_BYTES) {}

  /**
   * Returns false when the chunk was refused because the backlog is full.
   *
   * Dropping audio silently would hand the transcriber a sentence with a hole
   * in it, which is worse than an honest end, so the caller is told and ends
   * the session instead.
   */
  push(chunk: Uint8Array): boolean {
    if (this.closed) return false;
    const waiter = this.waiting;
    if (waiter) {
      // Someone is parked waiting for audio: hand it over rather than queue it.
      this.waiting = null;
      waiter({ value: chunk, done: false });
      return true;
    }
    if (this.bytes + chunk.byteLength > this.maxBytes) {
      this.overflowed = true;
      return false;
    }
    this.bytes += chunk.byteLength;
    this.chunks.push(chunk);
    return true;
  }

  /** True once a chunk has been refused for want of room. */
  get isOverflowed(): boolean {
    return this.overflowed;
  }

  /** Bytes held for a transcriber that has not caught up. */
  get queuedBytes(): number {
    return this.bytes;
  }

  close(): void {
    if (this.closed) return;
    this.closed = true;
    const waiter = this.waiting;
    if (waiter) {
      this.waiting = null;
      waiter({ value: undefined, done: true });
    }
  }

  get isClosed(): boolean {
    return this.closed;
  }

  /** Chunks still queued because the reader has not caught up. */
  get pending(): number {
    return this.chunks.length;
  }

  stream(): AsyncGenerator<Uint8Array, void, unknown> {
    const self = this;
    return (async function* () {
      while (true) {
        const queued = self.chunks.shift();
        if (queued) {
          self.bytes -= queued.byteLength;
          yield queued;
          continue;
        }
        // Closing while chunks remain must still drain them, or the last
        // words spoken before the user let go of the button are lost.
        if (self.closed) return;
        const next = await new Promise<IteratorResult<Uint8Array>>(resolve => {
          self.waiting = resolve;
        });
        if (next.done) return;
        yield next.value;
      }
    })();
  }
}

/**
 * Loudness of one PCM frame, 0 to 1.
 *
 * The browser streams continuously once the microphone is open, silence
 * included, so "a frame arrived" says nothing about whether anyone is talking.
 * A silence timer fed by frame arrival never fires, and an abandoned session
 * bills to the session cap instead of the twenty-second one.
 *
 * Interpreting bytes rather than trusting them: an odd-length buffer is a
 * truncated frame and its last byte is not half a sample.
 */
export function frameLoudness(frame: Uint8Array): number {
  const samples = Math.floor(frame.length / 2);
  if (samples === 0) return 0;
  const view = new DataView(frame.buffer, frame.byteOffset, samples * 2);
  let sum = 0;
  for (let i = 0; i < samples; i++) {
    const sample = view.getInt16(i * 2, true) / 32768;
    sum += sample * sample;
  }
  return Math.sqrt(sum / samples);
}

/**
 * Below this a frame counts as silence. Room tone and a fan sit well under it;
 * speech at a normal distance from a laptop microphone sits above.
 */
export const SILENCE_RMS_THRESHOLD = 0.01;

export type TranscriptEvent =
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };

/**
 * Normalize one SDK event into what the browser is sent.
 *
 * The SDK's error shape is loose: message may be a string or a structure. A
 * browser that receives "[object Object]" tells its user nothing, so anything
 * that is not already a string is serialized.
 */
export function toTranscriptEvent(event: {
  type: string;
  text?: string;
  error?: { message?: unknown };
}): TranscriptEvent | null {
  if (event.type === "transcription.text.delta") {
    return typeof event.text === "string" && event.text
      ? { type: "delta", text: event.text }
      : null;
  }
  if (event.type === "transcription.done") return { type: "done" };
  if (event.type === "error") {
    const raw = event.error?.message;
    return {
      type: "error",
      message: typeof raw === "string" ? raw : JSON.stringify(raw ?? "unknown"),
    };
  }
  return null;
}
