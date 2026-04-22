export type Role = "user" | "assistant";

export type ChatMessage = {
  role: Role;
  text: string;
};

export type OpenAIMessage = {
  role: "system" | Role;
  content: string;
};
