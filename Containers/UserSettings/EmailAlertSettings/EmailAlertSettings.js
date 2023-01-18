//Lib
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import classes from '../UserSettings.module.css';
import { useState } from 'react';
import { SpinnerDotted } from 'spinners-react';

//Components
import Error from '../../../Components/UI/Error/Error';
import Switch from '../../../Components/UI/Switch/Switch';

export default function EmailAlertSettings(props) {
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
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();
    const [disabled, setDisabled] = useState(false);

    ////Functions
    const onChangeSwitchHandler = async (data) => {
        //Remove old error
        setError();
        //Disabled button
        setDisabled(true);
        const response = await fetch('/api/account/updateEmailAlert', {
            method: 'PUT',
            headers: {
                'Content-type': 'application/json',
            },
            body: JSON.stringify(data),
        });
        const result = await response.json();

        if (!response.ok) {
            //setIsLoading(false);
            setError(result.message);
            setTimeout(() => {
                setError();
                setDisabled(false);
            }, 4000);
        } else {
            if (data.emailAlert) {
                //setIsLoading(false);
                toast.success('Email notification enabled !', toastOptions);
            } else {
                //setIsLoading(false);
                toast.success('Email notification disabled !', toastOptions);
            }
        }
    };
    return (
        <>
            {/* EMAIL ALERT */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Alerting</h2>
                </div>
                <div className={classes.setting}>
                    <div className={classes.bwFormWrapper}>
                        <Switch
                            disabled={disabled}
                            switchName='Email'
                            switchDescription='You will receive an alert every 24H if you have a down status.'
                            onChange={(e) =>
                                onChangeSwitchHandler({ emailAlert: e })
                            }
                        />
                        {error && <Error message={error} />}
                    </div>
                </div>
            </div>
        </>
    );
}
