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
    return (
        <>
            {/* APPRISE ALERT */}
            <div className={classes.containerSetting}>
                <div className={classes.settingCategory}>
                    <h2>Apprise alert</h2>
                </div>
                <div className={classes.setting}>
                    <div className={classes.bwFormWrapper}>
                        <Switch
                            // checked={checked}
                            // disabled={disabled}
                            switchName='Notify my Apprise services'
                            switchDescription='You will receive an alert on all your services every 24H if you have a down status.'
                            // onChange={(e) =>
                            //     onChangeSwitchHandler({ emailAlert: e })
                            // }
                        />
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
                            <textarea></textarea>
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
                    </div>
                </div>
            </div>
        </>
    );
}
