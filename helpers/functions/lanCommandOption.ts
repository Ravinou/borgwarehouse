import { Optional, WizardEnvType } from '~/types';

export default function lanCommandOption(
  wizardEnv?: Partial<WizardEnvType>,
  lanCommand?: boolean
): { FQDN: Optional<string>; SSH_SERVER_PORT: Optional<string> } {
  if (!wizardEnv) {
    return { FQDN: undefined, SSH_SERVER_PORT: undefined };
  }

  const { FQDN, FQDN_LAN, SSH_SERVER_PORT, SSH_SERVER_PORT_LAN, HIDE_SSH_PORT } = wizardEnv;

  const isPortHidden = HIDE_SSH_PORT === 'true';

  const selectedFQDN = lanCommand && FQDN_LAN ? FQDN_LAN : FQDN;
  const selectedPort = lanCommand ? SSH_SERVER_PORT_LAN : SSH_SERVER_PORT;

  const formattedPort = !isPortHidden && selectedPort ? `:${selectedPort}` : undefined;

  return {
    FQDN: selectedFQDN,
    SSH_SERVER_PORT: formattedPort,
  };
}
