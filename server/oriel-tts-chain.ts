/**
 * ORIEL's voice: which vendor speaks, in what order, and what happens when
 * none of them will.
 *
 * Mistral Voxtral leads on price, $0.016 per 1000 characters against
 * ElevenLabs at $0.05 for Flash and $0.10 for Multilingual, and it bills the
 * account that already pays for ORIEL's thinking. ElevenLabs stays behind it
 * so an outage at one vendor does not leave ORIEL mute.
 *
 * Inworld was removed from this chain. It had become a third balance to keep
 * topped up, and the day both it and ElevenLabs hit zero, ORIEL went silent
 * with only the fallback's complaint in the log. Inworld still powers the
 * live realtime voice session, which is a different feature in
 * server/inworld-realtime.ts and is untouched by this file.
 *
 * Known limit: Voxtral speaks English, French, Spanish, Portuguese, Italian,
 * Dutch, German, Hindi and Arabic. Romanian is not among them. ORIEL answers
 * in English today, so this costs nothing now, but a Romanian-speaking ORIEL
 * would need another voice.
 */

import {
  ELEVENLABS_SOPHIANIC_VOICE_ID,
  generateElevenLabsSpeech,
} from "./elevenlabs-tts";
import { generateMistralSpeech, mistralTtsVoiceFor } from "./mistral-tts";

/**
 * ORIEL's own voice names. Vendor-neutral on purpose: each client maps these
 * to its own id, so swapping a vendor never reaches the router or the client.
 */
export const ORIEL_VOICES = {
  sophianic: "sophianic",
  deep: "deep",
} as const;

/** The order voices are tried in, cheapest and primary first. */
export const TTS_CHAIN = ["Mistral", "ElevenLabs"] as const;

function elevenLabsVoiceFor(voice?: string): string | undefined {
  // Both names map, not just one. Falling back used to drop the deep voice to
  // the vendor's generic default, so a person who chose it heard someone else
  // the moment Mistral refused.
  if (voice === ORIEL_VOICES.deep) {
    return process.env.ELEVENLABS_VOICE_DEEP_ID || undefined;
  }
  if (voice === ORIEL_VOICES.sophianic) {
    return (
      process.env.ELEVENLABS_VOICE_SOPHIANIC_ID || ELEVENLABS_SOPHIANIC_VOICE_ID
    );
  }
  return undefined;
}

function reasonFrom(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/**
 * Speak with the first voice that answers.
 *
 * When every voice refuses, the error names every reason. The previous
 * version surfaced only the last one, so a day of "no credits remaining" from
 * the fallback hid that the primary had been refusing too.
 */
export async function generateSpeechWithFallback(
  text: string,
  voice?: string,
  synthesizeElevenLabs = generateElevenLabsSpeech,
  synthesizeMistral = generateMistralSpeech
): Promise<string> {
  const chain = [
    {
      name: "Mistral",
      run: () => synthesizeMistral(text, mistralTtsVoiceFor(voice)),
    },
    {
      name: "ElevenLabs",
      run: () => synthesizeElevenLabs(text, elevenLabsVoiceFor(voice)),
    },
  ];

  const failures: string[] = [];
  for (const step of chain) {
    try {
      const audio = await step.run();
      if (failures.length > 0) {
        console.warn(
          `[ORIEL TTS] ${step.name} served after ${failures.join("; ")}`
        );
      }
      return audio;
    } catch (error) {
      failures.push(`${step.name}: ${reasonFrom(error)}`);
    }
  }

  throw new Error(`[ORIEL TTS] every voice refused. ${failures.join(" | ")}`);
}

/**
 * Printed at startup beside the LLM and memory chains. A missing key is worth
 * knowing before a user hits it, not after: ORIEL went mute for a day because
 * balances hit zero and nothing said so until someone pressed play.
 */
export function logResolvedVoiceChain(): void {
  const keys: Array<[string, string | undefined]> = [
    ["Mistral", process.env.MISTRAL_API_KEY],
    ["ElevenLabs", process.env.ELEVENLABS_API_KEY],
  ];
  keys.forEach(([name, key], index) => {
    console.log(
      `[TTS][config] ${index + 1}. ${name} key=${key ? "present" : "MISSING"}`
    );
  });
}

/** Convert base64 audio to a browser-playable data URL. */
export function audioToDataUrl(base64Audio: string): string {
  return `data:audio/mpeg;base64,${base64Audio}`;
}

// ─── Chunked generation for long ORIEL transmissions ─────────────────────────

/**
 * Exported for its tests. Splitting long speech is where the two bugs lived
 * that dropped a reply's last sentence and let one long sentence past the
 * size limit, and neither is reachable through generateChunkedSpeech without
 * a live synthesizer.
 */
export function chunkText(text: string, maxLength = 1000): string[] {
  const chunks: string[] = [];
  let current = "";
  // The trailing alternative matters: without it, a reply whose last sentence
  // has no full stop is dropped entirely and ORIEL stops mid-thought.
  //
  // The leading star matters for the same reason at the other end. Requiring
  // a character before the punctuation means a reply opening on "..." has no
  // match at position zero, and the scan resumes past the ellipsis: the pause
  // ORIEL opened with is silently deleted.
  const sentences = text.match(/[^.!?]*[.!?]+|[^.!?]+$/g) ?? [text];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (!trimmed) continue;
    if (trimmed.length > maxLength) {
      // One sentence longer than the whole budget used to sail past the limit,
      // because the size check only fired when something was already buffered.
      //
      // Split on words rather than at a character count. Slicing every
      // maxLength characters cuts through the middle of a word, and the
      // synthesizer then pronounces both halves as if they were words.
      if (current) chunks.push(current.trim());
      let line = "";
      // A single token longer than the budget has no word boundary to break
      // at, so packing words alone would emit it whole and hand the provider
      // the oversized request this branch exists to prevent. Rare, and the
      // limit is not a suggestion: a URL or a base64 paste reaches it.
      const words = trimmed.split(/\s+/).flatMap(word => {
        if (word.length <= maxLength) return [word];
        const pieces: string[] = [];
        for (let start = 0; start < word.length; start += maxLength) {
          pieces.push(word.slice(start, start + maxLength));
        }
        return pieces;
      });
      for (const word of words) {
        if (line && line.length + 1 + word.length > maxLength) {
          chunks.push(line);
          line = word;
        } else {
          line += (line ? " " : "") + word;
        }
      }
      if (line) chunks.push(line);
      current = "";
    } else if (current && current.length + 1 + trimmed.length > maxLength) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current += (current ? " " : "") + trimmed;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

/**
 * Generate speech for long text by chunking at sentence boundaries.
 * Returns a single base64 MP3 (all chunks concatenated).
 */
export async function generateChunkedSpeech(
  text: string,
  voice?: string
): Promise<string> {
  if (text.length < 1000) return generateSpeechWithFallback(text, voice);

  console.log(`[ORIEL TTS] Chunking ${text.length}-char text`);
  const chunks = chunkText(text, 1000);
  console.log(`[ORIEL TTS] ${chunks.length} chunks`);

  const buffers: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const base64 = await generateSpeechWithFallback(chunks[i], voice);
    buffers.push(Buffer.from(base64, "base64"));
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 150));
  }

  return Buffer.concat(buffers).toString("base64");
}
