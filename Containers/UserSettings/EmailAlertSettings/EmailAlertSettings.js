//Lib
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerCircularFixed } from 'spinners-react';
import { IconExternalLink } from '@tabler/icons-react';
import Link from 'next/link';

//Components
import Error from '../../../Components/UI/Error/Error';
import Switch from '../../../Components/UI/Switch/Switch';

export default function EmailAlertSettings() {
  //Var
  const toastOptions = {
    position: 'top-right',
    autoClose: 5000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    //Callback > re-enabled button after notification.
    onClose: () => setDisabled(false),
  };

  ////State
  const [isLoading, setIsLoading] = useState(true);
  const [testIsLoading, setTestIsLoading] = useState(false);
  const [error, setError] = useState();
  const [disabled, setDisabled] = useState(false);
  const [checked, setChecked] = useState();
  const [info, setInfo] = useState(false);

  ////LifeCycle
  //Component did mount
  useEffect(() => {
    const dataFetch = async () => {
      try {
        const response = await fetch('/api/account/getEmailAlert', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        setChecked((await response.json()).emailAlert);
        setIsLoading(false);
      } catch (error) {
        setError('Fetching email alert setting failed. Contact your administrator.');
        console.log('Fetching email alert setting failed.');
        setIsLoading(false);
      }
    };
    dataFetch();
  }, []);

  ////Functions
  //Switch to enable/disable Email notifications
  const onChangeSwitchHandler = async (data) => {
    //Remove old error
    setError();
    //Disabled button
    setDisabled(true);
    await fetch('/api/account/updateEmailAlert', {
      method: 'PUT',
      headers: {
        'Content-type': 'application/json',
      },
      body: JSON.stringify(data),
    })
      .then((response) => {
        console.log(response);
        if (response.ok) {
          if (data.emailAlert) {
            setChecked(!checked);
            toast.success('Email notification enabled !', toastOptions);
          } else {
            setChecked(!checked);
            toast.success('Email notification disabled !', toastOptions);
          }
        } else {
          setError('Update email alert setting failed.');
          setTimeout(() => {
            setError();
            setDisabled(false);
          }, 4000);
        }
      })
      .catch((error) => {
        console.log(error);
        setError('Update failed. Contact your administrator.');
        setTimeout(() => {
          setError();
          setDisabled(false);
        }, 4000);
      });
  };

  //Send a test notification by email
  const onSendTestMailHandler = async () => {
    //Loading
    setTestIsLoading(true);
    //Remove old error
    setError();
    await fetch('/api/account/sendTestEmail', {
      method: 'POST',
    })
      .then((response) => {
        if (!response.ok) {
          setTestIsLoading(false);
          response
            .json()
            .then((data) => {
              setError(data.message || 'Failed to send the notification.');
            })
            .catch(() => {
              setError('Failed to send the notification.');
            });
          setTimeout(() => {
            setError();
          }, 10000);
        } else {
          setTestIsLoading(false);
          setInfo(true);
          setTimeout(() => {
            setInfo(false);
          }, 4000);
        }
      })
      .catch((error) => {
        setTestIsLoading(false);
        setError('Send email failed. Contact your administrator.');
        setTimeout(() => {
          setError();
        }, 4000);
      });
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
            {isLoading ? (
              <SpinnerCircularFixed
                size={30}
                thickness={150}
                speed={150}
                color='#704dff'
                secondaryColor='#c3b6fa'
              />
            ) : (
              <Switch
                checked={checked}
                disabled={disabled}
                switchName='Alert me by email'
                switchDescription='You will receive an alert every 24H if you have a down status.'
                onChange={(e) => onChangeSwitchHandler({ emailAlert: e })}
              />
            )}
            {testIsLoading ? (
              <SpinnerCircularFixed
                size={30}
                thickness={150}
                speed={150}
                color='#704dff'
                secondaryColor='#c3b6fa'
              />
            ) : (
              <button className='defaultButton' onClick={onSendTestMailHandler}>
                Send a test mail
              </button>
            )}
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
