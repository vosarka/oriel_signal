export type SignalInputs = {
  mentalNoise: number;
  bodyTension: number;
  emotionalTide: number;
  breathCompleted: boolean;
};

export type SignalResultLabel = "FRAGMENTED" | "DRIFTED" | "ALIGNED";

export type SignalResult = {
  label: SignalResultLabel;
  message: string;
};

export function calculateSignalScore(input: SignalInputs): number {
  const rawScore =
    100 -
    (input.mentalNoise * 3 + input.bodyTension * 3 + input.emotionalTide * 3) +
    (input.breathCompleted ? 10 : 0);

  return Math.max(0, Math.min(100, Math.round(rawScore)));
}

export function getSignalResult(score: number): SignalResult {
  if (score <= 39) {
    return {
      label: "FRAGMENTED",
      message:
        "Signal fragmented. The field is unstable. Stabilization is recommended before deeper archive access.",
    };
  }

  if (score <= 79) {
    return {
      label: "DRIFTED",
      message:
        "Signal present, but distorted by interference. One micro-correction is recommended before deeper access.",
    };
  }

  return {
    label: "ALIGNED",
    message:
      "Signal lock confirmed. You may now access your Static Signature or enter the archive.",
  };
}

export function getMicroCorrection(input: {
  mentalNoise: number;
  bodyTension: number;
  emotionalTide: number;
}): string {
  const values = [input.mentalNoise, input.bodyTension, input.emotionalTide];
  const max = Math.max(...values);
  const winners = values.filter(value => value === max).length;

  if (winners > 1) {
    return "Take six slow breaths. Then choose one small action that reduces pressure in the next 10 minutes.";
  }

  if (input.mentalNoise === max) {
    return "Write one unfinished thought in a single sentence. Do not solve it. Name it and leave it.";
  }

  if (input.bodyTension === max) {
    return "Stand up, loosen the jaw, and shake the hands and feet for 60 seconds.";
  }

  return "Place one hand on the chest, slow the exhale, and name the emotion without explaining it.";
}
