import {
  initializeApp,
  getApps,
  type FirebaseApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

function isAuthPopupBlocked(e: unknown): boolean {
  return (
    typeof e === "object" &&
    e !== null &&
    "code" in e &&
    (e as { code: string }).code === "auth/popup-blocked"
  );
}

/** Shown in the auth UI when env is missing or invalid. */
export const FIREBASE_ENV_HELP =
  "Add Firebase web config to a .env file in the same folder as package.json, then stop and run npm run start again. Use .env.example, or one line VITE_FIREBASE_CONFIG={...}.";

function cleanEnv(value: unknown): string | undefined {
  if (value === undefined || value === null) return undefined;
  let s = String(value).trim();
  if (
    (s.startsWith('"') && s.endsWith('"')) ||
    (s.startsWith("'") && s.endsWith("'"))
  ) {
    s = s.slice(1, -1).trim();
  }
  return s.length ? s : undefined;
}

function asFirebaseOptions(
  record: Record<string, unknown>,
): FirebaseOptions | null {
  const apiKey = cleanEnv(record.apiKey);
  const authDomain = cleanEnv(record.authDomain);
  const projectId = cleanEnv(record.projectId);
  const storageBucket = cleanEnv(record.storageBucket);
  const messagingSenderId =
    cleanEnv(record.messagingSenderId) ??
    (record.messagingSenderId !== undefined && record.messagingSenderId !== null
      ? String(record.messagingSenderId).trim()
      : undefined);
  const appId = cleanEnv(record.appId);

  if (
    !apiKey ||
    !authDomain ||
    !projectId ||
    !storageBucket ||
    !messagingSenderId ||
    !appId
  ) {
    return null;
  }

  return {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };
}

function parseFirebaseConfigJson(raw: string | undefined): FirebaseOptions | null {
  const trimmed = cleanEnv(raw);
  if (!trimmed) return null;
  try {
    const parsed = JSON.parse(trimmed) as Record<string, unknown>;
    return asFirebaseOptions(parsed);
  } catch {
    return null;
  }
}

function getFirebaseConfigFromEnv(): FirebaseOptions | null {
  const fromJson = parseFirebaseConfigJson(
    import.meta.env.VITE_FIREBASE_CONFIG as string | undefined,
  );
  if (fromJson) return fromJson;

  return asFirebaseOptions({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

let cachedConfig: FirebaseOptions | null | undefined;

function getResolvedFirebaseConfig(): FirebaseOptions | null {
  if (cachedConfig === undefined) {
    cachedConfig = getFirebaseConfigFromEnv();
  }
  return cachedConfig;
}

export function isFirebaseAuthConfigured(): boolean {
  return getResolvedFirebaseConfig() !== null;
}

function getFirebaseApp(): FirebaseApp | null {
  const config = getResolvedFirebaseConfig();
  if (!config) return null;
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp(config);
}

export function subscribeAuthState(
  callback: (user: User | null) => void,
): () => void {
  const app = getFirebaseApp();
  if (!app) {
    callback(null);
    return () => {};
  }
  const auth = getAuth(app);
  return onAuthStateChanged(auth, callback);
}

async function signInWithProviderPopupOrRedirect(
  createProvider: () => GoogleAuthProvider | FacebookAuthProvider,
): Promise<void> {
  const app = getFirebaseApp();
  if (!app) throw new Error(FIREBASE_ENV_HELP);
  const auth = getAuth(app);
  const provider = createProvider();
  try {
    await signInWithPopup(auth, provider);
  } catch (e: unknown) {
    if (isAuthPopupBlocked(e)) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

export async function signInWithGoogle(): Promise<void> {
  await signInWithProviderPopupOrRedirect(() => new GoogleAuthProvider());
}

export async function signInWithFacebook(): Promise<void> {
  await signInWithProviderPopupOrRedirect(() => new FacebookAuthProvider());
}

/** Call once on app load after a `signInWithRedirect` return. */
export async function completeOAuthRedirect(): Promise<void> {
  const app = getFirebaseApp();
  if (!app) return;
  const auth = getAuth(app);
  try {
    await getRedirectResult(auth);
  } catch {
    // e.g. user closed provider tab or account conflict
  }
}

export async function signInWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const app = getFirebaseApp();
  if (!app) throw new Error(FIREBASE_ENV_HELP);
  const auth = getAuth(app);
  await signInWithEmailAndPassword(auth, email, password);
}

export async function signUpWithEmail(
  email: string,
  password: string,
): Promise<void> {
  const app = getFirebaseApp();
  if (!app) throw new Error(FIREBASE_ENV_HELP);
  const auth = getAuth(app);
  await createUserWithEmailAndPassword(auth, email, password);
}

export async function signOutUser(): Promise<void> {
  const app = getFirebaseApp();
  if (!app) return;
  const auth = getAuth(app);
  await signOut(auth);
}
