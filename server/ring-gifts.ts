/**
 * The gift at every ring: a Founder's Reading or a month of Garden, chosen by
 * the Seeker, kept or passed on as a link. Whoever opens the link first and
 * signs in receives it; the link is then spent.
 */
import { randomBytes } from "node:crypto";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { GARDEN_PLANS, supporterKind, type SupporterFields } from "../shared/supporter-access";
import {
  claimGiftRow,
  clearGiftRedeemed,
  getGift,
  getGiftByToken,
  listGifts,
  markGiftRedeemed,
  nameOf,
  type GiftKind,
} from "./rings-db";
import { grantGardenMonth } from "./garden-month-db";
import { monthUntil } from "./garden-month";
import { startGiftReading } from "./transmission-service";
import { buildStaticSignatureContext } from "./oriel-umm";

export type { GiftKind };

const siteUrl = () => (ENV.appBaseUrl || "https://orielsignal.space").replace(/\/+$/, "");
const giftUrl = (token: string) => `${siteUrl()}/gift/${token}`;

/**
 * Why this receiver cannot take this gift yet, or null. Either way the link
 * stays valid: a Garden member can pass a month on, and a reading waits for
 * the signature ORIEL needs to read.
 */
export function redeemBlock(
  kind: GiftKind,
  recipient: SupporterFields,
  hasSignature: boolean,
  now: Date = new Date()
): "active_garden" | "needs_signature" | null {
  if (kind === "garden_month" && supporterKind(recipient, now) === "garden") return "active_garden";
  if (kind === "founders_reading" && !hasSignature) return "needs_signature";
  return null;
}

export async function claimGift(userId: number, giftId: number, kind: GiftKind): Promise<{ url: string }> {
  const gift = await getGift(giftId);
  if (!gift || gift.userId !== userId) throw new TRPCError({ code: "NOT_FOUND", message: "No such gift." });
  if (gift.token) return { url: giftUrl(gift.token) };
  const token = randomBytes(16).toString("hex");
  if (await claimGiftRow(giftId, userId, kind, token)) return { url: giftUrl(token) };
  // Claimed in another tab a moment ago: answer with that link.
  const again = await getGift(giftId);
  if (!again?.token) throw new TRPCError({ code: "CONFLICT", message: "Try again." });
  return { url: giftUrl(again.token) };
}

export async function giftByToken(
  token: string
): Promise<{ kind: GiftKind; fromName: string | null; redeemed: boolean } | null> {
  const gift = await getGiftByToken(token);
  if (!gift?.kind) return null;
  return { kind: gift.kind, fromName: await nameOf(gift.userId), redeemed: Boolean(gift.redeemedAt) };
}

export async function redeemGift(
  user: SupporterFields & { id: number },
  token: string
): Promise<{ kind: GiftKind; transmissionId?: number }> {
  const gift = await getGiftByToken(token);
  if (!gift?.kind) throw new TRPCError({ code: "NOT_FOUND", message: "No such gift." });
  if (gift.redeemedAt) throw new TRPCError({ code: "CONFLICT", message: "This gift has already been received." });
  const kind = gift.kind;

  const hasSignature = kind === "founders_reading" ? Boolean(await buildStaticSignatureContext(user.id)) : true;
  const block = redeemBlock(kind, user, hasSignature);
  if (block) throw new TRPCError({ code: "PRECONDITION_FAILED", message: block });

  if (!(await markGiftRedeemed(token, user.id))) {
    throw new TRPCError({ code: "CONFLICT", message: "This gift has already been received." });
  }
  try {
    if (kind === "garden_month") {
      // A bought Deep Garden month still open stays deep; the gift adds to it.
      const deepOpen = supporterKind(user) !== null && user.paypalPlanId === GARDEN_PLANS.deep_garden;
      const plan = deepOpen ? "deep_garden" : "garden";
      await grantGardenMonth(user.id, plan, monthUntil(user));
      return { kind };
    }
    const reading = await startGiftReading(user.id);
    return { kind, transmissionId: reading.id };
  } catch (error) {
    await clearGiftRedeemed(token);
    throw error;
  }
}

export async function myGifts(
  userId: number
): Promise<Array<{ id: number; ringRank: number; kind: GiftKind | null; url: string | null; redeemed: boolean }>> {
  const gifts = await listGifts(userId);
  return gifts.map(g => ({
    id: g.id,
    ringRank: g.ringRank,
    kind: g.kind,
    url: g.token ? giftUrl(g.token) : null,
    redeemed: Boolean(g.redeemedAt),
  }));
}
