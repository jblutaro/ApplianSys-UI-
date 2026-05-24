import type { AppUser } from "@/shared/lib/auth";

export function isAdminUser(user: AppUser | null) {
  return user?.role === "admin" || user?.role === "staff";
}
