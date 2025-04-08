import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo/id/[slug]';
import { getServerSession } from 'next-auth/next';
import { tokenController } from '~/helpers/functions';
import { ConfigService } from '~/services';
import { Repository } from '~/types/domain/config.types';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('~/helpers/functions', () => ({
  tokenController: vi.fn(),
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

describe('GET /api/repo/id/[slug]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 405 if method is not GET', async () => {
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
    vi.mocked(tokenController).mockResolvedValue(undefined);
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have read permissions', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(tokenController).mockResolvedValue({ read: false });
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
