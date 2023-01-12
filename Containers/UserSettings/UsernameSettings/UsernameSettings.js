//Lib
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { SpinnerDotted } from 'spinners-react';

//Components
import Error from '../../../Components/UI/Error/Error';

export default function UsernameSettings(props) {
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
        control,
        formState: { errors, isSubmitting, isValid },
    } = useForm({ mode: 'onChange' });

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
        const response = await fetch('/api/account/updateUsername', {
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
            toast.success('Email edited !', {
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
            {/* Username */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Username</h2>
                </div>
                <div className={classes.setting}>
                    <div className={classes.bwFormWrapper}>
                        <form
                            onSubmit={handleSubmit(formSubmitHandler)}
                            className={classes.bwForm}
                        >
                            <p>
                                {error && <Error message={error} />}
                                <input
                                    type='email'
                                    placeholder={props.username}
                                    {...register('email', {
                                        required: true,
                                    })}
                                />
                                {errors.email &&
                                    errors.email.type === 'required' && (
                                        <small className={classes.errorMessage}>
                                            This field is required.
                                        </small>
                                    )}
                            </p>
                            <button
                                className='defaultButton'
                                disabled={!isValid || isSubmitting}
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
        </>
    );
}
