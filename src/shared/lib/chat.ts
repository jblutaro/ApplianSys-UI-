import { requestJson } from "@/shared/lib/http";

export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  text: string;
};

type ChatResponse = {
  ok: true;
  reply: string;
};

export const INITIAL_CHAT_MESSAGE: ChatMessage = {
  role: "assistant",
  text: "Hi! I'm your ApplianSys assistant. How can I help?",
};

export async function sendChat(messages: ChatMessage[]): Promise<string> {
  const response = await requestJson<ChatResponse>("/api/chat", {
    method: "POST",
    body: JSON.stringify({ messages }),
  });

  return response.reply.trim() || "I couldn't generate a response. Please try again.";
}
