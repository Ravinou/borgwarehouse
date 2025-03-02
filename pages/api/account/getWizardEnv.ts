//Lib
import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { WizardEnvEnum, WizardEnvType } from '~/types/domain/config.types';
import { NextApiRequest, NextApiResponse } from 'next';
import { ErrorResponse } from '~/types/api/error.types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WizardEnvType | ErrorResponse>
) {
  if (req.method !== 'GET') {
    return res.status(405);
  }
  const session = await getServerSession(req, res, authOptions);
  if (!session) {
    return res.status(401);
  }

  try {
    function getEnvVariable(envName: WizardEnvEnum, defaultValue = '') {
      return process.env[envName] || defaultValue;
    }

    const wizardEnv: WizardEnvType = {
      UNIX_USER: getEnvVariable(WizardEnvEnum.UNIX_USER, 'borgwarehouse'),
      FQDN: getEnvVariable(WizardEnvEnum.FQDN, 'localhost'),
      SSH_SERVER_PORT: getEnvVariable(WizardEnvEnum.SSH_SERVER_PORT, '22'),
      FQDN_LAN: getEnvVariable(WizardEnvEnum.FQDN_LAN),
      SSH_SERVER_PORT_LAN: getEnvVariable(WizardEnvEnum.SSH_SERVER_PORT_LAN),
      SSH_SERVER_FINGERPRINT_RSA: getEnvVariable(WizardEnvEnum.SSH_SERVER_FINGERPRINT_RSA),
      SSH_SERVER_FINGERPRINT_ED25519: getEnvVariable(WizardEnvEnum.SSH_SERVER_FINGERPRINT_ED25519),
      SSH_SERVER_FINGERPRINT_ECDSA: getEnvVariable(WizardEnvEnum.SSH_SERVER_FINGERPRINT_ECDSA),
      HIDE_SSH_PORT: getEnvVariable(WizardEnvEnum.HIDE_SSH_PORT, 'false'),
      DISABLE_INTEGRATIONS: getEnvVariable(WizardEnvEnum.DISABLE_INTEGRATIONS, 'false'),
      DISABLE_DELETE_REPO: getEnvVariable(WizardEnvEnum.DISABLE_DELETE_REPO, 'false'),
    };

    res.status(200).json(wizardEnv);
    return;
  } catch (error) {
    console.log(error);
    return res.status(500);
  }
}
