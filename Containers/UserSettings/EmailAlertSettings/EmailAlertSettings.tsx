import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoader } from '~/contexts/LoaderContext';
import { EmailAlertDTO, Optional } from '~/types';
import classes from '../UserSettings.module.css';

//Components
import Error from '~/Components/UI/Error/Error';
import Switch from '~/Components/UI/Switch/Switch';
import { useFormStatus } from '~/hooks';

export default function EmailAlertSettings() {
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    //Callback > re-enabled button after notification.
    onClose: () => setIsSwitchDisabled(false),
  };

  const { error, handleError, clearError } = useFormStatus();
  const { start, stop } = useLoader();

  ////State
  const [isSendingTestNotification, setIsSendingTestNotification] = useState(false);
  const [isSwitchDisabled, setIsSwitchDisabled] = useState(true);
  const [isAlertEnabled, setIsAlertEnabled] = useState<Optional<boolean>>(undefined);
  const [info, setInfo] = useState(false);

  ////LifeCycle
  //Component did mount
  useEffect(() => {
    const dataFetch = async () => {
      try {
        const response = await fetch('/api/v1/notif/email/alert', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });

        const data: Optional<EmailAlertDTO> = await response.json();
        setIsAlertEnabled(data?.emailAlert ?? false);
        setIsSwitchDisabled(false);
      } catch (error) {
        setIsSwitchDisabled(true);
        setIsAlertEnabled(false);
        handleError('Fetching email alert setting failed');
      }
    };
    dataFetch();
  }, []);

  ////Functions
  //Switch to enable/disable Email notifications
  const onChangeSwitchHandler = async (data: EmailAlertDTO) => {
    clearError();
    start();
    setIsSwitchDisabled(true);
    await fetch('/api/v1/notif/email/alert', {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        if (response.ok && typeof data.emailAlert === 'boolean') {
          setIsAlertEnabled(data.emailAlert);
          toast.success(
            data.emailAlert ? 'Email notification enabled !' : 'Email notification disabled !',
            toastOptions
          );
        } else {
          handleError('Update email alert setting failed.');
        }
      })
      .catch(() => {
        handleError('Update email alert setting failed.');
      })
      .finally(() => {
        stop();
        setIsSwitchDisabled(false);
      });
  };

  //Send a test notification by email
  const onSendTestMailHandler = async () => {
    clearError();
    start();
    setIsSendingTestNotification(true);
    try {
      const response = await fetch('/api/v1/notif/email/test', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
      });
      const result = await response.json();

      if (!response.ok) {
        setIsSendingTestNotification(false);
        handleError(result.message);
      } else {
        setIsSendingTestNotification(false);
        setInfo(true);
        setTimeout(() => {
          setInfo(false);
        }, 4000);
      }
    } catch (error) {
      setIsSendingTestNotification(false);
      handleError('Send notification failed');
    } finally {
      stop();
    }
  };

  return (
    <>
      {/* EMAIL ALERT */}
      <div className={classes.containerSetting}>
        <div className={classes.settingCategory}>
          <h2 style={{ alignSelf: 'baseline' }}>Email alert</h2>
          <Link
            style={{ alignSelf: 'baseline', marginLeft: '5px' }}
            href='https://borgwarehouse.com/docs/user-manual/account/#alerting'
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
              switchName='Alert me by email'
              switchDescription='You will receive an alert every 24H if you have a down status.'
              onChange={(e) => onChangeSwitchHandler({ emailAlert: e })}
            />

            <button
              className='defaultButton'
              disabled={isSendingTestNotification}
              onClick={onSendTestMailHandler}
            >
              Send a test mail
            </button>
            {info && (
              <span style={{ marginLeft: '10px', color: '#119300' }}>Mail successfully sent.</span>
            )}
            {error && <Error message={error} />}
          </div>
        </div>
      </div>
    </>
  );
}
