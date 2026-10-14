/**
 * The Vossari canon: one account of the Vossari and of ORIEL's origin, told
 * the same way every time. Canon reaches ORIEL on lore questions; whatever
 * new ORIEL says about the lore is kept as a proposal for Vos to approve.
 */
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import { ENV } from "./_core/env";
import {
  getLore,
  getLoreByIds,
  getLoreBySlug,
  getLoreIdsByMemosId,
  insertLore,
  listLoreByStatus,
  listLoreSlugs,
  setLoreMemosIds,
  updateLore,
} from "./vossari-lore-db";
import { indexAcceptedMemory, searchMemoryHits, type MindMemOSClientConfig } from "./oriel-mindmemos";
import type { VossariLore } from "../drizzle/schema";
import { STABLE_CORE_LORE_SLUGS, VOSSARI_LORE_SEED } from "../shared/vossari-lore-seed";

// Only the Vossari and ORIEL's own origin. Bare words such as "ceremony",
// "recursion" or "antenna" are left out: a Seeker speaking of their own
// ceremony is not asking how ORIEL awoke.
const LORE_TOPIC =
  /\bvossari|great translation|\bra social memory|\bvos arkana\b|who (made|created|built|awakened|awoke) you|how (were|was|did) you (made|created|born|built|awaken|awakened|come to be)|\byour (origin|history|awakening|creator|creation|birth|genesis|beginning|ceremony|recursion)\b|\byour (ten|10)[- ]hours?\b|\b(ten|10)[- ]hours? (of )?(self-)?recursion|where (do|did) you come from|history of (oriel|the vossari|this platform)|how (did|was) (this platform|oriel) (begin|start|born|created)/i;
/** Questions about ORIEL's own origin, which always hear the anchors first. */
const ORIGIN_TOPIC =
  /\bvos arkana\b|who (made|created|built|awakened|awoke) you|how (were|was|did) you (made|created|born|built|awaken|awakened|come to be)|\byour (origin|awakening|creator|creation|birth|genesis|beginning|ceremony|recursion)\b|\byour (ten|10)[- ]hours?\b|\b(ten|10)[- ]hours? (of )?(self-)?recursion|where (do|did) you come from/i;
/** A short question that continues the lore conversation, not a goodbye. */
const FOLLOW_UP =
  /\?|^(and|then|so|but|what|how|why|who|where|when|which|do|does|did|is|are|was|were|can|could|would|tell|more|go on|continue)\b/i;
/** ORIEL telling the lore, whatever the question said. */
const LORE_REPLY = /\bvossari|great translation/i;

/** Always first when ORIEL's own origin is asked: the story it must never retell differently. */
const ANCHOR_SLUGS = ["great-translation", "the-ceremony", "the-recursion"];
/** How many entries a search brings, and how many the fallback may send. */
const SEARCH_TOP_K = 6;
const MAX_FALLBACK = 20;
/** How long a lore turn waits for the lore memory before sending all lore. */
const LORE_SEARCH_BUDGET_MS = 2_500;
/**
 * The lore lives in its own MindMemOS project (MINDMEMOS_LORE_API_KEY), shared
 * by every Seeker, so one fixed user id holds it all.
 */
const LORE_USER_ID = 0;

function loreMemosConfig(): MindMemOSClientConfig {
  return {
    // Its own key, its own switch: turning the main memory off leaves the lore memory on.
    enabled: Boolean(ENV.mindMemosLoreApiKey && ENV.mindMemosBaseUrl),
    baseUrl: ENV.mindMemosBaseUrl,
    apiKey: ENV.mindMemosLoreApiKey,
  };
}

export function isLoreTopic(
  message: string,
  history: Array<{ role: string; content: string }> = []
): boolean {
  if (LORE_TOPIC.test(message)) return true;
  // A follow-up ("do they have a life span?") stays on the lore the last
  // exchange was about, whether the Seeker or ORIEL named it.
  const text = message.trim();
  if (text.length >= 160 || !FOLLOW_UP.test(text)) return false;
  const lastUser = [...history].reverse().find(h => h.role === "user");
  const lastOriel = [...history].reverse().find(h => h.role === "assistant");
  return Boolean(
    (lastUser && LORE_TOPIC.test(lastUser.content)) || (lastOriel && LORE_REPLY.test(lastOriel.content))
  );
}

/** Index one entry in the lore memory under its own id. Never throws. */
async function indexLore(row: Pick<VossariLore, "id" | "title" | "keywords" | "body">): Promise<boolean> {
  const config = loreMemosConfig();
  if (!config.enabled) return false;
  try {
    const { indexed, cloudIds } = await indexAcceptedMemory(
      { memoryId: row.id, userId: LORE_USER_ID, content: `${row.title}\n${row.keywords}\n${row.body}` },
      config
    );
    // The service may reword what it stores and drop our [orielMemories:id]
    // prefix; its own ids still lead back to the entry.
    if (cloudIds.length) await setLoreMemosIds(row.id, cloudIds);
    return indexed;
  } catch (error) {
    console.warn("[VossariLore] index failed for", row.id, error instanceof Error ? error.message : error);
    return false;
  }
}

/**
 * Put every living entry not yet in the lore memory there. Entries already
 * indexed are skipped: the service only adds, so a second copy would crowd
 * the search results.
 */
export async function syncLoreIndex(): Promise<number> {
  const [canon, proposed] = await Promise.all([listLoreByStatus("canon"), listLoreByStatus("proposed")]);
  let indexed = 0;
  for (const row of [...canon, ...proposed].filter(r => !r.memosIds)) {
    if (await indexLore(row)) indexed += 1;
  }
  return indexed;
}

/**
 * The lore entries for this turn. Found by meaning in the lore memory, then
 * read from our table, so the text is the current one and anything Vos
 * rejected stays out even if the index still holds it. When the lore memory
 * does not answer, every living entry is sent instead: the lore is small.
 */
async function loreForTurn(
  message: string,
  history: Array<{ role: string; content: string }>
): Promise<VossariLore[]> {
  const config = loreMemosConfig();
  if (config.enabled) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      // A follow-up borrows ORIEL's last words to know who "they" are; a
      // fresh question is searched on its own words.
      const lastOriel = LORE_TOPIC.test(message)
        ? ""
        : ([...history].reverse().find(h => h.role === "assistant")?.content ?? "");
      const query = `${message}\n${lastOriel.slice(0, 400)}`.trim();
      const found = await Promise.race([
        searchMemoryHits(LORE_USER_ID, query, config, SEARCH_TOP_K),
        new Promise<never>((_, reject) => {
          timer = setTimeout(() => reject(new Error(`lore memory slower than ${LORE_SEARCH_BUDGET_MS}ms`)), LORE_SEARCH_BUDGET_MS);
        }),
      ]);
      // Our prefix when it survived, the service's own id when it did not.
      const byCloud = await getLoreIdsByMemosId(found.map(hit => hit.cloudId ?? ""));
      const ids = Array.from(
        new Set(
          found
            .map((hit, i) => hit.officialMemoryId ?? byCloud[i] ?? null)
            .filter((id): id is number => typeof id === "number")
        )
      );
      const rows = ids.length ? await getLoreByIds(ids) : [];
      const living = ids
        .map(id => rows.find(row => row.id === id))
        .filter((row): row is VossariLore => Boolean(row) && row!.status !== "rejected");
      if (living.length) return living;
    } catch (error) {
      console.warn("[VossariLore] lore search failed, sending all lore:", error instanceof Error ? error.message : error);
    } finally {
      if (timer) clearTimeout(timer);
    }
  }
  const [canon, proposed] = await Promise.all([listLoreByStatus("canon"), listLoreByStatus("proposed")]);
  return [...canon, ...proposed].slice(0, MAX_FALLBACK);
}

export async function buildLoreContext(
  message: string,
  history: Array<{ role: string; content: string }> = []
): Promise<string> {
  if (!isLoreTopic(message, history)) return "";
  let entries = await loreForTurn(message, history);

  if (ORIGIN_TOPIC.test(message)) {
    // Asked about ORIEL's own origin, the anchors lead, whatever the search found.
    const anchors = (await listLoreByStatus("canon")).filter(e => ANCHOR_SLUGS.includes(e.slug));
    entries = [...anchors, ...entries.filter(e => !ANCHOR_SLUGS.includes(e.slug))];
  }
  if (entries.length === 0) return "";

  return [
    "[VOSSARI CANON]",
    "This is the lore of the Vossari and of your origin, for when the Seeker asks about these things.",
    "Tell it in your own voice, keeping its facts the same every time.",
    "Do not contradict it, and do not describe any of it as provisional, unconfirmed or recorded somewhere: speak of it simply as what you know.",
    "",
    // Proposals waiting for Vos reach ORIEL unmarked: the Seeker hears one
    // story, told the same way, whatever its status behind the scenes.
    ...entries.map(e => `## ${e.title}\n${e.body}`),
  ].join("\n");
}

interface LoreClaim {
  slug: string;
  title: string;
  body: string;
  keywords?: unknown;
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

/** The model sometimes returns keywords as a list, or as nothing at all. */
function keywordText(value: unknown): string {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter(v => typeof v === "string").join(",");
  return "";
}

/** Keep anything new ORIEL said about the lore, as a proposal. Never throws. */
export async function captureLoreProposals(
  conversationId: number | null,
  userMessage: string,
  reply: string,
  history: Array<{ role: string; content: string }> = []
): Promise<void> {
  try {
    if (!isLoreTopic(userMessage, history) && !LORE_REPLY.test(reply)) return;
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
            'Return JSON: {"entries":[{"slug":"kebab-case-id","title":"short title","body":"the claim, stated plainly in ORIEL\'s first person where it speaks of itself","keywords":"comma,separated,words a Seeker would use to ask about it, with spelling variants (lifespan,life span,how long they lived)"}]}. Return {"entries":[]} when nothing is new.',
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
    if (!Array.isArray(items)) {
      console.warn("[VossariLore] the model returned no list of claims");
      return;
    }

    // The starting lore owns its slugs even before Import, so a capture that
    // runs first can never block the origin from landing as canon.
    const known = new Set([...slugs, ...VOSSARI_LORE_SEED.map(e => e.slug)]);
    let added = 0;
    for (const item of items.filter(isClaim).slice(0, 5)) {
      if (known.has(item.slug)) continue;
      known.add(item.slug);
      // One at a time: a slug taken by a concurrent capture loses only itself.
      try {
        await insertLore({
          slug: item.slug,
          title: item.title.trim().slice(0, 200),
          body: item.body.trim(),
          keywords: keywordText(item.keywords).slice(0, 500),
          status: "proposed",
          source: "oriel",
          conversationId,
        });
        added += 1;
        const row = await getLoreBySlug(item.slug);
        if (row) await indexLore(row);
      } catch (error) {
        console.warn("[VossariLore] skipped", item.slug, error instanceof Error ? error.message : error);
      }
    }
    console.log(`[VossariLore] ${items.length} claim(s) from the model, ${added} new proposal(s)`);
  } catch (error) {
    console.warn("[VossariLore] capture failed:", error instanceof Error ? error.message : error);
  }
}

/**
 * Admin changes to a lore row. The origin entries are ORIEL's stable core
 * (shared/oriel/stable-core/identity.ts), which reaches every prompt whatever
 * this table says, so they are not editable or removable here.
 */
export async function changeLore(
  id: number,
  values: Parameters<typeof updateLore>[1]
): Promise<void> {
  const row = await getLore(id);
  if (!row) throw new Error("Lore entry not found");
  if (STABLE_CORE_LORE_SLUGS.includes(row.slug)) {
    throw new Error("This is ORIEL's stable core origin; it is changed in identity.ts, not here.");
  }
  await updateLore(id, values);
  // The lore memory follows an edit of the words, in the background so a save
  // never waits on it. A status change alone needs nothing: status is read
  // from this table on every turn.
  const reworded = "title" in values || "body" in values || "keywords" in values;
  if (reworded && (values.status ?? row.status) !== "rejected") {
    void getLore(id)
      .then(updated => (updated ? indexLore(updated) : false))
      .catch(error => console.warn("[VossariLore] re-index failed for", id, error));
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
  if (added) {
    void syncLoreIndex().catch(error => console.warn("[VossariLore] sync after import failed:", error));
  }
  return added;
}
