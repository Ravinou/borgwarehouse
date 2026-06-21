import { useState } from 'react';
import classes from './QuickCommands.module.css';
import { IconTerminal2, IconCopy, IconCheck } from '@tabler/icons-react';
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

  const connectionString = `ssh://${wizardEnv?.UNIX_USER}@${FQDN}${
    SSH_SERVER_PORT ? SSH_SERVER_PORT : ''
  }/./${props.repositoryName}`;

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    navigator.clipboard
      .writeText(connectionString)
      .then(() => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 1500);
      })
      .catch((err) => console.log(err));
  };

  return (
    <div className={classes.commandBox}>
      <IconTerminal2 size={15} className={classes.commandIcon} stroke={1.75} />
      <code className={classes.commandText} title={connectionString}>
        {connectionString}
      </code>
      {props.lanCommand && <span className={classes.lanBadge}>LAN</span>}
      <button
        onClick={handleCopy}
        className={`${classes.copyButton} ${isCopied ? classes.copied : ''}`}
        title='Copy connection string'
        aria-label='Copy connection string'
      >
        {isCopied ? (
          <>
            <IconCheck size={13} stroke={2} />
            Copied
          </>
        ) : (
          <>
            <IconCopy size={13} stroke={1.75} />
            Copy
          </>
        )}
      </button>
    </div>
  );
}
