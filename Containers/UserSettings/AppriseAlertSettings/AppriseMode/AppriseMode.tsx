//Lib
import { useEffect } from 'react';
import classes from '../../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useForm } from 'react-hook-form';
import { AppriseModeEnum } from '~/types/domain/config.types';

//Components
import Error from '~/Components/UI/Error/Error';
import { Optional } from '~/types';
import { AppriseModeResponse } from '~/types/api/apprise-mode.types';
import { useFormStatus } from '~/hooks/useFormStatus';

type AppriseModeDataForm = {
  appriseMode: string;
  appriseStatelessURL: string;
};

export default function AppriseMode() {
  //Var
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AppriseModeDataForm>({ mode: 'onBlur' });

  const { isLoading, isSaved, error, setIsLoading, handleSuccess, handleError, clearError } =
    useFormStatus();

  ////State
  const [displayStatelessURL, setDisplayStatelessURL] = useState<boolean>(false);
  const [appriseMode, setAppriseMode] = useState<AppriseModeEnum>(AppriseModeEnum.STATELESS);
  const [appriseStatelessURL, setAppriseStatelessURL] = useState<Optional<string>>();

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

        const data: AppriseModeResponse = await response.json();
        const { appriseStatelessURL, appriseMode } = data;
        setAppriseMode(appriseMode);

        if (appriseMode == AppriseModeEnum.STATELESS) {
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
  const modeFormSubmitHandler = async (data: AppriseModeDataForm) => {
    clearError();
    setIsLoading(true);

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
        handleError(result.message);
      } else {
        handleSuccess();
      }
    } catch (error) {
      handleError('The Apprise mode change has failed');
    }
  };

  return (
    <>
      {/* APPRISE MODE SELECTION */}
      <div className={classes.headerFormAppriseUrls}>
        <div style={{ margin: '0px 10px 0px 0px' }}>Apprise mode</div>
        <div style={{ display: 'flex' }}>
          {isLoading && (
            <SpinnerCircularFixed
              size={18}
              thickness={150}
              speed={150}
              color='#704dff'
              secondaryColor='#c3b6fa'
            />
          )}
          {isSaved && (
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
                  setAppriseMode(AppriseModeEnum.PACKAGE);
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
                  setAppriseMode(AppriseModeEnum.STATELESS);
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
