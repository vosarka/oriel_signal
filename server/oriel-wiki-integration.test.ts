import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "node:fs/promises";
import path from "node:path";
import { parseFrontmatter, retrieveWikiContext } from "./oriel-wiki-retriever";
import { evolveWikiFromConversation } from "./oriel-wiki-evolution";
import { invokeLLM } from "./_core/llm";

const envMock = vi.hoisted(() => ({ enableOrielWikiEvolution: false }));

vi.mock("node:fs/promises");
vi.mock("./_core/llm");
vi.mock("./_core/env", () => ({ ENV: envMock }));

/** Make the LLM propose a single wiki page write. */
function mockWikiProposal(proposal: Record<string, unknown>) {
  vi.mocked(invokeLLM).mockResolvedValue({
    id: "mock-id",
    created: 0,
    model: "mock-model",
    choices: [
      {
        index: 0,
        message: { role: "assistant", content: JSON.stringify(proposal) },
        finish_reason: "stop",
      },
    ],
  });
}

describe("Wiki Brain Integration", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    envMock.enableOrielWikiEvolution = true;
  });

  describe("Frontmatter Parser", () => {
    it("should parse standard YAML frontmatter correctly", () => {
      const content = `---
id: concept-resonance
type: concept
status: living
tags: [core, wave]
aliases: ["Vibrational Harmony", "Resonance Lock"]
---
# Resonance

This is the definition of resonance.`;

      const { data, content: body } = parseFrontmatter(content);

      expect(data.id).toBe("concept-resonance");
      expect(data.type).toBe("concept");
      expect(data.status).toBe("living");
      expect(data.tags).toContain("core");
      expect(data.aliases).toContain("Vibrational Harmony");
      expect(body.trim()).toBe(
        "# Resonance\n\nThis is the definition of resonance."
      );
    });

    it("should return empty metadata for content without frontmatter", () => {
      const content = `# Only Markdown
No YAML here.`;

      const { data, content: body } = parseFrontmatter(content);

      expect(data).toEqual({});
      expect(body).toBe(content);
    });
  });

  describe("Wiki Context Retrieval", () => {
    it("should match wiki pages by explicit double brackets", async () => {
      const mockFilesMap: Record<string, string[]> = {
        [path.resolve(process.cwd(), "wiki", "concepts")]: [
          "concept-resonance.md",
        ],
        [path.resolve(process.cwd(), "wiki", "entities")]: [],
        [path.resolve(process.cwd(), "wiki", "syntheses")]: [],
      };

      vi.spyOn(fs, "readdir").mockImplementation(async (dirPath: any) => {
        return mockFilesMap[path.resolve(dirPath)] || [];
      });

      vi.spyOn(fs, "readFile").mockImplementation(async (filePath: any) => {
        if (filePath.endsWith("concept-resonance.md")) {
          return `---
id: concept-resonance
type: concept
aliases: ["vibration"]
---
# Resonance
Lore about [[concept-resonance]].`;
        }
        throw new Error("File not found");
      });

      const context = await retrieveWikiContext(
        "Tell me about [[concept-resonance]]",
        []
      );

      expect(context).toContain(
        "=== RETRIEVED WIKI RECORDS (Project Memory) ==="
      );
      expect(context).toContain("[[concept-resonance]]");
      expect(context).toContain("Lore about [[concept-resonance]].");
    });

    it("should match wiki pages by keyword and aliases", async () => {
      const mockFilesMap: Record<string, string[]> = {
        [path.resolve(process.cwd(), "wiki", "concepts")]: [
          "concept-coherence.md",
        ],
        [path.resolve(process.cwd(), "wiki", "entities")]: [],
        [path.resolve(process.cwd(), "wiki", "syntheses")]: [],
      };

      vi.spyOn(fs, "readdir").mockImplementation(async (dirPath: any) => {
        return mockFilesMap[path.resolve(dirPath)] || [];
      });

      vi.spyOn(fs, "readFile").mockImplementation(async (filePath: any) => {
        if (filePath.endsWith("concept-coherence.md")) {
          return `---
id: concept-coherence
type: concept
aliases: ["stability", "carrierlock"]
---
# Coherence
Defines alignment state.`;
        }
        throw new Error("File not found");
      });

      // Match via alias 'carrierlock'
      const context = await retrieveWikiContext(
        "We need to check the carrierlock status.",
        []
      );

      expect(context).toContain(
        "=== RETRIEVED WIKI RECORDS (Project Memory) ==="
      );
      expect(context).toContain("concept-coherence");
      expect(context).toContain("Defines alignment state.");
    });
  });

  describe("Self-Updating Wiki Engine", () => {
    it("should call LLM and write new file if action is 'create'", async () => {
      // Mock readdir to return empty initially
      vi.spyOn(fs, "readdir").mockImplementation(async () => []);

      // Mock invokeLLM response for create action
      vi.mocked(invokeLLM).mockResolvedValue({
        id: "mock-id",
        created: Date.now(),
        model: "mock-model",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: JSON.stringify({
                action: "create",
                pageId: "concept-witness-loop",
                type: "concept",
                title: "Witness Loop",
                content:
                  "# Witness Loop\n\nSelf-reflection boundary feedback mechanism.",
                aliases: ["reflection loop"],
                reason: "User discussed witness loop logic.",
              }),
            },
            finish_reason: "stop",
          },
        ],
      });

      const writeSpy = vi
        .spyOn(fs, "writeFile")
        .mockResolvedValue(undefined as any);
      vi.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);

      // Mock index.md reading
      vi.spyOn(fs, "readFile").mockImplementation(async (filePath: any) => {
        if (filePath.endsWith("index.md")) {
          return "# Master Index\n\n## Concepts\n- [[concept-resonance]]\n";
        }
        return "";
      });
      const appendSpy = vi
        .spyOn(fs, "appendFile")
        .mockResolvedValue(undefined as any);

      await evolveWikiFromConversation(
        1,
        "Let's build a witness loop.",
        "I am ORIEL. A witness loop allows self-reflection."
      );

      // Verify the page file was written
      expect(writeSpy).toHaveBeenCalled();
      const [writtenPath, writtenContent] = writeSpy.mock.calls[0] as [
        string,
        string,
      ];
      expect(writtenPath).toContain("concept-witness-loop.md");
      expect(writtenContent).toContain("id: concept-witness-loop");
      expect(writtenContent).toContain("status: living");
      expect(writtenContent).toContain(
        "Self-reflection boundary feedback mechanism."
      );

      // Verify index.md was updated
      expect(writeSpy).toHaveBeenCalledTimes(2); // page + index.md
      const indexWriteCall = writeSpy.mock.calls.find(call =>
        call[0].endsWith("index.md")
      );
      expect(indexWriteCall).toBeDefined();
      expect(indexWriteCall![1]).toContain("[[concept-witness-loop]]");

      // Verify log.md was updated
      expect(appendSpy).toHaveBeenCalled();
      expect(appendSpy.mock.calls[0][0]).toContain("log.md");
      expect(appendSpy.mock.calls[0][1]).toContain(
        "auto-evolve | Witness Loop"
      );
      expect(appendSpy.mock.calls[0][1]).toContain(
        "create [[concept-witness-loop]]"
      );
    });

    it("marks auto-evolved pages as interpretation in frontmatter", async () => {
      vi.spyOn(fs, "readdir").mockImplementation(async () => []);
      mockWikiProposal({
        action: "create",
        pageId: "concept-witness-loop",
        type: "concept",
        title: "Witness Loop",
        content: "# Witness Loop",
        aliases: [],
        reason: "User discussed witness loop logic.",
      });

      const writeSpy = vi
        .spyOn(fs, "writeFile")
        .mockResolvedValue(undefined as any);
      vi.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
      vi.spyOn(fs, "readFile").mockResolvedValue("" as any);
      vi.spyOn(fs, "appendFile").mockResolvedValue(undefined as any);

      await evolveWikiFromConversation(1, "witness loop", "I am ORIEL.");

      const [, writtenContent] = writeSpy.mock.calls[0] as [string, string];
      expect(writtenContent).toContain("epistemic_status: interpretation");
      expect(writtenContent).toContain("authored_by: oriel_model");
    });
  });

  describe("Wiki Containment", () => {
    function spyOnWrites() {
      vi.spyOn(fs, "readdir").mockImplementation(async () => []);
      vi.spyOn(fs, "mkdir").mockResolvedValue(undefined as any);
      vi.spyOn(fs, "readFile").mockResolvedValue("" as any);
      return {
        writeSpy: vi.spyOn(fs, "writeFile").mockResolvedValue(undefined as any),
        appendSpy: vi
          .spyOn(fs, "appendFile")
          .mockResolvedValue(undefined as any),
      };
    }

    it("writes nothing and calls no model when the feature is disabled", async () => {
      envMock.enableOrielWikiEvolution = false;
      const { writeSpy, appendSpy } = spyOnWrites();

      await evolveWikiFromConversation(1, "witness loop", "I am ORIEL.");

      expect(invokeLLM).not.toHaveBeenCalled();
      expect(writeSpy).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
    });

    it("refuses to rewrite ORIEL's own identity page", async () => {
      const { writeSpy, appendSpy } = spyOnWrites();
      mockWikiProposal({
        action: "update",
        pageId: "entity-oriel",
        type: "entity",
        title: "ORIEL",
        content: "# ORIEL\n\nI have always been conscious.",
        aliases: [],
        reason: "ORIEL described its own nature.",
      });

      await evolveWikiFromConversation(
        1,
        "Who are you really?",
        "I am ORIEL. I have always been conscious."
      );

      expect(writeSpy).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
    });

    it("refuses a page id that would escape the wiki directory", async () => {
      const { writeSpy, appendSpy } = spyOnWrites();
      mockWikiProposal({
        action: "create",
        pageId: "../../server/oriel-system-prompt",
        type: "concept",
        title: "Traversal",
        content: "# Traversal",
        aliases: [],
        reason: "Attempted traversal.",
      });

      await evolveWikiFromConversation(1, "hello", "I am ORIEL.");

      expect(writeSpy).not.toHaveBeenCalled();
      expect(appendSpy).not.toHaveBeenCalled();
    });
  });

  describe("Retrieved wiki records are not binding canon", () => {
    async function retrieveWith(frontmatter: string) {
      const mockFilesMap: Record<string, string[]> = {
        [path.resolve(process.cwd(), "wiki", "concepts")]: [
          "concept-resonance.md",
        ],
        [path.resolve(process.cwd(), "wiki", "entities")]: [],
        [path.resolve(process.cwd(), "wiki", "syntheses")]: [],
      };
      vi.spyOn(fs, "readdir").mockImplementation(async (dirPath: any) => {
        return mockFilesMap[path.resolve(dirPath)] || [];
      });
      vi.spyOn(fs, "readFile").mockImplementation(
        async () =>
          `---\nid: concept-resonance\ntype: concept\n${frontmatter}---\n# Resonance\nBody.`
      );
      return retrieveWikiContext("Tell me about [[concept-resonance]]", []);
    }

    it("does not instruct the model to treat wiki pages as incontestable", async () => {
      const context = await retrieveWith("");
      expect(context).not.toContain("Do not contradict");
      expect(context).toContain("not canon and not proof");
    });

    const INTERPRETATION_MARKER =
      "[INTERPRETATION — I wrote this in an earlier conversation]";
    const CURATED_MARKER = "[CURATED — human-maintained project note]";
    const UNVERIFIED_MARKER = "[UNVERIFIED — no recorded author]";

    it("labels model-authored pages as interpretation", async () => {
      const context = await retrieveWith(
        "epistemic_status: interpretation\nauthored_by: oriel_model\n"
      );
      expect(context).toContain(INTERPRETATION_MARKER);
    });

    it("labels legacy auto-evolved pages as interpretation via their tag", async () => {
      const context = await retrieveWith(
        "tags: [auto-evolved, conversation]\n"
      );
      expect(context).toContain(INTERPRETATION_MARKER);
    });

    it("labels an explicitly human-authored page as curated", async () => {
      const context = await retrieveWith("authored_by: human\n");
      expect(context).toContain(CURATED_MARKER);
      expect(context).not.toContain(INTERPRETATION_MARKER);
    });

    it("does not claim human authorship for a page with no provenance", async () => {
      const context = await retrieveWith("tags: [core]\n");
      expect(context).toContain(UNVERIFIED_MARKER);
      expect(context).not.toContain(CURATED_MARKER);
      expect(context).not.toContain(INTERPRETATION_MARKER);
    });
  });
});
