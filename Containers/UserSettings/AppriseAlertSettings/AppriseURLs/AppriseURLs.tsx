import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { AppriseServicesDTO, Optional } from '~/types';
import classes from '../../UserSettings.module.css';

//Components
import Error from '~/Components/UI/Error/Error';
import { useLoader } from '~/contexts/LoaderContext';
import { useFormStatus } from '~/hooks';

type AppriseURLsDataForm = {
  appriseURLs: string;
};

export default function AppriseURLs() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppriseURLsDataForm>({ mode: 'onBlur' });

  const { isSaved, error, handleSuccess, handleError, clearError } = useFormStatus();
  const { start, stop } = useLoader();

  const [appriseServicesList, setAppriseServicesList] = useState<Optional<string>>();
  const [fetchError, setFetchError] = useState<Optional<boolean>>();

  //Component did mount
  useEffect(() => {
    //Initial fetch to build the list of Apprise Services enabled
    const getAppriseServices = async () => {
      try {
        const response = await fetch('/api/v1/notif/apprise/services', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });

        const data: AppriseServicesDTO = await response.json();
        const servicesText = data.appriseServices?.join('\n');
        setAppriseServicesList(servicesText);
        setFetchError(false);
      } catch (error) {
        setFetchError(true);
        handleError('Fetching Apprise services list failed.');
      }
    };
    getAppriseServices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  //Form submit handler to modify Apprise services
  const urlsFormSubmitHandler = async (data: AppriseURLsDataForm) => {
    clearError();
    start();
    if (fetchError) {
      handleError('Cannot update Apprise services. Failed to fetch the initial list.');
      stop();
      return;
    }

    try {
      const response = await fetch('/api/v1/notif/apprise/services', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        handleError(result.message);
      } else {
        handleSuccess();
      }
    } catch (error) {
      handleError('Failed to update your Apprise services.');
    } finally {
      stop();
    }
  };

  return (
    <>
      {/* APPRISE SERVICES URLS */}
      <div className={classes.headerFormAppriseUrls}>
        <div style={{ marginRight: '10px' }}>Apprise URLs</div>
        <div style={{ display: 'flex' }}>
          {isSaved && (
            <div className={classes.formIsSavedMessage}>
              ✅ Apprise configuration has been saved.
            </div>
          )}
        </div>
      </div>
      <form
        onBlur={handleSubmit(urlsFormSubmitHandler)}
        className={classes.bwForm + ' ' + classes.currentSetting}
      >
        <textarea
          style={{ height: '100px' }}
          placeholder={
            'matrixs://{user}:{password}@{matrixhost}\ndiscord://{WebhookID}/{WebhookToken}\nmmosts://user@hostname/authkey'
          }
          defaultValue={appriseServicesList}
          {...register('appriseURLs', {
            pattern: {
              value: /^.+:\/\/.+$/gm,
              message: 'Invalid URLs format.',
            },
          })}
        />
        {errors.appriseURLs && (
          <small className={classes.errorMessage}>{errors.appriseURLs.message}</small>
        )}
      </form>
      <div
        style={{
          color: '#6c737f',
          fontSize: '0.875rem',
          marginBottom: '20px',
        }}
      >
        Use{' '}
        <a
          style={{
            color: '#6d4aff',
            textDecoration: 'none',
          }}
          href='https://github.com/caronc/apprise#supported-notifications'
          rel='noreferrer'
        >
          Apprise URLs
        </a>{' '}
        to send a notification to any service. Only one URL per line.
      </div>
      {error && <Error message={error} />}
    </>
  );
}
