//Lib
import { ToastContainer, toast } from 'react-toastify';
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
        autoClose: 8000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
    };

    ////State
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState();

    ////Functions
    //Form submit Handler for ADD a repo
    // const formSubmitHandler = async (data) => {
    //     console.log(data);
    //     //Remove old error
    //     setError();
    //     //Loading button on submit to avoid multiple send.
    //     setIsLoading(true);
    //     //POST API to send the new and old password
    //     const response = await fetch('/api/account/updateEmail', {
    //         method: 'PUT',
    //         headers: {
    //             'Content-type': 'application/json',
    //         },
    //         body: JSON.stringify(data),
    //     });
    //     const result = await response.json();

    //     if (!response.ok) {
    //         setIsLoading(false);
    //         reset();
    //         setError(result.message);
    //         setTimeout(() => setError(), 4000);
    //     } else {
    //         reset();
    //         setIsLoading(false);
    //         setInfo(true);
    //         toast.success('Email edited !', {
    //             position: 'top-right',
    //             autoClose: 5000,
    //             hideProgressBar: false,
    //             closeOnClick: true,
    //             pauseOnHover: true,
    //             draggable: true,
    //             progress: undefined,
    //         });
    //     }
    // };

    const onChangeSwitchHandler = (e) => {
        console.log(e);
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
                            switchName='Email'
                            switchDescription='You will receive an alert every 24H if you have a down status.'
                            onChange={(e) =>
                                onChangeSwitchHandler({ emailAlert: e })
                            }
                        />
                    </div>
                </div>
            </div>
        </>
    );
}
