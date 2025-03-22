import request from 'supertest';
import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]/delete';
import { getServerSession } from 'next-auth/next';
import { deleteRepo, getRepoList, updateRepoList } from '~/helpers/functions';
import ApiResponse from '~/helpers/functions/apiResponse';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn(),
}));

jest.mock('~/helpers/functions', () => ({
  getRepoList: jest.fn(),
  updateRepoList: jest.fn(),
  deleteRepo: jest.fn(),
}));

jest.mock('~/helpers/functions/apiResponse', () => ({
  methodNotAllowed: jest.fn(),
  unauthorized: jest.fn(),
  forbidden: jest.fn(),
  badRequest: jest.fn(),
  notFound: jest.fn(),
  serverError: jest.fn(),
  success: jest.fn(),
}));

describe('DELETE /api/repo/id/[slug]/delete', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return 405 if method is not DELETE', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(ApiResponse.methodNotAllowed).toHaveBeenCalledWith(res);
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    const { req, res } = createMocks({ method: 'DELETE' });
    await handler(req, res);
    expect(ApiResponse.unauthorized).toHaveBeenCalledWith(res);
  });

  it('should return 403 if deletion is disabled via environment variable', async () => {
    process.env.DISABLE_DELETE_REPO = 'true';
    const { req, res } = createMocks({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    });
    await handler(req, res);
    expect(ApiResponse.forbidden).toHaveBeenCalledWith(res, 'Deletion is disabled on this server');
    delete process.env.DISABLE_DELETE_REPO;
  });

  it('should return 400 if slug is missing or malformed', async () => {
    const { req, res } = createMocks({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    });
    req.query = { slug: undefined };
    await handler(req, res);
    expect(ApiResponse.badRequest).toHaveBeenCalledWith(res, 'Missing slug or slug is malformed');
  });

  it('should return 404 if repository is not found', async () => {
    (getRepoList as jest.Mock).mockResolvedValue([]);
    const { req, res } = createMocks({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    });
    req.query = { slug: '1' };
    await handler(req, res);
    expect(ApiResponse.notFound).toHaveBeenCalledWith(res, 'Repository not found');
  });

  it('should return 500 if deleteRepo fails', async () => {
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 1, repositoryName: 'test-repo' }]);
    (deleteRepo as jest.Mock).mockResolvedValue({ stderr: 'Error' });
    const { req, res } = createMocks({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    });
    req.query = { slug: '1' };
    await handler(req, res);
    expect(ApiResponse.serverError).toHaveBeenCalledWith(res);
  });

  it('should delete the repository and return success', async () => {
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 1, repositoryName: 'test-repo' }]);
    (deleteRepo as jest.Mock).mockResolvedValue({ stderr: null });
    const { req, res } = createMocks({
      method: 'DELETE',
      headers: { authorization: 'Bearer token' },
    });
    req.query = { slug: '1' };
    await handler(req, res);
    expect(updateRepoList).toHaveBeenCalled();
    expect(ApiResponse.success).toHaveBeenCalledWith(res, 'Repository test-repo deleted');
  });
});
