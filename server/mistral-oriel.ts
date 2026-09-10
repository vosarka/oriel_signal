import { Mistral } from "@mistralai/mistralai";
import { ENV } from "./_core/env";
import { LLM_LONGFORM_MAX_TOKENS, resolveMistralModel } from "./_core/llm";
import { filterORIELResponseOrReject } from "./gemini";
import { buildOrielPromptContext } from "./oriel-prompt-context";

const client = new Mistral({
  apiKey: ENV.mistralApiKey,
});

// Model selection is imported rather than duplicated, so this SDK-based path
// cannot drift onto a different Mistral model than the main chat chain.

// Mirrors the main chain: this path serves the same user-facing ORIEL prose,
// so it must not carry a tighter ceiling than invokeLLM gives that prose.
const COMPLETION_ARGS = {
  temperature: 0.7,
  maxTokens: LLM_LONGFORM_MAX_TOKENS,
  topP: 1,
} as const;

const TOOLS = [
  { toolConfiguration: null, type: "web_search" as const },
] as const;

function extractText(outputs: any[]): string {
  for (const output of outputs) {
    if (output.role !== "assistant") continue;
    const c = output.content;
    if (typeof c === "string") return c;
    if (Array.isArray(c)) {
      const block = c.find((b: any) => b.type === "text");
      if (block?.text) return block.text;
    }
  }
  return "";
}

export async function chatWithORIELMistral(
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }> = [],
  userId?: number
): Promise<string> {
  const systemPrompt = await buildOrielPromptContext({
    userId,
    userMessage,
    conversationHistory,
  });

  const inputs = [
    ...conversationHistory.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    { role: "user" as const, content: userMessage },
  ];

  const response = await (client.beta.conversations as any).start({
    inputs,
    model: resolveMistralModel(),
    instructions: systemPrompt,
    ...COMPLETION_ARGS,
    tools: TOOLS,
  });

  const raw = extractText(response.outputs ?? []);
  return (
    filterORIELResponseOrReject(raw) ||
    "I am processing your transmission. Please try again."
  );
}
