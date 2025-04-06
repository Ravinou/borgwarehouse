import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]/edit';
import { getServerSession } from 'next-auth/next';
import { updateRepoShell } from '~/helpers/functions/shell.utils';
import { tokenController, isSshPubKeyDuplicate } from '~/helpers/functions';
import { getRepoList, updateRepoList } from '~/services';

vi.mock('next-auth/next', () => ({
  __esModule: true,
  getServerSession: vi.fn(),
}));

vi.mock('~/helpers/functions', () => ({
  tokenController: vi.fn(),
  isSshPubKeyDuplicate: vi.fn(),
}));

vi.mock('~/helpers/functions/shell.utils', () => ({
  updateRepoShell: vi.fn(),
}));

vi.mock('~/services', () => ({
  getRepoList: vi.fn(),
  updateRepoList: vi.fn(),
}));

describe('PATCH /api/repo/id/[slug]/edit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
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
    vi.mocked(tokenController).mockResolvedValue(null);
    const { req, res } = createMocks({
      method: 'PATCH',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have update permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue({ update: false });
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
    vi.mocked(getRepoList).mockResolvedValue([]);
    const { req, res } = createMocks({ method: 'PATCH', query: { slug: '123' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  it('should return 409 if SSH key is duplicated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(getRepoList).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (isSshPubKeyDuplicate as vi.Mock).mockReturnValue(true);
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
    vi.mocked(getRepoList).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (updateRepoShell as vi.Mock).mockResolvedValue({ stderr: 'Error' });
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
    vi.mocked(getRepoList).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (updateRepoShell as vi.Mock).mockResolvedValue({ stderr: null });
    vi.mocked(updateRepoList).mockResolvedValue(true);
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
    vi.mocked(tokenController).mockResolvedValue({ update: true });
    vi.mocked(getRepoList).mockResolvedValue([{ id: 456, repositoryName: 'repo-key' }]);
    (updateRepoShell as vi.Mock).mockResolvedValue({ stderr: null });
    vi.mocked(updateRepoList).mockResolvedValue(true);
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
    vi.mocked(getRepoList).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'old-alias',
        sshPublicKey: 'old-key',
        storageSize: 100,
        lanCommand: false,
      },
    ]);
    (updateRepoShell as vi.Mock).mockResolvedValue({ stderr: null });
    vi.mocked(updateRepoList).mockResolvedValue(true);
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
    expect(updateRepoList).toHaveBeenCalledWith(
      [
        {
          id: 123,
          repositoryName: 'test-repo',
          alias: 'new-alias',
          sshPublicKey: 'new-key',
          comment: 'new-comment',
          alert: 0,
          appendOnlyMode: true,
          storageSize: 100,
          lanCommand: false,
        },
      ],
      true
    );
    expect(updateRepoShell).toHaveBeenCalledWith('test-repo', 'new-key', 100, true);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ message: 'Repository test-repo has been edited' });
  });
});
