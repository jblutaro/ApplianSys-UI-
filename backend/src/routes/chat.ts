import { Router } from "express";
import { generateChatReply } from "../services/chat/openai.js";
import { isChatServiceError } from "../services/chat/errors.js";
import { isChatMessageArray } from "../services/chat/messages.js";

export const chatRouter = Router();

chatRouter.post("/", async (req, res, next) => {
  try {
    const { messages } = req.body as { messages?: unknown };

    if (!isChatMessageArray(messages) || messages.length === 0) {
      res.status(400).json({
        ok: false,
        message: "A non-empty messages array is required.",
      });
      return;
    }

    const reply = await generateChatReply(messages);

    res.json({
      ok: true,
      reply,
    });
  } catch (error) {
    if (isChatServiceError(error)) {
      res.status(error.statusCode).json({ ok: false, message: error.message });
      return;
    }

    next(error);
  }
});
