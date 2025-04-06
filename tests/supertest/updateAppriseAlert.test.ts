import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/updateAppriseAlert';
import { getServerSession } from 'next-auth/next';
import { getUsersList, updateUsersList } from '~/services';

jest.mock('next-auth/next');
jest.mock('~/services', () => ({
  __esModule: true,
  getUsersList: jest.fn(),
  updateUsersList: jest.fn(),
}));

describe('Notifications API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if the method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if the user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 422 if the request body is invalid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: 'not-boolean' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(422);
    expect(res._getJSONData()).toEqual({ message: 'Unexpected data' });
  });

  it('should return 400 if the user does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'nonexistent' },
    });

    (getUsersList as jest.Mock).mockResolvedValue([{ username: 'testuser', appriseAlert: false }]);

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should update appriseAlert and return 200 if everything is correct', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    (getUsersList as jest.Mock).mockResolvedValue([{ username: 'testuser', appriseAlert: false }]);

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);

    expect(updateUsersList).toHaveBeenCalledWith([{ username: 'testuser', appriseAlert: true }]);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if there is an error reading users file', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    (getUsersList as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({ method: 'PUT', body: { appriseAlert: true } });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ status: 500, message: 'No such file or directory' });
  });
});
