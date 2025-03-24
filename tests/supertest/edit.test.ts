import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]/edit';
import { getServerSession } from 'next-auth/next';
import { updateRepoShell } from '~/helpers/functions/shell.utils';
import {
  getRepoList,
  updateRepoList,
  tokenController,
  isSshPubKeyDuplicate,
} from '~/helpers/functions';

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
  isSshPubKeyDuplicate: jest.fn(),
}));

jest.mock('~/helpers/functions/shell.utils', () => ({
  updateRepoShell: jest.fn(),
}));

describe('PATCH /api/repo/id/[slug]/edit', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
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
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks({
      method: 'PATCH',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have update permissions', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue({ update: false });
    const { req, res } = createMocks({
      method: 'PATCH',
      headers: { authorization: 'Bearer API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 400 if slug is missing or malformed', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'PATCH', query: { slug: undefined } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should return 404 if repository is not found', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([]);
    const { req, res } = createMocks({ method: 'PATCH', query: { slug: '123' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  it('should return 409 if SSH key is duplicated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (isSshPubKeyDuplicate as jest.Mock).mockReturnValue(true);
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '123' },
      body: { sshPublicKey: 'duplicate-key' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(409);
  });

  it('should return 500 if updateRepoShell fails', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (updateRepoShell as jest.Mock).mockResolvedValue({ stderr: 'Error' });
    const { req, res } = createMocks({
      method: 'PATCH',
      query: { slug: '123' },
      body: { alias: 'new-alias' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });

  it('should successfully update repository with a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 123, repositoryName: 'test-repo' }]);
    (updateRepoShell as jest.Mock).mockResolvedValue({ stderr: null });
    (updateRepoList as jest.Mock).mockResolvedValue(true);
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
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue({ update: true });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 456, repositoryName: 'repo-key' }]);
    (updateRepoShell as jest.Mock).mockResolvedValue({ stderr: null });
    (updateRepoList as jest.Mock).mockResolvedValue(true);
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
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([
      {
        id: 123,
        repositoryName: 'test-repo',
        alias: 'old-alias',
        sshPublicKey: 'old-key',
        storageSize: 100,
        lanCommand: false,
      },
    ]);
    (updateRepoShell as jest.Mock).mockResolvedValue({ stderr: null });
    (updateRepoList as jest.Mock).mockResolvedValue(true);
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
