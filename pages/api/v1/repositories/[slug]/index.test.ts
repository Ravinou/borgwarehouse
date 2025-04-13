import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/repositories/[slug]';
import { getServerSession } from 'next-auth/next';
import { ConfigService, AuthService, ShellService } from '~/services';
import { isSshPubKeyDuplicate } from '~/helpers/functions';
import { Repository } from '~/types/domain/config.types';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('~/helpers/functions', () => ({
  isSshPubKeyDuplicate: vi.fn(),
}));
vi.mock('~/services');

const mockRepoList: Repository[] = [
  {
    id: 1,
    alias: 'repo1',
    repositoryName: 'Test Repository 1',
    status: true,
    lastSave: 1678901234,
    alert: 1,
    storageSize: 100,
    storageUsed: 50,
    sshPublicKey: 'ssh-rsa AAAAB3Nza...fakekey1',
    comment: 'Test repository 1',
    displayDetails: true,
    unixUser: 'user1',
    lanCommand: false,
    appendOnlyMode: false,
    lastStatusAlertSend: 1678901234,
  },
  {
    id: 2,
    alias: 'repo2',
    repositoryName: 'Test Repository 2',
    status: false,
    lastSave: 1678905678,
    storageSize: 200,
    storageUsed: 150,
    sshPublicKey: 'ssh-rsa AAAAB3Nza...fakekey2',
    comment: 'Test repository 2',
    displayDetails: false,
    unixUser: 'user2',
  },
];

describe('Repository GET by id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not handling', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 401 if API key is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue(undefined);
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have read permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({ read: false });
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 400 if slug is missing or malformed', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'GET', query: { slug: undefined } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should return 404 if repository is not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    const { req, res } = createMocks({ method: 'GET', query: { slug: '3' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  it('should return 200 and the repository data if found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue(mockRepoList);
    const { req, res } = createMocks({ method: 'GET', query: { slug: '1' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ repo: mockRepoList[0] });
  });
});

describe('Repository PATCH by id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not handling', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'POST' });
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
    vi.mocked(AuthService.tokenController).mockResolvedValue(undefined);
    const { req, res } = createMocks({
      method: 'PATCH',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have update permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({
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
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository test-repo has been edited',
    });
  });

  it('should successfully update repository with API key', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({
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
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository repo-key has been edited',
    });
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
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Repository test-repo has been edited',
    });
  });
});

describe('Repository DELETE by id', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not handling', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'POST' });
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
