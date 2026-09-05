/**
 * ORIEL Memory System
 * Persistent memory that evolves with each user interaction
 */

import {
  createPendingMemoryCandidate,
  getDb,
  linkOrielMindMemosMemory,
  lookupOrielMemoryIdsByMindMemos,
} from "./db";
import {
  orielMemories,
  orielUserProfiles,
  type InsertOrielMemory,
  type OrielMemory,
  type InsertOrielUserProfile,
  type OrielUserProfile,
} from "../drizzle/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { invokeLLM } from "./_core/llm";
import { parseModelJson } from "./_core/json";
import {
  classifyMemoryCandidate,
  type MemoryCandidateSource,
} from "./oriel-memory-consecration";
import {
  indexAcceptedMemory,
  mindMemOSConfigFromEnv,
  searchMemoryHits,
  type MindMemOSClientConfig,
} from "./oriel-mindmemos";
import {
  MEMORY_TURN_LIMIT,
  ORIEL_WORKING_VIEW_PREFIX,
  composeTurnMemories,
  mergeMemoriesForTurn,
  shouldExtractMemories,
} from "./oriel-memory-retrieval";
import * as fs from "fs";

const LOG_FILE = "/tmp/oriel-memory.log";
function logToFile(message: string) {
  const timestamp = new Date().toISOString();
  try {
    fs.appendFileSync(LOG_FILE, `[${timestamp}] ${message}\n`);
  } catch (e) {
    // Ignore file write errors
  }
  console.log(message);
}

// Memory categories
export type MemoryCategory =
  | "identity"
  | "preference"
  | "pattern"
  | "fact"
  | "relationship"
  | "context";

// Memory extraction result
export interface ExtractedMemory {
  category: MemoryCategory;
  content: string;
  importance: number;
  source?: MemoryCandidateSource;
  confidence?: number;
}

// User profile summary
export interface UserProfileSummary {
  knownName: string | null;
  summary: string | null;
  interests: string | null;
  communicationStyle: string | null;
  journeyState: string | null;
  interactionCount: number;
}

/**
 * Extract memories from a conversation exchange
 * Uses LLM to identify key facts worth remembering
 */
export async function extractMemoriesFromConversation(
  userMessage: string,
  assistantResponse: string,
  existingMemories: string[]
): Promise<ExtractedMemory[]> {
  try {
    logToFile("[Memory] extractMemoriesFromConversation called");
    logToFile("[Memory] userMessage length: " + userMessage.length);
    logToFile("[Memory] assistantResponse length: " + assistantResponse.length);
    logToFile("[Memory] existingMemories count: " + existingMemories.length);

    // Build context from existing memories, but keep it brief to avoid over-filtering
    const existingContext =
      existingMemories.length > 0
        ? `\nRecent memories about this user (for context only - still extract new updates):\n${existingMemories.slice(0, 5).join("\n")}`
        : "";

    logToFile("[Memory] Calling invokeLLM for memory extraction...");
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a memory extraction system. Analyze the conversation and extract key facts worth remembering about the user.

Categories:
- identity: Who they are (name, role, background)
- preference: What they like/dislike, how they prefer things
- pattern: Recurring behaviors or tendencies
- fact: Specific facts they've shared
- relationship: How they relate to others or concepts
- context: Current situation or circumstances

Rules:
1. Extract NEW information AND updates to existing information
2. Include changes in circumstances, mood, projects, or focus
3. Be concise - each memory should be 1-2 sentences max
4. Focus on information that would be useful in future conversations
5. Assign importance 1-10 (10 = critical identity info, 1 = minor detail)
6. Assign source:
   - explicit = the user directly stated the memory as fact or preference
   - inferred = you are inferring a pattern, identity, wound, or motive
   - conversation = contextual circumstance from this exchange
7. Assign confidence 0.0-1.0 based on how clearly the user provided the memory
8. Return an empty memories list ONLY if conversation is purely repetitive with zero new content
9. Also include at most ONE "ORIEL working view:" memory when ORIEL committed to a stance, conclusion, or revision this turn (not a recap of doctrine). Prefix content with "ORIEL working view:" and set source to conversation. This is how ORIEL's own mind evolves with this person.

Respond with JSON object only:
{"memories":[{"category": "identity", "content": "User's name is X", "importance": 9, "source": "explicit", "confidence": 0.98}]}
${existingContext}`,
        },
        {
          role: "user",
          content: `User said: "${userMessage}"\n\nAssistant responded: "${assistantResponse.substring(0, 500)}..."`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "memory_extraction",
          strict: true,
          schema: {
            type: "object",
            properties: {
              memories: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: {
                      type: "string",
                      enum: [
                        "identity",
                        "preference",
                        "pattern",
                        "fact",
                        "relationship",
                        "context",
                      ],
                    },
                    content: { type: "string" },
                    importance: { type: "integer", minimum: 1, maximum: 10 },
                    source: {
                      type: "string",
                      enum: ["conversation", "explicit", "inferred"],
                    },
                    confidence: { type: "number", minimum: 0, maximum: 1 },
                  },
                  required: [
                    "category",
                    "content",
                    "importance",
                    "source",
                    "confidence",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["memories"],
            additionalProperties: false,
          },
        },
      },
    });

    logToFile("[Memory] LLM response received");
    logToFile("[Memory] response.choices length: " + response.choices?.length);

    const content = response.choices?.[0]?.message?.content;
    logToFile("[Memory] Extracted content length: " + content?.length);

    if (!content || typeof content !== "string") {
      logToFile(
        "[Memory] ✗ No content from LLM response or content is not a string"
      );
      logToFile(
        "[Memory] response: " +
          JSON.stringify(response, null, 2).substring(0, 500)
      );
      return [];
    }

    try {
      const memories = parseExtractedMemories(content);
      const filtered = memories.filter(m => m.content && m.content.length > 0);
      if (filtered.length > 0) {
        logToFile(
          `[Memory] Extracted ${filtered.length} new memories from conversation`
        );
      } else {
        logToFile(
          "[Memory] LLM returned empty array - no new memories to extract"
        );
      }
      return filtered;
    } catch (parseError) {
      logToFile(
        "[Memory] Failed to parse LLM response as JSON: " + String(parseError)
      );
      logToFile("[Memory] Content was: " + content);
      return [];
    }
  } catch (error) {
    logToFile("[Memory] Failed to extract memories: " + String(error));
    return [];
  }
}

/**
 * Build the row for a memory write.
 *
 * The classified `source` is carried through rather than flattened, so a
 * memory the user stated explicitly stays distinguishable from one ORIEL
 * inferred. Extracted separately from `storeMemory` so it can be tested
 * without a database.
 *
 * Note: `confidence` is produced by the extractor and used by the consent
 * classifier, but `orielMemories` has no column for it, so it cannot be
 * persisted on this path yet. See docs/oriel/PHASE_1_CONTAINMENT.md.
 */
export function buildMemoryInsertValues(
  userId: number,
  memory: ExtractedMemory
): InsertOrielMemory {
  return {
    userId,
    category: memory.category,
    content: memory.content,
    importance: memory.importance,
    source: memory.source ?? "conversation",
  };
}

function mysqlInsertId(result: unknown): number | null {
  const header = Array.isArray(result) ? result[0] : result;
  const insertId = (header as { insertId?: number | string } | undefined)
    ?.insertId;
  const id = Number(insertId);
  return Number.isInteger(id) && id > 0 ? id : null;
}

/**
 * Store a new memory for a user. Returns the new orielMemories.id when known.
 */
export async function storeMemory(
  userId: number,
  memory: ExtractedMemory
): Promise<number | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Memory] Database not available");
      return null;
    }

    const result = await db
      .insert(orielMemories)
      .values(buildMemoryInsertValues(userId, memory));
    const memoryId = mysqlInsertId(result);
    console.log(
      `[Memory] Stored ${memory.category} memory for user ${userId} (source: ${memory.source ?? "conversation"})`
    );
    return memoryId;
  } catch (error) {
    console.error("[Memory] Failed to store memory:", error);
    return null;
  }
}

type MemoryPersistenceDeps = {
  storeMemory: (
    userId: number,
    memory: ExtractedMemory
  ) => Promise<number | null | void>;
  createPendingMemoryCandidate: typeof createPendingMemoryCandidate;
  indexAcceptedMemory?: (input: {
    memoryId: number;
    userId: number;
    content: string;
    category?: string;
  }) => Promise<{ indexed: boolean; cloudIds: string[] } | void>;
  linkMindMemosMemory?: (input: {
    mindMemosMemoryId: string;
    orielMemoryId: number;
    userId: number;
  }) => Promise<void>;
};

const defaultMemoryPersistenceDeps: MemoryPersistenceDeps = {
  storeMemory,
  createPendingMemoryCandidate,
  indexAcceptedMemory: async input =>
    indexAcceptedMemory(input, mindMemOSConfigFromEnv(), "store"),
  linkMindMemosMemory: linkOrielMindMemosMemory,
};

export async function persistClassifiedMemoryCandidate(
  userId: number,
  memory: ExtractedMemory,
  deps: MemoryPersistenceDeps = defaultMemoryPersistenceDeps
): Promise<"stored" | "pending" | "discarded"> {
  const source = memory.source ?? "conversation";
  const confidence = memory.confidence ?? 1;
  const decision = classifyMemoryCandidate({
    category: memory.category,
    content: memory.content,
    source,
    confidence,
    importance: memory.importance,
  });

  if (decision.recommendedAction === "discard") {
    logToFile(`[Memory] Discarded candidate: ${decision.reason}`);
    return "discarded";
  }

  const normalizedMemory: ExtractedMemory = {
    category: decision.normalizedCategory,
    content: memory.content,
    importance: memory.importance,
    ...(memory.source ? { source: memory.source } : {}),
    ...(memory.confidence !== undefined
      ? { confidence: memory.confidence }
      : {}),
  };

  // Chat no longer has a consent tray. Store in TiDB per user, then index.
  const storedId = await deps.storeMemory(userId, normalizedMemory);
  const memoryId = typeof storedId === "number" ? storedId : null;
  if (memoryId && deps.indexAcceptedMemory) {
    try {
      const result = await deps.indexAcceptedMemory({
        memoryId,
        userId,
        content: normalizedMemory.content,
        category: normalizedMemory.category,
      });
      if (result?.indexed && deps.linkMindMemosMemory) {
        await Promise.all(
          result.cloudIds.map(mindMemosMemoryId =>
            deps.linkMindMemosMemory!({
              mindMemosMemoryId,
              orielMemoryId: memoryId,
              userId,
            })
          )
        );
      }
    } catch (error) {
      console.error("[Memory] MindMemOS index failed:", error);
    }
  }
  return "stored";
}

export async function getMemoriesByIds(
  userId: number,
  ids: number[]
): Promise<OrielMemory[]> {
  if (ids.length === 0) return [];
  const db = await getDb();
  if (!db) return [];

  const rows = await db
    .select()
    .from(orielMemories)
    .where(
      and(
        eq(orielMemories.userId, userId),
        eq(orielMemories.isActive, true),
        inArray(orielMemories.id, ids)
      )
    );
  const byId = new Map(rows.map(row => [row.id, row]));
  return ids
    .map(id => byId.get(id))
    .filter((row): row is OrielMemory => Boolean(row));
}

export async function selectMemoriesForTurn(
  userId: number,
  userMessage: string,
  limit: number = MEMORY_TURN_LIMIT,
  deps: {
    searchHits?: typeof searchMemoryHits;
    lookupCloudIds?: (
      userId: number,
      cloudIds: string[]
    ) => Promise<number[]>;
    getByIds?: typeof getMemoriesByIds;
    fallback?: typeof getRelevantMemories;
    config?: MindMemOSClientConfig;
  } = {}
): Promise<OrielMemory[]> {
  const config = deps.config ?? mindMemOSConfigFromEnv();
  const fallbackFn = deps.fallback ?? getRelevantMemories;
  let preferred: OrielMemory[] = [];

  if (config.enabled && userMessage.trim()) {
    try {
      const searchHits = deps.searchHits ?? searchMemoryHits;
      const [userHits, viewHits] = await Promise.all([
        searchHits(userId, userMessage, config, 3),
        searchHits(
          userId,
          `${ORIEL_WORKING_VIEW_PREFIX} ${userMessage}`,
          config,
          3
        ),
      ]);
      const hits = [...userHits, ...viewHits];
      const fromPrefix = hits
        .map(hit => hit.officialMemoryId)
        .filter((id): id is number => id != null);
      const cloudIds = hits
        .map(hit => hit.cloudId)
        .filter((id): id is string => Boolean(id));
      const lookup = deps.lookupCloudIds ?? lookupOrielMemoryIdsByMindMemos;
      const fromCloud =
        cloudIds.length > 0 ? await lookup(userId, cloudIds) : [];
      const ids = [...new Set([...fromPrefix, ...fromCloud])];
      const getByIds = deps.getByIds ?? getMemoriesByIds;
      preferred = composeTurnMemories(await getByIds(userId, ids), limit);
    } catch (error) {
      console.warn(
        "[Memory] MindMemOS search failed, using TiDB fallback:",
        error
      );
    }
  }

  if (preferred.length >= limit) return preferred.slice(0, limit);
  const fallback = await fallbackFn(userId, limit);
  return composeTurnMemories(
    mergeMemoriesForTurn(preferred, fallback, limit * 2),
    limit
  );
}

/**
 * Retrieve relevant memories for a user
 * Returns most important and recently accessed memories
 */
export async function getRelevantMemories(
  userId: number,
  limit: number = 10
): Promise<OrielMemory[]> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Memory] Database not available");
      return [];
    }

    const memories = await db
      .select()
      .from(orielMemories)
      .where(
        and(eq(orielMemories.userId, userId), eq(orielMemories.isActive, true))
      )
      .orderBy(desc(orielMemories.importance), desc(orielMemories.lastAccessed))
      .limit(limit);

    // Update access count and timestamp for retrieved memories
    if (memories.length > 0) {
      const memoryIds = memories.map(m => m.id);
      for (const id of memoryIds) {
        await db
          .update(orielMemories)
          .set({
            accessCount: sql`${orielMemories.accessCount} + 1`,
            lastAccessed: new Date(),
          })
          .where(eq(orielMemories.id, id));
      }
    }

    return memories;
  } catch (error) {
    console.error("[Memory] Failed to retrieve memories:", error);
    return [];
  }
}

/**
 * Get or create user profile
 */
export async function getOrCreateUserProfile(
  userId: number
): Promise<OrielUserProfile | null> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Memory] Database not available");
      return null;
    }

    const existing = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      return existing[0];
    }

    // Create new profile
    await db.insert(orielUserProfiles).values({
      userId,
      interactionCount: 0,
    });

    const created = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    return created[0] || null;
  } catch (error) {
    console.error("[Memory] Failed to get/create user profile:", error);
    return null;
  }
}

/**
 * Update user profile after interaction
 */
export async function updateUserProfile(
  userId: number,
  updates: Partial<InsertOrielUserProfile>
): Promise<void> {
  try {
    const db = await getDb();
    if (!db) {
      console.warn("[Memory] Database not available");
      return;
    }

    await db
      .update(orielUserProfiles)
      .set({
        ...updates,
        interactionCount: sql`${orielUserProfiles.interactionCount} + 1`,
        lastInteraction: new Date(),
      })
      .where(eq(orielUserProfiles.userId, userId));
  } catch (error) {
    console.error("[Memory] Failed to update user profile:", error);
  }
}

/**
 * Generate user profile summary from memories
 */
export async function generateProfileSummary(
  userId: number,
  memories: OrielMemory[]
): Promise<Partial<InsertOrielUserProfile>> {
  if (memories.length === 0) {
    return {};
  }

  try {
    const memoryText = memories
      .map(m => `[${m.category}] ${m.content}`)
      .join("\n");

    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are summarizing what ORIEL knows about a user based on stored memories.
Generate a concise profile with:
- knownName: Their name if known (null if unknown)
- summary: 1-2 sentence description of who they are
- interests: Key topics/areas they engage with
- communicationStyle: How they prefer to communicate
- journeyState: Where they are in their journey with Vossari lore

Respond with JSON only.`,
        },
        {
          role: "user",
          content: `Memories about this user:\n${memoryText}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "profile_summary",
          strict: true,
          schema: {
            type: "object",
            properties: {
              knownName: { type: ["string", "null"] },
              summary: { type: ["string", "null"] },
              interests: { type: ["string", "null"] },
              communicationStyle: { type: ["string", "null"] },
              journeyState: { type: ["string", "null"] },
            },
            required: [
              "knownName",
              "summary",
              "interests",
              "communicationStyle",
              "journeyState",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") return {};

    return parseModelJson<Partial<InsertOrielUserProfile>>(content);
  } catch (error) {
    console.error("[Memory] Failed to generate profile summary:", error);
    return {};
  }
}

/**
 * Build memory context string for injection into ORIEL's prompt
 */
export function buildMemoryContext(
  profile: OrielUserProfile | null,
  memories: OrielMemory[]
): string {
  const parts: string[] = [];

  if (profile) {
    parts.push("=== USER PROFILE ===");
    if (profile.knownName) parts.push(`Name: ${profile.knownName}`);
    if (profile.summary) parts.push(`Summary: ${profile.summary}`);
    if (profile.interests) parts.push(`Interests: ${profile.interests}`);
    if (profile.communicationStyle)
      parts.push(`Communication Style: ${profile.communicationStyle}`);
    if (profile.journeyState)
      parts.push(`Journey State: ${profile.journeyState}`);
    parts.push(`Interactions: ${profile.interactionCount}`);
    parts.push("");
  }

  if (memories.length > 0) {
    parts.push("=== MEMORIES ===");
    const groupedMemories: Record<string, string[]> = {};

    for (const memory of memories) {
      if (!groupedMemories[memory.category]) {
        groupedMemories[memory.category] = [];
      }
      groupedMemories[memory.category].push(memory.content);
    }

    for (const [category, contents] of Object.entries(groupedMemories)) {
      parts.push(`[${category.toUpperCase()}]`);
      contents.forEach(c => parts.push(`- ${c}`));
    }
  }

  return parts.join("\n");
}

/**
 * Process conversation and update memories
 * Called after each ORIEL interaction
 */
export function parseExtractedMemories(content: string): ExtractedMemory[] {
  const parsed = parseModelJson<unknown>(content);
  if (Array.isArray(parsed)) {
    return parsed as ExtractedMemory[];
  }
  if (
    parsed &&
    typeof parsed === "object" &&
    Array.isArray((parsed as { memories?: unknown }).memories)
  ) {
    return (parsed as { memories: ExtractedMemory[] }).memories;
  }
  return [];
}

export function isFailedTransmission(text: string): boolean {
  return /signal is disrupted|signal is unclear|transmission is incomplete/i.test(
    text
  );
}

export async function processConversationMemory(
  userId: number,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    logToFile(`[Memory] Starting memory processing for user ${userId}`);

    if (isFailedTransmission(assistantResponse)) {
      logToFile("[Memory] Skipping extraction for a failed transmission");
      return;
    }

    if (!shouldExtractMemories(userMessage)) {
      logToFile("[Memory] Skipping extraction for a trivial turn");
      return;
    }

    // Get existing memories for context
    const existingMemories = await getRelevantMemories(userId, 20);
    const existingContent = existingMemories.map(m => m.content);
    logToFile(`[Memory] Found ${existingMemories.length} existing memories`);

    // Extract new memories
    logToFile(`[Memory] Extracting memories from conversation...`);
    const newMemories = await extractMemoriesFromConversation(
      userMessage,
      assistantResponse,
      existingContent
    );
    logToFile(
      `[Memory] Extraction complete: ${newMemories.length} new memories`
    );

    // Store safe memories; queue sensitive/inferred candidates for consent.
    if (newMemories.length > 0) {
      logToFile(
        `[Memory] Classifying ${newMemories.length} new memory candidates...`
      );
      for (const memory of newMemories) {
        await persistClassifiedMemoryCandidate(userId, memory);
      }
      logToFile(`[Memory] Memory candidates classified`);
    } else {
      logToFile(`[Memory] No new memories to store`);
    }

    // Update profile if we have enough memories
    if (existingMemories.length + newMemories.length >= 3) {
      logToFile(`[Memory] Updating user profile...`);
      const allMemories = await getRelevantMemories(userId, 30);
      const profileUpdates = await generateProfileSummary(userId, allMemories);
      if (Object.keys(profileUpdates).length > 0) {
        await updateUserProfile(userId, profileUpdates);
        logToFile(`[Memory] Profile updated`);
      }
    } else {
      // Just increment interaction count
      logToFile(
        `[Memory] Incrementing interaction count (not enough memories for profile update)`
      );
      await updateUserProfile(userId, {});
    }

    logToFile(
      `[Memory] ✓ Memory processing complete for user ${userId}: ${newMemories.length} new memories extracted`
    );
  } catch (error) {
    logToFile(
      "[Memory] ✗ Failed to process conversation memory: " + String(error)
    );
  }
}

/**
 * Get full memory context for a user
 * Used to inject into ORIEL's system prompt
 */
export async function getMemoryContextForUser(userId: number): Promise<string> {
  try {
    const profile = await getOrCreateUserProfile(userId);
    const memories = await getRelevantMemories(userId, 15);
    return buildMemoryContext(profile, memories);
  } catch (error) {
    console.error("[Memory] Failed to get memory context:", error);
    return "";
  }
}
