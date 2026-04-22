import type { AppUser } from "@/shared/lib/auth";

type AuthAccountPanelProps = {
  busy: boolean;
  onClose: () => void;
  onSignOut: () => Promise<void>;
  setError: (value: string | null) => void;
  setBusy: (value: boolean) => void;
  titleId: string;
  user: AppUser;
};

export function AuthAccountPanel({
  busy,
  onClose,
  onSignOut,
  setError,
  setBusy,
  titleId,
  user,
}: AuthAccountPanelProps) {
  return (
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
            await onSignOut();
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
  );
}
