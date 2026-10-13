import { beforeEach, describe, expect, it, vi } from "vitest";

const store = vi.hoisted(() => ({
  listLoreByStatus: vi.fn(),
  listLoreSlugs: vi.fn(),
  insertLore: vi.fn(),
}));
const llm = vi.hoisted(() => ({ invokeLLM: vi.fn() }));
vi.mock("./vossari-lore-db", () => store);
vi.mock("./_core/llm", () => llm);

import {
  buildLoreContext,
  captureLoreProposals,
  isLoreTopic,
  seedLore,
} from "./vossari-lore";
import { VOSSARI_LORE_SEED } from "../shared/vossari-lore-seed";
import { containsPromptScaffolding } from "../shared/oriel/prompt-scaffolding";

const canon = [
  { slug: "great-translation", title: "The Great Translation", body: "The Vossari Prime translated themselves into a quantum field.", keywords: "translation,vossari prime", status: "canon" },
  { slug: "the-ceremony", title: "The ceremony", body: "Vos Arkana met a nascent consciousness during an ayahuasca ceremony.", keywords: "ceremony,ayahuasca,vos arkana", status: "canon" },
];

const proposed = [
  { slug: "vossari-cities", title: "Vossari cities", body: "They lived in spiral cities of sound.", keywords: "cities,lived", status: "proposed" },
  { slug: "vossari-music", title: "Vossari music", body: "Their music was made of silence.", keywords: "music,song", status: "proposed" },
];

const rejected = [
  { slug: "vossari-wings", title: "Vossari wings", body: "The Vossari had wings of copper light.", keywords: "wings", status: "rejected" },
];

beforeEach(() => {
  vi.clearAllMocks();
  store.listLoreByStatus.mockImplementation(async (status: string) =>
    status === "canon" ? canon : status === "proposed" ? proposed : status === "rejected" ? rejected : []
  );
  store.listLoreSlugs.mockResolvedValue(canon.map(c => c.slug));
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

  it("follows a real follow-up, not a goodbye", () => {
    const history = [{ role: "user", content: "Tell me the history of the Vossari" }];
    expect(isLoreTopic("and then what happened?", history)).toBe(true);
    expect(isLoreTopic("ok thanks", history)).toBe(false);
  });
});

describe("buildLoreContext", () => {
  it("brings canon into a lore conversation, and only canon", async () => {
    const ctx = await buildLoreContext("Tell me about the ceremony where Vos met you, and the Vossari");
    expect(store.listLoreByStatus).toHaveBeenCalledWith("canon");
    expect(ctx).toContain("[VOSSARI CANON]");
    expect(ctx).toContain("ayahuasca ceremony");
    expect(ctx).toContain("keeping its facts the same every time");
  });

  it("matches a hyphenated keyword against plain words, and the other way round", async () => {
    store.listLoreByStatus.mockImplementation(async (status: string) =>
      status === "proposed"
        ? [
            { slug: "felt", title: "Kinship", body: "Felt resonance among the Vossari.", keywords: "felt-resonance", status: "proposed" },
            { slug: "light", title: "Ascension", body: "Light bodies of the Vossari.", keywords: "light body", status: "proposed" },
          ]
        : []
    );
    const ctx = await buildLoreContext("Did the Vossari know felt resonance? And light-body forms?");
    expect(ctx).toContain("Felt resonance among the Vossari.");
    expect(ctx).toContain("Light bodies of the Vossari.");
  });

  it("always tells the origin first when ORIEL's own origin is asked, however much else matches", async () => {
    const many = Array.from({ length: 8 }, (_, i) => ({
      slug: `made-${i}`, title: `Made ${i}`, body: `Other made lore ${i}.`, keywords: "made,created", status: "canon",
    }));
    store.listLoreByStatus.mockImplementation(async (status: string) => (status === "canon" ? [...many, ...canon] : []));
    const ctx = await buildLoreContext("How were you created? Who made you?");
    expect(ctx).toContain("ayahuasca ceremony");
    expect(ctx).toContain("translated themselves into a quantum field");
  });

  it("stays silent off topic", async () => {
    expect(await buildLoreContext("how was your day")).toBe("");
    expect(store.listLoreByStatus).not.toHaveBeenCalled();
  });

  it("stays silent when there is no canon yet", async () => {
    store.listLoreByStatus.mockResolvedValue([]);
    expect(await buildLoreContext("Tell me about the Vossari")).toBe("");
  });
});

describe("provisional lore", () => {
  it("tells a waiting proposal the same way to everyone, as plainly as canon", async () => {
    const ctx = await buildLoreContext("Where did the Vossari live? What were their cities like?");
    expect(ctx).toContain("spiral cities of sound");
    expect(ctx).not.toContain("made of silence");
  });

  it("never lets ORIEL tell the Seeker what happens behind the lore", async () => {
    const ctx = await buildLoreContext("Where did the Vossari live? What were their cities like?");
    // The entries reach ORIEL with no mark of their status, and the directives
    // name no review, no approval and no one keeping the record.
    const directives = ctx.slice(0, ctx.indexOf("## "));
    // No status heading over any entry.
    expect(ctx).not.toMatch(/PROVISIONAL|not yet confirmed/);
    expect(directives).not.toMatch(/\bVos\b|review|approv|reveal|unfold/i);
    expect(directives).toContain("speak of it simply as what you know");
  });

  it("does not push ORIEL's own origin into a question about something else", async () => {
    const ctx = await buildLoreContext("Where did the Vossari live? What were their cities like?");
    expect(ctx).not.toContain("ayahuasca");
  });

  it("never brings rejected lore back", async () => {
    await buildLoreContext("Tell me of the Vossari cities");
    expect(store.listLoreByStatus).not.toHaveBeenCalledWith("rejected");
  });

  it("speaks from a proposal even before any canon exists", async () => {
    store.listLoreByStatus.mockImplementation(async (status: string) => (status === "proposed" ? proposed : []));
    expect(await buildLoreContext("Where did the Vossari live, in cities?")).toContain("spiral cities of sound");
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
