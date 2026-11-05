import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/account/password';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService, AuthService } from '~/services';
import { getCredentialPasswordHash, syncPasswordChange } from '~/lib/auth-db-sync';

vi.mock('~/helpers/getServerSession');
vi.mock('~/services');
vi.mock('~/lib/auth-db-sync', () => ({
  getCredentialPasswordHash: vi.fn(),
  syncPasswordChange: vi.fn(),
}));

describe('PUT /api/account/updatePassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.mocked(getCredentialPasswordHash).mockReturnValue(undefined);
    vi.mocked(AuthService.verifyPassword).mockResolvedValue(false);
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

  it('should return 422 if oldPassword or newPassword are missing or not strings', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
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
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '2' },
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
    expect(res._getJSONData()).toEqual({ message: 'Old password is incorrect.' });
  });

  it('should return 400 if old password is incorrect', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { id: 1, username: 'Lovelace', password: 'hashedpass', roles: [], email: 'love@example.com' },
    ]);

    vi.mocked(getCredentialPasswordHash).mockReturnValue('sqlite-hash');
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
      password: 'stale-json-hash',
      roles: [],
      email: 'love@example.com',
    };

    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([oldUser]);
    vi.mocked(getCredentialPasswordHash).mockReturnValue('sqlite-hash');

    vi.mocked(AuthService.verifyPassword).mockImplementation(async (_password, hash) =>
      hash === 'sqlite-hash'
    );
    vi.mocked(AuthService.hashPassword).mockResolvedValue('newHashedPassword');
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'oldpass', newPassword: 'newpass' },
    });

    await handler(req, res);

    expect(getCredentialPasswordHash).toHaveBeenCalledWith('1');
    expect(AuthService.verifyPassword).toHaveBeenCalledWith('oldpass', 'sqlite-hash');
    expect(AuthService.hashPassword).toHaveBeenCalledWith('newpass');
    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      { ...oldUser, password: 'newHashedPassword' },
    ]);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
    expect(syncPasswordChange).toHaveBeenCalledWith('1', 'newHashedPassword');
  });

  it('should change the SQLite password even when there is no legacy JSON user entry', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(getCredentialPasswordHash).mockReturnValue('sqlite-hash');
    vi.mocked(AuthService.verifyPassword).mockResolvedValue(true);
    vi.mocked(AuthService.hashPassword).mockResolvedValue('newHashedPassword');

    const { req, res } = createMocks({
      method: 'PUT',
      body: { oldPassword: 'oldpass', newPassword: 'newpass' },
    });

    await handler(req, res);

    expect(syncPasswordChange).toHaveBeenCalledWith('1', 'newHashedPassword');
    expect(ConfigService.updateUsersList).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should return 500 if there is a file system error (ENOENT)', async () => {
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    vi.mocked(getCredentialPasswordHash).mockReturnValue('sqlite-hash');
    vi.mocked(AuthService.verifyPassword).mockResolvedValue(true);
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
    vi.mocked(getSession).mockResolvedValue({
      user: { name: 'Lovelace', email: 'love@example.com', id: '1' },
    });

    vi.mocked(getCredentialPasswordHash).mockReturnValue('sqlite-hash');
    vi.mocked(AuthService.verifyPassword).mockResolvedValue(true);
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
