import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/updateAppriseAlert';
import { getServerSession } from 'next-auth/next';
import { ConfigService } from '~/services';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('Notifications API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if the method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if the user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 422 if the request body is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'testuser' },
    });

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: 'not-boolean' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(422);
    expect(res._getJSONData()).toEqual({ message: 'Unexpected data' });
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
        appriseAlert: false,
      },
    ]);

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should update appriseAlert and return 200 if everything is correct', async () => {
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
        appriseAlert: false,
      },
    ]);

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);

    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      {
        id: 1,
        username: 'testuser',
        password: 'hashedpassword',
        roles: ['user'],
        email: 'testuser@example.com',
        appriseAlert: true,
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if there is an error reading users file', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'testuser' },
    });

    vi.mocked(ConfigService.getUsersList).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ status: 500, message: 'No such file or directory' });
  });
});
