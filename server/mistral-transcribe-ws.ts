/**
 * WebSocket proxy for live dictation: browser audio in, transcript out.
 *
 *   Browser <--ws--> this server <--ws--> Mistral Voxtral
 *
 * The proxy exists for the same reason the realtime one does: MISTRAL_API_KEY
 * must not reach a browser. It also gates on a signed-in user, which the free
 * browser recognizer never needed. This one bills by the minute, and an open
 * endpoint that costs money per connection is an invitation.
 */

import { Server as HttpServer, IncomingMessage } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { parse as parseUrl } from "url";
import { RealtimeTranscription } from "@mistralai/mistralai/extra/realtime/index.js";
import { ENV } from "./_core/env";
import { resolveWebSocketUser } from "./_core/ws-auth";
import {
  AudioQueue,
  FIRST_AUDIO_GRACE_MS,
  MAX_FRAME_BYTES,
  MAX_SESSION_MS,
  MAX_SILENCE_MS,
  SILENCE_RMS_THRESHOLD,
  frameLoudness,
  TRANSCRIBE_ENCODING,
  TRANSCRIBE_MODEL,
  TRANSCRIBE_SAMPLE_RATE,
  toTranscriptEvent,
} from "./mistral-transcribe";

export const TRANSCRIBE_PATH = "/api/transcribe";

function send(ws: WebSocket, payload: unknown): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(payload));
}

export function setupTranscribeWebSocket(server: HttpServer): void {
  // A frame larger than the whole backlog allowance is not dictation. Without
  // a cap the library assembles it first and every byte is then walked by the
  // loudness check, on the one thread everything else in the process shares.
  const wss = new WebSocketServer({
    noServer: true,
    maxPayload: MAX_FRAME_BYTES,
  });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parseUrl(req.url || "", true);
    // Other paths belong to other handlers, including Vite's HMR socket.
    if (pathname !== TRANSCRIBE_PATH) return;
    wss.handleUpgrade(req, socket, head, ws => wss.emit("connection", ws, req));
  });

  wss.on("connection", async (ws: WebSocket, req: IncomingMessage) => {
    // Before anything that waits. A socket with no "error" listener does not
    // report an error in Node, it throws one out of the EventEmitter, and an
    // oversized frame arriving while the session is still checking who is
    // calling would take the whole Express process down with it.
    let failed = false;
    ws.on("error", err => {
      failed = true;
      console.error("[Transcribe] socket error:", err);
    });

    const user = await resolveWebSocketUser(req, "[Transcribe]");
    // The wait above is long enough for the socket to have died in it.
    if (failed || ws.readyState !== WebSocket.OPEN) return;
    if (!user) {
      // The browser falls back to its own recognizer on this close code, so a
      // signed-out visitor still gets dictation, just the free weaker one.
      send(ws, { type: "error", message: "sign in to use live transcription" });
      ws.close(4401, "unauthorized");
      return;
    }
    if (!ENV.mistralApiKey) {
      send(ws, { type: "error", message: "transcription is not configured" });
      ws.close(4503, "unconfigured");
      return;
    }

    // The client waits for this before opening the microphone. Without it,
    // an accepted upgrade looks like an accepted session, and a refusal that
    // lands during the permission prompt is missed: the caller keeps a handle
    // it thinks is live and never falls back to the browser recognizer.
    send(ws, { type: "ready" });

    const queue = new AudioQueue();
    let lastAudioAt = Date.now();
    let heardAnything = false;

    const stop = (reason: string) => {
      if (queue.isClosed) return;
      console.log(`[Transcribe] session for user ${user.id} ended: ${reason}`);
      queue.close();
      if (ws.readyState === WebSocket.OPEN) ws.close(1000, reason);
    };

    // Two timers, both about money rather than correctness. A tab left open
    // with the microphone on bills until someone closes it.
    const sessionCap = setTimeout(() => stop("session cap"), MAX_SESSION_MS);
    const silenceCheck = setInterval(() => {
      // Before the first frame the browser is still asking permission, so the
      // clock runs long. After it, twenty seconds of quiet ends the session.
      const limit = heardAnything ? MAX_SILENCE_MS : FIRST_AUDIO_GRACE_MS;
      if (Date.now() - lastAudioAt > limit) stop("silence");
    }, 5_000);

    ws.on("message", data => {
      // The client says when it has finished speaking, so the transcriber can
      // drain what it holds instead of losing the last words to a close.
      if (!Buffer.isBuffer(data)) {
        if (String(data).includes('"end"')) queue.close();
        return;
      }
      // No size check here on purpose: maxPayload above refuses an oversized
      // frame at the protocol layer, so one never reaches this handler and a
      // guard would be a comment pretending to be code.
      const frame = new Uint8Array(data);
      // Arrival is not speech. The stream runs continuously while the mic is
      // open, so a timer reset by every frame is a timer that never fires.
      if (frameLoudness(frame) >= SILENCE_RMS_THRESHOLD) {
        lastAudioAt = Date.now();
        heardAnything = true;
      }
      if (!queue.push(frame)) {
        // The transcriber has fallen far enough behind that continuing would
        // mean transcribing a sentence with a hole in it.
        stop("audio backlog");
      }
    });
    ws.on("close", () => stop("client closed"));
    // The bootstrap listener above only recorded the failure; from here a
    // socket error also has a session to end.
    ws.on("error", () => stop("socket error"));

    try {
      const client = new RealtimeTranscription({ apiKey: ENV.mistralApiKey });
      for await (const event of client.transcribeStream(
        queue.stream(),
        TRANSCRIBE_MODEL,
        {
          audioFormat: {
            encoding: TRANSCRIBE_ENCODING,
            sampleRate: TRANSCRIBE_SAMPLE_RATE,
          },
        }
      )) {
        const mapped = toTranscriptEvent(event as { type: string });
        if (!mapped) continue;
        send(ws, mapped);
        if (mapped.type === "done" || mapped.type === "error") break;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "unknown error";
      console.error("[Transcribe] stream failed:", message);
      send(ws, { type: "error", message });
    } finally {
      clearTimeout(sessionCap);
      clearInterval(silenceCheck);
      stop("stream ended");
    }
  });

  console.log(`[Transcribe] WebSocket proxy ready on ${TRANSCRIBE_PATH}`);
}
