import { describe, it, expect } from 'vitest';
import isSshPubKeyDuplicate from './isSshPubKeyDuplicate';
import { Optional, Repository } from '~/types';

describe('isSshPubKeyDuplicate', () => {
  it('should return true if the SSH public key is duplicated', () => {
    const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey user@hostname';
    const repoList: Array<Optional<Repository>> = [
      { sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey other@host' } as Repository,
    ];

    expect(isSshPubKeyDuplicate(pubKey, repoList)).toBe(true);
  });

  it('should return false if the SSH public key is not duplicated', () => {
    const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAdifferentkey user@hostname';
    const repoList: Array<Optional<Repository>> = [
      { sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey other@host' } as Repository,
    ];

    expect(isSshPubKeyDuplicate(pubKey, repoList)).toBe(false);
  });

  it('should throw an error if pubKey is missing', () => {
    const repoList: Array<Optional<Repository>> = [
      { sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey other@host' } as Repository,
    ];

    expect(() => isSshPubKeyDuplicate('', repoList)).toThrow(
      'Missing or invalid parameters for duplicate SSH public key check.'
    );
  });

  it('should throw an error if repoList is missing', () => {
    const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey user@hostname';

    expect(() => isSshPubKeyDuplicate(pubKey, null as any)).toThrow(
      'Missing or invalid parameters for duplicate SSH public key check.'
    );
  });

  it('should return false if repoList is empty', () => {
    const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey user@hostname';
    const repoList: Array<Optional<Repository>> = [];

    expect(isSshPubKeyDuplicate(pubKey, repoList)).toBe(false);
  });

  it('should handle repositories with undefined sshPublicKey', () => {
    const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey user@hostname';
    const repoList: Array<Optional<Repository>> = [
      // @ts-expect-error
      { sshPublicKey: undefined } as Repository,
      { sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey other@host' } as Repository,
    ];

    expect(isSshPubKeyDuplicate(pubKey, repoList)).toBe(true);
  });

  it('should handle repositories with null sshPublicKey', () => {
    const pubKey = 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEArandomkey user@hostname';
    const repoList: Array<Optional<Repository>> = [
      // @ts-expect-error
      { sshPublicKey: null } as Repository,
      { sshPublicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAABIwAAAQEAdifferentkey other@host' } as Repository,
    ];

    expect(isSshPubKeyDuplicate(pubKey, repoList)).toBe(false);
  });
});
