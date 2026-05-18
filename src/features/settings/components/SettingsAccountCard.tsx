import { type FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchAccountProfile,
  updateAccountProfile,
  type AccountProfile,
  type AppUser,
} from "@/shared/lib/auth";

type SettingsAccountCardProps = {
  user: AppUser;
};

const EMPTY_PROFILE: AccountProfile = {
  accountId: "",
  contactNumber: "",
  createdAt: null,
  displayName: "",
  email: "",
  firstName: "",
  lastLogin: null,
  lastName: "",
  middleName: "",
  role: "customer",
  status: "Active",
};

function getRoleLabel(role: AppUser["role"]) {
  if (role === "admin") return "Administrator";
  if (role === "staff") return "Staff";
  return "Customer";
}

export function SettingsAccountCard({ user }: SettingsAccountCardProps) {
  const [profile, setProfile] = useState<AccountProfile>({
    ...EMPTY_PROFILE,
    accountId: user.accountId,
    displayName: user.displayName,
    email: user.email,
    role: user.role,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const response = await fetchAccountProfile();
        if (!cancelled) {
          setProfile(response.account);
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "Failed to load account details.");
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
  }, []);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    setError("");
    setNotice("");
    setIsSaving(true);

    void (async () => {
      try {
        const response = await updateAccountProfile({
          contactNumber: profile.contactNumber,
          firstName: profile.firstName,
          lastName: profile.lastName,
          middleName: profile.middleName,
        });
        setProfile(response.account);
        setNotice("Account details updated.");
      } catch (saveError) {
        setError(saveError instanceof Error ? saveError.message : "Failed to save account details.");
      } finally {
        setIsSaving(false);
      }
    })();
  };

  return (
    <section className="settings-card settings-card--account">
      <div className="settings-card__header">
        <span className="settings-card__eyebrow">Account</span>
        <h2 className="settings-card__title">Profile details</h2>
      </div>

      <div className="settings-account__hero">
        <div className="settings-account__avatar">
          {(profile.displayName || user.displayName || user.email || "U")[0].toUpperCase()}
        </div>
        <div>
          <div className="settings-account__name">{profile.displayName || user.displayName}</div>
          <div className="settings-account__email">{profile.email || user.email}</div>
        </div>
      </div>

      <dl className="settings-account__facts">
        <div className="settings-account__fact">
          <dt>Role</dt>
          <dd>{getRoleLabel(profile.role)}</dd>
        </div>
        <div className="settings-account__fact">
          <dt>Status</dt>
          <dd>{profile.status}</dd>
        </div>
        <div className="settings-account__fact settings-account__fact--account-id">
          <dt>Account ID</dt>
          <dd>{profile.accountId}</dd>
        </div>
      </dl>

      {isLoading ? <p className="settings-card__note">Loading account details...</p> : null}
      {error ? <p className="settings-card__note settings-card__note--error">{error}</p> : null}
      {notice ? <p className="settings-card__note settings-card__note--success">{notice}</p> : null}

      <form className="settings-account__form" onSubmit={handleSave}>
        <label className="settings-field">
          <span className="settings-field__label">First name</span>
          <input
            className="settings-field__input"
            autoComplete="given-name"
            value={profile.firstName}
            onChange={(event) => setProfile({ ...profile, firstName: event.target.value })}
            required
          />
        </label>
        <label className="settings-field">
          <span className="settings-field__label">Middle name</span>
          <input
            className="settings-field__input"
            autoComplete="additional-name"
            value={profile.middleName}
            onChange={(event) => setProfile({ ...profile, middleName: event.target.value })}
          />
        </label>
        <label className="settings-field">
          <span className="settings-field__label">Last name</span>
          <input
            className="settings-field__input"
            autoComplete="family-name"
            value={profile.lastName}
            onChange={(event) => setProfile({ ...profile, lastName: event.target.value })}
            required
          />
        </label>
        <label className="settings-field">
          <span className="settings-field__label">Contact number</span>
          <input
            className="settings-field__input"
            autoComplete="tel"
            value={profile.contactNumber}
            onChange={(event) => setProfile({ ...profile, contactNumber: event.target.value })}
          />
        </label>

        <button
          type="submit"
          className="settings-account__action settings-account__action--primary"
          disabled={isLoading || isSaving}
        >
          {isSaving ? "Saving..." : "Save details"}
        </button>
      </form>

      <div className="settings-account__actions">
        <Link to="/orders" className="settings-account__action">
          View orders
        </Link>
        <Link to="/" className="settings-account__action">
          Continue shopping
        </Link>
        {user.role === "admin" || user.role === "staff" ? (
          <Link to="/admin" className="settings-account__action">
            Open panel
          </Link>
        ) : null}
      </div>
    </section>
  );
}
