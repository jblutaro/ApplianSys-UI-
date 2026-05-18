import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";
import { readAdminSettings } from "../../data/adminSettingsStore.js";
import type { CartItemRow } from "../cart/cart.js";
import { getCartItems } from "../cart/cart.js";

export type DeliveryMethod = "delivery" | "pickup";

export type CheckoutDeliveryInput = {
  method: "delivery";
  street: string;
  barangay: string;
  city: string;
  province: string;
  latitude: number | null;
  longitude: number | null;
};

export type CheckoutPickupInput = {
  method: "pickup";
};

export type CheckoutInput = {
  fulfillment: CheckoutDeliveryInput | CheckoutPickupInput;
  paymentMethod: string;
};

export type PlacedOrder = {
  orderId: number;
  orderRef: string;
  deliveryDistanceKm: number;
  deliveryFee: number;
  totalAmount: number;
  deliveryMethod: DeliveryMethod;
  status: string;
  items: {
    productId: number;
    productName: string;
    imageUrl: string;
    quantity: number;
    price: number;
  }[];
};

let checkoutSchemaReady = false;

export const OLD_ALBAY_SHOP_LOCATION = {
  lat: 13.1391,
  lng: 123.7438,
};

export function calculateDistanceKm(
  first: { lat: number; lng: number },
  second: { lat: number; lng: number },
) {
  const earthRadiusKm = 6371;
  const latDelta = ((second.lat - first.lat) * Math.PI) / 180;
  const lngDelta = ((second.lng - first.lng) * Math.PI) / 180;
  const firstLat = (first.lat * Math.PI) / 180;
  const secondLat = (second.lat * Math.PI) / 180;
  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(firstLat) * Math.cos(secondLat) * Math.sin(lngDelta / 2) ** 2;
  return earthRadiusKm * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

/** Ensure checkout tables support unassigned delivery/pickup records plus address + geo data. */
async function ensureCheckoutSchema() {
  if (checkoutSchemaReady) return;

  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT COLUMN_NAME
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'DELIVERY'
       AND COLUMN_NAME IN ('delivery_address', 'latitude', 'longitude')`,
  );
  const existing = new Set(rows.map((r) => String(r.COLUMN_NAME)));

  if (!existing.has("delivery_address")) {
    await dbPool.query(
      "ALTER TABLE DELIVERY ADD COLUMN delivery_address TEXT NULL AFTER delivery_status",
    );
  }
  if (!existing.has("latitude")) {
    await dbPool.query(
      "ALTER TABLE DELIVERY ADD COLUMN latitude DECIMAL(10,7) NULL AFTER delivery_address",
    );
  }
  if (!existing.has("longitude")) {
    await dbPool.query(
      "ALTER TABLE DELIVERY ADD COLUMN longitude DECIMAL(10,7) NULL AFTER latitude",
    );
  }

  const [assignmentRows] = await dbPool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME, IS_NULLABLE
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('DELIVERY', 'PICKUP')
       AND COLUMN_NAME = 'user_id'`,
  );

  const nullableByTable = new Map(
    assignmentRows.map((row) => [String(row.TABLE_NAME), String(row.IS_NULLABLE)]),
  );

  if (nullableByTable.get("DELIVERY") !== "YES") {
    await dbPool.query("ALTER TABLE DELIVERY MODIFY user_id INT NULL");
  }

  if (nullableByTable.get("PICKUP") !== "YES") {
    await dbPool.query("ALTER TABLE PICKUP MODIFY user_id INT NULL");
  }

  const [fkRows] = await dbPool.query<RowDataPacket[]>(
    `SELECT TABLE_NAME, CONSTRAINT_NAME, REFERENCED_TABLE_NAME
     FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME IN ('DELIVERY', 'PICKUP')
       AND COLUMN_NAME = 'user_id'
       AND REFERENCED_TABLE_NAME IS NOT NULL`,
  );

  for (const row of fkRows) {
    const tableName = String(row.TABLE_NAME);
    const constraintName = String(row.CONSTRAINT_NAME);
    const referencedTableName = String(row.REFERENCED_TABLE_NAME);

    if (referencedTableName === "CUSTOMER_USER") continue;

    await dbPool.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``);
    await dbPool.query(
      `ALTER TABLE \`${tableName}\`
       ADD CONSTRAINT \`fk_${tableName.toLowerCase()}_customer_user\`
       FOREIGN KEY (user_id) REFERENCES CUSTOMER_USER(user_id)`,
    );
  }

  checkoutSchemaReady = true;
}

export async function placeOrder(
  userId: number,
  input: CheckoutInput,
): Promise<
  | { ok: true; order: PlacedOrder }
  | { ok: false; reason: "empty_cart" | "stock_error"; message: string }
> {
  await ensureCheckoutSchema();

  const cartItems = await getCartItems(userId);
  if (cartItems.length === 0) {
    return { ok: false, reason: "empty_cart", message: "Your cart is empty." };
  }

  const subtotal = cartItems.reduce((s, i) => s + i.price * i.quantity, 0);
  const settings = await readAdminSettings();
  const deliveryDistanceKm =
    input.fulfillment.method === "delivery"
      ? calculateDistanceKm(OLD_ALBAY_SHOP_LOCATION, {
          lat: input.fulfillment.latitude ?? OLD_ALBAY_SHOP_LOCATION.lat,
          lng: input.fulfillment.longitude ?? OLD_ALBAY_SHOP_LOCATION.lng,
        })
      : 0;
  const deliveryFee =
    input.fulfillment.method === "delivery"
      ? roundMoney((settings.baseDeliveryFee ?? 50) + deliveryDistanceKm * settings.deliveryRatePerKm)
      : 0;
  const totalAmount = subtotal + deliveryFee;

  const connection = await dbPool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Re-validate stock inside the transaction
    for (const item of cartItems) {
      const [stockRows] = await connection.query<RowDataPacket[]>(
        "SELECT COALESCE(stock_quantity, 0) AS stock FROM INVENTORY WHERE product_id = ? LIMIT 1 FOR UPDATE",
        [item.productId],
      );
      const available = Number(stockRows[0]?.stock ?? 0);
      if (available < item.quantity) {
        await connection.rollback();
        return {
          ok: false,
          reason: "stock_error",
          message: `"${item.productName}" only has ${available} unit(s) left.`,
        };
      }
    }

    // 2. Create PAYMENT_DETAILS
    const [paymentResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO PAYMENT_DETAILS (payment_amount, payment_method, payment_date, payment_status)
       VALUES (?, ?, NOW(), ?)`,
      [totalAmount, input.paymentMethod, "Pending"],
    );
    const paymentId = paymentResult.insertId;

    // 3. Create order
    const [orderResult] = await connection.query<ResultSetHeader>(
      `INSERT INTO orders
         (user_id, payment_id, order_date, total_amount, order_status, delivery_method)
       VALUES (?, ?, NOW(), ?, ?, ?)`,
      [
        userId,
        paymentId,
        totalAmount,
        "Pending",
        input.fulfillment.method,
      ],
    );
    const orderId = orderResult.insertId;

    // 4. Create order_item rows
    for (const item of cartItems) {
      await connection.query(
        "INSERT INTO order_item (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)",
        [orderId, item.productId, item.quantity, item.price],
      );
    }

    // 5. Create DELIVERY or PICKUP record
    if (input.fulfillment.method === "delivery") {
      const f = input.fulfillment;
      const addressParts = [f.street, f.barangay, f.city, f.province]
        .map((p) => p.trim())
        .filter(Boolean);
      const addressStr = addressParts.join(", ");

      // Estimated delivery: 3–5 business days from now
      const estimatedDate = new Date();
      estimatedDate.setDate(estimatedDate.getDate() + 4);
      const estimatedDateStr = estimatedDate.toISOString().slice(0, 10);

      await connection.query(
        `INSERT INTO DELIVERY
           (order_id, user_id, delivery_fee, estimated_date, delivery_status,
            delivery_address, latitude, longitude)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          orderId,
          userId,
          deliveryFee,
          estimatedDateStr,
          "Pending",
          addressStr,
          f.latitude ?? null,
          f.longitude ?? null,
        ],
      );
    } else {
      // Pickup — scheduled for next business day
      const pickupDate = new Date();
      pickupDate.setDate(pickupDate.getDate() + 1);

      await connection.query(
        `INSERT INTO PICKUP (order_id, user_id, pickup_date, pickup_status)
         VALUES (?, ?, ?, ?)`,
        [orderId, userId, pickupDate.toISOString().slice(0, 19).replace("T", " "), "Pending"],
      );
    }

    // 6. Decrement INVENTORY
    for (const item of cartItems) {
      await connection.query(
        `UPDATE INVENTORY
         SET stock_quantity = stock_quantity - ?,
             last_updated   = NOW()
         WHERE product_id = ?`,
        [item.quantity, item.productId],
      );
      // Refresh status
      await connection.query(
        `UPDATE INVENTORY
         SET status = CASE
           WHEN stock_quantity <= 0  THEN 'Out of Stock'
           WHEN stock_quantity < 15  THEN 'Low Stock'
           ELSE 'Active'
         END
         WHERE product_id = ?`,
        [item.productId],
      );
    }

    // 7. Clear CART_ITEM
    const [cartRows] = await connection.query<RowDataPacket[]>(
      "SELECT cart_id FROM CART WHERE user_id = ? LIMIT 1",
      [userId],
    );
    if (cartRows[0]) {
      await connection.query(
        "DELETE FROM CART_ITEM WHERE cart_id = ?",
        [cartRows[0].cart_id],
      );
    }

    await connection.commit();

    const placed: PlacedOrder = {
      orderId,
      orderRef: `ORD-${String(orderId).padStart(4, "0")}`,
      deliveryDistanceKm,
      deliveryFee,
      totalAmount,
      deliveryMethod: input.fulfillment.method,
      status: "Pending",
      items: cartItems.map((i: CartItemRow) => ({
        productId: i.productId,
        productName: i.productName,
        imageUrl: i.imageUrl,
        quantity: i.quantity,
        price: i.price,
      })),
    };

    return { ok: true, order: placed };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
