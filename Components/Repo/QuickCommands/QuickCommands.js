//Lib
import React from 'react';
import { useState } from 'react';
import classes from './QuickCommands.module.css';
import { IconSettingsAutomation, IconCopy } from '@tabler/icons';

export default function QuickCommands(props) {
    //State
    const [isCopied, setIsCopied] = useState(false);

    //Functions
    const handleCopy = async () => {
        // Asynchronously call copy to clipboard
        navigator.clipboard
            .writeText(
                `borg init -e repokey-blake2 ssh://${props.unixUser}@${process.env.NEXT_PUBLIC_HOSTNAME}:${process.env.NEXT_PUBLIC_SSH_SERVER_PORT}/./${props.repository}`
            )
            .then(() => {
                // If successful, update the isCopied state value
                setIsCopied(true);
                setTimeout(() => {
                    setIsCopied(false);
                }, 1500);
            })
            .catch((err) => {
                console.log(err);
            });
    };

    return (
        <div className={classes.container}>
            {isCopied ? (
                <div className={classes.copyValid}>Copied !</div>
            ) : (
                <div className={classes.tooltip}>
                    borg init -e repokey-blake2 ssh://{props.unixUser}@
                    {process.env.NEXT_PUBLIC_HOSTNAME}:
                    {process.env.NEXT_PUBLIC_SSH_SERVER_PORT}/./
                    {props.repository}
                </div>
            )}
            <div className={classes.icons}>
                <button onClick={handleCopy} className={classes.copyButton}>
                    <IconCopy color='#65748b' stroke={1.25} />
                </button>
                <div className={classes.quickSetting}>
                    <IconSettingsAutomation color='#65748b' stroke={1.25} />
                </div>
            </div>
        </div>
    );
}
