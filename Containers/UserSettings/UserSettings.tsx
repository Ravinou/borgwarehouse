//Lib
import 'react-toastify/dist/ReactToastify.css';
import classes from './UserSettings.module.css';
import { useState, useEffect } from 'react';

//Components
import EmailSettings from './EmailSettings/EmailSettings';
import PasswordSettings from './PasswordSettings/PasswordSettings';
import UsernameSettings from './UsernameSettings/UsernameSettings';
import EmailAlertSettings from './EmailAlertSettings/EmailAlertSettings';
import AppriseAlertSettings from './AppriseAlertSettings/AppriseAlertSettings';
import Integrations from './Integrations/Integrations';

export default function UserSettings(props) {
  //States
  const [tab, setTab] = useState('General');
  const [wizardEnv, setWizardEnv] = useState({});

  //ComponentDidMount
  useEffect(() => {
    const fetchWizardEnv = async () => {
      try {
        const response = await fetch('/api/account/getWizardEnv', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        setWizardEnv((await response.json()).wizardEnv);
      } catch (error) {
        console.log('Fetching datas error');
      }
    };
    fetchWizardEnv();
  }, []);

  return (
    <div className={classes.containerSettings}>
      <div>
        <h1
          style={{
            color: '#494b7a',
            textAlign: 'left',
            marginLeft: '30px',
          }}
        >
          Account{' '}
        </h1>
      </div>
      <div className={classes.tabList}>
        <button
          className={tab === 'General' ? classes.tabListButtonActive : classes.tabListButton}
          onClick={() => setTab('General')}
        >
          General
        </button>
        <button
          className={tab === 'Notifications' ? classes.tabListButtonActive : classes.tabListButton}
          onClick={() => setTab('Notifications')}
        >
          Notifications
        </button>
        {wizardEnv.DISABLE_INTEGRATIONS !== 'true' && (
          <button
            className={tab === 'Integrations' ? classes.tabListButtonActive : classes.tabListButton}
            onClick={() => setTab('Integrations')}
          >
            Integrations
          </button>
        )}
      </div>
      {tab === 'General' && (
        <>
          <PasswordSettings username={props.data.user.name} />
          <EmailSettings email={props.data.user.email} />
          <UsernameSettings username={props.data.user.name} />{' '}
        </>
      )}
      {tab === 'Notifications' && (
        <>
          <EmailAlertSettings />
          <AppriseAlertSettings />
        </>
      )}
      {tab === 'Integrations' && (
        <>
          <Integrations />
        </>
      )}
    </div>
  );
}
