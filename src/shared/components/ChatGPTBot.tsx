import { type FormEvent, useEffect, useRef, useState } from "react";
import "../styles/ChatBot.css";

type Role = "user" | "assistant";

type Message = {
  role: Role;
  text: string;
};

const INITIAL_MESSAGE: Message = {
  role: "assistant",
  text: "Hi! I'm your ApplianSys assistant. How can I help?",
};

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function extractReply(data: unknown) {
  if (!data || typeof data !== "object" || !("reply" in data)) {
    return "";
  }

  const reply = (data as { reply?: unknown }).reply;
  return typeof reply === "string" ? reply.trim() : "";
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

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messages: history,
        }),
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
          text: "I had trouble reaching the server. Check the backend chat configuration.",
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
