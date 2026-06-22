import React from 'react';
import classes from '../WizardStep1/WizardStep1.module.css';
import { IconChecks, IconPlayerPlay } from '@tabler/icons-react';
import CommandBlock from '../../UI/CommandBlock/CommandBlock';
import { WizardStepProps } from '~/types';
import { lanCommandOption } from '~/helpers/functions';

function WizardStep3(props: WizardStepProps) {
  const wizardEnv = props.wizardEnv;
  const UNIX_USER = wizardEnv?.UNIX_USER;
  //Needed to generate command for borg over LAN instead of WAN if env vars are set and option enabled.
  const { FQDN, SSH_SERVER_PORT } = lanCommandOption(wizardEnv, props.selectedRepo?.lanCommand);

  return (
    <div className={classes.container}>
      <h1>
        <IconPlayerPlay className={classes.icon} />
        Launch a backup
      </h1>
      <div className={classes.description}>
        To launch a backup with borgbackup :
        <CommandBlock
          command={`borg create ssh://${UNIX_USER}@${FQDN}${SSH_SERVER_PORT}/./${props.selectedRepo?.repositoryName}::archive1 /your/pathToBackup`}
        />
      </div>
      <div className={classes.separator}></div>
      <h1>
        <IconChecks className={classes.icon} />
        Check your backup{' '}
        <span style={{ color: '#494b7a4d', fontWeight: 'normal' }}>&nbsp;(always)</span>
      </h1>
      <div className={classes.description}>
        BorgWarehouse <b>only stores</b> your backups. They are encrypted and <b>there is no way</b>{' '}
        for BorgWarehouse to know if the backup is intact.
        <br />
        You should regularly test your backups and check that the data is recoverable.{' '}
        <b>BorgWarehouse cannot do this for you and does not guarantee anything.</b>
        <br />
      </div>

      <span className={classes.description}>
        Based on the Borg documentation, you have multiple ways to check that your backups are
        correct with your tools (tar, rsync, diff or other tools).
        <br />
        <li>Check the integrity of a repository with :</li>
        <CommandBlock
          command={`borg check -v --progress ssh://${UNIX_USER}@${FQDN}${SSH_SERVER_PORT}/./${props.selectedRepo?.repositoryName}`}
        />
        <li>List the remote archives with :</li>
        <CommandBlock
          command={`borg list ssh://${UNIX_USER}@${FQDN}${SSH_SERVER_PORT}/./${props.selectedRepo?.repositoryName}`}
        />
        <li>Download a remote archive with the following command :</li>
        <CommandBlock
          command={`borg export-tar --tar-filter="gzip -9" ssh://${UNIX_USER}@${FQDN}${SSH_SERVER_PORT}/./${props.selectedRepo?.repositoryName}::archive1 archive1.tar.gz`}
        />
        <li>Mount an archive to compare or backup some files without download all the archive :</li>
        <CommandBlock
          command={`borg mount ssh://${UNIX_USER}@${FQDN}${SSH_SERVER_PORT}/./${props.selectedRepo?.repositoryName}::archive1 /tmp/yourMountPoint`}
        />
        <br />
        To verify the consistency of a repository and the corresponding archives, please refer to{' '}
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
      <h2>Pika, Vorta...</h2>
      <div className={classes.description}>
        If you are using the Vorta graphical client, please refer to{' '}
        <a href='https://vorta.borgbase.com/usage/' rel='noreferrer' target='_blank'>
          this documentation
        </a>
        .<br />
        If you are using Pika, please refer to{' '}
        <a href='https://apps.gnome.org/PikaBackup/' rel='noreferrer' target='_blank'>
          this documentation
        </a>
        .
      </div>
    </div>
  );
}

export default WizardStep3;
