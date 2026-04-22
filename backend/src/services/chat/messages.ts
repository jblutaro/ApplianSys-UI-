import type { ChatMessage, OpenAIMessage } from "./types.js";

const SYSTEM_PROMPT =
  "You are a helpful assistant for the ApplianSys storefront. Keep answers concise and practical. They sell electronic appliances like speakers, TVs, refrigerators, washing machines, and microwaves. Assist users with product information, recommendations, and store policies.";

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "role" in item &&
        "text" in item &&
        ((item as { role?: unknown }).role === "user" ||
          (item as { role?: unknown }).role === "assistant") &&
        typeof (item as { text?: unknown }).text === "string",
    )
  );
}

export function buildOpenAIMessages(history: ChatMessage[]): OpenAIMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((message) => ({
      role: message.role,
      content: message.text,
    })),
  ];
}

export function extractReply(data: unknown) {
  if (!data || typeof data !== "object" || !("choices" in data)) {
    return "";
  }

  const choices = (data as { choices?: unknown }).choices;
  if (!isUnknownArray(choices) || choices.length === 0) {
    return "";
  }

  const first = choices[0];
  if (!first || typeof first !== "object" || !("message" in first)) {
    return "";
  }

  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object" || !("content" in message)) {
    return "";
  }

  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content.trim() : "";
}
