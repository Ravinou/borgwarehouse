import { useEffect, useState } from 'react';
import { IconSend } from '@tabler/icons-react';
import { useForm } from 'react-hook-form';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useLoader } from '~/contexts/LoaderContext';
import { Optional, WebhookURLDTO } from '~/types';
import classes from '../UserSettings.module.css';

//Components
import Error from '~/Components/UI/Error/Error';
import Switch from '~/Components/UI/Switch/Switch';
import { useFormStatus } from '~/hooks';

type WebhookAlertDataForm = {
  webhookAlert: boolean;
};

export default function WebhookAlertSettings() {
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
  const { error, handleError, clearError, isSaved, handleSuccess } = useFormStatus();

  const [isSwitchDisabled, setIsSwitchDisabled] = useState(true);
  const [isAlertEnabled, setIsAlertEnabled] = useState<Optional<boolean>>(undefined);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testInfo, setTestInfo] = useState(false);
  const [savedWebhookURL, setSavedWebhookURL] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<WebhookURLDTO>({ mode: 'onBlur' });

  useEffect(() => {
    const fetchAlert = async () => {
      try {
        const res = await fetch('/api/v1/notif/webhook/alert');
        const data = await res.json();
        setIsAlertEnabled(data.webhookAlert ?? false);
        setIsSwitchDisabled(false);
      } catch {
        setIsSwitchDisabled(true);
        setIsAlertEnabled(false);
        toast.error('Fetching webhook alert setting failed', toastOptions);
      }
    };

    const fetchURL = async () => {
      try {
        const res = await fetch('/api/v1/notif/webhook/url');
        const data: WebhookURLDTO = await res.json();
        reset({ webhookURL: data.webhookURL ?? '', webhookSecret: data.webhookSecret ?? '' });
        setSavedWebhookURL(data.webhookURL ?? '');
      } catch {
        // keep empty defaults
      }
    };

    fetchAlert();
    fetchURL();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onChangeSwitchHandler = async (data: WebhookAlertDataForm) => {
    start();
    setIsSwitchDisabled(true);
    try {
      const res = await fetch('/api/v1/notif/webhook/alert', {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok && typeof data.webhookAlert === 'boolean') {
        setIsAlertEnabled(data.webhookAlert);
        toast.success(
          data.webhookAlert ? 'Webhook notifications enabled' : 'Webhook notifications disabled',
          toastOptions
        );
      } else {
        toast.error('Update webhook alert failed', toastOptions);
      }
    } catch {
      toast.error('Update webhook alert failed', toastOptions);
    } finally {
      stop();
      setIsSwitchDisabled(false);
    }
  };

  const urlFormSubmitHandler = async (data: WebhookURLDTO) => {
    clearError();
    start();
    try {
      const res = await fetch('/api/v1/notif/webhook/url', {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (!res.ok) {
        handleError(result.message);
      } else {
        handleSuccess();
        setSavedWebhookURL(data.webhookURL ?? '');
        reset({}, { keepValues: true });
      }
    } catch {
      handleError('Failed to save webhook configuration.');
    } finally {
      stop();
    }
  };

  const onSendTestHandler = async () => {
    start();
    setIsSendingTest(true);
    try {
      const res = await fetch('/api/v1/notif/webhook/test', { method: 'POST' });
      const result = await res.json();
      if (!res.ok) {
        toast.error(result.message, toastOptions);
      } else {
        setTestInfo(true);
        setTimeout(() => setTestInfo(false), 4000);
      }
    } catch {
      toast.error('Sending test webhook failed', toastOptions);
    } finally {
      stop();
      setIsSendingTest(false);
    }
  };

  return (
    <div className={classes.containerSetting}>
      <div className={classes.settingCategory}>
        <h2 style={{ alignSelf: 'baseline' }}>Webhook alert</h2>
      </div>
      <div className={classes.setting}>
        <div className={classes.bwFormWrapper}>
          <Switch
            loading={isAlertEnabled === undefined}
            checked={isAlertEnabled}
            disabled={isSwitchDisabled}
            switchName='Enable webhook notifications'
            switchDescription='A POST request will be sent to your endpoint every 24H if you have a down status.'
            onChange={(e) => onChangeSwitchHandler({ webhookAlert: e })}
          />
          {isAlertEnabled && (
            <>
              <form
                onBlur={() => {
                  if (isDirty) handleSubmit(urlFormSubmitHandler)();
                }}
                className={classes.bwForm + ' ' + classes.currentSetting}
              >
                <p>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Webhook URL
                  </label>
                  <input
                    type='text'
                    placeholder='https://your-endpoint.example.com/hook'
                    {...register('webhookURL', {
                      validate: (v) => {
                        if (!v) return true;
                        try {
                          new URL(v);
                          return true;
                        } catch {
                          return 'Invalid URL.';
                        }
                      },
                    })}
                  />
                  {errors.webhookURL && (
                    <small className={classes.errorMessage}>{errors.webhookURL.message}</small>
                  )}
                </p>
                <p>
                  <label style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                    Secret{' '}
                    <span style={{ fontWeight: 'normal', color: 'var(--text-faint)' }}>
                      (optional)
                    </span>
                  </label>
                  <input
                    type='password'
                    placeholder='Sent as X-BorgWarehouse-Secret header'
                    {...register('webhookSecret')}
                  />
                </p>
                <div style={{ minHeight: '24px' }}>
                  {isSaved && (
                    <div className={classes.formIsSavedMessage}>
                      ✅ Webhook configuration saved.
                    </div>
                  )}
                  {error && <Error message={error} />}
                </div>
              </form>
              <button
                className='defaultButton'
                disabled={isSendingTest || !savedWebhookURL}
                onClick={onSendTestHandler}
                style={{
                  marginTop: '10px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <IconSend size={18} stroke={1.75} />
                Send a test webhook
              </button>
              {testInfo && (
                <span style={{ marginLeft: '10px', color: 'var(--success-text)' }}>
                  Test webhook sent successfully.
                </span>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
