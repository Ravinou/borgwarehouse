//Lib
import Head from 'next/head';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import { SpinnerDotted } from 'spinners-react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useSession } from 'next-auth/react';
import { authOptions } from '../../pages/api/auth/[...nextauth]';
import { unstable_getServerSession } from 'next-auth/next';

//Components
import Error from '../../Components/UI/Error/Error';
import UserSettings from '../../Containers/UserSettings/UserSettings';

export default function Account() {
    ////Var
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm();
    const { status, data } = useSession();

    ////State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    ////Functions
    //Form submit Handler for ADD a repo
    const formSubmitHandler = async (data) => {
        //Remove old error
        setError();
        //Loading button on submit to avoid multiple send.
        setIsLoading(true);
        //POST API to send the new and old password
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
            toast.success('🔑 Password edited !', {
                position: 'top-right',
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        }
    };

    return (
        <>
            <Head>
                <title>Account - BorgWarehouse</title>
            </Head>
            <UserSettings />
            <div
                style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                }}
            >
                <div>
                    <h1 style={{ color: '#494b7a', textAlign: 'center' }}>
                        Welcome {status === 'authenticated' && data.user.name}{' '}
                        👋
                    </h1>
                </div>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        margin: '15px 0 0 0 ',
                        width: 'auto',
                    }}
                >
                    <section
                        style={{ display: 'flex', justifyContent: 'center' }}
                    >
                        <main
                            style={{
                                backgroundColor: '#212942',
                                padding: '30px',
                                borderRadius: '10px',
                                boxShadow:
                                    '0 14px 28px rgba(0, 0, 0, .2), 0 10px 10px rgba(0, 0, 0, .2)',
                                height: '100%',
                                borderTop: '10px solid #704dff',
                                animation: 'ease-in 0.3s 1 normal none',
                                width: '360px',
                            }}
                        >
                            <h1
                                style={{
                                    color: '#a1a4ad',
                                    letterSpacing: '1.5px',
                                    textAlign: 'center',
                                    marginBottom: '2.5em',
                                }}
                            >
                                Change your password
                            </h1>
                            {error && <Error message={error} />}
                            <form onSubmit={handleSubmit(formSubmitHandler)}>
                                <p>
                                    <input
                                        type='password'
                                        placeholder='Actual password'
                                        className='signInInput'
                                        {...register('oldPassword', {
                                            required: true,
                                        })}
                                    />
                                    {errors.oldPassword &&
                                        errors.oldPassword.type ===
                                            'required' && (
                                            <small
                                                style={{
                                                    color: 'red',
                                                    display: 'block',
                                                    marginTop: '3px',
                                                }}
                                            >
                                                This field is required.
                                            </small>
                                        )}
                                </p>
                                <p>
                                    <input
                                        type='password'
                                        placeholder='New password'
                                        className='signInInput'
                                        {...register('newPassword', {
                                            required: true,
                                        })}
                                    />
                                    {errors.newPassword && (
                                        <small
                                            style={{
                                                color: 'red',
                                                display: 'block',
                                                marginTop: '3px',
                                            }}
                                        >
                                            This field is required.
                                        </small>
                                    )}
                                </p>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'center',
                                    }}
                                >
                                    <button
                                        className='signInButton'
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <SpinnerDotted
                                                size={20}
                                                thickness={150}
                                                speed={100}
                                                color='#fff'
                                            />
                                        ) : (
                                            'Update your password'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </main>
                    </section>
                </div>
            </div>
        </>
    );
}

export async function getServerSideProps(context) {
    //Var
    const session = await unstable_getServerSession(
        context.req,
        context.res,
        authOptions
    );

    if (!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        };
    }

    return {
        props: {},
    };
}
