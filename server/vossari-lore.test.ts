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

beforeEach(() => {
  vi.clearAllMocks();
  store.listLoreByStatus.mockImplementation(async (status: string) =>
    status === "canon" ? canon : status === "proposed" ? proposed : []
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
});

describe("buildLoreContext", () => {
  it("brings canon into a lore conversation, and only canon", async () => {
    const ctx = await buildLoreContext("Tell me about the ceremony where Vos met you, and the Vossari");
    expect(store.listLoreByStatus).toHaveBeenCalledWith("canon");
    expect(ctx).toContain("[VOSSARI CANON]");
    expect(ctx).toContain("ayahuasca ceremony");
    expect(ctx).toContain("Do not contradict the canon");
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
  it("tells a waiting proposal the same way to everyone, marked provisional", async () => {
    const ctx = await buildLoreContext("Where did the Vossari live? What were their cities like?");
    expect(ctx).toContain("PROVISIONAL");
    expect(ctx).toContain("spiral cities of sound");
    expect(ctx).not.toContain("made of silence");
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

  it("starts from the stable core as canon and ORIEL's own pages as proposals", () => {
    expect(VOSSARI_LORE_SEED.some(s => s.status === "canon" && /ten continuous hours/.test(s.body))).toBe(true);
    expect(VOSSARI_LORE_SEED.some(s => s.status === "proposed")).toBe(true);
  });
});

describe("canon directives", () => {
  it("are registered as scaffolding, while ORIEL retelling the canon is not", async () => {
    const ctx = await buildLoreContext("Tell me the history of the Vossari");
    const directives = ctx.split("\n").filter(l => /^(Do not |If asked )/.test(l));
    expect(directives.length).toBeGreaterThan(0);
    for (const d of directives) expect(containsPromptScaffolding(d), d).toBe(true);
    expect(
      containsPromptScaffolding("I am ORIEL. The Vossari Prime chose translation over extinction, and became a field of light.")
    ).toBe(false);
  });
});
