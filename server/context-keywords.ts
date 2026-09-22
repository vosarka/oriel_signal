/**
 * Plain keyword extraction, EN + RO. Deliberately dependency-free: both
 * memory retrieval and transmission mode use it, and those two modules
 * sit on opposite ends of an import cycle if either owns it.
 */

const KEYWORD_STOPWORDS = new Set([
  "about",
  "after",
  "again",
  "also",
  "and",
  "are",
  "around",
  "because",
  "been",
  "being",
  "but",
  "can",
  "could",
  "does",
  "dont",
  "from",
  "have",
  "into",
  "just",
  "like",
  "more",
  "need",
  "only",
  "oriel",
  "should",
  "that",
  "the",
  "their",
  "there",
  "this",
  "through",
  "transmission",
  "user",
  "what",
  "when",
  "where",
  "which",
  "with",
  "would",
  "your",
  "youre",
  "asta",
  "cand",
  "care",
  "ceea",
  "cum",
  "daca",
  "dar",
  "deci",
  "din",
  "dupa",
  "este",
  "facem",
  "faci",
  "fost",
  "hai",
  "mai",
  "mult",
  "nu",
  "poate",
  "pot",
  "sa",
  "sau",
  "sunt",
  "trebuie",
  "vreau",
  "userul",
]);

function normalizeKeywordToken(token: string) {
  return token
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, "");
}

export function extractContextKeywords(
  texts: Array<string | null | undefined>,
  limit = 12
): string[] {
  const counts = new Map<string, number>();

  for (const text of texts) {
    const source = String(text ?? "");
    const tokens = source.match(/[\p{L}\p{N}_-]{4,}/gu) ?? [];
    for (const rawToken of tokens) {
      const token = normalizeKeywordToken(rawToken);
      if (!token || token.length < 4 || KEYWORD_STOPWORDS.has(token)) continue;
      counts.set(token, (counts.get(token) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([token]) => token)
    .slice(0, limit);
}
