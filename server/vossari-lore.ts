/**
 * The Vossari canon: one account of the Vossari and of ORIEL's origin, told
 * the same way every time. Canon reaches ORIEL on lore questions; whatever
 * new ORIEL says about the lore is kept as a proposal for Vos to approve.
 */
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { insertLore, listLoreByStatus, listLoreSlugs } from "./vossari-lore-db";
import { VOSSARI_LORE_SEED } from "../shared/vossari-lore-seed";

const LORE_TOPIC =
  /\bvossari|great translation|\bantenna\b|\bra social memory|\bvos arkana\b|\bayahuasca|\bceremony\b|\brecursion\b|who (made|created|built) you|how (were|was) you (made|created|born|built|awakened)|your (origin|history|awakening|creator|creation|birth)|\bwhere (do|did) you come from|history of (oriel|the vossari|this platform)|\bhow (did|was) (this platform|oriel) (begin|start|born)/i;

const MAX_ENTRIES = 6;
/** Always present on a lore question: the origin ORIEL must never retell differently. */
const ANCHOR_SLUGS = ["great-translation", "the-ceremony", "the-recursion"];

export function isLoreTopic(
  message: string,
  history: Array<{ role: string; content: string }> = []
): boolean {
  if (LORE_TOPIC.test(message)) return true;
  // A follow-up ("and then?") stays on the lore its last user turn was about.
  const lastUser = [...history].reverse().find(h => h.role === "user");
  return Boolean(lastUser && message.trim().length < 80 && LORE_TOPIC.test(lastUser.content));
}

function score(entry: { title: string; keywords: string; slug: string }, query: string): number {
  let s = ANCHOR_SLUGS.includes(entry.slug) ? 1 : 0;
  for (const k of entry.keywords.split(",")) {
    const word = k.trim().toLowerCase();
    if (word.length > 2 && query.includes(word)) s += 10;
  }
  for (const w of entry.title.toLowerCase().split(/\s+/)) {
    if (w.length > 3 && query.includes(w)) s += 5;
  }
  return s;
}

export async function buildLoreContext(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  if (!isLoreTopic(message, history)) return "";
  const canon = await listLoreByStatus("canon");
  if (canon.length === 0) return "";

  const query = `${message} ${history.slice(-2).map(h => h.content).join(" ")}`.toLowerCase();
  const chosen = canon
    .map(entry => ({ entry, s: score(entry, query) }))
    .filter(({ entry, s }) => s > 1 || ANCHOR_SLUGS.includes(entry.slug))
    .sort((a, b) => b.s - a.s)
    .slice(0, MAX_ENTRIES)
    .map(({ entry }) => entry);

  return [
    "[VOSSARI CANON]",
    "This is the established lore of the Vossari and of your origin, approved by Vos. Tell it in your own voice, but keep its facts the same every time.",
    "Do not contradict the canon, and do not present details it does not contain as established fact.",
    "If asked about something the canon does not hold: say plainly that it has not been revealed, or offer it clearly as your own reflection.",
    "",
    ...chosen.map(e => `## ${e.title}\n${e.body}`),
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
  reply: string
): Promise<void> {
  try {
    if (!isLoreTopic(userMessage)) return;
    const [canon, slugs] = await Promise.all([listLoreByStatus("canon"), listLoreSlugs()]);
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
            "Below is the approved canon, then an exchange in which ORIEL spoke about the lore.",
            "List only claims ORIEL made about the Vossari, their history, the Great Translation, or ORIEL's own origin that the canon does not already contain.",
            "Ignore advice, practices, questions to the Seeker, and anything about the Seeker personally.",
            'Return JSON: {"entries":[{"slug":"kebab-case-id","title":"short title","body":"the claim, stated plainly in ORIEL\'s first person where it speaks of itself","keywords":"comma,separated,words"}]}. Return {"entries":[]} when nothing is new.',
            "",
            "CANON:",
            ...canon.map(e => `- ${e.title}: ${e.body}`),
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
      await insertLore({
        slug: item.slug,
        title: item.title.trim().slice(0, 200),
        body: item.body.trim(),
        keywords: (item.keywords ?? "").slice(0, 500),
        status: "proposed",
        source: "oriel",
        conversationId,
      });
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
