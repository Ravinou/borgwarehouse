import React from 'react';
import classes from '../WizardStep1/WizardStep1.module.css';
import { IconWand } from '@tabler/icons-react';
import CopyButton from '../../UI/CopyButton/CopyButton';
import { WizardStepProps } from '~/types';
import { lanCommandOption } from '~/helpers/functions';

function WizardStep4(props: WizardStepProps) {
  const wizardEnv = props.wizardEnv;
  const UNIX_USER = wizardEnv?.UNIX_USER;
  //Needed to generate command for borg over LAN instead of WAN if env vars are set and option enabled.
  const { FQDN, SSH_SERVER_PORT } = lanCommandOption(wizardEnv, props.selectedRepo?.lanCommand);

  const configBorgmatic = `
    # List of source directories to backup.
    source_directories:
        - /your-repo-to-backup
        - /another/repo-to-backup

repositories:
    # Paths of local or remote repositories to backup to.
    - path: ssh://${UNIX_USER}@${FQDN}${SSH_SERVER_PORT}/./${props.selectedRepo?.repositoryName}

archive_name_format: '{FQDN}-documents-{now}'
encryption_passphrase: "YOUR PASSPHRASE"

# Retention policy for how many backups to keep.
keep_daily: 7
keep_weekly: 4
keep_monthly: 6

# List of checks to run to validate your backups.
checks:
  - name: repository
  - name: archives
    frequency: 2 weeks

#hooks:
    # Custom preparation scripts to run.
    #before_backup:
    #   - prepare-for-backup.sh

    # Databases to dump and include in backups.
    #postgresql_databases:
    #   - name: users

    # Third-party services to notify you if backups aren't happening.
    #healthchecks: https://hc-ping.com/be067061-cf96-4412-8eae-62b0c50d6a8c`;

  return (
    <div className={classes.container}>
      <h1>
        <IconWand className={classes.icon} />
        Automate your backup
      </h1>
      <div className={classes.description}>
        The official borgbackup project provides a script in its documentation&nbsp;
        <a
          href='https://borgbackup.readthedocs.io/en/stable/quickstart.html#automating-backups'
          rel='noreferrer'
          target='_blank'
        >
          right here
        </a>
        .
      </div>

      <div className={classes.separator} />
      <h2>Pika, Vorta...</h2>
      <div className={classes.description}>
        If you are using the Vorta graphical client, please refer to&nbsp;
        <a
          href='https://vorta.borgbase.com/usage/#scheduling-automatic-backups'
          rel='noreferrer'
          target='_blank'
        >
          this documentation
        </a>
        .<br />
        If you are using Pika Backup, please refer to&nbsp;
        <a
          href='https://world.pages.gitlab.gnome.org/pika-backup/help/C/feature-schedule.html'
          rel='noreferrer'
          target='_blank'
        >
          this documentation
        </a>
        .
      </div>

      <h2>Borgmatic</h2>
      <div className={classes.description}>
        If you are using Borgmatic, you can check&nbsp;
        <a
          href='https://torsion.org/borgmatic/docs/how-to/set-up-backups/#autopilot'
          rel='noreferrer'
          target='_blank'
        >
          this documentation&nbsp;
        </a>
        and <b>adapt</b> and use the following script :
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
        }}
      >
        <div className={classes.code}>{configBorgmatic}</div>
        <div
          style={{
            margin: '15px 0 auto 0',
            display: 'flex',
            alignContent: 'center',
          }}
        >
          <CopyButton dataToCopy={configBorgmatic} size={32} />
        </div>
      </div>
    </div>
  );
}

export default WizardStep4;
