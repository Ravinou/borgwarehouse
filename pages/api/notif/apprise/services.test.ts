import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';
import { ConfigService } from '~/services';
import handler from '~/pages/api/notif/apprise/services';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('Get Apprise Services API', () => {
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
        appriseServices: ['service1', 'service2'],
      },
    ]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return appriseServices if the user exists', async () => {
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
        appriseServices: ['service1', 'service2'],
      },
    ]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      appriseServices: ['service1', 'service2'],
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

describe('PUT Apprise services API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated session
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 405 if method is not handling', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });
    const { req, res } = createMocks({ method: 'DELETE' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 400 if user is not found in the users list', async () => {
    // Mock authenticated session
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'Ada',
        password: 'securepassword',
        roles: ['user'],
        email: 'ada@example.com',
      },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseURLs: 'http://example.com' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return 200 and successfully update the appriseURLs', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'Lovelace',
        password: 'securepassword',
        roles: ['user'],
        email: 'lovelace@example.com',
        appriseServices: [],
      },
    ]);
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseURLs: 'http://example.com\nhttp://anotherurl.com' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if there is an error reading the users file', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseURLs: 'http://example.com' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'No such file or directory',
    });
  });

  it('should return 500 if there is an API error', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'UNKNOWN_ERROR' });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseURLs: 'http://example.com' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator',
    });
  });
});
