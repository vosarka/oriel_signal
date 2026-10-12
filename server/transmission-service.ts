/**
 * Personal transmissions, from order to play. ORIEL writes, Vos approves,
 * the voice is generated, the Seeker plays it at /t/:token.
 */
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { sendTransmissionDeliveryEmail } from "./_core/mailer";
import { generateChunkedSpeech, ORIEL_VOICES } from "./oriel-tts-chain";
import { buildStaticSignatureContext } from "./oriel-umm";
import { codonAtLongitude } from "./daily-codon";
import { bodyLongitudeAtUtc, PLANETS } from "./ephemeris-service";
import { getUserById } from "./db";
import { getRelevantMemories } from "./oriel-memory";
import * as tdb from "./transmission-db";
import { captureReadingOrder, createReadingOrder } from "./founders-reading-paypal";
import { foundersReadingPrice, launchSeatsLeft } from "../shared/founders-reading";
import {
  buildTransmissionPrompt,
  firstName,
  isValidScript,
  spokenText,
  type SeekerContext,
  type TransmissionKind,
  type TransmissionScript,
} from "../shared/transmission-script";
import type { PersonalTransmission } from "../drizzle/schema";

export const TRANSMISSION_DUE_HOURS = 48;
const TOKEN = /^[a-f0-9]{64}$/;

const siteUrl = () => (ENV.appBaseUrl || "https://orielsignal.space").replace(/\/+$/, "");
export const newToken = () => randomBytes(32).toString("hex");
export const playUrl = (token: string) => `${siteUrl()}/t/${token}`;

/** Sun and Moon now; null if the ephemeris is unavailable. */
async function monthCodons() {
  try {
    const now = new Date();
    return {
      sun: codonAtLongitude(await bodyLongitudeAtUtc(PLANETS.SUN, now)),
      moon: codonAtLongitude(await bodyLongitudeAtUtc(PLANETS.MOON, now)),
    };
  } catch (error) {
    console.warn("[transmissions] month codons unavailable:", error);
    return { sun: null, moon: null };
  }
}

async function seekerFor(row: PersonalTransmission): Promise<SeekerContext> {
  const month = row.kind === "mirror" ? { sun: null, moon: null } : await monthCodons();
  if (row.kind === "echo" || !row.userId) return { name: null, signature: "", ...month };
  const user = await getUserById(row.userId);
  return {
    name: firstName(user?.name),
    signature: await buildStaticSignatureContext(row.userId),
    ...month,
    intention: row.intention,
    // Only with the Seeker's consent, given at the order.
    memories: row.useMemories ? await rememberedThemes(row.userId) : [],
  };
}

/** What ORIEL keeps of a Seeker's conversations: its active memories, most important first. */
async function rememberedThemes(userId: number): Promise<string[]> {
  const memories = await getRelevantMemories(userId, 12);
  return memories.map(m => m.content.trim()).filter(Boolean).map(c => c.slice(0, 240));
}

/** What the Seeker brings to a reading: their words, and whether ORIEL may draw on its memories. */
export interface ReadingInput {
  intention?: string | null;
  useMemories?: boolean;
}

const cleanInput = (input: ReadingInput = {}) => ({
  intention: input.intention?.trim().slice(0, 600) || null,
  useMemories: Boolean(input.useMemories),
});

// ── Founder's Reading ────────────────────────────────────────────────────

export async function foundersReadingStatus() {
  const paid = await tdb.countPaidPurchases();
  const seatsLeft = launchSeatsLeft(paid);
  return { priceEur: foundersReadingPrice(paid), seatsLeft, launch: seatsLeft > 0 };
}

export async function orderFoundersReading(user: { id: number }, input: ReadingInput = {}) {
  if (!(await buildStaticSignatureContext(user.id))) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Prepare your signature first, so ORIEL has something true to read.",
    });
  }
  const priceEur = foundersReadingPrice(await tdb.countPaidPurchases());
  const row = await tdb.insertTransmission({
    userId: user.id,
    kind: "mirror",
    source: "purchase",
    status: "pending_payment",
    accessToken: newToken(),
    priceEur,
    ...cleanInput(input),
  });
  const { paypalOrderId, approveUrl } = await createReadingOrder({
    transmissionId: row.id,
    priceEur,
    returnUrl: `${siteUrl()}/founders-reading?reading=return&id=${row.id}`,
    cancelUrl: `${siteUrl()}/founders-reading`,
  });
  await tdb.updateTransmission(row.id, { paypalOrderId });
  return { transmissionId: row.id, approveUrl };
}

/** Idempotent: a refresh after return answers the current state. */
export async function captureFoundersReading(user: { id: number }, transmissionId: number) {
  const row = await tdb.getTransmission(transmissionId);
  if (!row || row.userId !== user.id || row.source !== "purchase") {
    throw new TRPCError({ code: "NOT_FOUND", message: "No such reading." });
  }
  return settlePayment(row);
}

/**
 * Admin: a Mirror for Vos's own account, without payment, so the whole
 * path after PayPal (writing, approval, voice, email, player) can be
 * tried and heard. No price and no paidAt, so it never counts as a sale.
 */
export async function createTestTransmission(admin: { id: number }, input: ReadingInput = {}) {
  if (!(await buildStaticSignatureContext(admin.id))) {
    throw new TRPCError({
      code: "PRECONDITION_FAILED",
      message: "Save your own signature first, at /complete-profile.",
    });
  }
  const row = await tdb.insertTransmission({
    userId: admin.id,
    kind: "mirror",
    source: "purchase",
    status: "requested",
    accessToken: newToken(),
    ...cleanInput(input),
  });
  void generateScript(row.id).catch(error => console.error("[transmissions] test generate failed:", error));
  return { id: row.id };
}

/** Admin: re-check a payment that is stuck at pending_payment. */
export async function recheckPayment(transmissionId: number) {
  const row = await tdb.getTransmission(transmissionId);
  if (!row || row.source !== "purchase") {
    throw new TRPCError({ code: "NOT_FOUND", message: "No such reading." });
  }
  return settlePayment(row);
}

async function settlePayment(row: PersonalTransmission) {
  if (row.status !== "pending_payment") return { status: row.status };
  if (!row.paypalOrderId || !row.priceEur) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This reading has no PayPal order." });
  }
  const { captureId, pending } = await captureReadingOrder({
    transmissionId: row.id,
    paypalOrderId: row.paypalOrderId,
    priceEur: row.priceEur,
  });
  await tdb.updateTransmission(row.id, {
    status: "requested",
    paypalCaptureId: captureId,
    paidAt: new Date(),
    failureReason: pending
      ? "PayPal is holding this payment (capture PENDING). Check it has settled in PayPal before approving."
      : null,
  });
  void generateScript(row.id).catch(error => console.error("[transmissions] generate failed:", error));
  return { status: "requested" as const };
}

// ── Writing ──────────────────────────────────────────────────────────────

export async function generateScript(id: number): Promise<void> {
  try {
    await writeScript(id);
  } catch (error) {
    // Anything before the model (database, signature, user) must not leave
    // the row at "requested" with no reason; Vos sees it and can Regenerate.
    const reason = error instanceof Error ? error.message : String(error);
    console.error(`[transmissions] generate ${id} failed:`, error);
    await tdb.updateTransmission(id, { status: "failed", failureReason: reason });
  }
}

async function writeScript(id: number): Promise<void> {
  const row = await tdb.getTransmission(id);
  if (!row) return;
  const seeker = await seekerFor(row);
  const kind = row.kind as TransmissionKind;
  let lastError = "the model returned an invalid script";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await invokeLLM({
        temperature: 0.8,
        maxTokens: 1400,
        messages: [{ role: "user", content: buildTransmissionPrompt(kind, seeker) }],
        responseFormat: { type: "json_object" },
      });
      const raw = res.choices?.[0]?.message?.content;
      const parsed = parseModelJson<unknown>(typeof raw === "string" ? raw : JSON.stringify(raw));
      if (isValidScript(kind, parsed, seeker.name)) {
        await tdb.updateTransmission(id, { status: "draft_ready", script: JSON.stringify(parsed), failureReason: null });
        return;
      }
      console.warn(`[transmissions] attempt ${attempt + 1} for ${id} broke the contract`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
      console.warn(`[transmissions] attempt ${attempt + 1} for ${id} failed:`, error);
    }
  }
  await tdb.updateTransmission(id, { status: "failed", failureReason: lastError });
}

/** Admin: write again. Never for an unpaid order, never over a delivered one. */
export async function regenerateTransmission(id: number): Promise<void> {
  const row = await tdb.getTransmission(id);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No such transmission." });
  if (row.status === "pending_payment") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This reading has not been paid for yet. Re-check the payment first." });
  }
  if (row.status === "delivered") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This transmission was already delivered." });
  }
  await tdb.updateTransmission(id, { status: "requested", failureReason: null });
  await generateScript(id);
}

// ── Approving, voicing, delivering ───────────────────────────────────────

export async function approveTransmission(id: number, script: unknown): Promise<void> {
  const row = await tdb.getTransmission(id);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No such transmission." });
  // A delivered transmission without its voice (stored before the voice
  // lived on the row) may be approved again, and is voiced this time.
  const voiceless = row.status === "delivered" && !row.audioBase64;
  if (!voiceless && !["draft_ready", "approved", "voiced", "failed"].includes(row.status)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot approve a ${row.status} transmission.` });
  }
  const user = row.userId ? await getUserById(row.userId) : null;
  const name = row.kind === "echo" ? null : firstName(user?.name);
  if (!isValidScript(row.kind as TransmissionKind, script, name)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The script breaks the transmission contract." });
  }
  const valid = script as TransmissionScript;
  const alreadyVoiced =
    row.status === "voiced" && Boolean(row.audioBase64) && row.script === JSON.stringify(valid);

  // Voiced already (only the email failed): send again without paying for
  // the voice twice. Otherwise voice it; if that fails the row stays
  // approved and Approve can be pressed again.
  if (!alreadyVoiced) {
    await tdb.updateTransmission(id, { status: "approved", script: JSON.stringify(valid), approvedAt: new Date() });
    const audio = await generateChunkedSpeech(spokenText(valid), ORIEL_VOICES.deep);
    // The voice is kept on the row (MP3, base64): no object storage to be
    // missing, and a transmission is never delivered silent.
    if (!audio) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The voice came back empty." });
    await tdb.updateTransmission(id, { status: "voiced", audioBase64: audio });
  }

  if (user?.email) {
    await sendTransmissionDeliveryEmail({
      email: user.email,
      name,
      title: valid.title,
      url: playUrl(row.accessToken),
    });
  }
  await tdb.updateTransmission(id, { status: "delivered", deliveredAt: new Date() });
}

// ── The admin queue ──────────────────────────────────────────────────────

const DAY = 86_400_000;

/**
 * What needs Vos: everything not yet delivered (oldest first), payments
 * stuck after PayPal approval in the last week, then deliveries of the last
 * month (newest first). Unbounded on purpose: a cap hid new requests.
 */
type QueueRow = Pick<PersonalTransmission, "status" | "paypalOrderId" | "createdAt" | "deliveredAt">;

export function adminQueue<T extends QueueRow>(rows: T[], now: Date): T[] {
  const age = (d: Date | null) => (d ? now.getTime() - new Date(d).getTime() : Infinity);
  const waiting = rows
    .filter(r =>
      r.status === "pending_payment"
        ? Boolean(r.paypalOrderId) && age(r.createdAt) <= 7 * DAY
        : r.status !== "delivered"
    )
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  const delivered = rows
    .filter(r => r.status === "delivered" && age(r.deliveredAt) <= 30 * DAY)
    .sort((a, b) => new Date(b.deliveredAt!).getTime() - new Date(a.deliveredAt!).getTime());
  return [...waiting, ...delivered];
}

// ── Playing ──────────────────────────────────────────────────────────────

export async function playTransmission(token: string) {
  if (!TOKEN.test(token)) return null;
  const row = await tdb.getTransmissionByToken(token);
  if (!row || row.status !== "delivered" || !row.script) return null;
  const script = JSON.parse(row.script) as TransmissionScript;
  const audioUrl = row.hasAudio ? `/api/transmissions/${token}/audio` : null;
  return {
    kind: row.kind,
    /** TX-P-007: the archive's TX format, P for personal so it never collides. */
    serial: `TX-P-${String(row.id).padStart(3, "0")}`,
    title: script.title,
    script,
    audioUrl,
    deliveredAt: row.deliveredAt,
  };
}

/** The MP3 of a delivered transmission, or null. Served at /api/transmissions/:token/audio. */
export async function transmissionAudio(token: string): Promise<Buffer | null> {
  if (!TOKEN.test(token)) return null;
  const row = await tdb.getAudioByToken(token);
  if (!row || row.status !== "delivered" || !row.audioBase64) return null;
  return Buffer.from(row.audioBase64, "base64");
}
