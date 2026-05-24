import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../../config/database.js";

let paymentConfirmationSchemaReady = false;

async function ensurePaymentConfirmationSchema() {
  if (paymentConfirmationSchemaReady) return;

  await dbPool.query(`
    CREATE TABLE IF NOT EXISTS payment_confirmation (
      payment_confirmation_id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      user_id INT NOT NULL,
      payment_method VARCHAR(80) NOT NULL,
      receipt_number VARCHAR(120) NOT NULL,
      amount_paid DECIMAL(12,2) NOT NULL,
      paid_at DATETIME NOT NULL,
      source VARCHAR(80) NOT NULL,
      confirmation_payload_json JSON NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uq_payment_confirmation_receipt (receipt_number),
      INDEX idx_payment_confirmation_order (order_id),
      INDEX idx_payment_confirmation_user (user_id),
      INDEX idx_payment_confirmation_paid_at (paid_at)
    )
  `);

  paymentConfirmationSchemaReady = true;
}

function toMysqlDateTime(date: Date) {
  return date.toISOString().slice(0, 19).replace("T", " ");
}

export async function recordPaymentConfirmation(input: {
  amountPaid: number;
  orderId: number;
  paidAt: Date;
  paymentMethod: string;
  payload: Record<string, unknown>;
  receiptNumber: string;
  source: string;
  userId: number;
}) {
  await ensurePaymentConfirmationSchema();

  const [existing] = await dbPool.query<RowDataPacket[]>(
    "SELECT payment_confirmation_id FROM payment_confirmation WHERE receipt_number = ? LIMIT 1",
    [input.receiptNumber],
  );

  if (existing[0]) {
    return { ok: false as const, reason: "duplicate_receipt" as const };
  }

  await dbPool.query<ResultSetHeader>(
    `INSERT INTO payment_confirmation
       (order_id, user_id, payment_method, receipt_number, amount_paid, paid_at, source, confirmation_payload_json)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.orderId,
      input.userId,
      input.paymentMethod,
      input.receiptNumber,
      input.amountPaid,
      toMysqlDateTime(input.paidAt),
      input.source,
      JSON.stringify(input.payload),
    ],
  );

  return { ok: true as const };
}
