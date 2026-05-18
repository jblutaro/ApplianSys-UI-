import cors from "cors";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { apiRouter } from "./routes/index.js";

export const app = express();
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

app.use(
  cors({
    credentials: true,
    origin: true,
  }),
);
app.use(express.json({ limit: "5mb" }));

app.use("/api/uploads", express.static(path.join(backendRoot, "uploads")));
app.use("/api", apiRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
});
