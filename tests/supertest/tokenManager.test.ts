import handler from '~/pages/api/account/tokenManager';
import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import { getUsersList, updateUsersList } from '~/helpers/functions';
import ApiResponse from '~/helpers/functions/apiResponse';

jest.mock('next-auth', () => {
  return jest.fn(() => {
    return {
      auth: { session: {} },
      GET: jest.fn(),
      POST: jest.fn(),
    };
  });
});

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('~/helpers/functions', () => ({
  getUsersList: jest.fn(),
  updateUsersList: jest.fn(),
}));

jest.mock('~/helpers/functions/apiResponse', () => ({
  unauthorized: jest.fn(),
  badRequest: jest.fn(),
  serverError: jest.fn(),
  methodNotAllowed: jest.fn(),
  success: jest.fn(),
}));

describe('Token Manager API', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return unauthorized if session is not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'testToken',
        permissions: { create: true, read: true, update: true, delete: true },
      },
    });

    await handler(req, res);

    expect(ApiResponse.unauthorized).toHaveBeenCalledWith(res);
  });

  it('should create a new token if valid data is provided', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testUser' } });
    (getUsersList as jest.Mock).mockResolvedValue([{ username: 'testUser', tokens: [] }]);
    (updateUsersList as jest.Mock).mockResolvedValue(true);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'testToken',
        permissions: { create: true, read: true, update: true, delete: true },
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toHaveProperty('token');
    expect(updateUsersList).toHaveBeenCalled();
  });

  it('should return bad request if token name already exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testUser' } });
    (getUsersList as jest.Mock).mockResolvedValue([
      { username: 'testUser', tokens: [{ name: 'testToken', permissions: {}, creation: 123 }] },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      body: {
        name: 'testToken',
        permissions: { create: true, read: true, update: true, delete: true },
      },
    });

    await handler(req, res);

    expect(ApiResponse.badRequest).toHaveBeenCalledWith(res, 'Token name already exists');
  });

  it('should return token list for GET request', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testUser' } });
    (getUsersList as jest.Mock).mockResolvedValue([
      {
        username: 'testUser',
        tokens: [
          { name: 'token1', permissions: {}, creation: 123 },
          { name: 'token2', permissions: {}, creation: 456 },
        ],
      },
    ]);

    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual([
      { name: 'token1', permissions: {}, creation: 123 },
      { name: 'token2', permissions: {}, creation: 456 },
    ]);
  });

  it('should delete a token for DELETE request', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testUser' } });
    (getUsersList as jest.Mock).mockResolvedValue([
      {
        username: 'testUser',
        tokens: [
          { name: 'token1', permissions: {}, creation: 123 },
          { name: 'token2', permissions: {}, creation: 456 },
        ],
      },
    ]);
    (updateUsersList as jest.Mock).mockResolvedValue(true);

    const { req, res } = createMocks({
      method: 'DELETE',
      body: { name: 'token1' },
    });

    await handler(req, res);

    expect(ApiResponse.success).toHaveBeenCalledWith(res, 'Token deleted');
    expect(updateUsersList).toHaveBeenCalled();
  });

  it('should return bad request if token name is missing in DELETE request', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'testUser' } });

    const { req, res } = createMocks({
      method: 'DELETE',
      body: {},
    });

    await handler(req, res);

    expect(ApiResponse.badRequest).toHaveBeenCalledWith(res, 'Missing token name');
  });

  it('should return method not allowed for unsupported HTTP methods', async () => {
    const { req, res } = createMocks({ method: 'PUT' });

    await handler(req, res);

    expect(ApiResponse.methodNotAllowed).toHaveBeenCalledWith(res);
  });
});
