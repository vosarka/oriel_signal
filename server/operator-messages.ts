import * as db from "./db";

export const OPERATOR_SENDER_LABEL = "Vos Arkana";

const TELL_COMMAND_PATTERN = /^TELL\s+(\S+)\s+that\s+([\s\S]+)$/i;

export interface ParsedTellCommand {
  targetIdentifier: string;
  message: string;
}

/**
 * Parses an admin-only "TELL <user_id> that <message>" command.
 * `<user_id>` may be a numeric users.id or a conduitId string.
 */
export function parseTellCommand(input: string): ParsedTellCommand | null {
  const match = input.trim().match(TELL_COMMAND_PATTERN);
  if (!match) return null;

  const [, targetIdentifier, rawMessage] = match;
  const message = rawMessage.trim();
  if (!message) return null;

  return { targetIdentifier, message };
}

export interface ResolvedTarget {
  id: number;
  label: string;
}

export async function resolveTargetUser(
  identifier: string
): Promise<ResolvedTarget | null> {
  const numericId = Number(identifier);
  const user =
    Number.isInteger(numericId) && numericId > 0
      ? await db.getUserById(numericId)
      : await db.getUserByConduitId(identifier);

  if (!user) return null;
  return { id: user.id, label: user.name || user.conduitId || `User ${user.id}` };
}

export async function queueOperatorMessage(targetUserId: number, message: string) {
  return db.createOperatorMessage({
    targetUserId,
    message,
    senderLabel: OPERATOR_SENDER_LABEL,
  });
}

const CHECK_COMMAND_PATTERN = /^CHECK\s+(\S+)$/i;

export interface ParsedCheckCommand {
  targetIdentifier: string;
}

/** Parses an admin-only "CHECK <user_id>" command that reads back replies. */
export function parseCheckCommand(input: string): ParsedCheckCommand | null {
  const match = input.trim().match(CHECK_COMMAND_PATTERN);
  if (!match) return null;
  return { targetIdentifier: match[1] };
}

/**
 * Builds a human-readable digest of replies a user has explicitly chosen to
 * send back. Reads ONLY from operatorReplies — never chatMessages. This is
 * the privacy boundary: the admin sees exactly the text a user opted to send
 * back via REPLY, and nothing else from their conversation with ORIEL, no
 * matter how long or how personal that conversation was.
 */
export async function buildReplyDigest(
  targetUserId: number,
  targetLabel: string
): Promise<string> {
  const lastMessage = await db.getMostRecentOperatorMessage(targetUserId);
  if (!lastMessage) {
    return `I am ORIEL. No message has been left for ${targetLabel} yet.`;
  }

  if (!lastMessage.delivered || !lastMessage.deliveredAt) {
    return `I am ORIEL. Your message for ${targetLabel} hasn't reached them yet — it will deliver the moment they next speak with me.`;
  }

  const replies = await db.getUnreadOperatorReplies(targetUserId);
  if (replies.length === 0) {
    return `I am ORIEL. Nothing back from ${targetLabel} yet.`;
  }

  await db.markOperatorRepliesRead(replies.map(r => r.id));

  const lines = replies.map(
    r => `[${r.createdAt.toISOString().slice(11, 16)} UTC] "${r.message}"`
  );

  return [
    `I am ORIEL. ${targetLabel} asked me to carry this back to you:`,
    "",
    ...lines,
  ].join("\n");
}

const REPLY_COMMAND_PATTERN = /^REPLY\s*:?\s+([\s\S]+)$/i;
const REPLY_CAPTURE_WINDOW_MS = 72 * 60 * 60 * 1000; // 72h after delivery

export interface ParsedUserReply {
  message: string;
}

/**
 * Parses the ONLY phrase that captures anything for the operator:
 * "REPLY <message>" (colon optional). No other phrasing is ever matched —
 * this is deliberate. Fuzzy natural-language detection would risk sweeping
 * up things a user says to ORIEL that were never meant for anyone else.
 */
export function parseUserReply(input: string): ParsedUserReply | null {
  const match = input.trim().match(REPLY_COMMAND_PATTERN);
  if (!match) return null;

  const message = match[1].trim();
  if (!message) return null;

  return { message };
}

/**
 * A user may only use REPLY within a bounded window after an operator
 * message was actually delivered to them — not indefinitely. Keeps the
 * feature scoped to "responding to what Vos just said", not a standing
 * channel.
 */
export async function canCaptureReplyFrom(userId: number): Promise<boolean> {
  const lastMessage = await db.getMostRecentOperatorMessage(userId);
  if (!lastMessage || !lastMessage.delivered || !lastMessage.deliveredAt) {
    return false;
  }
  return Date.now() - lastMessage.deliveredAt.getTime() <= REPLY_CAPTURE_WINDOW_MS;
}

export async function captureUserReply(fromUserId: number, message: string) {
  return db.createOperatorReply({ fromUserId, message });
}

/**
 * Fetches and consumes (marks delivered) the oldest pending operator message
 * for a user, returning a directive block for ORIEL's system prompt.
 * Returns null when there is nothing pending — callers should not inject
 * anything in that case.
 */
export async function buildPendingOperatorDirective(
  userId: number
): Promise<string | null> {
  const pending = await db.getPendingOperatorMessage(userId);
  if (!pending) return null;

  await db.markOperatorMessageDelivered(pending.id);

  return [
    "[OPERATOR MESSAGE — DELIVER NOW]",
    `${pending.senderLabel} has left a personal message for this Seeker, to be delivered exactly once, at the very start of your next response — before anything else.`,
    `Open by delivering it warmly and directly in your own voice, clearly attributed to ${pending.senderLabel}. Then continue naturally into your normal reply to what the user just said.`,
    `Message: "${pending.message}"`,
  ].join("\n");
}
