import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/updateAppriseMode';
import { getServerSession } from 'next-auth/next';
import { ConfigService } from '~/services';
import { AppriseModeEnum } from '~/types/domain/config.types';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('Apprise Mode API', () => {
  it('should return 405 if method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 422 if invalid data is provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testuser' } });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseMode: 'invalid-mode', appriseStatelessURL: 'https://example.com' },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(422);
  });

  it('should return 400 if user does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'unknownuser' } });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        roles: ['user'],
        email: 'testuser@example.com',
        appriseMode: AppriseModeEnum.PACKAGE,
      },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseMode: 'stateless', appriseStatelessURL: 'https://example.com' },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should update user settings and return 200', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testuser' } });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        roles: ['user'],
        email: 'testuser@example.com',
        appriseMode: AppriseModeEnum.PACKAGE,
      },
    ]);
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseMode: 'stateless', appriseStatelessURL: 'https://example.com' },
    });

    await handler(req, res);

    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        roles: ['user'],
        email: 'testuser@example.com',
        appriseMode: AppriseModeEnum.STATELESS,
        appriseStatelessURL: 'https://example.com',
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });
});
