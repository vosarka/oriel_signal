import { describe, expect, it } from "vitest";
import {
  buildHomeChamberStates,
  type ReceiverState,
} from "../shared/phase-gate";
import {
  calculateSignalScore,
  getSignalResult,
  getMicroCorrection,
} from "../shared/carrierlock-signal";

describe("Carrierlock signal helpers", () => {
  it("calculates the exact deterministic signal score", () => {
    expect(
      calculateSignalScore({
        mentalNoise: 10,
        bodyTension: 10,
        emotionalTide: 10,
        breathCompleted: false,
      })
    ).toBe(10);

    expect(
      calculateSignalScore({
        mentalNoise: 0,
        bodyTension: 0,
        emotionalTide: 0,
        breathCompleted: true,
      })
    ).toBe(100);
  });

  it("maps scores to the three required result states", () => {
    expect(getSignalResult(39).label).toBe("FRAGMENTED");
    expect(getSignalResult(40).label).toBe("DRIFTED");
    expect(getSignalResult(79).label).toBe("DRIFTED");
    expect(getSignalResult(80).label).toBe("ALIGNED");
  });

  it("selects deterministic micro-corrections by highest slider with tie fallback", () => {
    expect(
      getMicroCorrection({ mentalNoise: 9, bodyTension: 4, emotionalTide: 3 })
    ).toContain("Write one unfinished thought");
    expect(
      getMicroCorrection({ mentalNoise: 2, bodyTension: 8, emotionalTide: 4 })
    ).toContain("shake the hands and feet");
    expect(
      getMicroCorrection({ mentalNoise: 3, bodyTension: 5, emotionalTide: 9 })
    ).toContain("name the emotion");
    expect(
      getMicroCorrection({ mentalNoise: 7, bodyTension: 7, emotionalTide: 4 })
    ).toContain("Take six slow breaths");
  });
});

describe("phase-gate chamber helpers", () => {
  const anonymous: ReceiverState = {
    isAuthed: false,
    hasSignature: false,
    dominantCodon: null,
    coherenceScore: null,
  };

  const noSignature: ReceiverState = {
    isAuthed: true,
    hasSignature: false,
    dominantCodon: null,
    coherenceScore: null,
  };

  const signedReceiver: ReceiverState = {
    isAuthed: true,
    hasSignature: true,
    dominantCodon: "RC-001",
    coherenceScore: 72,
  };

  it("seals personal chambers for anonymous receivers and leaves public indexes recovered", () => {
    const states = buildHomeChamberStates(anonymous);

    expect(states.signature.doorState).toBe("SEALED");
    expect(states.signature.href).toBe("/auth");
    expect(states.oriel.doorState).toBe("SEALED");
    expect(states.transmissions.doorState).toBe("RECOVERED");
    expect(states.codons.doorState).toBe("RECOVERED");
    expect(states.cosmichronica.doorState).toBe("RECOVERED");
  });

  it("routes authenticated receivers without a signature to signal check", () => {
    const states = buildHomeChamberStates(noSignature);

    expect(states.signature.doorState).toBe("AWAITING COORDINATE");
    expect(states.signature.href).toBe("/signal/check");
    expect(states.oriel.doorState).toBe("SEALED");
    expect(states.oriel.href).toBe("/signal/check");
  });

  it("routes authenticated receivers with a signature to the conduit", () => {
    const states = buildHomeChamberStates(signedReceiver);

    expect(states.oriel.doorState).toBe("RECOVERED");
    expect(states.oriel.href).toBe("/conduit");
  });
});
