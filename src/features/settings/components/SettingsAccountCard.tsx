import { Link } from "react-router-dom";
import type { AppUser } from "@/shared/lib/auth";

type SettingsAccountCardProps = {
  user: AppUser;
};

export function SettingsAccountCard({ user }: SettingsAccountCardProps) {
  return (
    <section className="settings-card settings-card--account">
      <div className="settings-card__header">
        <span className="settings-card__eyebrow">Account</span>
        <h2 className="settings-card__title">Profile summary</h2>
      </div>

      <div className="settings-account__hero">
        <div className="settings-account__avatar">
          {(user.displayName || user.email || "U")[0].toUpperCase()}
        </div>
        <div>
          <div className="settings-account__name">{user.displayName}</div>
          <div className="settings-account__email">{user.email}</div>
        </div>
      </div>

      <dl className="settings-account__facts">
        <div className="settings-account__fact">
          <dt>Role</dt>
          <dd>{user.role === "admin" ? "Administrator" : "Customer"}</dd>
        </div>
        <div className="settings-account__fact">
          <dt>Sign-in method</dt>
          <dd>Local account</dd>
        </div>
        <div className="settings-account__fact">
          <dt>Account ID</dt>
          <dd>{user.accountId}</dd>
        </div>
      </dl>

      <div className="settings-account__actions">
        <Link to="/orders" className="settings-account__action settings-account__action--primary">
          View orders
        </Link>
        <Link to="/" className="settings-account__action">
          Continue shopping
        </Link>
        {user.role === "admin" ? (
          <Link to="/admin" className="settings-account__action">
            Open admin panel
          </Link>
        ) : null}
      </div>
    </section>
  );
}
