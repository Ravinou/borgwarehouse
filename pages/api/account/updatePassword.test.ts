import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/updatePassword';
import { getServerSession } from 'next-auth/next';
import { ConfigService, AuthService } from '~/services';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('PUT /api/account/updatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 401 if not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 405 if method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 422 if oldPassword or newPassword are missing or not strings', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 1234, newPassword: true },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(422);
    expect(res._getJSONData()).toEqual({ message: 'Unexpected data' });
  });

  it('should return 400 if user is not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { id: 1, username: 'Ada', password: 'hashedpass', roles: [], email: 'ada@example.com' },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'test', newPassword: 'newpass' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return 400 if old password is incorrect', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { id: 1, username: 'Lovelace', password: 'hashedpass', roles: [], email: 'love@example.com' },
    ]);

    vi.mocked(AuthService.verifyPassword).mockResolvedValue(false);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'wrongpass', newPassword: 'newpass' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Old password is incorrect.' });
  });

  it('should update password and return 200 on success', async () => {
    const oldUser = {
      id: 1,
      username: 'Lovelace',
      password: 'hashedpass',
      roles: [],
      email: 'love@example.com',
    };

    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([oldUser]);

    vi.mocked(AuthService.verifyPassword).mockResolvedValue(true);
    vi.mocked(AuthService.hashPassword).mockResolvedValue('newHashedPassword');
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'oldpass', newPassword: 'newpass' },
    });

    await handler(req, res);

    expect(AuthService.verifyPassword).toHaveBeenCalledWith('oldpass', 'hashedpass');
    expect(AuthService.hashPassword).toHaveBeenCalledWith('newpass');
    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      { ...oldUser, password: 'newHashedPassword' },
    ]);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if there is a file system error (ENOENT)', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'test', newPassword: 'new' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'No such file or directory',
    });
  });

  it('should return 500 on unknown error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'SOMETHING_ELSE' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'test', newPassword: 'new' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator',
    });
  });
});
