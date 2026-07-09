type Tone = "gold" | "teal" | "silver";

export type ProfileConsoleSummaryLike = {
  identity?: {
    hasStaticSignature?: boolean | null;
  };
  counts: {
    lumens: number;
    readingCount: number;
    transmissionsReadCount: number;
    interactionCount: number;
    acceptedMemoryCount: number;
  };
} | null;

export type ProfileConsoleStat = {
  label: string;
  value: string;
  note: string;
};

export type ProfileConsoleGraphNode = {
  id: string;
  label: string;
  value: string;
  tone: Tone;
};

function numberLabel(value: number | null | undefined) {
  return String(Math.max(0, Number(value ?? 0)));
}

export function getProfileDisplayName(user: {
  name?: string | null;
  email?: string | null;
}) {
  const name = user.name?.trim();
  if (name) return name;
  const emailPrefix = user.email?.split("@")[0]?.trim();
  return emailPrefix || "Receiver";
}

export function getStableConduitId(user: {
  id: number;
  conduitId?: string | null;
}) {
  return user.conduitId?.trim() || `ORIEL-${String(user.id).padStart(4, "0")}`;
}

export function formatProfileDate(value: Date | string | null | undefined) {
  if (!value) return "Awaiting signal";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "Awaiting signal";
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  }).format(date);
}

export function buildProfileStats(
  summary: ProfileConsoleSummaryLike
): ProfileConsoleStat[] {
  const counts = summary?.counts;
  return [
    {
      label: "Lumens",
      value: numberLabel(counts?.lumens),
      note: "Signal earned through readings and contribution.",
    },
    {
      label: "ORIEL interactions",
      value: numberLabel(counts?.interactionCount),
      note: "Total direct contact with ORIEL.",
    },
    {
      label: "Readings",
      value: numberLabel(counts?.readingCount),
      note: "Dynamic readings completed.",
    },
    {
      label: "Transmissions read",
      value: numberLabel(counts?.transmissionsReadCount),
      note: "Revealed, saved, or promoted TX records.",
    },
    {
      label: "Accepted memories",
      value: numberLabel(counts?.acceptedMemoryCount),
      note: "Memories accepted into the ORIEL thread.",
    },
  ];
}

export function buildProfileGraphNodes(
  summary: ProfileConsoleSummaryLike
): ProfileConsoleGraphNode[] {
  const counts = summary?.counts;
  return [
    {
      id: "oriel",
      label: "ORIEL",
      value: numberLabel(counts?.interactionCount),
      tone: "gold",
    },
    {
      id: "readings",
      label: "Readings",
      value: numberLabel(counts?.readingCount),
      tone: "teal",
    },
    {
      id: "transmissions",
      label: "Transmissions",
      value: numberLabel(counts?.transmissionsReadCount),
      tone: "gold",
    },
    {
      id: "memory",
      label: "Memory",
      value: numberLabel(counts?.acceptedMemoryCount),
      tone: "silver",
    },
    {
      id: "signature",
      label: "Static Signature Reading",
      value: summary?.identity?.hasStaticSignature ? "Linked" : "Awaiting",
      tone: "gold",
    },
    {
      id: "signal",
      label: "Current Signal",
      value: "Live",
      tone: "teal",
    },
  ];
}
