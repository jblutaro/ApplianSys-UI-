import { env } from "../../config/env.js";
import { ChatServiceError } from "./errors.js";
import { buildOpenAIMessages, extractReply } from "./messages.js";
import type { ChatMessage } from "./types.js";

export async function generateChatReply(messages: ChatMessage[]): Promise<string> {
  if (!env.openaiApiKey) {
    throw new ChatServiceError(
      500,
      "Chatbot is not configured. Add OPENAI_API_KEY to backend/.env.",
    );
  }

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
    const errorText = await response.text();
    throw new ChatServiceError(
      response.status,
      `OpenAI request failed (${response.status}): ${errorText}`,
    );
  }

  const data = (await response.json()) as unknown;
  return extractReply(data) || "I couldn't generate a response. Please try again.";
}
