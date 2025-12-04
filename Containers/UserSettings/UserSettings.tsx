import 'react-toastify/dist/ReactToastify.css';
import classes from './UserSettings.module.css';
import { useState, useEffect } from 'react';
import { Session } from 'next-auth';
import { Optional, WizardEnvType, SessionStatus } from '~/types';

// Components
import EmailSettings from './EmailSettings/EmailSettings';
import PasswordSettings from './PasswordSettings/PasswordSettings';
import UsernameSettings from './UsernameSettings/UsernameSettings';
import EmailAlertSettings from './EmailAlertSettings/EmailAlertSettings';
import AppriseAlertSettings from './AppriseAlertSettings/AppriseAlertSettings';
import Integrations from './Integrations/Integrations';

type UserSettingsProps = {
  status: SessionStatus;
  data: Session;
};

export default function UserSettings({ data }: UserSettingsProps) {
  const [tab, setTab] = useState<'General' | 'Notifications' | 'Integrations'>('General');
  const [wizardEnv, setWizardEnv] = useState<Optional<WizardEnvType>>(undefined);

  // Fetch wizard environment on mount
  useEffect(() => {
    const fetchWizardEnv = async () => {
      try {
        const response = await fetch('/api/v1/account/wizard-env');
        const data: WizardEnvType = await response.json();
        setWizardEnv(data);
      } catch (error) {
        console.error('Failed to fetch wizard environment:', error);
      }
    };

    fetchWizardEnv();
  }, []);

  // If Integrations tab is selected but disabled, fallback to General
  useEffect(() => {
    if (tab === 'Integrations' && wizardEnv?.DISABLE_INTEGRATIONS === 'true') {
      setTab('General');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wizardEnv?.DISABLE_INTEGRATIONS]);

  return (
    <div className={classes.containerSettings}>
      <h1 style={{ color: '#494b7a', textAlign: 'left', marginLeft: '30px' }}>Account</h1>

      {wizardEnv != undefined && (
        <>
          <div className={classes.tabList}>
            <button
              className={tab === 'General' ? classes.tabListButtonActive : classes.tabListButton}
              onClick={() => setTab('General')}
            >
              General
            </button>
            <button
              className={
                tab === 'Notifications' ? classes.tabListButtonActive : classes.tabListButton
              }
              onClick={() => setTab('Notifications')}
            >
              Notifications
            </button>
            {wizardEnv.DISABLE_INTEGRATIONS !== 'true' && (
              <button
                className={
                  tab === 'Integrations' ? classes.tabListButtonActive : classes.tabListButton
                }
                onClick={() => setTab('Integrations')}
              >
                Integrations
              </button>
            )}
          </div>

          {tab === 'General' && (
            <>
              <PasswordSettings />
              <EmailSettings email={data.user?.email ?? undefined} />
              <UsernameSettings username={data.user?.name ?? undefined} />
            </>
          )}

          {tab === 'Notifications' && (
            <>
              <EmailAlertSettings />
              <AppriseAlertSettings />
            </>
          )}

          {tab === 'Integrations' && wizardEnv.DISABLE_INTEGRATIONS !== 'true' && <Integrations />}
        </>
      )}
    </div>
  );
}
