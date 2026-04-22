import { useEffect, useState } from "react";
import { subscribeAuthState, type AppUser } from "@/shared/lib/auth";

export function useAuthUser() {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => subscribeAuthState(setUser), []);

  return user;
}
