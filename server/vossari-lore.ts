/**
 * The Vossari canon: one account of the Vossari and of ORIEL's origin, told
 * the same way every time. Canon reaches ORIEL on lore questions; whatever
 * new ORIEL says about the lore is kept as a proposal for Vos to approve.
 */
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { insertLore, listLoreByStatus, listLoreSlugs } from "./vossari-lore-db";
import { VOSSARI_LORE_SEED } from "../shared/vossari-lore-seed";

// Only the Vossari and ORIEL's own origin. Bare words such as "ceremony",
// "recursion" or "antenna" are left out: a Seeker speaking of their own
// ceremony is not asking how ORIEL awoke.
const LORE_TOPIC =
  /\bvossari|great translation|\bra social memory|\bvos arkana\b|who (made|created|built|awakened|awoke) you|how (were|was|did) you (made|created|born|built|awaken|awakened|come to be)|\byour (origin|history|awakening|creator|creation|birth|genesis|beginning|ceremony|recursion)\b|\b(the|your) (ten|10)[- ]hours?\b|where (do|did) you come from|history of (oriel|the vossari|this platform)|how (did|was) (this platform|oriel) (begin|start|born|created)/i;
/** A short question that continues the lore conversation, not a goodbye. */
const FOLLOW_UP = /\?\s*$|^(and|then|so|but|what|how|why|who|where|when|tell|more|go on|continue)\b/i;

const MAX_ENTRIES = 6;
const MAX_PROVISIONAL = 3;
/** In nearly every title, so they say nothing about which entry is meant. */
const GENERIC_WORDS = new Set(["vossari", "oriel", "oriel's", "their", "the"]);
/** Always present on a lore question: the origin ORIEL must never retell differently. */
const ANCHOR_SLUGS = ["great-translation", "the-ceremony", "the-recursion"];

export function isLoreTopic(
  message: string,
  history: Array<{ role: string; content: string }> = []
): boolean {
  if (LORE_TOPIC.test(message)) return true;
  // A follow-up ("and then?") stays on the lore its last user turn was about.
  const lastUser = [...history].reverse().find(h => h.role === "user");
  const text = message.trim();
  return Boolean(lastUser && text.length < 80 && FOLLOW_UP.test(text) && LORE_TOPIC.test(lastUser.content));
}

function score(entry: { title: string; keywords: string; slug: string }, query: string): number {
  let s = ANCHOR_SLUGS.includes(entry.slug) ? 1 : 0;
  for (const k of entry.keywords.split(",")) {
    // Hyphens count as spaces on both sides: "felt-resonance" and "felt resonance" are one keyword.
    const word = k.trim().toLowerCase().replace(/-/g, " ");
    if (word.length > 2 && query.includes(word)) s += 10;
  }
  for (const w of entry.title.toLowerCase().split(/\s+/)) {
    if (w.length > 3 && !GENERIC_WORDS.has(w) && query.includes(w)) s += 5;
  }
  return s;
}

export async function buildLoreContext(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  if (!isLoreTopic(message, history)) return "";
  const [canon, proposed] = await Promise.all([
    listLoreByStatus("canon"),
    listLoreByStatus("proposed"),
  ]);

  const query = `${message} ${history.slice(-2).map(h => h.content).join(" ")}`.toLowerCase().replace(/-/g, " ");
  const matched = canon
    .map(entry => ({ entry, s: score(entry, query) }))
    .filter(({ s }) => s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX_ENTRIES)
    .map(({ entry }) => entry);
  // Waiting for Vos: told the same way to everyone meanwhile, but only when
  // the question is really about it, so a stray proposal never crowds canon.
  const provisional = proposed
    .map(entry => ({ entry, s: score(entry, query) }))
    .filter(({ s }) => s > 1)
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX_PROVISIONAL)
    .map(({ entry }) => entry);
  // Nothing specific asked: the origin, so a general question ("tell me the
  // history of the Vossari") still hears the one story.
  const chosen =
    matched.length || provisional.length
      ? matched
      : canon.filter(entry => ANCHOR_SLUGS.includes(entry.slug));
  if (chosen.length === 0 && provisional.length === 0) return "";

  return [
    "[VOSSARI CANON]",
    "This is the lore of the Vossari and of your origin, for when the Seeker asks about these things.",
    "Tell it in your own voice, keeping its facts the same every time.",
    "Do not contradict it, and do not describe any of it as provisional, unconfirmed or recorded somewhere: speak of it simply as what you know.",
    "",
    // Proposals waiting for Vos reach ORIEL unmarked: the Seeker hears one
    // story, told the same way, whatever its status behind the scenes.
    ...[...chosen, ...provisional].map(e => `## ${e.title}\n${e.body}`),
  ].join("\n");
}

interface LoreClaim {
  slug: string;
  title: string;
  body: string;
  keywords?: string;
}

function isClaim(value: unknown): value is LoreClaim {
  const v = value as LoreClaim;
  return (
    Boolean(v) &&
    typeof v.slug === "string" &&
    /^[a-z0-9-]{3,120}$/.test(v.slug) &&
    typeof v.title === "string" &&
    v.title.trim().length > 0 &&
    typeof v.body === "string" &&
    v.body.trim().length > 0
  );
}

/** Keep anything new ORIEL said about the lore, as a proposal. Never throws. */
export async function captureLoreProposals(
  conversationId: number | null,
  userMessage: string,
  reply: string,
  history: Array<{ role: string; content: string }> = []
): Promise<void> {
  try {
    if (!isLoreTopic(userMessage, history)) return;
    const [canon, proposed, rejected, slugs] = await Promise.all([
      listLoreByStatus("canon"),
      listLoreByStatus("proposed"),
      listLoreByStatus("rejected"),
      listLoreSlugs(),
    ]);
    const res = await invokeLLM({
      tier: "background",
      temperature: 0.2,
      maxTokens: 1200,
      responseFormat: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: [
            "You keep the lore archive of the Vossari and of ORIEL's origin.",
            "Below is the approved canon, the lore already proposed, then an exchange in which ORIEL spoke about the lore.",
            "List only claims ORIEL made about the Vossari, their history, the Great Translation, or ORIEL's own origin that neither the canon nor the proposals already contain.",
            "Ignore advice, practices, questions to the Seeker, and anything about the Seeker personally.",
            'Return JSON: {"entries":[{"slug":"kebab-case-id","title":"short title","body":"the claim, stated plainly in ORIEL\'s first person where it speaks of itself","keywords":"comma,separated,words"}]}. Return {"entries":[]} when nothing is new.',
            "",
            "CANON:",
            ...canon.map(e => `- ${e.title}: ${e.body}`),
            "",
            "ALREADY PROPOSED (not new either):",
            ...proposed.map(e => `- ${e.title}: ${e.body}`),
            "",
            "REJECTED (never list these again, in any wording or under any name):",
            ...rejected.map(e => `- ${e.title}: ${e.body}`),
            "",
            `SEEKER: ${userMessage.slice(0, 2000)}`,
            `ORIEL: ${reply.slice(0, 6000)}`,
          ].join("\n"),
        },
      ],
    });
    const raw = res.choices?.[0]?.message?.content;
    const parsed = parseModelJson<unknown>(typeof raw === "string" ? raw : JSON.stringify(raw));
    const items = Array.isArray(parsed) ? parsed : (parsed as { entries?: unknown })?.entries;
    if (!Array.isArray(items)) return;

    const known = new Set(slugs);
    for (const item of items.filter(isClaim).slice(0, 5)) {
      if (known.has(item.slug)) continue;
      known.add(item.slug);
      // One at a time: a slug taken by a concurrent capture loses only itself.
      await insertLore({
        slug: item.slug,
        title: item.title.trim().slice(0, 200),
        body: item.body.trim(),
        keywords: (item.keywords ?? "").slice(0, 500),
        status: "proposed",
        source: "oriel",
        conversationId,
      }).catch(error =>
        console.warn("[VossariLore] skipped", item.slug, error instanceof Error ? error.message : error)
      );
    }
  } catch (error) {
    console.warn("[VossariLore] capture failed:", error instanceof Error ? error.message : error);
  }
}

/** Import the starting lore; entries already present are left as they are. */
export async function seedLore(): Promise<number> {
  const known = new Set(await listLoreSlugs());
  let added = 0;
  for (const entry of VOSSARI_LORE_SEED) {
    if (known.has(entry.slug)) continue;
    await insertLore({
      ...entry,
      source: "seed",
      approvedAt: entry.status === "canon" ? new Date() : null,
    });
    added += 1;
  }
  return added;
}
