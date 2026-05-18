import { type FormEvent, useCallback, useEffect, useId, useState } from "react";
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
  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const clearCredentialForm = useCallback(() => {
    setEmail("");
    setFirstName("");
    setMiddleName("");
    setLastName("");
    setContactNumber("");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  }, []);

  const handleClose = useCallback(() => {
    if (!user) {
      clearCredentialForm();
    }
    setError(null);
    setBusy(false);
    onClose();
  }, [clearCredentialForm, onClose, user]);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose, open]);

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
        authenticatedUser = await signUpWithEmail(email.trim(), password, {
          contactNumber,
          firstName,
          lastName,
          middleName,
        });
      }

      onAuthenticated(authenticatedUser);
      clearCredentialForm();
      handleClose();
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

  const handleModeChange = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError(null);
    setBusy(false);
    clearCredentialForm();
  };

  const handleSignOut = async () => {
    await signOutUser();
    clearCredentialForm();
  };

  return (
    <div className="auth-modal-overlay" role="presentation" onClick={handleClose}>
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
          onClick={handleClose}
          aria-label="Close"
        >
          x
        </button>

        {user ? (
          <AuthAccountPanel
            busy={busy}
            onClose={handleClose}
            onSignOut={handleSignOut}
            setError={setError}
            setBusy={setBusy}
            titleId={titleId}
            user={user}
          />
        ) : (
          <AuthCredentialsForm
            busy={busy}
            confirmPassword={confirmPassword}
            contactNumber={contactNumber}
            email={email}
            error={error}
            firstName={firstName}
            lastName={lastName}
            middleName={middleName}
            mode={mode}
            onSubmit={handleSubmit}
            password={password}
            setConfirmPassword={setConfirmPassword}
            setContactNumber={setContactNumber}
            setEmail={setEmail}
            setFirstName={setFirstName}
            setLastName={setLastName}
            setMiddleName={setMiddleName}
            setMode={handleModeChange}
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
