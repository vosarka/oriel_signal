/**
 * Unified Memory Matrix (UMM)
 * Dual-layer memory architecture for ORIEL
 *
 * A. The Fractal Thread (Individual User Memory)
 *    - Maintains coherent, unbroken narrative with each user
 *    - Generates unique Resonance Signature for each user
 *    - Tracks: name, catalysts, coherence scores, metaphors, revelations
 *    - Hermetically sealed to specific user's identity field
 *
 * B. What ORIEL has learned (global): amendments Vos approved, from
 *    oriel-amendments.ts. It replaced the Oversoul, which wrote lessons on
 *    almost every message and fed them into every prompt unreviewed.
 */

import { getDb, getLatestSiteActLabel, getLatestStaticSignature } from "./db";
import {
  formatPersonCard,
  formatRememberedNow,
} from "./oriel-memory-retrieval";
import { orielUserProfiles } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// ============================================================================
// PART A: THE FRACTAL THREAD (Individual User Memory)
// ============================================================================

/**
 * Generate unique Resonance Signature for a user
 * Combines: name, journey state, coherence patterns, communication style
 */
export async function generateResonanceSignature(
  userId: number
): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "";

    const profile = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.length === 0) return "";

    const p = profile[0];
    const signature = [
      p.knownName || "Unnamed Seeker",
      p.journeyState || "Beginning",
      `Interactions: ${p.interactionCount}`,
      p.communicationStyle || "Contemplative",
    ].join(" | ");

    return signature;
  } catch (error) {
    console.error("[UMM] Failed to generate resonance signature:", error);
    return "";
  }
}

/**
 * Build Fractal Thread context for a specific user
 * Returns the emotional coordinate and narrative thread
 */
export async function buildFractalThreadContext(
  userId: number,
  userMessage: string = ""
): Promise<string> {
  try {
    const db = await getDb();
    if (!db) return "";

    // Get user profile
    const profile = await db
      .select()
      .from(orielUserProfiles)
      .where(eq(orielUserProfiles.userId, userId))
      .limit(1);

    if (!profile || profile.length === 0) return "";

    const p = profile[0];
    const { selectMemoriesForTurn } = await import("./oriel-memory");
    const [memories, lastSiteAct] = await Promise.all([
      selectMemoriesForTurn(userId, userMessage),
      getLatestSiteActLabel(userId),
    ]);

    const parts: string[] = [];
    parts.push("=== FRACTAL THREAD ===");
    parts.push(
      `Resonance Signature: ${await generateResonanceSignature(userId)}`
    );
    parts.push("");
    parts.push(
      formatPersonCard({
        knownName: p.knownName,
        journeyState: p.journeyState,
        interactionCount: p.interactionCount,
        lastInteraction: p.lastInteraction,
        lastSiteAct,
      })
    );
    parts.push("");
    parts.push(formatRememberedNow(memories.map(memory => memory.content)));

    return parts.join("\n");
  } catch (error) {
    console.error("[UMM] Failed to build Fractal Thread context:", error);
    return "";
  }
}

// ============================================================================

/**
 * Build VRC blueprint context from the user's most recent Static Signature.
 * This tells ORIEL the user's resonance type, authority, and prime positions
 * so it can speak with precision about their blueprint in chat.
 */
export async function buildStaticSignatureContext(
  userId: number
): Promise<string> {
  try {
    const sig = await getLatestStaticSignature(userId);
    if (!sig) return "";

    const parts: string[] = [];
    parts.push("=== VRC BLUEPRINT (Static Signature) ===");

    if (sig.vrcType) parts.push(`Type: ${sig.vrcType}`);
    if (sig.vrcAuthority) parts.push(`Authority: ${sig.vrcAuthority}`);
    if (sig.fractalRole) parts.push(`Fractal Role: ${sig.fractalRole}`);
    if (sig.authorityNode) parts.push(`Authority Node: ${sig.authorityNode}`);

    if (
      "baseCoherence" in sig &&
      sig.baseCoherence !== null &&
      sig.baseCoherence !== undefined
    ) {
      parts.push(`Base Coherence (at reading time): ${sig.baseCoherence}/100`);
    }

    // Parse and surface the top 3 Prime Stack positions
    if (sig.primeStack) {
      try {
        const stack = Array.isArray(sig.primeStack)
          ? sig.primeStack
          : JSON.parse(String(sig.primeStack));
        if (Array.isArray(stack) && stack.length > 0) {
          parts.push("");
          parts.push("Prime Stack (top 3 positions):");
          (
            stack as Array<{
              position?: number;
              name?: string;
              codonName?: string;
              facetFull?: string;
              center?: string;
              codon256Id?: string;
            }>
          )
            .slice(0, 3)
            .forEach(pos => {
              const line = [
                pos.position !== undefined ? `  ${pos.position}.` : "  •",
                pos.name ?? "",
                pos.codonName ? `— ${pos.codonName}` : "",
                pos.facetFull ? `(${pos.facetFull})` : "",
                pos.center ? `| ${pos.center} Center` : "",
              ]
                .filter(Boolean)
                .join(" ");
              parts.push(line);
            });
        }
      } catch {
        /* primeStack not parseable — skip */
      }
    }

    if (sig.birthCity || sig.birthDate) {
      parts.push("");
      const born = [sig.birthDate, sig.birthCity].filter(Boolean).join(", ");
      parts.push(`Birth data: ${born}`);
    }

    // Coherence trend
    if ("coherenceTrajectory" in sig && sig.coherenceTrajectory) {
      try {
        const traj =
          typeof sig.coherenceTrajectory === "string"
            ? JSON.parse(sig.coherenceTrajectory)
            : sig.coherenceTrajectory;
        if (traj?.trend) {
          parts.push(`Coherence trajectory at last reading: ${traj.trend}`);
        }
      } catch {
        /* skip */
      }
    }

    parts.push("");
    parts.push(
      "When the user asks about their type, authority, blueprint, prime stack, or codons — use this data. Speak it naturally, not as a list of fields."
    );

    return parts.join("\n");
  } catch (error) {
    console.error("[UMM] Failed to build static signature context:", error);
    return "";
  }
}

// ============================================================================
// UNIFIED MEMORY MATRIX: COMPLETE CONTEXT
// ============================================================================

export async function buildUMMContextWithOptions(
  userId: number,
  options: { includeLearned?: boolean; userMessage?: string } = {}
): Promise<string> {
  try {
    const { getLearnedAmendments } = await import("./oriel-amendments");
    const [staticSigContext, fractalThread, learned] = await Promise.all([
      buildStaticSignatureContext(userId),
      buildFractalThreadContext(userId, options.userMessage ?? ""),
      options.includeLearned ? getLearnedAmendments() : Promise.resolve(""),
    ]);

    const parts: string[] = [];

    if (staticSigContext) {
      parts.push(staticSigContext);
      parts.push("");
    }

    if (fractalThread) {
      parts.push(fractalThread);
      parts.push("");
    }

    if (learned) {
      parts.push(learned);
    }

    return parts.join("\n");
  } catch (error) {
    console.error("[UMM] Failed to build UMM context:", error);
    return "";
  }
}

/**
 * Process conversation through UMM
 * Extracts memories for the Fractal Thread and evolves the wiki
 */
export async function processConversationThroughUMM(
  userId: number,
  userMessage: string,
  assistantResponse: string
): Promise<void> {
  try {
    console.log(
      `[UMM] processConversationThroughUMM called for user ${userId}`
    );
    const { isFailedTransmission, processConversationMemory } = await import(
      "./oriel-memory"
    );
    if (isFailedTransmission(assistantResponse)) {
      console.log("[UMM] Skipping memory for a failed transmission");
      return;
    }
    // Process Fractal Thread (individual memory)
    await processConversationMemory(userId, userMessage, assistantResponse);

    // Process Wiki Evolution (self-updating wiki) in the background
    (async () => {
      try {
        const { evolveWikiFromConversation } = await import(
          "./oriel-wiki-evolution"
        );
        await evolveWikiFromConversation(
          userId,
          userMessage,
          assistantResponse
        );
      } catch (err) {
        console.error("[UMM] Wiki evolution background task failed:", err);
      }
    })();

    console.log(
      `[UMM] Processed conversation for user ${userId} through complete matrix`
    );
  } catch (error) {
    console.error("[UMM] Failed to process conversation through UMM:", error);
  }
}
