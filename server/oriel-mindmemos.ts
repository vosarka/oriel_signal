/**
 * MindMemOS adapter — semantic index only.
 *
 * TiDB / orielMemories remains the official store. This module indexes
 * accepted memories and searches them. Chat transcripts are never sent.
 *
 * Indexed content is prefixed with [orielMemories:id] so a search hit can
 * be hydrated from TiDB without trusting the cloud paraphrase.
 */

import { ENV } from "./_core/env";
import type { MemoryRecommendedAction } from "./oriel-memory-consecration";
import {
  encodeOfficialMemoryRef,
  parseOfficialMemoryId,
} from "./oriel-memory-retrieval";

export type MindMemOSAddInput = {
  memoryId: number;
  userId: number;
  content: string;
  category?: string;
};

export type MindMemOSClientConfig = {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  fetchImpl?: typeof fetch;
};

export function mindMemOSConfigFromEnv(): MindMemOSClientConfig {
  return {
    enabled: ENV.enableOrielMindMemos,
    baseUrl: ENV.mindMemosBaseUrl,
    apiKey: ENV.mindMemosApiKey,
  };
}

export function canIndexInMindMemOS(action: MemoryRecommendedAction): boolean {
  return action === "store";
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

/** How much of a failed response body reaches the log. */
const ERROR_BODY_CHARS = 300;

/** And how long we will wait for it. A diagnostic must not become a hang. */
const ERROR_BODY_TIMEOUT_MS = 2_000;

/**
 * Remove the memory we sent from whatever the service sends back.
 *
 * A validation error commonly echoes the offending payload, and our payload is
 * a sentence somebody told ORIEL in confidence. Truncating the body limits how
 * much of that reaches the log but does not stop it: the echo can sit in the
 * first three hundred characters as easily as the last. We know exactly what
 * we transmitted, so we can take it back out by name.
 *
 * AGENTS.md rule 3: never log secrets. A private memory is one.
 */
function redactSentContent(body: string, sent: string): string {
  const trimmed = sent.trim();
  if (trimmed.length < 8) return body;
  // Split rather than regex: the content is arbitrary user text and would need
  // escaping, and a bad escape here would be the bug that leaks it.
  return body.split(trimmed).join("[redacted]");
}

/**
 * A bare status code cannot be acted on. A 422 in particular means the service
 * understood the request and refused its shape, and the body is the only place
 * that says which field was wrong.
 */
async function describeFailure(
  response: Response,
  sentContent = ""
): Promise<string> {
  let body = "";
  try {
    // fetchWithTimeout's abort fires on headers, not on the body, so a service
    // that answers 422 and then stalls mid-body would hang this call and with
    // it the turn that triggered the write. The deadline is ours to keep here.
    body = (
      await Promise.race([
        response.text(),
        new Promise<string>((_, reject) =>
          setTimeout(
            () => reject(new Error("error body timed out")),
            ERROR_BODY_TIMEOUT_MS
          )
        ),
      ])
    ).trim();
  } catch {
    return `${response.status} (response body unreadable)`;
  }
  if (!body) return `${response.status} (empty response body)`;
  // Redact first, then cap: capping first could cut the content in half and
  // leave an unmatched fragment of it in the log.
  const safe = redactSentContent(body, sentContent);
  const shown = safe.slice(0, ERROR_BODY_CHARS);
  const elided = safe.length > shown.length ? " […]" : "";
  return `${response.status} ${shown}${elided}`;
}

// This search runs synchronously before every LLM call (see selectMemoriesForTurn),
// so a slow-but-not-erroring endpoint must not be allowed to hang a whole chat turn.
const MINDMEMOS_TIMEOUT_MS = 5_000;

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`MindMemOS request timed out after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export async function indexAcceptedMemory(
  input: MindMemOSAddInput,
  config: MindMemOSClientConfig,
  action: MemoryRecommendedAction = "store"
): Promise<{ indexed: boolean; cloudIds: string[] }> {
  if (!canIndexInMindMemOS(action)) return { indexed: false, cloudIds: [] };
  if (!config.enabled || !config.baseUrl || !config.apiKey) {
    return { indexed: false, cloudIds: [] };
  }

  const fetchImpl = config.fetchImpl ?? fetch;
  const response = await fetchWithTimeout(
    fetchImpl,
    `${normalizeBaseUrl(config.baseUrl)}/v1/memory/add`,
    {
      method: "POST",
      headers: headers(config.apiKey),
      body: JSON.stringify({
        user_id: String(input.userId),
        messages: [
          {
            role: "user",
            content: encodeOfficialMemoryRef(input.memoryId, input.content),
          },
        ],
        async_mode: "sync",
        mode: "fine",
      }),
    },
    MINDMEMOS_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(
      `MindMemOS add failed: ${await describeFailure(response, encodeOfficialMemoryRef(input.memoryId, input.content))}`
    );
  }
  const cloudIds = idsFromPayload(await response.json());
  return {
    indexed: true,
    cloudIds:
      cloudIds.length > 0
        ? cloudIds
        : await searchMemoryIds(input.userId, input.content, config, 3),
  };
}

function parseCloudId(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const record = raw as Record<string, unknown>;
  const rawId = record.memory_id ?? record.id ?? record.memoryId;
  if (typeof rawId !== "string" || !rawId.trim() || rawId.length > 255) {
    return null;
  }
  return rawId;
}

function idsFromPayload(payload: unknown): string[] {
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;
  const data =
    record.data && typeof record.data === "object"
      ? (record.data as Record<string, unknown>)
      : null;
  const list = Array.isArray(record.memories)
    ? record.memories
    : Array.isArray(data?.memories)
      ? data.memories
      : [];
  return list.map(parseCloudId).filter((id): id is string => id !== null);
}

export type MindMemOSSearchHit = {
  cloudId: string | null;
  content: string;
  officialMemoryId: number | null;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object"
    ? (value as Record<string, unknown>)
    : null;
}

function memoryListFromPayload(payload: unknown): unknown[] {
  const record = asRecord(payload);
  if (!record) return [];
  const data = asRecord(record.data);
  if (Array.isArray(record.memories)) return record.memories;
  if (Array.isArray(data?.memories)) return data.memories;
  if (Array.isArray(record.results)) return record.results;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

function hitFromRaw(raw: unknown): MindMemOSSearchHit | null {
  if (typeof raw === "string") {
    return {
      cloudId: null,
      content: raw,
      officialMemoryId: parseOfficialMemoryId(raw),
    };
  }
  const record = asRecord(raw);
  if (!record) return null;
  const content =
    (typeof record.memory === "string" && record.memory) ||
    (typeof record.content === "string" && record.content) ||
    (typeof record.text === "string" && record.text) ||
    "";
  const cloudId = parseCloudId(record);
  if (!cloudId && !content) return null;
  return {
    cloudId,
    content,
    officialMemoryId: parseOfficialMemoryId(content),
  };
}

export async function searchMemoryHits(
  userId: number,
  query: string,
  config: MindMemOSClientConfig,
  topK = 3
): Promise<MindMemOSSearchHit[]> {
  if (!config.enabled || !config.baseUrl || !config.apiKey) return [];

  const fetchImpl = config.fetchImpl ?? fetch;
  const response = await fetchWithTimeout(
    fetchImpl,
    `${normalizeBaseUrl(config.baseUrl)}/v1/memory/search`,
    {
      method: "POST",
      headers: headers(config.apiKey),
      body: JSON.stringify({
        user_id: String(userId),
        query,
        top_k: topK,
      }),
    },
    MINDMEMOS_TIMEOUT_MS
  );

  if (!response.ok) {
    throw new Error(
      `MindMemOS search failed: ${await describeFailure(response, query)}`
    );
  }

  return memoryListFromPayload(await response.json())
    .map(hitFromRaw)
    .filter((hit): hit is MindMemOSSearchHit => hit !== null)
    .slice(0, topK);
}

export async function searchMemoryIds(
  userId: number,
  query: string,
  config: MindMemOSClientConfig,
  topK = 3
): Promise<string[]> {
  const hits = await searchMemoryHits(userId, query, config, topK);
  return hits.map(hit => hit.cloudId).filter((id): id is string => Boolean(id));
}
