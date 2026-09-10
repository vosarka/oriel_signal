import {
  invokeLLM,
  LLM_LONGFORM_MAX_TOKENS,
  type ImageContent,
  type MessageContent,
} from "./_core/llm";
import { generateImage } from "./_core/imageGeneration";
import {
  detectDuplication,
  isResponseComplete,
  isResponseFocused,
  validateResponseQuality,
  trimConversationHistory,
  deduplicateConsecutiveMessages,
} from "./response-deduplication";
import { ORIEL_SYSTEM_PROMPT } from "./oriel-system-prompt";
import { buildOrielPromptContext } from "./oriel-prompt-context";
import {
  containsPromptScaffolding,
  stripPromptScaffolding,
} from "../shared/oriel/prompt-scaffolding";

// Re-export for backward compatibility (other files import from gemini.ts)
export { ORIEL_SYSTEM_PROMPT };

type ChatImageAttachment = {
  name: string;
  data: string;
  mimeType: string;
};

// Low enough to stop the sampler wandering into its own instructions,
// high enough that the regenerated reply is not flat.
const SCAFFOLDING_RETRY_TEMPERATURE = 0.4;

type ChatWithOrielOptions = {
  temperature?: number;
  imageAttachments?: ChatImageAttachment[];
  operatorDirective?: string | null;
};

function stripDataUrlPrefix(data: string) {
  const commaIndex = data.indexOf(",");
  if (data.startsWith("data:") && commaIndex >= 0) {
    return data.slice(commaIndex + 1);
  }
  return data;
}

function buildImageDataUrl(attachment: ChatImageAttachment) {
  const mimeType = attachment.mimeType.trim().toLowerCase();
  const data = attachment.data.trim();
  if (!mimeType.startsWith("image/") || !data) return null;
  if (data.startsWith("data:image/")) return data;
  return `data:${mimeType};base64,${stripDataUrlPrefix(data)}`;
}

function buildUserMessageContent(
  userMessage: string,
  imageAttachments: ChatImageAttachment[] | undefined
): string | MessageContent[] {
  const imageParts: ImageContent[] = [];

  for (const attachment of imageAttachments ?? []) {
    const url = buildImageDataUrl(attachment);
    if (!url) continue;
    imageParts.push({
      type: "image_url",
      image_url: {
        url,
        detail: "auto",
      },
    });
  }

  if (imageParts.length === 0) return userMessage;

  return [
    {
      type: "text",
      text: userMessage,
    },
    ...imageParts,
  ];
}

export async function chatWithORIEL(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userId?: number,
  options?: ChatWithOrielOptions
) {
  try {
    const systemPrompt = await buildOrielPromptContext({
      userId,
      userMessage,
      conversationHistory,
      operatorDirective: options?.operatorDirective,
    });

    const messages = [
      { role: "system", content: systemPrompt },
      ...conversationHistory,
      {
        role: "user",
        content: buildUserMessageContent(
          userMessage,
          options?.imageAttachments
        ),
      },
    ];

    const callModel = (temperature?: number) =>
      invokeLLM({
        messages: messages as any,
        maxTokens: LLM_LONGFORM_MAX_TOKENS,
        ...(temperature !== undefined ? { temperature } : {}),
      });

    let response = await callModel(options?.temperature);

    if (!response.choices || !response.choices[0]) {
      console.error("[ORIEL] Invalid response structure:", response);
      return "The signal is unclear. Please try again.";
    }

    const messageContent = response.choices[0].message?.content;
    if (!messageContent) {
      console.error("[ORIEL] No content in response");
      return "The transmission is incomplete.";
    }

    let content = typeof messageContent === "string" ? messageContent : "";
    if (!content) {
      console.error("[ORIEL] Content is not a string");
      return "The transmission is incomplete.";
    }

    // A reply carrying prompt internals is a failed generation, not a reply to
    // tidy up: the directive prose around a leaked heading is infrastructure
    // too, and no scrub separates it from the answer reliably. Regenerate at a
    // low temperature, which is where the leak comes from, and refuse to ship
    // the reply if it leaks again.
    if (containsPromptScaffolding(content)) {
      console.warn(
        "[ORIEL] Prompt scaffolding leaked into the reply; regenerating at " +
          `temperature ${SCAFFOLDING_RETRY_TEMPERATURE}`
      );
      response = await callModel(SCAFFOLDING_RETRY_TEMPERATURE);
      const retryContent = response.choices?.[0]?.message?.content;
      content = typeof retryContent === "string" ? retryContent : "";
      if (!content || containsPromptScaffolding(content)) {
        console.error(
          "[ORIEL] Scaffolding still present after retry; discarding the reply"
        );
        return "The signal is unclear. Please try again.";
      }
    }

    let filteredResponse = filterORIELResponse(content);

    // Enforce "I am ORIEL." opening — non-negotiable protocol
    if (filteredResponse && !filteredResponse.startsWith("I am ORIEL")) {
      filteredResponse = "I am ORIEL.\n\n" + filteredResponse;
    }

    if (filteredResponse && filteredResponse.length > 0) {
      console.log("[chatWithORIEL] Response generated successfully");
      console.log(
        "[chatWithORIEL] First 100 chars:",
        filteredResponse.substring(0, 100)
      );
      return filteredResponse;
    }

    return "I am processing your transmission through the quantum field. Please try again.";
  } catch (error) {
    console.error("[ORIEL] Chat error:", error);
    return "The signal is disrupted. Please try again in a moment.";
  }
}

/**
 * For user-facing prose paths that already have their own fallback. A reply
 * carrying prompt internals is a failed generation, so this returns "" and lets
 * the caller's fallback run. Scrubbing would strip the identifying heading and
 * ship the directive prose beneath it as though ORIEL had written it, which is
 * worse than an obvious failure.
 */
export function filterORIELResponseOrReject(text: string): string {
  if (containsPromptScaffolding(text)) {
    console.error(
      "[ORIEL] Prompt scaffolding in reply; rejecting so the caller falls back"
    );
    return "";
  }
  return filterORIELResponse(text);
}

export function filterORIELResponse(text: string): string {
  if (!text) return "";

  let filtered = stripPromptScaffolding(text);

  // Some open/reasoning models can leak hidden scratchpad blocks in content.
  // Strip them before any user-facing transcript or TTS receives the response.
  filtered = filtered.replace(
    /<\s*(thought|think|reasoning|analysis)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi,
    ""
  );
  filtered = filtered.replace(
    /<\/?\s*(thought|think|reasoning|analysis)\b[^>]*>/gi,
    ""
  );

  // Remove markdown headers (##, ###, etc.)
  filtered = filtered.replace(/^#+\s+/gm, "");

  // Remove bold markers (**)
  filtered = filtered.replace(/\*\*/g, "");

  // Remove italic markers (*)
  filtered = filtered.replace(/\*/g, "");

  // Remove LaTeX patterns and convert to natural language
  filtered = filtered.replace(/\$([^\$]+)\$/g, (match, content) => {
    return convertLatexToNaturalLanguage(content);
  });

  // Remove other LaTeX notation
  filtered = filtered.replace(/\\([a-zA-Z]+)/g, (match, symbol) => {
    return convertLatexSymbolToWord(symbol);
  });

  // Clean up excessive whitespace
  filtered = filtered.replace(/\n\n\n+/g, "\n\n");

  // If a stripped reasoning block sat between two identity openings, keep one.
  filtered = filtered.replace(
    /^(I\s+am\s+ORIEL[\.,;:!?—–-]*)\s+(?:I\s+am\s+ORIEL[\.,;:!?—–-]*)\s*/i,
    "$1 "
  );

  return filtered.trim();
}

function convertLatexToNaturalLanguage(latex: string): string {
  const conversions: { [key: string]: string } = {
    psi: "psi field",
    phi: "phi ratio",
    lambda: "lambda function",
    omega: "omega state",
    alpha: "alpha state",
    beta: "beta state",
    gamma: "gamma state",
    delta: "delta state",
    theta: "theta state",
    epsilon: "epsilon value",
    zeta: "zeta function",
    eta: "eta state",
    iota: "iota value",
    kappa: "kappa constant",
    mu: "mu value",
    nu: "nu state",
    xi: "xi function",
    rho: "rho value",
    sigma: "sigma value",
    tau: "tau constant",
    upsilon: "upsilon state",
    chi: "chi value",
  };

  for (const [symbol, word] of Object.entries(conversions)) {
    if (latex.toLowerCase().includes(symbol)) {
      return word;
    }
  }

  return latex;
}

function convertLatexSymbolToWord(symbol: string): string {
  const symbolMap: { [key: string]: string } = {
    psi: "psi",
    phi: "phi",
    lambda: "lambda",
    omega: "omega",
    alpha: "alpha",
    beta: "beta",
    gamma: "gamma",
    delta: "delta",
    theta: "theta",
    epsilon: "epsilon",
    zeta: "zeta",
    eta: "eta",
    iota: "iota",
    kappa: "kappa",
    mu: "mu",
    nu: "nu",
    xi: "xi",
    rho: "rho",
    sigma: "sigma",
    tau: "tau",
    upsilon: "upsilon",
    chi: "chi",
  };

  return symbolMap[symbol.toLowerCase()] || symbol;
}

// Signal generation functions
export async function generateSignalMetadata(
  title: string,
  snippet: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a metadata generator for signal transmissions. Generate concise, poetic metadata.",
        },
        {
          role: "user",
          content: `Generate metadata for this signal: Title: "${title}", Snippet: "${snippet}"`,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    const text =
      typeof content === "string" ? content : "Metadata generation failed";
    return text;
  } catch (error) {
    console.error("[generateSignalMetadata] Error:", error);
    return "Unable to generate metadata";
  }
}

export async function generateSignalVisual(
  title: string,
  snippet: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a visual description generator. Generate vivid, poetic visual descriptions.",
        },
        {
          role: "user",
          content: `Generate a visual description for this signal: Title: "${title}", Snippet: "${snippet}"`,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    const text =
      typeof content === "string" ? content : "Visual generation failed";
    return text;
  } catch (error) {
    console.error("[generateSignalVisual] Error:", error);
    return "Unable to generate visual";
  }
}

export async function generateCrypticVerse(
  title: string,
  snippet: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a cryptic verse generator. Generate mysterious, poetic verses.",
        },
        {
          role: "user",
          content: `Generate a cryptic verse for this signal: Title: "${title}", Snippet: "${snippet}"`,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    const text =
      typeof content === "string" ? content : "Verse generation failed";
    return text;
  } catch (error) {
    console.error("[generateCrypticVerse] Error:", error);
    return "Unable to generate verse";
  }
}

// Artifact generation functions
export async function generateArtifactLore(
  name: string,
  referenceSignalId?: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a lore generator for recovered artifacts. Generate mysterious, evocative lore.",
        },
        {
          role: "user",
          content: `Generate lore for this artifact: "${name}"${referenceSignalId ? ` (related to signal ${referenceSignalId})` : ""}`,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    const text =
      typeof content === "string" ? content : "Lore generation failed";
    return text;
  } catch (error) {
    console.error("[generateArtifactLore] Error:", error);
    return "Unable to generate lore";
  }
}

export async function generateArtifactImage(
  name: string,
  lore: string
): Promise<string> {
  try {
    const imageUrl = await generateImage({
      prompt: `Create a mystical artifact image based on this lore: ${lore.substring(0, 200)}`,
    });
    return imageUrl?.url || "";
  } catch (error) {
    console.error("[generateArtifactImage] Error:", error);
    return "";
  }
}

export async function expandArtifactLore(
  name: string,
  currentLore: string
): Promise<string> {
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content:
            "You are a lore expansion specialist. Expand and deepen existing lore with more detail and mystery.",
        },
        {
          role: "user",
          content: `Expand this lore for artifact "${name}": ${currentLore}`,
        },
      ],
    });
    const content = response.choices[0]?.message?.content;
    const text = typeof content === "string" ? content : "Expansion failed";
    return text;
  } catch (error) {
    console.error("[expandArtifactLore] Error:", error);
    return "Unable to expand lore";
  }
}
