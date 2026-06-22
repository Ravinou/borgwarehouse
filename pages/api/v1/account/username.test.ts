import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/account/username';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService } from '~/services';
import { USERNAME_POLICY_MESSAGE } from '~/helpers/functions/usernamePolicy';

vi.mock('~/helpers/getServerSession');
vi.mock('~/services');
vi.mock('~/lib/auth-db-sync');

describe('PUT /api/account/updateUsername', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getSession).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 405 if method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 422 if username is not a string', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: 12345 },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(422);
    expect(res._getJSONData()).toEqual({ message: 'Unexpected data' });
  });

  it('should return 422 if username format is invalid', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: '' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(422);
    expect(res._getJSONData()).toEqual({
      message: USERNAME_POLICY_MESSAGE,
    });
  });

  it('should return 400 if user is not found', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '2' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { username: 'Ada', email: 'ada@example.com', password: 'xxx', id: 1, roles: ['user'] },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: 'newname' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return 400 if new username already exists', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { username: 'Lovelace', email: 'love@example.com', password: 'xxx', id: 1, roles: ['user'] },
      {
        username: 'newname',
        email: 'someone@example.com',
        password: 'xxx',
        id: 2,
        roles: ['user'],
      },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: 'newname' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Username already exists' });
  });

  it('should return 200 and update the username', async () => {
    const originalUser = {
      username: 'Lovelace',
      email: 'love@example.com',
      password: 'xxx',
      id: 1,
      roles: ['user'],
    };

    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([originalUser]);
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: 'newusername' },
    });

    await handler(req, res);

    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      { ...originalUser, username: 'newusername' },
    ]);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if file not found (ENOENT)', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });
    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: 'newname' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'No such file or directory',
    });
  });

  it('should return 500 on unknown error', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });
    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'SOMETHING_ELSE' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { username: 'newname' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator',
    });
  });
});
