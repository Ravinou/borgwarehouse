import handler from '~/pages/api/account/tokenManager';
import { createMocks } from 'node-mocks-http';
import { getServerSession } from 'next-auth/next';
import { ConfigService } from '~/services';
import ApiResponse from '~/helpers/functions/apiResponse';

vi.mock('next-auth/next', () => ({
  __esModule: true,
  getServerSession: vi.fn(),
}));

vi.mock('~/services');

vi.mock('~/helpers/functions/apiResponse');

describe('Token Manager API', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return unauthorized if session is not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);

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
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testUser' } });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'testUser',
        password: 'hashedPassword',
        email: 'testUser@example.com',
        roles: ['user'],
        tokens: [],
      },
    ]);
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

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
    expect(ConfigService.updateUsersList).toHaveBeenCalled();
  });

  it('should return bad request if token name already exists', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testUser' } });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'testUser',
        password: 'hashedPassword',
        email: 'testUser@example.com',
        roles: ['user'],
        tokens: [
          {
            token: 'sampleToken123',
            name: 'testToken',
            permissions: { create: true, read: true, update: true, delete: true },
            creation: 123,
          },
        ],
      },
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
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testUser' } });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'testUser',
        password: 'hashedPassword',
        email: 'testUser@example.com',
        roles: ['user'],
        tokens: [
          {
            token: 'sampleToken1',
            name: 'token1',
            permissions: { create: false, read: false, update: false, delete: false },
            creation: 123,
          },
          {
            token: 'sampleToken2',
            name: 'token2',
            permissions: { create: false, read: false, update: false, delete: false },
            creation: 456,
          },
        ],
      },
    ]);

    const { req, res } = createMocks({ method: 'GET' });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual([
      {
        name: 'token1',
        permissions: { create: false, read: false, update: false, delete: false },
        creation: 123,
      },
      {
        name: 'token2',
        permissions: { create: false, read: false, update: false, delete: false },
        creation: 456,
      },
    ]);
  });

  it('should delete a token for DELETE request', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testUser' } });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([
      {
        id: 1,
        username: 'testUser',
        password: 'hashedPassword',
        email: 'testUser@example.com',
        roles: ['user'],
        tokens: [
          {
            token: 'sampleToken1',
            name: 'token1',
            permissions: { create: false, read: false, update: false, delete: false },
            creation: 123,
          },
          {
            token: 'sampleToken2',
            name: 'token2',
            permissions: { create: false, read: false, update: false, delete: false },
            creation: 456,
          },
        ],
      },
    ]);
    vi.mocked(ConfigService.updateUsersList).mockResolvedValue();

    const { req, res } = createMocks({
      method: 'DELETE',
      body: { name: 'token1' },
    });

    await handler(req, res);

    expect(ApiResponse.success).toHaveBeenCalledWith(res, 'Token deleted');
    expect(ConfigService.updateUsersList).toHaveBeenCalled();
  });

  it('should return bad request if token name is missing in DELETE request', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'testUser' } });

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
