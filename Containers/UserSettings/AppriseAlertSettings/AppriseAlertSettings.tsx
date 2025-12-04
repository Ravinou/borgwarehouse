import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';

//Components
import Switch from '~/Components/UI/Switch/Switch';
import { useLoader } from '~/contexts/LoaderContext';
import { Optional } from '~/types';
import AppriseMode from './AppriseMode/AppriseMode';
import AppriseURLs from './AppriseURLs/AppriseURLs';

type AppriseAlertDataForm = {
  appriseAlert: boolean;
};

export default function AppriseAlertSettings() {
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const { start, stop } = useLoader();

  ////State
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const [isSwitchDisabled, setIsSwitchDisabled] = useState(true);
  const [isAlertEnabled, setIsAlertEnabled] = useState<Optional<boolean>>(undefined);
  const [info, setInfo] = useState(false);

  ////LifeCycle
  //Component did mount
  useEffect(() => {
    //Initial fetch to get the status of Apprise Alert
    const getAppriseAlert = async () => {
      try {
        const response = await fetch('/api/v1/notif/apprise/alert', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });

        const data: Optional<AppriseAlertDataForm> = await response.json();
        setIsAlertEnabled(data?.appriseAlert ?? false);
        setIsSwitchDisabled(false);
      } catch (error) {
        setIsSwitchDisabled(true);
        setIsAlertEnabled(false);
        toast.error('Fetching Apprise alert setting failed', toastOptions);
      }
    };
    getAppriseAlert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  ////Functions
  //Switch to enable/disable Apprise notifications
  const onChangeSwitchHandler = async (data: AppriseAlertDataForm) => {
    start();
    setIsSwitchDisabled(true);
    await fetch('/api/v1/notif/apprise/alert', {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok && typeof data.appriseAlert === 'boolean') {
          setIsAlertEnabled(data.appriseAlert);
          toast.success(
            data.appriseAlert ? 'Apprise notifications enabled' : 'Apprise notifications disabled',
            toastOptions
          );
        } else {
          toast.error('Update Apprise failed', toastOptions);
        }
      })
      .catch(() => {
        toast.error('Update Apprise failed', toastOptions);
      })
      .finally(() => {
        stop();
        setIsSwitchDisabled(false);
      });
  };

  //Send Apprise test notification to services
  const onSendTestAppriseHandler = async () => {
    start();
    setIsSendingTestNotification(true);
    try {
      const response = await fetch('/api/v1/notif/apprise/test', {
        method: 'POST',
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message, toastOptions);
      } else {
        setInfo(true);
        setTimeout(() => {
          setInfo(false);
        }, 4000);
      }
    } catch (error) {
      toast.error('Sending test notification failed', toastOptions);
    } finally {
      stop();
      setIsSendingTestNotification(false);
    }
  };

  return (
    <>
      {/* APPRISE ALERT */}
      <div className={classes.containerSetting}>
        <div className={classes.settingCategory}>
          <h2 style={{ alignSelf: 'baseline' }}>Apprise alert</h2>
          <Link
            style={{ alignSelf: 'baseline', marginLeft: '5px' }}
            href='https://borgwarehouse.com/docs/user-manual/account/#apprise'
            rel='noreferrer'
            target='_blank'
          >
            <IconExternalLink size={16} color='#6c737f' />
          </Link>
        </div>
        <div className={classes.setting}>
          <div className={classes.bwFormWrapper}>
            <Switch
              loading={isAlertEnabled === undefined}
              checked={isAlertEnabled}
              disabled={isSwitchDisabled}
              switchName='Notify my Apprise services'
              switchDescription='You will receive an alert on all your services every 24H if you have a down status.'
              onChange={(e) => onChangeSwitchHandler({ appriseAlert: e })}
            />
            {isAlertEnabled && (
              <>
                <AppriseURLs />
                <AppriseMode />
                <button
                  disabled={isSendingTestNotification}
                  style={{ marginTop: '20px' }}
                  className='defaultButton'
                  onClick={() => onSendTestAppriseHandler()}
                >
                  Send a test notification
                </button>
                {info && (
                  <span style={{ marginLeft: '10px', color: '#119300' }}>
                    Notification successfully sent.
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
