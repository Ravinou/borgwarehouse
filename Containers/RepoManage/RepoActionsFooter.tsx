import { IconArchive, IconArchiveOff, IconLockOpen, IconTrash } from '@tabler/icons-react';
import classes from './RepoActionsFooter.module.css';

type RepoActionsFooterProps = {
  isArchived: boolean;
  isArchiving: boolean;
  onBreakLock: () => void;
  onArchive: () => void;
  onUnarchive: () => void;
  onDelete: () => void;
};

/**
 * Maintenance and danger actions shown at the bottom of the edit form:
 * break-lock, archive/unarchive and delete.
 */
export default function RepoActionsFooter({
  isArchived,
  isArchiving,
  onBreakLock,
  onArchive,
  onUnarchive,
  onDelete,
}: RepoActionsFooterProps) {
  return (
    <div className={classes.footer}>
      <div className={classes.divider} />
      <div className={classes.row}>
        <div className={classes.maintenanceActions}>
          <button
            type='button'
            className={classes.actionButton}
            onClick={onBreakLock}
            title='Release a stale lock left by an interrupted operation. Only use this if backups fail with a lock error and no backup is currently running.'
          >
            <IconLockOpen size={18} />
            Break lock
          </button>
          {isArchived ? (
            <button
              type='button'
              className={classes.actionButton}
              onClick={onUnarchive}
              disabled={isArchiving}
              title='Unarchive: restore the client access and notifications for this repository.'
            >
              <IconArchiveOff size={18} />
              {isArchiving ? 'Unarchiving…' : 'Unarchive'}
            </button>
          ) : (
            <button
              type='button'
              className={classes.actionButton}
              onClick={onArchive}
              title='Archive: freeze this repository (read-only, no client access, no notifications).'
            >
              <IconArchive size={18} />
              Archive
            </button>
          )}
        </div>
        <button type='button' className={classes.deleteButton} onClick={onDelete}>
          <IconTrash size={18} />
          Delete repository
        </button>
      </div>
    </div>
  );
}
