import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast, ToastOptions } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useAuthSession } from '~/lib/auth-client';

//Components
import Error from '~/Components/UI/Error/Error';
import { useLoader } from '~/contexts/LoaderContext';
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
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EmailSettingDTO>({ mode: 'onChange', defaultValues: { email: props.email } });

  const { isLoading, error, setIsLoading, handleError, clearError } = useFormStatus();
  const { start, stop } = useLoader();
  const { refetch: refetchSession, data: session } = useAuthSession();

  // Sync input when session refreshes after a successful save
  useEffect(() => {
    if (session?.user?.email) {
      reset({ email: session.user.email });
    }
  }, [session?.user?.email, reset]);

  ////Functions
  const formSubmitHandler = async (data: EmailSettingDTO) => {
    start();
    clearError();
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/account/email', {
        method: 'PUT',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (!response.ok) {
        handleError(result.message);
      } else {
        toast.success('Email updated!', toastOptions);
        await refetchSession();
      }
    } catch (error) {
      handleError('Updating your email failed.');
    } finally {
      stop();
      setIsLoading(false);
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
            <form onSubmit={handleSubmit(formSubmitHandler)} className={classes.bwForm}>
              <p>
                {error && <Error message={error} />}
                <input
                  type='email'
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
                disabled={isSubmitting || isLoading || !isDirty}
              >
                Update email
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
