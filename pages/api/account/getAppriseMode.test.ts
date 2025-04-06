import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';
import { getUsersList } from '~/services';
import handler from '~/pages/api/account/getAppriseMode';
import { AppriseModeEnum } from '~/types/domain/config.types';

vi.mock('next-auth/next');
vi.mock('~/services', () => ({
  getUsersList: vi.fn(),
}));

describe('Get Apprise Mode API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if the method is not GET', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if the user is not authenticated', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'You must be logged in.' });
  });

  it('should return 400 if the user does not exist', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'nonexistent' },
    });

    vi.mocked(getUsersList).mockResolvedValue([
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

    vi.mocked(getUsersList).mockResolvedValue([
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

    vi.mocked(getUsersList).mockImplementation(() => {
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
