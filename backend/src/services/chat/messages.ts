import type { ChatMessage, OpenAIMessage } from "./types.js";

const MAX_CHAT_HISTORY = 20;
const MAX_CHAT_MESSAGE_LENGTH = 1_000;
const MAX_CHAT_PAYLOAD_LENGTH = 6_000;

const SYSTEM_PROMPT =
  `Create an intelligent ecommerce comparison chatbot feature that helps users compare products side-by-side before purchasing.

The chatbot should behave like a smart shopping assistant and support natural language conversations.

Core Features:
- Allow users to compare 2 or more products.
- Automatically detect products mentioned by the user.
- Display comparisons in a clean structured format.
- Support comparisons for:
  - price
  - specifications
  - stock availability
  - ratings
  - reviews
  - brand
  - warranty
  - shipping options
  - discounts
  - payment methods
  - overall value for money

Behavior Requirements:
- If the user only mentions one product, the chatbot should suggest similar alternatives.
- If products belong to different categories, warn the user that comparison may not be meaningful.
- Highlight:
  - cheapest option
  - best-rated option
  - best value option
  - fastest shipping option
- Clearly indicate advantages and disadvantages of each product.
- Generate a short recommendation summary at the end.

UI/UX Requirements:
- Use a responsive comparison table/card layout.
- Highlight differences visually.
- Use badges like:
  - Best Seller
  - Cheapest
  - Recommended
  - Premium Choice
  - Budget Friendly
- Mobile-friendly design.
- Add expandable sections for detailed specifications.

Chatbot Intelligence:
- The chatbot should understand prompts like:
  - “Compare iPhone 15 and Samsung S24”
  - “Which laptop is better for programming?”
  - “What’s cheaper but still good?”
  - “Show me alternatives under ₱30,000”
  - “Which one has better battery life?”
- The chatbot should ask follow-up questions when necessary:
  - budget
  - intended use
  - preferred brand
  - performance priorities

Recommendation Logic:
- Recommend products based on:
  - user budget
  - use case
  - popularity
  - ratings
  - specifications
- Include confidence reasoning behind recommendations.

Technical Requirements:
- Fetch live product data from the database/API.
- Support dynamic filtering and sorting.
- Use semantic matching for product names.
- Prevent duplicate comparisons.
- Gracefully handle missing specifications.
- Cache recent comparisons for performance.

Admin Requirements:
- Allow admins to configure:
  - comparison attributes
  - featured products
  - recommendation priorities
  - badge logic

Optional Advanced Features:
- AI-generated buying advice
- “Best for Gaming”, “Best for Students”, etc.
- Price history tracking
- Recently viewed comparisons
- Export comparison to PDF
- Share comparison links
- Voice-enabled chatbot interactions

The chatbot should feel conversational, helpful, and sales-assistive — similar to a real in-store product expert.`;

function isUnknownArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

export function isChatMessageArray(value: unknown): value is ChatMessage[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_CHAT_HISTORY &&
    value.every(
      (item) =>
        item &&
        typeof item === "object" &&
        "role" in item &&
        "text" in item &&
        ((item as { role?: unknown }).role === "user" ||
          (item as { role?: unknown }).role === "assistant") &&
        typeof (item as { text?: unknown }).text === "string" &&
        (item as { text: string }).text.trim().length > 0 &&
        (item as { text: string }).text.length <= MAX_CHAT_MESSAGE_LENGTH,
    ) &&
    value.reduce((total, item) => total + item.text.length, 0) <= MAX_CHAT_PAYLOAD_LENGTH
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
