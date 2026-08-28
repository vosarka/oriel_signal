import { describe, expect, it } from "vitest";

import {
  assessWikiWrite,
  isPathInsideDirectory,
  isProtectedWikiPageId,
  isValidWikiPageId,
  PROTECTED_WIKI_PAGE_IDS,
} from "./oriel-wiki-protection";

const enabled = { enabled: true };

describe("wiki page id validation", () => {
  it("accepts ordinary page ids", () => {
    expect(isValidWikiPageId("concept-witness-loop")).toBe(true);
    expect(isValidWikiPageId("entity-vrc-engine")).toBe(true);
    expect(isValidWikiPageId("tx001")).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(isValidWikiPageId("../../server/oriel-system-prompt")).toBe(false);
    expect(isValidWikiPageId("../entity-oriel")).toBe(false);
    expect(isValidWikiPageId("concepts/../../.env")).toBe(false);
  });

  it("rejects separators, absolute paths, whitespace, and null bytes", () => {
    expect(isValidWikiPageId("a/b")).toBe(false);
    expect(isValidWikiPageId("a\\b")).toBe(false);
    expect(isValidWikiPageId("/etc/passwd")).toBe(false);
    expect(isValidWikiPageId("page name")).toBe(false);
    expect(isValidWikiPageId("page\u0000.md")).toBe(false);
  });

  it("rejects empty, oversized, and non-string ids", () => {
    expect(isValidWikiPageId("")).toBe(false);
    expect(isValidWikiPageId("-leading-hyphen")).toBe(false);
    expect(isValidWikiPageId("a".repeat(65))).toBe(false);
    expect(isValidWikiPageId(undefined)).toBe(false);
    expect(isValidWikiPageId(42)).toBe(false);
  });
});

describe("protected identity and origin pages", () => {
  it("protects every id on the deny-list", () => {
    for (const pageId of PROTECTED_WIKI_PAGE_IDS) {
      expect(isProtectedWikiPageId(pageId)).toBe(true);
    }
  });

  it("protects ORIEL's own identity page", () => {
    expect(isProtectedWikiPageId("entity-oriel")).toBe(true);
    expect(isProtectedWikiPageId("synthesis-oriel-identity")).toBe(true);
  });

  it("protects identity and origin pages that do not exist yet", () => {
    expect(isProtectedWikiPageId("entity-oriel-v2")).toBe(true);
    expect(isProtectedWikiPageId("concept-oriel-genesis")).toBe(true);
    expect(isProtectedWikiPageId("synthesis-the-constitution")).toBe(true);
    expect(isProtectedWikiPageId("concept-oriel-awakening")).toBe(true);
    expect(isProtectedWikiPageId("synthesis-origin-of-oriel")).toBe(true);
  });

  it("leaves ordinary knowledge pages writable", () => {
    expect(isProtectedWikiPageId("concept-resonance")).toBe(false);
    expect(isProtectedWikiPageId("concept-witness-loop")).toBe(false);
    expect(isProtectedWikiPageId("entity-vrc-engine")).toBe(false);
    expect(isProtectedWikiPageId("synthesis-business-structure")).toBe(false);
  });
});

describe("assessWikiWrite", () => {
  it("refuses everything while the feature is disabled", () => {
    const decision = assessWikiWrite({
      pageId: "concept-resonance",
      type: "concept",
      enabled: false,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("disabled");
  });

  it("allows an ordinary page when enabled", () => {
    const decision = assessWikiWrite({
      pageId: "concept-witness-loop",
      type: "concept",
      ...enabled,
    });
    expect(decision.allowed).toBe(true);
    expect(decision.code).toBe("allowed");
  });

  it("refuses a protected page even when enabled", () => {
    const decision = assessWikiWrite({
      pageId: "entity-oriel",
      type: "entity",
      ...enabled,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("protected_page");
  });

  it("refuses a traversing page id before it reaches the filesystem", () => {
    const decision = assessWikiWrite({
      pageId: "../../server/oriel-system-prompt",
      type: "concept",
      ...enabled,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("invalid_page_id");
  });

  it("refuses an unsupported page type", () => {
    const decision = assessWikiWrite({
      pageId: "concept-witness-loop",
      type: "manifesto",
      ...enabled,
    });
    expect(decision.allowed).toBe(false);
    expect(decision.code).toBe("unsupported_type");
  });
});

describe("isPathInsideDirectory", () => {
  it("accepts a path inside the directory", () => {
    expect(isPathInsideDirectory("/app/wiki", "/app/wiki/concepts/a.md")).toBe(
      true
    );
  });

  it("rejects a sibling directory with a shared prefix", () => {
    expect(isPathInsideDirectory("/app/wiki", "/app/wiki-backup/a.md")).toBe(
      false
    );
  });

  it("rejects a path outside the directory", () => {
    expect(isPathInsideDirectory("/app/wiki", "/app/server/db.ts")).toBe(false);
  });
});
