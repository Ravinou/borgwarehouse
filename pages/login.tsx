import { getServerSession } from 'next-auth/next';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';
import { useFormStatus } from '~/hooks';
import { authOptions } from './api/auth/[...nextauth]';

//Components
import { GetServerSidePropsContext } from 'next';
import Error from '../Components/UI/Error/Error';

type LoginForm = {
  username: string;
  password: string;
};

export default function Login() {
  const { status } = useSession();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LoginForm>();
  const router = useRouter();

  const { isLoading, error, setIsLoading, handleError, clearError } = useFormStatus();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/');
    }
  }, [status, router]);

  // Block the rendering of the component if the user is already connected or in the process of connecting.
  if (status === 'loading' || status === 'authenticated') {
    return;
  }

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
      reset();
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
          }}
        >
          <h1
            style={{
              fontSize: '1.8em',
              fontWeight: 'bold',
              color: '#6d4aff',
              textShadow: '#6d4aff 0px 0px 18px',
              textAlign: 'center',
            }}
          >
            BorgWarehouse
          </h1>
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
          {error && <Error message={error} />}
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
              {errors.username && (
                <small
                  style={{
                    color: 'red',
                    display: 'block',
                    marginTop: '3px',
                  }}
                >
                  {errors.username.message}
                </small>
              )}
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
              {errors.password && (
                <small
                  style={{
                    color: 'red',
                    display: 'block',
                    marginTop: '3px',
                  }}
                >
                  {errors.password.message}
                </small>
              )}
            </p>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <button className='signInButton' disabled={isLoading}>
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
