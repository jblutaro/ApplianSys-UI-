import { useEffect, useRef } from "react";
import { useChatbot } from "@/shared/hooks/useChatbot";
import "../styles/ChatBot.css";

export default function ChatGPTBot() {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const {
    handleClear,
    handleSend,
    input,
    isLoading,
    isOpen,
    messages,
    setInput,
    toggleOpen,
  } = useChatbot();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  return (
    <>
      <button
        className="chatbot-fab"
        onClick={toggleOpen}
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
