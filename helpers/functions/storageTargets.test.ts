import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  getStorageTargets,
  getStorageTargetsWithNames,
  isValidStorageTarget,
} from './storageTargets';

describe('storageTargets', () => {
  const originalEnv = process.env.STORAGE_TARGETS;

  beforeEach(() => {
    delete process.env.STORAGE_TARGETS;
  });

  afterEach(() => {
    if (originalEnv === undefined) {
      delete process.env.STORAGE_TARGETS;
    } else {
      process.env.STORAGE_TARGETS = originalEnv;
    }
  });

  describe('getStorageTargets', () => {
    it('returns an empty array when STORAGE_TARGETS is not set', () => {
      expect(getStorageTargets()).toEqual([]);
    });

    it('returns an empty array when STORAGE_TARGETS is empty', () => {
      process.env.STORAGE_TARGETS = '';
      expect(getStorageTargets()).toEqual([]);
    });

    it('parses a comma-separated list and trims whitespace', () => {
      process.env.STORAGE_TARGETS = ' /mnt/hetzner , /mnt/nas ';
      expect(getStorageTargets()).toEqual(['/mnt/hetzner', '/mnt/nas']);
    });

    it('ignores empty entries', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner,,/mnt/nas,';
      expect(getStorageTargets()).toEqual(['/mnt/hetzner', '/mnt/nas']);
    });

    it('returns only the path part, dropping the |name label', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner|Hetzner Box, /mnt/nas | NAS ';
      expect(getStorageTargets()).toEqual(['/mnt/hetzner', '/mnt/nas']);
    });
  });

  describe('getStorageTargetsWithNames', () => {
    it('returns an empty array when STORAGE_TARGETS is not set', () => {
      expect(getStorageTargetsWithNames()).toEqual([]);
    });

    it('uses the label after | as name, trimmed', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner | Hetzner Box ';
      expect(getStorageTargetsWithNames()).toEqual([
        { path: '/mnt/hetzner', name: 'Hetzner Box' },
      ]);
    });

    it('falls back to the raw path when no name is provided', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner,/mnt/nas|NAS';
      expect(getStorageTargetsWithNames()).toEqual([
        { path: '/mnt/hetzner', name: '/mnt/hetzner' },
        { path: '/mnt/nas', name: 'NAS' },
      ]);
    });

    it('falls back to the raw path when the name is empty', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner|   ';
      expect(getStorageTargetsWithNames()).toEqual([
        { path: '/mnt/hetzner', name: '/mnt/hetzner' },
      ]);
    });
  });

  describe('isValidStorageTarget', () => {
    beforeEach(() => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner,/mnt/nas';
    });

    it('accepts a path present in the allowlist', () => {
      expect(isValidStorageTarget('/mnt/hetzner')).toBe(true);
    });

    it('accepts a path whose entry carries a |name label', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner|Hetzner Box';
      expect(isValidStorageTarget('/mnt/hetzner')).toBe(true);
    });

    it('rejects a path not in the allowlist', () => {
      expect(isValidStorageTarget('/mnt/evil')).toBe(false);
    });

    it('rejects the raw entry including the |name label', () => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner|Hetzner Box';
      expect(isValidStorageTarget('/mnt/hetzner|Hetzner Box')).toBe(false);
    });

    it('rejects a relative path', () => {
      expect(isValidStorageTarget('mnt/hetzner')).toBe(false);
    });

    it('rejects a path traversal attempt', () => {
      expect(isValidStorageTarget('/mnt/hetzner/../../etc')).toBe(false);
    });

    it('rejects a non-string value', () => {
      // @ts-expect-error testing invalid input
      expect(isValidStorageTarget(undefined)).toBe(false);
    });
  });
});
