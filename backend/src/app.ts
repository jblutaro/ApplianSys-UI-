import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { apiRouter } from "./routes/index.js";
import { csrfProtection } from "./security/csrf.js";
import { applySecurityHeaders } from "./security/headers.js";
import { buildIpAndEmailKey, createRateLimiter } from "./security/rateLimit.js";
import { requestTimeout } from "./security/requestTimeout.js";

export const app = express();
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
];
const allowedOrigins = new Set(
  (env.allowedOrigins ? env.allowedOrigins.split(",") : defaultAllowedOrigins)
    .map((origin) => origin.trim())
    .filter(Boolean),
);

const apiRateLimit = createRateLimiter({
  limit: 300,
  windowMs: 15 * 60 * 1000,
});
const authRateLimit = createRateLimiter({
  key: buildIpAndEmailKey,
  limit: 10,
  message: "Too many sign-in attempts. Please try again later.",
  windowMs: 15 * 60 * 1000,
});
const chatRateLimit = createRateLimiter({
  limit: 30,
  message: "Too many chat requests. Please wait before sending another message.",
  windowMs: 60 * 1000,
});

app.use(applySecurityHeaders);
app.use(requestTimeout);
app.use(
  cors({
    credentials: true,
    origin(origin, callback) {
      if (!origin || allowedOrigins.has(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin is not allowed by CORS."));
    },
  }),
);
app.use(express.json({ limit: "3mb" }));
app.use(csrfProtection);

app.use(
  "/api/uploads",
  express.static(path.join(backendRoot, "uploads"), {
    dotfiles: "deny",
    immutable: true,
    maxAge: "1h",
    setHeaders(res) {
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", "inline");
      res.setHeader("Cache-Control", "public, max-age=3600, immutable");
    },
  }),
);
app.use("/api/auth/login", authRateLimit);
app.use("/api/auth/register", authRateLimit);
app.use("/api/chat", chatRateLimit);
app.use("/api", apiRateLimit);
app.use("/api", apiRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
});
