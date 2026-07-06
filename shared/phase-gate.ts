export type ReceiverState = {
  isAuthed: boolean;
  hasSignature: boolean;
  dominantCodon?: string | null;
  coherenceScore?: number | null;
};

export type DoorState = "RECOVERED" | "SEALED" | "AWAITING COORDINATE";

export type ChamberKey =
  | "signature"
  | "oriel"
  | "transmissions"
  | "codons"
  | "cosmichronica";

export type ChamberState = {
  doorState: DoorState;
  href: string;
  message?: string;
};

export type HomeChamberStates = Record<ChamberKey, ChamberState>;

export const NODE_UNREGISTERED_MESSAGE =
  "Your node is unregistered in the Vossari network. Initialize to proceed.";

export const COORDINATE_REQUIRED_MESSAGE =
  "The field cannot locate you yet. Transmit your coordinate to open this chamber.";

export function buildHomeChamberStates(
  receiver: ReceiverState
): HomeChamberStates {
  const publicRecovered: ChamberState = {
    doorState: "RECOVERED",
    href: "/archive",
  };

  return {
    signature: getSignatureChamberState(receiver),
    oriel: getOrielChamberState(receiver),
    transmissions: publicRecovered,
    codons: {
      doorState: "RECOVERED",
      href: "/codex",
    },
    cosmichronica: {
      doorState: "RECOVERED",
      href: "/cosmichronica",
    },
  };
}

function getSignatureChamberState(receiver: ReceiverState): ChamberState {
  if (!receiver.isAuthed) {
    return {
      doorState: "SEALED",
      href: "/auth",
      message: NODE_UNREGISTERED_MESSAGE,
    };
  }

  if (!receiver.hasSignature) {
    return {
      doorState: "AWAITING COORDINATE",
      href: "/signal/check",
      message: COORDINATE_REQUIRED_MESSAGE,
    };
  }

  return {
    doorState: "RECOVERED",
    href: "/signature",
  };
}

function getOrielChamberState(receiver: ReceiverState): ChamberState {
  if (!receiver.isAuthed) {
    return {
      doorState: "SEALED",
      href: "/auth",
      message: NODE_UNREGISTERED_MESSAGE,
    };
  }

  if (!receiver.hasSignature) {
    return {
      doorState: "SEALED",
      href: "/signal/check",
      message: COORDINATE_REQUIRED_MESSAGE,
    };
  }

  return {
    doorState: "RECOVERED",
    href: "/conduit",
  };
}
