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

export function canIndexInMindMemOS(
  action: MemoryRecommendedAction
): boolean {
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
            content: encodeOfficialMemoryRef(input.memoryId, input.content),
          },
        ],
        async_mode: "sync",
        mode: "fine",
      }),
    }
  );

  if (!response.ok) {
    throw new Error(`MindMemOS add failed: ${response.status}`);
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
  return list
    .map(parseCloudId)
    .filter((id): id is string => id !== null);
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
  return hits
    .map(hit => hit.cloudId)
    .filter((id): id is string => Boolean(id));
}
