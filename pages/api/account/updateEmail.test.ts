import { describe, it, expect, vi } from 'vitest';
import handler from './updateEmail';
import { getUsersList, updateUsersList } from '~/services';
import { getServerSession } from 'next-auth/next';
import { NextApiRequest, NextApiResponse } from 'next';

vi.mock('~/services', () => ({
  getUsersList: vi.fn(),
  updateUsersList: vi.fn(),
}));

vi.mock('next-auth/next', () => ({
  getServerSession: vi.fn(),
}));

describe('updateEmail API handler', () => {
  const mockReq = {
    method: 'PUT',
    body: { email: 'newemail@example.com' },
  } as unknown as NextApiRequest;

  const mockRes = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
  } as unknown as NextApiResponse;

  it('should return 405 if method is not PUT', async () => {
    mockReq.method = 'GET';
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(405);
  });

  it('should return 401 if session is not found', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce(null);
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(401);
  });

  it('should return 422 if email is not provided', async () => {
    mockReq.body = {};
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'testuser' } });
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(422);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Unexpected data' });
  });

  it('should return 400 if user is not found in users list', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'testuser' } });
    vi.mocked(getUsersList).mockResolvedValueOnce([]);
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({
      message: 'User is incorrect. Please, logout to update your session.',
    });
  });

  it('should return 400 if email already exists', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'testuser' } });
    vi.mocked(getUsersList).mockResolvedValueOnce([
      {
        username: 'testuser',
        email: 'oldemail@example.com',
        id: 1,
        password: 'hashedpassword',
        roles: ['user'],
      },
      {
        username: 'otheruser',
        email: 'newemail@example.com',
        id: 2,
        password: 'hashedpassword',
        roles: ['user'],
      },
    ]);
    await handler(mockReq, mockRes);
    expect(mockRes.status).toHaveBeenCalledWith(400);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Email already exists' });
  });

  it('should update email and return 200 on success', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'testuser' } });
    vi.mocked(getUsersList).mockResolvedValueOnce([
      {
        username: 'testuser',
        email: 'oldemail@example.com',
        id: 1,
        password: 'hashedpassword',
        roles: ['user'],
      },
      {
        username: 'otheruser',
        email: 'otheremail@example.com',
        id: 2,
        password: 'hashedpassword',
        roles: ['user'],
      },
    ]);
    vi.mocked(updateUsersList).mockResolvedValueOnce(undefined);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(200);
    expect(mockRes.json).toHaveBeenCalledWith({ message: 'Successful API send' });
    expect(updateUsersList).toHaveBeenCalledWith([
      { username: 'testuser', email: 'newemail@example.com' },
      { username: 'otheruser', email: 'otheremail@example.com' },
    ]);
  });

  it('should return 500 if an unexpected error occurs', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'testuser' } });
    vi.mocked(getUsersList).mockRejectedValueOnce(new Error('Unexpected error'));

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 500,
      message: 'API error, contact the administrator',
    });
  });

  it('should return 500 with specific message if ENOENT error occurs', async () => {
    vi.mocked(getServerSession).mockResolvedValueOnce({ user: { name: 'testuser' } });
    const enoentError = new Error('No such file or directory');
    (enoentError as any).code = 'ENOENT';
    vi.mocked(getUsersList).mockRejectedValueOnce(enoentError);

    await handler(mockReq, mockRes);

    expect(mockRes.status).toHaveBeenCalledWith(500);
    expect(mockRes.json).toHaveBeenCalledWith({
      status: 500,
      message: 'No such file or directory',
    });
  });
});
