import { useCallback, useEffect, useState } from "react";
import type { AccessTier } from "@/pages/cosmichronica-data";

/**
 * useCosmichronicaProgress
 * ════════════════════════════════════════════════════════════════════════════
 *
 * Tracks the reader's descent through the Cosmichronica and their access tier.
 *
 * TODAY: resolves from localStorage. Every reader can open all eight register
 * summaries; deeper register bodies/chapters are tiered ("open" → "initiate" →
 * "adept") so we have a built-in seam for future paid progression / income.
 *
 * LATER: swap the localStorage read/write for a tRPC `progress` router backed by
 * a Drizzle `cosmichronica_progress` table (proposed, not yet migrated). The
 * public shape of this hook stays identical, so the page never changes.
 *
 *   Proposed table (do not run without approval):
 *     cosmichronica_progress {
 *       userId        varchar  (fk → profiles)
 *       visitedNodes  json     (string[] of node ids)
 *       tier          enum     ('open','initiate','adept')
 *       updatedAt     timestamp
 *     }
 */

const STORAGE_KEY = "vossari.cosmichronica.progress.v1";

const TIER_RANK: Record<AccessTier, number> = {
  open: 0,
  initiate: 1,
  adept: 2,
};

interface ProgressState {
  visited: string[];
  tier: AccessTier;
}

function readStorage(): ProgressState {
  if (typeof window === "undefined") return { visited: [], tier: "open" };
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { visited: [], tier: "open" };
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      visited: Array.isArray(parsed.visited) ? parsed.visited : [],
      tier: parsed.tier ?? "open",
    };
  } catch {
    return { visited: [], tier: "open" };
  }
}

function writeStorage(state: ProgressState) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable — degrade silently */
  }
}

export interface CosmichronicaProgress {
  /** Node ids the reader has opened/reached */
  visited: Set<string>;
  /** Current access tier */
  tier: AccessTier;
  /** Mark a node as reached (idempotent) */
  markVisited: (id: string) => void;
  /** Whether a given tier's full content is unlocked for this reader */
  hasAccess: (required: AccessTier) => boolean;
  /** How many of the eight registers have been reached */
  reachedCount: number;
}

export function useCosmichronicaProgress(): CosmichronicaProgress {
  const [state, setState] = useState<ProgressState>(() => readStorage());

  useEffect(() => {
    writeStorage(state);
  }, [state]);

  const markVisited = useCallback((id: string) => {
    setState((prev) => {
      if (prev.visited.includes(id)) return prev;
      return { ...prev, visited: [...prev.visited, id] };
    });
  }, []);

  const hasAccess = useCallback(
    (required: AccessTier) => TIER_RANK[state.tier] >= TIER_RANK[required],
    [state.tier]
  );

  return {
    visited: new Set(state.visited),
    tier: state.tier,
    markVisited,
    hasAccess,
    reachedCount: state.visited.length,
  };
}
