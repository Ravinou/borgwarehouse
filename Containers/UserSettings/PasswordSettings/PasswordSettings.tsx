//Lib
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';

//Components
import Error from '~/Components/UI/Error/Error';
import { useFormStatus } from '~/hooks/useFormStatus';
import { PasswordSettingDTO } from '~/types/api/settings.types';

export default function PasswordSettings() {
  //Var
  const toastOptions: ToastOptions = {
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
  } = useForm<PasswordSettingDTO>({ mode: 'onChange' });

  const { isLoading, error, setIsLoading, handleError, clearError } = useFormStatus();

  ////Functions
  const formSubmitHandler = async (data: PasswordSettingDTO) => {
    clearError();
    setIsLoading(true);

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
        handleError(result.message);
      } else {
        reset();
        setIsLoading(false);
        toast.success('🔑 Password edited !', toastOptions);
      }
    } catch (error) {
      reset();
      setIsLoading(false);
      handleError('Failed to update password. Please try again.');
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
