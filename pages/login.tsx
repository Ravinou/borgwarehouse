import { getServerSession } from 'next-auth/next';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';
import { useFormStatus } from '~/hooks';
import { authOptions } from './api/v1/auth/[...nextauth]';

//Components
import { GetServerSidePropsContext } from 'next';
import Image from 'next/image';
import { ToastOptions, toast } from 'react-toastify';

type LoginForm = {
  username: string;
  password: string;
};

export default function Login() {
  const { status } = useSession();
  const { register, handleSubmit, reset, setFocus, watch } = useForm<LoginForm>();
  const router = useRouter();
  const toastOptions: ToastOptions = {
    position: 'top-center',
    autoClose: 5000,
    theme: 'dark',
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    style: {
      backgroundColor: '#212942',
      fontSize: '1.1rem',
    },
  };

  const { isLoading, setIsLoading, handleError, clearError } = useFormStatus();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  // Block the rendering of the component if the user is already connected or in the process of connecting.
  if (status === 'loading' || status === 'authenticated') {
    return;
  }

  const isFormComplete = watch('username') && watch('password');

  //Functions
  const formSubmitHandler = async (data: LoginForm) => {
    setIsLoading(true);
    clearError();
    const resultat = await signIn('credentials', {
      username: data.username,
      password: data.password,
      redirect: false,
    });

    if (resultat?.error) {
      setFocus('username');
      reset();
      toast.info('Incorrect credentials', toastOptions);
      handleError(resultat.error);
    } else {
      setIsLoading(false);
      router.replace('/');
    }
  };

  return (
    <div
      className='signInContainer'
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
            boxShadow: '0 14px 28px rgba(0, 0, 0, .2), 0 10px 10px rgba(0, 0, 0, .2)',
            height: '100%',
            borderTop: '10px solid #704dff',
            animation: 'ease-in 0.3s 1 normal none',
            width: '310px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
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
              marginBottom: '3.5em',
            }}
          >
            Sign in to your account.
          </h5>
          <form onSubmit={handleSubmit(formSubmitHandler)}>
            <p>
              <input
                type='text'
                placeholder='Username'
                className='signInInput'
                {...register('username', {
                  required: 'This field is required.',
                  pattern: {
                    value: /^[^\s]+$/g,
                    message: 'No space allowed.',
                  },
                })}
              />
            </p>
            <p>
              <input
                type='password'
                placeholder='Password'
                className='signInInput'
                {...register('password', {
                  required: 'This field is required.',
                })}
              />
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button className='signInButton' disabled={isLoading || !isFormComplete}>
                {isLoading ? (
                  <SpinnerDotted size={20} thickness={150} speed={100} color='#fff' />
                ) : (
                  'Sign in'
                )}
              </button>
            </div>
          </form>
        </main>
      </section>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  //Here, if I am connected, I redirect to the home page.
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  return {
    props: { session },
  };
}
