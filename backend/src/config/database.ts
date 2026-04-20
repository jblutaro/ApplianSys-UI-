import mysql from "mysql2/promise";
import { env } from "./env.js";

export const dbPool = mysql.createPool({
  host: env.dbHost,
  port: env.dbPort,
  user: env.dbUser,
  password: env.dbPassword,
  database: env.dbName,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function testDatabaseConnection() {
  const connection = await dbPool.getConnection();

  try {
    const [rows] = await connection.query("SELECT DATABASE() AS database_name");
    return rows;
  } finally {
    connection.release();
  }
}
