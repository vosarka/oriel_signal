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
import { storageGet, storagePut } from "./storage";
import { buildStaticSignatureContext } from "./oriel-umm";
import { codonAtLongitude } from "./daily-codon";
import { bodyLongitudeAtUtc, PLANETS } from "./ephemeris-service";
import { getUserById } from "./db";
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
  };
}

// ── Founder's Reading ────────────────────────────────────────────────────

export async function foundersReadingStatus() {
  const paid = await tdb.countPaidPurchases();
  const seatsLeft = launchSeatsLeft(paid);
  return { priceEur: foundersReadingPrice(paid), seatsLeft, launch: seatsLeft > 0 };
}

export async function orderFoundersReading(user: { id: number }) {
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
  if (row.status !== "pending_payment") return { status: row.status };
  if (!row.paypalOrderId || !row.priceEur) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "This reading has no PayPal order." });
  }
  const { captureId } = await captureReadingOrder({
    transmissionId: row.id,
    paypalOrderId: row.paypalOrderId,
    priceEur: row.priceEur,
  });
  await tdb.updateTransmission(row.id, { status: "requested", paypalCaptureId: captureId, paidAt: new Date() });
  void generateScript(row.id).catch(error => console.error("[transmissions] generate failed:", error));
  return { status: "requested" as const };
}

// ── Writing ──────────────────────────────────────────────────────────────

export async function generateScript(id: number): Promise<void> {
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

// ── Approving, voicing, delivering ───────────────────────────────────────

export async function approveTransmission(id: number, script: unknown): Promise<void> {
  const row = await tdb.getTransmission(id);
  if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "No such transmission." });
  if (!["draft_ready", "approved", "failed"].includes(row.status)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Cannot approve a ${row.status} transmission.` });
  }
  const user = row.userId ? await getUserById(row.userId) : null;
  const name = row.kind === "echo" ? null : firstName(user?.name);
  if (!isValidScript(row.kind as TransmissionKind, script, name)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "The script breaks the transmission contract." });
  }
  const valid = script as TransmissionScript;
  await tdb.updateTransmission(id, { status: "approved", script: JSON.stringify(valid), approvedAt: new Date() });

  // If the voice fails the row stays approved and Approve can be pressed again.
  const audio = await generateChunkedSpeech(spokenText(valid), ORIEL_VOICES.sophianic);
  const { key } = await storagePut(`transmissions/${row.accessToken}.mp3`, Buffer.from(audio, "base64"), "audio/mpeg");
  await tdb.updateTransmission(id, { status: "voiced", audioStorageKey: key });

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

// ── Playing ──────────────────────────────────────────────────────────────

export async function playTransmission(token: string) {
  if (!TOKEN.test(token)) return null;
  const row = await tdb.getTransmissionByToken(token);
  if (!row || row.status !== "delivered" || !row.script) return null;
  const script = JSON.parse(row.script) as TransmissionScript;
  const audioUrl = row.audioStorageKey ? (await storageGet(row.audioStorageKey)).url || null : null;
  return { kind: row.kind, title: script.title, script, audioUrl, deliveredAt: row.deliveredAt };
}
