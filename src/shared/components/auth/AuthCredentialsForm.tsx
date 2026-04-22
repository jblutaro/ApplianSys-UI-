import type { FormEvent } from "react";
import Visibility from "@mui/icons-material/Visibility";
import VisibilityOff from "@mui/icons-material/VisibilityOff";

type AuthMode = "login" | "signup";

type AuthCredentialsFormProps = {
  busy: boolean;
  confirmPassword: string;
  email: string;
  error: string | null;
  mode: AuthMode;
  onSubmit: (event: FormEvent) => Promise<void>;
  password: string;
  setConfirmPassword: (value: string) => void;
  setEmail: (value: string) => void;
  setMode: (value: AuthMode) => void;
  setPassword: (value: string) => void;
  setShowConfirm: (value: boolean | ((value: boolean) => boolean)) => void;
  setShowPassword: (value: boolean | ((value: boolean) => boolean)) => void;
  showConfirm: boolean;
  showPassword: boolean;
  titleId: string;
};

export function AuthCredentialsForm({
  busy,
  confirmPassword,
  email,
  error,
  mode,
  onSubmit,
  password,
  setConfirmPassword,
  setEmail,
  setMode,
  setPassword,
  setShowConfirm,
  setShowPassword,
  showConfirm,
  showPassword,
  titleId,
}: AuthCredentialsFormProps) {
  const primaryLabel = mode === "login" ? "Log in" : "Sign up";

  return (
    <>
      <h2 id={titleId} className="auth-modal__title">
        {mode === "login" ? "Log in" : "Sign up"}
      </h2>

      <p className="auth-modal__hint">
        Local accounts are now managed directly by the ApplianSys backend.
      </p>

      <form className="auth-modal__form" onSubmit={(event) => void onSubmit(event)}>
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
  );
}
