import { Router } from "express";
import { readSession } from "../auth/session.js";
import { findUserById, isActiveStatus, isStaffOrAdminUser } from "../auth/users.js";
import {
  getCartItems,
  removeCartItem,
  updateCartItemQuantity,
  upsertCartItem,
} from "../services/cart/cart.js";

export const cartRouter = Router();

/** Resolve the authenticated customer user_id from the session, or return null. */
async function resolveCustomerUserId(req: Parameters<typeof readSession>[0]): Promise<number | null> {
  const session = readSession(req);
  if (!session) return null;

  const user = await findUserById(session.userId);
  if (!user || !isActiveStatus(user.status)) return null;

  // Admin / staff cannot use the cart
  if (isStaffOrAdminUser(user)) return null;

  return user.user_id;
}

/** GET /api/cart — fetch the current user's cart items */
cartRouter.get("/", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const items = await getCartItems(userId);
    res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});

/** POST /api/cart/items — add a product (or increase quantity) */
cartRouter.post("/items", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const { productId, quantity } = req.body as {
      productId?: unknown;
      quantity?: unknown;
    };

    const parsedProductId = Number(productId);
    const parsedQuantity = Number(quantity ?? 1);

    if (!parsedProductId || parsedProductId <= 0) {
      res.status(400).json({ ok: false, message: "A valid productId is required." });
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity <= 0) {
      res.status(400).json({ ok: false, message: "quantity must be a positive integer." });
      return;
    }

    const result = await upsertCartItem(userId, parsedProductId, parsedQuantity);

    if (!result.ok) {
      const statusMap = {
        not_found: 404,
        out_of_stock: 409,
        stock_exceeded: 409,
      } as const;

      const messageMap = {
        not_found: "Product not found.",
        out_of_stock: "This product is out of stock.",
        stock_exceeded: "Not enough stock available.",
      } as const;

      res.status(statusMap[result.reason]).json({ ok: false, message: messageMap[result.reason] });
      return;
    }

    res.json({ ok: true, items: result.items });
  } catch (error) {
    next(error);
  }
});

/** PATCH /api/cart/items/:productId — set exact quantity (0 = remove) */
cartRouter.patch("/items/:productId", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const parsedProductId = Number(req.params.productId);
    const { quantity } = req.body as { quantity?: unknown };
    const parsedQuantity = Number(quantity);

    if (!parsedProductId || parsedProductId <= 0) {
      res.status(400).json({ ok: false, message: "Invalid productId." });
      return;
    }

    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 0) {
      res.status(400).json({ ok: false, message: "quantity must be a non-negative integer." });
      return;
    }

    const result = await updateCartItemQuantity(userId, parsedProductId, parsedQuantity);

    if (!result.ok) {
      const statusMap = { not_found: 404, stock_exceeded: 409 } as const;
      const messageMap = {
        not_found: "Item not found in cart.",
        stock_exceeded: "Not enough stock available.",
      } as const;

      res.status(statusMap[result.reason]).json({ ok: false, message: messageMap[result.reason] });
      return;
    }

    res.json({ ok: true, items: result.items });
  } catch (error) {
    next(error);
  }
});

/** DELETE /api/cart/items/:productId — remove an item */
cartRouter.delete("/items/:productId", async (req, res, next) => {
  try {
    const userId = await resolveCustomerUserId(req);
    if (!userId) {
      res.status(401).json({ ok: false, message: "Authentication required." });
      return;
    }

    const parsedProductId = Number(req.params.productId);
    if (!parsedProductId || parsedProductId <= 0) {
      res.status(400).json({ ok: false, message: "Invalid productId." });
      return;
    }

    const items = await removeCartItem(userId, parsedProductId);
    res.json({ ok: true, items });
  } catch (error) {
    next(error);
  }
});
