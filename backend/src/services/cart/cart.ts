import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";

export type CartItemRow = {
  productId: number;
  productName: string;
  imageUrl: string;
  price: number;
  quantity: number;
  stock: number;
  status: string;
};

/** Ensure a CART row exists for this user and return its cart_id. */
async function ensureCart(userId: number): Promise<number> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    "SELECT cart_id FROM CART WHERE user_id = ? LIMIT 1",
    [userId],
  );

  if (rows[0]) {
    return Number(rows[0].cart_id);
  }

  const [result] = await dbPool.query<ResultSetHeader>(
    "INSERT INTO CART (user_id) VALUES (?)",
    [userId],
  );

  return result.insertId;
}

/** Return all items in the user's cart. */
export async function getCartItems(userId: number): Promise<CartItemRow[]> {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `
    SELECT
      p.product_id        AS productId,
      p.product_name      AS productName,
      COALESCE(p.image_url, p.product_image, '') AS imageUrl,
      p.price             AS price,
      ci.quantity         AS quantity,
      COALESCE(i.stock_quantity, 0) AS stock,
      COALESCE(i.status, 'Active')  AS status
    FROM CART c
    INNER JOIN CART_ITEM ci ON ci.cart_id = c.cart_id
    INNER JOIN PRODUCT p    ON p.product_id = ci.product_id
    LEFT  JOIN INVENTORY i  ON i.product_id = p.product_id
    WHERE c.user_id = ?
    ORDER BY ci.product_id ASC
    `,
    [userId],
  );

  return rows.map((row) => ({
    productId: Number(row.productId),
    productName: String(row.productName),
    imageUrl: String(row.imageUrl),
    price: Number(row.price),
    quantity: Number(row.quantity),
    stock: Number(row.stock),
    status: String(row.status),
  }));
}

/**
 * Add a product to the cart or increase its quantity if already present.
 * Respects available stock — will not exceed it.
 */
export async function upsertCartItem(
  userId: number,
  productId: number,
  quantityToAdd: number,
): Promise<{ ok: true; items: CartItemRow[] } | { ok: false; reason: "not_found" | "out_of_stock" | "stock_exceeded" }> {
  // Validate product + stock
  const [productRows] = await dbPool.query<RowDataPacket[]>(
    `
    SELECT p.product_id, COALESCE(i.stock_quantity, 0) AS stock
    FROM PRODUCT p
    LEFT JOIN INVENTORY i ON i.product_id = p.product_id
    WHERE p.product_id = ?
    LIMIT 1
    `,
    [productId],
  );

  if (!productRows[0]) {
    return { ok: false, reason: "not_found" };
  }

  const stock = Number(productRows[0].stock);
  if (stock <= 0) {
    return { ok: false, reason: "out_of_stock" };
  }

  const cartId = await ensureCart(userId);

  // Check existing quantity in cart
  const [existingRows] = await dbPool.query<RowDataPacket[]>(
    "SELECT quantity FROM CART_ITEM WHERE cart_id = ? AND product_id = ? LIMIT 1",
    [cartId, productId],
  );

  const existingQty = Number(existingRows[0]?.quantity ?? 0);
  const newQty = existingQty + quantityToAdd;

  if (newQty > stock) {
    return { ok: false, reason: "stock_exceeded" };
  }

  // Get current price
  const [priceRows] = await dbPool.query<RowDataPacket[]>(
    "SELECT price FROM PRODUCT WHERE product_id = ? LIMIT 1",
    [productId],
  );
  const price = Number(priceRows[0]?.price ?? 0);

  if (existingRows[0]) {
    await dbPool.query(
      "UPDATE CART_ITEM SET quantity = ?, price = ? WHERE cart_id = ? AND product_id = ?",
      [newQty, price, cartId, productId],
    );
  } else {
    await dbPool.query(
      "INSERT INTO CART_ITEM (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
      [cartId, productId, quantityToAdd, price],
    );
  }

  return { ok: true, items: await getCartItems(userId) };
}

/**
 * Set the quantity of a cart item to an exact value.
 * Pass quantity = 0 to remove the item.
 */
export async function updateCartItemQuantity(
  userId: number,
  productId: number,
  quantity: number,
): Promise<{ ok: true; items: CartItemRow[] } | { ok: false; reason: "not_found" | "stock_exceeded" }> {
  const cartId = await ensureCart(userId);

  if (quantity <= 0) {
    await dbPool.query(
      "DELETE FROM CART_ITEM WHERE cart_id = ? AND product_id = ?",
      [cartId, productId],
    );
    return { ok: true, items: await getCartItems(userId) };
  }

  // Check stock
  const [stockRows] = await dbPool.query<RowDataPacket[]>(
    "SELECT COALESCE(stock_quantity, 0) AS stock FROM INVENTORY WHERE product_id = ? LIMIT 1",
    [productId],
  );
  const stock = Number(stockRows[0]?.stock ?? 0);

  if (quantity > stock) {
    return { ok: false, reason: "stock_exceeded" };
  }

  const [existingRows] = await dbPool.query<RowDataPacket[]>(
    "SELECT quantity FROM CART_ITEM WHERE cart_id = ? AND product_id = ? LIMIT 1",
    [cartId, productId],
  );

  if (!existingRows[0]) {
    return { ok: false, reason: "not_found" };
  }

  await dbPool.query(
    "UPDATE CART_ITEM SET quantity = ? WHERE cart_id = ? AND product_id = ?",
    [quantity, cartId, productId],
  );

  return { ok: true, items: await getCartItems(userId) };
}

/** Remove a single item from the cart. */
export async function removeCartItem(
  userId: number,
  productId: number,
): Promise<CartItemRow[]> {
  const cartId = await ensureCart(userId);

  await dbPool.query(
    "DELETE FROM CART_ITEM WHERE cart_id = ? AND product_id = ?",
    [cartId, productId],
  );

  return getCartItems(userId);
}
