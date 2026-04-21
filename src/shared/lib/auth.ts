export type AppUser = {
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

async function request<T>(input: string, init?: RequestInit): Promise<T> {
  const response = await fetch(input, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });

  if (!response.ok) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const payload = (await response.json()) as { message?: string };
      throw new Error(payload.message || "Request failed.");
    }

    throw new Error((await response.text()) || "Request failed.");
  }

  return response.json() as Promise<T>;
}

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
        const response = await request<AuthResponse>("/api/auth/me", {
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
  const response = await request<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  emit(response.user);
  return response.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<AppUser | null> {
  const response = await request<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  emit(response.user);
  return response.user;
}

export async function signOutUser(): Promise<void> {
  await request<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });

  emit(null);
}
