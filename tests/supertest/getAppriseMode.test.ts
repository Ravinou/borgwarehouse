import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';
import { getUsersList } from '~/helpers/functions';
import handler from '~/pages/api/account/getAppriseMode';

jest.mock('next-auth/next');
jest.mock('~/helpers/functions/fileHelpers', () => ({
  getUsersList: jest.fn(),
}));

describe('Get Apprise Mode API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

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
    expect(res._getJSONData()).toEqual({ message: 'You must be logged in.' });
  });

  it('should return 400 if the user does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'nonexistent' },
    });

    (getUsersList as jest.Mock).mockResolvedValue([
      {
        username: 'testuser',
        appriseMode: 'stateless',
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
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    (getUsersList as jest.Mock).mockResolvedValue([
      {
        username: 'testuser',
        appriseMode: 'stateless',
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
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    (getUsersList as jest.Mock).mockImplementation(() => {
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
