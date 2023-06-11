//Lib
import React from 'react';
import { useState } from 'react';
import classes from './QuickCommands.module.css';
import { IconSettingsAutomation, IconCopy } from '@tabler/icons';

export default function QuickCommands(props) {
    ////Vars
    //Needed to generate command for borg over LAN instead of WAN if env vars are set and option enabled.
    let HOSTNAME;
    let SSH_SERVER_PORT;
    console.log(props.lanCommand);
    if (
        props.lanCommand &&
        process.env.NEXT_PUBLIC_HOSTNAME_LAN &&
        process.env.NEXT_PUBLIC_SSH_SERVER_PORT_LAN
    ) {
        HOSTNAME = process.env.NEXT_PUBLIC_HOSTNAME_LAN;
        SSH_SERVER_PORT = process.env.NEXT_PUBLIC_SSH_SERVER_PORT_LAN;
    } else {
        HOSTNAME = process.env.NEXT_PUBLIC_HOSTNAME;
        SSH_SERVER_PORT = process.env.NEXT_PUBLIC_SSH_SERVER_PORT;
    }

    //State
    const [isCopied, setIsCopied] = useState(false);

    //Functions
    const handleCopy = async () => {
        // Asynchronously call copy to clipboard
        navigator.clipboard
            .writeText(
                `borg init -e repokey-blake2 ssh://${props.unixUser}@${HOSTNAME}:${SSH_SERVER_PORT}/./${props.repository}`
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
                    {HOSTNAME}:{SSH_SERVER_PORT}/./
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
