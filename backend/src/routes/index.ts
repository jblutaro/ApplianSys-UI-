import { Router } from "express";
import { requireAdmin, requireAuthenticated } from "../auth/middleware.js";
import { testDatabaseConnection } from "../config/database.js";
import { adminRouter } from "./admin.js";
import { authRouter } from "./auth.js";
import { cartRouter } from "./cart.js";
import { checkoutRouter } from "./checkout.js";
import { chatRouter } from "./chat.js";
import { ordersRouter } from "./orders.js";
import { productsRouter } from "./products.js";

export const apiRouter = Router();

apiRouter.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "appliansys-backend",
  });
});

apiRouter.get("/db-test", async (_req, res, next) => {
  try {
    const result = await testDatabaseConnection();
    res.json({
      ok: true,
      database: result,
    });
  } catch (error) {
    next(error);
  }
});

apiRouter.use("/auth", authRouter);
apiRouter.use("/chat", chatRouter);
apiRouter.use(productsRouter);
apiRouter.use("/cart", requireAuthenticated, cartRouter);
apiRouter.use("/checkout", requireAuthenticated, checkoutRouter);
apiRouter.use("/orders", requireAuthenticated, ordersRouter);
apiRouter.use("/admin", requireAdmin, adminRouter);
