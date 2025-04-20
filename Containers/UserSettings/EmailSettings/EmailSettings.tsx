import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';

//Components
import Error from '~/Components/UI/Error/Error';
import Info from '~/Components/UI/Info/Info';
import { useFormStatus } from '~/hooks';
import { EmailSettingDTO } from '~/types/api/setting.types';

export default function EmailSettings(props: EmailSettingDTO) {
  const toastOptions: ToastOptions = {
    position: 'top-right',
    autoClose: 8000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
  };

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isValid },
  } = useForm<EmailSettingDTO>({ mode: 'onChange' });

  const { isLoading, error, setIsLoading, handleError, clearError } = useFormStatus();

  ////State
  const [info, setInfo] = useState(false);

  ////Functions
  const formSubmitHandler = async (data: EmailSettingDTO) => {
    clearError();
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/account/email', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        reset();
        handleError(result.message);
      } else {
        reset();
        setIsLoading(false);
        setInfo(true);
        toast.success('Email edited !', toastOptions);
      }
    } catch (error) {
      reset();
      handleError('Updating your email failed.');
    }
  };
  return (
    <>
      {/* EMAIL */}
      <div className={classes.containerSetting}>
        <div className={classes.settingCategory}>
          <h2>Email</h2>
        </div>
        <div className={classes.setting}>
          <div className={classes.bwFormWrapper}>
            {info ? ( //For local JWTs (cookie) without an OAuth provider, Next-Auth does not allow
              //at the time this code is written to refresh client-side session information
              //without triggering a logout.
              //I chose to inform the user to reconnect rather than force logout.
              <Info message='Please, logout to update your session.' />
            ) : (
              <form
                onSubmit={handleSubmit(formSubmitHandler)}
                className={classes.bwForm + ' ' + classes.currentSetting}
              >
                <p>
                  {error && <Error message={error} />}
                  <input
                    type='email'
                    placeholder={props.email}
                    {...register('email', {
                      required: true,
                      pattern: {
                        value:
                          /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                        message: 'Your email is not valid.',
                      },
                    })}
                  />
                  {errors.email && (
                    <small className={classes.errorMessage}>{errors.email.message}</small>
                  )}
                </p>
                <button
                  className={classes.AccountSettingsButton}
                  disabled={!isValid || isSubmitting}
                >
                  {isLoading ? (
                    <SpinnerDotted size={20} thickness={150} speed={100} color='#fff' />
                  ) : (
                    'Update your email'
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
