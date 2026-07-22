const DEFAULT_VOICE_ID = "OUEHqpmoTxRBAmee8KD3";
export const ELEVENLABS_SOPHIANIC_VOICE_ID = "RILOU7YmBhvwJGDGjNmP";
const DEFAULT_MODEL_ID = "eleven_flash_v2_5";
const DEFAULT_OUTPUT_FORMAT = "mp3_44100_128";

export async function generateElevenLabsSpeech(
  text: string,
  voiceId = process.env.ELEVENLABS_VOICE_ID ?? DEFAULT_VOICE_ID
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("[ElevenLabs TTS] ELEVENLABS_API_KEY is not configured");
  }

  const modelId = process.env.ELEVENLABS_MODEL_ID ?? DEFAULT_MODEL_ID;
  const outputFormat =
    process.env.ELEVENLABS_OUTPUT_FORMAT ?? DEFAULT_OUTPUT_FORMAT;
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(voiceId)}?output_format=${encodeURIComponent(outputFormat)}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": apiKey,
      },
      body: JSON.stringify({ text, model_id: modelId }),
      signal: AbortSignal.timeout(30_000),
    }
  );

  if (!response.ok) {
    throw new Error(`[ElevenLabs TTS] API error ${response.status}`);
  }

  return Buffer.from(await response.arrayBuffer()).toString("base64");
}
