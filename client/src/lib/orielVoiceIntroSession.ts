import {
  containsOrielVoiceOpening,
  speakableOrielName,
  stripOrielVoiceOpening,
} from "@shared/oriel/voice-intro";

let orielVoiceIntroSpoken = false;

export function hasOrielVoiceIntroSpoken(): boolean {
  return orielVoiceIntroSpoken;
}

export function markOrielVoiceIntroSpoken(): void {
  orielVoiceIntroSpoken = true;
}

export function markOrielVoiceIntroSpokenFromText(text: string): void {
  if (containsOrielVoiceOpening(text)) {
    markOrielVoiceIntroSpoken();
  }
}

export function prepareOrielTextForVoice(text: string): {
  textForAudio: string;
  shouldMarkIntroSpoken: boolean;
} {
  const shouldMarkIntroSpoken =
    !orielVoiceIntroSpoken && containsOrielVoiceOpening(text);

  return {
    // The browser's own voice reads this too, not only the server chain.
    textForAudio: speakableOrielName(
      orielVoiceIntroSpoken ? stripOrielVoiceOpening(text) : text
    ),
    shouldMarkIntroSpoken,
  };
}

export function resetOrielVoiceIntroSessionForTests(): void {
  orielVoiceIntroSpoken = false;
}
