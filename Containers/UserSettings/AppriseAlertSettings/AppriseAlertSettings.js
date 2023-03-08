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
import AppriseURLs from './AppriseURLs/AppriseURLs';
import AppriseMode from './AppriseMode/AppriseMode';

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
        formState: { errors },
    } = useForm({ mode: 'onBlur' });

    const {
        register: register2,
        handleSubmit: handleSubmit2,
        formState: { errors: errors2 },
    } = useForm({ mode: 'onBlur' });

    ////State
    const [checkIsLoading, setCheckIsLoading] = useState(true);
    const [testIsLoading, setTestIsLoading] = useState(false);
    const [formIsLoading, setFormIsLoading] = useState(false);
    const [urlsFormIsSaved, setUrlsFormIsSaved] = useState(false);
    const [modeFormIsSaved, setModeFormIsSaved] = useState(false);
    const [error, setError] = useState();
    const [disabled, setDisabled] = useState(false);
    const [checked, setChecked] = useState();
    const [info, setInfo] = useState(false);
    const [appriseServicesList, setAppriseServicesList] = useState();
    const [displayStatelessURL, setDisplayStatelessURL] = useState(false);

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

    return (
        <>
            {/* APPRISE ALERT */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Apprise alert</h2>
                </div>
                <div className={classes.setting}>
                    <div className={classes.bwFormWrapper}>
                        {/* NOTIFY SWITCH */}
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
                        {/* APPRISE SERVICES URLS */}
                        <AppriseURLs />
                        {/* APPRISE MODE SELECTION */}
                        <AppriseMode />
                        {/* APPRISE TEST BUTTON */}
                        <button
                            style={{ marginTop: '20px' }}
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
