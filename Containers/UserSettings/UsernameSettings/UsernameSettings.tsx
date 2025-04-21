import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormStatus } from '~/hooks';
import { UsernameSettingDTO } from '~/types';
import classes from '../UserSettings.module.css';

//Components
import Info from '~/Components/UI/Info/Info';
import { useLoader } from '~/contexts/LoaderContext';

export default function UsernameSettings(props: UsernameSettingDTO) {
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
    formState: { errors, isSubmitting },
  } = useForm<UsernameSettingDTO>({ mode: 'onChange' });
  const { start, stop } = useLoader();

  const { isLoading, setIsLoading } = useFormStatus();

  ////State
  const [info, setInfo] = useState(false);

  ////Functions
  const formSubmitHandler = async (data: UsernameSettingDTO) => {
    start();
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/account/username', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message, toastOptions);
      } else {
        setInfo(true);
        toast.success('Username edited !', toastOptions);
      }
    } catch (error) {
      toast.error('Failed to update username. Please try again.', toastOptions);
    } finally {
      reset();
      stop();
      setIsLoading(false);
    }
  };
  return (
    <>
      {/* Username */}
      <div className={classes.containerSetting}>
        <div className={classes.settingCategory}>
          <h2>Username</h2>
        </div>
        <div className={classes.setting}>
          <div className={classes.bwFormWrapper}>
            {info ? (
              //For local JWTs (cookie) without an OAuth provider, Next-Auth does not allow
              //at the time this code is written to refresh client-side session information
              //without triggering a logout.
              //I chose to inform the user to reconnect rather than force logout.
              <Info message='Please, logout to update your session' />
            ) : (
              <form
                onSubmit={handleSubmit(formSubmitHandler)}
                className={classes.bwForm + ' ' + classes.currentSetting}
              >
                <p>
                  <input
                    type='text'
                    placeholder={props.username}
                    {...register('username', {
                      required: 'A username is required.',
                      pattern: {
                        value: /^[a-z]{5,15}$/,
                        message: 'Only a-z characters are allowed',
                      },
                      maxLength: {
                        value: 10,
                        message: '15 characters max.',
                      },
                      minLength: {
                        value: 5,
                        message: '5 characters min.',
                      },
                    })}
                  />
                  {errors.username && (
                    <small className={classes.errorMessage}>{errors.username.message}</small>
                  )}
                </p>
                <button
                  className={classes.AccountSettingsButton}
                  disabled={isLoading || isSubmitting}
                >
                  Update your username
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
