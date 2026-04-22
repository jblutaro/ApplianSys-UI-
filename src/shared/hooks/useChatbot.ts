import { type FormEvent, useState } from "react";
import {
  INITIAL_CHAT_MESSAGE,
  sendChat,
  type ChatMessage,
} from "@/shared/lib/chat";

const CHAT_ERROR_MESSAGE =
  "I had trouble reaching the server. Check the backend chat configuration.";

export function useChatbot() {
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_CHAT_MESSAGE]);

  const handleSend = async (event?: FormEvent) => {
    event?.preventDefault();

    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessage = { role: "user", text: trimmed };
    const nextMessages = [...messages, userMessage];
    const history =
      nextMessages[0] === INITIAL_CHAT_MESSAGE ? nextMessages.slice(1) : nextMessages;

    setMessages(nextMessages);
    setInput("");
    setIsLoading(true);

    try {
      const replyText = await sendChat(history);
      setMessages((prev) => [...prev, { role: "assistant", text: replyText }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: CHAT_ERROR_MESSAGE,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([INITIAL_CHAT_MESSAGE]);
  };

  const toggleOpen = () => {
    setIsOpen((open) => !open);
  };

  return {
    handleClear,
    handleSend,
    input,
    isLoading,
    isOpen,
    messages,
    setInput,
    toggleOpen,
  };
}
