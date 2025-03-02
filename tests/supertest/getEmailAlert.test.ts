import { createMocks } from 'node-mocks-http';
import handler from '~/pages/api/account/getEmailAlert';
import { getServerSession } from 'next-auth/next';
import { promises as fs } from 'fs';
import path from 'path';

jest.mock('next-auth/next');
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
  },
}));

describe('Get Email Alert API', () => {
  it('should return 405 if the method is not GET', async () => {
    const { req, res } = createMocks({ method: 'POST' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(405);
  });

  it('should return 401 if the user is not authenticated', async () => {
    (getServerSession as jest.Mock).mockResolvedValue(null);
    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);
    expect(res._getStatusCode()).toBe(401);
    expect(res._getJSONData()).toEqual({ message: 'You must be logged in.' });
  });

  it('should return 400 if the user does not exist', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'nonexistent' },
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify([{ username: 'testuser', emailAlert: true }])
    );

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toEqual({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return emailAlert if the user exists', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    (fs.readFile as jest.Mock).mockResolvedValue(
      JSON.stringify([{ username: 'testuser', emailAlert: true }])
    );

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({
      emailAlert: true,
    });
  });

  it('should return 500 if there is an error reading the file', async () => {
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { name: 'testuser' },
    });

    (fs.readFile as jest.Mock).mockRejectedValue({ code: 'ENOENT' });

    const { req, res } = createMocks({ method: 'GET' });
    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getJSONData()).toEqual({ status: 500, message: 'No such file or directory' });
  });
});
