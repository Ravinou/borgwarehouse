//Lib
import { useEffect } from 'react';
import classes from '../../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useForm } from 'react-hook-form';

//Components
import Error from '../../../../Components/UI/Error/Error';

export default function AppriseURLs() {
  //Var
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  ////State
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [urlsFormIsSaved, setUrlsFormIsSaved] = useState(false);
  const [appriseServicesList, setAppriseServicesList] = useState();
  const [error, setError] = useState();

  ////LifeCycle
  //Component did mount
  useEffect(() => {
    //Initial fetch to build the list of Apprise Services enabled
    const getAppriseServices = async () => {
      try {
        const response = await fetch('/api/account/getAppriseServices', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        let servicesArray = (await response.json()).appriseServices;
        const AppriseServicesListToText = () => {
          let list = '';
          for (let service of servicesArray) {
            list += service + '\n';
          }
          return list;
        };
        setAppriseServicesList(AppriseServicesListToText());
      } catch (error) {
        console.log('Fetching Apprise services list failed.');
      }
    };
    getAppriseServices();
  }, []);

  ////Functions
  //Form submit handler to modify Apprise services
  const urlsFormSubmitHandler = async (data) => {
    //Remove old error
    setError();
    //Loading button on submit to avoid multiple send.
    setFormIsLoading(true);
    //POST API to update Apprise Services
    try {
      const response = await fetch('/api/account/updateAppriseServices', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        setFormIsLoading(false);
        setError(result.message);
        setTimeout(() => setError(), 4000);
      } else {
        setFormIsLoading(false);
        setUrlsFormIsSaved(true);
        setTimeout(() => setUrlsFormIsSaved(false), 3000);
      }
    } catch (error) {
      setFormIsLoading(false);
      setError('Failed to update your services. Contact your administrator.');
      setTimeout(() => {
        setError();
      }, 4000);
    }
  };

  return (
    <>
      {/* APPRISE SERVICES URLS */}
      <div className={classes.headerFormAppriseUrls}>
        <div style={{ marginRight: '10px' }}>Apprise URLs</div>
        {error && <Error message={error} />}
        <div style={{ display: 'flex' }}>
          {formIsLoading && (
            <SpinnerCircularFixed
              size={18}
              thickness={150}
              speed={150}
              color='#704dff'
              secondaryColor='#c3b6fa'
            />
          )}
          {urlsFormIsSaved && (
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
          type='text'
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
    </>
  );
}
