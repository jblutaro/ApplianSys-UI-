import { type FormEvent, useEffect, useId, useState } from "react";
import type { User } from "firebase/auth";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import {
  FIREBASE_ENV_HELP,
  isFirebaseAuthConfigured,
  signInWithEmail,
  signInWithFacebook,
  signInWithGoogle,
  signOutUser,
  signUpWithEmail,
} from "@/shared/lib/firebaseAuth";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  onClose: () => void;
  user: User | null;
};

function GoogleIcon() {
  return (
    <svg
      className="auth-modal__social-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg
      className="auth-modal__social-icon"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
    >
      <path
        fill="#1877F2"
        d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"
      />
    </svg>
  );
}

export function AuthModal({ open, onClose, user }: AuthModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const oauthReady = isFirebaseAuthConfigured();

  useEffect(() => {
    if (!open) return;
    setError(null);
    setBusy(false);
  }, [open, mode]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!oauthReady) {
      setError(FIREBASE_ENV_HELP);
      return;
    }
    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "login") {
        await signInWithEmail(email.trim(), password);
      } else {
        await signUpWithEmail(email.trim(), password);
      }
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Something went wrong.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const runOAuth = async (fn: () => Promise<void>) => {
    setError(null);
    if (!oauthReady) {
      setError(FIREBASE_ENV_HELP);
      return;
    }
    setBusy(true);
    try {
      await fn();
      onClose();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: unknown }).message)
          : "Sign-in failed.";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  const primaryLabel = mode === "login" ? "Log in" : "Sign up";
  const oauthVerb = mode === "login" ? "Log in" : "Sign up";

  return (
    <div
      className="auth-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="auth-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          className="auth-modal__close"
          onClick={onClose}
          aria-label="Close"
        >
          ×
        </button>

        {user ? (
          <>
            <h2 id={titleId} className="auth-modal__title">
              Account
            </h2>
            <p className="auth-modal__signed-in">
              Signed in as{" "}
              <strong>{user.displayName || user.email || "User"}</strong>
            </p>
            <button
              type="button"
              className="auth-modal__primary"
              onClick={async () => {
                setBusy(true);
                try {
                  await signOutUser();
                  onClose();
                } catch {
                  setError("Could not sign out.");
                } finally {
                  setBusy(false);
                }
              }}
              disabled={busy}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <h2 id={titleId} className="auth-modal__title">
              {mode === "login" ? "Log in" : "Sign up"}
            </h2>

            {!oauthReady && (
              <p className="auth-modal__hint">{FIREBASE_ENV_HELP}</p>
            )}

            <form className="auth-modal__form" onSubmit={handleSubmit}>
              <label className="auth-modal__label" htmlFor="auth-email">
                Email
              </label>
              <div className="auth-modal__field-wrap">
                <input
                  id="auth-email"
                  className="auth-modal__input"
                  type="email"
                  autoComplete="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <label className="auth-modal__label" htmlFor="auth-password">
                Password
              </label>
              <div className="auth-modal__field-wrap">
                <input
                  id="auth-password"
                  className="auth-modal__input auth-modal__input--with-toggle"
                  type={showPassword ? "text" : "password"}
                  autoComplete={
                    mode === "login" ? "current-password" : "new-password"
                  }
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-modal__toggle-visibility"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </button>
              </div>

              {mode === "signup" && (
                <>
                  <label
                    className="auth-modal__label"
                    htmlFor="auth-confirm"
                  >
                    Confirm password
                  </label>
                  <div className="auth-modal__field-wrap">
                    <input
                      id="auth-confirm"
                      className="auth-modal__input auth-modal__input--with-toggle"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="auth-modal__toggle-visibility"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={
                        showConfirm ? "Hide password" : "Show password"
                      }
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </>
              )}

              {error && <p className="auth-modal__error">{error}</p>}

              <button
                type="submit"
                className="auth-modal__primary"
                disabled={busy}
              >
                {primaryLabel}
              </button>
            </form>

            <div className="auth-modal__divider">
              <span>or</span>
            </div>

            <div className="auth-modal__socials">
              <button
                type="button"
                className="auth-modal__social"
                disabled={busy}
                onClick={() => runOAuth(signInWithGoogle)}
                title={
                  oauthReady
                    ? undefined
                    : "Set VITE_FIREBASE_* variables to enable"
                }
              >
                <GoogleIcon />
                {oauthVerb} with Google
              </button>
              <button
                type="button"
                className="auth-modal__social"
                disabled={busy}
                onClick={() => runOAuth(signInWithFacebook)}
                title={
                  oauthReady
                    ? undefined
                    : "Set VITE_FIREBASE_* variables to enable"
                }
              >
                <FacebookIcon />
                {oauthVerb} with Facebook
              </button>
            </div>

            <p className="auth-modal__footer">
              {mode === "signup" ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="auth-modal__link"
                    onClick={() => setMode("login")}
                  >
                    Log in
                  </button>
                </>
              ) : (
                <>
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    className="auth-modal__link"
                    onClick={() => setMode("signup")}
                  >
                    Sign up
                  </button>
                </>
              )}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
