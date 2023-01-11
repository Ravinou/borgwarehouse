//Lib
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from './UserSettings.module.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';

//Components

export default function UserSettings(props) {
    //Var
    const toastOptions = {
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
        formState: { errors },
        reset,
    } = useForm();

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
        <div className={classes.containerSettings}>
            <div>
                <h1 style={{ color: '#494b7a', textAlign: 'center' }}>
                    Welcome{' '}
                    {props.status === 'authenticated' && props.data.user.name}{' '}
                    👋
                </h1>
            </div>

            {/* PASSWORD */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Password</h2>
                </div>
                <div className={classes.setting}>
                    {error && <Error message={error} />}
                    <div className={classes.bwFormWrapper}>
                        <form
                            onSubmit={handleSubmit(formSubmitHandler)}
                            className={classes.bwForm}
                        >
                            <input
                                type='password'
                                placeholder='Actual password'
                                {...register('oldPassword', {
                                    required: true,
                                })}
                            />
                            {errors.oldPassword &&
                                errors.oldPassword.type === 'required' && (
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
                            <p>
                                <input
                                    type='password'
                                    placeholder='New password'
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
                            <button
                                className='defaultButton'
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
                                    'Update your email'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            {/* USERNAME */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Username</h2>
                </div>
                <div className={classes.setting}>
                    {error && <Error message={error} />}
                    <div className={classes.bwFormWrapper}>
                        <form
                            onSubmit={handleSubmit(formSubmitHandler)}
                            className={classes.bwForm}
                        >
                            <p>
                                <input
                                    type='username'
                                    defaultValue={props.data.user.name}
                                    {...register('username', {
                                        required: true,
                                    })}
                                />
                                {errors.email &&
                                    errors.email.type === 'required' && (
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
                            <button
                                className='defaultButton'
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
                                    'Update your username'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
            {/* EMAIL */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Email</h2>
                </div>
                <div className={classes.setting}>
                    {error && <Error message={error} />}
                    <div className={classes.bwFormWrapper}>
                        <form
                            onSubmit={handleSubmit(formSubmitHandler)}
                            className={classes.bwForm}
                        >
                            <p>
                                <input
                                    type='email'
                                    defaultValue={props.data.user.email}
                                    {...register('email', {
                                        required: true,
                                    })}
                                />
                                {errors.email &&
                                    errors.email.type === 'required' && (
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
                            <button
                                className='defaultButton'
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
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
