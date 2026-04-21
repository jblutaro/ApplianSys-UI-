import type { ResultSetHeader, RowDataPacket } from "mysql2";
import { dbPool } from "../config/database.js";
import { env } from "../config/env.js";
import type { AuthSource } from "./session.js";

export type AuthUserRow = RowDataPacket & {
  email: string;
  fname: string | null;
  lname: string | null;
  password: string;
  status: string | null;
  user_id: number;
  user_type: string | null;
};

function parseAdminEmails(raw: string) {
  return raw
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

function buildDisplayName(user: Pick<AuthUserRow, "fname" | "lname" | "email">) {
  const fullName = [user.fname, user.lname]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");

  return fullName || user.email.split("@")[0] || "User";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isActiveStatus(status: string | null | undefined) {
  return (status ?? "active").trim().toLowerCase() === "active";
}

export function isAdminEmail(email: string) {
  const normalizedEmail = normalizeEmail(email);
  const envAdmins = parseAdminEmails(env.adminEmails);
  return envAdmins.includes(normalizedEmail) || normalizedEmail.startsWith("admin");
}

export function isAdminUser(user: Pick<AuthUserRow, "email" | "user_type">) {
  return (user.user_type ?? "").toLowerCase() === "admin" || isAdminEmail(user.email);
}

export function mapPublicUser(user: AuthUserRow, authSource: AuthSource) {
  return {
    authSource,
    displayName: buildDisplayName(user),
    email: user.email,
    id: user.user_id,
    photoURL: null,
    role: isAdminUser(user) ? "admin" : "customer",
  };
}

export async function findUserByEmail(email: string): Promise<AuthUserRow | null> {
  const [rows] = await dbPool.query<AuthUserRow[]>(
    `SELECT user_id, fname, lname, email, password, status, user_type
     FROM \`USER\`
     WHERE LOWER(email) = LOWER(?)
     LIMIT 1`,
    [email],
  );

  return rows[0] ?? null;
}

export async function findUserById(userId: number): Promise<AuthUserRow | null> {
  const [rows] = await dbPool.query<AuthUserRow[]>(
    `SELECT user_id, fname, lname, email, password, status, user_type
     FROM \`USER\`
     WHERE user_id = ?
     LIMIT 1`,
    [userId],
  );

  return rows[0] ?? null;
}

export async function createLocalUser(email: string, passwordHash: string): Promise<AuthUserRow> {
  const normalizedEmail = normalizeEmail(email);
  const localName = normalizedEmail.split("@")[0] || "user";
  const [result] = await dbPool.query<ResultSetHeader>(
    `INSERT INTO \`USER\`
      (fname, mname, lname, email, password, contact_num, status, created_at, last_login, user_type)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW(), ?)`,
    [
      localName,
      "",
      "",
      normalizedEmail,
      passwordHash,
      "",
      "Active",
      isAdminEmail(normalizedEmail) ? "admin" : "customer",
    ],
  );

  await dbPool.query<ResultSetHeader>(
    "INSERT INTO CUSTOMER_USER (user_id, street, barangay, city, province) VALUES (?, ?, ?, ?, ?)",
    [result.insertId, "", "", "", ""],
  );

  const createdUser = await findUserById(result.insertId);
  if (!createdUser) {
    throw new Error("Could not load created user.");
  }

  return createdUser;
}

export async function updateUserPassword(userId: number, passwordHash: string) {
  await dbPool.query("UPDATE `USER` SET password = ? WHERE user_id = ?", [
    passwordHash,
    userId,
  ]);
}

export async function touchUserLogin(userId: number) {
  await dbPool.query("UPDATE `USER` SET last_login = NOW() WHERE user_id = ?", [
    userId,
  ]);
}
