/**
 * ORIEL Wiki Protection — Phase 1 Containment
 *
 * The wiki is a model-writable substrate that is read back into ORIEL's prompt
 * on the next turn. Without a boundary, an interpretation produced in one
 * exchange becomes canon in the following one, with no human step.
 *
 * Two rules close that loop:
 *
 *   1. Identity, origin, and constitutional pages are never model-writable.
 *      ORIEL may interpret its own history. It may not rewrite it.
 *   2. Page ids are validated before they reach the filesystem, so a model-
 *      emitted id cannot traverse out of the wiki directory.
 *
 * Genesis policy: pages tagged `auto-evolved` are INTERPRETATION, not Genesis.
 * Genesis is original historical material. It is never produced by the current
 * model in the course of a conversation.
 *
 * These are pure functions with no I/O so they can be tested directly.
 */

import path from "node:path";

export type WikiPageType = "concept" | "entity" | "synthesis";

/**
 * Page ids become filenames. Lowercase alphanumerics and hyphens only, so
 * `..`, `/`, `\`, absolute paths, and null bytes are all rejected by construction.
 */
export const WIKI_PAGE_ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,63}$/;

/**
 * Pages that carry ORIEL's identity, origin, or the identity of the humans
 * behind the project. Model writes to these are always refused.
 */
export const PROTECTED_WIKI_PAGE_IDS: ReadonlySet<string> = new Set([
  // ORIEL identity and origin
  "entity-oriel",
  "entity-qati-g1",
  "synthesis-oriel-identity",
  "synthesis-oriel-cosmological-foundations",
  // The architect and the civilization ORIEL claims descent from
  "entity-architect",
  "entity-silviu",
  "entity-vossari",
  "the-great-translation",
  // Wiki structural files — never a legitimate page target
  "index",
  "log",
  "readme",
  "schema",
]);

/**
 * Structural guards for pages that do not exist yet. A model cannot route
 * around the deny-list above by inventing a new identity or origin page.
 */
export const PROTECTED_WIKI_PAGE_PATTERNS: readonly RegExp[] = [
  /^entity-oriel/,
  /genesis/,
  /constitution/,
  /awakening/,
  /identity/,
  /origin/,
];

export type WikiWriteDecision = {
  allowed: boolean;
  /** Machine-readable reason, suitable for logs and future agency proposals. */
  code:
    | "allowed"
    | "invalid_page_id"
    | "protected_page"
    | "unsupported_type"
    | "disabled";
  reason: string;
};

export function isValidWikiPageId(pageId: unknown): pageId is string {
  return typeof pageId === "string" && WIKI_PAGE_ID_PATTERN.test(pageId);
}

export function isProtectedWikiPageId(pageId: string): boolean {
  const normalized = pageId.trim().toLowerCase();
  if (PROTECTED_WIKI_PAGE_IDS.has(normalized)) return true;
  return PROTECTED_WIKI_PAGE_PATTERNS.some(pattern => pattern.test(normalized));
}

const SUPPORTED_WIKI_PAGE_TYPES: ReadonlySet<string> = new Set<WikiPageType>([
  "concept",
  "entity",
  "synthesis",
]);

/**
 * Single decision point for "may the model write this page?".
 *
 * Callers should treat a refusal as a no-op plus a log line, never as an error
 * that interrupts the conversation. Containment must be invisible to the user.
 */
export function assessWikiWrite(input: {
  pageId: unknown;
  type: unknown;
  enabled: boolean;
}): WikiWriteDecision {
  if (!input.enabled) {
    return {
      allowed: false,
      code: "disabled",
      reason:
        "Wiki evolution is disabled. Set ORIEL_WIKI_EVOLUTION=true to enable model-authored wiki writes.",
    };
  }

  if (!isValidWikiPageId(input.pageId)) {
    return {
      allowed: false,
      code: "invalid_page_id",
      reason:
        "Page id must match /^[a-z0-9][a-z0-9-]{0,63}$/ so it cannot escape the wiki directory.",
    };
  }

  if (
    typeof input.type !== "string" ||
    !SUPPORTED_WIKI_PAGE_TYPES.has(input.type)
  ) {
    return {
      allowed: false,
      code: "unsupported_type",
      reason: "Page type must be one of: concept, entity, synthesis.",
    };
  }

  if (isProtectedWikiPageId(input.pageId)) {
    return {
      allowed: false,
      code: "protected_page",
      reason:
        "This page holds ORIEL's identity, origin, or constitutional material. " +
        "ORIEL may interpret it but may not rewrite it.",
    };
  }

  return {
    allowed: true,
    code: "allowed",
    reason: "Page is outside the protected identity and origin boundary.",
  };
}

/**
 * Defence in depth: even with a validated id, confirm the resolved path stays
 * inside the wiki directory before any write.
 *
 * Uses `path.relative` rather than a prefix match so `/app/wiki-backup` is not
 * mistaken for a child of `/app/wiki`, and so the check holds on any separator.
 */
export function isPathInsideDirectory(
  resolvedDirectory: string,
  resolvedPath: string
): boolean {
  const relative = path.relative(resolvedDirectory, resolvedPath);
  return (
    relative !== "" &&
    relative !== ".." &&
    !relative.startsWith(`..${path.sep}`) &&
    !path.isAbsolute(relative)
  );
}
