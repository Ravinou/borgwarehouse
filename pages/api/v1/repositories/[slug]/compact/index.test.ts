import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/v1/repositories/[slug]/compact';
import { getServerSession } from 'next-auth/next';
import { ConfigService, AuthService, ShellService } from '~/services';



vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));
vi.mock('~/services');


const mockRepoList = [
  { repositoryName: 'abcdef12', appendOnlyMode: false },
  { repositoryName: '12345678', appendOnlyMode: true },
];

describe('/api/v1/repositories/[slug] handler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([...mockRepoList]);
    vi.mocked(ConfigService.updateRepoList).mockResolvedValue(undefined);
    vi.mocked(ShellService.getStorageUsed).mockResolvedValue([]);
    vi.mocked(ShellService.compactRepo).mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.resetModules();
  });

  it('should return 401 if no session or authorization header is provided', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'abcdef12' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 400 for invalid slug', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    const { req, res } = createMocks({ method: 'POST', query: { slug: 'nothex' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toContain('valid repository name');
  });

  it('should return 404 if repository is not found', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    const { req, res } = createMocks({ method: 'POST', query: { slug: '45678912' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(404);
    expect(res._getData()).toContain('No repository with name');
  });

  it('should return 403 if repo is append-only and env disables compacting', async () => {
    process.env.DISABLE_COMPACT_APPEND_ONLY = 'true';
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    const { req, res } = createMocks({ method: 'POST', query: { slug: '12345678' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
    expect(res._getData()).toContain('does not allow compacting');
  });

  it('should return 400 if await is not a boolean', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    const { req, res } = createMocks({
      method: 'POST',
      query: { slug: 'abcdef12' },
      body: { await: 'yes' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toContain('await must be a boolean');
  });

  it('should start compaction if await is false', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    const { req, res } = createMocks({
      method: 'POST',
      query: { slug: 'abcdef12' },
      body: { await: false },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toContain('has started compaction');
    expect(ShellService.compactRepo).toHaveBeenCalledWith('abcdef12');
  });

  it('should await compaction if await is true', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    const { req, res } = createMocks({
      method: 'POST',
      query: { slug: 'abcdef12' },
      body: { await: true },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toContain('has been compacted');
    expect(ShellService.compactRepo).toHaveBeenCalledWith('abcdef12');
    expect(ConfigService.updateRepoList).toHaveBeenCalled();
  });

  it('should return 403 if API token is valid but lacks permission', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue({ update: false });
    const { req, res } = createMocks({
      method: 'POST',
      query: { slug: 'abcdef12' },
      headers: { authorization: 'Bearer something' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(403);
    expect(res._getData()).toContain('Insufficient permissions');
  });

  it('should return 401 if API token is invalid', async () => {
    vi.mocked(getServerSession).mockResolvedValue(null);
    vi.mocked(AuthService.tokenController).mockResolvedValue(null);
    const { req, res } = createMocks({
      method: 'POST',
      query: { slug: 'abcdef12' },
      headers: { authorization: 'Bearer invalid' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getData()).toContain('Invalid API key');
  });

  it('should return 405 if method is not POST', async () => {
    vi.mocked(getServerSession).mockResolvedValue({ user: {} });
    const { req, res } = createMocks({ method: 'GET', query: { slug: 'abcdef12' } });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });
});
