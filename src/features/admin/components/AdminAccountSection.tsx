import { type FormEvent, useEffect, useState } from "react";
import {
  changeAdminPassword,
  fetchAdminAccount,
  updateAdminAccount,
  type AdminAccountProfile,
} from "../lib/adminApi";

const EMPTY_PROFILE: AdminAccountProfile = {
  accountId: "",
  contactNumber: "",
  createdAt: null,
  displayName: "",
  email: "",
  firstName: "",
  lastLogin: null,
  lastName: "",
  middleName: "",
  role: "admin",
  status: "Active",
};

function formatDateTime(value: string | null) {
  if (!value) return "Not available";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "Not available";
  }

  return parsed.toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

type AdminAccountSectionProps = {
  enabled: boolean;
};

export function AdminAccountSection({ enabled }: AdminAccountSectionProps) {
  const [account, setAccount] = useState<AdminAccountProfile>(EMPTY_PROFILE);
  const [profileError, setProfileError] = useState("");
  const [profileNotice, setProfileNotice] = useState("");
  const [securityError, setSecurityError] = useState("");
  const [securityNotice, setSecurityNotice] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    confirmPassword: "",
    currentPassword: "",
    newPassword: "",
  });

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    setIsLoading(true);
    setProfileError("");

    void (async () => {
      try {
        const response = await fetchAdminAccount();
        if (cancelled) return;
        setAccount(response.account);
      } catch (error) {
        if (!cancelled) {
          setProfileError(error instanceof Error ? error.message : "Failed to load account settings.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  const handleProfileSave = (event?: FormEvent) => {
    event?.preventDefault();
    setIsSavingProfile(true);
    setProfileError("");
    setProfileNotice("");

    void (async () => {
      try {
        const response = await updateAdminAccount({
          contactNumber: account.contactNumber,
          firstName: account.firstName,
          lastName: account.lastName,
          middleName: account.middleName,
        });
        setAccount(response.account);
        setProfileNotice("Account settings updated.");
      } catch (error) {
        setProfileError(error instanceof Error ? error.message : "Failed to save account settings.");
      } finally {
        setIsSavingProfile(false);
      }
    })();
  };

  const handlePasswordChange = (event?: FormEvent) => {
    event?.preventDefault();
    setSecurityError("");
    setSecurityNotice("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setSecurityError("Current password and new password are required.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setSecurityError("New password and confirmation do not match.");
      return;
    }

    setIsChangingPassword(true);

    void (async () => {
      try {
        await changeAdminPassword({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        });
        setPasswordForm({
          confirmPassword: "",
          currentPassword: "",
          newPassword: "",
        });
        setSecurityNotice("Password updated successfully.");
      } catch (error) {
        setSecurityError(error instanceof Error ? error.message : "Failed to update password.");
      } finally {
        setIsChangingPassword(false);
      }
    })();
  };

  return (
    <section className="admin-settings-grid">
      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Account Settings</h2>
            <p className="admin-card__sub">Update your admin profile and account details.</p>
          </div>
        </div>

        {isLoading ? <div className="admin-note">Loading account details...</div> : null}
        {profileError ? <div className="admin-note admin-note--error">{profileError}</div> : null}
        {profileNotice ? <div className="admin-note admin-note--success">{profileNotice}</div> : null}

        <form onSubmit={handleProfileSave}>
          <div className="admin-profile-grid">
            <div className="admin-field">
              <label htmlFor="admin-first-name">First Name</label>
              <input
                id="admin-first-name"
                className="admin-input"
                autoComplete="given-name"
                value={account.firstName}
                onChange={(event) => setAccount({ ...account, firstName: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-middle-name">Middle Name</label>
              <input
                id="admin-middle-name"
                className="admin-input"
                autoComplete="additional-name"
                value={account.middleName}
                onChange={(event) => setAccount({ ...account, middleName: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-last-name">Last Name</label>
              <input
                id="admin-last-name"
                className="admin-input"
                autoComplete="family-name"
                value={account.lastName}
                onChange={(event) => setAccount({ ...account, lastName: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-contact-number">Contact Number</label>
              <input
                id="admin-contact-number"
                className="admin-input"
                autoComplete="tel"
                value={account.contactNumber}
                onChange={(event) => setAccount({ ...account, contactNumber: event.target.value })}
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-email">Email</label>
              <input
                id="admin-email"
                className="admin-input"
                autoComplete="email"
                value={account.email}
                disabled
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-account-id">Account ID</label>
              <input id="admin-account-id" className="admin-input" value={account.accountId} disabled />
            </div>
          </div>

          <div className="admin-account-meta">
            <div className="admin-account-meta__item">
              <span>Status</span>
              <strong>{account.status}</strong>
            </div>
            <div className="admin-account-meta__item">
              <span>Role</span>
              <strong>{account.role === "admin" ? "Administrator" : "User"}</strong>
            </div>
            <div className="admin-account-meta__item">
              <span>Created</span>
              <strong>{formatDateTime(account.createdAt)}</strong>
            </div>
            <div className="admin-account-meta__item">
              <span>Last login</span>
              <strong>{formatDateTime(account.lastLogin)}</strong>
            </div>
          </div>

          <button
            type="submit"
            className="admin-primary-btn"
            disabled={isSavingProfile || isLoading}
          >
            {isSavingProfile ? "Saving..." : "Save Account Settings"}
          </button>
        </form>
      </article>

      <article className="admin-card">
        <div className="admin-card__header">
          <div>
            <h2 className="admin-card__title">Security</h2>
            <p className="admin-card__sub">Change your password and keep the admin account secure.</p>
          </div>
        </div>

        {securityError ? <div className="admin-note admin-note--error">{securityError}</div> : null}
        {securityNotice ? <div className="admin-note admin-note--success">{securityNotice}</div> : null}

        <form onSubmit={handlePasswordChange}>
          <input
            className="admin-autofill-hidden"
            type="email"
            autoComplete="username"
            value={account.email}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
          />

          <div className="admin-security-grid">
            <div className="admin-field">
              <label htmlFor="admin-current-password">Current Password</label>
              <input
                id="admin-current-password"
                className="admin-input"
                type="password"
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, currentPassword: event.target.value })
                }
              />
            </div>

            <div className="admin-field">
              <label htmlFor="admin-new-password">New Password</label>
              <input
                id="admin-new-password"
                className="admin-input"
                type="password"
                autoComplete="new-password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, newPassword: event.target.value })
                }
              />
            </div>

            <div className="admin-field admin-field--full">
              <label htmlFor="admin-confirm-password">Confirm New Password</label>
              <input
                id="admin-confirm-password"
                className="admin-input"
                type="password"
                autoComplete="new-password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })
                }
              />
            </div>
          </div>

          <div className="admin-note">
            Use at least 8 characters and avoid reusing the seeded default password on admin accounts.
          </div>

          <button
            type="submit"
            className="admin-primary-btn"
            disabled={isChangingPassword}
          >
            {isChangingPassword ? "Updating..." : "Change Password"}
          </button>
        </form>
      </article>
    </section>
  );
}
