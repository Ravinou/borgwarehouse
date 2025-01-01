import { WizardEnvType } from '~/domain/config.types';
import { Optional } from '~/types';

export default function lanCommandOption(
  wizardEnv?: WizardEnvType,
  lanCommand?: boolean
): { FQDN: Optional<string>; SSH_SERVER_PORT: Optional<string> } {
  if (!wizardEnv) {
    return { FQDN: undefined, SSH_SERVER_PORT: undefined };
  }

  const { FQDN, FQDN_LAN, SSH_SERVER_PORT, SSH_SERVER_PORT_LAN, HIDE_SSH_PORT } = wizardEnv;

  const isPortHidden = HIDE_SSH_PORT === 'true';

  // Sélection des valeurs en fonction de lanCommand
  const selectedFQDN = lanCommand && FQDN_LAN ? FQDN_LAN : FQDN;
  const selectedPort = lanCommand ? SSH_SERVER_PORT_LAN : SSH_SERVER_PORT;

  // Construire le port final uniquement si disponible et non masqué
  const formattedPort = !isPortHidden && selectedPort ? `:${selectedPort}` : undefined;

  return {
    FQDN: selectedFQDN,
    SSH_SERVER_PORT: formattedPort,
  };
}
