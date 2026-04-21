import type { RowDataPacket } from "mysql2";
import { dbPool } from "../config/database.js";
import { hashPassword, isPasswordHash } from "../auth/password.js";

type UserPasswordRow = RowDataPacket & {
  password: string;
  user_id: number;
};

async function main() {
  const [rows] = await dbPool.query<UserPasswordRow[]>(
    "SELECT user_id, password FROM `USER` ORDER BY user_id",
  );

  let migrated = 0;

  for (const row of rows) {
    if (isPasswordHash(row.password)) {
      continue;
    }

    const passwordHash = await hashPassword(row.password);
    await dbPool.query(
      "UPDATE `USER` SET password = ? WHERE user_id = ?",
      [passwordHash, row.user_id],
    );
    migrated += 1;
  }

  console.log(`Migrated ${migrated} user password(s) to hashed storage.`);
  await dbPool.end();
}

main().catch(async (error) => {
  console.error("Password migration failed:", error);
  await dbPool.end();
  process.exit(1);
});
