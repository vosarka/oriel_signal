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
import { redactEcho } from "./_core/redact-echo";
import { ORIEL_WORKING_VIEW_PREFIX } from "./oriel-memory-retrieval";
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
 * A bare status code cannot be acted on. A 422 in particular means the service
 * understood the request and refused its shape, and the body is the only place
 * that says which field was wrong.
 */
async function describeFailure(
  response: Response,
  sentContent: string[] = []
): Promise<string> {
  let body = "";
  try {
    // fetchWithTimeout's abort fires on headers, not on the body, so a service
    // that answers 422 and then stalls mid-body would hang this call and with
    // it the turn that triggered the write. The deadline is ours to keep here.
    // Giving up on the read is not the same as ending it: the body goes on
    // being read in the background, holding a connection and whatever it has
    // buffered, and a service stalling on every write would accumulate those.
    // Cancelling the body is what actually ends it. The rejection is still
    // needed as well, since a body we cannot cancel must not become a hang.
    let deadline: ReturnType<typeof setTimeout> | undefined;
    try {
      body = (
        await Promise.race([
          response.text(),
          new Promise<string>((_, reject) => {
            deadline = setTimeout(() => {
              void response.body?.cancel().catch(() => {});
              reject(new Error("error body timed out"));
            }, ERROR_BODY_TIMEOUT_MS);
          }),
        ])
      ).trim();
    } finally {
      if (deadline) clearTimeout(deadline);
    }
  } catch {
    return `${response.status} (response body unreadable)`;
  }
  if (!body) return `${response.status} (empty response body)`;
  // Redact first, then cap: capping first could cut the content in half and
  // leave an unmatched fragment of it in the log.
  const safe = redactEcho(body, sentContent);
  const shown = safe.slice(0, ERROR_BODY_CHARS);
  const elided = safe.length > shown.length ? " […]" : "";
  return `${response.status} ${shown}${elided}`;
}

// This search runs synchronously before every LLM call (see selectMemoriesForTurn),
// so a slow-but-not-erroring endpoint must not be allowed to hang a whole chat turn.
const MINDMEMOS_TIMEOUT_MS = 5_000;

/**
 * Every call, its outcome, and how long it took.
 *
 * Production was falling back to TiDB on the timeout above, which told us the
 * service was too slow and nothing else. "Too slow" hides two very different
 * problems with two different fixes: a service answering just past our
 * deadline needs a longer deadline, and a service that never answers needs
 * looking at. A bare timeout message cannot tell them apart, because it
 * reports our own limit rather than anything the service did.
 *
 * The query length is here and the query is not. A search query is what
 * somebody just said to ORIEL (AGENTS.md rule 3), but its size is a fair
 * suspect for the slowness and carries nothing private.
 *
 * A monotonic clock rather than the wall clock: the wall clock can be stepped
 * by NTP mid-call, and an instrument that can report a negative duration is
 * not one to reason from.
 */
function logCall(
  label: string,
  startedAt: number,
  outcome: string,
  queryChars?: number
): void {
  const elapsed = Math.round(performance.now() - startedAt);
  const size = queryChars === undefined ? "" : ` query_chars=${queryChars}`;
  console.log(
    `[MindMemOS][timing] ${label} ${outcome} elapsed_ms=${elapsed}${size}`
  );
}

/**
 * Why a network failure needs more than the error's name.
 *
 * Node's fetch reports every transport failure as a TypeError whose message
 * is "fetch failed", and puts the reason somewhere else. A refused
 * connection, an unknown host and a rejected certificate therefore all read
 * identically, which is precisely the distinction these lines exist to draw.
 */
function failureDetail(error: unknown): string {
  if (!(error instanceof Error)) return "unknown";
  const cause = (error as { cause?: unknown }).cause;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code?: unknown }).code)
      : undefined;
  return code ? `${error.name}_${code}` : error.name;
}

async function fetchWithTimeout(
  fetchImpl: typeof fetch,
  url: string,
  init: RequestInit,
  timeoutMs: number,
  label = "request",
  queryChars?: number
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const startedAt = performance.now();
  try {
    const response = await fetchImpl(url, {
      ...init,
      signal: controller.signal,
    });
    // Headers only. The body is still to come, is not covered by the abort
    // above, and is timed separately by whoever reads it - see timeBodyRead.
    // A service answering headers in a moment and dribbling the body out for
    // six seconds would otherwise be recorded here as fast.
    logCall(label, startedAt, `headers_http_${response.status}`, queryChars);
    return response;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // Reaching the deadline is the one outcome that says nothing about the
      // service: it is our own clock firing, so it is named as such.
      logCall(label, startedAt, `timeout_at_${timeoutMs}ms`, queryChars);
      throw new Error(`MindMemOS request timed out after ${timeoutMs}ms`);
    }
    // A refused connection or a DNS failure lands here rather than above, and
    // the distinction is the whole point: unreachable is not slow.
    logCall(label, startedAt, `failed_${failureDetail(error)}`, queryChars);
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Time reading a response body, which the deadline above does not cover.
 *
 * The abort fires on headers. Everything after that is unguarded, so a body
 * that never finishes arriving is a hang the five-second limit cannot see,
 * and one the header timing above would report as a fast call.
 */
async function timeBodyRead<T>(
  label: string,
  read: () => Promise<T>,
  outcome = "body_read",
  queryChars?: number
): Promise<T> {
  const startedAt = performance.now();
  try {
    const value = await read();
    logCall(label, startedAt, outcome, queryChars);
    return value;
  } catch (error) {
    logCall(
      label,
      startedAt,
      `${outcome}_failed_${failureDetail(error)}`,
      queryChars
    );
    throw error;
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
    MINDMEMOS_TIMEOUT_MS,
    "add"
  );

  if (!response.ok) {
    throw new Error(
      `MindMemOS add failed: ${await timeBodyRead("add", () => describeFailure(response, [encodeOfficialMemoryRef(input.memoryId, input.content), input.content]), "error_body_read")}`
    );
  }
  const cloudIds = idsFromPayload(
    await timeBodyRead("add", () => response.json())
  );
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
  // A turn fires two searches at once: one on what the person said and one on
  // the same words behind ORIEL's working-view prefix. When only one of them
  // is slow, an unlabelled line cannot say which.
  const searchLabel = query.startsWith(ORIEL_WORKING_VIEW_PREFIX)
    ? "search_view"
    : "search_user";
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
    MINDMEMOS_TIMEOUT_MS,
    searchLabel,
    query.length
  );

  if (!response.ok) {
    throw new Error(
      // An error body is read too, and is no faster to arrive than a good
      // one. Leaving it out would time only the calls that succeed.
      `MindMemOS search failed: ${await timeBodyRead(
        searchLabel,
        () => describeFailure(response, [query]),
        "error_body_read",
        query.length
      )}`
    );
  }

  // The query size rides along, or the body timing cannot be set beside the
  // header line that records it, and a long query stops being a suspect.
  const payload = await timeBodyRead(
    searchLabel,
    () => response.json(),
    "body_read",
    query.length
  );
  return memoryListFromPayload(payload)
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
