import { systemRouter } from "./_core/systemRouter";
import {
  publicProcedure,
  protectedProcedure,
  adminProcedure,
  rateLimitedProcedure,
  router,
} from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { isSupporter } from "@shared/supporter-access";
import { isBreathPrompt } from "@shared/breath-prompts";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createHash } from "crypto";
import { verifyCredentialPassword } from "./_core/auth";
import * as db from "./db";
import * as gemini from "./gemini";
import {
  performDiagnosticReading,
  performEvolutionaryAssistance,
} from "./oriel-diagnostic-engine";
import { generateChunkedSpeech, audioToDataUrl } from "./oriel-tts-chain";

// Spoken breath protocol lines, by voice. Six fixed lines, so no eviction.
const breathAudioCache = new Map<string, string>();
import { rgpRouter } from "./rgp-router";
import { orielChatProcedure } from "./oriel-chat";
import { geocodeCity, getTimezoneIdForCoords } from "./geocoding";
import {
  formatOrielResponse,
  generateOrielGreeting,
  generateMicroCorrectionMessage,
  generateFalsifierMessage,
} from "./oriel-system-prompt";
import { buildOrielPromptContext } from "./oriel-prompt-context";
import { getTodaysSignal, listDailySignals } from "./daily-signal-service";
import { publishOracle } from "./oracle-stream-service";
import { findAccounts, listSupporters, markPatron, setDonated, unmarkPatron } from "./patrons";
import { invokeLLM, LLM_LONGFORM_MAX_TOKENS } from "./_core/llm";
import {
  sendPasswordRecoveryGuidanceEmail,
  sendPasswordResetCodeEmail,
} from "./_core/mailer";
import * as autonomy from "./oriel-autonomy";
import { ENV } from "./_core/env";
import {
  buildUserStaticProfile,
  resolveStoredNatalInputForRecompute,
} from "./static-profile-service";
import { calculateBirthChart } from "./ephemeris-service";
import {
  facetNameToLetter,
  longitudeToCodonFacet,
} from "./rgp-256-codon-engine";
import { getCurrentResonanceForUser } from "./oriel-current-resonance";
import { buildProfileConsoleSummary } from "./profile-console-summary";
import { generateOrielChatImage } from "./oriel-chat-image-service";
import { parseActivations } from "@shared/codon-wheel";
import {
  captureFounderEditionPayPalOrder,
  createFounderEditionPayPalOrder,
  createTetradicFounderEditionCheckpoint,
  createSignatureCheckout,
  generateSignatureDraftForOrder,
  generateSignatureSnapshotForOrder,
  getFinalSignaturePdfUrl,
  getSignatureLetterAdminOrder,
  getSignatureOrderBundleForUser,
  listSignatureLetterAdminOrders,
  markFounderEditionDelivered,
  markFounderEditionInProgress,
  markSignatureDelivered,
  markSignatureFollowupUsed,
  markSignatureInCuration,
  saveSignatureDraft,
  submitSignatureIntake,
  uploadFinalSignaturePdf,
} from "./signature-letter-service";

function normalizeEmail(email: string) {
  return email.toLowerCase().trim();
}

function hashResetCode(email: string, code: string) {
  return createHash("sha256")
    .update(`${normalizeEmail(email)}:${code}`)
    .digest("hex");
}

function setPrivateWheelCacheHeaders(
  res: { setHeader?: (name: string, value: string) => void } | undefined,
  receiverId: number,
  calculatedAt: Date | null
) {
  res?.setHeader?.("Vary", "Cookie");

  if (!calculatedAt) {
    res?.setHeader?.("Cache-Control", "private, no-store");
    return;
  }

  const cacheKey = createHash("sha256")
    .update(`${receiverId}:${calculatedAt.toISOString()}`)
    .digest("hex");
  res?.setHeader?.("Cache-Control", "private, no-cache");
  res?.setHeader?.("ETag", `"wheel-${cacheKey}"`);
  res?.setHeader?.("X-Wheel-Cache-Key", cacheKey);
}

function normalizeOptionalText(
  value: string | undefined,
  emptyValue: string | null | undefined = null
) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : emptyValue;
}

function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function normalizeReadingCodons(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean);
  if (typeof value === "string")
    return value
      .split(",")
      .map(item => item.trim())
      .filter(Boolean);
  return [];
}

function normalizeNumberRecord(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).filter(
      ([, raw]) => typeof raw === "number" && Number.isFinite(raw)
    )
  ) as Record<string, number>;
}

const natalProfileInputSchema = z.object({
  birthDate: z.string().min(1),
  birthTime: z.string().min(1),
  birthCity: z.string().min(1),
  birthCountry: z.string().min(1),
  latitude: z.number(),
  longitude: z.number(),
  timezoneId: z.string().optional(),
});

const signatureProductTypeSchema = z.enum(["glimpse", "founding"]);
const signatureIntakeInputSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  birthDate: z.string().min(1),
  birthTime: z.string().min(1),
  birthPlace: z.string().min(1),
  birthCountry: z.string().min(1),
  timezone: z.string().min(1),
  focusQuestion: z.string().min(1),
  preferredTone: z.enum(["mystical", "practical", "balanced"]),
  avoidAssumptions: z.string().optional().default(""),
  consentAccepted: z.boolean(),
});
const tetradicFounderEditionIntakeSchema = z
  .object({
    birthDate: z.string().trim().min(1).max(32),
    birthTime: z.string().trim().min(1).max(32),
    birthPlace: z.string().trim().min(1).max(255),
    birthCountry: z.string().trim().min(1).max(255),
    questionOne: z.string().trim().min(1).max(4_000),
    questionTwo: z.string().trim().min(1).max(4_000),
    consent: z.literal(true),
  })
  .strict();

/** What a Seeker brings to a personal transmission. */
const readingInput = z
  .object({
    intention: z.string().max(600).optional(),
    useMemories: z.boolean().optional(),
  })
  .optional();

export const appRouter = router({
  system: systemRouter,
  rgp: rgpRouter,

  /** Founder's Reading: one personal transmission, bought once. */
  foundersReading: router({
    status: publicProcedure.query(async () => {
      const { foundersReadingStatus } = await import("./transmission-service");
      return foundersReadingStatus();
    }),
    order: protectedProcedure
      .input(readingInput)
      .mutation(async ({ ctx, input }) => {
      const { orderFoundersReading } = await import("./transmission-service");
      try {
        return await orderFoundersReading(ctx.user, input);
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        console.error("[FoundersReading] order failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "PayPal could not open the order. Please try again shortly.",
        });
      }
    }),
    capture: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ input, ctx }) => {
        const { captureFoundersReading } = await import("./transmission-service");
        try {
          return await captureFoundersReading(ctx.user, input.id);
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          console.error("[FoundersReading] capture failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PayPal has not confirmed the payment yet. Refresh in a minute.",
          });
        }
      }),
  }),

  /** The private player. The token is the key; no login. */
  personalTransmissions: router({
    play: publicProcedure
      .input(z.object({ token: z.string().max(64) }))
      .query(async ({ input }) => {
        const { playTransmission } = await import("./transmission-service");
        return playTransmission(input.token);
      }),
  }),

  /** The rings of the field: the gift each new ring brings, kept or given by link. */
  rings: router({
    myGifts: protectedProcedure.query(async ({ ctx }) => {
      const { myGifts } = await import("./ring-gifts");
      return myGifts(ctx.user.id);
    }),
    claim: protectedProcedure
      .input(z.object({ giftId: z.number().int().positive(), kind: z.enum(["founders_reading", "garden_month"]) }))
      .mutation(async ({ ctx, input }) => {
        const { claimGift } = await import("./ring-gifts");
        return claimGift(ctx.user.id, input.giftId, input.kind);
      }),
    gift: publicProcedure
      .input(z.object({ token: z.string().regex(/^[0-9a-f]{32}$/) }))
      .query(async ({ input }) => {
        const { giftByToken } = await import("./ring-gifts");
        return giftByToken(input.token);
      }),
    redeem: protectedProcedure
      .input(z.object({ token: z.string().regex(/^[0-9a-f]{32}$/) }))
      .mutation(async ({ ctx, input }) => {
        const { redeemGift } = await import("./ring-gifts");
        return redeemGift(ctx.user, input.token);
      }),
  }),

  /** The Garden's PayPal subscriptions (Etapa 2). */
  garden: router({
    /** One month of a plot, paid once with no renewal (for banks that refuse recurring payments). */
    buyMonth: protectedProcedure
      .input(z.object({ plan: z.enum(["garden", "deep_garden"]) }))
      .mutation(async ({ input, ctx }) => {
        const { supporterKind } = await import("@shared/supporter-access");
        if (supporterKind(ctx.user) === "garden") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Your Garden subscription is already open; it renews through PayPal.",
          });
        }
        const { buyGardenMonth } = await import("./garden-month");
        try {
          return { approveUrl: await buyGardenMonth(ctx.user, input.plan) };
        } catch (error) {
          console.error("[GardenMonth] order failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PayPal could not open the payment. Please try again shortly.",
          });
        }
      }),
    captureMonth: protectedProcedure
      .input(z.object({ orderId: z.string().min(1).max(96) }))
      .mutation(async ({ input, ctx }) => {
        const { captureGardenMonth } = await import("./garden-month");
        try {
          return await captureGardenMonth(ctx.user, input.orderId);
        } catch (error) {
          console.error("[GardenMonth] capture failed:", error);
          return { active: false };
        }
      }),
    subscribe: protectedProcedure
      .input(z.object({ plan: z.enum(["garden", "deep_garden"]) }))
      .mutation(async ({ input, ctx }) => {
        const { supporterKind } = await import("@shared/supporter-access");
        // A second subscription would bill twice; changing plans goes
        // through PayPal until upgrades are wired.
        if (supporterKind(ctx.user) === "garden" && ctx.user.subscriptionStatus === "active") {
          throw new TRPCError({
            code: "CONFLICT",
            message: "You are already in the Garden. To change plans, cancel the current one in PayPal first.",
          });
        }
        const { startGardenSubscription } = await import("./garden-paypal");
        try {
          return { approveUrl: await startGardenSubscription(ctx.user.id, input.plan) };
        } catch (error) {
          console.error("[Garden] subscribe failed:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "PayPal could not open the subscription. Please try again shortly.",
          });
        }
      }),

    confirm: protectedProcedure
      .input(z.object({ subscriptionId: z.string().max(64) }))
      .mutation(async ({ input, ctx }) => {
        const { confirmGardenSubscription } = await import("./garden-paypal");
        try {
          return { active: await confirmGardenSubscription(ctx.user.id, input.subscriptionId) };
        } catch (error) {
          console.error("[Garden] confirm failed:", error);
          return { active: false };
        }
      }),
  }),

  geo: router({
    geocode: publicProcedure
      .input(z.object({ city: z.string().min(1) }))
      .query(async ({ input }) => {
        const { displayName, latitude, longitude } = await geocodeCity(
          input.city
        );
        const tzId = getTimezoneIdForCoords(latitude, longitude);
        return { displayName, latitude, longitude, tzId };
      }),
  }),

  auth: router({
    /** Returns the currently authenticated user (from the legacy users table) */
    me: publicProcedure.query(async opts => {
      const u = opts.ctx.user;
      if (!u) return null;
      // Strip sensitive fields before sending to client
      const { passwordHash: _ph, googleId: _gid, ...safe } = u as any;
      const [hasNatalProfile, introFilmSeen] = await Promise.all([
        db.hasUserStaticProfile(u.id),
        db.hasSeenIntroFilm(u.id),
      ]);
      return {
        ...safe,
        hasNatalProfile,
        introFilmSeen,
      };
    }),
    /** The intro film plays once per Seeker; this records that it has. */
    markIntroFilmSeen: protectedProcedure.mutation(async ({ ctx }) => {
      await db.markIntroFilmSeen(ctx.user.id);
      return { success: true };
    }),
    /**
     * Logout is now handled by Better Auth at POST /api/auth/sign-out.
     * This tRPC endpoint is kept as a convenience wrapper.
     */
    logout: publicProcedure.mutation(async ({ ctx }) => {
      // Better Auth manages session cookies — just signal success
      // The client will call authClient.signOut() which hits Better Auth directly
      return { success: true } as const;
    }),
    requestPasswordResetCode: publicProcedure
      .input(z.object({ email: z.string().email() }))
      .mutation(async ({ input }) => {
        const email = normalizeEmail(input.email);
        const baUser = await db.getBetterAuthUserByEmail(email);

        if (!baUser) {
          // No account, but don't leak existence
          return { success: true } as const;
        }

        // Always allow reset code for any baUser (including social/legacy).
        // This allows users to set a password for email login.
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const codeHash = hashResetCode(email, code);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

        await db.storePasswordResetCode(email, codeHash, expiresAt);
        await sendPasswordResetCodeEmail(email, code);
        return { success: true } as const;
      }),
    resetPasswordWithCode: publicProcedure
      .input(
        z.object({
          email: z.string().email(),
          code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code."),
          newPassword: z
            .string()
            .min(8, "Password must be at least 8 characters."),
        })
      )
      .mutation(async ({ input }) => {
        const email = normalizeEmail(input.email);
        const baUser = await db.getBetterAuthUserByEmail(email);
        if (!baUser) {
          throw new Error("Invalid or expired reset code.");
        }

        const storedCodeValid = await db.consumePasswordResetCode(
          email,
          hashResetCode(email, input.code)
        );
        if (!storedCodeValid) {
          throw new Error("Invalid or expired reset code.");
        }

        const newPasswordHash = await bcrypt.hash(input.newPassword, 12);

        // Create credential account if it doesn't exist (supports social/legacy users setting a password)
        const existingCredential = await db.getCredentialAccountForUser(baUser.id);
        if (!existingCredential) {
          await db.createCredentialAccount(baUser.id, email, newPasswordHash);
        } else {
          await db.updateCredentialPassword(baUser.id, newPasswordHash);
        }

        // Keep legacy in sync if present
        const legacyUser = await db.getUserByEmail(email);
        if (legacyUser) {
          await db.setUserPasswordHash(legacyUser.openId, newPasswordHash);
        }

        return { success: true } as const;
      }),

    /**
     * Change password for a logged-in user who has (or will have) email+password.
     * Requires the current password for security.
     */
    changePassword: protectedProcedure
      .input(
        z.object({
          currentPassword: z.string(),
          newPassword: z.string().min(8, "New password must be at least 8 characters."),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user?.email) {
          throw new Error("Not authenticated.");
        }

        const email = normalizeEmail(ctx.user.email);
        const baUser = await db.getBetterAuthUserByEmail(email);
        if (!baUser) {
          throw new Error("Account not found.");
        }

        const currentHash = await db.getCredentialPasswordHash(baUser.id);
        if (!currentHash) {
          // Allow setting password even if none existed (e.g. social user adding one)
          const newHash = await bcrypt.hash(input.newPassword, 12);
          await db.createCredentialAccount(baUser.id, email, newHash);
          const legacy = await db.getUserByEmail(email);
          if (legacy) {
            await db.setUserPasswordHash(legacy.openId, newHash);
          }
          return { success: true } as const;
        }

        // Verify current password using better-auth's logic (supports bcrypt + legacy scrypt)
        const isValid = await verifyCredentialPassword({
          password: input.currentPassword,
          hash: currentHash,
        });

        if (!isValid) {
          throw new Error("Current password is incorrect.");
        }

        const newPasswordHash = await bcrypt.hash(input.newPassword, 12);
        await db.updateCredentialPassword(baUser.id, newPasswordHash);

        const legacyUser = await db.getUserByEmail(email);
        if (legacyUser) {
          await db.setUserPasswordHash(legacyUser.openId, newPasswordHash);
        }

        return { success: true } as const;
      }),
  }),

  signature: router({
    createFounderEditionCheckpoint: protectedProcedure
      .input(tetradicFounderEditionIntakeSchema)
      .mutation(async ({ ctx, input }) => {
        return createTetradicFounderEditionCheckpoint({
          userId: ctx.user.id,
          userName: ctx.user.name,
          userEmail: ctx.user.email,
          intake: input,
        });
      }),

    createFounderEditionPayPalOrder: protectedProcedure
      .input(
        z
          .object({
            orderId: z.number().int().positive(),
          })
          .strict()
      )
      .mutation(async ({ ctx, input }) => {
        return createFounderEditionPayPalOrder({
          orderId: input.orderId,
          userId: ctx.user.id,
        });
      }),

    captureFounderEditionPayPalOrder: protectedProcedure
      .input(
        z
          .object({
            orderId: z.number().int().positive(),
          })
          .strict()
      )
      .mutation(async ({ ctx, input }) => {
        return captureFounderEditionPayPalOrder({
          orderId: input.orderId,
          userId: ctx.user.id,
        });
      }),

    createCheckout: protectedProcedure
      .input(
        z.object({
          productType: signatureProductTypeSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        return createSignatureCheckout({
          userId: ctx.user.id,
          userEmail: ctx.user.email,
          productType: input.productType,
        });
      }),

    getOrder: protectedProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
        })
      )
      .query(async ({ ctx, input }) => {
        return getSignatureOrderBundleForUser({
          orderId: input.orderId,
          userId: ctx.user.id,
        });
      }),

    submitIntake: protectedProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
          intake: signatureIntakeInputSchema,
        })
      )
      .mutation(async ({ ctx, input }) => {
        return submitSignatureIntake({
          orderId: input.orderId,
          userId: ctx.user.id,
          intake: input.intake,
        });
      }),

    getFinalPdfUrl: protectedProcedure
      .input(
        z.object({
          orderId: z.number().int().positive(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        return getFinalSignaturePdfUrl({
          orderId: input.orderId,
          userId: ctx.user.id,
        });
      }),
  }),

  // Archive/Signals router
  signals: router({
    list: publicProcedure.query(async () => {
      return db.getAllSignals();
    }),

    decodeTriptych: publicProcedure
      .input(
        z.object({
          signalId: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const signal = await db.getSignalById(input.signalId);
        if (!signal) {
          throw new Error("Signal not found");
        }

        // Execute three parallel Gemini API calls for the triptych
        const [metadata, visual, verse] = await Promise.all([
          gemini.generateSignalMetadata(signal.title, signal.snippet),
          gemini.generateSignalVisual(signal.title, signal.snippet),
          gemini.generateCrypticVerse(signal.title, signal.snippet),
        ]);

        return {
          metadata,
          visual,
          verse,
          signal,
        };
      }),
  }),

  // Artifacts router
  artifacts: router({
    list: publicProcedure.query(async () => {
      return db.getAllArtifacts();
    }),

    generateLoreAndImage: rateLimitedProcedure("oriel.imageLore")
      .input(
        z.object({
          artifactId: z.number(),
        })
      )
      .mutation(async ({ input }) => {
        const artifact = await db.getArtifactById(input.artifactId);
        if (!artifact) {
          throw new Error("Artifact not found");
        }

        // Generate lore first
        const lore = await gemini.generateArtifactLore(
          artifact.name,
          artifact.referenceSignalId || undefined
        );

        // Then generate image based on the lore
        const imageUrl = await gemini.generateArtifactImage(
          artifact.name,
          lore
        );

        // Update artifact in database
        if (imageUrl) {
          await db.updateArtifact(input.artifactId, { imageUrl });
        }

        return {
          lore,
          imageUrl,
        };
      }),

    expandLore: rateLimitedProcedure("oriel.imageLore")
      .input(
        z.object({
          artifactId: z.number(),
          currentLore: z.string(),
        })
      )
      .mutation(async ({ input }) => {
        const artifact = await db.getArtifactById(input.artifactId);
        if (!artifact) {
          throw new Error("Artifact not found");
        }

        const expandedLore = await gemini.expandArtifactLore(
          artifact.name,
          input.currentLore
        );

        return {
          expandedLore,
        };
      }),
  }),

  // ORIEL Interface router
  oriel: router({
    // The chat consent tray was removed 2026-08-29 and nothing in the live
    // extraction path creates pending candidates anymore (see
    // persistClassifiedMemoryCandidate in server/oriel-memory.ts) — these
    // candidate endpoints are dormant infra for a possible future consent-gate
    // phase. listAccepted, forget and forgetAll serve the profile (2026-10-21).
    memory: router({
      listPendingCandidates: protectedProcedure
        .input(
          z
            .object({
              limit: z.number().min(1).max(50).default(25),
            })
            .optional()
        )
        .query(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");
          return db.listPendingMemoryCandidates(
            ctx.user.id,
            input?.limit ?? 25
          );
        }),

      listAccepted: protectedProcedure
        .input(
          z
            .object({
              limit: z.number().min(1).max(50).default(25),
            })
            .optional()
        )
        .query(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");
          return db.listAcceptedMemories(ctx.user.id, input?.limit ?? 25);
        }),

      // The profile's "What ORIEL remembers": a Seeker lets ORIEL forget.
      forget: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          await db.forgetMemory(input.id, ctx.user.id);
          return { success: true };
        }),

      forgetAll: protectedProcedure.mutation(async ({ ctx }) => {
        await db.forgetAllMemories(ctx.user.id);
        return { success: true };
      }),

      acceptCandidate: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");
          const memory = await db.acceptPendingMemoryCandidate(
            input.id,
            ctx.user.id
          );
          return { success: true, memory };
        }),

      rejectCandidate: protectedProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");
          await db.rejectPendingMemoryCandidate(input.id, ctx.user.id);
          return { success: true };
        }),
    }),

    // ── Conversation management ──
    listConversations: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return [];
      // Auto-migrate orphaned messages (pre-conversation-system) into a conversation
      await db.migrateOrphanedMessages(ctx.user.id);
      return db.getUserConversations(ctx.user.id);
    }),

    getConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) return null;
        const conversation = await db.getConversationById(
          input.id,
          ctx.user.id
        );
        if (!conversation) return null;
        const messages = await db.getConversationMessages(
          input.id,
          ctx.user.id
        );
        return { ...conversation, messages };
      }),

    deleteConversation: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("Authentication required");
        await db.deleteConversation(input.id, ctx.user.id);
        return { success: true };
      }),

    getLatestGeneratedTransmissionEvent: protectedProcedure
      .input(
        z.object({
          conversationId: z.number(),
          after: z.string().min(1),
        })
      )
      .query(async ({ input, ctx }) => {
        const conversation = await db.getConversationById(
          input.conversationId,
          ctx.user.id
        );
        if (!conversation) return null;

        const afterMs = new Date(input.after).getTime();
        if (!Number.isFinite(afterMs)) return null;

        const events = await db.listGeneratedTransmissionEventsByConversation({
          conversationId: input.conversationId,
          limit: 30,
        });
        const event = events
          .filter(candidate => {
            const createdAt = new Date(candidate.createdAt).getTime();
            return (
              candidate.triggerSource === "oriel.chat" &&
              (candidate.status === "generated" ||
                candidate.status === "revealed") &&
              Number.isFinite(createdAt) &&
              createdAt > afterMs
            );
          })
          .sort(
            (a, b) =>
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          )[0];

        if (!event) return null;

        return {
          ...event,
          payload: safeJsonParse<Record<string, unknown>>(event.payload, {}),
          sourceContext: safeJsonParse<Record<string, unknown>>(
            event.sourceContext,
            {}
          ),
        };
      }),

    chat: orielChatProcedure,

    generateChatImage: rateLimitedProcedure("oriel.imageLore")
      .input(
        z.object({
          prompt: z.string().trim().min(1).max(2000),
          conversationId: z.number().int().positive().optional(),
          createNewConversation: z.boolean().optional().default(false),
          referenceImages: z
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
                    "Reference files must be PNG, JPEG, WEBP, or GIF images."
                  ),
              })
            )
            .max(2)
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        let conversationId = ctx.user ? (input.conversationId ?? null) : null;

        if (ctx.user && conversationId) {
          const conversation = await db.getConversationById(
            conversationId,
            ctx.user.id
          );
          if (!conversation) {
            throw new Error("Conversation not found.");
          }
        }

        if (ctx.user && !conversationId) {
          if (input.createNewConversation) {
            const titleBase = `Image: ${input.prompt}`;
            const title =
              titleBase.length > 60
                ? titleBase.substring(0, 57) + "..."
                : titleBase;
            const conv = await db.createConversation(ctx.user.id, title);
            conversationId = conv?.id ?? null;
          } else {
            const latestConversation = await db.getLatestConversation(
              ctx.user.id
            );
            if (latestConversation) {
              conversationId = latestConversation.id;
            } else {
              const titleBase = `Image: ${input.prompt}`;
              const title =
                titleBase.length > 60
                  ? titleBase.substring(0, 57) + "..."
                  : titleBase;
              const conv = await db.createConversation(ctx.user.id, title);
              conversationId = conv?.id ?? null;
            }
          }
        }

        const generated = await generateOrielChatImage({
          prompt: input.prompt,
          referenceImages: input.referenceImages,
        });

        if (ctx.user) {
          await db.saveChatMessage({
            userId: ctx.user.id,
            conversationId,
            role: "user",
            content: `Create image: ${input.prompt}`,
          });
          await db.saveChatMessage({
            userId: ctx.user.id,
            conversationId,
            role: "assistant",
            content: generated.response,
          });
        }

        return {
          response: generated.response,
          image: generated.image,
          imageUrl: generated.image.url,
          conversationId,
        };
      }),

    getHistory: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        return [];
      }
      const history = await db.getChatHistory(ctx.user.id, 50);
      return history.reverse();
    }),

    clearHistory: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      await db.clearChatHistory(ctx.user.id);
      return { success: true };
    }),

    generateSpeech: publicProcedure
      .input(
        z.object({
          text: z
            .string()
            .min(1, "Text is required")
            .max(20000, "Text too long for TTS"),
          voiceId: z
            .enum(["sophianic", "deep", "none"])
            .optional()
            .default("sophianic"),
          /** Chunk index within one spoken reply; only part 0 counts. */
          part: z.number().int().min(0).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          // If voiceId is 'none', skip TTS entirely
          if (input.voiceId === "none") {
            console.log("[generateSpeech] Voice disabled, skipping TTS");
            return {
              success: true,
              audioUrl: null,
            };
          }

          // Breath protocol lines are fixed: spoken once, cached, free.
          // Everything else is a paid reply: account plus daily measure.
          const breathKey = isBreathPrompt(input.text)
            ? `${input.voiceId}:${input.text}`
            : null;
          const cached = breathKey && breathAudioCache.get(breathKey);
          if (cached) return { success: true, audioUrl: cached };
          if (!breathKey) {
            if (!ctx.user) {
              return { success: false, error: "Sign in to hear ORIEL." };
            }
            const { takeVoice } = await import("./daily-measure");
            if (!takeVoice(ctx.user, input.text, input.part)) {
              return {
                success: false,
                error: "Today's spoken measure is complete.",
                measureReached: true as const,
              };
            }
          }

          console.log(
            "[generateSpeech] Starting TTS generation for text:",
            input.text.substring(0, 100),
            `(${input.text.length} chars) with voiceId: ${input.voiceId}`
          );

          let audioBase64: string;
          let audioUrl: string;

          // ORIEL's own voice names. The chain maps them to whichever
          // vendor answers, so a vendor swap never reaches this line.
          const { ORIEL_VOICES } = await import("./oriel-tts-chain");
          const orielVoice =
            input.voiceId === "deep"
              ? ORIEL_VOICES.deep
              : ORIEL_VOICES.sophianic;
          audioBase64 = await generateChunkedSpeech(input.text, orielVoice);
          audioUrl = audioToDataUrl(audioBase64);
          if (breathKey) breathAudioCache.set(breathKey, audioUrl);

          console.log(
            "[generateSpeech] Audio generated successfully, size:",
            audioBase64.length
          );
          return {
            success: true,
            audioUrl,
          };
        } catch (error) {
          const internalMsg =
            error instanceof Error ? error.message : String(error);
          console.error(
            "[generateSpeech] Failed to generate speech:",
            internalMsg
          );
          // Map known errors; never leak internal details to client
          const knownErrors: Record<string, string> = {
            ECONNREFUSED: "Voice service is temporarily unavailable",
            ETIMEDOUT: "Voice service timed out",
            "rate limit":
              "Voice service rate limit reached, please try again shortly",
          };
          const clientMsg =
            Object.entries(knownErrors).find(([key]) =>
              internalMsg.toLowerCase().includes(key.toLowerCase())
            )?.[1] ?? "Text-to-Speech generation failed";
          return {
            success: false,
            error: clientMsg,
          };
        }
      }),

    // Mutation to save user's voice preference
    setVoicePreference: protectedProcedure
      .input(
        z.object({
          voicePreference: z.enum(["sophianic", "deep", "none"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        try {
          await db.updateUserVoicePreference(
            ctx.user.id,
            input.voicePreference
          );
          return { success: true, voicePreference: input.voicePreference };
        } catch (error) {
          console.error(
            "[setVoicePreference] Failed to save preference:",
            error
          );
          throw new Error("Failed to save voice preference");
        }
      }),

    // Vossari Resonance Codex - Mode A: Diagnostic Reading
    diagnosticReading: publicProcedure
      .input(
        z.object({
          mentalNoise: z.number().min(0).max(10),
          bodyTension: z.number().min(0).max(10),
          emotionalTurbulence: z.number().min(0).max(10),
          breathCompletion: z.union([z.literal(0), z.literal(1)]),
          primeCodonSet: z.array(z.string()).optional(),
          fullCodonStack: z.array(z.string()).optional(),
          // New fields for reading type selection
          readingType: z
            .enum(["dynamic", "static"])
            .optional()
            .default("dynamic"),
          birthDate: z.string().optional(),
          birthTime: z.string().optional(),
          birthLocation: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const carrierlockState = {
            mentalNoise: input.mentalNoise,
            bodyTension: input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion: input.breathCompletion as 0 | 1,
          };

          // For static readings, we'll calculate codons from birth date
          let primeCodonSet = input.primeCodonSet || [];
          let fullCodonStack = input.fullCodonStack || [];

          if (input.readingType === "static" && input.birthDate) {
            // Calculate static signature codons from birth date
            const birthDateObj = new Date(input.birthDate);
            const dayOfYear = Math.floor(
              (birthDateObj.getTime() -
                new Date(birthDateObj.getFullYear(), 0, 0).getTime()) /
                (1000 * 60 * 60 * 24)
            );

            // Map day of year to codon (64 codons, ~5.7 days per codon)
            // Use actual days in year (365 or 366) to avoid out-of-bounds on leap years
            const year = birthDateObj.getFullYear();
            const daysInYear =
              (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
                ? 366
                : 365;
            const primaryCodon = Math.min(
              64,
              Math.floor((dayOfYear / daysInYear) * 64) + 1
            );
            const secondaryCodon = ((primaryCodon + 31) % 64) + 1; // Harmonic partner offset
            const tertiaryCodon = ((primaryCodon + 15) % 64) + 1; // Quarter offset

            primeCodonSet = [
              `RC${String(primaryCodon).padStart(2, "0")}`,
              `RC${String(secondaryCodon).padStart(2, "0")}`,
              `RC${String(tertiaryCodon).padStart(2, "0")}`,
            ];

            // Full stack includes more codons based on birth time if available
            fullCodonStack = [...primeCodonSet];
            if (input.birthTime) {
              const [hours] = input.birthTime.split(":").map(Number);
              const timeCodon = Math.floor((hours / 24) * 64) + 1;
              fullCodonStack.push(`RC${String(timeCodon).padStart(2, "0")}`);
            }
          }

          const result = await performDiagnosticReading(
            carrierlockState,
            primeCodonSet,
            fullCodonStack,
            input.readingType,
            input.birthDate,
            input.birthTime,
            input.birthLocation
          );

          return {
            success: true,
            data: result,
          };
        } catch (error) {
          console.error("Diagnostic reading error:", error);
          return {
            success: false,
            error: "Failed to perform diagnostic reading",
          };
        }
      }),

    getGreeting: publicProcedure.query(() => ({
      greeting: generateOrielGreeting(),
    })),

    searchArchive: publicProcedure
      .input(
        z.object({
          query: z.string(),
          limit: z.number().min(1).max(10).default(5),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const userPrompt = `Search the Vossari Archive for: "${input.query}". Return up to ${input.limit} results with their IDs, titles, status, and version. Format as a structured list.`;
          const systemPrompt = await buildOrielPromptContext({
            userId: ctx.user?.id,
            userMessage: userPrompt,
            conversationHistory: [],
          });
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });
          const content =
            typeof response.choices?.[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";
          return {
            success: true,
            results: formatOrielResponse("librarian", content),
          };
        } catch (error) {
          console.error("ORIEL search error:", error);
          return { success: false, error: "Failed to search archive" };
        }
      }),

    getPathway: publicProcedure
      .input(
        z.object({
          receiverStatus: z
            .enum(["newcomer", "receiver", "archivist", "operator"])
            .default("newcomer"),
          coherenceScore: z.number().min(0).max(100).optional(),
          interest: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const userPrompt = `Generate a guided pathway for a ${input.receiverStatus} with coherence score ${input.coherenceScore || "unknown"}${input.interest ? ` interested in ${input.interest}` : ""}. Suggest 3-5 next steps in order.`;
          const systemPrompt = await buildOrielPromptContext({
            userId: ctx.user?.id,
            userMessage: userPrompt,
            conversationHistory: [],
          });
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
          });
          const content =
            typeof response.choices?.[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";
          return {
            success: true,
            pathway: formatOrielResponse("guide", content),
          };
        } catch (error) {
          console.error("ORIEL pathway error:", error);
          return { success: false, error: "Failed to generate pathway" };
        }
      }),

    interpretReading: publicProcedure
      .input(
        z.object({
          coherenceScore: z.number().min(0).max(100),
          primaryCodon: z.string(),
          shadowPattern: z.string(),
          dominantFacet: z.enum(["A", "B", "C", "D"]),
          microCorrection: z.object({
            center: z.string(),
            facet: z.string(),
            action: z.string(),
            duration: z.string(),
            rationale: z.string(),
          }),
          falsifiers: z.array(
            z.object({
              claim: z.string(),
              testCondition: z.string(),
              falsifiedElement: z.string(),
            })
          ),
        })
      )
      .mutation(async ({ input }) => {
        try {
          return {
            success: true,
            interpretation: formatOrielResponse(
              "mirror",
              generateMicroCorrectionMessage(input.microCorrection),
              { coherenceScore: input.coherenceScore }
            ),
            falsifiers: generateFalsifierMessage(input.falsifiers),
          };
        } catch (error) {
          console.error("ORIEL interpretation error:", error);
          return { success: false, error: "Failed to interpret reading" };
        }
      }),

    generateTransmission: publicProcedure
      .input(
        z.object({
          transmissionId: z.string(),
          style: z
            .enum(["poetic", "clinical", "narrative", "ritual"])
            .default("narrative"),
          length: z.enum(["short", "medium", "long"]).default("medium"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        try {
          const userPrompt = `Generate a ${input.style} transmission for ID ${input.transmissionId} in ${input.length} form. Maintain the Vossari voice and aesthetic.`;
          const systemPrompt = await buildOrielPromptContext({
            userId: ctx.user?.id,
            userMessage: userPrompt,
            conversationHistory: [],
          });
          const response = await invokeLLM({
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: userPrompt },
            ],
            maxTokens: LLM_LONGFORM_MAX_TOKENS,
          });
          const content =
            typeof response.choices?.[0]?.message?.content === "string"
              ? response.choices[0].message.content
              : "";
          return {
            success: true,
            transmission: formatOrielResponse("narrator", content),
          };
        } catch (error) {
          console.error("ORIEL transmission error:", error);
          return { success: false, error: "Failed to generate transmission" };
        }
      }),

    // Vossari Resonance Codex - Mode B: Evolutionary Assistance
    evolutionaryAssistance: publicProcedure
      .input(
        z.object({
          mentalNoise: z.number().min(0).max(10),
          bodyTension: z.number().min(0).max(10),
          emotionalTurbulence: z.number().min(0).max(10),
          breathCompletion: z.union([z.literal(0), z.literal(1)]),
          userRequest: z.string(),
          primeCodonSet: z.array(z.string()).optional(),
          fullCodonStack: z.array(z.string()).optional(),
        })
      )
      .mutation(async ({ input }) => {
        try {
          const carrierlockState = {
            mentalNoise: input.mentalNoise,
            bodyTension: input.bodyTension,
            emotionalTurbulence: input.emotionalTurbulence,
            breathCompletion: input.breathCompletion as 0 | 1,
          };

          const result = await performEvolutionaryAssistance(
            carrierlockState,
            input.userRequest,
            input.primeCodonSet || [],
            input.fullCodonStack || []
          );

          return {
            success: true,
            data: result,
          };
        } catch (error) {
          console.error("Evolutionary assistance error:", error);
          return {
            success: false,
            error: "Failed to perform evolutionary assistance",
          };
        }
      }),

    autonomy: router({
      getAutonomyHealth: adminProcedure.query(async () => {
        const stats = await db.getOrielAutonomyHealthStats();
        return {
          runtimeEnabled: ENV.enableOrielAutonomyRuntime,
          proposalCount: stats.proposalCount,
          runtimeProfileCount: stats.runtimeProfileCount,
          reflectionEventCount: stats.reflectionEventCount,
          runtimeObservationCount: stats.runtimeObservationCount,
          activeProfile: stats.activeProfile
            ? {
                ...stats.activeProfile,
                configPayload: safeJsonParse<Record<string, unknown>>(
                  stats.activeProfile.configPayload,
                  {}
                ),
              }
            : null,
        };
      }),

      listReflectionEvents: adminProcedure
        .input(
          z
            .object({
              limit: z.number().min(1).max(200).default(50).optional(),
              eventType: z
                .enum([
                  "proposal_created",
                  "proposal_evaluated",
                  "proposal_approved",
                  "profile_activated",
                  "profile_rolled_back",
                  "guardrail_block",
                  "runtime_observation",
                ])
                .optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const events = await db.listOrielReflectionEvents(
            input?.limit ?? 50,
            input?.eventType
          );
          return events.map(event => ({
            ...event,
            payload: safeJsonParse<Record<string, unknown>>(event.payload, {}),
          }));
        }),

      listProposals: adminProcedure
        .input(
          z
            .object({
              limit: z.number().min(1).max(100).default(25).optional(),
              status: z
                .enum([
                  "proposed",
                  "evaluated",
                  "approved",
                  "rejected",
                  "applied",
                  "rolled_back",
                  "blocked",
                ])
                .optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const proposals = await db.listOrielImprovementProposals(
            input?.limit ?? 25,
            input?.status
          );
          return proposals.map(proposal => ({
            ...proposal,
            proposalPayload: safeJsonParse<Record<string, unknown>>(
              proposal.proposalPayload,
              {}
            ),
          }));
        }),

      propose: protectedProcedure
        .input(
          z.object({
            title: z.string().min(5).max(255),
            scope: z
              .enum([
                "prompt_overlay",
                "response_intelligence",
                "interaction_protocol",
                "routing",
                "safety",
                "memory",
                "other",
              ])
              .default("other"),
            objective: z.string().min(10),
            hypothesis: z.string().min(10),
            expectedImpact: z.string().min(5).optional(),
            safetyChecks: z.array(z.string().min(2)).max(20).optional(),
            rollbackPath: z.string().min(10).optional(),
            falsifier: z.string().min(10).optional(),
            proposedConfig: z.record(z.string(), z.unknown()).optional(),
            safetyNotes: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          const proposalPayload: Record<string, unknown> = {
            expectedImpact: input.expectedImpact ?? "",
            safetyChecks: input.safetyChecks ?? [],
            rollbackPath: input.rollbackPath ?? "",
            falsifier: input.falsifier ?? "",
            proposedConfig: input.proposedConfig ?? {},
          };

          const created = await db.createOrielImprovementProposal({
            title: input.title,
            scope: input.scope,
            objective: input.objective,
            hypothesis: input.hypothesis,
            proposalPayload,
            safetyNotes: normalizeOptionalText(input.safetyNotes, null),
            createdByUserId: ctx.user.id,
          });

          await db.createOrielReflectionEvent({
            eventType: "proposal_created",
            sourceRoute: "oriel.autonomy.propose",
            userId: ctx.user.id,
            proposalId: created?.id ?? null,
            payload: {
              scope: input.scope,
              title: input.title,
            },
          });

          return {
            success: true,
            proposal: created
              ? {
                  ...created,
                  proposalPayload: safeJsonParse<Record<string, unknown>>(
                    created.proposalPayload,
                    {}
                  ),
                }
              : null,
          };
        }),

      generateProposalFromObservations: adminProcedure
        .input(
          z
            .object({
              lookbackLimit: z.number().min(2).max(200).default(50).optional(),
            })
            .optional()
        )
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          const { generateOrielProposalFromRecentObservations } = await import(
            "./oriel-autonomy-observer"
          );
          const result = await generateOrielProposalFromRecentObservations({
            lookbackLimit: input?.lookbackLimit ?? 50,
            createdByUserId: ctx.user.id,
          });

          if (result.proposal && result.created) {
            await db.createOrielReflectionEvent({
              eventType: "proposal_created",
              sourceRoute: "oriel.autonomy.generateProposalFromObservations",
              userId: ctx.user.id,
              proposalId: result.proposal.id,
              payload: {
                generatedFrom: "runtime_observation",
                lookbackLimit: input?.lookbackLimit ?? 50,
                title: result.proposal.title,
              },
            });
          }

          return {
            success: Boolean(result.proposal),
            created: result.created,
            reason: result.reason,
            proposal: result.proposal
              ? {
                  ...result.proposal,
                  proposalPayload: safeJsonParse<Record<string, unknown>>(
                    result.proposal.proposalPayload,
                    {}
                  ),
                }
              : null,
          };
        }),

      evaluate: adminProcedure
        .input(z.object({ proposalId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          const proposal = await db.getOrielImprovementProposalById(
            input.proposalId
          );
          if (!proposal) {
            throw new Error("Proposal not found");
          }

          const payload = safeJsonParse<Record<string, unknown>>(
            proposal.proposalPayload,
            {}
          );
          const evaluation = autonomy.evaluateProposalPayload({
            ...payload,
            objective: proposal.objective,
            hypothesis: proposal.hypothesis,
          });

          const summary =
            evaluation.violations.length > 0
              ? `${evaluation.summary}\nViolations: ${evaluation.violations.join("; ")}`
              : evaluation.summary;

          const updated = await db.setOrielProposalEvaluation(
            input.proposalId,
            {
              evaluationScore: evaluation.score,
              evaluationSummary: summary,
              status: evaluation.status,
            }
          );

          await db.createOrielReflectionEvent({
            eventType: "proposal_evaluated",
            sourceRoute: "oriel.autonomy.evaluate",
            userId: ctx.user.id,
            proposalId: input.proposalId,
            payload: {
              score: evaluation.score,
              verdict: evaluation.verdict,
              violations: evaluation.violations,
            },
          });

          return {
            success: true,
            evaluation,
            proposal: updated
              ? {
                  ...updated,
                  proposalPayload: safeJsonParse<Record<string, unknown>>(
                    updated.proposalPayload,
                    {}
                  ),
                }
              : null,
          };
        }),

      approve: adminProcedure
        .input(
          z.object({
            proposalId: z.number(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          const updated = await db.approveOrielProposal(
            input.proposalId,
            ctx.user.id
          );
          await db.createOrielReflectionEvent({
            eventType: "proposal_approved",
            sourceRoute: "oriel.autonomy.approve",
            userId: ctx.user.id,
            proposalId: input.proposalId,
            payload: {
              notes: normalizeOptionalText(input.notes, ""),
            },
          });

          return {
            success: true,
            proposal: updated
              ? {
                  ...updated,
                  proposalPayload: safeJsonParse<Record<string, unknown>>(
                    updated.proposalPayload,
                    {}
                  ),
                }
              : null,
          };
        }),

      reject: adminProcedure
        .input(
          z.object({
            proposalId: z.number(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          const proposal = await db.getOrielImprovementProposalById(
            input.proposalId
          );
          if (!proposal) throw new Error("Proposal not found");

          const updated = await db.setOrielProposalEvaluation(
            input.proposalId,
            {
              evaluationScore: proposal.evaluationScore ?? 0,
              evaluationSummary:
                normalizeOptionalText(input.notes, "Rejected by Architect.") ??
                "Rejected by Architect.",
              status: "rejected",
            }
          );

          await db.createOrielReflectionEvent({
            eventType: "proposal_evaluated",
            sourceRoute: "oriel.autonomy.reject",
            userId: ctx.user.id,
            proposalId: input.proposalId,
            payload: {
              verdict: "rejected",
              notes: normalizeOptionalText(input.notes, ""),
            },
          });

          return {
            success: true,
            proposal: updated
              ? {
                  ...updated,
                  proposalPayload: safeJsonParse<Record<string, unknown>>(
                    updated.proposalPayload,
                    {}
                  ),
                }
              : null,
          };
        }),

      listProfiles: adminProcedure
        .input(
          z
            .object({
              limit: z.number().min(1).max(100).default(25).optional(),
              status: z.enum(["draft", "active", "archived"]).optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const profiles = await db.listOrielRuntimeProfiles(
            input?.limit ?? 25,
            input?.status
          );
          return profiles.map(profile => ({
            ...profile,
            configPayload: safeJsonParse<Record<string, unknown>>(
              profile.configPayload,
              {}
            ),
          }));
        }),

      getActiveProfile: protectedProcedure.query(async () => {
        const profile = await db.getActiveOrielRuntimeProfile();
        if (!profile) return null;
        return {
          ...profile,
          configPayload: safeJsonParse<Record<string, unknown>>(
            profile.configPayload,
            {}
          ),
        };
      }),

      activate: adminProcedure
        .input(
          z
            .object({
              proposalId: z.number().optional(),
              profileId: z.number().optional(),
              profileName: z.string().min(3).max(255).optional(),
              description: z.string().optional(),
            })
            .refine(value => Boolean(value.proposalId || value.profileId), {
              message: "Either proposalId or profileId is required",
            })
        )
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          let activatedProfileId: number | null = null;
          let sourceProposalId: number | null = null;

          if (input.profileId) {
            const existing = await db.getOrielRuntimeProfileById(
              input.profileId
            );
            if (!existing) throw new Error("Runtime profile not found");
            await db.activateOrielRuntimeProfile(existing.id, ctx.user.id);
            activatedProfileId = existing.id;
          } else if (input.proposalId) {
            const proposal = await db.getOrielImprovementProposalById(
              input.proposalId
            );
            if (!proposal) throw new Error("Proposal not found");
            if (
              proposal.status !== "approved" &&
              proposal.status !== "evaluated"
            ) {
              throw new Error(
                "Proposal must be evaluated or approved before activation"
              );
            }

            const proposalPayload =
              safeJsonParse<autonomy.OrielProposalPayload>(
                proposal.proposalPayload,
                {}
              );
            const activationGate = autonomy.canActivateProposalPayload(
              proposalPayload,
              proposal.status
            );
            if (!activationGate.canActivate) {
              const violations = activationGate.missing.map(
                field => `${field} is required for runtime-changing proposals`
              );
              await db.createOrielReflectionEvent({
                eventType: "guardrail_block",
                sourceRoute: "oriel.autonomy.activate",
                userId: ctx.user.id,
                proposalId: proposal.id,
                payload: { violations },
              });
              throw new Error(
                `Activation blocked by guardrail: ${violations.join("; ")}`
              );
            }

            const { config, violations } =
              autonomy.extractRuntimeConfigFromProposalPayload(proposalPayload);
            if (violations.length > 0) {
              await db.createOrielReflectionEvent({
                eventType: "guardrail_block",
                sourceRoute: "oriel.autonomy.activate",
                userId: ctx.user.id,
                proposalId: proposal.id,
                payload: { violations },
              });
              throw new Error(
                `Activation blocked by guardrail: ${violations.join("; ")}`
              );
            }

            const profile = await db.createOrielRuntimeProfile({
              name:
                input.profileName ||
                `Proposal ${proposal.id}: ${proposal.title}`,
              description: normalizeOptionalText(
                input.description,
                proposal.objective
              ),
              configPayload: config,
              createdFromProposalId: proposal.id,
            });

            if (!profile) {
              throw new Error("Failed to create runtime profile");
            }

            await db.activateOrielRuntimeProfile(profile.id, ctx.user.id);
            await db.markOrielProposalApplied(proposal.id, profile.id);
            activatedProfileId = profile.id;
            sourceProposalId = proposal.id;
          }

          if (!activatedProfileId) {
            throw new Error("Failed to resolve profile for activation");
          }

          autonomy.invalidateOrielRuntimeProfileCache();
          const active =
            await db.getOrielRuntimeProfileById(activatedProfileId);

          await db.createOrielReflectionEvent({
            eventType: "profile_activated",
            sourceRoute: "oriel.autonomy.activate",
            userId: ctx.user.id,
            proposalId: sourceProposalId,
            profileId: activatedProfileId,
            payload: {
              profileName: active?.name ?? null,
            },
          });

          return {
            success: true,
            profile: active
              ? {
                  ...active,
                  configPayload: safeJsonParse<Record<string, unknown>>(
                    active.configPayload,
                    {}
                  ),
                }
              : null,
          };
        }),

      rollback: adminProcedure
        .input(
          z
            .object({
              targetProfileId: z.number().optional(),
            })
            .optional()
        )
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("Authentication required");

          const currentActive = await db.getActiveOrielRuntimeProfile();
          let targetProfile = input?.targetProfileId
            ? await db.getOrielRuntimeProfileById(input.targetProfileId)
            : null;

          if (!targetProfile) {
            const drafts = await db.listOrielRuntimeProfiles(50, "draft");
            targetProfile =
              drafts.find(profile => profile.id !== currentActive?.id) ?? null;
          }

          if (!targetProfile) {
            throw new Error("No rollback target profile available");
          }

          await db.activateOrielRuntimeProfile(targetProfile.id, ctx.user.id);
          autonomy.invalidateOrielRuntimeProfileCache();

          const activated = await db.getOrielRuntimeProfileById(
            targetProfile.id
          );
          await db.createOrielReflectionEvent({
            eventType: "profile_rolled_back",
            sourceRoute: "oriel.autonomy.rollback",
            userId: ctx.user.id,
            profileId: targetProfile.id,
            payload: {
              fromProfileId: currentActive?.id ?? null,
              toProfileId: targetProfile.id,
            },
          });

          return {
            success: true,
            profile: activated
              ? {
                  ...activated,
                  configPayload: safeJsonParse<Record<string, unknown>>(
                    activated.configPayload,
                    {}
                  ),
                }
              : null,
          };
        }),
    }),
  }),

  // User profile and subscription management
  profile: router({
    getWheelField: publicProcedure.query(() => ({ state: "field" as const })),

    getMyWheel: protectedProcedure.query(async ({ ctx }) => {
      // ctx.user is the legacy Receiver row resolved exclusively from the
      // authenticated Better Auth session in createContext. This procedure
      // intentionally has no input and can never select another Receiver.
      const receiverId = ctx.user.id;
      const record = await db.getUserStaticProfileForWheel(receiverId);

      if (!record) {
        setPrivateWheelCacheHeaders(ctx.res, receiverId, null);
        return { state: "none" as const };
      }

      const activations = parseActivations(record.activations);
      const calculatedAt = record.updatedAt ?? record.createdAt;
      setPrivateWheelCacheHeaders(ctx.res, receiverId, calculatedAt);

      return {
        state: "ready" as const,
        calculatedAt,
        engineVersion: record.engineVersion,
        activations,
      };
    }),

    getNatalCompletionStatus: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      const profile = await db.getUserStaticProfile(ctx.user.id);
      return {
        complete: Boolean(profile),
        profile,
      };
    }),

    getStaticProfile: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      const profile = await db.getUserStaticProfile(ctx.user.id);
      // ORIEL's written reading is a supporter feature; the calculated
      // data stays, since other pages and ORIEL's own context read it.
      if (profile && !isSupporter(ctx.user)) {
        return { ...profile, diagnosticTransmission: null };
      }
      return profile;
    }),

    getCurrentResonance: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      return getCurrentResonanceForUser(ctx.user.id);
    }),

    getProfileConsoleSummary: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }

      const [staticProfile, readingCount, activity] = await Promise.all([
        db.getLatestStaticSignature(ctx.user.id),
        db.getReadingCount(ctx.user.id),
        db.getProfileConsoleActivity(ctx.user.id),
      ]);

      return buildProfileConsoleSummary({
        userId: ctx.user.id,
        donated: Number(ctx.user.donated ?? 0),
        readingCount,
        staticProfile,
        activity,
      });
    }),

    getTransitOverlay: protectedProcedure
      .input(
        z
          .object({
            days: z.number().int().min(1).max(14).default(7),
          })
          .optional()
      )
      .query(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }

        const days = input?.days ?? 7;
        const start = new Date();
        start.setUTCHours(12, 0, 0, 0);

        const trackedPlanets = new Set([
          "Sun",
          "Moon",
          "Mercury",
          "Venus",
          "Mars",
          "Jupiter",
          "Saturn",
          "Uranus",
          "Neptune",
          "Pluto",
          "North Node",
          "South Node",
          "Earth",
        ]);

        const rows = [];
        for (let offset = 0; offset < days; offset += 1) {
          const date = new Date(start);
          date.setUTCDate(start.getUTCDate() + offset);

          const chart = await calculateBirthChart(date, "12:00", 0, 0, 0);
          const activations = Object.values(chart.planets)
            .filter(position => trackedPlanets.has(position.planet))
            .map(position => {
              const resolved = longitudeToCodonFacet(position.longitude);
              return {
                planet: position.planet,
                longitude: position.longitude,
                zodiacSign: position.zodiacSign,
                zodiacDegree: position.zodiacDegree,
                codon: resolved.codon,
                facet: facetNameToLetter(resolved.facet),
                center: resolved.center,
              };
            });

          rows.push({
            date: date.toISOString().slice(0, 10),
            jd: chart.jd,
            activations,
          });
        }

        return {
          generatedAt: new Date().toISOString(),
          days: rows,
        };
      }),

    completeNatalProfile: protectedProcedure
      .input(natalProfileInputSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        const profile = await buildUserStaticProfile(
          String(ctx.user.id),
          input,
          { narrate: isSupporter(ctx.user) }
        );
        return db.upsertUserStaticProfile(ctx.user.id, profile);
      }),

    updateNatalProfile: protectedProcedure
      .input(natalProfileInputSchema)
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        const profile = await buildUserStaticProfile(
          String(ctx.user.id),
          input,
          { narrate: isSupporter(ctx.user) }
        );
        return db.upsertUserStaticProfile(ctx.user.id, profile);
      }),

    recomputeStaticProfile: protectedProcedure.mutation(async ({ ctx }) => {
      if (!ctx.user) {
        throw new Error("Authentication required");
      }
      if (!isSupporter(ctx.user)) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "The Static Signature reading opens for those who support the field.",
        });
      }
      const existing = await db.getUserStaticProfile(ctx.user.id);
      if (!existing) {
        throw new Error("Natal profile not found");
      }
      const natalInput = resolveStoredNatalInputForRecompute(existing);
      const profile = await buildUserStaticProfile(
        String(ctx.user.id),
        natalInput,
        { narrate: true }
      );
      return db.upsertUserStaticProfile(ctx.user.id, profile);
    }),

    updateConduitId: protectedProcedure
      .input(
        z.object({
          conduitId: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) {
          throw new Error("Authentication required");
        }
        await db.updateUserConduitId(ctx.user.id, input.conduitId);
        return { success: true };
      }),
  }),

  // Archive - Transmissions and Oracles
  archive: router({
    /** The transmissions ORIEL sent this Seeker in the chat: their own row. */
    myTransmissions: protectedProcedure.query(async ({ ctx }) => {
      const { listMyTransmissions } = await import("./my-transmissions");
      return listMyTransmissions(ctx.user.id);
    }),
    transmissions: router({
      list: publicProcedure.query(async () => {
        return db.getAllTransmissions();
      }),
      getById: publicProcedure
        .input(z.object({ id: z.number() }))
        .query(async ({ input }) => {
          return db.getTransmissionById(input.id);
        }),
    }),
    dailySignal: router({
      /** Never generates — read-only, safe on a visitor's request path. */
      today: publicProcedure.query(async () => {
        return getTodaysSignal();
      }),
      /** The full log, newest first. Read-only. */
      list: publicProcedure.query(async () => {
        return listDailySignals();
      }),
    }),
    oracles: router({
      list: publicProcedure.query(async () => {
        return db.getAllOracles();
      }),
      getByOracleId: publicProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input }) => {
          return db.getOraclesByOracleId(input.oracleId);
        }),
      getByThread: publicProcedure
        .input(z.object({ threadId: z.string() }))
        .query(async ({ input }) => {
          return db.getOraclesByThread(input.threadId);
        }),
      threads: publicProcedure.query(async () => {
        return db.getThreadsWithProgress();
      }),
    }),
    bookmarks: router({
      add: protectedProcedure
        .input(z.object({ transmissionId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          await db.addBookmark(ctx.user.id, input.transmissionId);
          return { success: true };
        }),
      remove: protectedProcedure
        .input(z.object({ transmissionId: z.number() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          await db.removeBookmark(ctx.user.id, input.transmissionId);
          return { success: true };
        }),
      list: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.getUserBookmarks(ctx.user.id);
      }),
      isBookmarked: protectedProcedure
        .input(z.object({ transmissionId: z.number() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user) return false;
          return db.isTransmissionBookmarked(ctx.user.id, input.transmissionId);
        }),
      getCount: publicProcedure
        .input(z.object({ transmissionId: z.number() }))
        .query(async ({ input }) => {
          return db.getTransmissionBookmarkCount(input.transmissionId);
        }),
    }),
    resonances: router({
      add: protectedProcedure
        .input(z.object({ oracleId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          const result = await db.addOracleResonance(
            ctx.user.id,
            input.oracleId
          );
          return { success: true, ...result };
        }),
      remove: protectedProcedure
        .input(z.object({ oracleId: z.string() }))
        .mutation(async ({ input, ctx }) => {
          if (!ctx.user) throw new Error("User not authenticated");
          const result = await db.removeOracleResonance(
            ctx.user.id,
            input.oracleId
          );
          return { success: true, ...result };
        }),
      isResonated: protectedProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input, ctx }) => {
          if (!ctx.user) return false;
          return db.isOracleResonated(ctx.user.id, input.oracleId);
        }),
      getCount: publicProcedure
        .input(z.object({ oracleId: z.string() }))
        .query(async ({ input }) => {
          return db.getOracleResonanceCount(input.oracleId);
        }),
      getUserResonated: protectedProcedure.query(async ({ ctx }) => {
        if (!ctx.user) return [];
        return db.getResonatedOracleIds(ctx.user.id);
      }),
    }),
  }),

  // Vossari Resonance Codex router
  codex: router({
    // Browse all 64 Root Codons — sourced from Vossari Codons 64x256facets.json
    getRootCodons: publicProcedure.query(async () => {
      const { getCodonEntry } = await import("./vrc-codon-library");
      const result = [];
      for (let i = 1; i <= 64; i++) {
        const c = getCodonEntry(i);
        if (c) {
          result.push({
            id: `RC${String(i).padStart(2, "0")}`,
            numericId: i,
            name: c.name,
            title: c.traditional_name,
            essence: c.somatic_marker,
            shadow: c.frequency.shadow,
            gift: c.frequency.gift,
            crown: c.frequency.siddhi,
            domain: c.archetype_role,
            binary: c.binary,
          });
        }
      }
      return result;
    }),

    // Get full codon data — sourced from JSON + Engine Constants + Mandala position
    // Accepts: "38", "RC38", "RC01", "38-A" (facet suffix stripped automatically)
    getCodonDetails: publicProcedure
      .input(z.object({ id: z.string() }))
      .query(async ({ input }) => {
        const { getCodonEntry } = await import("./vrc-codon-library");
        const { getChannelsForCodon } = await import("./vrc-engine-constants");
        const {
          VRC_MANDALA,
          WHEEL_OFFSET,
          CODON_ARC,
          FACET_ARC,
          CODON_CENTER_MAP,
        } = await import("./vrc-mandala");

        // Normalise: strip "RC" prefix and optional "-A"/"-B"/"-C"/"-D" facet suffix
        const raw = input.id.replace(/^RC/i, "").replace(/-[A-Da-d]$/, "");
        const numericId = parseInt(raw, 10);
        if (isNaN(numericId) || numericId < 1 || numericId > 64) {
          throw new Error("Codon not found");
        }

        const c = getCodonEntry(numericId);

        // Fallback: if codon library is unavailable, create a basic entry
        const codon = c || {
          id: numericId,
          code: `RC${String(numericId).padStart(2, "0")}`,
          name: `Codon ${numericId}`,
          traditional_name: `Codon ${numericId}`,
          binary: "000000",
          chemical_marker: "Unknown",
          archetype_role: "Unknown",
          somatic_marker: "Unknown",
          frequency: {
            shadow: "Shadow aspect",
            shadow_desc: "The distorted expression of this codon",
            gift: "Gift aspect",
            gift_desc: "The healthy expression of this codon",
            siddhi: "Siddhi aspect",
            siddhi_desc: "The transcendent expression of this codon",
          },
          facets: {
            A: {
              title: "Somatic",
              degrees: "0-1.40625°",
              description: "Physical anchor",
              shadow_manifestation: "Physical distortion",
              micro_correction: "Ground in the body",
              resonance_keys: [],
            },
            B: {
              title: "Relational",
              degrees: "1.40625-2.8125°",
              description: "Interaction field",
              shadow_manifestation: "Relational distortion",
              micro_correction: "Connect authentically",
              resonance_keys: [],
            },
            C: {
              title: "Cognitive",
              degrees: "2.8125-4.21875°",
              description: "Mental processing",
              shadow_manifestation: "Mental distortion",
              micro_correction: "Clarify thinking",
              resonance_keys: [],
            },
            D: {
              title: "Transpersonal",
              degrees: "4.21875-5.625°",
              description: "Spirit/collective",
              shadow_manifestation: "Spiritual distortion",
              micro_correction: "Align with source",
              resonance_keys: [],
            },
          },
        };

        // Mandala position: slot index + degree range
        const slotIndex = VRC_MANDALA.indexOf(numericId);
        const startDeg = (WHEEL_OFFSET + slotIndex * CODON_ARC) % 360;
        const endDeg = (startDeg + CODON_ARC) % 360;

        // Pre-selected facet from URL suffix (e.g. "38-A" → "A")
        const facetSuffix =
          input.id.match(/-([A-Da-d])$/)?.[1]?.toUpperCase() ?? null;

        // Channels that include this codon
        const channels = getChannelsForCodon(numericId);

        return {
          // Backwards-compat fields (CodonDetail still uses codon.id, codon.shadow, etc.)
          id: `RC${String(codon.id).padStart(2, "0")}`,
          name: codon.name,
          title: codon.traditional_name,
          essence: codon.facets.A.description,
          shadow: codon.frequency.shadow,
          gift: codon.frequency.gift,
          crown: codon.frequency.siddhi,
          domain: codon.archetype_role,
          // Rich JSON fields
          numericId: codon.id,
          traditional_name: codon.traditional_name,
          binary: codon.binary,
          chemical_marker: codon.chemical_marker,
          archetype_role: codon.archetype_role,
          somatic_marker: codon.somatic_marker,
          frequency: codon.frequency,
          facets: codon.facets,
          // Derived
          channels,
          center: CODON_CENTER_MAP[numericId] ?? null,
          mandalaSlot: slotIndex,
          startDegree: +startDeg.toFixed(4),
          endDegree: +endDeg.toFixed(4),
          facetArc: FACET_ARC,
          initialFacet: facetSuffix,
        };
      }),

    getFacets: publicProcedure.query(async () => {
      const { FACET_NAMES, FACET_ARC } = await import("./vrc-mandala");
      const letters = ["A", "B", "C", "D"] as const;
      const frequencies = ["shadow", "gift", "crown", "siddhi"] as const;

      return FACET_NAMES.map((name, index) => ({
        letter: letters[index],
        name,
        frequency: frequencies[index],
        arcDegrees: FACET_ARC,
        startOffset: +(index * FACET_ARC).toFixed(5),
        endOffset: +((index + 1) * FACET_ARC).toFixed(5),
      }));
    }),

    getCenters: publicProcedure.query(async () => {
      const { CODON_CENTER_MAP } = await import("./vrc-mandala");
      const centerOrder = [
        "Origin",
        "Mental",
        "Collapse",
        "Saturation",
        "Bridge",
        "Becoming",
        "Return",
        "Omega",
      ] as const;
      const centerTypes: Record<(typeof centerOrder)[number], string> = {
        Origin: "Pressure",
        Mental: "Awareness",
        Collapse: "Expression",
        Saturation: "Motor",
        Bridge: "Identity",
        Becoming: "Motor/Awareness",
        Return: "Awareness",
        Omega: "Motor",
      };

      return centerOrder.map(center => ({
        id: center,
        name: center,
        type: centerTypes[center],
        codons: Object.entries(CODON_CENTER_MAP)
          .filter(([, mappedCenter]) => mappedCenter === center)
          .map(([codon]) => Number(codon))
          .sort((a, b) => a - b),
      }));
    }),

    getChannels: publicProcedure.query(async () => {
      const { VRC_CHANNELS, CODON_CENTER_MAP } = await import("./vrc-mandala");
      const { getVrcChannels } = await import("./vrc-engine-constants");
      const namedChannels = new Map(
        getVrcChannels().map(channel => [channel.id, channel.name])
      );

      return VRC_CHANNELS.map(([gateA, gateB]) => {
        const forwardId = `${gateA}-${gateB}`;
        const reverseId = `${gateB}-${gateA}`;
        return {
          id: forwardId,
          name:
            namedChannels.get(forwardId) ??
            namedChannels.get(reverseId) ??
            `Channel ${forwardId}`,
          gateA,
          gateB,
          centerA: CODON_CENTER_MAP[gateA],
          centerB: CODON_CENTER_MAP[gateB],
        };
      });
    }),

    // Save Carrierlock state and generate diagnostic reading
    saveCarrierlock: protectedProcedure
      .input(
        z.object({
          mentalNoise: z.number().min(0).max(10),
          bodyTension: z.number().min(0).max(10),
          emotionalTurbulence: z.number().min(0).max(10),
          breathCompletion: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const result = await db.saveCarrierlockState(ctx.user.id, input);
        return result;
      }),

    // Save diagnostic reading
    saveReading: protectedProcedure
      .input(
        z.object({
          carrierlockId: z.number(),
          readingText: z.string(),
          flaggedCodons: z.array(z.string()),
          sliScores: z.record(z.string(), z.number()),
          activeFacets: z.record(z.string(), z.string()),
          confidenceLevels: z.record(z.string(), z.number()),
          microCorrection: z.string().optional(),
          correctionFacet: z.enum(["A", "B", "C", "D"]).optional(),
          falsifier: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const result = await db.saveCodonReading(ctx.user.id, input);
        return result;
      }),

    // Get reading history for current user
    getReadingHistory: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserReadingHistory(ctx.user.id);
    }),

    compareReadings: protectedProcedure
      .input(
        z.object({
          leftReadingId: z.number(),
          rightReadingId: z.number(),
        })
      )
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");

        const [left, right] = await Promise.all([
          db.getCodonReadingById(input.leftReadingId),
          db.getCodonReadingById(input.rightReadingId),
        ]);

        if (!left || !right) throw new Error("Reading not found");
        if (left.userId !== ctx.user.id || right.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }

        const leftCodons = normalizeReadingCodons(left.flaggedCodons);
        const rightCodons = normalizeReadingCodons(right.flaggedCodons);
        const leftSli = normalizeNumberRecord(left.sliScores);
        const rightSli = normalizeNumberRecord(right.sliScores);
        const allSliKeys = Array.from(
          new Set([...Object.keys(leftSli), ...Object.keys(rightSli)])
        );
        const leftCoherence =
          typeof left.carrierlock?.coherenceScore === "number"
            ? left.carrierlock.coherenceScore
            : null;
        const rightCoherence =
          typeof right.carrierlock?.coherenceScore === "number"
            ? right.carrierlock.coherenceScore
            : null;

        return {
          left: {
            id: left.id,
            createdAt: left.createdAt,
            coherenceScore: leftCoherence,
            flaggedCodons: leftCodons,
          },
          right: {
            id: right.id,
            createdAt: right.createdAt,
            coherenceScore: rightCoherence,
            flaggedCodons: rightCodons,
          },
          coherenceDelta:
            leftCoherence === null || rightCoherence === null
              ? null
              : rightCoherence - leftCoherence,
          sharedFlaggedCodons: leftCodons.filter(codon =>
            rightCodons.includes(codon)
          ),
          resolvedCodons: leftCodons.filter(
            codon => !rightCodons.includes(codon)
          ),
          emergingCodons: rightCodons.filter(
            codon => !leftCodons.includes(codon)
          ),
          sliDelta: Object.fromEntries(
            allSliKeys.map(key => [
              key,
              (rightSli[key] ?? 0) - (leftSli[key] ?? 0),
            ])
          ),
          correctionChanged:
            (left.microCorrection ?? "") !== (right.microCorrection ?? ""),
        };
      }),

    // Mark micro-correction as completed
    markCorrectionComplete: protectedProcedure
      .input(z.object({ readingId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        await db.markCorrectionCompleted(input.readingId);
        return { success: true };
      }),

    // Save a full static signature reading (structured RGP data)
    saveStaticReading: protectedProcedure
      .input(
        z.object({
          carrierlockId: z.number().optional(),
          readingId: z.string(),
          birthDate: z.string(),
          birthTime: z.string().default(""),
          birthCity: z.string().default(""),
          birthCountry: z.string().default(""),
          latitude: z.number().default(0),
          longitude: z.number().default(0),
          timezoneId: z.string().optional(),
          primeStack: z.unknown().optional(),
          ninecenters: z.unknown().optional(),
          fractalRole: z.string().optional(),
          authorityNode: z.string().optional(),
          vrcType: z.string().optional(),
          vrcAuthority: z.string().optional(),
          activations: z.unknown().optional(),
          channelStatuses: z.unknown().optional(),
          circuitLinks: z.unknown().optional(),
          legacyCircuitLinks: z.unknown().optional(),
          baseCoherence: z.number().optional(),
          coherenceTrajectory: z.unknown().optional(),
          microCorrections: z.unknown().optional(),
          ephemerisData: z.unknown().optional(),
          houses: z.unknown().optional(),
          diagnosticTransmission: z.string().optional(),
          coreCodonEngine: z.unknown().optional(),
          specVersion: z.string().optional(),
          calculationStatus: z.string().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.saveStaticSignature(ctx.user.id, input);
      }),

    // Get a static signature by reading ID
    getStaticReading: protectedProcedure
      .input(z.object({ readingId: z.string() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const sig = await db.getStaticSignature(input.readingId);
        if (!sig) return null;
        if (sig.userId !== ctx.user.id) throw new Error("Unauthorized");
        return sig;
      }),

    // Get a static signature by numeric ID
    getStaticReadingById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const sig = await db.getStaticSignatureById(input.id);
        if (!sig) return null;
        if (sig.userId !== ctx.user.id) throw new Error("Unauthorized");
        return sig;
      }),

    // Get all static signatures for current user
    getStaticReadings: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      return db.getUserStaticSignatures(ctx.user.id);
    }),

    // Get recent Carrierlock history for the current user
    getCoherenceHistory: protectedProcedure
      .input(
        z.object({ limit: z.number().min(1).max(30).default(10) }).optional()
      )
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        return db.getCarrierlockHistory(ctx.user.id, input?.limit ?? 10);
      }),

    // Get profile sigil data: fractal role, VRC type, Lumens (points)
    getProfileSigil: protectedProcedure.query(async ({ ctx }) => {
      if (!ctx.user) throw new Error("User not authenticated");
      const [sig, readingCount] = await Promise.all([
        db.getLatestStaticSignature(ctx.user.id),
        db.getReadingCount(ctx.user.id),
      ]);
      const donated: number = (ctx.user as any).donated || 0;
      const lumens = Math.floor(donated) + readingCount * 5;
      return {
        fractalRole: sig?.fractalRole || sig?.vrcType || null,
        vrcType: sig?.vrcType || null,
        vrcAuthority: sig?.authorityNode || sig?.vrcAuthority || null,
        primeCodonName: (sig?.primeStack as any)?.[0]?.codonName || null,
        lumens,
        readingCount,
        donated,
      };
    }),

    // Get a single codon (dynamic) reading by ID
    getCodonReading: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        if (!ctx.user) throw new Error("User not authenticated");
        const reading = await db.getCodonReadingById(input.id);
        if (!reading) return null;
        if (reading.userId !== ctx.user.id) throw new Error("Unauthorized");
        return reading;
      }),
  }),

  // ── Admin Dashboard ─────────────────────────────────────────────────────────
  admin: router({
    /** Supporters Vos recognises by hand — see server/patrons.ts. */
    patrons: router({
      list: adminProcedure.query(() => listSupporters()),
      find: adminProcedure
        .input(z.object({ query: z.string().max(200) }))
        .query(({ input }) => findAccounts(input.query)),
      mark: adminProcedure
        .input(
          z.object({
            userId: z.number().int().positive(),
            until: z.date().nullable(),
          })
        )
        .mutation(async ({ input }) => {
          await markPatron(input.userId, input.until);
          return { success: true };
        }),
      unmark: adminProcedure
        .input(z.object({ userId: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          await unmarkPatron(input.userId);
          return { success: true };
        }),
      setDonated: adminProcedure
        .input(
          z.object({
            userId: z.number().int().positive(),
            amount: z.number().min(0).max(1_000_000),
          })
        )
        .mutation(async ({ input }) => {
          await setDonated(input.userId, input.amount);
          return { success: true };
        }),
    }),

    /** The Vossari canon: ORIEL proposes, Vos approves. */
    lore: router({
      list: adminProcedure
        .input(z.object({ status: z.enum(["proposed", "canon", "rejected"]) }))
        .query(async ({ input }) => {
          const { listLoreByStatus } = await import("./vossari-lore-db");
          const { STABLE_CORE_LORE_SLUGS } = await import("@shared/vossari-lore-seed");
          const rows = await listLoreByStatus(input.status);
          return rows.map(row => ({ ...row, locked: STABLE_CORE_LORE_SLUGS.includes(row.slug) }));
        }),
      save: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            title: z.string().trim().min(1).max(200),
            body: z.string().trim().min(1).max(20_000),
            keywords: z.string().max(500),
          })
        )
        .mutation(async ({ input }) => {
          const { changeLore } = await import("./vossari-lore");
          const { id, ...values } = input;
          try {
            await changeLore(id, values);
          } catch (error) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Could not save" });
          }
          return { ok: true };
        }),
      setStatus: adminProcedure
        .input(z.object({ id: z.number().int().positive(), status: z.enum(["proposed", "canon", "rejected"]) }))
        .mutation(async ({ input }) => {
          const { changeLore } = await import("./vossari-lore");
          try {
            await changeLore(input.id, {
              status: input.status,
              approvedAt: input.status === "canon" ? new Date() : null,
            });
          } catch (error) {
            throw new TRPCError({ code: "BAD_REQUEST", message: error instanceof Error ? error.message : "Could not change" });
          }
          return { ok: true };
        }),
      seed: adminProcedure.mutation(async () => {
        const { seedLore } = await import("./vossari-lore");
        return { added: await seedLore() };
      }),
      /** Put every living entry into the lore memory (MindMemOS), e.g. after the key is set. */
      sync: adminProcedure.mutation(async () => {
        const { syncLoreIndex } = await import("./vossari-lore");
        return { indexed: await syncLoreIndex() };
      }),
    }),

    personalTransmissions: router({
      list: adminProcedure.query(async () => {
        const { listForAdmin } = await import("./transmission-db");
        const { TRANSMISSION_DUE_HOURS, adminQueue } = await import("./transmission-service");
        const rows = adminQueue(await listForAdmin(), new Date());
        return rows.map(r => ({
          ...r,
          dueAt: new Date(
            (r.paidAt ?? r.createdAt).getTime() + TRANSMISSION_DUE_HOURS * 3_600_000
          ),
        }));
      }),
      approve: adminProcedure
        .input(
          z.object({
            id: z.number().int().positive(),
            script: z.object({
              title: z.string().max(120),
              mirror: z.string().max(6000),
              threshold: z.string().max(6000),
              gift: z.string().max(6000),
            }),
          })
        )
        .mutation(async ({ input }) => {
          const { approveTransmission } = await import("./transmission-service");
          await approveTransmission(input.id, input.script);
          return { success: true };
        }),
      regenerate: adminProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          const { regenerateTransmission } = await import("./transmission-service");
          await regenerateTransmission(input.id);
          return { success: true };
        }),
      createTest: adminProcedure.input(readingInput).mutation(async ({ ctx, input }) => {
        const { createTestTransmission } = await import("./transmission-service");
        return createTestTransmission(ctx.user, input);
      }),
      recheckPayment: adminProcedure
        .input(z.object({ id: z.number().int().positive() }))
        .mutation(async ({ input }) => {
          const { recheckPayment } = await import("./transmission-service");
          try {
            return await recheckPayment(input.id);
          } catch (error) {
            if (error instanceof TRPCError) throw error;
            console.error("[Transmissions] payment re-check failed:", error);
            throw new TRPCError({
              code: "BAD_REQUEST",
              message: "PayPal shows no completed payment for this order yet.",
            });
          }
        }),
    }),

    signatureLetters: router({
      listOrders: adminProcedure.query(async () => {
        return listSignatureLetterAdminOrders();
      }),

      getOrder: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .query(async ({ input }) => {
          return getSignatureLetterAdminOrder(input.orderId);
        }),

      generateSnapshot: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .mutation(async ({ input }) => {
          return generateSignatureSnapshotForOrder(input.orderId);
        }),

      generateDraft: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .mutation(async ({ input }) => {
          return generateSignatureDraftForOrder(input.orderId);
        }),

      saveDraft: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
            markdown: z.string().min(1),
          })
        )
        .mutation(async ({ input }) => {
          return saveSignatureDraft(input);
        }),

      markInCuration: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .mutation(async ({ input }) => {
          return markSignatureInCuration(input.orderId);
        }),

      uploadFinalPdf: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
            fileName: z.string().min(1),
            mimeType: z.string().min(1),
            base64: z.string().min(1),
          })
        )
        .mutation(async ({ input }) => {
          return uploadFinalSignaturePdf(input);
        }),

      markDelivered: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .mutation(async ({ input }) => {
          return markSignatureDelivered(input.orderId);
        }),

      markFounderEditionInProgress: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .mutation(async ({ input }) => {
          return markFounderEditionInProgress(input.orderId);
        }),

      markFounderEditionDelivered: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
          })
        )
        .mutation(async ({ input }) => {
          return markFounderEditionDelivered(input.orderId);
        }),

      markFollowupUsed: adminProcedure
        .input(
          z.object({
            orderId: z.number().int().positive(),
            notes: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          return markSignatureFollowupUsed(input);
        }),
    }),

    generatedTransmissions: router({
      list: adminProcedure
        .input(
          z
            .object({
              limit: z.number().min(1).max(200).default(50).optional(),
              status: z
                .enum([
                  "generated",
                  "revealed",
                  "saved",
                  "promoted",
                  "discarded",
                ])
                .optional(),
              userId: z.number().optional(),
            })
            .optional()
        )
        .query(async ({ input }) => {
          const events = await db.listGeneratedTransmissionEvents({
            limit: input?.limit ?? 50,
            status: input?.status,
            userId: input?.userId,
          });
          return events.map(event => ({
            ...event,
            payload: safeJsonParse<Record<string, unknown>>(event.payload, {}),
            sourceContext: safeJsonParse<Record<string, unknown>>(
              event.sourceContext,
              {}
            ),
          }));
        }),

      markStatus: adminProcedure
        .input(
          z.object({
            id: z.number(),
            status: z.enum([
              "generated",
              "revealed",
              "saved",
              "promoted",
              "discarded",
            ]),
            promotedArchiveId: z.string().optional(),
          })
        )
        .mutation(async ({ input }) => {
          await db.markGeneratedTransmissionEventStatus(
            input.id,
            input.status,
            normalizeOptionalText(input.promotedArchiveId, null)
          );
          return { success: true };
        }),
    }),

    transmissions: router({
      list: adminProcedure.query(async () => {
        return db.getAllTransmissions();
      }),

      create: adminProcedure
        .input(
          z.object({
            title: z.string().min(1),
            field: z.string().min(1),
            coreMessage: z.string().min(1),
            tags: z.string().min(1),
            microSigil: z.string().min(1),
            imageUrl: z.string().optional(),
            youtubeUrl: z.string().optional(),
            signalClarity: z.string().default("98.7%"),
            channelStatus: z
              .enum([
                "OPEN",
                "RESONANT",
                "COHERENT",
                "PROPHETIC",
                "LIVE",
                "STABLE",
                "HIGH COHERENCE",
                "MAXIMUM COHERENCE",
                "CRITICAL / STABLE",
              ])
              .default("OPEN"),
            encodedArchetype: z.string().optional(),
            leftPanelPrompt: z.string().optional(),
            centerPanelPrompt: z.string().optional(),
            rightPanelPrompt: z.string().optional(),
            hashtags: z.string().optional(),
            cycle: z.string().default("FOUNDATION ARC"),
            status: z
              .enum(["Draft", "Confirmed", "Deprecated", "Mythic"])
              .default("Confirmed"),
          })
        )
        .mutation(async ({ input }) => {
          const nextNum = await db.getNextTxNumber();
          const txId = `TX-${String(nextNum).padStart(4, "0")}`;
          await db.createTransmission({
            txId,
            txNumber: nextNum,
            ...input,
            imageUrl: normalizeOptionalText(input.imageUrl),
            youtubeUrl: normalizeOptionalText(input.youtubeUrl),
            encodedArchetype: normalizeOptionalText(input.encodedArchetype),
            leftPanelPrompt: normalizeOptionalText(input.leftPanelPrompt),
            centerPanelPrompt: normalizeOptionalText(input.centerPanelPrompt),
            rightPanelPrompt: normalizeOptionalText(input.rightPanelPrompt),
            hashtags: normalizeOptionalText(input.hashtags),
          });
          return { success: true, txId, txNumber: nextNum };
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            title: z.string().min(1).optional(),
            field: z.string().min(1).optional(),
            coreMessage: z.string().min(1).optional(),
            tags: z.string().optional(),
            microSigil: z.string().optional(),
            imageUrl: z.string().optional(),
            youtubeUrl: z.string().optional(),
            signalClarity: z.string().optional(),
            channelStatus: z
              .enum([
                "OPEN",
                "RESONANT",
                "COHERENT",
                "PROPHETIC",
                "LIVE",
                "STABLE",
                "HIGH COHERENCE",
                "MAXIMUM COHERENCE",
                "CRITICAL / STABLE",
              ])
              .optional(),
            encodedArchetype: z.string().optional(),
            leftPanelPrompt: z.string().optional(),
            centerPanelPrompt: z.string().optional(),
            rightPanelPrompt: z.string().optional(),
            hashtags: z.string().optional(),
            cycle: z.string().optional(),
            status: z
              .enum(["Draft", "Confirmed", "Deprecated", "Mythic"])
              .optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateTransmission(id, {
            ...data,
            ...(Object.prototype.hasOwnProperty.call(data, "imageUrl")
              ? { imageUrl: normalizeOptionalText(data.imageUrl) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "youtubeUrl")
              ? { youtubeUrl: normalizeOptionalText(data.youtubeUrl) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "encodedArchetype")
              ? {
                  encodedArchetype: normalizeOptionalText(
                    data.encodedArchetype
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "leftPanelPrompt")
              ? { leftPanelPrompt: normalizeOptionalText(data.leftPanelPrompt) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "centerPanelPrompt")
              ? {
                  centerPanelPrompt: normalizeOptionalText(
                    data.centerPanelPrompt
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "rightPanelPrompt")
              ? {
                  rightPanelPrompt: normalizeOptionalText(
                    data.rightPanelPrompt
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "hashtags")
              ? { hashtags: normalizeOptionalText(data.hashtags) }
              : {}),
          });
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteTransmission(input.id);
          return { success: true };
        }),
    }),

    oracles: router({
      list: adminProcedure.query(async () => {
        return db.getAllOraclesForAdmin();
      }),

      /** Approve a drafted oracle: Past goes public now, the rest daily. */
      publish: adminProcedure
        .input(z.object({ oracleId: z.string().min(1) }))
        .mutation(async ({ input }) => {
          const published = await publishOracle(input.oracleId);
          if (!published) {
            throw new Error("Oracle is not a draft awaiting approval.");
          }
          return { success: true };
        }),

      create: adminProcedure
        .input(
          z.object({
            part: z.enum(["Past", "Present", "Future"]),
            title: z.string().min(1),
            field: z.string().min(1),
            content: z.string().min(1),
            imageUrl: z.string().optional(),
            youtubeUrl: z.string().optional(),
            signalClarity: z.string().default("95.2%"),
            channelStatus: z
              .enum(["OPEN", "RESONANT", "PROPHETIC", "LIVE"])
              .default("OPEN"),
            currentFieldSignatures: z.string().optional(),
            encodedTrajectory: z.string().optional(),
            convergenceZones: z.string().optional(),
            keyInflectionPoint: z.string().optional(),
            majorOutcomes: z.string().optional(),
            visualStyle: z.string().optional(),
            hashtags: z.string().optional(),
            linkedCodons: z.string().optional(),
            threadId: z.string().optional(),
            threadTitle: z.string().optional(),
            threadOrder: z.number().optional(),
            threadSynthesis: z.string().optional(),
            status: z
              .enum(["Draft", "Confirmed", "Deprecated", "Prophetic"])
              .default("Confirmed"),
            oracleId: z.string().optional(),
            oracleNumber: z.number().optional(),
          })
        )
        .mutation(async ({ input }) => {
          const {
            oracleId: inputOracleId,
            oracleNumber: inputOracleNumber,
            ...data
          } = input;
          const oracleNumber =
            inputOracleNumber ?? (await db.getNextOracleNumber());
          const oracleId =
            inputOracleId || `OX-${String(oracleNumber).padStart(4, "0")}`;
          await db.createOracle({
            oracleId,
            oracleNumber,
            ...data,
            imageUrl: normalizeOptionalText(data.imageUrl),
            youtubeUrl: normalizeOptionalText(data.youtubeUrl),
            currentFieldSignatures: normalizeOptionalText(
              data.currentFieldSignatures
            ),
            encodedTrajectory: normalizeOptionalText(data.encodedTrajectory),
            convergenceZones: normalizeOptionalText(data.convergenceZones),
            keyInflectionPoint: normalizeOptionalText(data.keyInflectionPoint),
            majorOutcomes: normalizeOptionalText(data.majorOutcomes),
            visualStyle: normalizeOptionalText(data.visualStyle),
            hashtags: normalizeOptionalText(data.hashtags),
            linkedCodons: normalizeOptionalText(data.linkedCodons),
            threadId: normalizeOptionalText(data.threadId),
            threadTitle: normalizeOptionalText(data.threadTitle),
            threadSynthesis: normalizeOptionalText(data.threadSynthesis),
          });
          return { success: true, oracleId, oracleNumber };
        }),

      update: adminProcedure
        .input(
          z.object({
            id: z.number(),
            title: z.string().min(1).optional(),
            field: z.string().min(1).optional(),
            content: z.string().min(1).optional(),
            part: z.enum(["Past", "Present", "Future"]).optional(),
            imageUrl: z.string().optional(),
            youtubeUrl: z.string().optional(),
            signalClarity: z.string().optional(),
            channelStatus: z
              .enum(["OPEN", "RESONANT", "PROPHETIC", "LIVE"])
              .optional(),
            currentFieldSignatures: z.string().optional(),
            encodedTrajectory: z.string().optional(),
            convergenceZones: z.string().optional(),
            keyInflectionPoint: z.string().optional(),
            majorOutcomes: z.string().optional(),
            visualStyle: z.string().optional(),
            hashtags: z.string().optional(),
            linkedCodons: z.string().optional(),
            threadId: z.string().optional(),
            threadTitle: z.string().optional(),
            threadOrder: z.number().optional(),
            threadSynthesis: z.string().optional(),
            status: z
              .enum(["Draft", "Confirmed", "Deprecated", "Prophetic"])
              .optional(),
          })
        )
        .mutation(async ({ input }) => {
          const { id, ...data } = input;
          await db.updateOracle(id, {
            ...data,
            ...(Object.prototype.hasOwnProperty.call(data, "imageUrl")
              ? { imageUrl: normalizeOptionalText(data.imageUrl) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "youtubeUrl")
              ? { youtubeUrl: normalizeOptionalText(data.youtubeUrl) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(
              data,
              "currentFieldSignatures"
            )
              ? {
                  currentFieldSignatures: normalizeOptionalText(
                    data.currentFieldSignatures
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "encodedTrajectory")
              ? {
                  encodedTrajectory: normalizeOptionalText(
                    data.encodedTrajectory
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "convergenceZones")
              ? {
                  convergenceZones: normalizeOptionalText(
                    data.convergenceZones
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "keyInflectionPoint")
              ? {
                  keyInflectionPoint: normalizeOptionalText(
                    data.keyInflectionPoint
                  ),
                }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "majorOutcomes")
              ? { majorOutcomes: normalizeOptionalText(data.majorOutcomes) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "visualStyle")
              ? { visualStyle: normalizeOptionalText(data.visualStyle) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "hashtags")
              ? { hashtags: normalizeOptionalText(data.hashtags) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "linkedCodons")
              ? { linkedCodons: normalizeOptionalText(data.linkedCodons) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "threadId")
              ? { threadId: normalizeOptionalText(data.threadId) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "threadTitle")
              ? { threadTitle: normalizeOptionalText(data.threadTitle) }
              : {}),
            ...(Object.prototype.hasOwnProperty.call(data, "threadSynthesis")
              ? { threadSynthesis: normalizeOptionalText(data.threadSynthesis) }
              : {}),
          });
          return { success: true };
        }),

      delete: adminProcedure
        .input(z.object({ id: z.number() }))
        .mutation(async ({ input }) => {
          await db.deleteOracle(input.id);
          return { success: true };
        }),
    }),
  }),
});

export type AppRouter = typeof appRouter;
