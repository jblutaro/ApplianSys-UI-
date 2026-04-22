import { type FormEvent, useEffect, useId, useState } from "react";
import { AuthAccountPanel } from "@/shared/components/auth/AuthAccountPanel";
import { AuthCredentialsForm } from "@/shared/components/auth/AuthCredentialsForm";
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
          <AuthAccountPanel
            busy={busy}
            onClose={onClose}
            onSignOut={signOutUser}
            setError={setError}
            setBusy={setBusy}
            titleId={titleId}
            user={user}
          />
        ) : (
          <AuthCredentialsForm
            busy={busy}
            confirmPassword={confirmPassword}
            email={email}
            error={error}
            mode={mode}
            onSubmit={handleSubmit}
            password={password}
            setConfirmPassword={setConfirmPassword}
            setEmail={setEmail}
            setMode={setMode}
            setPassword={setPassword}
            setShowConfirm={setShowConfirm}
            setShowPassword={setShowPassword}
            showConfirm={showConfirm}
            showPassword={showPassword}
            titleId={titleId}
          />
        )}
      </div>
    </div>
  );
}
