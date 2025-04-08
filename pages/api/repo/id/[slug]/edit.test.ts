import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]/edit';
import { getServerSession } from 'next-auth/next';
import { tokenController, isSshPubKeyDuplicate } from '~/helpers/functions';
import { ConfigService, ShellService } from '~/services';

vi.mock('next-auth/next');

vi.mock('~/helpers/functions', () => ({
  tokenController: vi.fn(),
  isSshPubKeyDuplicate: vi.fn(),
}));

vi.mock('~/services');

describe('PATCH /api/repo/id/[slug]/edit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not PATCH', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    const { req, res } = createMocks({ method: 'PATCH' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 401 if API key is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue(undefined);
    const { req, res } = createMocks({
      method: 'PATCH',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have update permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue({
      update: false,
      create: false,
      delete: false,
      read: false,
    });
    const { req, res } = createMocks({
      method: 'PATCH',
      headers: { authorization: 'Bearer API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 400 if slug is missing or malformed', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'PATCH', query: { slug: undefined } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should return 404 if repository is not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    const { req, res } = createMocks({ method: 'PATCH', query: { slug: '123' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  it('should return 409 if SSH key is duplicated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'test-alias',
        status: true,
        lastSave: 0,
        storageSize: 100,
        storageUsed: 50,
        lanCommand: false,
        sshPublicKey: 'test-key',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(isSshPubKeyDuplicate).mockReturnValue(true);
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '123' },
      body: { sshPublicKey: 'duplicate-key' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(409);
  });

  it('should return 500 if updateRepoShell fails', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'test-alias',
        status: true,
        lastSave: 0,
        storageSize: 100,
        storageUsed: 50,
        lanCommand: false,
        sshPublicKey: 'test-key',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(ShellService.updateRepo).mockResolvedValue({ stderr: 'Error', stdout: '' });
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '123' },
      body: { alias: 'new-alias' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });

  it('should successfully update repository with a session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'test-alias',
        status: true,
        lastSave: 0,
        storageSize: 100,
        storageUsed: 50,
        lanCommand: false,
        sshPublicKey: 'test-key',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(ShellService.updateRepo).mockResolvedValue({ stderr: '', stdout: '' });
    vi.mocked(ConfigService.updateRepoList).mockResolvedValue();
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '123' },
      body: { alias: 'new-alias' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Repository test-repo has been edited' });
  });

  it('should successfully update repository with API key', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue({
      update: true,
      create: false,
      delete: false,
      read: false,
    });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 456,
        repositoryName: 'repo-key',
        alias: 'repo-alias',
        status: true,
        lastSave: 0,
        storageSize: 100,
        storageUsed: 50,
        lanCommand: false,
        sshPublicKey: 'ssh-key',
        comment: 'Test repository',
      },
    ]);
    vi.mocked(ShellService.updateRepo).mockResolvedValue({ stderr: null });
    vi.mocked(ConfigService.updateRepoList).mockResolvedValue();
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '456' },
      headers: { authorization: 'Bearer API_KEY' },
      body: { alias: 'updated-repo' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Repository repo-key has been edited' });
  });

  it('should only update the provided fields, keep the rest unchanged and history the modification.', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'old-alias',
        sshPublicKey: 'old-key',
        storageSize: 100,
        lanCommand: false,
        status: true,
        lastSave: 0,
        storageUsed: 50,
        comment: 'Initial repository setup',
      },
    ]);
    vi.mocked(ShellService.updateRepo).mockResolvedValue({ stderr: null });
    vi.mocked(ConfigService.updateRepoList).mockResolvedValue();
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '123' },
      body: {
        alias: 'new-alias',
        sshPublicKey: 'new-key',
        comment: 'new-comment',
        alert: 0,
        appendOnlyMode: true,
      },
    });
    await handler(req, res);
    expect(ConfigService.updateRepoList).toHaveBeenCalledWith(
      [
        {
          id: 123,
          repositoryName: 'test-repo',
          alias: 'new-alias',
          sshPublicKey: 'new-key',
          storageSize: 100,
          lanCommand: false,
          comment: 'new-comment',
          status: true,
          lastSave: 0,
          appendOnlyMode: true,
          alert: 0,
          storageUsed: 50,
        },
      ],
      true
    );
    expect(ShellService.updateRepo).toHaveBeenCalledWith('test-repo', 'new-key', 100, true);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Repository test-repo has been edited' });
  });
});
