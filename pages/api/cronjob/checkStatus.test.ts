import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/cronjob/checkStatus';
import { getRepoList, getUsersList, updateRepoList, ShellService } from '~/services';
import nodemailerSMTP from '~/helpers/functions/nodemailerSMTP';
import { AppriseModeEnum } from '~/types/domain/config.types';

vi.mock('~/services', () => ({
  getRepoList: vi.fn(),
  getUsersList: vi.fn(),
  updateRepoList: vi.fn(),
  ShellService: {
    getLastSaveList: vi.fn(),
  },
}));

vi.mock('~/helpers/functions/nodemailerSMTP', () => ({
  default: vi.fn(() => ({
    sendMail: vi.fn().mockResolvedValue({ messageId: 'fake-message-id' }),
  })),
}));

vi.mock('~/helpers/templates/emailAlertStatus', () => ({
  default: vi.fn(() => ({
    subject: 'Alert',
    text: 'Alert text',
  })),
}));

vi.mock('node:child_process', () => ({
  exec: vi.fn(
    (
      command: string,
      callback: (err: Error | null, result: { stdout: string; stderr: string }) => void
    ) => {
      callback(null, { stdout: 'mocked output', stderr: '' });
    }
  ),
}));

describe('Cronjob API Handler', () => {
  beforeEach(() => {
    process.env.CRONJOB_KEY = 'test-key';
    vi.clearAllMocks();
    vi.resetModules();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should return 401 if no authorization header', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 401 if method is not POST', async () => {
    const { req, res } = createMocks({
      method: 'GET',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 401 if wrong authorization key', async () => {
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer wrong-key' },
    });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
  });

  it('should return 200 with message if no repository to check (empty repoList)', async () => {
    vi.mocked(getRepoList).mockResolvedValue([]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: 123 },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Status cron executed. No repository to check.',
    });
  });

  it('should return 200 with message if no repository to check (empty lastSaveList)', async () => {
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alert: 100,
        alias: 'Repo1',
        id: 1,
        status: true,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Status cron executed. No repository to check.',
    });
  });

  it('should execute successfully without alerts if all repositories are OK', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alert: 1000,
        alias: 'Repo1',
        status: true,
        id: 1,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime },
    ]);
    vi.mocked(updateRepoList).mockResolvedValue(undefined);
    vi.mocked(getUsersList).mockResolvedValue([]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      status: 200,
      message: 'Status cron executed successfully.',
    });
    expect(updateRepoList).toHaveBeenCalled();
  });

  it('should return 500 if an error occurs', async () => {
    vi.mocked(getRepoList).mockRejectedValue(new Error('Test error'));

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({
      status: 500,
      message: 'API error, contact the administrator.',
    });
  });

  it('should not send email alert if emailAlert is false', async () => {
    const currentTime = Math.floor(Date.now() / 1000);

    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alert: 100,
        alias: 'Repo1',
        id: 1,
        status: true,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    // User has disabled email alert but enabled Apprise alert
    vi.mocked(getUsersList).mockResolvedValue([
      {
        id: 1,
        password: 'hashed-password',
        roles: ['user'],
        emailAlert: false,
        appriseAlert: true,
        appriseServices: ['http://example.com'],
        appriseMode: AppriseModeEnum.PACKAGE,
        appriseStatelessURL: 'http://example.com',
        email: 'test@example.com',
        username: 'testuser',
      },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(nodemailerSMTP).not.toHaveBeenCalled();
  });

  it('should not send apprise alert if appriseAlert is false', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alert: 100,
        alias: 'Repo1',
        id: 1,
        status: true,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    // User has disabled Apprise alert but enabled email alert
    vi.mocked(getUsersList).mockResolvedValue([
      {
        id: 1,
        password: 'hashed-password',
        roles: ['user'],
        emailAlert: true,
        appriseAlert: false,
        appriseServices: ['http://example.com'],
        appriseMode: AppriseModeEnum.PACKAGE,
        appriseStatelessURL: 'http://example.com',
        email: 'test@example.com',
        username: 'testuser',
      },
    ]);

    // Spy on exec to check if it is called
    const execSpy = vi.spyOn(require('node:child_process'), 'exec');
    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(execSpy).not.toHaveBeenCalled();
    execSpy.mockRestore();
  });

  it('should not send alert if alert is disabled on repo (repo.alert === 0)', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alert: 0,
        alias: 'Repo1',
        id: 1,
        status: false,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 1000 },
    ]);
    vi.mocked(getUsersList).mockResolvedValue([
      {
        id: 1,
        password: 'hashed-password',
        roles: ['user'],
        emailAlert: true,
        appriseAlert: true,
        appriseServices: ['http://example.com'],
        appriseMode: AppriseModeEnum.PACKAGE,
        appriseStatelessURL: 'http://example.com',
        email: 'test@example.com',
        username: 'testuser',
      },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(nodemailerSMTP).not.toHaveBeenCalled();

    const childProcess = await import('node:child_process');
    expect(childProcess.exec).not.toHaveBeenCalled();
  });

  it('should not update lastStatusAlertSend or add to repoListToSendAlert if repo status is OK', async () => {
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        status: true,
        alert: 100,
        id: 1,
        alias: 'Repo1',
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
        lastStatusAlertSend: 1000,
      },
    ]);
    vi.mocked(updateRepoList).mockResolvedValue(undefined);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: Math.floor(Date.now() / 1000) },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });

    await handler(req, res);

    expect(updateRepoList).toHaveBeenCalledWith([
      {
        repositoryName: 'repo1',
        status: true,
        alert: 100,
        id: 1,
        alias: 'Repo1',
        lastSave: expect.any(Number),
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
        lastStatusAlertSend: 1000,
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });

  it('should update lastStatusAlertSend if repo is down and alert is enabled', async () => {
    const currentTime = 1741535661;
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 100,
        id: 1,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    vi.mocked(getUsersList).mockResolvedValue([
      {
        id: 1,
        password: 'hashed-password',
        roles: ['user'],
        emailAlert: true,
        email: 'test@example.com',
        username: 'TestUser',
      },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });

    await handler(req, res);

    expect(updateRepoList).toHaveBeenCalledWith([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 100,
        id: 1,
        lastSave: currentTime - 200,
        lastStatusAlertSend: expect.any(Number),
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });

  it('should not update lastStatusAlertSend or send alerts if alert is disabled', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 0,
        lastStatusAlertSend: undefined,
        id: 1,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });

    await handler(req, res);

    expect(updateRepoList).toHaveBeenCalledWith([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 0,
        lastStatusAlertSend: undefined,
        id: 1,
        lastSave: currentTime - 200,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    expect(nodemailerSMTP).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should update lastStatusAlertSend only if the last alert was sent more than 90000 seconds ago', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    vi.mocked(getRepoList).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 100,
        lastStatusAlertSend: currentTime - 80000,
        id: 1,
        lastSave: 0,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    vi.mocked(ShellService.getLastSaveList).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    vi.mocked(getUsersList).mockResolvedValue([
      {
        id: 1,
        password: 'hashed-password',
        roles: ['user'],
        emailAlert: true,
        email: 'test@example.com',
        username: 'TestUser',
      },
    ]);

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });

    await handler(req, res);

    expect(updateRepoList).toHaveBeenCalledWith([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 100,
        lastStatusAlertSend: expect.any(Number),
        id: 1,
        lastSave: currentTime - 200,
        storageSize: 0,
        storageUsed: 0,
        sshPublicKey: '',
        comment: '',
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });
});
