import { getSession } from '~/helpers/getServerSession';
import { authClient, useAuthSession } from '~/lib/auth-client';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useFormStatus } from '~/hooks';

//Components
import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next';
import Image from 'next/image';
import { ToastOptions, toast } from 'react-toastify';
import { useLoader } from '~/contexts/LoaderContext';
import {
  IconBrandGithub,
  IconBrandGoogle,
  IconBrandWindows,
  IconBrandGitlab,
  IconKey,
} from '@tabler/icons-react';

type LoginForm = {
  username: string;
  password: string;
};

type OAuthProvider = {
  id: string;
  name: string;
};

export default function Login({
  providers,
  passwordLoginEnabled,
}: InferGetServerSidePropsType<typeof getServerSideProps>) {
  const { status } = useAuthSession();
  const { register, handleSubmit, reset, setFocus } = useForm<LoginForm>();
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
  const { start, stop } = useLoader();

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
    start();
    setIsLoading(true);
    clearError();
    const resultat = await authClient.signIn.username({
      username: data.username,
      password: data.password,
    });

    if (resultat?.error) {
      stop();
      setFocus('username');
      reset();
      toast.info('Incorrect credentials', toastOptions);
      handleError(resultat.error.message ?? resultat.error.statusText ?? 'Unknown error');
    } else {
      stop();
      setIsLoading(false);
      router.replace('/');
    }
  };

  const [oauthLoading, setOauthLoading] = useState<string | null>(null);

  const handleOAuthSignIn = async (providerId: string) => {
    setOauthLoading(providerId);
    start();
    try {
      if (providerId === 'oidc') {
        await authClient.signIn.oauth2({
          providerId: 'oidc',
          callbackURL: '/',
          errorCallbackURL: '/login?error=oauth',
        });
      } else {
        await authClient.signIn.social({
          provider: providerId as 'github' | 'google' | 'microsoft' | 'gitlab',
          callbackURL: '/',
          errorCallbackURL: '/login?error=oauth',
        });
      }
    } catch {
      stop();
      setOauthLoading(null);
      toast.error('OAuth sign-in failed', toastOptions);
    }
  };

  const providerIcon: Record<string, React.ReactNode> = {
    github: <IconBrandGithub size={20} />,
    google: <IconBrandGoogle size={20} />,
    microsoft: <IconBrandWindows size={20} />,
    gitlab: <IconBrandGitlab size={20} />,
    oidc: <IconKey size={20} />,
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
          {passwordLoginEnabled && (
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
                <button className='signInButton' disabled={isLoading}>
                  Sign in
                </button>
              </div>
            </form>
          )}
          {providers && providers.length > 0 && (
            <>
              {passwordLoginEnabled && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    width: '100%',
                    margin: '1.5em 0',
                  }}
                >
                  <hr style={{ flex: 1, borderColor: '#3a3f55' }} />
                  <span style={{ padding: '0 10px', color: '#a1a4ad', fontSize: '0.85rem' }}>
                    or
                  </span>
                  <hr style={{ flex: 1, borderColor: '#3a3f55' }} />
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%' }}>
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    className='signInButton oauthButton'
                    onClick={() => handleOAuthSignIn(provider.id)}
                    disabled={oauthLoading !== null}
                    style={{ width: '100%', opacity: oauthLoading === provider.id ? 0.7 : 1 }}
                  >
                    {providerIcon[provider.id]}
                    {oauthLoading === provider.id
                      ? 'Redirecting...'
                      : `Sign in with ${provider.name}`}
                  </button>
                ))}
              </div>
            </>
          )}
          {router.query.error === 'oauth' && (
            <p
              style={{
                color: '#ff6b6b',
                marginTop: '1em',
                fontSize: '0.9rem',
                textAlign: 'center',
              }}
            >
              OAuth sign-in failed. Your email may not match any existing account.
            </p>
          )}
        </main>
      </section>
    </div>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  // First-run: redirect to setup only when users.json and SQLite are empty and lockfile does not exist
  const { isFirstRun } = await import('~/helpers/isFirstRun');
  if (await isFirstRun()) {
    return { redirect: { destination: '/setup', permanent: false } };
  }

  const session = await getSession(context.req, context.res);

  //Here, if I am connected, I redirect to the home page.
  if (session) {
    return {
      redirect: {
        destination: '/',
        permanent: false,
      },
    };
  }

  // Fetch enabled OAuth providers for the login page
  const { getEnabledProviders, isPasswordLoginEnabled } = await import('~/lib/auth');
  const providers = getEnabledProviders();

  return {
    props: { session, providers, passwordLoginEnabled: isPasswordLoginEnabled },
  };
}
