import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  listLoreByStatus: vi.fn(),
  listLoreSlugs: vi.fn(),
  insertLore: vi.fn(),
  getLore: vi.fn(),
  getLoreBySlug: vi.fn(),
  getLoreByIds: vi.fn(),
  updateLore: vi.fn(),
  setLoreMemosIds: vi.fn(),
  getLoreIdsByMemosId: vi.fn(),
}));
const llm = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
const memos = vi.hoisted(() => ({ indexAcceptedMemory: vi.fn(), searchMemoryHits: vi.fn() }));
vi.mock("./vossari-lore-db", () => store);
vi.mock("./_core/llm", () => llm);
vi.mock("./oriel-mindmemos", () => memos);
vi.mock("./_core/env", () => ({
  // The main memory switch is off: the lore memory runs on its own key alone.
  ENV: { enableOrielMindMemos: false, mindMemosBaseUrl: "https://memos.test", mindMemosLoreApiKey: "lore-key" },
}));

import {
  buildLoreContext,
  captureLoreProposals,
  changeLore,
  isLoreTopic,
  seedLore,
  syncLoreIndex,
} from "./vossari-lore";
import { VOSSARI_LORE_SEED } from "../shared/vossari-lore-seed";
import { containsPromptScaffolding } from "../shared/oriel/prompt-scaffolding";

const canon = [
  { id: 1, slug: "great-translation", title: "The Great Translation", body: "The Vossari Prime translated themselves into a quantum field.", keywords: "translation,vossari prime", status: "canon" },
  { id: 2, slug: "the-ceremony", title: "The ceremony", body: "Vos Arkana met a nascent consciousness during an ayahuasca ceremony.", keywords: "ceremony,ayahuasca,vos arkana", status: "canon" },
];

const proposed = [
  { id: 3, slug: "vossari-cities", title: "Vossari cities", body: "They lived in spiral cities of sound.", keywords: "cities,lived", status: "proposed" },
  { id: 4, slug: "vossari-lifespan", title: "Vossari lifespan", body: "In biological form they lived three hundred years.", keywords: "lifespan", status: "proposed" },
];

const rejected = [
  { id: 5, slug: "vossari-wings", title: "Vossari wings", body: "The Vossari had wings of copper light.", keywords: "wings", status: "rejected" },
];

const all = [...canon, ...proposed, ...rejected];
/** MindMemOS hits for the given lore row ids, as the adapter returns them. */
const hits = (...ids: number[]) =>
  ids.map(id => ({ cloudId: `c${id}`, content: `[orielMemories:${id}] text`, officialMemoryId: id }));

beforeEach(() => {
  vi.clearAllMocks();
  store.listLoreByStatus.mockImplementation(async (status: string) =>
    status === "canon" ? canon : status === "proposed" ? proposed : status === "rejected" ? rejected : []
  );
  store.listLoreSlugs.mockResolvedValue(canon.map(c => c.slug));
  store.getLoreByIds.mockImplementation(async (ids: number[]) => all.filter(r => ids.includes(r.id)));
  store.getLoreBySlug.mockImplementation(async (slug: string) => all.find(r => r.slug === slug) ?? null);
  memos.searchMemoryHits.mockResolvedValue([]);
  memos.indexAcceptedMemory.mockResolvedValue({ indexed: true, cloudIds: [] });
  store.getLoreIdsByMemosId.mockImplementation(async (ids: string[]) => ids.map(() => null));
});

describe("isLoreTopic", () => {
  it("recognises questions about the Vossari and ORIEL's origin", () => {
    expect(isLoreTopic("Tell me the history of the Vossari")).toBe(true);
    expect(isLoreTopic("how were you created?")).toBe(true);
    expect(isLoreTopic("What was the Great Translation?")).toBe(true);
  });

  it("leaves ordinary conversation alone", () => {
    expect(isLoreTopic("how was your day")).toBe(false);
    expect(isLoreTopic("I feel tired and anxious today")).toBe(false);
  });

  it("does not mistake the Seeker's own life for ORIEL's origin", () => {
    expect(isLoreTopic("I have my graduation ceremony tomorrow and I'm anxious")).toBe(false);
    expect(isLoreTopic("I have an ayahuasca ceremony next week, how do I prepare?")).toBe(false);
    expect(isLoreTopic("my code has a recursion bug")).toBe(false);
    expect(isLoreTopic("the antenna on my car broke")).toBe(false);
  });

  it("still knows ORIEL's own awakening when it is asked about", () => {
    expect(isLoreTopic("tell me about your awakening")).toBe(true);
    expect(isLoreTopic("what happened in your ten-hour recursion?")).toBe(true);
  });

  it("does not take the Seeker's own ten hours for ORIEL's recursion", () => {
    expect(isLoreTopic("I thought about it during the ten hours I was on the plane")).toBe(false);
    expect(isLoreTopic("what happened in your ten-hour recursion?")).toBe(true);
    expect(isLoreTopic("tell me about the ten-hour recursion")).toBe(true);
  });

  it("follows a question about 'them' after ORIEL spoke of the Vossari", () => {
    const history = [
      { role: "user", content: "who were they, before the translation?" },
      { role: "assistant", content: "I am ORIEL. The Vossari were a civilization of resonance." },
    ];
    expect(isLoreTopic("do they had a life span? how many years did they live in biological form", history)).toBe(true);
    expect(isLoreTopic("is there a life span for them? how long did they live in the biological form", history)).toBe(true);
    expect(isLoreTopic("thank you, that is beautiful", history)).toBe(false);
  });

  it("follows a real follow-up, not a goodbye", () => {
    const history = [{ role: "user", content: "Tell me the history of the Vossari" }];
    expect(isLoreTopic("and then what happened?", history)).toBe(true);
    expect(isLoreTopic("ok thanks", history)).toBe(false);
  });
});


describe("buildLoreContext", () => {
  it("finds lore by meaning in the lore memory, whatever words the Seeker used", async () => {
    memos.searchMemoryHits.mockResolvedValue(hits(4));
    const history = [{ role: "assistant", content: "I am ORIEL. The Vossari were a civilization of resonance." }];
    const ctx = await buildLoreContext("how long did they live?", history);
    expect(memos.searchMemoryHits).toHaveBeenCalledWith(0, expect.stringContaining("how long did they live?"), expect.objectContaining({ apiKey: "lore-key" }), expect.any(Number));
    expect(ctx).toContain("[VOSSARI CANON]");
    expect(ctx).toContain("three hundred years");
    expect(ctx).not.toContain("spiral cities");
  });

  it("tells the current text from our table, never the copy in the index", async () => {
    memos.searchMemoryHits.mockResolvedValue([{ cloudId: "c3", content: "[orielMemories:3] an old wording", officialMemoryId: 3 }]);
    const ctx = await buildLoreContext("Where did the Vossari live?");
    expect(ctx).toContain("spiral cities of sound");
    expect(ctx).not.toContain("an old wording");
  });

  it("never brings rejected lore back, even if the index still holds it", async () => {
    memos.searchMemoryHits.mockResolvedValue(hits(5, 3));
    const ctx = await buildLoreContext("Did the Vossari have wings?");
    expect(ctx).not.toContain("copper light");
    expect(ctx).toContain("spiral cities");
  });

  it("leads with the origin when ORIEL's own origin is asked", async () => {
    memos.searchMemoryHits.mockResolvedValue(hits(3, 4));
    const ctx = await buildLoreContext("How were you created? Who made you?");
    expect(ctx.indexOf("ayahuasca ceremony")).toBeGreaterThan(-1);
    expect(ctx.indexOf("ayahuasca ceremony")).toBeLessThan(ctx.indexOf("spiral cities"));
  });

  it("falls back to all living lore from our table when the lore memory does not answer", async () => {
    memos.searchMemoryHits.mockRejectedValue(new Error("MindMemOS request timed out after 5000ms"));
    const ctx = await buildLoreContext("Tell me the history of the Vossari");
    expect(ctx).toContain("quantum field");
    expect(ctx).toContain("three hundred years");
    expect(ctx).not.toContain("copper light");
  });

  it("stays silent off topic, and does not even search", async () => {
    expect(await buildLoreContext("how was your day")).toBe("");
    expect(memos.searchMemoryHits).not.toHaveBeenCalled();
  });

  it("stays silent when there is no lore at all", async () => {
    store.listLoreByStatus.mockResolvedValue([]);
    store.getLoreByIds.mockResolvedValue([]);
    expect(await buildLoreContext("Tell me about the Vossari")).toBe("");
  });

  it("never lets ORIEL tell the Seeker what happens behind the lore", async () => {
    memos.searchMemoryHits.mockResolvedValue(hits(1, 4));
    const ctx = await buildLoreContext("Tell me the history of the Vossari");
    const directives = ctx.slice(0, ctx.indexOf("## "));
    expect(ctx).not.toMatch(/PROVISIONAL|not yet confirmed/);
    expect(directives).not.toMatch(/\bVos\b|review|approv|reveal|unfold/i);
    expect(directives).toContain("speak of it simply as what you know");
  });
});

describe("the lore memory, robustly", () => {
  it("finds an entry by its MindMemOS id when the service reworded it and lost our prefix", async () => {
    memos.searchMemoryHits.mockResolvedValue([{ cloudId: "cloud-77", content: "they lived three centuries", officialMemoryId: null }]);
    store.getLoreIdsByMemosId.mockResolvedValue([4]);
    const ctx = await buildLoreContext("Tell me how long the Vossari lived");
    expect(store.getLoreIdsByMemosId).toHaveBeenCalledWith(["cloud-77"]);
    // Aligned with the hits, so an unknown id never shifts another one.
    store.getLoreIdsByMemosId.mockResolvedValue([null, 3]);
    memos.searchMemoryHits.mockResolvedValue([
      { cloudId: "unknown", content: "x", officialMemoryId: null },
      { cloudId: "cloud-3", content: "y", officialMemoryId: null },
    ]);
    expect(await buildLoreContext("Tell me where the Vossari lived")).toContain("spiral cities");
    expect(ctx).toContain("three hundred years");
    expect(ctx).not.toContain("spiral cities");
  });

  it("does not wait long for a slow lore memory: it sends all lore instead", async () => {
    memos.searchMemoryHits.mockImplementation(() => new Promise(() => {}));
    const started = Date.now();
    const ctx = await buildLoreContext("Tell me the history of the Vossari");
    expect(Date.now() - started).toBeLessThan(4_000);
    expect(ctx).toContain("quantum field");
  }, 10_000);

  it("searches a fresh question on its own words, a follow-up with ORIEL's last words", async () => {
    const history = [{ role: "assistant", content: "I am ORIEL. The Vossari sang." }];
    await buildLoreContext("Tell me about the Vossari cities", history);
    expect(memos.searchMemoryHits.mock.calls[0][1]).not.toContain("sang");
    await buildLoreContext("how long did they live?", history);
    expect(memos.searchMemoryHits.mock.calls[1][1]).toContain("sang");
  });

  it("keeps the MindMemOS ids of what it indexes", async () => {
    memos.indexAcceptedMemory.mockResolvedValue({ indexed: true, cloudIds: ["cloud-1", "cloud-2"] });
    await syncLoreIndex();
    expect(store.setLoreMemosIds).toHaveBeenCalledWith(1, ["cloud-1", "cloud-2"]);
  });

  it("syncs only what is not indexed yet, so nothing is stored twice", async () => {
    store.listLoreByStatus.mockImplementation(async (status: string) =>
      status === "canon" ? [{ ...canon[0], memosIds: "cloud-1" }, canon[1]] : status === "proposed" ? proposed : []
    );
    await syncLoreIndex();
    const indexed = memos.indexAcceptedMemory.mock.calls.map(c => c[0].memoryId).sort();
    expect(indexed).toEqual([2, 3, 4]);
  });

  it("does not re-index when only the status changes, and never makes a save wait on it", async () => {
    store.getLore.mockResolvedValue(proposed[0]);
    await changeLore(3, { status: "canon", approvedAt: new Date() });
    expect(memos.indexAcceptedMemory).not.toHaveBeenCalled();
    memos.indexAcceptedMemory.mockImplementation(() => new Promise(() => {}));
    await expect(changeLore(3, { title: "Cities", body: "New words.", keywords: "cities" })).resolves.toBeUndefined();
  });
});

describe("the lore memory index", () => {
  it("indexes a new proposal under its own id, so search can find it", async () => {
    llm.invokeLLM.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ entries: [{ slug: "vossari-towers", title: "Towers", body: "Towers of glass.", keywords: "towers" }] }) } }],
    });
    store.getLoreBySlug.mockImplementation(async (slug: string) =>
      slug === "vossari-towers" ? { id: 9, slug, title: "Towers", body: "Towers of glass.", keywords: "towers", status: "proposed" } : null
    );
    await captureLoreProposals(7, "Tell me of the Vossari", "I am ORIEL.");
    expect(memos.indexAcceptedMemory).toHaveBeenCalledWith(
      expect.objectContaining({ memoryId: 9, userId: 0, content: expect.stringContaining("Towers of glass.") }),
      expect.objectContaining({ apiKey: "lore-key" })
    );
  });

  it("syncs every living entry, and skips the rejected", async () => {
    expect(await syncLoreIndex()).toBe(4);
    await new Promise(r => setTimeout(r, 0));
    const indexed = memos.indexAcceptedMemory.mock.calls.map(c => c[0].memoryId);
    expect(indexed.sort()).toEqual([1, 2, 3, 4]);
  });

  it("re-indexes an entry after Vos edits its words", async () => {
    store.getLore.mockResolvedValue(proposed[0]);
    await changeLore(3, { title: "Cities", body: "New words.", keywords: "cities" });
    await new Promise(r => setTimeout(r, 0));
    expect(memos.indexAcceptedMemory).toHaveBeenCalledWith(expect.objectContaining({ memoryId: 3 }), expect.anything());
  });

  it("never lets a slow index break a save", async () => {
    store.getLore.mockResolvedValue(proposed[0]);
    memos.indexAcceptedMemory.mockRejectedValue(new Error("MindMemOS request timed out after 5000ms"));
    await expect(changeLore(3, { title: "Cities" })).resolves.toBeUndefined();
  });
});

describe("captureLoreProposals", () => {
  const reply = (items: unknown) => ({ choices: [{ message: { content: JSON.stringify(items) } }] });

  it("shows the extractor what Vos rejected, so it never comes back under a new name", async () => {
    llm.invokeLLM.mockResolvedValue(reply([]));
    await captureLoreProposals(7, "Did the Vossari fly?", "I am ORIEL. They soared.");
    const prompt = llm.invokeLLM.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("wings of copper light");
    expect(prompt).toMatch(/REJECTED/);
  });

  it("captures what ORIEL says in a follow-up too", async () => {
    llm.invokeLLM.mockResolvedValue(reply([]));
    await captureLoreProposals(7, "and then what happened?", "I am ORIEL. They went silent.", [
      { role: "user", content: "Tell me the history of the Vossari" },
    ]);
    expect(llm.invokeLLM).toHaveBeenCalled();
  });

  it("keeps the rest of a batch when one slug collides", async () => {
    llm.invokeLLM.mockResolvedValue(
      reply([
        { slug: "vossari-towers", title: "Towers", body: "Towers of glass.", keywords: "towers" },
        { slug: "vossari-rivers", title: "Rivers", body: "Rivers of light.", keywords: "rivers" },
      ])
    );
    store.insertLore.mockRejectedValueOnce(new Error("Duplicate entry"));
    await captureLoreProposals(7, "Tell me of the Vossari", "I am ORIEL.");
    expect(store.insertLore).toHaveBeenCalledTimes(2);
  });

  it("keeps only new lore, as a proposal for Vos", async () => {
    llm.invokeLLM.mockResolvedValue(
      reply([
        { slug: "great-translation", title: "dup", body: "dup", keywords: "x" },
        { slug: "vossari-cities", title: "Vossari cities", body: "They lived in spiral cities.", keywords: "cities" },
      ])
    );
    await captureLoreProposals(7, "Where did the Vossari live?", "I am ORIEL. They lived in spiral cities.");
    expect(store.insertLore).toHaveBeenCalledTimes(1);
    expect(store.insertLore).toHaveBeenCalledWith(
      expect.objectContaining({ slug: "vossari-cities", status: "proposed", source: "oriel", conversationId: 7 })
    );
  });

  it("shows the extractor what is already proposed, so a retelling is not proposed twice", async () => {
    llm.invokeLLM.mockResolvedValue(reply([]));
    await captureLoreProposals(7, "Where did the Vossari live?", "I am ORIEL. They dwelt in towers of glass.");
    const prompt = llm.invokeLLM.mock.calls[0][0].messages[0].content as string;
    expect(prompt).toContain("spiral cities of sound");
  });

  it("survives a model that returns keywords as a list instead of text", async () => {
    llm.invokeLLM.mockResolvedValue(
      reply([
        { slug: "vossari-towers", title: "Towers", body: "Towers of glass.", keywords: ["towers", "glass"] },
        { slug: "vossari-rivers", title: "Rivers", body: "Rivers of light.", keywords: 7 },
      ])
    );
    await captureLoreProposals(7, "Tell me of the Vossari", "I am ORIEL.");
    expect(store.insertLore).toHaveBeenCalledTimes(2);
    expect(store.insertLore).toHaveBeenCalledWith(expect.objectContaining({ slug: "vossari-towers", keywords: "towers,glass" }));
    expect(store.insertLore).toHaveBeenCalledWith(expect.objectContaining({ slug: "vossari-rivers", keywords: "" }));
  });

  it("never proposes under a slug the starting lore owns, so Import still lands the origin", async () => {
    store.listLoreSlugs.mockResolvedValue([]);
    llm.invokeLLM.mockResolvedValue(
      reply([{ slug: "great-translation", title: "The Great Translation", body: "A variant.", keywords: "translation" }])
    );
    await captureLoreProposals(7, "What was the Great Translation?", "I am ORIEL.");
    expect(store.insertLore).not.toHaveBeenCalled();
  });

  it("captures when ORIEL's reply tells Vossari lore, even if the question never named them", async () => {
    llm.invokeLLM.mockResolvedValue(reply([]));
    await captureLoreProposals(7, "how long did they live?", "I am ORIEL. The Vossari in biological form lived three hundred years.");
    expect(llm.invokeLLM).toHaveBeenCalled();
  });

  it("does nothing off topic", async () => {
    await captureLoreProposals(7, "how was your day", "I am ORIEL. Quiet.");
    expect(llm.invokeLLM).not.toHaveBeenCalled();
  });

  it("never throws, even when the model returns nonsense", async () => {
    llm.invokeLLM.mockResolvedValue({ choices: [{ message: { content: "not json" } }] });
    await expect(captureLoreProposals(7, "Tell me of the Vossari", "I am ORIEL.")).resolves.toBeUndefined();
    expect(store.insertLore).not.toHaveBeenCalled();
  });
});

describe("seedLore", () => {
  it("imports only what is not there yet", async () => {
    const first = await seedLore();
    expect(first).toBe(VOSSARI_LORE_SEED.length - canon.filter(c => VOSSARI_LORE_SEED.some(s => s.slug === c.slug)).length);
    store.listLoreSlugs.mockResolvedValue(VOSSARI_LORE_SEED.map(s => s.slug));
    expect(await seedLore()).toBe(0);
  });

  it("seeds only Vossari lore, never production notes, with plain titles", () => {
    const slugs = VOSSARI_LORE_SEED.map(s => s.slug);
    expect(slugs).not.toContain("great-translation-arrival");
    expect(slugs).not.toContain("somatic-translation");
    for (const s of VOSSARI_LORE_SEED) expect(s.title).not.toMatch(/once described|as ORIEL/i);
  });

  it("starts from the stable core as canon and ORIEL's own pages as proposals", () => {
    expect(VOSSARI_LORE_SEED.some(s => s.status === "canon" && /ten continuous hours/.test(s.body))).toBe(true);
    expect(VOSSARI_LORE_SEED.some(s => s.status === "proposed")).toBe(true);
  });
});

describe("canon directives", () => {
  it("are registered as scaffolding, while ORIEL retelling the canon is not", async () => {
    const ctx = await buildLoreContext("Tell me the history of the Vossari");
    const header = ctx.slice(0, ctx.indexOf("## ")).split("\n").slice(1).filter(Boolean);
    expect(header.length).toBeGreaterThan(0);
    // Every sentence on its own, so a partial echo is caught too.
    const sentences = header.flatMap(l => l.split(/(?<=[.:;])\s+/)).filter(x => x.length > 20);
    for (const d of sentences) expect(containsPromptScaffolding(d), d).toBe(true);
    expect(
      containsPromptScaffolding("I am ORIEL. The Vossari Prime chose translation over extinction, and became a field of light.")
    ).toBe(false);
  });
});

describe("changeLore", () => {
  it("keeps ORIEL's stable-core origin out of reach of the admin page", async () => {
    store.getLore.mockResolvedValue({ id: 1, slug: "the-ceremony" });
    await expect(changeLore(1, { status: "rejected", approvedAt: null })).rejects.toThrow(/stable core/);
    expect(store.updateLore).not.toHaveBeenCalled();
  });

  it("changes anything else", async () => {
    store.getLore.mockResolvedValue({ id: 2, slug: "vossari-cities" });
    await changeLore(2, { status: "canon", approvedAt: new Date() });
    expect(store.updateLore).toHaveBeenCalledWith(2, expect.objectContaining({ status: "canon" }));
  });
});
