import { describe, it, expect, vi } from 'vitest';
import { AuthService } from './auth.service';
import { ConfigService } from '~/services';

vi.mock('bcryptjs', () => ({
  hash: vi.fn().mockResolvedValue('hashedPassword'),
  compare: vi.fn().mockResolvedValue(true),
}));

vi.mock('~/services', () => ({
  ConfigService: {
    getUsersList: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('hashPassword', () => {
    it('should hash the password correctly', async () => {
      const password = 'testPassword';
      const hashedPassword = await AuthService.hashPassword(password);
      expect(hashedPassword).toBe('hashedPassword');
    });
  });

  describe('verifyPassword', () => {
    it('should verify the password correctly', async () => {
      const password = 'testPassword';
      const hashedPassword = 'hashedPassword';
      const isValid = await AuthService.verifyPassword(password, hashedPassword);
      expect(isValid).toBe(true);
    });
  });

  describe('tokenController', () => {
    it('should return undefined if DISABLE_INTEGRATIONS is true', async () => {
      process.env.DISABLE_INTEGRATIONS = 'true';
      const headers = { authorization: 'Bearer testToken' } as any;
      const result = await AuthService.tokenController(headers);
      expect(result).toBeUndefined();
    });

    it('should return undefined if no matching user is found', async () => {
      process.env.DISABLE_INTEGRATIONS = 'false';
      vi.mocked(ConfigService.getUsersList).mockResolvedValue([]);
      const headers = { authorization: 'Bearer testToken' } as any;
      const result = await AuthService.tokenController(headers);
      expect(result).toBeUndefined();
    });

    it('should return permissions if a matching token is found', async () => {
      process.env.DISABLE_INTEGRATIONS = 'false';
      const mockPermissions = { read: true, create: false, update: true, delete: true };
      vi.mocked(ConfigService.getUsersList).mockResolvedValue([
        {
          id: 1,
          username: 'testUser',
          password: 'hashedPassword',
          email: 'testUser@example.com',
          roles: ['user'],
          tokens: [
            {
              token: 'testToken',
              name: 'testTokenName',
              creation: 0,
              permissions: mockPermissions,
            },
          ],
        },
      ]);
      const headers = { authorization: 'Bearer testToken' } as any;
      const result = await AuthService.tokenController(headers);
      expect(result).toEqual(mockPermissions);
    });

    it('should log and return undefined if no token matches', async () => {
      process.env.DISABLE_INTEGRATIONS = 'false';
      vi.mocked(ConfigService.getUsersList).mockResolvedValue([
        {
          id: 1,
          username: 'testUser',
          password: 'hashedPassword',
          email: 'testUser@example.com',
          roles: ['user'],
          tokens: [
            {
              token: 'differentToken',
              name: 'testTokenName',
              permissions: { read: true, create: false, update: true, delete: true },
              creation: 0,
            },
          ],
        },
      ]);
      const headers = { authorization: 'Bearer testToken' } as any;
      const result = await AuthService.tokenController(headers);
      expect(result).toBeUndefined();
    });

    it('should throw an error if an exception occurs', async () => {
      process.env.DISABLE_INTEGRATIONS = 'false';
      vi.mocked(ConfigService.getUsersList).mockRejectedValue(new Error('Test error'));
      const headers = { authorization: 'Bearer testToken' } as any;
      await expect(AuthService.tokenController(headers)).rejects.toThrow(
        'Error with tokenController'
      );
    });
  });
});
