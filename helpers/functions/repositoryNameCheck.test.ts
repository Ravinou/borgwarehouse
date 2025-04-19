import { describe, it, expect } from 'vitest';
import repositoryNameCheck from './repositoryNameCheck';

describe('repositoryNameCheck', () => {
  it('should return true for a valid 8-character hexadecimal string', () => {
    expect(repositoryNameCheck('a1b2c3d4')).toBe(true);
  });

  it('should return false for a string shorter than 8 characters', () => {
    expect(repositoryNameCheck('a1b2c3')).toBe(false);
  });

  it('should return false for a string longer than 8 characters', () => {
    expect(repositoryNameCheck('a1b2c3d4e5')).toBe(false);
  });

  it('should return false for a string with non-hexadecimal characters', () => {
    expect(repositoryNameCheck('a1b2c3g4')).toBe(false);
  });

  it('should return false for an empty string', () => {
    expect(repositoryNameCheck('')).toBe(false);
  });

  it('should return false for a string with special characters', () => {
    expect(repositoryNameCheck('a1b2c3d@')).toBe(false);
  });

  it('should return false for a string with uppercase hexadecimal characters', () => {
    expect(repositoryNameCheck('A1B2C3D4')).toBe(false);
  });

  it('should return false for a string with spaces', () => {
    expect(repositoryNameCheck('a1b2 c3d4')).toBe(false);
  });

  it('should return false for a non string name', () => {
    expect(repositoryNameCheck(12345678)).toBe(false);
  });

  it('should return false for null', () => {
    expect(repositoryNameCheck(null)).toBe(false);
  });

  it('should return false for undefined', () => {
    expect(repositoryNameCheck(undefined)).toBe(false);
  });

  it('should return false for boolean', () => {
    expect(repositoryNameCheck(true)).toBe(false);
  });
});
