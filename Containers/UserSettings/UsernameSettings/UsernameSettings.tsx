import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useFormStatus } from '~/hooks';
import { UsernameSettingDTO } from '~/types';
import classes from '../UserSettings.module.css';
import { useAuthSession } from '~/lib/auth-client';

//Components
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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<UsernameSettingDTO>({ mode: 'onChange', defaultValues: { username: props.username } });
  const { start, stop } = useLoader();
  const { refetch: refetchSession, data: session } = useAuthSession();

  const { isLoading, setIsLoading } = useFormStatus();

  // Sync input when session refreshes after a successful save
  useEffect(() => {
    if (session?.user?.name) {
      reset({ username: session.user.name });
    }
  }, [session?.user?.name, reset]);

  ////Functions
  const formSubmitHandler = async (data: UsernameSettingDTO) => {
    start();
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/account/username', {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message, toastOptions);
      } else {
        toast.success('Username updated!', toastOptions);
        await refetchSession();
      }
    } catch (error) {
      toast.error('Failed to update username. Please try again.', toastOptions);
    } finally {
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
            <form onSubmit={handleSubmit(formSubmitHandler)} className={classes.bwForm}>
              <p>
                <input
                  type='text'
                  {...register('username', {
                    required: 'A username is required.',
                    pattern: {
                      value: /^[a-z]{1,40}$/,
                      message: 'Only a-z characters are allowed',
                    },
                    maxLength: { value: 40, message: '40 characters max.' },
                    minLength: { value: 1, message: '1 characters min.' },
                  })}
                />
                {errors.username && (
                  <small className={classes.errorMessage}>{errors.username.message}</small>
                )}
              </p>
              <button
                className={classes.AccountSettingsButton}
                disabled={isLoading || isSubmitting || !isDirty}
              >
                Update username
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
