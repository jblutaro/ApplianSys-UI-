import { requestJson } from "@/shared/lib/http";

export type AppUser = {
  accountId: string;
  authSource: "local";
  displayName: string;
  email: string;
  id: number;
  photoURL: string | null;
  role: "admin" | "customer";
};

type AuthResponse = {
  ok: true;
  user: AppUser | null;
};

const listeners = new Set<(user: AppUser | null) => void>();
let currentUser: AppUser | null = null;
let initPromise: Promise<void> | null = null;

function emit(user: AppUser | null) {
  currentUser = user;
  for (const listener of listeners) {
    listener(user);
  }
}

async function initialize() {
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const response = await requestJson<AuthResponse>("/api/auth/me", {
          cache: "no-store",
        });
        emit(response.user);
      } catch {
        emit(null);
      }
    })();
  }

  await initPromise;
}

export function subscribeAuthState(callback: (user: AppUser | null) => void): () => void {
  listeners.add(callback);
  callback(currentUser);
  void initialize();

  return () => {
    listeners.delete(callback);
  };
}

export async function signInWithEmail(email: string, password: string): Promise<AppUser | null> {
  const response = await requestJson<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  emit(response.user);
  return response.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<AppUser | null> {
  const response = await requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  emit(response.user);
  return response.user;
}

export async function signOutUser(): Promise<void> {
  await requestJson<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });

  emit(null);
}
