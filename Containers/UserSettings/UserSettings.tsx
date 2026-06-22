import 'react-toastify/dist/ReactToastify.css';
import classes from './UserSettings.module.css';
import { useState, useEffect } from 'react';
import type { BwAuthSession } from '~/lib/auth-client';
import { Optional, WizardEnvType, SessionStatus } from '~/types';

// Components
import EmailSettings from './EmailSettings/EmailSettings';
import PasswordSettings from './PasswordSettings/PasswordSettings';
import UsernameSettings from './UsernameSettings/UsernameSettings';
import EmailAlertSettings from './EmailAlertSettings/EmailAlertSettings';
import AppriseAlertSettings from './AppriseAlertSettings/AppriseAlertSettings';
import WebhookAlertSettings from './WebhookAlertSettings/WebhookAlertSettings';
import Integrations from './Integrations/Integrations';
import LinkedAccounts from './LinkedAccounts/LinkedAccounts';
import DateFormatSettings from './DateFormatSettings/DateFormatSettings';

type UserSettingsProps = {
  status: SessionStatus;
  data: BwAuthSession;
};

export default function UserSettings({ data }: UserSettingsProps) {
  const [tab, setTab] = useState<'General' | 'Notifications' | 'Integrations'>('General');
  const [wizardEnv, setWizardEnv] = useState<Optional<WizardEnvType>>(undefined);
  const [passwordLoginEnabled, setPasswordLoginEnabled] = useState(true);

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

    const fetchAuthConfig = async () => {
      try {
        const response = await fetch('/api/v1/auth/providers');
        const data = await response.json();
        setPasswordLoginEnabled(data.passwordLoginEnabled ?? true);
      } catch {}
    };

    fetchWizardEnv();
    fetchAuthConfig();
  }, []);

  // Derive active tab: fallback to General if Integrations is disabled
  const activeTab =
    tab === 'Integrations' && wizardEnv?.DISABLE_INTEGRATIONS === 'true' ? 'General' : tab;

  return (
    <div className={classes.containerSettings}>
      <h1 style={{ color: 'var(--text-strong)', textAlign: 'left', marginLeft: '4px' }}>Account</h1>

      {wizardEnv != undefined && (
        <>
          <div className={classes.tabList}>
            <button
              className={
                activeTab === 'General' ? classes.tabListButtonActive : classes.tabListButton
              }
              onClick={() => setTab('General')}
            >
              General
            </button>
            <button
              className={
                activeTab === 'Notifications' ? classes.tabListButtonActive : classes.tabListButton
              }
              onClick={() => setTab('Notifications')}
            >
              Notifications
            </button>
            {wizardEnv.DISABLE_INTEGRATIONS !== 'true' && (
              <button
                className={
                  activeTab === 'Integrations' ? classes.tabListButtonActive : classes.tabListButton
                }
                onClick={() => setTab('Integrations')}
              >
                Integrations
              </button>
            )}
          </div>

          {activeTab === 'General' && (
            <>
              {passwordLoginEnabled && (
                <UsernameSettings
                  username={data?.user?.username ?? data?.user?.name ?? undefined}
                />
              )}
              {passwordLoginEnabled && <PasswordSettings />}
              <EmailSettings email={data?.user?.email ?? undefined} />
              <LinkedAccounts />
              <DateFormatSettings />
            </>
          )}

          {activeTab === 'Notifications' && (
            <>
              <EmailAlertSettings />
              <AppriseAlertSettings />
              <WebhookAlertSettings />
            </>
          )}

          {activeTab === 'Integrations' && wizardEnv.DISABLE_INTEGRATIONS !== 'true' && (
            <Integrations />
          )}
        </>
      )}
    </div>
  );
}
