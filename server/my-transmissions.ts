/**
 * The transmissions ORIEL sent a Seeker in the chat (TX and oracle events).
 * They were always stored, but the Seeker only saw each one for a moment in
 * the conversation; this is their own row in the archive.
 */
import { listGeneratedTransmissionEvents } from "./db";

function parsePayload(value: string | null | undefined): Record<string, unknown> {
  if (!value) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function listMyTransmissions(userId: number) {
  const events = await listGeneratedTransmissionEvents({ userId, limit: 100 });
  return events
    .filter(e => e.userId === userId && e.status !== "discarded")
    .map(e => ({
      id: e.id,
      eventKey: e.eventKey,
      eventType: e.eventType,
      rarity: e.rarity,
      meaningLevel: e.meaningLevel,
      status: e.status,
      payload: parsePayload(e.payload),
      createdAt: e.createdAt,
    }));
}
