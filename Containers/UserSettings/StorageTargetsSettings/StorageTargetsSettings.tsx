import { useEffect, useState, useCallback } from 'react';
import { IconRefresh, IconCloud, IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import parentClasses from '../UserSettings.module.css';
import classes from './StorageTargetsSettings.module.css';
import { StorageTargetStatusWithNameDTO } from '~/types';
import ErrorMessage from '~/Components/UI/Error/Error';

export default function StorageTargetsSettings() {
  const [statuses, setStatuses] = useState<StorageTargetStatusWithNameDTO[] | undefined>(undefined);
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
      const data: { statuses: StorageTargetStatusWithNameDTO[] } = await response.json();
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
          <Link
            style={{ alignSelf: 'baseline', marginLeft: '5px' }}
            href='https://borgwarehouse.com/docs/admin-manual/external-storage/'
            rel='noreferrer'
            target='_blank'
          >
            <IconExternalLink size={16} color='var(--text-muted)' />
          </Link>
        </div>
      </div>
      <div className={parentClasses.setting}>
        <p className={classes.description}>
          Storage targets declared with the <code>STORAGE_TARGETS</code> environment variable.
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
                <div className={classes.itemBody}>
                  <span className={classes.name}>{target.name}</span>
                  {target.name !== target.path && (
                    <span className={classes.path} title={target.path}>
                      {target.path}
                    </span>
                  )}
                </div>
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
