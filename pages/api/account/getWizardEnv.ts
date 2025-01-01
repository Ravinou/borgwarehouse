//Lib
import { authOptions } from '~/pages/api/auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';
import { WizardEnv } from '~/domain/config.types';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method == 'GET') {
    //AUTHENTICATION
    const session = await getServerSession(req, res, authOptions);
    if (!session) {
      res.status(401).json({ message: 'You must be logged in.' });
      return;
    }

    try {
      function getEnvVariable(envName: WizardEnv, defaultValue = '') {
        return process.env[envName] || defaultValue;
      }

      const wizardEnv = {
        UNIX_USER: getEnvVariable(WizardEnv.UNIX_USER, 'borgwarehouse'),
        FQDN: getEnvVariable(WizardEnv.FQDN, 'localhost'),
        SSH_SERVER_PORT: getEnvVariable(WizardEnv.SSH_SERVER_PORT, '22'),
        FQDN_LAN: getEnvVariable(WizardEnv.FQDN_LAN),
        SSH_SERVER_PORT_LAN: getEnvVariable(WizardEnv.SSH_SERVER_PORT_LAN),
        SSH_SERVER_FINGERPRINT_RSA: getEnvVariable(WizardEnv.SSH_SERVER_FINGERPRINT_RSA),
        SSH_SERVER_FINGERPRINT_ED25519: getEnvVariable(WizardEnv.SSH_SERVER_FINGERPRINT_ED25519),
        SSH_SERVER_FINGERPRINT_ECDSA: getEnvVariable(WizardEnv.SSH_SERVER_FINGERPRINT_ECDSA),
        HIDE_SSH_PORT: getEnvVariable(WizardEnv.HIDE_SSH_PORT, 'false'),
        DISABLE_INTEGRATIONS: getEnvVariable(WizardEnv.DISABLE_INTEGRATIONS, 'false'),
      };

      res.status(200).json({ wizardEnv });
      return;
    } catch (error) {
      console.log(error);
      res.status(500).json({
        message: 'API error, contact the administrator',
      });
      return;
    }
  } else {
    res.status(405).json({ message: 'Bad request on API' });
  }
}
