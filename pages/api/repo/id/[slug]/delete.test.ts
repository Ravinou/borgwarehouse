import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]/delete';
import { getServerSession } from 'next-auth/next';
import { ConfigService, ShellService, AuthService } from '~/services';

vi.mock('next-auth/next');
vi.mock('~/services');

describe('DELETE /api/repo/id/[slug]/delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
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
    vi.mocked(getServerSession).mockResolvedValue({
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
    vi.mocked(getServerSession).mockResolvedValue({
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
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '123' },
    });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(res._getJSONData()).toEqual({
      status: 404,
      message: 'Repository not found',
    });
  });

  it('should return 500 if deleteRepo fails', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '123' },
    });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'test-alias',
        status: true,
        lastSave: 0,
        storageSize: 1024,
        storageUsed: 512,
        sshPublicKey: 'ssh-rsa AAAAB3Nz',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(ShellService.deleteRepo).mockResolvedValue({ stderr: 'Error' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator.',
    });
    expect(ConfigService.updateRepoList).not.toHaveBeenCalled();
  });

  it('should delete the repository and return 200 on success with a session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({
      user: { name: 'USER' },
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '1234' },
    });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 1234,
        repositoryName: 'test-repo',
        alias: 'test-alias',
        status: true,
        lastSave: 0,
        storageSize: 1024,
        storageUsed: 512,
        sshPublicKey: 'ssh-rsa AAAAB3Nz',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(ShellService.deleteRepo).mockResolvedValue({ stderr: null });
    vi.mocked(ConfigService.updateRepoList).mockResolvedValue();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository test-repo deleted',
    });
    expect(ConfigService.updateRepoList).toHaveBeenCalledWith([], true);
  });

  it('should delete the repository and return 200 on success with an API key', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({
      delete: true,
      read: true,
      create: true,
      update: true,
    });
    const { req, res } = createMocks({
      method: 'DELETE',
      query: { slug: '12345' },
      headers: {
        authorization: 'Bearer API_KEY',
      },
    });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 12345,
        repositoryName: 'test-repo2',
        alias: 'test-alias',
        status: true,
        lastSave: 0,
        storageSize: 1024,
        storageUsed: 512,
        sshPublicKey: 'ssh-rsa AAAAB3Nz',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(ShellService.deleteRepo).mockResolvedValue({ stdout: 'delete' });
    vi.mocked(ConfigService.updateRepoList).mockResolvedValue();
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository test-repo2 deleted',
    });
    expect(ConfigService.updateRepoList).toHaveBeenCalledWith([], true);
  });

  it('should return 401 if the API key is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue(undefined);
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
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({
      delete: false,
      read: true,
      create: true,
      update: true,
    });
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
