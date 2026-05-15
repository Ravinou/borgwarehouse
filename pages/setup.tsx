import { GetServerSidePropsContext } from 'next';
import Image from 'next/image';
import { useRouter } from 'next/router';
import { useForm, useWatch } from 'react-hook-form';
import { toast, ToastOptions } from 'react-toastify';
import { useLoader } from '~/contexts/LoaderContext';
import { useFormStatus } from '~/hooks';

type SetupForm = {
  username: string;
  password: string;
  confirmPassword: string;
  secret?: string;
};

export default function Setup({ requiresSecret }: { requiresSecret: boolean }) {
  const router = useRouter();
  const { start, stop } = useLoader();
  const { isLoading, setIsLoading } = useFormStatus();

  const toastOptions: ToastOptions = {
    position: 'top-center',
    autoClose: 5000,
    theme: 'dark',
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    style: { backgroundColor: '#212942', fontSize: '1.1rem' },
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors, isSubmitting, isValid },
  } = useForm<SetupForm>({ mode: 'onChange' });

  const password = useWatch({ control, name: 'password' });

  const formSubmitHandler = async (data: SetupForm) => {
    start();
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/setup', {
        method: 'POST',
        headers: { 'Content-type': 'application/json' },
        body: JSON.stringify({ username: data.username, password: data.password, secret: data.secret }),
      });
      const result = await response.json();

      if (!response.ok) {
        toast.error(result.message, toastOptions);
      } else {
        toast.success('Account created! You can now sign in.', toastOptions);
        setTimeout(() => router.replace('/login'), 1500);
      }
    } catch {
      toast.error('Setup failed. Please try again.', toastOptions);
    } finally {
      stop();
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
      }}
    >
      <section style={{ display: 'flex', justifyContent: 'center' }}>
        <main
          style={{
            backgroundColor: '#212942',
            padding: '30px',
            borderRadius: '10px',
            boxShadow: '0 14px 28px rgba(0,0,0,.2), 0 10px 10px rgba(0,0,0,.2)',
            borderTop: '10px solid #704dff',
            width: '340px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Image
            src='/borgwarehouse-logo-violet.svg'
            alt='BorgWarehouse'
            width={225}
            height={40}
            priority
          />
          <h5
            style={{
              color: '#a1a4ad',
              letterSpacing: '1.5px',
              textAlign: 'center',
              marginBottom: '0.5em',
            }}
          >
            Welcome to BorgWarehouse
          </h5>
          <p
            style={{
              color: '#6d7a9a',
              fontSize: '0.85em',
              textAlign: 'center',
              marginBottom: '2em',
            }}
          >
            Create your admin account to get started.
          </p>
          <form onSubmit={handleSubmit(formSubmitHandler)} style={{ width: '100%' }}>
            <p>
              <input
                type='text'
                placeholder='Username (a-z only)'
                className='signInInput'
                {...register('username', {
                  required: 'Username is required.',
                  pattern: {
                    value: /^[a-z]{1,40}$/,
                    message: 'Only lowercase a-z, 1–40 characters.',
                  },
                })}
              />
              {errors.username && (
                <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>
                  {errors.username.message}
                </small>
              )}
            </p>
            <p>
              <input
                type='password'
                placeholder='Password (8 characters min.)'
                className='signInInput'
                {...register('password', {
                  required: 'Password is required.',
                  minLength: { value: 8, message: 'Minimum 8 characters.' },
                })}
              />
              {errors.password && (
                <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>
                  {errors.password.message}
                </small>
              )}
            </p>
            <p>
              <input
                type='password'
                placeholder='Confirm password'
                className='signInInput'
                {...register('confirmPassword', {
                  required: 'Please confirm your password.',
                  validate: (value) => value === password || 'Passwords do not match.',
                })}
              />
              {errors.confirmPassword && (
                <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>
                  {errors.confirmPassword.message}
                </small>
              )}
            </p>
            {requiresSecret && (
              <p>
                <input
                  type='password'
                  placeholder='Setup secret'
                  className='signInInput'
                  {...register('secret', {
                    required: 'Setup secret is required.',
                  })}
                />
                {errors.secret && (
                  <small style={{ color: '#ff6b6b', display: 'block', marginTop: '4px' }}>
                    {errors.secret.message}
                  </small>
                )}
              </p>
            )}
            <div style={{ display: 'flex', justifyContent: 'center' }}>
              <button
                className='signInButton'
                disabled={isLoading || isSubmitting || !isValid}
              >
                Create admin account
              </button>
            </div>
          </form>
        </main>
      </section>
    </div>
  );
}

export async function getServerSideProps(_context: GetServerSidePropsContext) {
  const { isFirstRun } = await import('~/helpers/isFirstRun');
  if (!(await isFirstRun())) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return {
    props: {
      requiresSecret: !!process.env.SETUP_SECRET,
    },
  };
}
