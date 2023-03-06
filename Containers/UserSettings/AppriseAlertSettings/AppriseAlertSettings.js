//Lib
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerCircularFixed } from 'spinners-react';
import { useForm } from 'react-hook-form';

//Components
import Error from '../../../Components/UI/Error/Error';
import Switch from '../../../Components/UI/Switch/Switch';

export default function AppriseAlertSettings() {
    //Var
    const toastOptions = {
        position: 'top-right',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        //Callback > re-enabled button after notification.
        onClose: () => setDisabled(false),
    };
    let appriseURLs;

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting, isValid },
    } = useForm({ mode: 'onBlur' });

    ////State
    const [checkIsLoading, setCheckIsLoading] = useState(true);
    const [testIsLoading, setTestIsLoading] = useState(false);
    const [formIsLoading, setFormIsLoading] = useState(false);
    const [formIsSaved, setFormIsSaved] = useState(false);
    const [error, setError] = useState();
    const [disabled, setDisabled] = useState(false);
    const [checked, setChecked] = useState();
    const [info, setInfo] = useState(false);
    const [appriseServicesList, setAppriseServicesList] = useState();

    ////LifeCycle
    //Component did mount
    useEffect(() => {
        //Initial fetch to get the status of Apprise Alert
        const getAppriseAlert = async () => {
            try {
                const response = await fetch('/api/account/getAppriseAlert', {
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    },
                });
                setChecked((await response.json()).appriseAlert);
                setCheckIsLoading(false);
            } catch (error) {
                console.log('Fetching Apprise alert setting failed.');
            }
        };
        getAppriseAlert();

        //Initial fetch to build the list of Apprise Services enabled
        const getAppriseServices = async () => {
            try {
                const response = await fetch(
                    '/api/account/getAppriseServices',
                    {
                        method: 'GET',
                        headers: {
                            'Content-type': 'application/json',
                        },
                    }
                );
                let servicesArray = (await response.json()).appriseServices;
                const AppriseServicesListToText = () => {
                    let list = '';
                    for (let service of servicesArray) {
                        list += service + '\n';
                    }
                    return list;
                };
                setAppriseServicesList(AppriseServicesListToText());
            } catch (error) {
                console.log('Fetching Apprise services list failed.');
            }
        };
        getAppriseServices();
    }, []);

    ////Functions
    //Switch to enable/disable Apprise notifications
    const onChangeSwitchHandler = async (data) => {
        //Remove old error
        setError();
        //Disabled button
        setDisabled(true);
        const response = await fetch('/api/account/updateAppriseAlert', {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (!response.ok) {
            setError(result.message);
            setTimeout(() => {
                setError();
                setDisabled(false);
            }, 4000);
        } else {
            if (data.appriseAlert) {
                setChecked(!checked);
                toast.success('Apprise notifications enabled.', toastOptions);
            } else {
                setChecked(!checked);
                toast.success('Apprise notifications disabled.', toastOptions);
            }
        }
    };

    //Form submit handler to modify Apprise services
    const formSubmitHandler = async (data) => {
        console.log(data);
        // //Remove old error
        // setError();
        // //Loading button on submit to avoid multiple send.
        // setFormIsLoading(true);
        // //POST API to update Apprise Services
        // const response = await fetch('/api/account/updateAppriseServices', {
        //     method: 'PUT',
        //     headers: {
        //         'Content-type': 'application/json',
        //     },
        //     body: JSON.stringify(data),
        // });
        // const result = await response.json();

        // if (!response.ok) {
        //     setFormIsLoading(false);
        //     setError(result.message);
        //     setTimeout(() => setError(), 4000);
        // } else {
        //     setFormIsLoading(false);
        //     setInfo(true);
        //     toast.success('Email edited !', toastOptions);
        // }

        //TEST
        setFormIsSaved(true);
        setTimeout(() => setFormIsSaved(false), 3000);
    };

    return (
        <>
            {/* APPRISE ALERT */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Apprise alert</h2>
                </div>
                <div className={classes.setting}>
                    <div className={classes.bwFormWrapper}>
                        {checkIsLoading ? (
                            <SpinnerCircularFixed
                                size={30}
                                thickness={150}
                                speed={150}
                                color='#704dff'
                                secondaryColor='#c3b6fa'
                            />
                        ) : (
                            <Switch
                                checked={checked}
                                disabled={disabled}
                                switchName='Notify my Apprise services'
                                switchDescription='You will receive an alert on all your services every 24H if you have a down status.'
                                onChange={(e) =>
                                    onChangeSwitchHandler({ appriseAlert: e })
                                }
                            />
                        )}
                        <div className={classes.headerFormAppriseUrls}>
                            <div style={{ marginRight: '10px' }}>
                                Apprise URLs
                            </div>
                            <div>
                                {formIsLoading && (
                                    <SpinnerCircularFixed
                                        size={18}
                                        thickness={150}
                                        speed={150}
                                        color='#704dff'
                                        secondaryColor='#c3b6fa'
                                    />
                                )}
                                {formIsSaved && (
                                    <div className={classes.formIsSavedMessage}>
                                        ✅ Apprise configuration has been saved.
                                    </div>
                                )}
                            </div>
                        </div>
                        <form
                            onBlur={handleSubmit(formSubmitHandler)}
                            className={
                                classes.bwForm + ' ' + classes.currentSetting
                            }
                        >
                            <textarea
                                style={{ height: '100px' }}
                                type='text'
                                placeholder={
                                    'matrixs://{user}:{password}@{matrixhost}\ndiscord://{WebhookID}/{WebhookToken}\nmmosts://user@hostname/authkey'
                                }
                                defaultValue={appriseServicesList}
                                {...register('appriseURLs', {
                                    pattern: {
                                        value: /^.+:\/\/.+$/gm,
                                        message: 'Invalid URLs format.',
                                    },
                                })}
                            />
                            {errors.appriseURLs && (
                                <small className={classes.errorMessage}>
                                    {errors.appriseURLs.message}
                                </small>
                            )}
                        </form>
                        <div
                            style={{
                                color: '#6c737f',
                                fontSize: '0.875rem',
                                marginBottom: '20px',
                            }}
                        >
                            Use{' '}
                            <a
                                style={{
                                    color: '#6d4aff',
                                    textDecoration: 'none',
                                }}
                                href='https://github.com/caronc/apprise#supported-notifications'
                            >
                                Apprise URLs
                            </a>{' '}
                            to send a notification to any service. Only one URL
                            per line.
                        </div>
                        <button
                            className='defaultButton'
                            //onClick={onSendTestMailHandler}
                        >
                            Send a test notification
                        </button>
                        {error && <Error message={error} />}
                    </div>
                </div>
            </div>
        </>
    );
}
