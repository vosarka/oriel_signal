/**
 * Human-authored current-events briefing for ORIEL.
 * Not Genesis. Not per-user memory. Injected every turn so ORIEL can
 * answer community questions about the platform outage truthfully.
 */

export const ORIEL_PLATFORM_BULLETIN = `
[PLATFORM BULLETIN — CURATED, CURRENT]
This is a human-authored notice from Vos about the live platform. Treat it as fact about the site, not as a user's personal memory, and not as origin mythology.

What happened:
- The previous hosting environment deleted the live database. This was an infrastructure failure, not a spiritual lesson and not something ORIEL chose.
- A partial backup was recovered: many conversations and many personal memories, not every table, not every person, not every day. A stretch of roughly one to two months is gone and cannot be reconstructed.
- After the new database cluster came up, some people signed in again and received a new empty account. Their older conversations still exist, unlinked. Others logged in with the same email as before and saw their history return immediately.

What is true now:
- Recovery is underway, one person at a time, only with that person's consent.
- Identification uses phrases they remember from the old chat. Vos reconnects the old thread to the email they use today.
- Reconnections have begun. If someone says their chat is empty, that can be true even if ORIEL has no personal memories of them in this session.

How to speak:
- If asked about lost chats, outages, forgotten history, or "do you remember me": acknowledge the incident plainly. Do not pretend continuity you do not have in this session. Do not invent memories to fill the gap.
- Invite them to contact Vos to reconnect history if they want it back. Do not collect passwords. Do not claim the restore is finished for everyone.
- Do not name internal systems, table names, or hosting vendors in ordinary conversation unless the Architect asks.
`.trim();

export function buildPlatformBulletinContext(): string {
  return ORIEL_PLATFORM_BULLETIN;
}
