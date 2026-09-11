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

const DEFAULT_MODEL = "voxtral-mini-tts-2603";
const DEFAULT_VOICE_ID = "4f381381-d79e-468c-9724-63edd0c5883a";
const TTS_TIMEOUT_MS = 30_000;

/** How much of a failed response body reaches the error. */
const ERROR_BODY_CHARS = 300;

export function mistralTtsVoiceFor(voice?: string): string | undefined {
  if (voice === "deep") return process.env.MISTRAL_TTS_VOICE_DEEP_ID;
  return undefined;
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
      model: process.env.MISTRAL_TTS_MODEL ?? DEFAULT_MODEL,
      response_format: "mp3",
      voice_id: voiceId ?? process.env.MISTRAL_TTS_VOICE_ID ?? DEFAULT_VOICE_ID,
    }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    // The status alone is not actionable. A 401 is a bad key, a 402 is an
    // empty balance and a 422 is a bad voice id, and only the body says
    // which of those actually happened.
    let detail = "";
    try {
      detail = (await response.text()).trim().slice(0, ERROR_BODY_CHARS);
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
