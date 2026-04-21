import { Link } from "react-router-dom";

type AdminAccessStateProps = {
  actionLabel?: string;
  onAction?: () => void;
  showBackLink?: boolean;
  title: string;
  body: React.ReactNode;
};

export function AdminAccessState({
  actionLabel,
  body,
  onAction,
  showBackLink = false,
  title,
}: AdminAccessStateProps) {
  return (
    <div className="admin-empty-state">
      <div className="admin-empty-card">
        <h1>{title}</h1>
        <p>{body}</p>
        <div className="admin-empty-card__actions">
          {actionLabel && onAction ? (
            <button type="button" className="admin-primary-btn" onClick={onAction}>
              {actionLabel}
            </button>
          ) : null}
          {showBackLink ? (
            <Link to="/" className="admin-secondary-btn">
              Back to Store
            </Link>
          ) : null}
        </div>
      </div>
    </div>
  );
}
