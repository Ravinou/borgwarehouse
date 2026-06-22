import { useEffect, useMemo, useState } from 'react';
import { useTheme } from 'next-themes';
import {
  IconDatabase,
  IconHeartbeat,
  IconServer2,
  IconClockHour4,
  IconAlertTriangle,
  IconCircleCheck,
} from '@tabler/icons-react';
import { fromUnixTime, formatDistanceStrict } from 'date-fns';
import StorageUsedChartBar from '../StorageUsedChartBar/StorageUsedChartBar';
import { Repository, Optional } from '~/types';
import classes from './MonitoringDashboard.module.css';

export default function MonitoringDashboard() {
  const [data, setData] = useState<Optional<Array<Repository>>>();
  const [isLoading, setIsLoading] = useState(true);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const dataFetch = async () => {
      try {
        const response = await fetch('/api/v1/repositories', {
          method: 'GET',
          headers: { 'Content-type': 'application/json' },
        });
        setData((await response.json()).repoList);
      } catch (error) {
        console.log('Fetching datas error');
      } finally {
        setIsLoading(false);
      }
    };
    dataFetch();
  }, []);

  const now = useMemo(() => new Date(), []);

  const stats = useMemo(() => {
    const repos = data ?? [];
    const total = repos.length;
    const healthy = repos.filter((r) => r.status).length;
    const down = total - healthy;

    //storageUsed is in kB, storageSize is in GB.
    const usedGB = repos.reduce((acc, r) => acc + r.storageUsed / 1024 ** 2, 0);
    const capacityGB = repos.reduce((acc, r) => acc + r.storageSize, 0);
    const usedPercent = capacityGB ? (usedGB * 100) / capacityGB : 0;

    const savedRepos = repos.filter((r) => r.lastSave > 0);
    const mostRecentSave = savedRepos.length ? Math.max(...savedRepos.map((r) => r.lastSave)) : 0;

    const nowSec = Math.floor(now.getTime() / 1000);
    const attention = repos.filter((r) => {
      if (!r.status) return true;
      if (r.lastSave === 0) return true;
      if (r.alert && r.alert > 0 && nowSec - r.lastSave > r.alert) return true;
      return false;
    });

    return {
      total,
      healthy,
      down,
      usedGB,
      capacityGB,
      usedPercent,
      mostRecentSave,
      attention,
    };
  }, [data, now]);

  const lastBackupLabel =
    stats.mostRecentSave === 0
      ? '—'
      : formatDistanceStrict(fromUnixTime(stats.mostRecentSave), now, { addSuffix: true });

  const storageLevel =
    stats.usedPercent >= 90 ? classes.danger : stats.usedPercent >= 75 ? classes.warn : '';

  if (isLoading) {
    return (
      <div className={classes.dashboard}>
        <div className={classes.skeletonGrid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={classes.skeletonCard} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={classes.dashboard}>
      <header className={classes.header}>
        <h1 className={classes.title}>Monitoring</h1>
        <p className={classes.subtitle}>Overview of your repositories health and storage usage.</p>
      </header>

      <div className={classes.statGrid}>
        <div className={classes.statCard}>
          <div className={`${classes.statIcon} ${classes.iconPrimary}`}>
            <IconDatabase size={22} stroke={1.8} />
          </div>
          <div className={classes.statBody}>
            <span className={classes.statLabel}>Repositories</span>
            <span className={classes.statValue}>{stats.total}</span>
          </div>
        </div>

        <div className={classes.statCard}>
          <div
            className={`${classes.statIcon} ${stats.down > 0 ? classes.iconDanger : classes.iconSuccess}`}
          >
            <IconHeartbeat size={22} stroke={1.8} />
          </div>
          <div className={classes.statBody}>
            <span className={classes.statLabel}>Healthy</span>
            <span className={classes.statValue}>
              {stats.healthy}
              <span className={classes.statValueMuted}> / {stats.total}</span>
            </span>
          </div>
        </div>

        <div className={classes.statCard}>
          <div className={`${classes.statIcon} ${classes.iconPrimary}`}>
            <IconServer2 size={22} stroke={1.8} />
          </div>
          <div className={classes.statBody}>
            <span className={classes.statLabel}>Storage used</span>
            <span className={classes.statValue}>
              {stats.usedGB.toFixed(1)}
              <span className={classes.statValueMuted}> / {stats.capacityGB} GB</span>
            </span>
            <div className={classes.miniBar}>
              <div
                className={`${classes.miniBarFill} ${storageLevel}`}
                style={{ width: `${Math.min(stats.usedPercent, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <div className={classes.statCard}>
          <div className={`${classes.statIcon} ${classes.iconPrimary}`}>
            <IconClockHour4 size={22} stroke={1.8} />
          </div>
          <div className={classes.statBody}>
            <span className={classes.statLabel}>Last backup</span>
            <span className={classes.statValueSmall}>{lastBackupLabel}</span>
          </div>
        </div>
      </div>

      <div className={classes.panels}>
        <section className={`${classes.panel} ${classes.chartPanel}`}>
          <div className={classes.panelHeader}>
            <h2 className={classes.panelTitle}>Storage used per repository</h2>
            <span className={classes.panelHint}>% of allocated quota</span>
          </div>
          <div className={classes.chartWrapper}>
            {stats.total > 0 ? (
              <StorageUsedChartBar data={data} theme={resolvedTheme} />
            ) : (
              <p className={classes.emptyChart}>No repository to display yet.</p>
            )}
          </div>
        </section>

        <section className={`${classes.panel} ${classes.attentionPanel}`}>
          <div className={classes.panelHeader}>
            <h2 className={classes.panelTitle}>Needs attention</h2>
            {stats.attention.length > 0 && (
              <span className={classes.attentionBadge}>{stats.attention.length}</span>
            )}
          </div>

          {stats.attention.length === 0 ? (
            <div className={classes.allGood}>
              <IconCircleCheck size={32} stroke={1.6} />
              <p>Everything looks healthy.</p>
            </div>
          ) : (
            <ul className={classes.attentionList}>
              {stats.attention.map((repo) => {
                const reason = !repo.status
                  ? 'Status error'
                  : repo.lastSave === 0
                    ? 'No backup yet'
                    : 'Backup overdue';
                return (
                  <li key={repo.id} className={classes.attentionItem}>
                    <IconAlertTriangle size={18} stroke={1.8} className={classes.attentionIcon} />
                    <span className={classes.attentionName}>{repo.alias}</span>
                    <span className={classes.attentionReason}>{reason}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
