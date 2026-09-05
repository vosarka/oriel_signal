const nodeEnv = process.env.NODE_ENV ?? "development";
const runMigrationsEnv = process.env.RUN_MIGRATIONS?.toLowerCase();
const autonomyRuntimeEnv = process.env.ORIEL_AUTONOMY_RUNTIME?.toLowerCase();
const wikiEvolutionEnv = process.env.ORIEL_WIKI_EVOLUTION?.toLowerCase();
const mindMemosEnv = process.env.ORIEL_MINDMEMOS?.toLowerCase();
const llmProviderEnv = process.env.LLM_PROVIDER?.toLowerCase();
const llmRequestTimeoutEnv = Number(process.env.LLM_REQUEST_TIMEOUT_MS);
const paypalEnvironmentEnv = (
  process.env.PAYPAL_ENVIRONMENT ??
  process.env.PAYPAL_MODE
)?.toLowerCase();

const resolveRunMigrations = () => {
  if (runMigrationsEnv === "true") return true;
  if (runMigrationsEnv === "false") return false;
  return false;
};

const resolveAutonomyRuntimeEnabled = () => autonomyRuntimeEnv === "true";
const resolveWikiEvolutionEnabled = () => wikiEvolutionEnv === "true";
const resolveMindMemosEnabled = () => mindMemosEnv === "true";
const resolveLlmProvider = () =>
  llmProviderEnv === "gemma" ||
  llmProviderEnv === "gemini" ||
  llmProviderEnv === "forge" ||
  llmProviderEnv === "mistral"
    ? llmProviderEnv
    : "gemini";
const resolveLlmRequestTimeoutMs = () =>
  Number.isFinite(llmRequestTimeoutEnv) && llmRequestTimeoutEnv > 0
    ? Math.max(1, Math.floor(llmRequestTimeoutEnv))
    : 45_000;
const resolvePayPalEnvironment = () =>
  paypalEnvironmentEnv === "live" ? "live" : "sandbox";
const paypalEnvironment = resolvePayPalEnvironment();

export const ENV = {
  nodeEnv,
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  isProduction: nodeEnv === "production",
  runMigrations: resolveRunMigrations(),
  // OFF by default: autonomy runtime overlays only activate when explicitly enabled.
  enableOrielAutonomyRuntime: resolveAutonomyRuntimeEnabled(),
  // OFF by default: the wiki is re-injected into ORIEL's prompt, so model-authored
  // wiki writes can turn an interpretation into canon on the next turn.
  enableOrielWikiEvolution: resolveWikiEvolutionEnabled(),
  // OFF by default: MindMemOS is a reconstructible semantic index, not the
  // official memory store. oriel.chat does not call it until this is enabled.
  enableOrielMindMemos: resolveMindMemosEnabled(),
  mindMemosBaseUrl: process.env.ORIEL_MINDMEMOS_BASE_URL ?? "",
  mindMemosApiKey: process.env.ORIEL_MINDMEMOS_API_KEY ?? "",
  llmProvider: resolveLlmProvider(),
  llmRequestTimeoutMs: resolveLlmRequestTimeoutMs(),
  llmModel: process.env.LLM_MODEL ?? "",
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL ?? "",
  geminiImageModel: process.env.GEMINI_IMAGE_MODEL ?? "",
  gemmaApiKey: process.env.GEMMA_API_KEY ?? "",
  gemmaApiUrl: process.env.GEMMA_API_URL ?? "",
  gemmaModel: process.env.GEMMA_MODEL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeModel: process.env.BUILT_IN_FORGE_MODEL ?? "",
  mistralApiKey: process.env.MISTRAL_API_KEY ?? "",
  mistralApiUrl: process.env.MISTRAL_API_URL ?? "",
  mistralModel: process.env.MISTRAL_MODEL ?? "",
  googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
  appBaseUrl: process.env.APP_BASE_URL ?? "",

  // ─── Better Auth ────────────────────────────────────────────────────────
  betterAuthSecret: process.env.BETTER_AUTH_SECRET ?? "",

  // ─── SMTP (Password Recovery Email) ────────────────────────────────────
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: process.env.SMTP_PORT ?? "",
  smtpUser: process.env.SMTP_USER ?? "",
  smtpPass: process.env.SMTP_PASS ?? "",
  smtpSecure: process.env.SMTP_SECURE ?? "",
  authEmailFrom: process.env.AUTH_EMAIL_FROM ?? "",

  // ─── Resend (Email OTP) ────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  resendFrom: process.env.RESEND_FROM ?? "",

  // ─── Twilio (Phone SMS) ────────────────────────────────────────────
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",

  // ─── Inworld (TTS & Realtime) ─────────────────────────────────────────
  inworldApiKey: process.env.INWORLD_API_KEY ?? "",
  inworldRealtimeModel: process.env.INWORLD_REALTIME_MODEL ?? "",
  inworldRealtimeSttModel: process.env.INWORLD_REALTIME_STT_MODEL ?? "",
  inworldRealtimeTtsModel: process.env.INWORLD_REALTIME_TTS_MODEL ?? "",
  inworldRealtimeVoiceSophianic:
    process.env.INWORLD_REALTIME_VOICE_SOPHIANIC ?? "",
  inworldRealtimeVoiceDeep: process.env.INWORLD_REALTIME_VOICE_DEEP ?? "",
  inworldRealtimeVadEagerness: process.env.INWORLD_REALTIME_VAD_EAGERNESS ?? "",

  // ─── Stripe (Signature Letters) ─────────────────────────────────────────
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  stripeSignatureGlimpsePriceId:
    process.env.STRIPE_SIGNATURE_GLIMPSE_PRICE_ID ?? "",
  stripeFoundingSignaturePriceId:
    process.env.STRIPE_FOUNDING_SIGNATURE_PRICE_ID ?? "",

  // ─── PayPal (Tetradic Signature Founder Edition) ────────────────────────
  paypalEnvironment,
  paypalApiBaseUrl:
    paypalEnvironment === "live"
      ? "https://api-m.paypal.com"
      : "https://api-m.sandbox.paypal.com",
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID ?? "",

  // ─── S3-Compatible Storage (Signature PDFs) ─────────────────────────────
  s3Endpoint: process.env.S3_ENDPOINT ?? "",
  s3Region: process.env.S3_REGION ?? "auto",
  s3Bucket: process.env.S3_BUCKET ?? "",
  s3AccessKeyId: process.env.S3_ACCESS_KEY_ID ?? "",
  s3SecretAccessKey: process.env.S3_SECRET_ACCESS_KEY ?? "",
  s3PublicBaseUrl: process.env.S3_PUBLIC_BASE_URL ?? "",
};
