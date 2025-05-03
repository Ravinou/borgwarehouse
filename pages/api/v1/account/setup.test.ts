import { createMocks } from 'node-mocks-http';
import handler from './setup';
import { AuthService, ConfigService } from '~/services';
import { BorgWarehouseUser, Repository } from '~/types';

vi.mock('~/services');

const bwUserMock: BorgWarehouseUser = {
  id: 0,
  username: 'testuser',
  password: 'hashedpassword',
  email: 'test@test.fr',
  roles: ['admin'],
};

const repoListMock: Repository[] = [
  {
    id: 1,
    alias: 'repo1',
    repositoryName: 'Repository 1',
    status: true,
    lastSave: 0,
    storageSize: 1000,
    storageUsed: 500,
    sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey1',
    comment: 'First repository',
  },
  {
    id: 2,
    alias: 'repo2',
    repositoryName: 'Repository 2',
    status: false,
    lastSave: 0,
    storageSize: 2000,
    storageUsed: 1500,
    sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey2',
    comment: 'Second repository',
  },
];

describe('API /api/v1/account/setup', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 404 if DISABLE_AUTO_SETUP is true', async () => {
    process.env.DISABLE_AUTO_SETUP = 'true';

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
    delete process.env.DISABLE_AUTO_SETUP;
  });

  it('should return 405 if method is not GET or POST', async () => {
    const { req, res } = createMocks({ method: 'PUT' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(405);
  });

  it('should return setup: false if users exist on GET', async () => {
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([bwUserMock]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({ setup: false });
    delete process.env.DISABLE_AUTO_SETUP;
  });

  it('should return forbidden if repos exist but no users on GET', async () => {
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue(repoListMock);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(403);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      status: 403,
      message:
        'The setup has already been completed, and some repositories are already configured. To reset, please delete the config/repo.json file or rebuild/restore the config/users.json file.',
    });
  });

  it('should return setup: true if no users or repos exist on GET', async () => {
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({ setup: true });
  });

  it('should return 422 if username is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { username: 'invalid username byebye', password: 'bigbigpassword' },
    });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(422);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      error: 'Only a-z characters are allowed (1 to 20 char.)',
    });
  });

  it('should return 422 if password is too short', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { username: 'validuser', password: 'short' },
    });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);

    await handler(req, res);

    expect(res._getStatusCode()).toBe(422);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      error: 'Password must be at least 12 characters long',
    });
  });

  it('should return 422 if email is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: { username: 'validuser', password: 'validpassword123', email: 'invalidemail' },
    });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    await handler(req, res);
    expect(res._getStatusCode()).toBe(422);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({
      error: 'Invalid email address',
    });
  });

  it('should return 404 if users or repos already exist on POST', async () => {
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([bwUserMock]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'POST',
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(404);
  });

  it('should complete setup successfully on valid POST', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        username: 'validuser',
        password: 'validpassword123',
        email: 'user@example.com',
      },
    });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    vi.mocked(AuthService.hashPassword).mockResolvedValue('hashedpassword');

    await handler(req, res);

    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      {
        id: 0,
        username: 'validuser',
        password: 'hashedpassword',
        email: 'user@example.com',
        roles: ['admin'],
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({ status: 200, message: 'Setup completed successfully' });
  });

  it('should complete setup successfully without email on valid POST', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      body: {
        username: 'validuser',
        password: 'validpassword123',
      },
    });
    vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
    vi.mocked(ConfigService.getRepoList).mockResolvedValue([]);
    vi.mocked(AuthService.hashPassword).mockResolvedValue('hashedpassword');

    await handler(req, res);

    expect(ConfigService.updateUsersList).toHaveBeenCalledWith([
      {
        id: 0,
        username: 'validuser',
        password: 'hashedpassword',
        roles: ['admin'],
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
    const responseData = JSON.parse(res._getData());
    expect(responseData).toEqual({ status: 200, message: 'Setup completed successfully' });
  });
});
