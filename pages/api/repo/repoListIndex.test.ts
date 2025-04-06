import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo';
import { getServerSession } from 'next-auth/next';
import { tokenController } from '~/helpers/functions';
import { getRepoList } from '~/services';
import { Repository } from '~/types/domain/config.types';

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

vi.mock('~/helpers/functions', () => ({
  tokenController: vi.fn(),
}));

vi.mock('~/services', () => ({
  getRepoList: vi.fn(),
}));

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
    vi.mocked(tokenController).mockResolvedValue(null);
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

  it('should return 200 and the repoList data if found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: { name: 'USER' } });
    vi.mocked(getRepoList).mockResolvedValue(mockRepoList);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ repoList: mockRepoList });
  });
});
