import { env } from "../../config/env.js";
import { buildLocalChatReply } from "./fallback.js";
import { buildOpenAIMessages, extractReply } from "./messages.js";
import type { ChatMessage } from "./types.js";

function redactApiKeys(value: string) {
  return value.replace(/\b(?:s?sk|sk-proj)-[A-Za-z0-9_-]+/g, (match) => {
    const prefix = match.startsWith("ssk-") ? "ssk-" : match.startsWith("sk-proj-") ? "sk-proj-" : "sk-";
    return `${prefix}[redacted]`;
  });
}

async function logOpenAIError(response: Response) {
  if (response.status === 429) {
    console.warn("OpenAI quota or rate limit reached. Using local chatbot fallback.");
    return;
  }

  const errorText = await response.text();
  console.error(`OpenAI request failed (${response.status}): ${redactApiKeys(errorText)}`);
}

export async function generateChatReply(messages: ChatMessage[]): Promise<string> {
  if (!env.openaiApiKey) {
    return buildLocalChatReply(messages);
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages: buildOpenAIMessages(messages),
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      await logOpenAIError(response);
      return buildLocalChatReply(messages);
    }

    const data = (await response.json()) as unknown;
    return extractReply(data) || buildLocalChatReply(messages);
  } catch (error) {
    console.error("OpenAI request failed:", error);
    return buildLocalChatReply(messages);
  }
}
