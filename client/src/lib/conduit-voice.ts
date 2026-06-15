export function getConduitInputDisabled(input: {
  chatPending: boolean;
  isSpeaking: boolean;
  transmissionInterfering: boolean;
}) {
  return input.chatPending || input.transmissionInterfering;
}

export function getSpeechFallbackTimeoutMs(text: string) {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const estimatedMs = wordCount * 450 + 2000;
  return Math.max(4000, Math.min(25000, estimatedMs));
}

export function getSpeechFallbackWatchdogDecision(input: {
  elapsedMs: number;
  isSpeaking: boolean;
  hardLimitMs?: number;
}): "extend" | "clear" {
  const hardLimitMs = input.hardLimitMs ?? 120_000;
  if (input.isSpeaking && input.elapsedMs < hardLimitMs) {
    return "extend";
  }
  return "clear";
}

// Splits text into sentence-grouped chunks for pipeline TTS. Groups short
// sentences together up to targetLength so the first chunk starts playing
// in ~1–2s instead of waiting for the full text to be synthesised.
export function splitIntoSpeechChunks(
  text: string,
  targetLength = 200
): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length <= 1) return [text.trim()].filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    if (!current) {
      current = sentence;
    } else if (current.length + 1 + sentence.length <= targetLength) {
      current += " " + sentence;
    } else {
      chunks.push(current);
      current = sentence;
    }
  }

  if (current) chunks.push(current);
  return chunks;
}
