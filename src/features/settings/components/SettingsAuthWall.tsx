type SettingsAuthWallProps = {
  onAuthOpen: () => void;
};

export function SettingsAuthWall({ onAuthOpen }: SettingsAuthWallProps) {
  return (
    <div className="settings-auth-wall">
      <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
        <path d="M12 1v4" />
        <path d="M12 19v4" />
        <path d="M4.22 4.22l2.83 2.83" />
        <path d="M16.95 16.95l2.83 2.83" />
        <path d="M1 12h4" />
        <path d="M19 12h4" />
        <path d="M4.22 19.78l2.83-2.83" />
        <path d="M16.95 7.05l2.83-2.83" />
        <circle cx="12" cy="12" r="4" />
      </svg>
      <h2 className="settings-auth-wall__title">Sign in to manage your settings</h2>
      <p className="settings-auth-wall__sub">
        Your account preferences are available only after login.
      </p>
      <button type="button" className="settings-auth-wall__btn" onClick={onAuthOpen}>
        Sign in / Log in
      </button>
    </div>
  );
}
