/**
 * Inworld TTS Integration for ORIEL voice synthesis
 *
 * Replaces ElevenLabs. Uses Inworld TTS API v1 with Basic auth.
 *
 * Required env var:
 *   INWORLD_API_KEY  — Base64-encoded "key_id:key_secret" credentials
 *
 * Optional env var:
 *   INWORLD_VOICE_ID — Override voice (defaults to ORIEL's configured voice)
 *
 * API: POST https://api.inworld.ai/tts/v1/voice
 * Response: { audioContent: "<base64 MP3>" }
 */

import https from "https";
import {
  ELEVENLABS_SOPHIANIC_VOICE_ID,
  generateElevenLabsSpeech,
} from "./elevenlabs-tts";
import { generateMistralSpeech, mistralTtsVoiceFor } from "./mistral-tts";

const VOICE_SOPHIANIC = "default-0o0vqxaayifb0rqvrpyf5a__oriel_fema";
const VOICE_DEEP = "default-0o0vqxaayifb0rqvrpyf5a__oriel_serii";
const MODEL_ID = "inworld-tts-1.5-max";

export const INWORLD_VOICES = {
  sophianic: VOICE_SOPHIANIC,
  deep: VOICE_DEEP,
} as const;

// ─── Core synthesis ───────────────────────────────────────────────────────────

/**
 * Generate speech using Inworld TTS API.
 * Returns base64-encoded MP3 audio.
 */
export async function generateInworldSpeech(
  text: string,
  voice?: string
): Promise<string> {
  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey)
    throw new Error("[Inworld TTS] INWORLD_API_KEY is not configured");

  const voiceId = voice ?? process.env.INWORLD_VOICE_ID ?? VOICE_SOPHIANIC;

  const payload = JSON.stringify({
    text,
    voiceId,
    modelId: MODEL_ID,
    speakingRate: 1.01,
    temperature: 0.72,
    timestampType: "WORD",
  });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "api.inworld.ai",
      port: 443,
      path: "/tts/v1/voice",
      method: "POST",
      headers: {
        Authorization: `Basic ${apiKey}`,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, res => {
      const chunks: Buffer[] = [];
      res.on("data", (chunk: Buffer) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      );
      res.on("end", () => {
        const body = Buffer.concat(chunks).toString("utf-8");
        if (res.statusCode === 200 || res.statusCode === 201) {
          try {
            const json = JSON.parse(body) as { audioContent?: string };
            if (!json.audioContent) {
              reject(new Error("[Inworld TTS] Response missing audioContent"));
              return;
            }
            console.log(
              `[Inworld TTS] Generated audio: ${json.audioContent.length} chars (base64)`
            );
            resolve(json.audioContent);
          } catch {
            reject(
              new Error(
                `[Inworld TTS] Could not parse response: ${body.slice(0, 200)}`
              )
            );
          }
        } else {
          console.error(
            `[Inworld TTS] API error ${res.statusCode}:`,
            body.slice(0, 300)
          );
          reject(
            new Error(
              `[Inworld TTS] Error ${res.statusCode}: ${body.slice(0, 200)}`
            )
          );
        }
      });
    });

    req.on("error", err => {
      console.error("[Inworld TTS] Request error:", err);
      reject(err);
    });
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("[Inworld TTS] Request timeout"));
    });

    req.write(payload);
    req.end();
  });
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Convert base64 audio to a browser-playable data URL. */
export function audioToDataUrl(base64Audio: string): string {
  return `data:audio/mpeg;base64,${base64Audio}`;
}

function elevenLabsVoiceFor(voice?: string): string | undefined {
  return voice === INWORLD_VOICES.sophianic
    ? (process.env.ELEVENLABS_VOICE_SOPHIANIC_ID ??
        ELEVENLABS_SOPHIANIC_VOICE_ID)
    : undefined;
}

function reasonFrom(error: unknown): string {
  return error instanceof Error ? error.message : "unknown error";
}

/** The order voices are tried in, cheapest and primary first. */
export const TTS_CHAIN = ["Mistral", "ElevenLabs", "Inworld"] as const;

/**
 * Speak with the first voice that answers.
 *
 * Mistral leads on price: $0.016 per 1000 characters against ElevenLabs at
 * $0.05 or $0.10, and it bills the account that already pays for ORIEL's
 * thinking. The others stay as fallbacks so an outage at one vendor does not
 * leave ORIEL mute.
 *
 * When every voice refuses, the error names every reason. The previous
 * version surfaced only the last one, so a day of "no credits remaining" from
 * the fallback hid that the primary had been refusing too.
 */
export async function generateSpeechWithFallback(
  text: string,
  voice?: string,
  synthesizeElevenLabs = generateElevenLabsSpeech,
  synthesizeInworld = generateInworldSpeech,
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
    { name: "Inworld", run: () => synthesizeInworld(text, voice) },
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
 * two balances hit zero and nothing said so until someone pressed play.
 */
export function logResolvedVoiceChain(): void {
  const keys: Array<[string, string | undefined]> = [
    ["Mistral", process.env.MISTRAL_API_KEY],
    ["ElevenLabs", process.env.ELEVENLABS_API_KEY],
    ["Inworld", process.env.INWORLD_API_KEY],
  ];
  keys.forEach(([name, key], index) => {
    console.log(
      `[TTS][config] ${index + 1}. ${name} key=${key ? "present" : "MISSING"}`
    );
  });
}

// ─── Chunked generation for long ORIEL transmissions ─────────────────────────

function chunkText(text: string, maxLength = 1000): string[] {
  const chunks: string[] = [];
  let current = "";
  const sentences = text.match(/[^.!?]+[.!?]+/g) ?? [text];
  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (current.length + trimmed.length > maxLength && current.length > 0) {
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

  console.log(`[Inworld TTS] Chunking ${text.length}-char text`);
  const chunks = chunkText(text, 1000);
  console.log(`[Inworld TTS] ${chunks.length} chunks`);

  const buffers: Buffer[] = [];
  for (let i = 0; i < chunks.length; i++) {
    const base64 = await generateSpeechWithFallback(chunks[i], voice);
    buffers.push(Buffer.from(base64, "base64"));
    if (i < chunks.length - 1) await new Promise(r => setTimeout(r, 150));
  }

  return Buffer.concat(buffers).toString("base64");
}
