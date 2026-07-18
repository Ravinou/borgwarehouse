import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/repositories/[slug]/break-lock';
import { getSession } from '~/helpers/getServerSession';
import { ConfigService, AuthService, ShellService } from '~/services';
import { Repository } from '~/types/domain/config.types';

vi.mock('~/helpers/getServerSession', () => ({
  getSession: vi.fn(),
}));
vi.mock('~/services');

const mockRepoList: Repository[] = [
  {
    id: 1,
    alias: 'repo1',
    repositoryName: 'abcd1234',
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
];

describe('Repository break-lock', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not POST', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'GET', query: { slug: 'abcd1234' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'abcd1234' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 400 if slug is not a valid repository name', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { name: 'USER' } });
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'invalid' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
  });

  it('should return 403 if API key lacks update permission', async () => {
    vi.mocked(getSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({
      create: false,
      read: true,
      update: false,
      delete: false,
    });
    const { req, res } = createMocks({
      method: 'POST',
      query: { slug: 'abcd1234' },
      headers: { authorization: 'Bearer token' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 404 if repository does not exist', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue(mockRepoList);
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'ffffffff' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
  });

  it('should return 200 and release the lock', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue(mockRepoList);
    vi.mocked(ShellService.breakLockRepo).mockResolvedValue({ stdout: 'ok', stderr: '' });
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'abcd1234' } });
    await handler(req, res);
    expect(ShellService.breakLockRepo).toHaveBeenCalledWith('abcd1234');
    expect(res._getStatusCode()).toBe(200);
  });

  it('should return 500 if the shell fails', async () => {
    vi.mocked(getSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue(mockRepoList);
    vi.mocked(ShellService.breakLockRepo).mockRejectedValue(new Error('borg failed'));
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'abcd1234' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(500);
  });
});
