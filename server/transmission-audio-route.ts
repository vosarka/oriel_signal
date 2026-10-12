/**
 * The voice of a delivered personal transmission, by its private token.
 * Byte ranges are honoured so the player can seek.
 */
import type { Express } from "express";
import { transmissionAudio } from "./transmission-service";

/** [start, end] inclusive for a "bytes=a-b" header, or null if unusable. */
export function parseRange(header: string | undefined, size: number): [number, number] | null {
  const m = header?.match(/^bytes=(\d*)-(\d*)$/);
  if (!m || (m[1] === "" && m[2] === "")) return null;
  const start = m[1] === "" ? Math.max(0, size - Number(m[2])) : Number(m[1]);
  const end = m[1] === "" || m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  return start <= end && start < size ? [start, end] : null;
}

export function registerTransmissionAudioRoute(app: Express) {
  app.get("/api/transmissions/:token/audio", async (req, res) => {
    try {
      const audio = await transmissionAudio(req.params.token);
      if (!audio) {
        res.status(404).end();
        return;
      }
      res.set({
        "Content-Type": "audio/mpeg",
        "Accept-Ranges": "bytes",
        "Cache-Control": "private, max-age=86400",
        "X-Robots-Tag": "noindex",
      });
      const range = parseRange(req.headers.range, audio.length);
      if (!range) {
        res.set("Content-Length", String(audio.length)).send(audio);
        return;
      }
      const [start, end] = range;
      res
        .status(206)
        .set({ "Content-Range": `bytes ${start}-${end}/${audio.length}`, "Content-Length": String(end - start + 1) })
        .send(audio.subarray(start, end + 1));
    } catch (error) {
      console.error("[transmissions] audio failed:", error);
      res.status(500).end();
    }
  });
}
