import { type FormEvent, useEffect, useId, useState } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

import {
  signInWithEmail,
  signOutUser,
  signUpWithEmail,
  type AppUser,
} from "@/shared/lib/auth";

type AuthMode = "login" | "signup";

type AuthModalProps = {
  open: boolean;
  onAuthenticated: (user: AppUser | null) => void;
  onClose: () => void;
  user: AppUser | null;
};

export function AuthModal({ open, onAuthenticated, onClose, user }: AuthModalProps) {
  const titleId = useId();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setBusy(true);

    try {
      let authenticatedUser: AppUser | null;
      if (mode === "login") {
        authenticatedUser = await signInWithEmail(email.trim(), password);
      } else {
        authenticatedUser = await signUpWithEmail(email.trim(), password);
      }

      onAuthenticated(authenticatedUser);
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

  const primaryLabel = mode === "login" ? "Log in" : "Sign up";

  return (
    <div className="auth-modal-overlay" role="presentation" onClick={onClose}>
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
          x
        </button>

        {user ? (
          <>
            <h2 id={titleId} className="auth-modal__title">
              Account
            </h2>
            <p className="auth-modal__signed-in">
              Signed in as <strong>{user.displayName || user.email || "User"}</strong>
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

            <p className="auth-modal__hint">
              Local accounts are now managed directly by the ApplianSys backend.
            </p>

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
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
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

              {mode === "signup" ? (
                <>
                  <label className="auth-modal__label" htmlFor="auth-confirm">
                    Confirm password
                  </label>
                  <div className="auth-modal__field-wrap">
                    <input
                      id="auth-confirm"
                      className="auth-modal__input auth-modal__input--with-toggle"
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="auth-modal__toggle-visibility"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? "Hide password" : "Show password"}
                    >
                      {showConfirm ? <VisibilityOff /> : <Visibility />}
                    </button>
                  </div>
                </>
              ) : null}

              {error ? <p className="auth-modal__error">{error}</p> : null}

              <button type="submit" className="auth-modal__primary" disabled={busy}>
                {primaryLabel}
              </button>
            </form>

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
