import dotenv from "dotenv";

dotenv.config();

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
