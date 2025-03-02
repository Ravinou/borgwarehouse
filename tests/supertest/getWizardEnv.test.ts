import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/getWizardEnv';
import { getServerSession } from 'next-auth/next';
import { WizardEnvEnum } from '~/types/domain/config.types';

jest.mock('next-auth/next');

describe('Get Wizard Env API', () => {
  it('should return 405 if the method is not GET', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if the user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 200 with wizardEnv if the user is authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testuser' } });

    process.env.UNIX_USER = 'borgwarehouse';
    process.env.FQDN = 'localhost';
    process.env.SSH_SERVER_PORT = '22';
    process.env.HIDE_SSH_PORT = 'false';
    process.env.DISABLE_INTEGRATIONS = 'false';

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      wizardEnv: {
        UNIX_USER: 'borgwarehouse',
        FQDN: 'localhost',
        SSH_SERVER_PORT: '22',
        FQDN_LAN: '',
        SSH_SERVER_PORT_LAN: '',
        SSH_SERVER_FINGERPRINT_RSA: '',
        SSH_SERVER_FINGERPRINT_ED25519: '',
        SSH_SERVER_FINGERPRINT_ECDSA: '',
        HIDE_SSH_PORT: 'false',
        DISABLE_INTEGRATIONS: 'false',
        DISABLE_DELETE_REPO: 'false',
      },
    });
  });
});
