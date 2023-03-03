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
    const [isLoading, setIsLoading] = useState(true);
    const [testIsLoading, setTestIsLoading] = useState(false);
    const [error, setError] = useState();
    const [disabled, setDisabled] = useState(false);
    const [checked, setChecked] = useState();
    const [info, setInfo] = useState(false);

    ////LifeCycle
    //Component did mount
    useEffect(() => {
        const dataFetch = async () => {
            try {
                const response = await fetch('/api/account/getAppriseAlert', {
                    method: 'GET',
                    headers: {
                        'Content-type': 'application/json',
                    },
                });
                setChecked((await response.json()).appriseAlert);
                setIsLoading(false);
            } catch (error) {
                console.log('Fetching Apprise alert setting failed.');
            }
        };
        dataFetch();
    }, []);

    ////Functions
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
                        {isLoading ? (
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

                        <form
                            className={
                                classes.bwForm + ' ' + classes.currentSetting
                            }
                        >
                            <div
                                style={{
                                    fontWeight: '500',
                                    color: '#494b7a',
                                    margin: '40px 0px 10px 0px',
                                }}
                            >
                                Apprise URLs
                            </div>
                            <textarea style={{ height: '100px' }}></textarea>
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
                            to send a notification to any service.
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
