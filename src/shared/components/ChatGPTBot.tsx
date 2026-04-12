import { type FormEvent, useEffect, useRef, useState } from "react";
import "../styles/ChatBot.css";

type Role = "user" | "assistant";
type OpenAIRole = "system" | Role;

type Message = {
  role: Role;
  text: string;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "Hi! I'm your ApplianSys assistant. How can I help?",
};

const SYSTEM_PROMPT =
  "You are a helpful assistant for the ApplianSys storefront. Keep answers concise and practical. They sell electronic appliances like speakers, TVs, refrigerators, washing machines, and microwaves. Assist users with product information, recommendations, and store policies.";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type OpenAIMessage = {
  role: OpenAIRole;
  content: string;
};

function buildMessages(history: Message[]): OpenAIMessage[] {
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

export default function ChatGPTBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    if (!apiKey) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Missing API key. Set VITE_OPENAI_API_KEY and restart Vite.",
        },
      ]);
      return;
    }

    const userMessage: Message = { role: "user", text: trimmed };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const history =
        nextMessages[0] === INITIAL_MESSAGE
          ? nextMessages.slice(1)
          : nextMessages;

      const model = import.meta.env.VITE_OPENAI_MODEL || "gpt-4o-mini";
      const payload = {
        model,
        messages: buildMessages(history),
        temperature: 0.7,
      };

      const response = await fetch(OPENAI_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `OpenAI request failed (${response.status}): ${errorText}`,
        );
      }

      const raw = await response.text();
      const data = safeJsonParse(raw);
      const replyText =
        extractReply(data) ||
        "I couldn't generate a response. Please try again.";

      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "I had trouble reaching the server. Check your API key and network.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_MESSAGE]);
  };

  return (
    <>
      <button
        className="chatbot-fab"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={isOpen ? "Close chat" : "Open chat"}
      >
        {isOpen ? "X" : "Chat"}
      </button>

      {isOpen && (
        <div className="chatbot-panel" role="dialog" aria-live="polite">
          <div className="chatbot-header">
            <div>
              <div className="chatbot-title">ApplianSys Assistant</div>
            </div>
            <button className="chatbot-clear" onClick={handleClear}>
              Clear
            </button>
          </div>

          <div className="chatbot-messages">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`chatbot-message ${message.role}`}
              >
                {message.text || (isLoading ? "..." : "")}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form
            className="chatbot-input"
            onSubmit={(event) => void handleSend(event)}
          >
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask about products or categories..."
              aria-label="Chat message"
            />
            <button type="submit" disabled={!input.trim() || isLoading}>
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
