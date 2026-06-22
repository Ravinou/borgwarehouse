import { describe, it, expect } from 'vitest';
import {
  isValidUsername,
  USERNAME_REGEX,
  USERNAME_MIN_LENGTH,
  USERNAME_MAX_LENGTH,
} from './usernamePolicy';

describe('usernamePolicy', () => {
  describe('isValidUsername', () => {
    it('accepts legacy lowercase usernames (backward compatibility)', () => {
      expect(isValidUsername('ada')).toBe(true);
      expect(isValidUsername('lovelace')).toBe(true);
    });

    it('accepts uppercase and mixed case', () => {
      expect(isValidUsername('Ada')).toBe(true);
      expect(isValidUsername('AdaLovelace')).toBe(true);
    });

    it('accepts digits', () => {
      expect(isValidUsername('user123')).toBe(true);
      expect(isValidUsername('007')).toBe(true);
    });

    it('accepts dots, underscores and hyphens', () => {
      expect(isValidUsername('ada.lovelace')).toBe(true);
      expect(isValidUsername('ada_lovelace')).toBe(true);
      expect(isValidUsername('ada-lovelace')).toBe(true);
      expect(isValidUsername('a.b_c-d.1')).toBe(true);
    });

    it('accepts a single character (min length)', () => {
      expect(isValidUsername('a')).toBe(true);
      expect(USERNAME_MIN_LENGTH).toBe(1);
    });

    it('accepts the maximum allowed length', () => {
      expect(isValidUsername('a'.repeat(USERNAME_MAX_LENGTH))).toBe(true);
    });

    it('rejects an empty string', () => {
      expect(isValidUsername('')).toBe(false);
    });

    it('rejects usernames longer than the maximum length', () => {
      expect(isValidUsername('a'.repeat(USERNAME_MAX_LENGTH + 1))).toBe(false);
    });

    it('rejects spaces', () => {
      expect(isValidUsername('ada lovelace')).toBe(false);
      expect(isValidUsername(' ada')).toBe(false);
      expect(isValidUsername('ada ')).toBe(false);
    });

    it('rejects characters outside the allowed set', () => {
      expect(isValidUsername('ada@lovelace')).toBe(false);
      expect(isValidUsername('ada/lovelace')).toBe(false);
      expect(isValidUsername('ada\\lovelace')).toBe(false);
      expect(isValidUsername('ada$')).toBe(false);
      expect(isValidUsername('../etc')).toBe(false);
      expect(isValidUsername('admin;rm')).toBe(false);
      expect(isValidUsername('emoji😀')).toBe(false);
      expect(isValidUsername('accént')).toBe(false);
    });

    it('rejects newlines and tabs (no multiline bypass)', () => {
      expect(isValidUsername('ada\nlovelace')).toBe(false);
      expect(isValidUsername('ada\tlovelace')).toBe(false);
      expect(isValidUsername('ada\n')).toBe(false);
    });
  });

  describe('USERNAME_REGEX', () => {
    it('is anchored at both ends', () => {
      expect(USERNAME_REGEX.source.startsWith('^')).toBe(true);
      expect(USERNAME_REGEX.source.endsWith('$')).toBe(true);
    });

    it('has no global flag (stateless across calls)', () => {
      expect(USERNAME_REGEX.flags).not.toContain('g');
      expect(USERNAME_REGEX.test('ada')).toBe(true);
      expect(USERNAME_REGEX.test('ada')).toBe(true);
    });
  });
});
