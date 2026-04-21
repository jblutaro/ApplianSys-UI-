import { Router } from "express";
import { env } from "../config/env.js";

type Role = "user" | "assistant";

type ChatMessage = {
  role: Role;
  text: string;
};

type OpenAIMessage = {
  role: "system" | Role;
  content: string;
};

const SYSTEM_PROMPT =
  "You are a helpful assistant for the ApplianSys storefront. Keep answers concise and practical. They sell electronic appliances like speakers, TVs, refrigerators, washing machines, and microwaves. Assist users with product information, recommendations, and store policies.";

export const chatRouter = Router();

function isChatMessageArray(value: unknown): value is ChatMessage[] {
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

function buildMessages(history: ChatMessage[]): OpenAIMessage[] {
  return [
    { role: "system", content: SYSTEM_PROMPT },
    ...history.map((message) => ({
      role: message.role,
      content: message.text,
    })),
  ];
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function extractReply(data: unknown) {
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

chatRouter.post("/", async (req, res, next) => {
  try {
    const { messages } = req.body as { messages?: unknown };

    if (!env.openaiApiKey) {
      res.status(500).json({
        ok: false,
        message: "Chatbot is not configured. Add OPENAI_API_KEY to backend/.env.",
      });
      return;
    }

    if (!isChatMessageArray(messages) || messages.length === 0) {
      res.status(400).json({
        ok: false,
        message: "A non-empty messages array is required.",
      });
      return;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.openaiModel,
        messages: buildMessages(messages),
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      res.status(response.status).json({
        ok: false,
        message: `OpenAI request failed (${response.status}): ${errorText}`,
      });
      return;
    }

    const raw = await response.text();
    const data = safeJsonParse(raw);
    const reply =
      extractReply(data) || "I couldn't generate a response. Please try again.";

    res.json({
      ok: true,
      reply,
    });
  } catch (error) {
    next(error);
  }
});
