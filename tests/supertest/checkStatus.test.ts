import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/cronjob/checkStatus';
import { getRepoList, getUsersList, updateRepoList } from '~/helpers/functions/fileHelpers';
import { getLastSaveListShell } from '~/helpers/functions/shell.utils';
import nodemailerSMTP from '~/helpers/functions/nodemailerSMTP';

jest.mock('~/helpers/functions/fileHelpers', () => ({
  getRepoList: jest.fn(),
  getUsersList: jest.fn(),
  updateRepoList: jest.fn(),
}));

jest.mock('~/helpers/functions/shell.utils', () => ({
  getLastSaveListShell: jest.fn(),
}));

jest.mock('~/helpers/functions/nodemailerSMTP', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'fake-message-id' }),
  })),
}));

jest.mock('~/helpers/templates/emailAlertStatus', () =>
  jest.fn(() => ({
    subject: 'Alert',
    text: 'Alert text',
  }))
);

jest.mock('node:child_process', () => ({
  exec: jest.fn(
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
    jest.clearAllMocks();
    jest.resetModules();
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
    (getRepoList as jest.Mock).mockResolvedValue([]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
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
    (getRepoList as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', alert: 100, alias: 'Repo1' },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([]);

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
    (getRepoList as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', alert: 1000, alias: 'Repo1', status: true },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime },
    ]);
    (updateRepoList as jest.Mock).mockResolvedValue(undefined);
    (getUsersList as jest.Mock).mockResolvedValue([]);

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
    (getRepoList as jest.Mock).mockRejectedValue(new Error('Test error'));

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

    (getRepoList as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', alert: 100, alias: 'Repo1' },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    // User has disabled email alert but enabled Apprise alert
    (getUsersList as jest.Mock).mockResolvedValue([
      {
        emailAlert: false,
        appriseAlert: true,
        appriseServices: ['http://example.com'],
        appriseMode: 'package',
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
    (getRepoList as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', alert: 100, alias: 'Repo1' },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    // User has disabled Apprise alert but enabled email alert
    (getUsersList as jest.Mock).mockResolvedValue([
      {
        emailAlert: true,
        appriseAlert: false,
        appriseServices: ['http://example.com'],
        appriseMode: 'package',
        appriseStatelessURL: 'http://example.com',
        email: 'test@example.com',
        username: 'testuser',
      },
    ]);

    // Spy on exec to check if it is called
    const execSpy = jest.spyOn(require('node:child_process'), 'exec');
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
    (getRepoList as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', alert: 0, alias: 'Repo1' },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 1000 },
    ]);
    (getUsersList as jest.Mock).mockResolvedValue([
      {
        emailAlert: true,
        appriseAlert: true,
        appriseServices: ['http://example.com'],
        appriseMode: 'package',
        appriseStatelessURL: 'http://example.com',
        email: 'test@example.com',
        username: 'testuser',
      },
    ]);

    // Spy on exec to check if it is called
    const nodemailerSpy = jest.spyOn(require('~/helpers/functions/nodemailerSMTP'), 'default');
    const execSpy = jest.spyOn(require('node:child_process'), 'exec');

    const { req, res } = createMocks({
      method: 'POST',
      headers: { authorization: 'Bearer test-key' },
    });
    await handler(req, res);

    expect(nodemailerSpy).not.toHaveBeenCalled();
    expect(execSpy).not.toHaveBeenCalled();

    nodemailerSpy.mockRestore();
    execSpy.mockRestore();
  });

  it('should not update lastStatusAlertSend or add to repoListToSendAlert if repo status is OK', async () => {
    (getRepoList as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', status: true, alert: 100 },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
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
        lastSave: expect.any(Number),
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });

  it('should update lastStatusAlertSend if repo is down and alert is enabled', async () => {
    const currentTime = 1741535661;
    (getRepoList as jest.Mock).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 100,
      },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    (getUsersList as jest.Mock).mockResolvedValue([
      { emailAlert: true, email: 'test@example.com', username: 'TestUser' },
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
        lastSave: expect.any(Number),
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });

  it('should not update lastStatusAlertSend or send alerts if alert is disabled', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    (getRepoList as jest.Mock).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 0,
        lastStatusAlertSend: null,
      },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
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
        lastStatusAlertSend: null,
        lastSave: currentTime - 200,
      },
    ]);
    expect(nodemailerSMTP).not.toHaveBeenCalled();
    expect(res._getStatusCode()).toBe(200);
  });

  it('should update lastStatusAlertSend only if the last alert was sent more than 90000 seconds ago', async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    (getRepoList as jest.Mock).mockResolvedValue([
      {
        repositoryName: 'repo1',
        alias: 'Repo1',
        status: false,
        alert: 100,
        lastStatusAlertSend: currentTime - 80000,
      },
    ]);
    (getLastSaveListShell as jest.Mock).mockResolvedValue([
      { repositoryName: 'repo1', lastSave: currentTime - 200 },
    ]);
    (getUsersList as jest.Mock).mockResolvedValue([
      { emailAlert: true, email: 'test@example.com', username: 'TestUser' },
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
        lastSave: currentTime - 200,
      },
    ]);
    expect(res._getStatusCode()).toBe(200);
  });
});
