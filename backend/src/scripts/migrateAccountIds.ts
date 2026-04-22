import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { generateAccountId } from "../auth/accountId.js";
import { dbPool } from "../config/database.js";
import { env } from "../config/env.js";

type UserAccountRow = RowDataPacket & {
  account_id: string | null;
  created_at: Date | string | null;
  user_id: number;
  user_type: string | null;
};

async function hasAccountIdColumn() {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT 1
     FROM INFORMATION_SCHEMA.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'USER'
       AND COLUMN_NAME = 'account_id'
     LIMIT 1`,
    [env.dbName],
  );

  return rows.length > 0;
}

async function hasAccountIdIndex() {
  const [rows] = await dbPool.query<RowDataPacket[]>(
    `SELECT 1
     FROM INFORMATION_SCHEMA.STATISTICS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = 'USER'
       AND INDEX_NAME = 'uq_user_account_id'
     LIMIT 1`,
    [env.dbName],
  );

  return rows.length > 0;
}

async function ensureAccountIdColumn() {
  if (!(await hasAccountIdColumn())) {
    await dbPool.query(
      "ALTER TABLE `USER` ADD COLUMN account_id VARCHAR(32) NULL AFTER user_id",
    );
  }
}

async function backfillAccountIds() {
  const [rows] = await dbPool.query<UserAccountRow[]>(
    `SELECT user_id, user_type, created_at, account_id
     FROM \`USER\`
     WHERE account_id IS NULL OR TRIM(account_id) = ''
     ORDER BY user_id`,
  );

  let updated = 0;

  for (const row of rows) {
    const accountId = generateAccountId(row.user_type, row.created_at);
    await dbPool.query<ResultSetHeader>(
      "UPDATE `USER` SET account_id = ? WHERE user_id = ?",
      [accountId, row.user_id],
    );
    updated += 1;
  }

  return updated;
}

async function finalizeAccountIdColumn() {
  if (!(await hasAccountIdIndex())) {
    await dbPool.query("ALTER TABLE `USER` ADD CONSTRAINT uq_user_account_id UNIQUE (account_id)");
  }

  await dbPool.query("ALTER TABLE `USER` MODIFY account_id VARCHAR(32) NOT NULL");
}

async function main() {
  await ensureAccountIdColumn();
  const updated = await backfillAccountIds();
  await finalizeAccountIdColumn();

  console.log(`Account ID migration complete. Backfilled ${updated} user account IDs.`);
  await dbPool.end();
}

main().catch(async (error) => {
  console.error("Account ID migration failed:", error);
  await dbPool.end();
  process.exit(1);
});
