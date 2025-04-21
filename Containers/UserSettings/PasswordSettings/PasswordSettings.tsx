import { useForm } from 'react-hook-form';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormStatus } from '~/hooks';
import { PasswordSettingDTO } from '~/types';
import classes from '../UserSettings.module.css';

//Components
import { useLoader } from '~/contexts/LoaderContext';

export default function PasswordSettings() {
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
    formState: { isSubmitting },
  } = useForm<PasswordSettingDTO>({ mode: 'onChange' });
  const { start, stop } = useLoader();

  const { isLoading, setIsLoading } = useFormStatus();

  ////Functions
  const formSubmitHandler = async (data: PasswordSettingDTO) => {
    start();
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/account/password', {
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
        toast.success('🔑 Password edited !', toastOptions);
      }
    } catch (error) {
      toast.error('Failed to update password. Please try again.', toastOptions);
    } finally {
      stop();
      reset();
      setIsLoading(false);
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
              <p>
                <input
                  type='password'
                  placeholder='Current password'
                  {...register('oldPassword', {
                    required: true,
                  })}
                />
              </p>
              <p>
                <input
                  type='password'
                  placeholder='New password'
                  {...register('newPassword', {
                    required: true,
                  })}
                />
              </p>
              <button
                className={classes.AccountSettingsButton}
                disabled={isLoading || isSubmitting}
              >
                Update your password
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
