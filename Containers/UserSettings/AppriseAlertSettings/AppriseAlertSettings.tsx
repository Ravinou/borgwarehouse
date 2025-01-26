//Lib
import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { SpinnerCircularFixed } from 'spinners-react';
import classes from '../UserSettings.module.css';

//Components
import Error from '~/Components/UI/Error/Error';
import Switch from '~/Components/UI/Switch/Switch';
import { useFormStatus } from '~/hooks/useFormStatus';
import { Optional } from '~/types';
import AppriseMode from './AppriseMode/AppriseMode';
import AppriseURLs from './AppriseURLs/AppriseURLs';

type AppriseAlertDataForm = {
  appriseAlert: boolean;
};

export default function AppriseAlertSettings() {
  //Var
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const { error, handleError, clearError } = useFormStatus();

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
        const response = await fetch('/api/account/getAppriseAlert', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });

        const data: AppriseAlertDataForm = await response.json();
        setIsAlertEnabled(data.appriseAlert);
        setIsSwitchDisabled(false);
      } catch (error) {
        setIsSwitchDisabled(true);
        setIsAlertEnabled(false);
        handleError('Fetching apprise alert setting failed.');
      }
    };
    getAppriseAlert();
  }, []);

  ////Functions
  //Switch to enable/disable Apprise notifications
  const onChangeSwitchHandler = async (data: AppriseAlertDataForm) => {
    clearError();
    setIsSwitchDisabled(true);
    await fetch('/api/account/updateAppriseAlert', {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        console.log(response);
        if (response.ok) {
          if (data.appriseAlert) {
            setIsAlertEnabled(!isAlertEnabled);
            setIsSwitchDisabled(false);
            toast.success('Apprise notifications enabled.', toastOptions);
          } else {
            setIsAlertEnabled(!isAlertEnabled);
            setIsSwitchDisabled(false);
            toast.success('Apprise notifications disabled.', toastOptions);
          }
        } else {
          handleError('Update apprise alert setting failed.');
        }
      })
      .catch((error) => {
        handleError('Update Apprise failed. Contact your administrator.');
        console.log(error);
      });
  };

  //Send Apprise test notification to services
  const onSendTestAppriseHandler = async () => {
    clearError();
    setIsSendingTestNotification(true);
    try {
      const response = await fetch('/api/account/sendTestApprise', {
        method: 'POST',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify({ sendTestApprise: true }),
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
      console.log(error);
      handleError('Send notification failed. Contact your administrator.');
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
                {isSendingTestNotification ? (
                  <SpinnerCircularFixed
                    style={{ marginTop: '20px' }}
                    size={30}
                    thickness={150}
                    speed={150}
                    color='#704dff'
                    secondaryColor='#c3b6fa'
                  />
                ) : (
                  <button
                    style={{ marginTop: '20px' }}
                    className='defaultButton'
                    onClick={() => onSendTestAppriseHandler()}
                  >
                    Send a test notification
                  </button>
                )}
                {info && (
                  <span style={{ marginLeft: '10px', color: '#119300' }}>
                    Notification successfully sent.
                  </span>
                )}
              </>
            )}
            {error && <Error message={error} />}
          </div>
        </div>
      </div>
    </>
  );
}
