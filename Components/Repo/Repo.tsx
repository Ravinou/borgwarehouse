import { useState, useMemo } from 'react';
import classes from './Repo.module.css';
import { IconSettings, IconChevronDown, IconBellOff, IconLockPlus, IconCloud } from '@tabler/icons-react';
import StorageBar from '../UI/StorageBar/StorageBar';
import InfoTooltip from '../UI/InfoTooltip/InfoTooltip';
import RepoIcon from './RepoIcon';
import QuickCommands from './QuickCommands/QuickCommands';
import { Repository, WizardEnvType, Optional, DateFormatEnum } from '~/types';
import { fromUnixTime, formatDistanceStrict } from 'date-fns';
import { formatDate } from '~/helpers/functions';
import useMedia from 'use-media';

type RepoProps = Omit<Repository, 'unixUser' | 'displayDetails'> & {
  repoManageEditHandler: () => void;
  wizardEnv: Optional<WizardEnvType>;
  dateFormat?: DateFormatEnum;
};

export default function Repo(props: RepoProps) {
  const isMobile = useMedia({ maxWidth: 1000 });

  const currentDate = useMemo(() => new Date(), []);

  //Load displayDetails from LocalStorage
  const displayDetailsFromLS = (): boolean => {
    const key = `displayDetailsRepo${props.id}`;

    try {
      const storedValue = localStorage.getItem(key);

      if (storedValue === null) {
        const defaultValue = true;
        localStorage.setItem(key, JSON.stringify(defaultValue));
        return defaultValue;
      }

      const parsedValue = JSON.parse(storedValue);
      if (typeof parsedValue === 'boolean') {
        return parsedValue;
      }

      localStorage.removeItem(key);
      return true;
    } catch (error) {
      localStorage.removeItem(key);
      return true;
    }
  };

  //States
  const [displayDetails, setDisplayDetails] = useState(displayDetailsFromLS);

  //BUTTON : Display or not repo details for ONE repo
  const displayDetailsForOneHandler = (boolean: boolean) => {
    //Update localStorage
    localStorage.setItem('displayDetailsRepo' + props.id, JSON.stringify(boolean));
    setDisplayDetails(boolean);
  };

  //Last save, human readable
  const lastSaveLabel =
    props.lastSave === 0
      ? '-'
      : formatDistanceStrict(fromUnixTime(props.lastSave), currentDate, {
          addSuffix: true,
        });
  const lastSaveTitle =
    props.lastSave === 0 ? undefined : formatDate(props.lastSave, props.dateFormat);

  //Repo identity: gradient icon avatar with status badge
  const repoIdentity = () => (
    <div className={classes.avatar} aria-hidden='true'>
      <RepoIcon name={props.icon} size={20} stroke={1.75} />
      <span
        className={`${classes.statusBadge} ${props.status ? classes.statusOk : classes.statusKo}`}
        title={props.status ? 'Status OK' : 'Status error'}
      />
    </div>
  );

  //Indicator chips (append-only, alert, comment)
  const indicatorChips = () => (
    <>
      {props.appendOnlyMode && (
        <div className={classes.chip} title='Append-only mode enabled'>
          <IconLockPlus size={16} />
        </div>
      )}
      {props.storageTarget && (
        <div className={classes.chip} title={`External storage: ${props.storageTarget}`}>
          <IconCloud size={16} />
        </div>
      )}
      {props.alert === 0 && (
        <div className={classes.chip} title='Alerts disabled'>
          <IconBellOff size={16} />
        </div>
      )}
      {props.comment && (
        <InfoTooltip
          content={props.comment}
          maxWidth={360}
          triggerClassName={classes.chip}
          ariaLabel='Repository comment'
        />
      )}
    </>
  );

  // ---------- MOBILE ----------
  if (isMobile) {
    return (
      <div className={classes.card}>
        <div className={classes.header}>
          <div className={classes.titleGroup}>
            {repoIdentity()}
            <div className={classes.alias}>{props.alias}</div>
          </div>
          <div className={classes.headerMeta}>
            {indicatorChips()}
            <span className={classes.lastSavePill} title={lastSaveTitle}>
              {lastSaveLabel}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ---------- DESKTOP ----------
  return (
    <div className={classes.card}>
      <div className={classes.header}>
        <div className={classes.titleGroup}>
          {repoIdentity()}
          <div className={classes.alias}>{props.alias}</div>
        </div>

        <div className={classes.headerMeta}>
          {indicatorChips()}

          {!displayDetails && (
            <span className={classes.lastSavePill} title={lastSaveTitle}>
              {lastSaveLabel}
            </span>
          )}

          <button
            className={`${classes.toggleButton} ${displayDetails ? classes.toggleOpen : ''}`}
            onClick={() => displayDetailsForOneHandler(!displayDetails)}
            title={displayDetails ? 'Collapse details' : 'Expand details'}
            aria-label={displayDetails ? 'Collapse details' : 'Expand details'}
          >
            <IconChevronDown size={20} />
          </button>
        </div>
      </div>

      <div className={`${classes.bodyWrap} ${displayDetails ? classes.bodyOpen : ''}`}>
        <div className={classes.bodyInner}>
          <div className={classes.body}>
            <div className={classes.bodyTop}>
              <QuickCommands
                repositoryName={props.repositoryName}
                lanCommand={props.lanCommand}
                wizardEnv={props.wizardEnv}
              />
            </div>

            <div className={classes.statGrid}>
              <div className={classes.stat}>
                <span className={classes.statLabel}>Repository</span>
                <span className={classes.repoName}>{props.repositoryName}</span>
              </div>

              <div className={classes.stat}>
                <span className={classes.statLabel}>Storage Size</span>
                <span className={classes.statValue}>{props.storageSize} GB</span>
              </div>

              <div className={classes.stat}>
                <span className={classes.statLabel}>Storage Used</span>
                <StorageBar storageUsed={props.storageUsed} storageSize={props.storageSize} />
              </div>

              <div className={classes.stat}>
                <span className={classes.statLabel}>Last change</span>
                <span className={classes.statValue} title={lastSaveTitle}>
                  {lastSaveLabel}
                </span>
              </div>

              <div className={classes.statActions}>
                <button
                  className={classes.editButton}
                  onClick={() => props.repoManageEditHandler()}
                  title='Edit repository'
                  aria-label='Edit repository'
                >
                  <IconSettings size={22} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
