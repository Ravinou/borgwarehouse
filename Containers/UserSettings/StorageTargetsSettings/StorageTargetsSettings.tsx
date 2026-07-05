import { useEffect, useState, useCallback } from 'react';
import { IconRefresh, IconCloud } from '@tabler/icons-react';
import parentClasses from '../UserSettings.module.css';
import classes from './StorageTargetsSettings.module.css';
import { StorageTargetStatusDTO } from '~/types';
import ErrorMessage from '~/Components/UI/Error/Error';

export default function StorageTargetsSettings() {
  const [statuses, setStatuses] = useState<StorageTargetStatusDTO[] | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);

  const fetchStatuses = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await fetch('/api/v1/storage-targets/status', {
        method: 'GET',
        headers: { 'Content-type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error('Request failed');
      }
      const data: { statuses: StorageTargetStatusDTO[] } = await response.json();
      setStatuses(data.statuses ?? []);
    } catch {
      setError('Failed to load storage targets status.');
      setStatuses((prev) => prev ?? []);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStatuses();
  }, [fetchStatuses]);
  const hasTargets = statuses !== undefined && statuses.length > 0;
  const isEmpty = statuses !== undefined && statuses.length === 0 && !error;

  return (
    <div className={parentClasses.containerSetting}>
      <div className={parentClasses.settingCategory}>
        <div className={parentClasses.settingTitleRow}>
          <IconCloud size={22} color='var(--primary)' />
          <h2>Storage targets</h2>
        </div>
      </div>
      <div className={parentClasses.setting}>
        <p className={classes.description}>
          Storage targets declared with the <code>STORAGE_TARGETS</code> environment variable. You
          can select these destinations when creating a repository.
        </p>

        {hasTargets && (
          <div className={classes.header}>
            <button
              className={classes.refreshButton}
              onClick={fetchStatuses}
              disabled={isLoading}
              type='button'
            >
              <IconRefresh size={16} />
              {isLoading ? 'Testing…' : 'Test again'}
            </button>
          </div>
        )}

        {hasTargets && (
          <div className={classes.list}>
            {statuses?.map((target) => (
              <div className={classes.item} key={target.path}>
                <span
                  className={`${classes.dot} ${
                    target.status === 'online' ? classes.online : classes.unreachable
                  }`}
                  title={target.status === 'online' ? 'Online' : 'Unreachable'}
                />
                <span className={classes.path}>{target.path}</span>
                <span className={classes.statusLabel}>
                  {target.status === 'online' ? 'Online' : 'Unreachable'}
                </span>
              </div>
            ))}
          </div>
        )}

        {isEmpty && (
          <div className={classes.emptyState}>
            No storage target is configured. You can add one by setting the{' '}
            <code>STORAGE_TARGETS</code> environment variable to store repositories on a mounted
            external location.
          </div>
        )}

        {error && <ErrorMessage message={error} />}
      </div>
    </div>
  );
}
