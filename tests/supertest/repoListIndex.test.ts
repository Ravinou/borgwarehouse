import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/repo';
import { getServerSession } from 'next-auth/next';
import { getRepoList, tokenController } from '~/helpers/functions';
import { Repository } from '~/types/domain/config.types';

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
  tokenController: jest.fn(),
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
    jest.clearAllMocks();
    jest.resetModules();
    jest.spyOn(console, 'log').mockImplementation(() => {});
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
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer INVALID_API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 403 if API key does not have read permissions', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    (tokenController as jest.Mock).mockResolvedValue({ read: false });
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer API_KEY' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
  });

  it('should return 200 and the repoList data if found', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({ user: { name: 'USER' } });
    (getRepoList as jest.Mock).mockResolvedValue(mockRepoList);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ repoList: mockRepoList });
  });
});
