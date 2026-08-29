/**
 * MindMemOS adapter — semantic index only.
 *
 * TiDB / orielMemories remains the official store. This module indexes
 * accepted memories and returns ranked ids. Chat transcripts are never sent.
 *
 * Wired behind ENV.enableOrielMindMemos (default false). oriel.chat does not
 * call this yet.
 */

import type { MemoryRecommendedAction } from "./oriel-memory-consecration";

export type MindMemOSAddInput = {
  memoryId: number;
  userId: number;
  content: string;
  category?: string;
};

export type MindMemOSSearchHit = {
  memoryId: number;
  score: number;
};

export type MindMemOSOfficialMemory = {
  id: number;
  content: string;
  isActive: boolean;
};

export type MindMemOSClientConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
};

const MEMORY_ID_PREFIX = "orielMemories:";

export function canIndexInMindMemOS(
  action: MemoryRecommendedAction
): boolean {
  return action === "store";
}

export function encodeIndexedContent(input: MindMemOSAddInput): string {
  return `[${MEMORY_ID_PREFIX}${input.memoryId}] ${input.content}`;
}

export function parseMemoryIdFromIndexedContent(
  content: string
): number | null {
  const match = content.match(/\[orielMemories:(\d+)\]/);
  if (!match) return null;
  return Number(match[1]);
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/$/, "");
}

function headers(apiKey: string): HeadersInit {
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
}

export async function indexAcceptedMemory(
  input: MindMemOSAddInput,
  config: MindMemOSClientConfig,
  action: MemoryRecommendedAction = "store"
): Promise<{ indexed: boolean }> {
  if (!canIndexInMindMemOS(action)) return { indexed: false };
  if (!config.enabled || !config.baseUrl || !config.apiKey) {
    return { indexed: false };
  }

  const fetchImpl = config.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `${normalizeBaseUrl(config.baseUrl)}/v1/memory/add`,
    {
      method: "POST",
      headers: headers(config.apiKey),
      body: JSON.stringify({
        user_id: String(input.userId),
        messages: [
          {
            role: "user",
            content: encodeIndexedContent(input),
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`MindMemOS add failed: ${response.status}`);
  }
  return { indexed: true };
}

function parseHit(raw: unknown): MindMemOSSearchHit | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const fromContent = parseMemoryIdFromIndexedContent(
    String(record.content ?? record.memory ?? record.text ?? "")
  );
  const rawId = record.memory_id ?? record.id ?? record.memoryId;
  const memoryId =
    fromContent ??
    (typeof rawId === "number"
      ? rawId
      : typeof rawId === "string" && /^\d+$/.test(rawId)
        ? Number(rawId)
        : null);
  if (memoryId === null || !Number.isInteger(memoryId)) return null;
  const score =
    typeof record.score === "number"
      ? record.score
      : typeof record.relevance === "number"
        ? record.relevance
        : 0;
  return { memoryId, score };
}

export async function searchMemoryIds(
  userId: number,
  query: string,
  config: MindMemOSClientConfig,
  topK = 3
): Promise<MindMemOSSearchHit[]> {
  if (!config.enabled || !config.baseUrl || !config.apiKey) return [];

  const fetchImpl = config.fetchImpl ?? fetch;
  const response = await fetchImpl(
    `${normalizeBaseUrl(config.baseUrl)}/v1/memory/search`,
    {
      method: "POST",
      headers: headers(config.apiKey),
      body: JSON.stringify({
        user_id: String(userId),
        query,
        top_k: topK,
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`MindMemOS search failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    memories?: unknown[];
    data?: { memories?: unknown[] };
  };
  const list = payload.memories ?? payload.data?.memories ?? [];
  return list
    .map(parseHit)
    .filter((hit): hit is MindMemOSSearchHit => hit !== null)
    .slice(0, topK);
}

/**
 * Load official TiDB rows for ranked ids. Skips missing or inactive memories
 * so the prompt never uses index-only text.
 */
export function resolveOfficialMemoriesForPrompt(
  hits: MindMemOSSearchHit[],
  official: MindMemOSOfficialMemory[]
): MindMemOSOfficialMemory[] {
  const byId = new Map(official.map(row => [row.id, row]));
  const resolved: MindMemOSOfficialMemory[] = [];
  for (const hit of hits) {
    const row = byId.get(hit.memoryId);
    if (!row || !row.isActive) continue;
    resolved.push(row);
  }
  return resolved;
}
