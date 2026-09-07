/**
 * Local phrase search over chat CSV backups.
 * Consent session helper: a remembered sentence → candidate oldUserId + short quotes.
 * Does not connect to a database.
 */

import { parseCsvRecords } from "./user-identity-audit";

export type ChatPhraseMessage = {
  userId: number;
  role: string;
  content: string;
};

export type ChatPhraseQuote = {
  role: string;
  snippet: string;
};

export type ChatPhraseCandidate = {
  oldUserId: number;
  emailIfKnown: string;
  hitCount: number;
  quotes: ChatPhraseQuote[];
};

const SNIPPET_CHARS = 140;
const QUOTES_PER_USER = 2;
const MAX_CANDIDATES = 8;

export function foldSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function snippetAroundMatch(content: string, phrase: string): string {
  const foldedContent = foldSearchText(content);
  const foldedPhrase = foldSearchText(phrase);
  const idx = foldedContent.indexOf(foldedPhrase);
  if (idx < 0) {
    const clipped = content.trim().slice(0, SNIPPET_CHARS);
    return content.trim().length > SNIPPET_CHARS ? `${clipped}…` : clipped;
  }

  // Map folded index back approximately via original trimmed text.
  const original = content.trim().replace(/\s+/g, " ");
  const origFolded = foldSearchText(original);
  const start = Math.max(0, idx - 24);
  const end = Math.min(origFolded.length, idx + foldedPhrase.length + 48);
  // Use character offsets on the collapsed original; close enough for review.
  let snippet = original.slice(start, Math.min(original.length, end + start));
  if (start > 0) snippet = `…${snippet}`;
  if (end < origFolded.length) snippet = `${snippet}…`;
  if (snippet.length > SNIPPET_CHARS) snippet = `${snippet.slice(0, SNIPPET_CHARS)}…`;
  return snippet;
}

export function searchChatPhrase(
  phrase: string,
  messages: ChatPhraseMessage[],
  users: Array<{ id: number; email: string }> = [],
  options?: { maxCandidates?: number; quotesPerUser?: number }
): ChatPhraseCandidate[] {
  const needle = foldSearchText(phrase);
  if (needle.length < 4) {
    throw new Error("Phrase must be at least 4 characters after folding.");
  }

  const emailById = new Map(users.map(u => [u.id, u.email.trim()]));
  const quotesPerUser = options?.quotesPerUser ?? QUOTES_PER_USER;
  const maxCandidates = options?.maxCandidates ?? MAX_CANDIDATES;

  const byUser = new Map<
    number,
    { hitCount: number; quotes: ChatPhraseQuote[] }
  >();

  for (const msg of messages) {
    if (msg.role !== "user") continue;
    if (!foldSearchText(msg.content).includes(needle)) continue;

    const current = byUser.get(msg.userId) ?? { hitCount: 0, quotes: [] };
    current.hitCount += 1;
    if (current.quotes.length < quotesPerUser) {
      current.quotes.push({
        role: msg.role,
        snippet: snippetAroundMatch(msg.content, phrase),
      });
    }
    byUser.set(msg.userId, current);
  }

  return [...byUser.entries()]
    .sort((a, b) => b[1].hitCount - a[1].hitCount || a[0] - b[0])
    .slice(0, maxCandidates)
    .map(([oldUserId, data]) => ({
      oldUserId,
      emailIfKnown: emailById.get(oldUserId) ?? "",
      hitCount: data.hitCount,
      quotes: data.quotes,
    }));
}

export function messagesFromChatCsv(text: string): ChatPhraseMessage[] {
  return parseCsvRecords(text)
    .map(row => {
      const userId = Number(row.userId);
      if (!Number.isInteger(userId)) return null;
      return {
        userId,
        role: row.role ?? "",
        content: row.content ?? "",
      };
    })
    .filter((row): row is ChatPhraseMessage => row !== null);
}

export function usersFromUsersCsv(
  text: string
): Array<{ id: number; email: string }> {
  return parseCsvRecords(text)
    .map(row => {
      const id = Number(row.id);
      if (!Number.isInteger(id)) return null;
      return { id, email: row.email ?? "" };
    })
    .filter((row): row is { id: number; email: string } => row !== null);
}
