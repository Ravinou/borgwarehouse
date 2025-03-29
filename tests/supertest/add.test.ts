import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/add';
import { getServerSession } from 'next-auth/next';
import {
  getRepoList,
  updateRepoList,
  tokenController,
  isSshPubKeyDuplicate,
} from '~/helpers/functions';
import { createRepoShell } from '~/helpers/functions/shell.utils';

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
  createRepoShell: jest.fn(),
}));

describe('POST /api/repo/add', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    jest.resetAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not POST', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 401 if API key is invalid', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have create permissions', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue({ create: false });
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 409 if SSH key is duplicated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([{ id: 1, sshPublicKey: 'duplicate-key' }]);
    (isSshPubKeyDuplicate as jest.Mock).mockReturnValue(true);
    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'duplicate-key', storageSize: 10 },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(409);
  });

  it('should return 500 if createRepoShell fails', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([]);
    (createRepoShell as jest.Mock).mockResolvedValue({ stderr: 'Error' });
    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'valid-key', storageSize: 10 },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });

  it('should successfully create a repository with a session', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([]);
    (createRepoShell as jest.Mock).mockResolvedValue({ stdout: 'new-repo' });
    (updateRepoList as jest.Mock).mockResolvedValue(true);
    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'valid-key', storageSize: 10 },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ id: 0, repositoryName: 'new-repo' });
  });

  it('should add missing optional properties with default values and update repo list correctly', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue([]);
    (createRepoShell as jest.Mock).mockResolvedValue({ stdout: 'new-repo' });
    (updateRepoList as jest.Mock).mockResolvedValue(true);

    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'valid-key', storageSize: 10 },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ id: 0, repositoryName: 'new-repo' });

    expect(updateRepoList).toHaveBeenCalledWith(
      [
        {
          id: 0,
          alias: 'repo1',
          repositoryName: 'new-repo',
          status: false,
          lastSave: 0,
          lastStatusAlertSend: expect.any(Number),
          alert: 0,
          storageSize: 10,
          storageUsed: 0,
          sshPublicKey: 'valid-key',
          comment: '',
          lanCommand: false,
          appendOnlyMode: false,
        },
      ],
      true
    );
  });

  it('should assign the correct ID based on existing repositories', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });

    (getRepoList as jest.Mock).mockResolvedValue([
      { id: 0, alias: 'repo0', sshPublicKey: 'key0', storageSize: 10 },
      { id: 1, alias: 'repo1', sshPublicKey: 'key1', storageSize: 20 },
      { id: 3, alias: 'repo3', sshPublicKey: 'key3', storageSize: 30 },
    ]);

    (createRepoShell as jest.Mock).mockResolvedValue({ stdout: 'new-repo' });
    (updateRepoList as jest.Mock).mockResolvedValue(true);

    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo-new', sshPublicKey: 'new-key', storageSize: 50 },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ id: 4, repositoryName: 'new-repo' });

    expect(updateRepoList).toHaveBeenCalledWith(
      [
        { id: 0, alias: 'repo0', sshPublicKey: 'key0', storageSize: 10 },
        { id: 1, alias: 'repo1', sshPublicKey: 'key1', storageSize: 20 },
        { id: 3, alias: 'repo3', sshPublicKey: 'key3', storageSize: 30 },
        {
          id: 4,
          alias: 'repo-new',
          repositoryName: 'new-repo',
          status: false,
          lastSave: 0,
          lastStatusAlertSend: expect.any(Number),
          alert: 0,
          storageSize: 50,
          storageUsed: 0,
          sshPublicKey: 'new-key',
          comment: '',
          lanCommand: false,
          appendOnlyMode: false,
        },
      ],
      true
    );
  });
});
