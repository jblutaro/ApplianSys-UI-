import "@/shared/styles/ConfirmationModal.css";

type ConfirmationModalProps = {
  cancelLabel?: string;
  confirmLabel?: string;
  isBusy?: boolean;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
  variant?: "danger" | "default";
};

export function ConfirmationModal({
  cancelLabel = "Cancel",
  confirmLabel = "Confirm",
  isBusy = false,
  message,
  onCancel,
  onConfirm,
  open,
  title,
  variant = "default",
}: ConfirmationModalProps) {
  if (!open) return null;

  return (
    <div className="confirm-modal" role="presentation" onMouseDown={onCancel}>
      <section
        className="confirm-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className={`confirm-modal__icon confirm-modal__icon--${variant}`} aria-hidden>
          {variant === "danger" ? "!" : "?"}
        </div>
        <h2 id="confirm-modal-title" className="confirm-modal__title">
          {title}
        </h2>
        <p className="confirm-modal__message">{message}</p>
        <div className="confirm-modal__actions">
          <button
            type="button"
            className="confirm-modal__btn confirm-modal__btn--secondary"
            disabled={isBusy}
            onClick={onCancel}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`confirm-modal__btn confirm-modal__btn--${variant}`}
            disabled={isBusy}
            onClick={onConfirm}
          >
            {isBusy ? "Working..." : confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}
