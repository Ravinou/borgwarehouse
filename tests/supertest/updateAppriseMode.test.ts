import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/updateAppriseMode';
import { getServerSession } from 'next-auth/next';
import { getUsersList, updateUsersList } from '~/services';

jest.mock('next-auth/next');
jest.mock('~/services', () => ({
  getUsersList: jest.fn(),
  updateUsersList: jest.fn(),
}));

describe('Apprise Mode API', () => {
  it('should return 405 if method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 422 if invalid data is provided', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testuser' } });

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseMode: 'invalid-mode', appriseStatelessURL: 'https://example.com' },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(422);
  });

  it('should return 400 if user does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'unknownuser' } });
    (getUsersList as jest.Mock).mockResolvedValue([
      { username: 'testuser', appriseMode: 'package' },
    ]);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseMode: 'stateless', appriseStatelessURL: 'https://example.com' },
    });

    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should update user settings and return 200', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testuser' } });
    (getUsersList as jest.Mock).mockResolvedValue([
      { username: 'testuser', appriseMode: 'package' },
    ]);
    (updateUsersList as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseMode: 'stateless', appriseStatelessURL: 'https://example.com' },
    });

    await handler(req, res);

    expect(updateUsersList).toHaveBeenCalledWith([
      {
        username: 'testuser',
        appriseMode: 'stateless',
        appriseStatelessURL: 'https://example.com',
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });
});
