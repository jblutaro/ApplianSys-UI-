import { env } from "../../config/env.js";
import { buildLocalChatReply } from "./fallback.js";
import { buildOpenAIMessages, extractReply } from "./messages.js";
import type { ChatMessage } from "./types.js";

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
      console.error(`OpenAI request failed (${response.status}): ${await response.text()}`);
      return buildLocalChatReply(messages);
    }

    const data = (await response.json()) as unknown;
    return extractReply(data) || buildLocalChatReply(messages);
  } catch (error) {
    console.error("OpenAI request failed:", error);
    return buildLocalChatReply(messages);
  }
}
