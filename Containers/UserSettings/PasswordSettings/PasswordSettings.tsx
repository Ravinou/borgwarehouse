//Lib
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';

//Components
import Error from '../../../Components/UI/Error/Error';

export default function PasswordSettings(props) {
  //Var
  const toastOptions = {
    position: 'top-right',
    autoClose: 5000,
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

  ////Functions
  //Form submit Handler for ADD a repo
  const formSubmitHandler = async (data) => {
    console.log(data);
    //Remove old error
    setError();
    //Loading button on submit to avoid multiple send.
    setIsLoading(true);
    //POST API to send the new and old password
    try {
      const response = await fetch('/api/account/updatePassword', {
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
        toast.success('🔑 Password edited !', toastOptions);
      }
    } catch (error) {
      reset();
      setIsLoading(false);
      setError("Can't update your password. Contact your administrator.");
      setTimeout(() => setError(), 4000);
    }
  };
  return (
    <>
      {/* PASSWORD */}
      <div className={classes.containerSetting}>
        <div className={classes.settingCategory}>
          <h2>Password</h2>
        </div>
        <div className={classes.setting}>
          <div className={classes.bwFormWrapper}>
            <form onSubmit={handleSubmit(formSubmitHandler)} className={classes.bwForm}>
              {error && <Error message={error} />}
              <p>
                <input
                  type='password'
                  placeholder='Current password'
                  {...register('oldPassword', {
                    required: true,
                  })}
                />
                {errors.oldPassword && errors.oldPassword.type === 'required' && (
                  <small className={classes.errorMessage}>This field is required.</small>
                )}
              </p>
              <p>
                <input
                  type='password'
                  placeholder='New password'
                  {...register('newPassword', {
                    required: true,
                  })}
                />
                {errors.newPassword && (
                  <small className={classes.errorMessage}>This field is required.</small>
                )}
              </p>
              <button className={classes.AccountSettingsButton} disabled={!isValid || isSubmitting}>
                {isLoading ? (
                  <SpinnerDotted size={20} thickness={150} speed={100} color='#fff' />
                ) : (
                  'Update your password'
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
