import cors from "cors";
import express from "express";
import { apiRouter } from "./routes/index.js";

export const app = express();

app.use(
  cors({
    credentials: true,
    origin: true,
  }),
);
app.use(express.json());

app.use("/api", apiRouter);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);

  res.status(500).json({
    ok: false,
    message: "Internal server error",
  });
});
