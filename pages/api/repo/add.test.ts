import { getServerSession } from 'next-auth/next';
import { createMocks } from 'node-mocks-http';
import { isSshPubKeyDuplicate, tokenController } from '~/helpers/functions';
import handler from '~/pages/api/repo/add';
import { getRepoList, updateRepoList, ShellService } from '~/services';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('~/helpers/functions', () => ({
  tokenController: vi.fn(),
  isSshPubKeyDuplicate: vi.fn(),
}));

vi.mock('~/services', () => ({
  getRepoList: vi.fn(),
  updateRepoList: vi.fn(),
  ShellService: {
    createRepo: vi.fn(),
  },
}));

describe('POST /api/repo/add', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
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
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue(undefined);
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have create permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue({ create: false });
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 409 if SSH key is duplicated', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(getRepoList).mockResolvedValue([{ id: 1, sshPublicKey: 'duplicate-key' }]);
    vi.mocked(isSshPubKeyDuplicate).mockReturnValue(true);
    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'duplicate-key', storageSize: 10 },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(409);
  });

  it('should return 500 if createRepoShell fails', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(getRepoList).mockResolvedValue([]);
    vi.mocked(ShellService.createRepo).mockResolvedValue({ stderr: 'Error' });
    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'valid-key', storageSize: 10 },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });

  it('should successfully create a repository with a session', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(getRepoList).mockResolvedValue([]);
    vi.mocked(ShellService.createRepo).mockResolvedValue({ stdout: 'new-repo' });
    vi.mocked(updateRepoList).mockResolvedValue(true);
    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo1', sshPublicKey: 'valid-key', storageSize: 10 },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ id: 0, repositoryName: 'new-repo' });
  });

  it('should add missing optional properties with default values and update repo list correctly', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(getRepoList).mockResolvedValue([]);
    vi.mocked(ShellService.createRepo).mockResolvedValue({ stdout: 'new-repo' });
    vi.mocked(updateRepoList).mockResolvedValue(true);

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
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });

    vi.mocked(getRepoList).mockResolvedValue([
      {
        id: 0,
        alias: 'repo0',
        sshPublicKey: 'key0',
        storageSize: 10,
        repositoryName: '',
        status: false,
        lastSave: 0,
        storageUsed: 0,
        comment: '',
      },
      {
        id: 1,
        alias: 'repo1',
        sshPublicKey: 'key1',
        storageSize: 20,
        repositoryName: '',
        status: false,
        lastSave: 0,
        storageUsed: 0,
        comment: '',
      },
      {
        id: 3,
        alias: 'repo3',
        sshPublicKey: 'key3',
        storageSize: 30,
        repositoryName: '',
        status: false,
        lastSave: 0,
        storageUsed: 0,
        comment: '',
      },
    ]);

    vi.mocked(ShellService.createRepo).mockResolvedValue({ stdout: 'new-repo' });
    vi.mocked(updateRepoList).mockResolvedValue(true);

    const { req, res } = createMocks({
      method: 'POST',
      body: { alias: 'repo-new', sshPublicKey: 'new-key', storageSize: 50 },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ id: 4, repositoryName: 'new-repo' });

    expect(updateRepoList).toHaveBeenCalledWith(
      [
        {
          id: 0,
          alias: 'repo0',
          sshPublicKey: 'key0',
          storageSize: 10,
          repositoryName: '',
          status: false,
          lastSave: 0,
          storageUsed: 0,
          comment: '',
        },
        {
          id: 1,
          alias: 'repo1',
          sshPublicKey: 'key1',
          storageSize: 20,
          repositoryName: '',
          status: false,
          lastSave: 0,
          storageUsed: 0,
          comment: '',
        },
        {
          id: 3,
          alias: 'repo3',
          sshPublicKey: 'key3',
          storageSize: 30,
          repositoryName: '',
          status: false,
          lastSave: 0,
          storageUsed: 0,
          comment: '',
        },
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
