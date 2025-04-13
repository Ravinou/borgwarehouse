import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';
import { ConfigService } from '~/services';
import handler from '~/pages/api/v1/notif/apprise/mode';
import { AppriseModeEnum } from '~/types/domain/config.types';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('Get Apprise Mode API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if the method is not GET', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if the user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 400 if the user does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'nonexistent' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
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

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return appriseMode and appriseStatelessURL if the user exists', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'testuser' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
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

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      appriseMode: 'stateless',
      appriseStatelessURL: 'https://example.com',
    });
  });

  it('should return 500 if there is an error reading the file', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'testuser' },
    });

    vi.mocked(ConfigService.getUsersList).mockImplementation(() => {
      throw new Error();
    });
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator',
    });
  });
});

describe('Apprise Mode Update API', () => {
  it('should return 405 if method is not allowed', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });
    const { req, res } = createMocks({ method: 'POST' });
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
