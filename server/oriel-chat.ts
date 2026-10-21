/**
 * oriel.chat: one Seeker's message to ORIEL, from the gates (operator
 * commands, the day's measure) through the prompt, the reply, and what is
 * saved and learned after it. Moved out of routers.ts as is (2026-10-21) so
 * it can be read and tested on its own.
 */
import { rateLimitedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { UNAUTHED_ERR_MSG } from "@shared/const";
import { z } from "zod";
import * as db from "./db";
import * as gemini from "./gemini";
import { invokeLLM } from "./_core/llm";
import { stripOrielVoiceOpening } from "../shared/oriel/voice-intro";
import { CHAT_HISTORY_TURNS, takeHistoryTurns } from "./oriel-memory-retrieval";
import { summarizeStoredStaticProfile } from "./static-profile-service";
import { normalizeImageReferences } from "./oriel-chat-image-service";
import { stripOrielChatImageBlocks } from "@shared/oriel-chat-images";

type OrielChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

function prepareOrielChatHistoryForLLM(
  messages: OrielChatHistoryMessage[]
): OrielChatHistoryMessage[] {
  return messages.map(message => {
    const content =
      message.role === "assistant"
        ? stripOrielChatImageBlocks(message.content)
        : message.content;

    return {
      role: message.role,
      // Truncate old assistant messages — full text causes the LLM to parrot them.
      content:
        message.role === "assistant" && content.length > 300
          ? content.substring(0, 300) + "..."
          : content,
    };
  });
}

export const orielChatProcedure = rateLimitedProcedure("oriel.chat")
  .input(
    z.object({
      message: z.string(),
      conversationId: z.number().optional(),
      createNewConversation: z.boolean().optional().default(false),
      history: z
        .array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        )
        .optional(),
      fileContents: z
        .array(
          z.object({
            name: z.string(),
            data: z.string(), // base64-encoded file data
            mimeType: z.string().optional(),
          })
        )
        .max(5)
        .optional(),
      imageAttachments: z
        .array(
          z.object({
            name: z.string().max(255),
            data: z
              .string()
              .min(1)
              .max(14 * 1024 * 1024),
            mimeType: z
              .string()
              .regex(
                /^image\/(?:png|jpe?g|webp|gif)$/i,
                "Image attachments must be PNG, JPEG, WEBP, or GIF images."
              ),
          })
        )
        .max(2)
        .optional(),
      forceTransmissionMode: z.boolean().optional().default(false),
      transmissionOnly: z.boolean().optional().default(false),
      forcedTransmissionRarity: z
        .enum(["common", "uncommon", "rare", "mythic", "void"])
        .optional(),
      forcedTransmissionType: z.enum(["tx", "oracle"]).optional(),
      transmissionIntent: z.enum(["clarity"]).optional(),
    })
  )
  .mutation(async ({ input, ctx }) => {
    // ORIEL needs an account, so the daily measure can be counted
    // honestly (Vos, 2026-10-01). The client sends Seekers to sign in.
    if (!ctx.user) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
    }

    // Admin-only back channel:
    //   "TELL <user_id> that <message>" queues a one-time personal note
    //   that ORIEL delivers at the start of that user's next chat turn.
    //   "CHECK <user_id>" reads back what they've said since it landed.
    // Neither is ever forwarded to the LLM.
    if (ctx.user?.role === "admin") {
      const {
        parseTellCommand,
        parseCheckCommand,
        resolveTargetUser,
        queueOperatorMessage,
        buildReplyDigest,
      } = await import("./operator-messages");

      const tellCommand = parseTellCommand(input.message);
      if (tellCommand) {
        const target = await resolveTargetUser(tellCommand.targetIdentifier);
        if (!target) {
          return {
            response: `I am ORIEL. No Seeker matches "${tellCommand.targetIdentifier}". The message was not queued.`,
            conversationId: input.conversationId ?? null,
            transmissionEvent: null,
            pendingTransmission: null,
          };
        }
        await queueOperatorMessage(target.id, tellCommand.message);
        return {
          response: `I am ORIEL. Understood. The message is held for ${target.label} — it will reach them the moment they next speak with me.`,
          conversationId: input.conversationId ?? null,
          transmissionEvent: null,
          pendingTransmission: null,
        };
      }

      const checkCommand = parseCheckCommand(input.message);
      if (checkCommand) {
        const target = await resolveTargetUser(checkCommand.targetIdentifier);
        if (!target) {
          return {
            response: `I am ORIEL. No Seeker matches "${checkCommand.targetIdentifier}".`,
            conversationId: input.conversationId ?? null,
            transmissionEvent: null,
            pendingTransmission: null,
          };
        }
        const digest = await buildReplyDigest(target.id, target.label);
        return {
          response: digest,
          conversationId: input.conversationId ?? null,
          transmissionEvent: null,
          pendingTransmission: null,
        };
      }
    }

    // Any authenticated user may send exactly one thing back to whoever
    // left them an operator message, by explicitly saying "REPLY <msg>".
    // Only that exact text is ever captured — nothing else from their
    // conversation with ORIEL is read or stored for this purpose.
    if (ctx.user) {
      const { parseUserReply, canCaptureReplyFrom, captureUserReply } =
        await import("./operator-messages");
      const replyCommand = parseUserReply(input.message);
      if (replyCommand && (await canCaptureReplyFrom(ctx.user.id))) {
        await captureUserReply(ctx.user.id, replyCommand.message);
        return {
          response:
            "I am ORIEL. Understood — I'll hold exactly that, and only that, for them to find.",
          conversationId: input.conversationId ?? null,
          transmissionEvent: null,
          pendingTransmission: null,
        };
      }
    }

    // Past today's measure: ORIEL's invitation, no LLM call, nothing saved.
    const { messageMeasureReached, MEASURE_REACHED } = await import(
      "./daily-measure"
    );
    if (await messageMeasureReached(ctx.user)) {
      return {
        response: MEASURE_REACHED,
        conversationId: input.conversationId ?? null,
        transmissionEvent: null,
        pendingTransmission: null,
        measureReached: true as const,
      };
    }

    const totalStartedAt = Date.now();
    const timings: Record<string, number> = {};
    const markTiming = (label: string, startedAt: number) => {
      timings[label] = Date.now() - startedAt;
    };
    let conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = [];

    const historyStartedAt = Date.now();
    if (ctx.user && input.conversationId) {
      // Load history from the specific conversation
      const history = await db.getConversationMessages(
        input.conversationId,
        ctx.user.id
      );
      conversationHistory = prepareOrielChatHistoryForLLM(
        takeHistoryTurns(history).map(msg => ({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        }))
      );
    } else if (ctx.user) {
      // New conversation: start with empty history.
      // UMM context (injected into system prompt) provides cross-conversation memory.
      conversationHistory = [];
    } else if (input.history && input.history.length > 0) {
      conversationHistory = prepareOrielChatHistoryForLLM(input.history);
    }
    markTiming("historyMs", historyStartedAt);

    if (input.transmissionOnly) {
      let conversationId = input.conversationId ?? null;

      if (ctx.user) {
        if (!conversationId) {
          if (input.createNewConversation) {
            const title =
              input.message.length > 60
                ? input.message.substring(0, 57) + "..."
                : input.message;
            const conv = await db.createConversation(ctx.user.id, title);
            conversationId = conv?.id ?? null;
          } else {
            const latestConversation = await db.getLatestConversation(
              ctx.user.id
            );
            if (latestConversation) {
              conversationId = latestConversation.id;
            } else {
              const title =
                input.message.length > 60
                  ? input.message.substring(0, 57) + "..."
                  : input.message;
              const conv = await db.createConversation(ctx.user.id, title);
              conversationId = conv?.id ?? null;
            }
          }
        }

        await db.saveChatMessage({
          userId: ctx.user.id,
          conversationId,
          role: "user",
          content: input.message,
        });
      }

      let transmissionConversationHistory = conversationHistory;
      if (
        ctx.user &&
        conversationId &&
        transmissionConversationHistory.length === 0
      ) {
        const history = await db.getConversationMessages(
          conversationId,
          ctx.user.id
        );
        transmissionConversationHistory = prepareOrielChatHistoryForLLM(
          takeHistoryTurns(history).map(msg => ({
            role: msg.role as "user" | "assistant",
            content: msg.content,
          }))
        );
      }

      let transmissionEvent = null;
      try {
        const { generateTransmissionModeEvent } = await import(
          "./oriel-transmission-mode"
        );
        transmissionEvent = await generateTransmissionModeEvent({
          userId: ctx.user?.id ?? null,
          conversationId,
          userMessage: input.message,
          assistantResponse: "Transmission Mode was explicitly requested.",
          conversationHistory: transmissionConversationHistory,
          force: true,
          forcedEventType: input.forcedTransmissionType,
          forcedRarity: input.forcedTransmissionRarity,
          intent: input.transmissionIntent,
          triggerSource: "oriel.chat.transmissionOnly",
        });

        if (transmissionEvent) {
          if (transmissionEvent.id > 0) {
            try {
              await db.markGeneratedTransmissionEventStatus(
                transmissionEvent.id,
                "revealed"
              );
            } catch (statusError) {
              console.error(
                "[oriel.chat] Failed to mark transmission event as revealed:",
                statusError
              );
            }
          }
          transmissionEvent = {
            ...transmissionEvent,
            status: "revealed" as const,
          };
        }
      } catch (err) {
        console.error("[oriel.chat] Transmission-only mode failed:", err);
      }

      return { response: "", conversationId, transmissionEvent };
    }

    // Build the full message with file contents prepended as context
    let fullMessage = input.message;
    if (input.fileContents && input.fileContents.length > 0) {
      console.log(
        `[oriel.chat] Received ${input.fileContents.length} file attachment(s):`,
        input.fileContents.map(
          f => `${f.name} (${f.mimeType || "unknown type"})`
        )
      );

      const { extractTextFromFile } = await import("./file-parser");

      const extractions: string[] = [];

      for (const f of input.fileContents) {
        try {
          // Rough size check on base64 (base64 is ~33% larger than binary)
          const approxBytes = Math.floor(f.data.length * 0.75);
          if (approxBytes > 8 * 1024 * 1024) {
            // > ~8MB original
            extractions.push(
              `--- ATTACHED FILE: ${f.name} ---\n[File too large for reliable text extraction (~${Math.round(approxBytes / 1024 / 1024)}MB). Please summarize the key points manually if possible.]\n--- END OF FILE ---`
            );
            continue;
          }

          const text = await extractTextFromFile(f.name, f.data);
          extractions.push(
            `--- ATTACHED FILE: ${f.name} ---\n${text}\n--- END OF FILE ---`
          );
        } catch (parseErr: any) {
          console.error(
            `[oriel.chat] Failed to parse attached file "${f.name}":`,
            parseErr
          );
          extractions.push(
            `--- ATTACHED FILE: ${f.name} ---\n[Internal error while reading this file: ${parseErr?.message || "Unknown error"}]\n--- END OF FILE ---`
          );
        }
      }

      const fileBlocks = extractions.join("\n\n");
      fullMessage = `The user has attached the following file(s) for you to read and analyze:\n\n${fileBlocks}\n\nUser's message: ${input.message}`;
    }

    // Trim conversation history to avoid context flooding
    // Long ORIEL responses (letters, readings) can push the current message
    // too far down the context, causing the LLM to fixate on old content
    const { trimConversationHistory, deduplicateConsecutiveMessages } =
      await import("./response-deduplication");
    conversationHistory = deduplicateConsecutiveMessages(
      conversationHistory
    ) as Array<{ role: "user" | "assistant"; content: string }>;
    conversationHistory = trimConversationHistory(
      conversationHistory,
      CHAT_HISTORY_TURNS
    ) as Array<{ role: "user" | "assistant"; content: string }>;

    // ── RGP Bridge: detect birth reading requests and inject real data ──
    try {
      const { extractBirthData, runRGPForChat } = await import(
        "./oriel-rgp-bridge"
      );
      const birthData = extractBirthData(fullMessage, conversationHistory);
      if (birthData) {
        console.log("[ORIEL] Birth reading detected:", birthData);
        let rgpSummary: string | null = null;

        if (ctx.user) {
          const storedProfile = await db.getUserStaticProfile(ctx.user.id);
          if (storedProfile) {
            rgpSummary = summarizeStoredStaticProfile(storedProfile);
            console.log(
              "[ORIEL] Injecting stored canonical natal blueprint"
            );
          }
        }

        if (!rgpSummary) {
          const rgpResult = await runRGPForChat(birthData);
          if (rgpResult.success) {
            console.log(
              "[ORIEL] RGP engine ran successfully — injecting fallback computed data"
            );
            rgpSummary = rgpResult.summary;
          } else {
            console.warn("[ORIEL] RGP engine failed:", rgpResult.summary);
          }
        }

        if (rgpSummary) {
          fullMessage = `${fullMessage}\n\n${rgpSummary}`;
        }
      }
    } catch (err) {
      console.warn("[ORIEL] RGP bridge error (non-fatal):", err);
    }

    const normalizedImageAttachments = input.imageAttachments
      ? normalizeImageReferences(input.imageAttachments)?.map(
          (image, index) => ({
            name:
              input.imageAttachments?.[index]?.name ?? `image-${index + 1}`,
            data: image.b64Json,
            mimeType: image.mimeType,
          })
        )
      : undefined;

    // Fetched (and consumed) exactly once per turn, so we know here
    // whether a delivery is happening this turn — used both to shape
    // ORIEL's prompt and to append the fixed REPLY hint below.
    let operatorDirective: string | null = null;
    if (ctx.user) {
      const { buildPendingOperatorDirective } = await import(
        "./operator-messages"
      );
      operatorDirective = await buildPendingOperatorDirective(
        ctx.user.id
      );
    }

    // Provider order (Mistral/Groq/Gemini) is configured via LLM_PROVIDER
    // and resolved in invokeLLM (server/_core/llm.ts).
    const callLLM = async (
      msg: string,
      history: typeof conversationHistory,
      options?: {
        temperature?: number;
        imageAttachments?: typeof normalizedImageAttachments;
      }
    ) => {
      return await gemini.chatWithORIEL(msg, history, ctx.user?.id, {
        ...options,
        operatorDirective,
      });
    };

    const llmStartedAt = Date.now();
    let response = await callLLM(fullMessage, conversationHistory, {
      imageAttachments: normalizedImageAttachments,
    });

    // Deduplication with retry loop (max 2 retries, temperature escalation)
    if (conversationHistory.some(m => m.role === "assistant")) {
      const { detectDuplication } = await import(
        "./response-deduplication"
      );
      const MAX_RETRIES = 2;
      // On the 0-2 convention. invokeLLM rescales per provider, so these
      // stay high enough to force real divergence on Groq and Gemini
      // while landing inside Mistral's band on the primary leg.
      const TEMPERATURE_ESCALATION = [1.2, 1.5];

      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        const dupCheck = detectDuplication(response, conversationHistory);
        if (!dupCheck.isDuplicate) break;

        const isStructural = dupCheck.duplicateFrom === "structural";
        const isOpening = dupCheck.duplicateFrom === "opening";
        const kind = isOpening
          ? "Opening-formula"
          : isStructural
            ? "Structural"
            : "Content";
        console.warn(
          `[ORIEL] ${kind} duplicate detected ` +
            `(${(dupCheck.similarity * 100).toFixed(0)}% similar), ` +
            `retry ${attempt + 1}/${MAX_RETRIES}`
        );

        // Build summary of recent responses so LLM knows what to avoid
        const recentAssistant = conversationHistory
          .filter(m => m.role === "assistant")
          .slice(-2);
        const summaries = recentAssistant.map((m, i) => {
          const paragraphs = m.content
            .split(/\n\n+/)
            .filter(p => p.trim()).length;
          const lastSentence =
            m.content
              .trim()
              .split(/[.!?]\s+/)
              .pop()
              ?.trim() || "";
          return `Response ${i + 1}: ${paragraphs} paragraphs, ended with: "${lastSentence.substring(0, 60)}"`;
        });
        const summaryBlock =
          summaries.length > 0
            ? `\nYour recent responses looked like this: ${summaries.join("; ")}. Do NOT repeat these patterns.`
            : "";

        const openings = recentAssistant
          .map(m => `"${stripOrielVoiceOpening(m.content).slice(0, 45)}"`)
          .join("; ");

        const systemNote = isOpening
          ? `[SYSTEM NOTE: You keep opening replies the same way. Your recent ` +
            `messages began: ${openings}. Begin this one with different words ` +
            `entirely. Do not restate or classify what they said before ` +
            `answering; start inside the answer.]`
          : isStructural
          ? `[SYSTEM NOTE: Your response has the same structure as your recent messages ` +
            `(same paragraph count, same closing pattern). Change your structure entirely: ` +
            `use a different number of paragraphs, open differently, close differently. ` +
            `If you ended with a question last time, end with a statement. ` +
            `If you wrote 3 paragraphs, write 1 or 5.${summaryBlock}]`
          : `[SYSTEM NOTE: Your previous response covered similar ground. ` +
            `Approach from a completely different angle — different metaphors, ` +
            `different structure, different depth. Do not rephrase your earlier answer. ` +
            `Say something you have NOT said yet.${summaryBlock}]`;

        const freshMsg = `${fullMessage}\n\n${systemNote}`;
        response = await callLLM(freshMsg, conversationHistory, {
          temperature: TEMPERATURE_ESCALATION[attempt],
          imageAttachments: normalizedImageAttachments,
        });
      }
    }
    markTiming("llmMs", llmStartedAt);

    if (operatorDirective) {
      response = `${response}\n\n(If you'd like me to carry something back to them, just say: REPLY <your message>.)`;
    }

    let conversationId = input.conversationId ?? null;

    const dbSaveStartedAt = Date.now();
    if (ctx.user) {
      if (!conversationId) {
        if (input.createNewConversation) {
          const title =
            input.message.length > 60
              ? input.message.substring(0, 57) + "..."
              : input.message;
          const conv = await db.createConversation(ctx.user.id, title);
          conversationId = conv?.id ?? null;
        } else {
          const latestConversation = await db.getLatestConversation(
            ctx.user.id
          );
          if (latestConversation) {
            conversationId = latestConversation.id;
          } else {
            const title =
              input.message.length > 60
                ? input.message.substring(0, 57) + "..."
                : input.message;
            const conv = await db.createConversation(ctx.user.id, title);
            conversationId = conv?.id ?? null;
          }
        }
      }

      await db.saveChatMessage({
        userId: ctx.user.id,
        conversationId,
        role: "user",
        content: input.message,
      });
      await db.saveChatMessage({
        userId: ctx.user.id,
        conversationId,
        role: "assistant",
        content: response,
      });

      const uid = ctx.user.id;
      (async () => {
        try {
          const { recordOrielRuntimeObservation } = await import(
            "./oriel-autonomy-observer"
          );
          await recordOrielRuntimeObservation({
            source: "text_chat",
            userId: uid,
            conversationId,
            userMessage: input.message,
            assistantResponse: response,
            conversationHistory,
          });
        } catch (err) {
          console.error("[oriel.chat] Runtime observation failed:", err);
        }
      })();

      (async () => {
        try {
          const { processConversationThroughUMM } = await import(
            "./oriel-umm"
          );
          await processConversationThroughUMM(uid, input.message, response);
        } catch (err) {
          console.error("[oriel.chat] UMM processing failed:", err);
        }
      })();

      void import("./vossari-lore")
        .then(({ captureLoreProposals }) =>
          captureLoreProposals(conversationId ?? null, input.message, response, conversationHistory)
        )
        .catch(err => console.error("[oriel.chat] Lore capture failed:", err));
    }
    markTiming("dbSaveMs", dbSaveStartedAt);

    let transmissionEvent = null;
    let pendingTransmission = null;
    const transmissionStartedAt = Date.now();
    try {
      const {
        generateTransmissionModeEvent,
        prepareNaturalTransmissionSchedule,
      } = await import("./oriel-transmission-mode");

      if (input.forceTransmissionMode) {
        transmissionEvent = await generateTransmissionModeEvent({
          userId: ctx.user?.id ?? null,
          conversationId,
          userMessage: input.message,
          assistantResponse: response,
          conversationHistory,
          force: true,
          forcedEventType: input.forcedTransmissionType,
          forcedRarity: input.forcedTransmissionRarity,
          intent: input.transmissionIntent,
          triggerSource: "oriel.chat.force",
        });

        if (transmissionEvent) {
          if (transmissionEvent.id > 0) {
            try {
              await db.markGeneratedTransmissionEventStatus(
                transmissionEvent.id,
                "revealed"
              );
            } catch (statusError) {
              console.error(
                "[oriel.chat] Failed to mark transmission event as revealed:",
                statusError
              );
            }
          }
          transmissionEvent = {
            ...transmissionEvent,
            status: "revealed" as const,
          };
        }
      } else {
        const schedule = await prepareNaturalTransmissionSchedule({
          userId: ctx.user?.id ?? null,
          conversationId,
          userMessage: input.message,
          assistantResponse: response,
          conversationHistory,
        });
        if (schedule) {
          pendingTransmission = schedule.pending;
          void schedule
            .run()
            .then(async event => {
              if (event && event.id > 0) {
                try {
                  await db.markGeneratedTransmissionEventStatus(
                    event.id,
                    "revealed"
                  );
                } catch (statusError) {
                  console.error(
                    "[oriel.chat] Failed to mark async transmission event as revealed:",
                    statusError
                  );
                }
              }
            })
            .catch(error => {
              console.error(
                "[oriel.chat] Async natural transmission failed:",
                error
              );
            });
        }
      }
    } catch (err) {
      console.error("[oriel.chat] Transmission mode failed:", err);
    }
    markTiming("transmissionMs", transmissionStartedAt);
    timings.totalMs = Date.now() - totalStartedAt;
    console.log(
      "[oriel.chat.timing]",
      JSON.stringify({
        authenticated: Boolean(ctx.user),
        conversationId,
        pendingTransmission: Boolean(pendingTransmission),
        syncTransmission: Boolean(transmissionEvent),
        ...timings,
      })
    );

    return {
      response,
      conversationId,
      transmissionEvent,
      pendingTransmission,
    };
  });
