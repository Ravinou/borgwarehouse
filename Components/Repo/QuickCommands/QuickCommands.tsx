import React from 'react';
import { useState } from 'react';
import classes from './QuickCommands.module.css';
import { IconSettingsAutomation, IconCopy } from '@tabler/icons-react';
import { lanCommandOption } from '~/helpers/functions';
import { WizardEnvType } from '~/types/domain/config.types';

type QuickCommandsProps = {
  repositoryName: string;
  wizardEnv?: WizardEnvType;
  lanCommand?: boolean;
};

export default function QuickCommands(props: QuickCommandsProps) {
  const wizardEnv = props.wizardEnv;
  //Needed to generate command for borg over LAN instead of WAN if env vars are set and option enabled.
  const { FQDN, SSH_SERVER_PORT } = lanCommandOption(wizardEnv, props.lanCommand);

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    // Asynchronously call copy to clipboard
    navigator.clipboard
      .writeText(
        `ssh://${wizardEnv?.UNIX_USER}@${FQDN}${SSH_SERVER_PORT ? SSH_SERVER_PORT : ''}/./${props.repositoryName}`
      )
      .then(() => {
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
          ssh://{wizardEnv?.UNIX_USER}@{FQDN}
          {SSH_SERVER_PORT ? SSH_SERVER_PORT : ''}/./
          {props.repositoryName}
        </div>
      )}

      {props.lanCommand && <div className={classes.lanBadge}>LAN</div>}

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
