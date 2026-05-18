import { requestJson } from "@/shared/lib/http";

export type AppUser = {
  accountId: string;
  authSource: "local";
  displayName: string;
  email: string;
  id: number;
  photoURL: string | null;
  role: "admin" | "staff" | "customer";
};

export type SignUpProfile = {
  contactNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
};

export type AccountProfile = {
  accountId: string;
  contactNumber: string;
  createdAt: string | null;
  displayName: string;
  email: string;
  firstName: string;
  lastLogin: string | null;
  lastName: string;
  middleName: string;
  role: AppUser["role"];
  status: string;
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

export async function signUpWithEmail(
  email: string,
  password: string,
  profile: SignUpProfile,
): Promise<AppUser | null> {
  const response = await requestJson<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, ...profile }),
  });

  emit(response.user);
  return response.user;
}

export async function fetchAccountProfile() {
  return requestJson<{ ok: true; account: AccountProfile }>("/api/auth/account");
}

export async function updateAccountProfile(payload: {
  contactNumber: string;
  firstName: string;
  lastName: string;
  middleName: string;
}) {
  const response = await requestJson<{ ok: true; account: AccountProfile }>("/api/auth/account", {
    method: "PUT",
    body: JSON.stringify(payload),
  });

  if (currentUser) {
    emit({
      ...currentUser,
      accountId: response.account.accountId,
      displayName: response.account.displayName,
      email: response.account.email,
      role: response.account.role,
    });
  }

  return response;
}

export async function signOutUser(): Promise<void> {
  await requestJson<{ ok: true }>("/api/auth/logout", {
    method: "POST",
  });

  emit(null);
}
