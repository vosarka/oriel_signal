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

/** Silence that ends a session, on the same reasoning. */
export const MAX_SILENCE_MS = 20 * 1000;

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

  push(chunk: Uint8Array): void {
    if (this.closed) return;
    const waiter = this.waiting;
    if (waiter) {
      // Someone is parked waiting for audio: hand it over rather than queue it.
      this.waiting = null;
      waiter({ value: chunk, done: false });
      return;
    }
    this.chunks.push(chunk);
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
