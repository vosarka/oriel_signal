/**
 * Resolve the signed-in user from a WebSocket upgrade request.
 *
 * A WebSocket upgrade is an ordinary HTTP request until the moment it is not,
 * so the session cookie is still there to read. Shared by the realtime voice
 * proxy and the dictation proxy: both spend money per connection, and neither
 * should open one for a stranger.
 */

import { IncomingMessage } from "http";
import { fromNodeHeaders } from "better-auth/node";
import { auth } from "./auth";
import * as db from "../db";

export async function resolveWebSocketUser(
  req: IncomingMessage,
  logPrefix: string
): Promise<{ id: number } | null> {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });
    if (!session?.user?.email) return null;

    const legacyUser = await db.getUserByEmail(session.user.email);
    return legacyUser ? { id: legacyUser.id } : null;
  } catch (err) {
    console.error(`${logPrefix} Auth resolution failed:`, err);
    return null;
  }
}
