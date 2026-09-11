/**
 * Live dictation through the server's Mistral proxy.
 *
 * The browser's own recognizer is free and stays as the fallback, but it
 * mangles the names this project is built from. This path sends raw audio to
 * our server, which holds the API key and talks to Voxtral.
 *
 * Two rules shape the whole file. Anything that stops this from starting
 * returns null rather than throwing, so the caller can fall back instead of
 * leaving the user with a dead button. And nothing is acquired that is not
 * released on every exit, because a microphone and a metered socket left open
 * are a bill rather than a bug report.
 */

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

/** A socket that neither opens nor refuses is a hang; treat it as a refusal. */
const HANDSHAKE_TIMEOUT_MS = 10_000;

/**
 * How long to wait after the user stops for the server to finish transcribing
 * what it already has. Closing immediately drops the last words spoken.
 */
const FLUSH_TIMEOUT_MS = 2_000;

export interface DictationHandle {
  stop: () => void;
}

export interface DictationOptions {
  /** Transcribed text, arriving in pieces as the person speaks. */
  onDelta: (text: string) => void;
  /** The session ended on its own: server cap, silence, or a refusal. */
  onEnd: (reason: string) => void;
  /** Lets the caller cancel a start that is still waiting on the socket or on
   *  microphone permission. Without it, a user who presses stop during those
   *  seconds gets a session that opens after the button is already off. */
  signal?: AbortSignal;
}

function supported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof WebSocket !== "undefined" &&
    !!navigator.mediaDevices?.getUserMedia &&
    !!(window.AudioContext || (window as any).webkitAudioContext)
  );
}

/**
 * Browsers routinely ignore a requested sample rate and hand back 44.1k or 48k,
 * so the rate is read from the context that actually opened rather than the one
 * asked for. Nearest-sample picking matches what the realtime voice path
 * already does; speech survives it and it costs nothing per frame.
 */
function downsampleToInt16(input: Float32Array, fromRate: number): Int16Array {
  const ratio = fromRate / TARGET_SAMPLE_RATE;
  const length = ratio > 1 ? Math.floor(input.length / ratio) : input.length;
  const out = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const sample = ratio > 1 ? input[Math.floor(i * ratio)] : input[i];
    const clamped = Math.max(-1, Math.min(1, sample));
    out[i] = clamped < 0 ? clamped * 0x8000 : clamped * 0x7fff;
  }
  return out;
}

export async function startMistralDictation(
  options: DictationOptions
): Promise<DictationHandle | null> {
  if (!supported()) return null;
  if (options.signal?.aborted) return null;

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(
    `${protocol}//${window.location.host}/api/transcribe`
  );
  socket.binaryType = "arraybuffer";

  const closeSocket = () => {
    if (socket.readyState !== WebSocket.CLOSED) socket.close();
  };

  // An accepted upgrade is not an accepted session: the server checks the
  // signed-in user and its own configuration after the socket opens, and
  // refuses by closing. Every handler is installed now, before the first
  // await, so a refusal arriving during the microphone permission prompt is
  // recorded rather than missed.
  let accepted: ((value: boolean) => void) | null = null;
  let ready = false;
  let endedEarly: string | null = null;

  socket.onerror = () => {
    endedEarly ??= "socket error";
    accepted?.(false);
  };
  socket.onclose = () => {
    endedEarly ??= "closed";
    accepted?.(false);
  };
  socket.onmessage = event => {
    if (typeof event.data !== "string") return;
    try {
      const payload = JSON.parse(event.data) as { type?: string };
      if (payload.type === "ready") {
        ready = true;
        accepted?.(true);
      } else if (payload.type === "error") {
        endedEarly ??= "refused";
        accepted?.(false);
      }
    } catch {
      // Unreadable frame; keep waiting for ready or for a close.
    }
  };

  const handshake = await new Promise<boolean>(resolve => {
    let settled = false;
    const settle = (value: boolean) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      accepted = null;
      resolve(value);
    };
    accepted = settle;
    const timer = window.setTimeout(() => {
      endedEarly ??= "handshake timeout";
      settle(false);
    }, HANDSHAKE_TIMEOUT_MS);
    if (ready) settle(true);
    if (endedEarly) settle(false);
    options.signal?.addEventListener("abort", () => settle(false), {
      once: true,
    });
  });

  if (!handshake || options.signal?.aborted) {
    closeSocket();
    return null;
  }

  // The permission prompt can sit on screen for as long as the person takes to
  // read it, and a stop pressed during it cannot reach a handle that does not
  // exist yet. The socket is already metered, so it closes on the signal
  // rather than waiting for the prompt to resolve first.
  const closeOnAbort = () => closeSocket();
  options.signal?.addEventListener("abort", closeOnAbort, { once: true });

  let stream: MediaStream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: TARGET_SAMPLE_RATE,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
  } catch {
    // Permission refused, or no microphone.
    closeSocket();
    return null;
  }

  const releaseMic = () => stream.getTracks().forEach(track => track.stop());

  // The user may have pressed stop, or the server may have given up on us,
  // while the permission prompt was on screen.
  if (options.signal?.aborted || socket.readyState !== WebSocket.OPEN) {
    releaseMic();
    closeSocket();
    return null;
  }

  let ctx: AudioContext;
  let source: MediaStreamAudioSourceNode;
  let processor: ScriptProcessorNode;
  // Held separately so the failure path can close a context that exists even
  // though the assignment below never completed.
  let opened: AudioContext | null = null;
  try {
    const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
    ctx = new AudioCtor({ sampleRate: TARGET_SAMPLE_RATE });
    opened = ctx;
    // Startup awaited a socket and a permission prompt, so we are no longer
    // inside the click that began this. Browsers may hand back a suspended
    // context, and a suspended context never fires onaudioprocess: the mic
    // would look open while sending nothing at all.
    if (ctx.state === "suspended") await ctx.resume();
    source = ctx.createMediaStreamSource(stream);
    processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);
  } catch {
    // A context that was built before the throw is an open audio device; the
    // other two resources are released here, and it must be too.
    void opened?.close().catch(() => {});
    releaseMic();
    closeSocket();
    return null;
  }

  let stopped = false;
  const teardown = () => {
    try {
      processor.disconnect();
      source.disconnect();
    } catch {}
    releaseMic();
    void ctx.close().catch(() => {});
  };

  // Set while the socket is held open after the user stopped, waiting for the
  // transcript of what they already said.
  let flushTimer: number | undefined;
  const finishFlush = () => {
    if (flushTimer !== undefined) {
      window.clearTimeout(flushTimer);
      flushTimer = undefined;
    }
    closeSocket();
  };

  const stop = () => {
    if (stopped) return;
    stopped = true;
    teardown();
    // Tell the server no more audio is coming and give it a moment to
    // transcribe what it already holds. Closing outright drops the last words.
    if (socket.readyState === WebSocket.OPEN) {
      try {
        socket.send(JSON.stringify({ type: "end" }));
      } catch {}
      // The timer is the fallback, not the plan: the server says "done" when
      // it has drained, and holding a metered socket open past that is paying
      // for silence.
      flushTimer = window.setTimeout(finishFlush, FLUSH_TIMEOUT_MS);
    } else {
      closeSocket();
    }
  };

  processor.onaudioprocess = event => {
    if (stopped || socket.readyState !== WebSocket.OPEN) return;
    const pcm = downsampleToInt16(
      event.inputBuffer.getChannelData(0),
      ctx.sampleRate
    );
    socket.send(pcm.buffer);
  };

  source.connect(processor);
  processor.connect(ctx.destination);

  // Swap the handshake handlers for the running ones.
  socket.onmessage = event => {
    if (typeof event.data !== "string") return;
    try {
      const payload = JSON.parse(event.data) as {
        type: string;
        text?: string;
        message?: string;
      };
      if (payload.type === "delta" && payload.text) {
        options.onDelta(payload.text);
        return;
      }
      if (payload.type === "error") {
        stop();
        finishFlush();
        options.onEnd(payload.message ?? "transcription error");
        return;
      }
      if (payload.type === "done") {
        stop();
        finishFlush();
        options.onEnd("done");
      }
    } catch {
      // A frame we cannot read is not worth tearing the session down for.
    }
  };

  socket.onclose = () => {
    if (stopped) return;
    stop();
    options.onEnd("closed");
  };
  socket.onerror = () => {
    if (stopped) return;
    stop();
    options.onEnd("socket error");
  };

  options.signal?.addEventListener("abort", stop, { once: true });

  return { stop };
}
