/**
 * Saving a personal transmission as a video file, entirely in the browser:
 * the film's frames and the words it shows are composited on a 2D canvas,
 * ORIEL's voice is taken from the page's own audio graph, and MediaRecorder
 * writes them together. No server, no cost.
 */

// MP4 first: phones (iPhone above all) play it and it carries its own length;
// a WebM from MediaRecorder has no duration, so players cannot seek in it.
const MIME_CANDIDATES = [
  "video/mp4;codecs=avc1,mp4a.40.2",
  "video/mp4;codecs=avc1,opus",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

/** The best format this browser can record, or null when it cannot. */
export function pickRecorderMime(isSupported: (type: string) => boolean): string | null {
  return MIME_CANDIDATES.find(type => isSupported(type)) ?? null;
}

export function filmFileName(serial: string, mime: string): string {
  return `ORIEL-${serial}.${mime.startsWith("video/mp4") ? "mp4" : "webm"}`;
}

/** Words into lines no wider than maxWidth; a single long word keeps its own line. */
export function wrapWords(words: string[], maxWidth: number, measure: (text: string) => number): string[][] {
  const lines: string[][] = [];
  let line: string[] = [];
  for (const word of words) {
    const next = [...line, word];
    if (line.length && measure(next.join(" ")) > maxWidth) {
      lines.push(line);
      line = [word];
    } else {
      line = next;
    }
  }
  if (line.length) lines.push(line);
  return lines;
}

/** True when this browser can record the film. */
export function canRecordFilm(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.MediaRecorder !== "undefined" &&
    typeof HTMLCanvasElement !== "undefined" &&
    "captureStream" in HTMLCanvasElement.prototype &&
    pickRecorderMime(type => MediaRecorder.isTypeSupported(type)) !== null
  );
}

/** What the words layer shows at one moment. */
export interface FilmCaption {
  movement: string;
  past: string | null;
  line: string;
  /** How many words of `line` have been spoken. */
  said: number;
}

const WIDTH = 1280;
const HEIGHT = 720;
const LORE_FONT = '"Cormorant Garamond", "Cinzel", Georgia, serif';
const MONO_FONT = '"Red Hat Mono", "JetBrains Mono", ui-monospace, monospace';

/**
 * Starts a recording. Call `frame` once per drawn film frame, right after the
 * film draws (so its WebGL buffer is still readable), then `stop` for the file.
 */
export function startFilmRecording(audio: MediaStream) {
  const mime = pickRecorderMime(type => MediaRecorder.isTypeSupported(type)) ?? "video/webm";
  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  const ctx = canvas.getContext("2d")!;
  const stream = new MediaStream([
    ...canvas.captureStream(30).getVideoTracks(),
    ...audio.getAudioTracks(),
  ]);
  const recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = e => {
    if (e.data.size) chunks.push(e.data);
  };
  recorder.start(1000);

  const frame = (film: HTMLCanvasElement, caption: FilmCaption | null) => {
    // The film, covering the frame like it covers the screen.
    const scale = Math.max(WIDTH / film.width, HEIGHT / film.height);
    const w = film.width * scale;
    const h = film.height * scale;
    ctx.fillStyle = "#050505";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.drawImage(film, (WIDTH - w) / 2, (HEIGHT - h) / 2, w, h);
    if (!caption) return;

    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const size = 34;
    ctx.font = `${size}px ${LORE_FONT}`;
    const lines = wrapWords(caption.line.split(/\s+/u).filter(Boolean), WIDTH * 0.72, t => ctx.measureText(t).width);
    const lineHeight = size * 1.45;
    let y = HEIGHT - 90 - (lines.length - 1) * lineHeight;

    if (caption.past) {
      ctx.font = `22px ${LORE_FONT}`;
      ctx.fillStyle = "rgba(255, 247, 230, 0.35)";
      ctx.fillText(caption.past, WIDTH / 2, y - lineHeight * 1.1, WIDTH * 0.8);
    }
    ctx.font = `13px ${MONO_FONT}`;
    ctx.fillStyle = "#bda36b";
    ctx.fillText(caption.movement.split("").join(" "), WIDTH / 2, y - lineHeight * (caption.past ? 2 : 1.1));

    // Only the words already spoken, each in the place it will keep.
    ctx.font = `${size}px ${LORE_FONT}`;
    ctx.fillStyle = "#fff7e6";
    ctx.textAlign = "left";
    let index = 0;
    for (const line of lines) {
      const text = line.join(" ");
      let x = (WIDTH - ctx.measureText(text).width) / 2;
      for (const word of line) {
        if (index < caption.said) ctx.fillText(word, x, y);
        x += ctx.measureText(`${word} `).width;
        index += 1;
      }
      y += lineHeight;
    }
  };

  const stop = () =>
    new Promise<{ blob: Blob; mime: string }>(resolve => {
      recorder.onstop = () => resolve({ blob: new Blob(chunks, { type: mime }), mime });
      if (recorder.state !== "inactive") recorder.stop();
      else resolve({ blob: new Blob(chunks, { type: mime }), mime });
    });

  const cancel = () => {
    recorder.ondataavailable = null;
    if (recorder.state !== "inactive") recorder.stop();
  };

  return { frame, stop, cancel };
}

/** Hands the finished file to the viewer. */
export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
