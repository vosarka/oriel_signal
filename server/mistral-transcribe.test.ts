import { describe, expect, it } from "vitest";
import {
  AudioQueue,
  FIRST_AUDIO_GRACE_MS,
  MAX_QUEUED_BYTES,
  SILENCE_RMS_THRESHOLD,
  frameLoudness,
  MAX_SESSION_MS,
  MAX_SILENCE_MS,
  TRANSCRIBE_ENCODING,
  TRANSCRIBE_SAMPLE_RATE,
  toTranscriptEvent,
} from "./mistral-transcribe";

const bytes = (...values: number[]) => new Uint8Array(values);

const drain = async (queue: AudioQueue) => {
  const seen: number[][] = [];
  for await (const chunk of queue.stream()) seen.push([...chunk]);
  return seen;
};

describe("the audio bridge", () => {
  it("delivers chunks pushed before anyone reads", async () => {
    const queue = new AudioQueue();
    queue.push(bytes(1));
    queue.push(bytes(2));
    queue.close();

    expect(await drain(queue)).toEqual([[1], [2]]);
  });

  it("drains what is queued even though the socket closed", async () => {
    // The last words before the user lets go arrive just as the socket shuts.
    // Closing must not throw them away.
    const queue = new AudioQueue();
    queue.push(bytes(7));
    queue.push(bytes(8));
    queue.close();

    expect(await drain(queue)).toEqual([[7], [8]]);
    expect(queue.pending).toBe(0);
  });

  it("parks the reader until audio arrives, instead of spinning", async () => {
    const queue = new AudioQueue();
    const collected = drain(queue);

    // Nothing pushed yet. The reader is waiting, not burning the event loop.
    await new Promise(resolve => setTimeout(resolve, 5));
    expect(queue.pending).toBe(0);

    queue.push(bytes(3));
    await new Promise(resolve => setTimeout(resolve, 5));
    queue.close();

    expect(await collected).toEqual([[3]]);
  });

  it("ends the reader when the socket closes with nothing queued", async () => {
    const queue = new AudioQueue();
    const collected = drain(queue);
    queue.close();
    expect(await collected).toEqual([]);
  });

  it("ignores audio that arrives after closing", async () => {
    // A socket can emit one more message after close. Accepting it would keep
    // a finished session billing.
    const queue = new AudioQueue();
    queue.close();
    queue.push(bytes(9));

    expect(queue.isClosed).toBe(true);
    expect(queue.pending).toBe(0);
    expect(await drain(queue)).toEqual([]);
  });

  it("closes only once", async () => {
    const queue = new AudioQueue();
    const collected = drain(queue);
    queue.close();
    queue.close();
    expect(await collected).toEqual([]);
  });
});

describe("what the browser is told", () => {
  it("passes transcribed text through", () => {
    expect(
      toTranscriptEvent({ type: "transcription.text.delta", text: "hello" })
    ).toEqual({ type: "delta", text: "hello" });
  });

  it("drops an empty delta rather than sending noise", () => {
    expect(
      toTranscriptEvent({ type: "transcription.text.delta", text: "" })
    ).toBeNull();
  });

  it("reports the end of a transcription", () => {
    expect(toTranscriptEvent({ type: "transcription.done" })).toEqual({
      type: "done",
    });
  });

  it("serializes an error whose message is not a string", () => {
    // "[object Object]" in the browser console tells its reader nothing.
    const event = toTranscriptEvent({
      type: "error",
      error: { message: { code: 402, detail: "no credits" } },
    });
    expect(event?.type).toBe("error");
    expect((event as { message: string }).message).toContain("402");
    expect((event as { message: string }).message).toContain("no credits");
  });

  it("passes a string error through unchanged", () => {
    expect(
      toTranscriptEvent({ type: "error", error: { message: "bad key" } })
    ).toEqual({ type: "error", message: "bad key" });
  });

  it("ignores events it has no use for", () => {
    expect(toTranscriptEvent({ type: "transcription.session.created" })).toBe(
      null
    );
  });
});

describe("when the transcriber falls behind", () => {
  it("refuses audio once the backlog is full", () => {
    // Frames keep arriving at roughly 32 KB a second whether or not anything
    // drains them. Without a ceiling one stalled connection grows until the
    // session cap, ten minutes away.
    const queue = new AudioQueue(100);
    expect(queue.push(new Uint8Array(60))).toBe(true);
    expect(queue.push(new Uint8Array(60))).toBe(false);
    expect(queue.isOverflowed).toBe(true);
    expect(queue.queuedBytes).toBe(60);
  });

  it("takes audio again once the reader has drained it", async () => {
    const queue = new AudioQueue(100);
    queue.push(new Uint8Array(80));
    expect(queue.push(new Uint8Array(80))).toBe(false);

    const reader = queue.stream();
    await reader.next();
    expect(queue.queuedBytes).toBe(0);
    expect(queue.push(new Uint8Array(80))).toBe(true);
    queue.close();
  });

  it("hands a waiting reader audio without ever queueing it", () => {
    // A reader that is keeping up never fills the backlog, however long the
    // session runs.
    const queue = new AudioQueue(10);
    const reader = queue.stream();
    void reader.next();
    // Give the generator a turn to park on the empty queue.
    return Promise.resolve().then(() => {
      expect(queue.push(new Uint8Array(9999))).toBe(true);
      expect(queue.queuedBytes).toBe(0);
      queue.close();
    });
  });

  it("leaves room for a real backlog by default", () => {
    expect(MAX_QUEUED_BYTES).toBeGreaterThan(100_000);
  });
});

describe("telling silence from speech", () => {
  // Little-endian Int16 frames, the shape the browser sends.
  const frame = (...samples: number[]) => {
    const buffer = new ArrayBuffer(samples.length * 2);
    const view = new DataView(buffer);
    samples.forEach((sample, i) => view.setInt16(i * 2, sample, true));
    return new Uint8Array(buffer);
  };

  it("reads a loud frame as loud", () => {
    expect(frameLoudness(frame(20000, -20000, 18000, -19000))).toBeGreaterThan(
      SILENCE_RMS_THRESHOLD
    );
  });

  it("reads a quiet room as silence", () => {
    // Room tone and a laptop fan sit here. The timer must not treat this as
    // someone speaking, or a microphone on an empty desk bills to the cap.
    expect(frameLoudness(frame(3, -2, 1, 0, -3, 2))).toBeLessThan(
      SILENCE_RMS_THRESHOLD
    );
  });

  it("reads true digital silence as zero", () => {
    expect(frameLoudness(frame(0, 0, 0, 0))).toBe(0);
  });

  it("survives an empty or truncated frame", () => {
    // A half sample is not a sample. Reading past it would be reading memory
    // that is not ours.
    expect(frameLoudness(new Uint8Array([]))).toBe(0);
    expect(frameLoudness(new Uint8Array([0x11]))).toBe(0);
    expect(frameLoudness(new Uint8Array([0xff, 0x7f, 0x22]))).toBeGreaterThan(
      0
    );
  });

  it("reads a frame sitting inside a larger buffer", () => {
    // Node hands out views onto pooled buffers, so byteOffset is rarely zero.
    // Ignoring it would measure somebody else's audio.
    const pool = new Uint8Array(64);
    const view = new DataView(pool.buffer);
    view.setInt16(32, 25000, true);
    view.setInt16(34, -25000, true);
    const slice = new Uint8Array(pool.buffer, 32, 4);
    expect(frameLoudness(slice)).toBeGreaterThan(SILENCE_RMS_THRESHOLD);
  });
});

describe("the cost guards", () => {
  it("asks for the format Voxtral realtime expects", () => {
    expect(TRANSCRIBE_SAMPLE_RATE).toBe(16000);
    expect(TRANSCRIBE_ENCODING).toBe("pcm_s16le");
  });

  it("waits longer for the first frame than for later silence", () => {
    // The browser is showing a permission prompt and the person is reading it.
    // Twenty seconds of that is not an abandoned session.
    expect(FIRST_AUDIO_GRACE_MS).toBeGreaterThan(20_000);
  });

  it("caps a session well past any dictated message", () => {
    // A metered microphone left open on an empty desk bills until the tab
    // closes. Ten minutes is far longer than anyone dictates a chat message.
    expect(MAX_SESSION_MS).toBe(600_000);
    expect(MAX_SILENCE_MS).toBeLessThan(MAX_SESSION_MS);
  });
});
