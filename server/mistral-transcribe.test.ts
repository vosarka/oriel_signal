import { describe, expect, it } from "vitest";
import {
  AudioQueue,
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

describe("the cost guards", () => {
  it("asks for the format Voxtral realtime expects", () => {
    expect(TRANSCRIBE_SAMPLE_RATE).toBe(16000);
    expect(TRANSCRIBE_ENCODING).toBe("pcm_s16le");
  });

  it("caps a session well past any dictated message", () => {
    // A metered microphone left open on an empty desk bills until the tab
    // closes. Ten minutes is far longer than anyone dictates a chat message.
    expect(MAX_SESSION_MS).toBe(600_000);
    expect(MAX_SILENCE_MS).toBeLessThan(MAX_SESSION_MS);
  });
});
