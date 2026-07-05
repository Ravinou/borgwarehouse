import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getStorageTargets, isValidStorageTarget } from './storageTargets';

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
  });

  describe('isValidStorageTarget', () => {
    beforeEach(() => {
      process.env.STORAGE_TARGETS = '/mnt/hetzner,/mnt/nas';
    });

    it('accepts a path present in the allowlist', () => {
      expect(isValidStorageTarget('/mnt/hetzner')).toBe(true);
    });

    it('rejects a path not in the allowlist', () => {
      expect(isValidStorageTarget('/mnt/evil')).toBe(false);
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
