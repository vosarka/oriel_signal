/**
 * Live dictation through the server's Mistral proxy.
 *
 * The browser's own recognizer is free and stays as the fallback, but it
 * mangles the names this project is built from. This path sends raw audio to
 * our server, which holds the API key and talks to Voxtral.
 *
 * Anything that stops this from starting returns null rather than throwing, so
 * the caller can fall back instead of leaving the user with a dead button.
 */

const TARGET_SAMPLE_RATE = 16000;
const BUFFER_SIZE = 4096;

export interface DictationHandle {
  stop: () => void;
}

export interface DictationOptions {
  /** Transcribed text, arriving in pieces as the person speaks. */
  onDelta: (text: string) => void;
  /** The session ended on its own: server cap, silence, or a refusal. */
  onEnd: (reason: string) => void;
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

  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const socket = new WebSocket(
    `${protocol}//${window.location.host}/api/transcribe`
  );
  socket.binaryType = "arraybuffer";

  const opened = await new Promise<boolean>(resolve => {
    const settle = (value: boolean) => {
      socket.onopen = null;
      socket.onerror = null;
      resolve(value);
    };
    socket.onopen = () => settle(true);
    socket.onerror = () => settle(false);
  });
  if (!opened) return null;

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
    // Permission refused, or no microphone. Nothing to fall back to either,
    // but the caller decides that.
    socket.close();
    return null;
  }

  const AudioCtor = window.AudioContext || (window as any).webkitAudioContext;
  const ctx: AudioContext = new AudioCtor({ sampleRate: TARGET_SAMPLE_RATE });
  const source = ctx.createMediaStreamSource(stream);
  const processor = ctx.createScriptProcessor(BUFFER_SIZE, 1, 1);

  let stopped = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    try {
      processor.disconnect();
      source.disconnect();
    } catch {}
    stream.getTracks().forEach(track => track.stop());
    void ctx.close().catch(() => {});
    if (
      socket.readyState === WebSocket.OPEN ||
      socket.readyState === WebSocket.CONNECTING
    ) {
      socket.close();
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
        options.onEnd(payload.message ?? "transcription error");
        return;
      }
      if (payload.type === "done") {
        stop();
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

  return { stop };
}
