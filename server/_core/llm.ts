import { ENV } from "./env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?:
      | "audio/mpeg"
      | "audio/wav"
      | "application/pdf"
      | "audio/mp4"
      | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[];
  name?: string;
  tool_call_id?: string;
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  temperature?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }

  if (part.type === "text") {
    return part;
  }

  if (part.type === "image_url") {
    return part;
  }

  if (part.type === "file_url") {
    return part;
  }

  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id } = message;

  if (role === "tool" || role === "function") {
    const content = ensureArray(message.content)
      .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
      .join("\n");

    return {
      role,
      name,
      tool_call_id,
      content,
    };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  // If there's only text content, collapse to a single string for compatibility
  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return {
      role,
      name,
      content: contentParts[0].text,
    };
  }

  return {
    role,
    name,
    content: contentParts,
  };
};

const buildProviderMessages = (messages: Message[]) => {
  const normalizedMessages = messages.map(normalizeMessage);
  const noReasoningDirective = {
    role: "system",
    content:
      "Do not include hidden reasoning, chain-of-thought, scratchpad notes, or tags such as <thought>, <think>, <reasoning>, or <analysis> in the final answer. Return only the user-facing response.",
  };

  const firstMessage = normalizedMessages[0];
  if (
    firstMessage?.role === "system" &&
    typeof firstMessage.content === "string"
  ) {
    return [
      {
        ...firstMessage,
        content: `${firstMessage.content}\n\n${noReasoningDirective.content}`,
      },
      ...normalizedMessages.slice(1),
    ];
  }

  return [noReasoningDirective, ...normalizedMessages];
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;

  if (toolChoice === "none" || toolChoice === "auto") {
    return toolChoice;
  }

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) {
      throw new Error(
        "tool_choice 'required' was provided but no tools were configured"
      );
    }

    if (tools.length > 1) {
      throw new Error(
        "tool_choice 'required' needs a single tool or specify the tool name explicitly"
      );
    }

    return {
      type: "function",
      function: { name: tools[0].function.name },
    };
  }

  if ("name" in toolChoice) {
    return {
      type: "function",
      function: { name: toolChoice.name },
    };
  }

  return toolChoice;
};

const resolveGeminiUrl = () =>
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const resolveGeminiKey = () => ENV.geminiApiKey;

const resolveGeminiModel = () =>
  ENV.llmModel || ENV.geminiModel || "gemini-3.8-flash";

const resolveGemmaUrl = () =>
  ENV.gemmaApiUrl ||
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// Gemma's key never falls back to the Gemini key: GEMMA_API_URL now points at
// Groq by default, and a Gemini key sent to Groq is a guaranteed 401 that
// silently burns a fallback hop instead of skipping straight past it.
const resolveGemmaKey = () => ENV.gemmaApiKey;

// Must stay a non-reasoning model. A reasoning model leaks its scratchpad
// into `content`; filterORIELResponse strips those blocks after
// hasUsableAssistantContent has already passed, so the user gets a reply
// that was gutted rather than a clean fallback to the next provider.
const resolveGemmaModel = () =>
  ENV.llmModel || ENV.gemmaModel || "llama-3.3-70b-versatile";

const resolveForgeUrl = () => ENV.forgeApiUrl;

const resolveForgeKey = () => ENV.forgeApiKey;

const resolveForgeModel = () =>
  ENV.llmModel || ENV.forgeModel || "gemini-2.5-flash";

const resolveMistralUrl = () =>
  ENV.mistralApiUrl || "https://api.mistral.ai/v1/chat/completions";

const resolveMistralKey = () => ENV.mistralApiKey;

// Paid primary leg. Large 3 costs less per output token than Medium 3.5 and
// carries ORIEL's layered register, which mistral-small could not.
const resolveMistralModel = () => ENV.mistralModel || "mistral-large-latest";

const isLocalUrl = (url: string) =>
  url.includes("localhost") || url.includes("127.0.0.1");

function elapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}

function usesGeminiThreeSamplingRules(model: string) {
  return /^gemini-3(?:[.-]|$)/i.test(model);
}

function resolveMaxTokens(providerUrl: string, requested: number): number {
  const n = Number.isFinite(requested) && requested > 0 ? requested : 2048;
  // Groq free TPM is tight. Reserving 8192 output tokens stalls the fat Oriel prompt.
  if (providerUrl.includes("api.groq.com")) {
    return Math.min(n, 1536);
  }
  // 8192 is the ceiling every call used before the provider migration made
  // max_tokens configurable. Dropping it to 4096 silently truncated ORIEL.
  return Math.min(n, 8192);
}

function resolveProviderTimeoutMs(provider: {
  name: string;
  url: string;
}): number {
  const cap = ENV.llmRequestTimeoutMs;
  let preferred = cap;
  // The deadline stays armed through the body read and the call is not
  // streamed, so this budgets the entire generation, not just connect time.
  if (provider.name === "Mistral") preferred = 30_000;
  else if (provider.url.includes("api.groq.com")) preferred = 20_000;
  else if (provider.name === "Gemini") preferred = 12_000;
  return Math.min(cap, preferred);
}

function hasUsableAssistantContent(result: InvokeResult): boolean {
  const message = result.choices?.[0]?.message;
  if (!message) return false;
  if (message.tool_calls && message.tool_calls.length > 0) return true;
  const content = message.content;
  if (typeof content === "string") return content.trim().length > 0;
  if (Array.isArray(content)) {
    return content.some(
      part => part.type === "text" && part.text.trim().length > 0
    );
  }
  return false;
}

function redactSecrets(text: string) {
  return [
    ENV.geminiApiKey,
    ENV.gemmaApiKey,
    ENV.forgeApiKey,
    ENV.mistralApiKey,
  ]
    .filter(secret => secret.length >= 6)
    .reduce(
      (current, secret) => current.split(secret).join("[redacted]"),
      text
    );
}

function formatProviderError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return redactSecrets(message.slice(0, 500));
}

const assertApiKey = () => {
  const geminiKey = resolveGeminiKey();
  const gemmaKey = resolveGemmaKey();
  const gemmaUrl = resolveGemmaUrl();
  const forgeKey = resolveForgeKey();
  const mistralKey = resolveMistralKey();
  if (
    !gemmaKey &&
    !geminiKey &&
    !forgeKey &&
    !mistralKey &&
    !isLocalUrl(gemmaUrl)
  ) {
    throw new Error(
      "No LLM API key configured. Set MISTRAL_API_KEY, GEMMA_API_KEY, GEMINI_API_KEY, BUILT_IN_FORGE_API_KEY, or point GEMMA_API_URL at a local OpenAI-compatible server."
    );
  }
};

const normalizeResponseFormat = ({
  responseFormat,
  response_format,
  outputSchema,
  output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}):
  | { type: "json_schema"; json_schema: JsonSchema }
  | { type: "text" }
  | { type: "json_object" }
  | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (
      explicitFormat.type === "json_schema" &&
      !explicitFormat.json_schema?.schema
    ) {
      throw new Error(
        "responseFormat json_schema requires a defined schema object"
      );
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;

  if (!schema.name || !schema.schema) {
    throw new Error("outputSchema requires both name and schema");
  }

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();

  const {
    messages,
    tools,
    toolChoice,
    tool_choice,
    temperature,
    maxTokens,
    max_tokens,
    outputSchema,
    output_schema,
    responseFormat,
    response_format,
  } = params;

  const basePayload: Record<string, unknown> = {
    messages: buildProviderMessages(messages),
  };

  if (tools && tools.length > 0) {
    basePayload.tools = tools;
  }

  const normalizedToolChoice = normalizeToolChoice(
    toolChoice || tool_choice,
    tools
  );
  if (normalizedToolChoice) {
    basePayload.tool_choice = normalizedToolChoice;
  }

  const requestedMaxTokens = maxTokens ?? max_tokens ?? 2048;

  if (temperature !== undefined) {
    basePayload.temperature = temperature;
  }

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat,
    response_format,
    outputSchema,
    output_schema,
  });

  if (normalizedResponseFormat) {
    basePayload.response_format = normalizedResponseFormat;
  }

  const invokeProvider = async (provider: {
    name: string;
    url: string;
    key?: string;
    model: string;
    attempt: number;
  }) => {
    const startedAt = Date.now();
    console.log(
      `[LLM] Attempting ${provider.name} API call with model ${provider.model} ` +
        `(attempt ${provider.attempt})...`
    );
    const headers: Record<string, string> = {
      "content-type": "application/json",
    };
    if (provider.key) {
      headers.authorization = `Bearer ${provider.key}`;
    }

    const requestPayload: Record<string, unknown> = {
      ...basePayload,
      model: provider.model,
      max_tokens: resolveMaxTokens(provider.url, requestedMaxTokens),
    };
    if (usesGeminiThreeSamplingRules(provider.model)) {
      delete requestPayload.temperature;
    }
    // Mistral hard-caps temperature at 1.5 and recommends staying under 0.7.
    // Callers escalate temperature on Gemini's 0-2 scale, which lands at the
    // very top of Mistral's range and produces incoherent output.
    if (
      provider.name === "Mistral" &&
      typeof requestPayload.temperature === "number"
    ) {
      requestPayload.temperature = Math.min(requestPayload.temperature, 1);
    }

    // ponytail: one retry with at most a minute of backoff; sustained load needs provider quota.
    for (let retry = 0; ; retry += 1) {
      const controller = new AbortController();
      let timeout: ReturnType<typeof setTimeout> | null = null;
      const timeoutMs = resolveProviderTimeoutMs(provider);
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeout = setTimeout(() => {
          controller.abort();
          reject(new Error(`${provider.name} timed out after ${timeoutMs}ms`));
        }, timeoutMs);
      });

      const requestPromise = (async () => {
        const response = await fetch(provider.url, {
          method: "POST",
          headers,
          signal: controller.signal,
          body: JSON.stringify(requestPayload),
        });
        // Keep the deadline active until the body has arrived, not just the headers.
        return { response, body: await response.text() };
      })();

      const { response, body } = await Promise.race([
        requestPromise,
        timeoutPromise,
      ]).finally(() => {
        if (timeout) clearTimeout(timeout);
      });

      if (response.ok) {
        const result = JSON.parse(body) as InvokeResult;
        if (!hasUsableAssistantContent(result)) {
          throw new Error(
            `${provider.name} returned no assistant content after ${elapsedMs(startedAt)}ms`
          );
        }
        if (result.choices?.[0]?.finish_reason === "length") {
          console.warn(
            `[LLM] ${provider.name} hit its output ceiling ` +
              `(max_tokens=${requestPayload.max_tokens}); the reply was truncated`
          );
        }
        console.log(
          `[LLM][bench] provider=${provider.name} model=${provider.model} ` +
            `latency_ms=${elapsedMs(startedAt)} success=true`
        );
        return result;
      }

      const retryAfter = response.headers.get("retry-after");
      const retryAfterMs =
        retryAfter === null || retryAfter.trim() === ""
          ? NaN
          : /^\d+(?:\.\d+)?$/.test(retryAfter)
            ? Number(retryAfter) * 1000
            : Date.parse(retryAfter) - Date.now();
      // Groq can reject again at Retry-After; allow its token bucket to refill.
      const tokenReset = provider.url.includes("api.groq.com")
        ? response.headers
            .get("x-ratelimit-reset-tokens")
            ?.match(/^(?:(\d+)m)?(?:(\d+(?:\.\d+)?)s)?$/)
        : null;
      const tokenResetMs = tokenReset
        ? (Number(tokenReset[1] ?? 0) * 60 + Number(tokenReset[2] ?? 0)) * 1000
        : 0;
      const retryMs = Math.max(retryAfterMs, tokenResetMs);
      if (
        response.status === 429 &&
        retry === 0 &&
        Number.isFinite(retryMs) &&
        retryMs >= 0 &&
        retryMs <= 60_000 &&
        response.headers.get("x-ratelimit-limit-req-minute") !== "0"
      ) {
        console.warn(
          `[LLM] ${provider.name} rate limited; retrying once after ${retryMs}ms`
        );
        await new Promise(resolve => setTimeout(resolve, retryMs));
        continue;
      }

      throw new Error(
        redactSecrets(
          `${provider.name} failed after ${elapsedMs(startedAt)}ms: ` +
            `${response.status} ${response.statusText} – ${body}`
        )
      );
    }
  };

  const gemmaProvider = {
    name: "Gemma",
    url: resolveGemmaUrl(),
    key: resolveGemmaKey(),
    model: resolveGemmaModel(),
  };
  const geminiProvider = {
    name: "Gemini",
    url: resolveGeminiUrl(),
    key: resolveGeminiKey(),
    model: resolveGeminiModel(),
  };
  const forgeProvider = {
    name: "Forge",
    url: resolveForgeUrl(),
    key: resolveForgeKey(),
    model: resolveForgeModel(),
  };
  const mistralProvider = {
    name: "Mistral",
    url: resolveMistralUrl(),
    key: resolveMistralKey(),
    model: resolveMistralModel(),
  };

  const selectedProvider = ENV.llmProvider;
  // Money-safe default for mistral: Mistral → Groq → Gemini (paid last).
  const providers =
    selectedProvider === "mistral"
      ? [mistralProvider, gemmaProvider, geminiProvider]
      : selectedProvider === "gemma"
        ? [gemmaProvider, mistralProvider, geminiProvider]
        : selectedProvider === "forge"
          ? [forgeProvider, gemmaProvider, geminiProvider]
          : selectedProvider === "gemini"
            ? [geminiProvider, gemmaProvider, mistralProvider]
            : [mistralProvider, gemmaProvider, geminiProvider];

  let lastError: unknown = null;
  const attemptErrors: Array<{ provider: string; message: string }> = [];
  let attempt = 0;
  for (const provider of providers) {
    if (!provider.url || (!provider.key && !isLocalUrl(provider.url))) {
      console.warn(
        `[LLM] Skipping ${provider.name}: ${
          !provider.url ? "no URL configured" : "no API key configured"
        }`
      );
      continue;
    }

    attempt += 1;
    try {
      return await invokeProvider({ ...provider, attempt });
    } catch (error) {
      lastError = error;
      const message = formatProviderError(error);
      attemptErrors.push({ provider: provider.name, message });
      console.warn(
        `[LLM][bench] provider=${provider.name} model=${provider.model} success=false`
      );
      console.warn(
        `[LLM] ${provider.name} API error on attempt ${attempt}: ${message}`
      );
    }
  }

  if (attemptErrors.length > 0) {
    const summary = attemptErrors
      .map(({ provider, message }) => `${provider}: ${message}`)
      .join(" | ");
    throw new Error(`All LLM providers failed — ${summary}`);
  }

  throw lastError instanceof Error
    ? lastError
    : new Error(
        "No LLM API available: all configured providers failed or are unavailable"
      );
}
