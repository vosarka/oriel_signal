/**
 * Mistral Voxtral TTS — ORIEL's primary voice.
 *
 * Chosen over ElevenLabs on price: $0.016 per 1000 characters against $0.05
 * for ElevenLabs Flash and $0.10 for Multilingual. On a 900-character reply
 * that is 1.4 cents instead of 9.
 *
 * It also collapses two vendors into one. The account that pays for ORIEL's
 * thinking now pays for its voice, so there is one balance to watch instead
 * of three, which is how the voice went silent in the first place.
 *
 * Known limit: Voxtral covers English, French, Spanish, Portuguese, Italian,
 * Dutch, German, Hindi and Arabic. Romanian is not among them. ORIEL answers
 * in English today, but a Romanian-speaking ORIEL would need another voice.
 *
 * API: POST https://api.mistral.ai/v1/audio/speech
 * Response: { "audio_data": "<base64 MP3>" }
 */

import { redactEcho } from "./_core/redact-echo";

const DEFAULT_MODEL = "voxtral-mini-tts-2603";
const TTS_TIMEOUT_MS = 30_000;

/**
 * ORIEL's two voices, cloned by Vos in Mistral rather than picked from the
 * preset list, so they are the actual intended voices and not placeholders.
 *
 * These were the wrong way round until now. The id below for the deep voice
 * was sitting in this file as the single default, which meant sophianic -
 * the voice almost every reply uses - was speaking with the deep one. A
 * default that is wrong is worse than no default, because nothing complains.
 */
const DEFAULT_VOICE_ID = "1c568f5a-b040-459c-9c24-aca6eef4149b";
const DEFAULT_DEEP_VOICE_ID = "4f381381-d79e-468c-9724-63edd0c5883a";

/** How much of a failed response body reaches the error. */
const ERROR_BODY_CHARS = 300;

/**
 * Map ORIEL's voice name to a Voxtral id.
 *
 * Both names now resolve to a real, distinct voice with nothing configured,
 * so the deployment cannot silently collapse the two into one. The
 * environment variables stay as overrides for when a voice is re-cloned.
 */
export function mistralTtsVoiceFor(voice?: string): string | undefined {
  if (voice !== "deep") return undefined;
  return process.env.MISTRAL_TTS_VOICE_DEEP_ID || DEFAULT_DEEP_VOICE_ID;
}

/**
 * Generate speech with Voxtral. Returns base64-encoded MP3, the same shape
 * the ElevenLabs and Inworld clients return, so callers need no branch.
 */
export async function generateMistralSpeech(
  text: string,
  voiceId?: string
): Promise<string> {
  const apiKey = process.env.MISTRAL_API_KEY;
  if (!apiKey) {
    throw new Error("[Mistral TTS] MISTRAL_API_KEY is not configured");
  }

  const response = await fetch("https://api.mistral.ai/v1/audio/speech", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      input: text,
      model: process.env.MISTRAL_TTS_MODEL || DEFAULT_MODEL,
      response_format: "mp3",
      voice_id: voiceId || process.env.MISTRAL_TTS_VOICE_ID || DEFAULT_VOICE_ID,
    }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    // The status alone is not actionable. A 401 is a bad key, a 402 is an
    // empty balance and a 422 is a bad voice id, and only the body says
    // which of those actually happened.
    let detail = "";
    try {
      // The text we sent is what ORIEL just said to somebody. A validation
      // error that echoes the input would carry that whole reply into the
      // log, so it comes back out by name before anything is capped - the
      // same rule the memory client follows, for the same reason.
      detail = redactEcho((await response.text()).trim(), [text]).slice(
        0,
        ERROR_BODY_CHARS
      );
    } catch {
      detail = "(response body unreadable)";
    }
    throw new Error(
      `[Mistral TTS] API error ${response.status}${detail ? `: ${detail}` : ""}`
    );
  }

  const payload = (await response.json()) as { audio_data?: unknown };
  if (typeof payload.audio_data !== "string" || !payload.audio_data) {
    throw new Error("[Mistral TTS] Response missing audio_data");
  }
  return payload.audio_data;
}
