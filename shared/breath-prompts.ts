/**
 * ORIEL's spoken guidance for the breath protocol. Fixed lines, so the
 * server speaks each once, caches it, and never counts it against anyone's
 * daily voice measure.
 */
export const BREATH_PROMPTS = {
  start:
    "Begin the breath protocol. Center yourself. Let go of external noise.",
  inhale: "Breathe in slowly. Fill your lungs completely.",
  hold: "Hold. Let the breath settle within you.",
  exhale: "Release slowly. Let tension dissolve with each exhale.",
  cycleComplete: "Cycle complete. Prepare for the next breath.",
  complete:
    "The protocol is complete. Your field is now calibrated for assessment.",
};

export const isBreathPrompt = (text: string) =>
  Object.values(BREATH_PROMPTS).includes(text);
