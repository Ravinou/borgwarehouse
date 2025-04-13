import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/account/email';
import { getServerSession } from 'next-auth/next';
import { ConfigService } from '~/services';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('PUT /api/account/updateEmail', () => {
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

  it('should return 422 if email is not provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    const { req, res } = createMocks({
      method: 'PUT',
      body: {},
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(422);
    expect(res._getJSONData()).toEqual({ message: 'Unexpected data' });
  });

  it('should return 400 if user is not found in the users list', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { id: 1, username: 'Ada', email: 'ada@example.com', password: '', roles: [] },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { email: 'new@example.com' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return 400 if email already exists', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      { id: 1, username: 'Lovelace', email: 'lovelace@example.com', password: '', roles: [] },
      { id: 2, username: 'Ada', email: 'new@example.com', password: '', roles: [] },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { email: 'new@example.com' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({ message: 'Email already exists' });
  });

  it('should update the email and return 200 on success', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    const users = [
      { id: 1, username: 'Lovelace', email: 'lovelace@example.com', password: '', roles: [] },
    ];

    vi.mocked(ConfigService.getUsersList).mockResolvedValue(users);
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'PUT',
      body: { email: 'new@example.com' },
    });

    await handler(req, res);

    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      { ...users[0], email: 'new@example.com' },
    ]);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if there is a file system error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { email: 'new@example.com' },
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

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'UNKNOWN_ERROR' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { email: 'new@example.com' },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator',
    });
  });
});
