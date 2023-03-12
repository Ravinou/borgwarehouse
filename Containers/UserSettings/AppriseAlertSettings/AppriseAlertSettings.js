//Lib
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerCircularFixed } from 'spinners-react';

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

    ////State
    const [checkIsLoading, setCheckIsLoading] = useState(true);
    const [error, setError] = useState();
    const [disabled, setDisabled] = useState(false);
    const [checked, setChecked] = useState();
    const [testIsLoading, setTestIsLoading] = useState(false);
    const [info, setInfo] = useState(false);

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

    //Send Apprise test notification to services
    const onSendTestAppriseHandler = async () => {
        //Loading
        setTestIsLoading(true);
        //Remove old error
        setError();
        const response = await fetch('/api/account/sendTestApprise', {
            method: 'POST',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify({ sendTestApprise: true }),
        });
        const result = await response.json();

        if (!response.ok) {
            setTestIsLoading(false);
            setError(result.message);
        } else {
            setTestIsLoading(false);
            setInfo(true);
            setTimeout(() => {
                setInfo(false);
            }, 4000);
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
                        {testIsLoading ? (
                            <SpinnerCircularFixed
                                style={{ marginTop: '20px' }}
                                size={30}
                                thickness={150}
                                speed={150}
                                color='#704dff'
                                secondaryColor='#c3b6fa'
                            />
                        ) : (
                            <button
                                style={{ marginTop: '20px' }}
                                className='defaultButton'
                                onClick={() => onSendTestAppriseHandler()}
                            >
                                Send a test notification
                            </button>
                        )}
                        {info && (
                            <span
                                style={{ marginLeft: '10px', color: '#119300' }}
                            >
                                Notification successfully sent.
                            </span>
                        )}
                        {error && <Error message={error} />}
                    </div>
                </div>
            </div>
        </>
    );
}
