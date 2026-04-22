import { Link } from "react-router-dom";
import { isAdminUser } from "@/features/admin";
import { SettingsAccountCard } from "@/features/settings/components/SettingsAccountCard";
import { SettingsAuthWall } from "@/features/settings/components/SettingsAuthWall";
import { SettingsPreferencesCard } from "@/features/settings/components/SettingsPreferencesCard";
import { useUserSettings } from "@/features/settings/hooks/useUserSettings";
import type { AppUser } from "@/shared/lib/auth";
import "@/shared/styles/Settings.css";

type SettingsPageProps = {
  onAuthOpen: () => void;
  user: AppUser | null;
};

function SettingsPage({ onAuthOpen, user }: SettingsPageProps) {
  const { resetSettings, settings, updateSetting } = useUserSettings(user);

  if (!user) {
    return <SettingsAuthWall onAuthOpen={onAuthOpen} />;
  }

  if (isAdminUser(user)) {
    return (
      <div className="settings-auth-wall">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#aa6d27" strokeWidth="1.5" aria-hidden>
          <path d="M3 21h18"/>
          <path d="M5 21V7l8-4 6 4v14"/>
          <path d="M9 9h.01M9 13h.01M9 17h.01M15 9h.01M15 13h.01M15 17h.01"/>
        </svg>
        <h2 className="settings-auth-wall__title">Admin settings live inside the admin panel</h2>
        <p className="settings-auth-wall__sub">
          Customer account settings are not available to admin accounts. Use the Platform section in the admin panel instead.
        </p>
        <Link to="/admin?section=platform" className="settings-auth-wall__btn settings-auth-wall__btn-link">
          Open Platform Settings
        </Link>
      </div>
    );
  }

  return (
    <div className="settings-page">
      <div className="settings-page__intro">
        <span className="settings-page__eyebrow">Signed-in user settings</span>
        <h1 className="settings-page__title">Account settings</h1>
        <p className="settings-page__sub">
          Review your account details and adjust how ApplianSys should contact and assist you.
        </p>
      </div>

      <div className="settings-page__layout">
        <SettingsAccountCard user={user} />
        <SettingsPreferencesCard
          onReset={resetSettings}
          onUpdateSetting={updateSetting}
          settings={settings}
        />
      </div>
    </div>
  );
}

export default SettingsPage;
