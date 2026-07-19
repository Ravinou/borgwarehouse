import { ReactNode } from 'react';
import classes from './ConfirmDialog.module.css';

type ConfirmDialogVariant = 'danger' | 'warning';

type ConfirmDialogProps = {
  variant: ConfirmDialogVariant;
  icon: ReactNode;
  title: ReactNode;
  children: ReactNode;
  confirmLabel: string;
  busyLabel?: string;
  isBusy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/** Highlights a repository name inside a dialog title. */
export function DialogHighlight({ children }: { children: ReactNode }) {
  return <span className={classes.repoName}>{children}</span>;
}

/**
 * Generic confirmation dialog used for the repository maintenance/danger
 * actions (delete, break-lock, archive).
 */
export default function ConfirmDialog({
  variant,
  icon,
  title,
  children,
  confirmLabel,
  busyLabel,
  isBusy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const iconCircleClass =
    variant === 'danger' ? classes.iconCircleDanger : classes.iconCircleWarning;
  const messageClass = variant === 'danger' ? classes.messageDanger : classes.messageWarning;
  const confirmClass = variant === 'danger' ? classes.confirmDanger : classes.confirmWarning;

  return (
    <div className={classes.wrapper}>
      <div className={`${classes.iconCircle} ${iconCircleClass}`}>{icon}</div>
      <h1>{title}</h1>
      <div className={`${classes.message} ${messageClass}`}>{children}</div>
      <div className={classes.buttons}>
        <button onClick={onCancel} disabled={isBusy} className={classes.cancel}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={isBusy}
          className={`${classes.confirm} ${confirmClass}`}
        >
          {isBusy && busyLabel ? busyLabel : confirmLabel}
        </button>
      </div>
    </div>
  );
}
