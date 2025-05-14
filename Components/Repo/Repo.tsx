import { useState } from 'react';
import classes from './Repo.module.css';
import {
  IconSettings,
  IconInfoCircle,
  IconChevronDown,
  IconChevronUp,
  IconBellOff,
  IconLockPlus,
} from '@tabler/icons-react';
import StorageBar from '../UI/StorageBar/StorageBar';
import QuickCommands from './QuickCommands/QuickCommands';
import { Repository, WizardEnvType, Optional } from '~/types';
import { fromUnixTime, formatDistanceStrict } from 'date-fns';

type RepoProps = Omit<Repository, 'unixUser' | 'displayDetails'> & {
  repoManageEditHandler: () => void;
  wizardEnv: Optional<WizardEnvType>;
};

export default function Repo(props: RepoProps) {
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

  //Status indicator
  const statusIndicator = () => {
    return props.status ? classes.statusIndicatorGreen : classes.statusIndicatorRed;
  };

  //Alert indicator
  const alertIndicator = () => {
    if (props.alert === 0) {
      return (
        <div className={classes.alertIcon}>
          <IconBellOff size={16} color='grey' />
        </div>
      );
    }
  };

  const appendOnlyModeIndicator = () => {
    if (props.appendOnlyMode) {
      return (
        <div className={classes.appendOnlyModeIcon}>
          <IconLockPlus size={16} color='grey' />
        </div>
      );
    }
  };

  return (
    <>
      {displayDetails ? (
        <>
          <div className={classes.RepoOpen}>
            <div className={classes.openFlex}>
              <div className={statusIndicator()} />
              <div className={classes.alias}>{props.alias}</div>
              {appendOnlyModeIndicator()}
              {alertIndicator()}
              {props.comment && (
                <div className={classes.comment}>
                  <IconInfoCircle size={16} color='grey' />
                  <div className={classes.toolTip}>{props.comment}</div>
                </div>
              )}
              <QuickCommands
                repositoryName={props.repositoryName}
                lanCommand={props.lanCommand}
                wizardEnv={props.wizardEnv}
              />
            </div>

            <table className={classes.tabInfo}>
              <thead>
                <tr>
                  <th style={{ width: '15%' }}>Repository</th>
                  <th style={{ width: '10%' }}>Storage Size</th>
                  <th style={{ width: '30%' }}>Storage Used</th>
                  <th style={{ width: '15%' }}>Last change</th>
                  <th style={{ width: '5%' }}>ID</th>
                  <th style={{ width: '5%' }}>Edit</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th>{props.repositoryName}</th>
                  <th>{props.storageSize} GB</th>
                  <th style={{ padding: '0 4% 0 4%' }}>
                    <StorageBar storageUsed={props.storageUsed} storageSize={props.storageSize} />
                  </th>
                  <th>
                    <div
                      className={classes.lastSave}
                      title={
                        props.lastSave === 0
                          ? undefined
                          : fromUnixTime(props.lastSave).toLocaleString()
                      }
                    >
                      {props.lastSave === 0
                        ? '-'
                        : formatDistanceStrict(fromUnixTime(props.lastSave), Date.now(), {
                            addSuffix: true,
                          })}
                    </div>
                  </th>
                  <th>#{props.id}</th>
                  <th>
                    <div className={classes.editButton}>
                      <IconSettings
                        width={24}
                        color='#6d4aff'
                        onClick={() => props.repoManageEditHandler()}
                      />
                    </div>
                  </th>
                </tr>
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div className={classes.RepoClose}>
            <div className={classes.closeFlex}>
              <div className={statusIndicator()} />
              <div className={classes.alias}>{props.alias}</div>
              {appendOnlyModeIndicator()}
              {alertIndicator()}
              {props.comment && (
                <div className={classes.comment}>
                  <IconInfoCircle size={16} color='#637381' />
                  <div className={classes.toolTip}>{props.comment}</div>
                </div>
              )}
            </div>
            <div className={classes.lastSave}>
              <span
                title={
                  props.lastSave === 0 ? undefined : fromUnixTime(props.lastSave).toLocaleString()
                }
              >
                {props.lastSave === 0
                  ? '-'
                  : formatDistanceStrict(fromUnixTime(props.lastSave), Date.now(), {
                      addSuffix: true,
                    })}
              </span>
              <span style={{ marginLeft: '20px', color: '#637381' }}>#{props.id}</span>
            </div>
          </div>
        </>
      )}
      {displayDetails ? (
        <div className={classes.chevron}>
          <IconChevronUp
            color='#494b7a'
            size={28}
            onClick={() => {
              displayDetailsForOneHandler(false);
            }}
          />
        </div>
      ) : (
        <div className={classes.chevron}>
          <IconChevronDown
            color='#494b7a'
            size={28}
            onClick={() => {
              displayDetailsForOneHandler(true);
            }}
          />
        </div>
      )}
    </>
  );
}
