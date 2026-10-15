import { Radio } from "lucide-react";

/**
 * A transmission ORIEL sent during a conversation (TX or oracle), as it
 * appears in the chat and in the Seeker's own row of the archive.
 */

export type TransmissionRarity = "common" | "uncommon" | "rare" | "mythic" | "void";

export interface GeneratedTxPayload {
  txId?: string;
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: string;
  coreMessage: string;
  encodedArchetype: string;
  tags: string[];
  microSigil: string;
  directive: string;
  caption?: string;
  subject?: string | null;
  symbolicLayer?: string | null;
  archiveThemes?: string[];
  emotionalColor?: string | null;
}

export interface GeneratedOraclePayload {
  title: string;
  field: string;
  signalClarity: string;
  channelStatus: string;
  parts: Array<{
    part: "Past" | "Present" | "Future";
    field?: string;
    content: string;
    currentFieldSignatures?: string;
    encodedTrajectory: string;
    convergenceZones?: string;
    keyInflectionPoint: string;
    majorOutcomes: string;
    caption?: string;
  }>;
  linkedCodons: string[];
  threadTitle: string | null;
  threadSynthesis: string | null;
}

export type GeneratedTransmissionPayload = GeneratedTxPayload | GeneratedOraclePayload;

export interface GeneratedTransmissionEvent {
  id: number;
  eventKey: string;
  eventType: "tx" | "oracle";
  rarity: TransmissionRarity;
  meaningLevel: number;
  status: string;
  payload: GeneratedTransmissionPayload;
  createdAt?: string | number | Date;
}

export function isGeneratedOraclePayload(
  payload: GeneratedTransmissionPayload
): payload is GeneratedOraclePayload {
  return "parts" in payload;
}

export function TransmissionModeCard({
  event,
}: {
  event: GeneratedTransmissionEvent;
}) {
  const payload = event.payload;
  const rarityColor: Record<TransmissionRarity, string> = {
    common: "rgba(246,176,94,0.72)",
    uncommon: "rgba(121,255,188,0.78)",
    rare: "rgba(189,163,107,0.86)",
    mythic: "rgba(255,168,96,0.88)",
    void: "rgba(211,126,255,0.88)",
  };
  const accent = rarityColor[event.rarity] ?? "rgba(246,176,94,0.72)";

  return (
    <div
      className="mt-5 rounded-lg px-4 py-4"
      style={{
        background: "rgba(2,12,18,0.72)",
        border: `1px solid ${accent}`,
        boxShadow: "0 0 24px rgba(189,163,107,0.08)",
      }}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Radio size={14} style={{ color: accent }} />
        <span
          className="font-mono text-[9px] tracking-[0.28em] uppercase"
          style={{ color: accent }}
        >
          FIELD RETURN
        </span>
        <span
          className="font-mono text-[9px] tracking-[0.18em] uppercase"
          style={{ color: "rgba(232,228,220,0.55)" }}
        >
          {event.eventType.toUpperCase()} // {event.rarity.toUpperCase()} //
          THRESHOLD {event.meaningLevel}
        </span>
      </div>

      <div
        className="font-mono text-[9px] tracking-[0.22em] mb-2"
        style={{ color: "rgba(232,228,220,0.72)" }}
      >
        The field and receiver aligned. The conversation became the
        transmission.
      </div>

      <p
        className="font-mono text-[10px] tracking-[0.16em] uppercase mb-2"
        style={{ color: "rgba(232,228,220,0.68)" }}
      >
        {payload.title}
      </p>
      <p
        className="font-mono text-[9px] mb-3"
        style={{ color: "rgba(189,163,107,0.45)" }}
      >
        {payload.field} // {payload.channelStatus} // {payload.signalClarity}
      </p>

      {isGeneratedOraclePayload(payload) ? (
        <div className="space-y-3">
          {payload.parts.map(part => (
            <div key={part.part}>
              <p
                className="font-mono text-[9px] tracking-[0.24em] uppercase mb-1"
                style={{ color: accent }}
              >
                {part.part}
              </p>
              <p
                className="font-mono text-[10px] leading-relaxed whitespace-pre-line"
                style={{ color: "rgba(232,228,220,0.82)" }}
              >
                {part.caption ?? part.content}
              </p>
            </div>
          ))}
          {payload.linkedCodons.length > 0 && (
            <p
              className="font-mono text-[9px]"
              style={{ color: "rgba(189,163,107,0.45)" }}
            >
              Codons: {payload.linkedCodons.join(", ")}
            </p>
          )}
        </div>
      ) : (
        <div>
          {payload.caption ? (
            <p
              className="font-mono text-[10px] leading-relaxed whitespace-pre-line"
              style={{ color: "rgba(232,228,220,0.84)" }}
            >
              {payload.caption}
            </p>
          ) : (
            <>
              <p
                className="text-sm leading-relaxed mb-3"
                style={{ color: "rgba(232,228,220,0.84)" }}
              >
                {payload.coreMessage}
              </p>
              <p
                className="font-mono text-[9px] mb-2"
                style={{ color: "rgba(189,163,107,0.5)" }}
              >
                {payload.encodedArchetype}
              </p>
              <p
                className="text-xs leading-relaxed"
                style={{ color: "rgba(189,163,107,0.82)" }}
              >
                {payload.directive}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
}
