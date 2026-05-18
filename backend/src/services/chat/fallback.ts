import { getProducts } from "../admin/products.js";
import type { AdminProduct } from "../admin/types.js";
import type { ChatMessage } from "./types.js";

const currencyFormatter = new Intl.NumberFormat("en-PH", {
  currency: "PHP",
  style: "currency",
});

const STOP_WORDS = new Set([
  "about",
  "applian",
  "appliansys",
  "available",
  "best",
  "brand",
  "buy",
  "category",
  "find",
  "have",
  "help",
  "need",
  "please",
  "price",
  "product",
  "products",
  "recommend",
  "show",
  "stock",
  "with",
]);

function latestUserText(messages: ChatMessage[]) {
  return [...messages].reverse().find((message) => message.role === "user")?.text.trim() ?? "";
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((token) => token.length > 2 && !STOP_WORDS.has(token));
}

function scoreProduct(product: AdminProduct, tokens: string[]) {
  const haystack = [
    product.id,
    product.name,
    product.category,
    product.subcategory,
    product.subSubcategory,
    product.description,
    product.status,
  ]
    .join(" ")
    .toLowerCase();

  return tokens.reduce((score, token) => score + (haystack.includes(token) ? 1 : 0), 0);
}

function formatProduct(product: AdminProduct) {
  const stockText = product.stock > 0 ? `${product.stock} in stock` : "out of stock";
  return `${product.name} (${product.category} / ${product.subcategory}) - ${currencyFormatter.format(
    product.price,
  )}, ${stockText}`;
}

function genericReply() {
  return [
    "I can help with appliance recommendations, product categories, prices, and stock.",
    "Try asking for a category like kitchen, TV, refrigerator, washing machine, speaker, or microwave.",
  ].join(" ");
}

export async function buildLocalChatReply(messages: ChatMessage[]) {
  const userText = latestUserText(messages);
  if (!userText) return genericReply();

  const lowerUserText = userText.toLowerCase();

  if (/\b(hi|hello|hey)\b/.test(lowerUserText)) {
    return "Hi! Ask me about ApplianSys products, categories, prices, or stock.";
  }

  let products: AdminProduct[] = [];
  try {
    products = await getProducts();
  } catch {
    return genericReply();
  }

  if (products.length === 0) {
    return "There are no products listed yet. Please check the catalog again later.";
  }

  const tokens = tokenize(userText);
  const matches = products
    .map((product) => ({ product, score: scoreProduct(product, tokens) }))
    .filter((item) => item.score > 0)
    .sort((first, second) => second.score - first.score || first.product.price - second.product.price)
    .slice(0, 4)
    .map((item) => item.product);

  if (matches.length > 0) {
    return `Here are the closest matches I found: ${matches.map(formatProduct).join("; ")}.`;
  }

  const categories = [...new Set(products.map((product) => product.category).filter(Boolean))].slice(0, 8);
  if (categories.length > 0) {
    return `I could not find an exact product match. Current categories include: ${categories.join(", ")}.`;
  }

  return genericReply();
}
