import type { User } from "firebase/auth";

function parseAdminEmails(raw: string | undefined) {
  return (raw ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminUser(user: User | null) {
  if (!user?.email) return false;

  const email = user.email.toLowerCase();
  const adminEmails =
    typeof import.meta.env.VITE_ADMIN_EMAILS === "string"
      ? import.meta.env.VITE_ADMIN_EMAILS
      : undefined;
  const envAdmins = parseAdminEmails(adminEmails);

  return envAdmins.includes(email) || email.startsWith("admin");
}
