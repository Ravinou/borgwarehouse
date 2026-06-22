import classes from './QuickCommands.module.css';
import { IconTerminal2 } from '@tabler/icons-react';
import { lanCommandOption } from '~/helpers/functions';
import { WizardEnvType } from '~/types/domain/config.types';
import CopyButton from '~/Components/UI/CopyButton/CopyButton';

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

  return (
    <div className={classes.commandBox}>
      <IconTerminal2 size={15} className={classes.commandIcon} stroke={1.75} />
      <code className={classes.commandText} title={connectionString}>
        {connectionString}
      </code>
      {props.lanCommand && <span className={classes.lanBadge}>LAN</span>}
      <CopyButton variant='pill' dataToCopy={connectionString} />
    </div>
  );
}
