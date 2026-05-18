import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

dotenv.config({ path: path.join(backendRoot, ".env") });

function readNumber(value: string | undefined, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  adminEmails: process.env.ADMIN_EMAILS ?? process.env.VITE_ADMIN_EMAILS ?? "",
  openaiApiKey: process.env.OPENAI_API_KEY ?? "",
  openaiModel: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  port: readNumber(process.env.PORT, 4000),
  dbHost: process.env.DB_HOST ?? "127.0.0.1",
  dbPort: readNumber(process.env.DB_PORT, 3306),
  dbName: process.env.DB_NAME ?? "appliansys_db",
  dbUser: process.env.DB_USER ?? "root",
  dbPassword: process.env.DB_PASSWORD ?? "",
};
