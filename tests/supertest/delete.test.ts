import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]/delete';
import { getServerSession } from 'next-auth/next';
import { deleteRepoShell } from '~/helpers/functions/shell.utils';
import { getRepoList, tokenController, updateRepoList } from '~/helpers/functions';

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
  getRepoList: jest.fn(),
  updateRepoList: jest.fn(),
  tokenController: jest.fn(),
}));

jest.mock('~/helpers/functions/shell.utils', () => {
  return {
    deleteRepoShell: jest.fn(),
  };
});

describe('DELETE /api/repo/id/[slug]/delete', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('should return 405 if method is not DELETE', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    const { req, res } = createMocks({ method: 'DELETE' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if deletion is disabled via environment variable', async () => {
    process.env.DISABLE_DELETE_REPO = 'true';
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({ method: 'DELETE' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
    expect(res._getJSONData()).toEqual({
      status: 403,
      message: 'Deletion is disabled on this server',
    });
    delete process.env.DISABLE_DELETE_REPO;
  });

  it('should return 400 if slug is missing or malformed', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: undefined },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      status: 400,
      message: 'Missing slug or slug is malformed',
    });
  });

  it('should return 404 if repository is not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '123' },
    });
    (getRepoList as jest.Mock).mockResolvedValue([]);
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({
      status: 404,
      message: 'Repository not found',
    });
  });

  it('should return 500 if deleteRepo fails', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '123' },
    });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (deleteRepoShell as jest.Mock).mockResolvedValue({ stderr: 'Error' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator.',
    });
    expect(updateRepoList).not.toHaveBeenCalled();
  });

  it('should delete the repository and return 200 on success with a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '1234' },
    });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 1234, repositoryName: 'test-repo' }]);
    (deleteRepoShell as jest.Mock).mockResolvedValue({ stderr: null });
    (updateRepoList as jest.Mock).mockResolvedValue(true);
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository test-repo deleted',
    });
    expect(updateRepoList).toHaveBeenCalledWith([], true);
  });

  it('should delete the repository and return 200 on success with an API key', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue({ delete: true });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '12345' },
      headers: {
        authorization: 'Bearer API_KEY',
      },
    });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 12345, repositoryName: 'test-repo2' }]);
    (deleteRepoShell as jest.Mock).mockResolvedValue({ stderr: null });
    (updateRepoList as jest.Mock).mockResolvedValue(true);
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository test-repo2 deleted',
    });
    expect(updateRepoList).toHaveBeenCalledWith([], true);
  });

  it('should return 401 if the API key is invalid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '12345' },
      headers: {
        authorization: 'Bearer API_KEY',
      },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({
      status: 401,
      message: 'Invalid API key',
    });
  });

  it('should return 403 if the API key does not have delete permissions', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue({ delete: false });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '12345' },
      headers: {
        authorization: 'Bearer API_KEY',
      },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
    expect(res._getJSONData()).toEqual({
      status: 403,
      message: 'Insufficient permissions',
    });
  });
});
