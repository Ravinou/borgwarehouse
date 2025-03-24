import handler from '~/pages/api/cronjob/getStorageUsed';
import { createMocks } from 'node-mocks-http';
import { getRepoList, updateRepoList } from '~/helpers/functions';
import { getStorageUsedShell } from '~/helpers/functions/shell.utils';

jest.mock('~/helpers/functions', () => ({
  getRepoList: jest.fn(),
  updateRepoList: jest.fn(),
}));

jest.mock('~/helpers/functions/shell.utils', () => ({
  getStorageUsedShell: jest.fn(),
}));

describe('GET /api/cronjob/getStorageUsed', () => {
  const CRONJOB_KEY = 'test-cronjob-key';
  process.env.CRONJOB_KEY = CRONJOB_KEY;

  it('should return unauthorized if no authorization header is provided', async () => {
    const { req, res } = createMocks({
      method: 'POST',
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return unauthorized if the authorization key is invalid', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: 'Bearer invalid-key',
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(401);
  });

  it('should return success if no repositories are found', async () => {
    (getRepoList as jest.Mock).mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRONJOB_KEY}`,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toContain('No repository to check');
  });

  it('should update repositories with storage used and return success', async () => {
    const mockRepoList = [
      { repositoryName: 'repo1', storageUsed: 0 },
      { repositoryName: 'repo2', storageUsed: 0 },
    ];
    const mockStorageUsed = [
      { name: 'repo1', size: 100 },
      { name: 'repo2', size: 200 },
    ];

    (getRepoList as jest.Mock).mockResolvedValue(mockRepoList);
    (getStorageUsedShell as jest.Mock).mockResolvedValue(mockStorageUsed);
    (updateRepoList as jest.Mock).mockResolvedValue(undefined);

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRONJOB_KEY}`,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toContain('Storage cron has been executed');
    expect(updateRepoList).toHaveBeenCalledWith([
      { repositoryName: 'repo1', storageUsed: 100 },
      { repositoryName: 'repo2', storageUsed: 200 },
    ]);
  });

  it('should return server error if an exception occurs', async () => {
    (getRepoList as jest.Mock).mockRejectedValue(new Error('Test error'));

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRONJOB_KEY}`,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
  });

  it('should not touch to a repository if it is not found in the storage used list', async () => {
    const mockRepoList = [
      { repositoryName: 'repo1', storageUsed: 0 },
      { repositoryName: 'repo2', storageUsed: 0 },
    ];
    const mockStorageUsed = [{ name: 'repo1', size: 100 }];

    (getRepoList as jest.Mock).mockResolvedValue(mockRepoList);
    (getStorageUsedShell as jest.Mock).mockResolvedValue(mockStorageUsed);
    (updateRepoList as jest.Mock).mockResolvedValue(undefined);

    const { req, res } = createMocks({
      method: 'POST',
      headers: {
        authorization: `Bearer ${CRONJOB_KEY}`,
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(updateRepoList).toHaveBeenCalledWith([
      { repositoryName: 'repo1', storageUsed: 100 },
      { repositoryName: 'repo2', storageUsed: 0 },
    ]);
  });
});
