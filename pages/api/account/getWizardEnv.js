//Lib
import { authOptions } from '../auth/[...nextauth]';
import { getServerSession } from 'next-auth/next';

export default async function handler(req, res) {
    if (req.method == 'GET') {
        //Verify that the user is logged in.
        const session = await getServerSession(req, res, authOptions);
        if (!session) {
            res.status(401).json({ message: 'You must be logged in.' });
            return;
        }
        try {
            function getEnvVariable(envName, defaultValue = '') {
                return process.env[envName] || defaultValue;
            }

            const wizardEnv = {
                UNIX_USER: getEnvVariable('UNIX_USER', 'borgwarehouse'),
                HOSTNAME: getEnvVariable('HOSTNAME', 'localhost'),
                SSH_SERVER_PORT: getEnvVariable('SSH_SERVER_PORT', '22'),
                HOSTNAME_LAN: getEnvVariable('HOSTNAME_LAN'),
                SSH_SERVER_PORT_LAN: getEnvVariable('SSH_SERVER_PORT_LAN'),
                SSH_SERVER_FINGERPRINT_RSA: getEnvVariable(
                    'SSH_SERVER_FINGERPRINT_RSA'
                ),
                SSH_SERVER_FINGERPRINT_ED25519: getEnvVariable(
                    'SSH_SERVER_FINGERPRINT_ED25519'
                ),
                SSH_SERVER_FINGERPRINT_ECDSA: getEnvVariable(
                    'SSH_SERVER_FINGERPRINT_ECDSA'
                ),
            };
            res.status(200).json({ wizardEnv });
            return;
        } catch (error) {
            //Log for backend
            console.log(error);
            //Log for frontend
            res.status(500).json({
                status: 500,
                message: 'API error, contact the administrator',
            });
            return;
        }
    } else {
        res.status(405).json({ message: 'Bad request on API' });
    }
}
