//Lib
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';

//Components
import Error from '../../../Components/UI/Error/Error';
import Info from '../../../Components/UI/Info/Info';

export default function UsernameSettings(props) {
  //Var
  const toastOptions = {
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
  } = useForm({ mode: 'onChange' });

  ////State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState();
  const [info, setInfo] = useState(false);

  ////Functions
  //Form submit Handler for ADD a repo
  const formSubmitHandler = async (data) => {
    //Remove old error
    setError();
    //Loading button on submit to avoid multiple send.
    setIsLoading(true);
    //POST API to update the username
    try {
      const response = await fetch('/api/account/updateUsername', {
        method: 'PUT',
        headers: {
          'Content-type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        setIsLoading(false);
        reset();
        setError(result.message);
        setTimeout(() => setError(), 4000);
      } else {
        reset();
        setIsLoading(false);
        setInfo(true);
        toast.success('Username edited !', toastOptions);
      }
    } catch (error) {
      reset();
      setIsLoading(false);
      setError("Can't update your username. Contact your administrator.");
      setTimeout(() => setError(), 4000);
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
              <Info message='Please, logout to update your session.' />
            ) : (
              <form
                onSubmit={handleSubmit(formSubmitHandler)}
                className={classes.bwForm + ' ' + classes.currentSetting}
              >
                <p>
                  {error && <Error message={error} />}
                  <input
                    type='text'
                    placeholder={props.username}
                    {...register('username', {
                      required: 'A username is required.',
                      pattern: {
                        value: /^[a-z]{5,15}$/,
                        message: 'Only a-z characters are allowed.',
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
                  disabled={!isValid || isSubmitting}
                >
                  {isLoading ? (
                    <SpinnerDotted size={20} thickness={150} speed={100} color='#fff' />
                  ) : (
                    'Update your username'
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
