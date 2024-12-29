//Lib
import { useEffect } from 'react';
import classes from '../../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useForm } from 'react-hook-form';

//Components
import Error from '../../../../Components/UI/Error/Error';

export default function AppriseMode() {
  //Var
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ mode: 'onBlur' });

  ////State
  const [formIsLoading, setFormIsLoading] = useState(false);
  const [modeFormIsSaved, setModeFormIsSaved] = useState(false);
  const [error, setError] = useState(false);
  const [displayStatelessURL, setDisplayStatelessURL] = useState(false);
  const [appriseMode, setAppriseMode] = useState('stateless');
  const [appriseStatelessURL, setAppriseStatelessURL] = useState();

  ////LifeCycle
  //Component did mount
  useEffect(() => {
    //Initial fetch to get Apprise Mode enabled
    const getAppriseMode = async () => {
      try {
        const response = await fetch('/api/account/getAppriseMode', {
          method: 'GET',
          headers: {
            'Content-type': 'application/json',
          },
        });
        const { appriseStatelessURL, appriseMode } = await response.json();
        setAppriseMode(appriseMode);
        if (appriseMode == 'stateless') {
          setAppriseStatelessURL(appriseStatelessURL);
          setDisplayStatelessURL(true);
        }
      } catch (error) {
        console.log('Fetching Apprise Mode failed.');
      }
    };
    getAppriseMode();
  }, []);

  ////Functions
  //Form submit handler to modify Apprise Mode
  const modeFormSubmitHandler = async (data) => {
    //Remove old error
    setError();
    //Loading button on submit to avoid multiple send.
    setFormIsLoading(true);
    //POST API to update Apprise Mode
    try {
      const response = await fetch('/api/account/updateAppriseMode', {
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
        setModeFormIsSaved(true);
        setTimeout(() => setModeFormIsSaved(false), 3000);
      }
    } catch (error) {
      setFormIsLoading(false);
      setError('Change mode failed. Contact your administrator.');
      setTimeout(() => {
        setError();
      }, 4000);
    }
  };

  return (
    <>
      {/* APPRISE MODE SELECTION */}
      <div className={classes.headerFormAppriseUrls}>
        <div style={{ margin: '0px 10px 0px 0px' }}>Apprise mode</div>
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
          {modeFormIsSaved && (
            <div className={classes.formIsSavedMessage}>✅ Apprise mode has been saved.</div>
          )}
        </div>
      </div>
      {error && <Error message={error} />}
      <form className={classes.bwForm} onBlur={handleSubmit(modeFormSubmitHandler)}>
        <div className='radio-group'>
          <label style={{ marginRight: '50px' }}>
            <div style={{ display: 'flex' }}>
              <input
                {...register('appriseMode')}
                type='radio'
                value='package'
                onClick={() => {
                  setDisplayStatelessURL(false);
                  setAppriseMode('package');
                }}
                checked={appriseMode == 'package' ? true : false}
              />
              <span>Local package</span>
            </div>
          </label>
          <label>
            <div style={{ display: 'flex' }}>
              <input
                {...register('appriseMode')}
                value='stateless'
                type='radio'
                onClick={() => {
                  setDisplayStatelessURL(true);
                  setAppriseMode('stateless');
                }}
                checked={appriseMode == 'stateless' ? true : false}
              />
              <span>Stateless API server</span>
            </div>
          </label>
        </div>
        {displayStatelessURL && (
          <input
            type='text'
            placeholder='http://localhost:8000'
            defaultValue={appriseStatelessURL}
            {...register('appriseStatelessURL', {
              pattern: {
                value: /^(http|https):\/\/.+/g,
                message: 'Invalid URL format.',
              },
            })}
          />
        )}
        {errors.appriseStatelessURL && (
          <small className={classes.errorMessage}>{errors.appriseStatelessURL.message}</small>
        )}
      </form>
    </>
  );
}
