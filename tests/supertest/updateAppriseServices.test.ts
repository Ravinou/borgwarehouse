import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/updateAppriseServices';
import { getServerSession } from 'next-auth/next';
import { getUsersList, updateUsersList } from '~/helpers/functions/fileHelpers';

// Mock imports
jest.mock('next-auth/next');
jest.mock('~/helpers/functions/fileHelpers', () => ({
  getUsersList: jest.fn(),
  updateUsersList: jest.fn(),
}));

describe('PUT /api/account/updateAppriseURLs', () => {
  it('should return 401 if not authenticated', async () => {
    // Mock unauthenticated session
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 405 if method is not PUT', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 400 if user is not found in the users list', async () => {
    // Mock authenticated session
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    (getUsersList as jest.Mock).mockResolvedValue([{ username: 'Ada' }]);

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
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    (getUsersList as jest.Mock).mockResolvedValue([{ username: 'Lovelace', appriseServices: [] }]);
    (updateUsersList as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'PUT',
      body: { appriseURLs: 'http://example.com\nhttp://anotherurl.com' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Successful API send' });
  });

  it('should return 500 if there is an error reading the users file', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    (getUsersList as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

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
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'Lovelace' },
    });

    (getUsersList as jest.Mock).mockRejectedValue({ code: 'UNKNOWN_ERROR' });

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
