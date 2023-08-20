//Lib
import React from 'react';
import classes from '../WizardStep1/WizardStep1.module.css';
import { IconChecks, IconPlayerPlay } from '@tabler/icons-react';
import CopyButton from '../../UI/CopyButton/CopyButton';

function WizardStep3(props) {
    ////Vars
    //Needed to generate command for borg over LAN instead of WAN if env vars are set and option enabled.
    let HOSTNAME;
    let SSH_SERVER_PORT;
    if (
        props.selectedOption.lanCommand &&
        process.env.NEXT_PUBLIC_HOSTNAME_LAN &&
        process.env.NEXT_PUBLIC_SSH_SERVER_PORT_LAN
    ) {
        HOSTNAME = process.env.NEXT_PUBLIC_HOSTNAME_LAN;
        SSH_SERVER_PORT = process.env.NEXT_PUBLIC_SSH_SERVER_PORT_LAN;
    } else {
        HOSTNAME = process.env.NEXT_PUBLIC_HOSTNAME;
        SSH_SERVER_PORT = process.env.NEXT_PUBLIC_SSH_SERVER_PORT;
    }

    return (
        <div className={classes.container}>
            <h1>
                <IconPlayerPlay className={classes.icon} />
                Launch a backup
            </h1>
            <div className={classes.description}>
                To launch a backup with borgbackup :
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                    }}
                >
                    <div className={classes.code}>
                        borg create ssh://
                        {props.selectedOption.unixUser}@{HOSTNAME}:
                        {SSH_SERVER_PORT}/./
                        {props.selectedOption.repositoryName}
                        ::archive1 /your/pathToBackup
                    </div>
                    <CopyButton
                        dataToCopy={`borg create ssh://${props.selectedOption.unixUser}@${HOSTNAME}:${SSH_SERVER_PORT}/./${props.selectedOption.repository}::archive1 /your/pathToBackup`}
                    />
                </div>
            </div>
            <div className={classes.separator}></div>
            <h1>
                <IconChecks className={classes.icon} />
                Check your backup{' '}
                <span style={{ color: '#494b7a4d', fontWeight: 'normal' }}>
                    &nbsp;(always)
                </span>
            </h1>
            <div className={classes.description}>
                BorgWarehouse <b>only stores</b> your backups. They are
                encrypted and <b>there is no way</b> for BorgWarehouse to know
                if the backup is intact.
                <br />
                You should regularly test your backups and check that the data
                is recoverable.{' '}
                <b>
                    BorgWarehouse cannot do this for you and does not guarantee
                    anything.
                </b>
                <br />
            </div>

            <span className={classes.description}>
                Based on the Borg documentation, you have multiple ways to check
                that your backups are correct with your tools (tar, rsync, diff
                or other tools).
                <br />
                <li>Check the integrity of a repository with :</li>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                    }}
                >
                    <div className={classes.code}>
                        borg check -v --progress ssh://
                        {props.selectedOption.unixUser}@{HOSTNAME}:
                        {SSH_SERVER_PORT}/./
                        {props.selectedOption.repositoryName}
                    </div>
                    <CopyButton
                        dataToCopy={`borg check -v --progress ssh://${props.selectedOption.unixUser}@${HOSTNAME}:${SSH_SERVER_PORT}/./${props.selectedOption.repositoryName}`}
                    />
                </div>
                <li>List the remote archives with :</li>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                    }}
                >
                    <div className={classes.code}>
                        borg list ssh://
                        {props.selectedOption.unixUser}@{HOSTNAME}:
                        {SSH_SERVER_PORT}/./
                        {props.selectedOption.repositoryName}
                    </div>
                    <CopyButton
                        dataToCopy={`borg list ssh://${props.selectedOption.unixUser}@${HOSTNAME}:${SSH_SERVER_PORT}/./${props.selectedOption.repositoryName}`}
                    />
                </div>
                <li>Download a remote archive with the following command :</li>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                    }}
                >
                    <div className={classes.code}>
                        borg export-tar --tar-filter="gzip -9" ssh://
                        {props.selectedOption.unixUser}@{HOSTNAME}:
                        {SSH_SERVER_PORT}/./
                        {props.selectedOption.repositoryName}
                        ::archive1 archive1.tar.gz
                    </div>
                    <CopyButton
                        dataToCopy={`borg export-tar --tar-filter="gzip -9" ssh://${props.selectedOption.unixUser}@${HOSTNAME}:${SSH_SERVER_PORT}/./${props.selectedOption.repositoryName}::archive1 archive1.tar.gz`}
                    />
                </div>
                <li>
                    Mount an archive to compare or backup some files without
                    download all the archive :
                </li>
                <div
                    style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'flex-start',
                    }}
                >
                    <div className={classes.code}>
                        borg mount ssh://
                        {props.selectedOption.unixUser}@{HOSTNAME}:
                        {SSH_SERVER_PORT}/./
                        {props.selectedOption.repositoryName}
                        ::archive1 /tmp/yourMountPoint
                    </div>
                    <CopyButton
                        dataToCopy={`borg mount ssh://${props.selectedOption.unixUser}@${HOSTNAME}:${SSH_SERVER_PORT}/./${props.selectedOption.repositoryName}::archive1 /tmp/yourMountPoint`}
                    />
                </div>
                <br />
                To verify the consistency of a repository and the corresponding
                archives, please refer to{' '}
                <a
                    href='https://borgbackup.readthedocs.io/en/stable/usage/check.html'
                    rel='noreferrer'
                    target='_blank'
                >
                    this documentation
                </a>
            </span>
            <div className={classes.separator}></div>
            <h2>Borgmatic</h2>
            <div className={classes.description}>
                If you are using Borgmatic, please refer to{' '}
                <a
                    href='https://torsion.org/borgmatic/docs/how-to/deal-with-very-large-backups/#consistency-check-configuration'
                    rel='noreferrer'
                    target='_blank'
                >
                    this documentation
                </a>{' '}
                for a consistency check.
            </div>
            <h2>Vorta</h2>
            <div className={classes.description}>
                If you are using the Vorta graphical client, please refer to{' '}
                <a
                    href='https://vorta.borgbase.com/usage/'
                    rel='noreferrer'
                    target='_blank'
                >
                    this documentation
                </a>
                .
            </div>
        </div>
    );
}

export default WizardStep3;
